"""
Wavelet Transform + ML Strategy
Decomposes time series into frequency components and predicts each separately
"""
import numpy as np
import pandas as pd
from fastapi import HTTPException
from typing import List
import pywt
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from .base import BaseStrategy, StrategyResponse
from .utils import get_historical_data, convert_to_serializable


class WaveletMLStrategy(BaseStrategy):
    """
    Wavelet Decomposition + Machine Learning
    - Decomposes price signal into different frequency components (trends, cycles, noise)
    - Applies ML prediction to each component
    - Reconstructs signal for final forecast
    """
    
    def decompose_wavelet(self, signal, wavelet='db4', level=3):
        """
        Decompose signal using discrete wavelet transform
        """
        coeffs = pywt.wavedec(signal, wavelet, level=level)
        return coeffs
    
    def reconstruct_wavelet(self, coeffs, wavelet='db4'):
        """
        Reconstruct signal from wavelet coefficients
        """
        return pywt.waverec(coeffs, wavelet)
    
    def create_features(self, data, lookback=10):
        """
        Create features for ML model (lagged values)
        """
        X, y = [], []
        for i in range(lookback, len(data)):
            X.append(data[i-lookback:i])
            y.append(data[i])
        return np.array(X), np.array(y)
    
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="Wavelet+ML requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            # 1. Fetch Data
            df = get_historical_data(ticker, period="2y")
            
            if len(df) < 200:
                raise ValueError("Not enough data for Wavelet analysis (need 200+ days)")
            
            close_prices = df['Close'].values
            
            # 2. Wavelet Decomposition
            wavelet_type = 'db4'  # Daubechies 4
            decomposition_level = 3
            
            coeffs = self.decompose_wavelet(close_prices, wavelet_type, decomposition_level)
            
            # 3. Train ML model on each component
            predictions = []
            component_names = ['Approximation (Trend)'] + [f'Detail {i+1} (High Freq)' for i in range(decomposition_level)]
            component_forecasts = []
            
            for idx, coeff in enumerate(coeffs):
                if len(coeff) < 20:
                    # Component too small, use last value as prediction
                    forecast = coeff[-1] if len(coeff) > 0 else 0
                else:
                    # Create features and train
                    lookback = min(10, len(coeff) // 4)
                    X, y = self.create_features(coeff, lookback)
                    
                    if len(X) < 10:
                        forecast = coeff[-1]
                    else:
                        # Train Random Forest on this component
                        model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
                        
                        # Split train/test
                        split = int(len(X) * 0.8)
                        X_train, X_test = X[:split], X[split:]
                        y_train, y_test = y[:split], y[split:]
                        
                        model.fit(X_train, y_train)
                        
                        # Predict next value
                        last_sequence = coeff[-lookback:].reshape(1, -1)
                        forecast = model.predict(last_sequence)[0]
                
                predictions.append(forecast)
                component_forecasts.append({
                    "name": component_names[idx],
                    "current": float(coeff[-1]) if len(coeff) > 0 else 0,
                    "forecast": float(forecast),
                    "size": len(coeff)
                })
            
            # 4. Reconstruct forecast
            # Instead of appending and reconstructing, we'll use the predictions more directly
            # Reconstruct current signal first
            reconstructed_current = self.reconstruct_wavelet(coeffs, wavelet_type)
            
            # Calculate the trend forecast from approximation component
            trend_forecast = predictions[0] if len(predictions) > 0 else coeffs[0][-1]
            
            # Simple forecast: current price + trend change
            current_price = float(close_prices[-1])
            
            # If we have a valid approximation forecast
            if len(coeffs[0]) > 0:
                approx_change = predictions[0] - coeffs[0][-1]
                forecast_price = current_price + approx_change
            else:
                forecast_price = current_price
            
            # 5. Generate signal
            price_change = (forecast_price - current_price) / current_price * 100
            
            signal = "HOLD"
            if price_change > 3:
                signal = "STRONG BUY"
            elif price_change > 1:
                signal = "BUY"
            elif price_change < -3:
                signal = "STRONG SELL"
            elif price_change < -1:
                signal = "SELL"
            
            # 6. Analyze frequency components
            approximation_trend = (predictions[0] - coeffs[0][-1]) / coeffs[0][-1] * 100 if len(coeffs[0]) > 0 and coeffs[0][-1] != 0 else 0
            
            # Calculate signal-to-noise ratio
            signal_power = np.var(coeffs[0]) if len(coeffs[0]) > 0 else 0
            noise_power = sum(np.var(c) for c in coeffs[1:]) / len(coeffs[1:]) if len(coeffs[1:]) > 0 else 0.001
            snr = 10 * np.log10(signal_power / noise_power) if noise_power > 0 else 0
            
            # Reconstruct signal for visualization
            reconstructed_signal = self.reconstruct_wavelet(coeffs, wavelet_type)
            
            return StrategyResponse(
                strategy_name="Wavelet + ML",
                signal=signal,
                metrics=convert_to_serializable({
                    "current_price": round(current_price, 2),
                    "forecast_price": round(forecast_price, 2),
                    "expected_change": round(float(price_change), 2),
                    "trend_direction": "Upward" if approximation_trend > 0 else "Downward",
                    "trend_strength": round(float(abs(approximation_trend)), 2),
                    "signal_to_noise_ratio": round(float(snr), 2),
                    "wavelet_type": wavelet_type,
                    "decomposition_levels": decomposition_level,
                    "components_analyzed": len(coeffs)
                }),
                chart_data=convert_to_serializable({
                    "original_signal": close_prices[-100:].tolist(),
                    "approximation": coeffs[0][-50:].tolist() if len(coeffs[0]) >= 50 else coeffs[0].tolist(),
                    "detail_1": coeffs[1][-50:].tolist() if len(coeffs) > 1 and len(coeffs[1]) >= 50 else (coeffs[1].tolist() if len(coeffs) > 1 else []),
                    "reconstructed": reconstructed_signal[-100:].tolist()
                }),
                analysis_details=component_forecasts
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Wavelet+ML Algorithm Error: {str(e)}")