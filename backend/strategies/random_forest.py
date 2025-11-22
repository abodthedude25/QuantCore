"""
Random Forest Strategy for Price Direction Prediction
Uses ensemble of decision trees with technical indicators as features
"""
import numpy as np
import pandas as pd
from fastapi import HTTPException
from typing import List
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from .base import BaseStrategy, StrategyResponse
from .utils import get_historical_data, calculate_ema, calculate_sma, convert_to_serializable


class RandomForestStrategy(BaseStrategy):
    """
    Random Forest Classifier for Price Direction
    - Predicts UP/DOWN/HOLD based on technical indicators
    - Uses ensemble voting from multiple decision trees
    - Provides feature importance rankings
    """
    
    def create_features(self, df):
        """
        Create technical indicator features for the model
        """
        close = df['Close']
        high = df['High']
        low = df['Low']
        volume = df['Volume']
        
        features = pd.DataFrame(index=df.index)
        
        # Price-based features
        features['returns_1d'] = close.pct_change(1)
        features['returns_5d'] = close.pct_change(5)
        features['returns_10d'] = close.pct_change(10)
        features['returns_20d'] = close.pct_change(20)
        
        # Moving averages
        features['sma_5'] = calculate_sma(close, 5) / close - 1
        features['sma_10'] = calculate_sma(close, 10) / close - 1
        features['sma_20'] = calculate_sma(close, 20) / close - 1
        features['sma_50'] = calculate_sma(close, 50) / close - 1
        
        # EMA
        features['ema_12'] = calculate_ema(close, 12) / close - 1
        features['ema_26'] = calculate_ema(close, 26) / close - 1
        
        # MACD
        ema_12 = calculate_ema(close, 12)
        ema_26 = calculate_ema(close, 26)
        features['macd'] = (ema_12 - ema_26) / close
        features['macd_signal'] = calculate_ema(ema_12 - ema_26, 9) / close
        
        # RSI
        delta = close.diff()
        gain = delta.where(delta > 0, 0).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        features['rsi'] = 100 - (100 / (1 + rs))
        features['rsi_normalized'] = features['rsi'] / 100
        
        # Bollinger Bands
        sma_20 = calculate_sma(close, 20)
        std_20 = close.rolling(window=20).std()
        features['bb_upper'] = (sma_20 + 2 * std_20) / close - 1
        features['bb_lower'] = (sma_20 - 2 * std_20) / close - 1
        features['bb_width'] = (4 * std_20) / sma_20
        features['bb_position'] = (close - sma_20 + 2 * std_20) / (4 * std_20)
        
        # Volatility
        features['volatility_5d'] = close.pct_change().rolling(5).std()
        features['volatility_20d'] = close.pct_change().rolling(20).std()
        
        # Volume features
        features['volume_sma_ratio'] = volume / volume.rolling(20).mean()
        features['volume_change'] = volume.pct_change()
        
        # Price range
        features['high_low_range'] = (high - low) / close
        features['close_to_high'] = (close - low) / (high - low + 0.0001)
        
        # Momentum
        features['momentum_10'] = close / close.shift(10) - 1
        features['momentum_20'] = close / close.shift(20) - 1
        
        # Rate of change
        features['roc_5'] = (close - close.shift(5)) / close.shift(5)
        features['roc_10'] = (close - close.shift(10)) / close.shift(10)
        
        return features
    
    def create_labels(self, df, threshold=0.01, lookahead=5):
        """
        Create classification labels based on future returns
        0: DOWN, 1: HOLD, 2: UP
        """
        close = df['Close']
        future_returns = close.shift(-lookahead) / close - 1
        
        labels = pd.Series(1, index=df.index)  # Default HOLD
        labels[future_returns > threshold] = 2  # UP
        labels[future_returns < -threshold] = 0  # DOWN
        
        return labels
    
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="Random Forest requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            # 1. Fetch Data
            df = get_historical_data(ticker, period="2y")
            
            if len(df) < 200:
                raise ValueError("Not enough data for Random Forest (need 200+ days)")
            
            # 2. Create features and labels
            features = self.create_features(df)
            labels = self.create_labels(df)
            
            # Remove NaN rows
            valid_idx = features.dropna().index.intersection(labels.dropna().index)
            # Also remove the last 5 rows where we don't have future labels
            valid_idx = valid_idx[:-5]
            
            X = features.loc[valid_idx]
            y = labels.loc[valid_idx]
            
            feature_names = X.columns.tolist()
            
            # 3. Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # 4. Train/Test split
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, shuffle=False
            )
            
            # 5. Train Random Forest
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=10,
                min_samples_leaf=5,
                random_state=42,
                n_jobs=-1
            )
            model.fit(X_train, y_train)
            
            # 6. Evaluate
            train_accuracy = model.score(X_train, y_train)
            test_accuracy = model.score(X_test, y_test)
            
            # 7. Make prediction for current state
            current_features = features.iloc[-1:].values
            current_features_scaled = scaler.transform(current_features)
            
            prediction = model.predict(current_features_scaled)[0]
            prediction_proba = model.predict_proba(current_features_scaled)[0]
            
            # 8. Get feature importance
            importances = model.feature_importances_
            importance_ranking = sorted(
                zip(feature_names, importances),
                key=lambda x: x[1],
                reverse=True
            )
            
            # Map prediction to signal
            signal_map = {0: "SELL", 1: "HOLD", 2: "BUY"}
            signal = signal_map[prediction]
            
            # Confidence based on probability
            confidence = float(max(prediction_proba))
            
            if confidence > 0.6:
                if prediction == 2:
                    signal = "STRONG BUY"
                elif prediction == 0:
                    signal = "STRONG SELL"
            
            # Top features
            top_features = [
                {"feature": name, "importance": round(float(imp), 4)}
                for name, imp in importance_ranking[:10]
            ]
            
            return StrategyResponse(
                strategy_name="Random Forest Classifier",
                signal=signal,
                metrics=convert_to_serializable({
                    "prediction": signal_map[prediction],
                    "confidence": round(confidence, 3),
                    "prob_down": round(float(prediction_proba[0]), 3),
                    "prob_hold": round(float(prediction_proba[1]), 3),
                    "prob_up": round(float(prediction_proba[2]), 3),
                    "train_accuracy": round(float(train_accuracy), 3),
                    "test_accuracy": round(float(test_accuracy), 3),
                    "n_trees": 100,
                    "n_features": len(feature_names),
                    "current_price": round(float(df['Close'].iloc[-1]), 2)
                }),
                chart_data=convert_to_serializable({
                    "feature_importance": [imp for _, imp in importance_ranking[:15]],
                    "feature_names": [name for name, _ in importance_ranking[:15]],
                    "price_history": df['Close'].tail(60).tolist(),
                    "probabilities": {
                        "down": float(prediction_proba[0]),
                        "hold": float(prediction_proba[1]),
                        "up": float(prediction_proba[2])
                    }
                }),
                analysis_details=top_features
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Random Forest Error: {str(e)}")