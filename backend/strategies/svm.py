"""
Support Vector Machine (SVM) Strategy
Finds optimal hyperplane to classify price movements
"""
import numpy as np
import pandas as pd
from fastapi import HTTPException
from typing import List
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.calibration import CalibratedClassifierCV
from .base import BaseStrategy, StrategyResponse
from .utils import get_historical_data, calculate_ema, calculate_sma, convert_to_serializable


class SVMStrategy(BaseStrategy):
    """
    Support Vector Machine Classifier for Price Direction
    - Finds optimal hyperplane in high-dimensional feature space
    - Uses RBF kernel for non-linear classification
    - Good for small to medium datasets
    """
    
    def create_features(self, df):
        """
        Create features optimized for SVM
        """
        close = df['Close']
        high = df['High']
        low = df['Low']
        volume = df['Volume']
        
        features = pd.DataFrame(index=df.index)
        
        # Normalized price features
        features['returns_1d'] = close.pct_change(1)
        features['returns_5d'] = close.pct_change(5)
        features['returns_10d'] = close.pct_change(10)
        features['returns_20d'] = close.pct_change(20)
        
        # Moving average distances (normalized)
        for period in [5, 10, 20, 50]:
            sma = calculate_sma(close, period)
            features[f'sma_{period}_dist'] = (close - sma) / sma
        
        # EMA distances
        for period in [12, 26]:
            ema = calculate_ema(close, period)
            features[f'ema_{period}_dist'] = (close - ema) / ema
        
        # MACD (normalized)
        ema_12 = calculate_ema(close, 12)
        ema_26 = calculate_ema(close, 26)
        features['macd_norm'] = (ema_12 - ema_26) / close
        
        # RSI (already 0-100)
        delta = close.diff()
        gain = delta.where(delta > 0, 0).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / (loss + 0.0001)
        features['rsi'] = (100 - (100 / (1 + rs))) / 100  # Normalize to 0-1
        
        # Bollinger Band position
        sma_20 = calculate_sma(close, 20)
        std_20 = close.rolling(window=20).std()
        upper = sma_20 + 2 * std_20
        lower = sma_20 - 2 * std_20
        features['bb_position'] = (close - lower) / (upper - lower + 0.0001)
        
        # Volume ratio
        features['volume_ratio'] = volume / volume.rolling(20).mean()
        
        # Volatility ratio
        vol_5 = close.pct_change().rolling(5).std()
        vol_20 = close.pct_change().rolling(20).std()
        features['vol_ratio'] = vol_5 / (vol_20 + 0.0001)
        
        # Price range
        features['range'] = (high - low) / close
        features['close_position'] = (close - low) / (high - low + 0.0001)
        
        # Momentum
        features['momentum_10'] = close / close.shift(10) - 1
        features['momentum_20'] = close / close.shift(20) - 1
        
        # Trend indicators
        features['above_sma_20'] = (close > calculate_sma(close, 20)).astype(float)
        features['above_sma_50'] = (close > calculate_sma(close, 50)).astype(float)
        
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
            raise HTTPException(status_code=400, detail="SVM requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            # 1. Fetch Data
            df = get_historical_data(ticker, period="2y")
            
            if len(df) < 200:
                raise ValueError("Not enough data for SVM (need 200+ days)")
            
            # 2. Create features and labels
            features = self.create_features(df)
            labels = self.create_labels(df)
            
            # Remove NaN
            valid_idx = features.dropna().index.intersection(labels.dropna().index)
            valid_idx = valid_idx[:-5]
            
            X = features.loc[valid_idx]
            y = labels.loc[valid_idx]
            
            feature_names = X.columns.tolist()
            
            # 3. Scale features (critical for SVM)
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # 4. Train/Test split
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, shuffle=False
            )
            
            # 5. Train SVM with RBF kernel
            # Use Calibrated classifier for probability estimates
            base_svm = SVC(
                kernel='rbf',
                C=1.0,
                gamma='scale',
                random_state=42
            )
            
            model = CalibratedClassifierCV(base_svm, cv=3, method='sigmoid')
            model.fit(X_train, y_train)
            
            # 6. Evaluate
            train_accuracy = model.score(X_train, y_train)
            test_accuracy = model.score(X_test, y_test)
            
            # 7. Predict current state
            current_features = features.iloc[-1:].values
            current_features_scaled = scaler.transform(current_features)
            
            prediction = model.predict(current_features_scaled)[0]
            prediction_proba = model.predict_proba(current_features_scaled)[0]
            
            # 8. Feature analysis (using permutation importance approximation)
            # For SVM, we'll use coefficient magnitudes if linear, or correlation analysis
            feature_correlations = []
            for i, name in enumerate(feature_names):
                corr = np.corrcoef(X_scaled[:, i], y)[0, 1]
                feature_correlations.append((name, abs(corr) if not np.isnan(corr) else 0))
            
            feature_correlations.sort(key=lambda x: x[1], reverse=True)
            
            # Signal
            signal_map = {0: "SELL", 1: "HOLD", 2: "BUY"}
            signal = signal_map[prediction]
            confidence = float(max(prediction_proba))
            
            if confidence > 0.55:
                if prediction == 2:
                    signal = "STRONG BUY"
                elif prediction == 0:
                    signal = "STRONG SELL"
            
            # Support vector info (handle both old and new scikit-learn versions)
            try:
                n_support = sum(
                    len(getattr(estimator, 'estimator', getattr(estimator, 'base_estimator', None)).support_) 
                    for estimator in model.calibrated_classifiers_
                ) // len(model.calibrated_classifiers_)
            except (AttributeError, TypeError):
                n_support = len(X_train) // 3  # Approximate if we can't get exact count
            
            # Top features by correlation
            top_features = [
                {"feature": name, "correlation": round(float(corr), 4)}
                for name, corr in feature_correlations[:10]
            ]
            
            # Decision boundary margin (approximate)
            margins = []
            for proba in prediction_proba:
                margins.append(abs(proba - 0.33))
            avg_margin = np.mean(margins)
            
            return StrategyResponse(
                strategy_name="SVM Classifier",
                signal=signal,
                metrics=convert_to_serializable({
                    "prediction": signal_map[prediction],
                    "confidence": round(confidence, 3),
                    "prob_down": round(float(prediction_proba[0]), 3),
                    "prob_hold": round(float(prediction_proba[1]), 3),
                    "prob_up": round(float(prediction_proba[2]), 3),
                    "train_accuracy": round(float(train_accuracy), 3),
                    "test_accuracy": round(float(test_accuracy), 3),
                    "kernel": "RBF",
                    "avg_support_vectors": int(n_support),
                    "decision_margin": round(float(avg_margin), 3),
                    "n_features": len(feature_names),
                    "current_price": round(float(df['Close'].iloc[-1]), 2)
                }),
                chart_data=convert_to_serializable({
                    "feature_correlations": [corr for _, corr in feature_correlations[:15]],
                    "feature_names": [name for name, _ in feature_correlations[:15]],
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
            raise HTTPException(status_code=500, detail=f"SVM Error: {str(e)}")