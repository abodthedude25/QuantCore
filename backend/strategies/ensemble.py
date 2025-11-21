"""
Ensemble Methods Strategy
Combines multiple algorithms (ARIMA, Technical Indicators, Momentum) with weighted voting
"""
import numpy as np
import pandas as pd
from fastapi import HTTPException
from typing import List
from statsmodels.tsa.arima.model import ARIMA
from .base import BaseStrategy, StrategyResponse
from .utils import get_historical_data, calculate_ema, calculate_sma, convert_to_serializable


class EnsembleStrategy(BaseStrategy):
    """
    Model Stacking: Combines predictions from multiple base models
    - ARIMA forecast
    - MACD momentum
    - RSI overbought/oversold
    - Moving average crossover
    - Bollinger Bands
    
    Uses weighted voting for final prediction
    """
    
    def predict_arima(self, prices):
        """ARIMA-based prediction"""
        try:
            model = ARIMA(prices.tail(100), order=(1, 1, 1))
            fitted = model.fit()
            forecast = fitted.forecast(steps=5)
            direction = 1 if forecast.iloc[0] > prices.iloc[-1] else -1
            confidence = min(abs(forecast.iloc[0] - prices.iloc[-1]) / prices.iloc[-1] * 100, 1.0)
            return direction, confidence
        except:
            return 0, 0.0
    
    def predict_macd(self, prices):
        """MACD-based prediction"""
        ema_12 = calculate_ema(prices, 12)
        ema_26 = calculate_ema(prices, 26)
        macd = ema_12 - ema_26
        signal_line = calculate_ema(macd, 9)
        
        current_macd = macd.iloc[-1]
        current_signal = signal_line.iloc[-1]
        
        direction = 1 if current_macd > current_signal else -1
        confidence = min(abs(current_macd - current_signal) / prices.iloc[-1] * 100, 1.0)
        return direction, confidence
    
    def predict_rsi(self, prices):
        """RSI-based prediction"""
        delta = prices.diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        
        avg_gain = gain.rolling(window=14).mean()
        avg_loss = loss.rolling(window=14).mean()
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        current_rsi = rsi.iloc[-1]
        
        if current_rsi < 30:
            return 1, 1.0  # Strong buy
        elif current_rsi > 70:
            return -1, 1.0  # Strong sell
        elif current_rsi < 45:
            return 1, 0.5
        elif current_rsi > 55:
            return -1, 0.5
        else:
            return 0, 0.1
    
    def predict_ma_crossover(self, prices):
        """Moving Average Crossover prediction"""
        sma_20 = calculate_sma(prices, 20)
        sma_50 = calculate_sma(prices, 50)
        
        current_20 = sma_20.iloc[-1]
        current_50 = sma_50.iloc[-1]
        prev_20 = sma_20.iloc[-2]
        prev_50 = sma_50.iloc[-2]
        
        # Detect crossover
        if current_20 > current_50 and prev_20 <= prev_50:
            return 1, 1.0  # Golden cross
        elif current_20 < current_50 and prev_20 >= prev_50:
            return -1, 1.0  # Death cross
        elif current_20 > current_50:
            return 1, 0.3
        else:
            return -1, 0.3
    
    def predict_bollinger(self, prices):
        """Bollinger Bands prediction"""
        sma = calculate_sma(prices, 20)
        std = prices.rolling(window=20).std()
        upper = sma + (std * 2)
        lower = sma - (std * 2)
        
        current_price = prices.iloc[-1]
        current_upper = upper.iloc[-1]
        current_lower = lower.iloc[-1]
        
        percent_b = (current_price - current_lower) / (current_upper - current_lower)
        
        if percent_b < 0.2:
            return 1, 0.8  # Near lower band - buy
        elif percent_b > 0.8:
            return -1, 0.8  # Near upper band - sell
        else:
            return 0, 0.2
    
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="Ensemble requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            # 1. Fetch Data
            df = get_historical_data(ticker, period="1y")
            
            if len(df) < 100:
                raise ValueError("Not enough data for Ensemble (need 100+ days)")
            
            close_prices = df['Close']
            
            # 2. Get predictions from each model
            models = {
                'ARIMA': self.predict_arima(close_prices),
                'MACD': self.predict_macd(close_prices),
                'RSI': self.predict_rsi(close_prices),
                'MA_Cross': self.predict_ma_crossover(close_prices),
                'Bollinger': self.predict_bollinger(close_prices)
            }
            
            # 3. Weighted voting
            # Weights based on historical accuracy (these could be optimized)
            weights = {
                'ARIMA': 0.25,
                'MACD': 0.20,
                'RSI': 0.20,
                'MA_Cross': 0.20,
                'Bollinger': 0.15
            }
            
            weighted_score = 0
            total_confidence = 0
            model_predictions = []
            
            for model_name, (direction, confidence) in models.items():
                weighted_contribution = direction * confidence * weights[model_name]
                weighted_score += weighted_contribution
                total_confidence += confidence * weights[model_name]
                
                model_predictions.append({
                    "model": model_name,
                    "prediction": "BUY" if direction > 0 else "SELL" if direction < 0 else "HOLD",
                    "confidence": round(float(confidence), 2),
                    "weight": weights[model_name]
                })
            
            # 4. Final decision
            if weighted_score > 0.3:
                signal = "STRONG BUY"
            elif weighted_score > 0.1:
                signal = "BUY"
            elif weighted_score < -0.3:
                signal = "STRONG SELL"
            elif weighted_score < -0.1:
                signal = "SELL"
            else:
                signal = "HOLD"
            
            # 5. Calculate agreement metrics
            buy_votes = sum(1 for _, (d, _) in models.items() if d > 0)
            sell_votes = sum(1 for _, (d, _) in models.items() if d < 0)
            hold_votes = sum(1 for _, (d, _) in models.items() if d == 0)
            
            agreement = max(buy_votes, sell_votes, hold_votes) / len(models) * 100
            
            return StrategyResponse(
                strategy_name="Ensemble (Model Stacking)",
                signal=signal,
                metrics=convert_to_serializable({
                    "ensemble_score": round(float(weighted_score), 3),
                    "confidence": round(float(total_confidence), 2),
                    "agreement": round(float(agreement), 1),
                    "buy_votes": int(buy_votes),
                    "sell_votes": int(sell_votes),
                    "hold_votes": int(hold_votes),
                    "current_price": round(float(close_prices.iloc[-1]), 2),
                    "models_used": len(models)
                }),
                chart_data=convert_to_serializable({
                    "price_history": close_prices.tail(60).tolist(),
                    "model_scores": [
                        {
                            "model": name,
                            "score": float(direction * confidence * weights[name])
                        }
                        for name, (direction, confidence) in models.items()
                    ]
                }),
                analysis_details=model_predictions
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ensemble Algorithm Error: {str(e)}")