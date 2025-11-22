"""
SHAP (SHapley Additive exPlanations) Strategy
Explains ML model predictions using game theory
"""
import numpy as np
import pandas as pd
from fastapi import HTTPException
from typing import List
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import shap
from .base import BaseStrategy, StrategyResponse
from .utils import get_historical_data, calculate_ema, calculate_sma, convert_to_serializable


class SHAPExplainerStrategy(BaseStrategy):
    """
    SHAP Model Explainability
    - Uses Shapley values from game theory to explain predictions
    - Shows WHY the model makes each prediction
    - Critical for regulatory compliance and model trust
    - Feature attribution at global and local levels
    """
    
    def create_features(self, df):
        """
        Create interpretable features for SHAP analysis
        """
        close = df['Close']
        high = df['High']
        low = df['Low']
        volume = df['Volume']
        
        features = pd.DataFrame(index=df.index)
        
        # Price momentum features
        features['Return_1D'] = close.pct_change(1) * 100
        features['Return_5D'] = close.pct_change(5) * 100
        features['Return_10D'] = close.pct_change(10) * 100
        features['Return_20D'] = close.pct_change(20) * 100
        
        # Moving average distances
        features['SMA_10_Dist'] = ((close - calculate_sma(close, 10)) / close * 100)
        features['SMA_20_Dist'] = ((close - calculate_sma(close, 20)) / close * 100)
        features['SMA_50_Dist'] = ((close - calculate_sma(close, 50)) / close * 100)
        
        # EMA features
        features['EMA_12_Dist'] = ((close - calculate_ema(close, 12)) / close * 100)
        features['EMA_26_Dist'] = ((close - calculate_ema(close, 26)) / close * 100)
        
        # MACD
        ema_12 = calculate_ema(close, 12)
        ema_26 = calculate_ema(close, 26)
        features['MACD'] = ((ema_12 - ema_26) / close * 100)
        features['MACD_Signal'] = (calculate_ema(ema_12 - ema_26, 9) / close * 100)
        
        # RSI
        delta = close.diff()
        gain = delta.where(delta > 0, 0).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / (loss + 0.0001)
        features['RSI'] = 100 - (100 / (1 + rs))
        
        # Bollinger Bands
        sma_20 = calculate_sma(close, 20)
        std_20 = close.rolling(window=20).std()
        features['BB_Position'] = ((close - sma_20 + 2*std_20) / (4*std_20) * 100)
        features['BB_Width'] = ((4 * std_20) / sma_20 * 100)
        
        # Volume
        features['Volume_Ratio'] = (volume / volume.rolling(20).mean() * 100)
        features['Volume_Trend'] = (volume.rolling(5).mean() / volume.rolling(20).mean() * 100)
        
        # Volatility
        features['Volatility_5D'] = (close.pct_change().rolling(5).std() * 100)
        features['Volatility_20D'] = (close.pct_change().rolling(20).std() * 100)
        
        # Price patterns
        features['High_Low_Range'] = ((high - low) / close * 100)
        features['Close_Position'] = ((close - low) / (high - low + 0.0001) * 100)
        
        # Trend
        features['Above_SMA20'] = (close > calculate_sma(close, 20)).astype(float) * 100
        features['Above_SMA50'] = (close > calculate_sma(close, 50)).astype(float) * 100
        
        # Momentum oscillator
        features['Momentum_10D'] = ((close / close.shift(10) - 1) * 100)
        features['Momentum_20D'] = ((close / close.shift(20) - 1) * 100)
        
        return features
    
    def create_labels(self, df, threshold=0.01, lookahead=5):
        """
        Create classification labels
        """
        close = df['Close']
        future_returns = close.shift(-lookahead) / close - 1
        
        labels = pd.Series(1, index=df.index)
        labels[future_returns > threshold] = 2
        labels[future_returns < -threshold] = 0
        
        return labels
    
    def _to_scalar(self, val):
        """Convert numpy array or scalar to Python float"""
        if isinstance(val, np.ndarray):
            return float(val.flat[0]) if val.size > 0 else 0.0
        return float(val)
    
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="SHAP requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            # 1. Fetch Data
            df = get_historical_data(ticker, period="2y")
            
            if len(df) < 200:
                raise ValueError("Not enough data for SHAP analysis (need 200+ days)")
            
            # 2. Create features and labels
            features = self.create_features(df)
            labels = self.create_labels(df)
            
            # Remove NaN
            valid_idx = features.dropna().index.intersection(labels.dropna().index)
            valid_idx = valid_idx[:-5]
            
            X = features.loc[valid_idx]
            y = labels.loc[valid_idx]
            
            feature_names = X.columns.tolist()
            
            # 3. Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            X_scaled_df = pd.DataFrame(X_scaled, columns=feature_names)
            
            # 4. Train model
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled_df, y, test_size=0.2, shuffle=False
            )
            
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=8,
                min_samples_split=10,
                random_state=42,
                n_jobs=-1
            )
            model.fit(X_train, y_train)
            
            train_accuracy = model.score(X_train, y_train)
            test_accuracy = model.score(X_test, y_test)
            
            # 5. SHAP Analysis
            # Use TreeExplainer for Random Forest
            explainer = shap.TreeExplainer(model)
            
            # Get current prediction
            current_features = features.iloc[-1:].values
            current_features_scaled = scaler.transform(current_features)
            current_df = pd.DataFrame(current_features_scaled, columns=feature_names)
            
            prediction = int(model.predict(current_df)[0])
            prediction_proba = model.predict_proba(current_df)[0]
            
            # Calculate SHAP values for current prediction
            shap_values = explainer.shap_values(current_df)
            
            # For multi-class, shap_values is a list of arrays
            # Get SHAP values for the predicted class and convert to 1D array of floats
            if isinstance(shap_values, list):
                shap_for_prediction = np.array(shap_values[prediction]).flatten()
            else:
                shap_for_prediction = np.array(shap_values).flatten()
            
            # Ensure we have the right length
            if len(shap_for_prediction) != len(feature_names):
                shap_for_prediction = shap_for_prediction[:len(feature_names)]
            
            # 6. Calculate global feature importance using SHAP
            # Sample background data for global analysis
            background_sample = X_scaled_df.sample(n=min(50, len(X_scaled_df)), random_state=42)
            shap_values_global = explainer.shap_values(background_sample)
            
            # Calculate mean absolute SHAP values for global importance
            if isinstance(shap_values_global, list):
                # Average across all classes
                global_importance = np.mean([np.abs(np.array(sv)).mean(axis=0) for sv in shap_values_global], axis=0)
            else:
                global_importance = np.abs(np.array(shap_values_global)).mean(axis=0)
            
            # Ensure global_importance is 1D
            global_importance = np.array(global_importance).flatten()
            if len(global_importance) != len(feature_names):
                global_importance = global_importance[:len(feature_names)]
            
            # Create importance ranking with scalar values
            importance_data = []
            for i, name in enumerate(feature_names):
                global_imp = self._to_scalar(global_importance[i]) if i < len(global_importance) else 0.0
                local_shap = self._to_scalar(shap_for_prediction[i]) if i < len(shap_for_prediction) else 0.0
                importance_data.append((name, global_imp, local_shap))
            
            # Sort by global importance
            importance_ranking = sorted(importance_data, key=lambda x: abs(x[1]), reverse=True)
            
            # 7. Interpret SHAP values for current prediction
            signal_map = {0: "SELL", 1: "HOLD", 2: "BUY"}
            signal = signal_map[prediction]
            confidence = float(max(prediction_proba))
            
            if confidence > 0.6:
                if prediction == 2:
                    signal = "STRONG BUY"
                elif prediction == 0:
                    signal = "STRONG SELL"
            
            # Feature contributions for current prediction
            feature_contributions = []
            for name, global_imp, local_shap in importance_ranking[:15]:
                direction = "Positive" if local_shap > 0 else "Negative"
                impact = "Strong" if abs(local_shap) > 0.1 else "Moderate" if abs(local_shap) > 0.05 else "Weak"
                
                feature_contributions.append({
                    "feature": name,
                    "global_importance": round(global_imp, 4),
                    "local_shap_value": round(local_shap, 4),
                    "direction": direction,
                    "impact": impact
                })
            
            # Top drivers for current prediction (using scalar comparisons)
            positive_drivers = [(name, shap_val) for name, _, shap_val in importance_ranking if shap_val > 0][:5]
            negative_drivers = [(name, shap_val) for name, _, shap_val in importance_ranking if shap_val < 0][:5]
            
            # Base value (expected prediction without features)
            expected_val = explainer.expected_value
            if isinstance(expected_val, (list, np.ndarray)):
                base_value = float(np.array(expected_val).flatten()[prediction])
            else:
                base_value = float(expected_val)
            
            return StrategyResponse(
                strategy_name="SHAP Explainer",
                signal=signal,
                metrics=convert_to_serializable({
                    "prediction": signal_map[prediction],
                    "confidence": round(confidence, 3),
                    "prob_down": round(float(prediction_proba[0]), 3),
                    "prob_hold": round(float(prediction_proba[1]), 3),
                    "prob_up": round(float(prediction_proba[2]), 3),
                    "train_accuracy": round(float(train_accuracy), 3),
                    "test_accuracy": round(float(test_accuracy), 3),
                    "base_value": round(base_value, 4),
                    "n_features": len(feature_names),
                    "top_positive_driver": positive_drivers[0][0] if positive_drivers else "None",
                    "top_negative_driver": negative_drivers[0][0] if negative_drivers else "None",
                    "current_price": round(float(df['Close'].iloc[-1]), 2)
                }),
                chart_data=convert_to_serializable({
                    "shap_values": [shap_val for _, _, shap_val in importance_ranking[:15]],
                    "global_importance": [imp for _, imp, _ in importance_ranking[:15]],
                    "feature_names": [name for name, _, _ in importance_ranking[:15]],
                    "feature_values": current_features_scaled[0][:15].tolist(),
                    "positive_drivers": [{"name": name, "value": round(val, 4)} for name, val in positive_drivers],
                    "negative_drivers": [{"name": name, "value": round(val, 4)} for name, val in negative_drivers],
                    "probabilities": {
                        "down": float(prediction_proba[0]),
                        "hold": float(prediction_proba[1]),
                        "up": float(prediction_proba[2])
                    },
                    "price_history": df['Close'].tail(60).tolist()
                }),
                analysis_details=feature_contributions
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"SHAP Error: {str(e)}")