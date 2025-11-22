"""
XGBoost Gradient Boosting Strategy
Sequentially builds trees, each correcting errors of previous ones
"""
import numpy as np
import pandas as pd
from fastapi import HTTPException
from typing import List
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import xgboost as xgb
from .base import BaseStrategy, StrategyResponse
from .utils import get_historical_data, calculate_ema, calculate_sma, convert_to_serializable


class XGBoostStrategy(BaseStrategy):
    """
    XGBoost Gradient Boosting for Price Direction
    - Sequential tree building with error correction
    - Handles tabular financial data efficiently
    - Regularization to prevent overfitting
    """
    
    def create_features(self, df):
        """
        Create comprehensive feature set for XGBoost
        """
        close = df['Close']
        high = df['High']
        low = df['Low']
        volume = df['Volume']
        
        features = pd.DataFrame(index=df.index)
        
        # Returns at different timeframes
        for period in [1, 2, 3, 5, 10, 20]:
            features[f'returns_{period}d'] = close.pct_change(period)
        
        # Moving average ratios
        for period in [5, 10, 20, 50]:
            features[f'sma_{period}_ratio'] = close / calculate_sma(close, period) - 1
            features[f'ema_{period}_ratio'] = close / calculate_ema(close, period) - 1
        
        # MACD features
        ema_12 = calculate_ema(close, 12)
        ema_26 = calculate_ema(close, 26)
        macd = ema_12 - ema_26
        macd_signal = calculate_ema(macd, 9)
        features['macd'] = macd / close
        features['macd_signal'] = macd_signal / close
        features['macd_histogram'] = (macd - macd_signal) / close
        
        # RSI
        delta = close.diff()
        gain = delta.where(delta > 0, 0).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / (loss + 0.0001)
        features['rsi'] = 100 - (100 / (1 + rs))
        
        # Stochastic oscillator
        low_14 = low.rolling(14).min()
        high_14 = high.rolling(14).max()
        features['stoch_k'] = 100 * (close - low_14) / (high_14 - low_14 + 0.0001)
        features['stoch_d'] = features['stoch_k'].rolling(3).mean()
        
        # Bollinger Bands
        sma_20 = calculate_sma(close, 20)
        std_20 = close.rolling(window=20).std()
        features['bb_upper_dist'] = (sma_20 + 2 * std_20 - close) / close
        features['bb_lower_dist'] = (close - sma_20 + 2 * std_20) / close
        features['bb_width'] = (4 * std_20) / close
        
        # ATR (Average True Range)
        tr1 = high - low
        tr2 = abs(high - close.shift(1))
        tr3 = abs(low - close.shift(1))
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        features['atr'] = tr.rolling(14).mean() / close
        
        # Volume features
        features['volume_ratio'] = volume / volume.rolling(20).mean()
        features['volume_trend'] = volume.rolling(5).mean() / volume.rolling(20).mean()
        
        # Volatility
        features['volatility_5'] = close.pct_change().rolling(5).std()
        features['volatility_20'] = close.pct_change().rolling(20).std()
        features['volatility_ratio'] = features['volatility_5'] / (features['volatility_20'] + 0.0001)
        
        # Price patterns
        features['higher_high'] = (high > high.shift(1)).astype(int)
        features['lower_low'] = (low < low.shift(1)).astype(int)
        features['close_position'] = (close - low) / (high - low + 0.0001)
        
        # Trend strength
        features['trend_5'] = (close > close.shift(5)).astype(int).rolling(5).mean()
        features['trend_20'] = (close > close.shift(20)).astype(int).rolling(20).mean()
        
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
    
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="XGBoost requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            # 1. Fetch Data
            df = get_historical_data(ticker, period="2y")
            
            if len(df) < 200:
                raise ValueError("Not enough data for XGBoost (need 200+ days)")
            
            # 2. Create features and labels
            features = self.create_features(df)
            labels = self.create_labels(df)
            
            # Remove NaN rows
            valid_idx = features.dropna().index.intersection(labels.dropna().index)
            valid_idx = valid_idx[:-5]  # Remove last 5 for lookahead
            
            X = features.loc[valid_idx]
            y = labels.loc[valid_idx]
            
            feature_names = X.columns.tolist()
            
            # 3. Train/Test split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, shuffle=False
            )
            
            # 4. Train XGBoost
            model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.1,
                reg_lambda=1.0,
                random_state=42,
                use_label_encoder=False,
                eval_metric='mlogloss'
            )
            
            model.fit(
                X_train, y_train,
                eval_set=[(X_test, y_test)],
                verbose=False
            )
            
            # 5. Evaluate
            train_accuracy = model.score(X_train, y_train)
            test_accuracy = model.score(X_test, y_test)
            
            # 6. Predict current state
            current_features = features.iloc[-1:].dropna(axis=1)
            # Handle any remaining NaN by filling with 0
            current_features = current_features.fillna(0)
            
            # Ensure we have all columns
            for col in feature_names:
                if col not in current_features.columns:
                    current_features[col] = 0
            current_features = current_features[feature_names]
            
            prediction = model.predict(current_features)[0]
            prediction_proba = model.predict_proba(current_features)[0]
            
            # 7. Feature importance
            importances = model.feature_importances_
            importance_ranking = sorted(
                zip(feature_names, importances),
                key=lambda x: x[1],
                reverse=True
            )
            
            # Signal
            signal_map = {0: "SELL", 1: "HOLD", 2: "BUY"}
            signal = signal_map[prediction]
            confidence = float(max(prediction_proba))
            
            if confidence > 0.55:
                if prediction == 2:
                    signal = "STRONG BUY"
                elif prediction == 0:
                    signal = "STRONG SELL"
            
            # Top features
            top_features = [
                {"feature": name, "importance": round(float(imp), 4)}
                for name, imp in importance_ranking[:10]
            ]
            
            # Get training history
            evals_result = model.evals_result()
            train_loss = evals_result.get('validation_0', {}).get('mlogloss', [])
            
            return StrategyResponse(
                strategy_name="XGBoost Gradient Boosting",
                signal=signal,
                metrics=convert_to_serializable({
                    "prediction": signal_map[prediction],
                    "confidence": round(confidence, 3),
                    "prob_down": round(float(prediction_proba[0]), 3),
                    "prob_hold": round(float(prediction_proba[1]), 3),
                    "prob_up": round(float(prediction_proba[2]), 3),
                    "train_accuracy": round(float(train_accuracy), 3),
                    "test_accuracy": round(float(test_accuracy), 3),
                    "n_estimators": 100,
                    "max_depth": 6,
                    "learning_rate": 0.1,
                    "n_features": len(feature_names),
                    "current_price": round(float(df['Close'].iloc[-1]), 2)
                }),
                chart_data=convert_to_serializable({
                    "feature_importance": [imp for _, imp in importance_ranking[:15]],
                    "feature_names": [name for name, _ in importance_ranking[:15]],
                    "training_loss": train_loss[-50:] if train_loss else [],
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
            raise HTTPException(status_code=500, detail=f"XGBoost Error: {str(e)}")