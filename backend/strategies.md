# QuantCore Trading Strategies: Complete Technical Guide

A comprehensive deep-dive into the mathematical foundations, logic, and implementation details of every trading algorithm in QuantCore.

## 📋 Table of Contents

- [Overview](#overview)
- [Technical Indicators](#technical-indicators)
  - [MACD Momentum](#1-macd-momentum)
  - [RSI Oscillator](#2-rsi-oscillator)
  - [Bollinger Bands](#3-bollinger-bands)
- [Time Series Models](#time-series-models)
  - [ARIMA Forecast](#4-arima-forecast)
  - [GARCH Volatility](#5-garch-volatility)
  - [VAR Multi-Asset](#6-var-multi-asset)
- [Machine Learning Strategies](#machine-learning-strategies)
  - [Random Forest Classifier](#7-random-forest-classifier)
  - [XGBoost Gradient Boosting](#8-xgboost-gradient-boosting)
  - [SVM Classifier](#9-svm-classifier)
  - [Wavelet + ML](#10-wavelet--ml)
- [Advanced Strategies](#advanced-strategies)
  - [Ensemble Stacking](#11-ensemble-stacking)
  - [Q-Learning Portfolio (Reinforcement Learning)](#12-q-learning-portfolio)
  - [Statistical Arbitrage (Pairs Trading)](#13-statistical-arbitrage-pairs-trading)
- [Factor & Explainability Models](#factor--explainability-models)
  - [Fama-French 5-Factor](#14-fama-french-5-factor-model)
  - [SHAP Explainer](#15-shap-explainer)
- [AI/NLP Strategies](#ainlp-strategies)
  - [FinBERT Sentiment Analysis](#16-finbert-sentiment-analysis)
- [Strategy Comparison Matrix](#strategy-comparison-matrix)
- [Mathematical Notation Reference](#mathematical-notation-reference)

---

## Overview

QuantCore implements 16 distinct trading strategies spanning multiple disciplines:

| Category | Strategies | Complexity |
|----------|------------|------------|
| Technical Analysis | MACD, RSI, Bollinger Bands | Low-Medium |
| Time Series | ARIMA, GARCH, VAR | Medium-High |
| Machine Learning | Random Forest, XGBoost, SVM, Wavelet+ML | High |
| Advanced/Hybrid | Ensemble, Q-Learning, Pairs Trading | High |
| Factor Models | Fama-French 5-Factor | Medium |
| Explainability | SHAP | High |
| NLP/AI | FinBERT Sentiment | High |

---

## Technical Indicators

### 1. MACD Momentum

**Full Name**: Moving Average Convergence Divergence

**Category**: Trend-following momentum indicator

**Risk Level**: Low

**Core Concept**: MACD measures the relationship between two exponential moving averages (EMAs) to identify momentum shifts and potential trend reversals.

#### Mathematical Foundation

**Step 1: Calculate Exponential Moving Averages**

The EMA gives more weight to recent prices:

```
EMA_t = Price_t × k + EMA_(t-1) × (1 - k)

where k = 2 / (period + 1)
```

For MACD, we calculate:
- **EMA-12**: 12-day exponential moving average (fast line)
- **EMA-26**: 26-day exponential moving average (slow line)

**Step 2: MACD Line**

```
MACD Line = EMA-12 - EMA-26
```

When the fast EMA is above the slow EMA, the MACD is positive (bullish momentum).

**Step 3: Signal Line**

```
Signal Line = EMA-9 of MACD Line
```

This 9-day EMA of the MACD line acts as a trigger for buy/sell signals.

**Step 4: Histogram**

```
Histogram = MACD Line - Signal Line
```

The histogram visualizes the distance between MACD and Signal lines.

#### Signal Generation Logic

```python
if histogram > 0 AND previous_histogram <= 0:
    signal = "STRONG BUY"    # Bullish crossover
elif histogram > 0:
    signal = "BUY"           # Positive momentum
elif histogram < 0 AND previous_histogram >= 0:
    signal = "STRONG SELL"   # Bearish crossover
elif histogram < 0:
    signal = "SELL"          # Negative momentum
else:
    signal = "HOLD"
```

#### Visual Interpretation

```
Price ────────────────────────────────
       ╱╲    ╱╲
      ╱  ╲  ╱  ╲
     ╱    ╲╱    ╲
    ╱              ╲

MACD  ─────────────────────────────────
         Signal Line
      ╱╲  ╱
     ╱  ╲╱    ← Bullish Crossover (BUY)
    ╱
   ╱

Histogram
    ████
   ██████  ← Positive = Bullish
  ████████
─────────────────────────────────────
        ████████
         ██████  ← Negative = Bearish
          ████
```

#### Strengths & Weaknesses

| Strengths | Weaknesses |
|-----------|------------|
| Clear trend identification | Lagging indicator |
| Works well in trending markets | False signals in sideways markets |
| Easy to interpret | Standard parameters may not suit all assets |

---

### 2. RSI Oscillator

**Full Name**: Relative Strength Index

**Category**: Momentum oscillator

**Risk Level**: Low

**Core Concept**: RSI measures the speed and magnitude of price movements to identify overbought or oversold conditions.

#### Mathematical Foundation

**Step 1: Calculate Price Changes**

```
Change_t = Close_t - Close_(t-1)
```

**Step 2: Separate Gains and Losses**

```
Gain_t = max(Change_t, 0)
Loss_t = |min(Change_t, 0)|
```

**Step 3: Average Gains and Losses (14-day default)**

```
Avg_Gain = SMA(Gains, 14)
Avg_Loss = SMA(Losses, 14)
```

**Step 4: Relative Strength**

```
RS = Avg_Gain / Avg_Loss
```

**Step 5: RSI Formula**

```
RSI = 100 - (100 / (1 + RS))
```

This normalizes the value to a 0-100 scale.

#### Alternative Form

```
RSI = 100 × (Avg_Gain / (Avg_Gain + Avg_Loss))
```

#### Signal Generation Logic

```python
if RSI < 30:
    signal = "STRONG BUY"     # Oversold
    zone = "Oversold"
elif RSI < 40:
    signal = "BUY"            # Approaching oversold
    zone = "Approaching Oversold"
elif RSI > 70:
    signal = "STRONG SELL"    # Overbought
    zone = "Overbought"
elif RSI > 60:
    signal = "SELL"           # Approaching overbought
    zone = "Approaching Overbought"
else:
    signal = "HOLD"
    zone = "Neutral"
```

#### RSI Zones Visualization

```
100 ┬─────────────────────────────────
    │     OVERBOUGHT ZONE
 70 ├─────────────────────────────────  ← Sell Signal
    │
    │     NEUTRAL ZONE
    │
 30 ├─────────────────────────────────  ← Buy Signal
    │     OVERSOLD ZONE
  0 ┴─────────────────────────────────
```

#### RSI Divergence (Advanced)

**Bullish Divergence**: Price makes lower low, RSI makes higher low → Potential reversal up

**Bearish Divergence**: Price makes higher high, RSI makes lower high → Potential reversal down

---

### 3. Bollinger Bands

**Category**: Volatility indicator with mean reversion signals

**Risk Level**: Medium

**Core Concept**: Bollinger Bands create a dynamic envelope around price using standard deviation, adapting to market volatility.

#### Mathematical Foundation

**Step 1: Middle Band (Simple Moving Average)**

```
Middle Band = SMA(Close, 20)

SMA = (P_1 + P_2 + ... + P_n) / n
```

**Step 2: Standard Deviation**

```
σ = √[Σ(P_i - SMA)² / n]
```

**Step 3: Upper and Lower Bands**

```
Upper Band = SMA + (2 × σ)
Lower Band = SMA - (2 × σ)
```

The multiplier of 2 means ~95% of price action should occur within the bands (assuming normal distribution).

**Step 4: Bandwidth (Volatility Measure)**

```
Bandwidth = ((Upper - Lower) / Middle) × 100
```

**Step 5: %B (Price Position)**

```
%B = (Price - Lower Band) / (Upper Band - Lower Band)
```

%B indicates where price is relative to the bands:
- %B = 0: Price at lower band
- %B = 0.5: Price at middle band
- %B = 1: Price at upper band

#### Signal Generation Logic

```python
if percent_b < 0.2:
    signal = "STRONG BUY"     # Near lower band (oversold)
    position = "Near Lower Band"
elif percent_b < 0.4:
    signal = "BUY"            # Below middle
    position = "Below Middle"
elif percent_b > 0.8:
    signal = "STRONG SELL"    # Near upper band (overbought)
    position = "Near Upper Band"
elif percent_b > 0.6:
    signal = "SELL"           # Above middle
    position = "Above Middle"
else:
    signal = "HOLD"
```

#### Visual Representation

```
Upper Band ─────╱╲──────╱╲─────────────
              ╱    ╲  ╱    ╲
Middle Band ─╱──────╲╱──────╲──────────
            ╱                  ╲
Lower Band ╱────────────────────╲──────

         ↑                      ↑
    Buy Signal             Sell Signal
   (Price near             (Price near
    lower band)             upper band)
```

#### Bollinger Squeeze

When bandwidth narrows significantly, it indicates low volatility and often precedes a significant price move (breakout).

---

## Time Series Models

### 4. ARIMA Forecast

**Full Name**: AutoRegressive Integrated Moving Average

**Category**: Statistical time series forecasting

**Risk Level**: Medium

**Core Concept**: ARIMA models capture patterns in time series data through autoregression, differencing, and moving averages.

#### Mathematical Foundation

ARIMA(p, d, q) has three components:

**p - AutoRegressive (AR) Order**

The current value depends on previous values:

```
AR(p): Y_t = c + φ₁Y_(t-1) + φ₂Y_(t-2) + ... + φ_pY_(t-p) + ε_t
```

**d - Differencing Order**

Makes the series stationary by differencing:

```
First difference: Y'_t = Y_t - Y_(t-1)
Second difference: Y''_t = Y'_t - Y'_(t-1)
```

**q - Moving Average (MA) Order**

The current value depends on past forecast errors:

```
MA(q): Y_t = c + ε_t + θ₁ε_(t-1) + θ₂ε_(t-2) + ... + θ_qε_(t-q)
```

**Complete ARIMA(p,d,q) Model**

```
Y'_t = c + φ₁Y'_(t-1) + ... + φ_pY'_(t-p) + ε_t + θ₁ε_(t-1) + ... + θ_qε_(t-q)
```

Where Y' is the differenced series.

#### Implementation Details

QuantCore uses ARIMA(1,1,1):
- **p=1**: One autoregressive term
- **d=1**: First-order differencing (removes trend)
- **q=1**: One moving average term

```python
model = ARIMA(train_data, order=(1, 1, 1))
fitted_model = model.fit()
forecast = fitted_model.forecast(steps=30)
```

#### Signal Generation Logic

```python
expected_return = ((forecast_30d - current_price) / current_price) * 100

if expected_return > 5:
    signal = "STRONG BUY"
elif expected_return > 2:
    signal = "BUY"
elif expected_return < -5:
    signal = "STRONG SELL"
elif expected_return < -2:
    signal = "SELL"
else:
    signal = "HOLD"
```

#### Model Evaluation Metrics

**AIC (Akaike Information Criterion)**
```
AIC = 2k - 2ln(L)
```
Where k = number of parameters, L = likelihood. Lower is better.

**BIC (Bayesian Information Criterion)**
```
BIC = k×ln(n) - 2ln(L)
```
Penalizes complexity more than AIC.

---

### 5. GARCH Volatility

**Full Name**: Generalized AutoRegressive Conditional Heteroskedasticity

**Category**: Volatility modeling and forecasting

**Risk Level**: Medium

**Core Concept**: GARCH models capture volatility clustering - the phenomenon where large price changes tend to cluster together.

#### Mathematical Foundation

**Step 1: Return Calculation**

```
r_t = (P_t - P_(t-1)) / P_(t-1) × 100
```

**Step 2: GARCH(1,1) Variance Equation**

```
σ²_t = ω + α₁ε²_(t-1) + β₁σ²_(t-1)
```

Where:
- σ²_t = Conditional variance at time t
- ω = Long-term average variance (constant)
- α₁ = ARCH coefficient (impact of recent shock)
- ε²_(t-1) = Previous period's squared return
- β₁ = GARCH coefficient (persistence of volatility)

**Constraints**:
- ω > 0
- α₁ ≥ 0, β₁ ≥ 0
- α₁ + β₁ < 1 (for stationarity)

**Step 3: Volatility Forecast**

```
σ²_(t+h) = ω × (1 - (α + β)^h) / (1 - α - β) + (α + β)^h × σ²_t
```

#### Volatility Clustering Visualization

```
Returns
    │    ╱╲
    │   ╱  ╲╱╲
    │  ╱      ╲        ╱╲
────┼──────────────────────────────
    │           ╲    ╱  ╲
    │            ╲  ╱    ╲╱
    │             ╲╱
    
Volatility
    │   ████
    │  ██████               ███
    │ ████████             █████
────┼──────────────────────────────
        High                High
     Volatility          Volatility
       Cluster            Cluster
```

#### Signal Generation Logic

```python
if forecast_vol_30d > current_volatility * 1.5:
    signal = "REDUCE EXPOSURE"   # Volatility expected to spike
elif forecast_vol_30d < current_volatility * 0.7:
    signal = "INCREASE EXPOSURE" # Volatility expected to drop
else:
    signal = "HOLD"

# Risk regime classification
if vol_percentile > 50:
    regime = "High Volatility"
    risk_level = "High"
elif vol_percentile > 25:
    regime = "Elevated Volatility"
    risk_level = "Medium-High"
elif vol_percentile < -25:
    regime = "Low Volatility"
    risk_level = "Low"
```

#### Key Metrics Output

- **Current Volatility**: Realized volatility (20-day)
- **Alpha (α)**: Measures reaction to market shocks
- **Beta (β)**: Measures volatility persistence
- **α + β**: Close to 1 means high persistence

---

### 6. VAR Multi-Asset

**Full Name**: Vector AutoRegression

**Category**: Multi-asset time series analysis

**Risk Level**: High

**Core Concept**: VAR models capture interdependencies between multiple time series, allowing each variable to be explained by its own lags and lags of other variables.

#### Mathematical Foundation

**VAR(p) Model for n Variables**

For a 2-variable system (simplified):

```
Y₁_t = c₁ + φ₁₁Y₁_(t-1) + φ₁₂Y₂_(t-1) + ε₁_t
Y₂_t = c₂ + φ₂₁Y₁_(t-1) + φ₂₂Y₂_(t-1) + ε₂_t
```

**Matrix Form**:

```
Y_t = c + Φ₁Y_(t-1) + Φ₂Y_(t-2) + ... + Φ_pY_(t-p) + ε_t
```

Where:
- Y_t = Vector of variables at time t
- c = Vector of constants
- Φ_i = Coefficient matrices
- ε_t = Vector of error terms

#### Lag Order Selection

```python
model = VAR(combined_df)
lag_order = model.select_order(maxlags=10)
optimal_lag = lag_order.aic  # Minimum AIC
```

#### Granger Causality Test

Tests whether past values of X help predict Y:

**Null Hypothesis**: X does not Granger-cause Y

```
F-statistic = ((RSS_restricted - RSS_unrestricted) / p) / (RSS_unrestricted / (T - 2p - 1))
```

If p-value < 0.05, X Granger-causes Y.

```python
# Example output
causality_results = {
    "AAPL→MSFT": {"p_value": 0.03, "significant": True},
    "MSFT→AAPL": {"p_value": 0.15, "significant": False}
}
# AAPL helps predict MSFT, but not vice versa
```

#### Implementation

```python
# Fit VAR model
model = VAR(returns_df)  # DataFrame with multiple stock returns
fitted = model.fit(optimal_lag)

# Forecast
forecast = fitted.forecast(returns_df.values[-optimal_lag:], steps=10)
```

#### Signal Generation

```python
avg_forecast = primary_forecast.mean()

if avg_forecast > 2.0:
    signal = "STRONG BUY"
elif avg_forecast > 1.0:
    signal = "BUY"
elif avg_forecast < -2.0:
    signal = "STRONG SELL"
elif avg_forecast < -1.0:
    signal = "SELL"
else:
    signal = "HOLD"
```

---

## Machine Learning Strategies

### 7. Random Forest Classifier

**Category**: Ensemble machine learning

**Risk Level**: Medium

**Core Concept**: Random Forest builds multiple decision trees on random subsets of data and features, then aggregates their predictions through voting.

#### Mathematical Foundation

**Decision Tree Splitting (Gini Impurity)**

```
Gini(D) = 1 - Σ(p_i)²
```

Where p_i is the proportion of class i in dataset D.

**Information Gain**

```
IG(D, A) = Gini(D) - Σ(|D_v| / |D|) × Gini(D_v)
```

Split on attribute A that maximizes information gain.

**Random Forest Algorithm**

1. Create B bootstrap samples from training data
2. For each sample, grow a decision tree:
   - At each node, randomly select m features (m ≈ √total_features)
   - Split on best feature among the m
3. Aggregate predictions:
   - Classification: Majority vote
   - Regression: Average

```
Final_Prediction = mode(Tree_1, Tree_2, ..., Tree_B)
```

#### Feature Engineering

The strategy creates 30+ technical features:

```python
# Returns at multiple timeframes
features['returns_1d'] = close.pct_change(1)
features['returns_5d'] = close.pct_change(5)
features['returns_10d'] = close.pct_change(10)

# Moving average distances
features['sma_20'] = calculate_sma(close, 20) / close - 1

# RSI
features['rsi'] = calculate_rsi(close, 14)

# Bollinger position
features['bb_position'] = (close - lower) / (upper - lower)

# Volatility
features['volatility_5d'] = close.pct_change().rolling(5).std()

# Volume features
features['volume_sma_ratio'] = volume / volume.rolling(20).mean()
```

#### Label Creation

```python
# Predict 5-day forward return
future_returns = close.shift(-5) / close - 1

labels = 1  # Default: HOLD
labels[future_returns > 0.01] = 2   # UP (>1%)
labels[future_returns < -0.01] = 0  # DOWN (<-1%)
```

#### Model Configuration

```python
model = RandomForestClassifier(
    n_estimators=100,      # 100 trees
    max_depth=10,          # Prevent overfitting
    min_samples_split=10,  # Minimum samples to split
    min_samples_leaf=5,    # Minimum samples in leaf
    random_state=42        # Reproducibility
)
```

#### Signal Generation

```python
prediction = model.predict(current_features)
prediction_proba = model.predict_proba(current_features)

signal_map = {0: "SELL", 1: "HOLD", 2: "BUY"}
signal = signal_map[prediction]

# Strengthen signal if confident
if max(prediction_proba) > 0.6:
    if prediction == 2:
        signal = "STRONG BUY"
    elif prediction == 0:
        signal = "STRONG SELL"
```

#### Feature Importance

```python
importances = model.feature_importances_
# Returns array of importance scores for each feature
# Higher = more important for predictions
```

---

### 8. XGBoost Gradient Boosting

**Full Name**: eXtreme Gradient Boosting

**Category**: Gradient boosting machine learning

**Risk Level**: Medium

**Core Concept**: XGBoost sequentially builds trees where each new tree corrects the errors of the ensemble so far, using gradient descent optimization.

#### Mathematical Foundation

**Objective Function**

```
Obj = Σ L(y_i, ŷ_i) + Σ Ω(f_k)
```

Where:
- L = Loss function (e.g., log loss for classification)
- Ω = Regularization term
- f_k = k-th tree

**Regularization**

```
Ω(f) = γT + ½λ||w||²
```

Where:
- T = Number of leaves
- w = Leaf weights
- γ, λ = Regularization parameters

**Gradient Boosting Update**

```
ŷ_i^(t) = ŷ_i^(t-1) + η × f_t(x_i)
```

Where η is the learning rate.

**Tree Building (Gain Function)**

```
Gain = ½[G_L²/(H_L + λ) + G_R²/(H_R + λ) - (G_L + G_R)²/(H_L + H_R + λ)] - γ
```

Where:
- G = Sum of gradients
- H = Sum of Hessians (second derivatives)
- L, R = Left and right splits

#### Additional Features vs Random Forest

XGBoost adds:
- MACD histogram
- Stochastic oscillator (%K, %D)
- ATR (Average True Range)
- Higher/lower high-low patterns
- Trend strength indicators

```python
# Stochastic Oscillator
low_14 = low.rolling(14).min()
high_14 = high.rolling(14).max()
features['stoch_k'] = 100 * (close - low_14) / (high_14 - low_14)
features['stoch_d'] = features['stoch_k'].rolling(3).mean()

# ATR
tr = max(high - low, |high - prev_close|, |low - prev_close|)
features['atr'] = tr.rolling(14).mean() / close
```

#### Model Configuration

```python
model = xgb.XGBClassifier(
    n_estimators=100,       # Number of boosting rounds
    max_depth=6,            # Tree depth
    learning_rate=0.1,      # Step size shrinkage
    subsample=0.8,          # Row sampling
    colsample_bytree=0.8,   # Feature sampling
    reg_alpha=0.1,          # L1 regularization
    reg_lambda=1.0,         # L2 regularization
    eval_metric='mlogloss'
)
```

#### Comparison: Random Forest vs XGBoost

| Aspect | Random Forest | XGBoost |
|--------|--------------|---------|
| Tree Building | Parallel (independent) | Sequential (corrective) |
| Optimization | None | Gradient descent |
| Regularization | Tree depth/samples | L1, L2, tree complexity |
| Speed | Faster training | Slower but often more accurate |
| Overfitting | Less prone | Needs careful tuning |

---

### 9. SVM Classifier

**Full Name**: Support Vector Machine

**Category**: Kernel-based classification

**Risk Level**: Medium

**Core Concept**: SVM finds the optimal hyperplane that maximizes the margin between classes, using kernel functions to handle non-linear relationships.

#### Mathematical Foundation

**Linear SVM Objective**

Maximize margin while minimizing classification errors:

```
minimize: ½||w||² + C × Σξ_i

subject to: y_i(w·x_i + b) ≥ 1 - ξ_i
            ξ_i ≥ 0
```

Where:
- w = Weight vector (defines hyperplane)
- b = Bias term
- C = Regularization parameter
- ξ_i = Slack variables (allow misclassification)

**Kernel Trick**

Maps data to higher-dimensional space without explicit computation:

```
K(x_i, x_j) = φ(x_i) · φ(x_j)
```

**RBF (Radial Basis Function) Kernel**

```
K(x_i, x_j) = exp(-γ||x_i - x_j||²)
```

Where γ controls the influence radius of each support vector.

#### Visual Representation

```
Linear SVM:
    Class A (○)     |     Class B (●)
                    |
       ○   ○        |        ●   ●
          ○         |     ●
       ○      ○    ←|→   ●      ●
                   Margin
                    |
    Support Vectors: points on margin boundary

RBF Kernel (non-linear):
         ○ ○
       ○     ○
      ○  ●●●  ○     →  Transforms to higher dimension
      ○  ●●●  ○         where linear separation possible
       ○     ○
         ○ ○
```

#### Feature Engineering

SVM-optimized features (normalized for scale sensitivity):

```python
# All features normalized to similar scales
features['returns_1d'] = close.pct_change(1)          # ~[-0.1, 0.1]
features['sma_20_dist'] = (close - sma) / sma         # ~[-0.1, 0.1]
features['rsi'] = (100 - 100/(1+rs)) / 100            # [0, 1]
features['bb_position'] = (close - lower) / (upper - lower)  # [0, 1]
```

#### Model Configuration

```python
base_svm = SVC(
    kernel='rbf',      # Non-linear kernel
    C=1.0,             # Regularization
    gamma='scale'      # Auto-scale gamma
)

# Wrap for probability estimates
model = CalibratedClassifierCV(base_svm, cv=3, method='sigmoid')
```

**Why Calibration?**

Standard SVM doesn't output probabilities. CalibratedClassifierCV fits a sigmoid function to convert decision scores to probabilities:

```
P(y=1|f) = 1 / (1 + exp(A×f + B))
```

#### Feature Analysis

Since SVM doesn't have built-in feature importance, we use correlation analysis:

```python
for feature in features:
    correlation = np.corrcoef(feature_values, labels)[0, 1]
    # Higher |correlation| = more predictive
```

---

### 10. Wavelet + ML

**Category**: Signal processing + machine learning hybrid

**Risk Level**: High

**Core Concept**: Decompose price signals into different frequency components (trend, cycles, noise), predict each separately, then reconstruct.

#### Mathematical Foundation

**Discrete Wavelet Transform (DWT)**

```
Signal = Approximation + Detail_1 + Detail_2 + ... + Detail_n
```

Each level captures different frequencies:
- **Approximation**: Low frequency (trend)
- **Detail 1**: Highest frequency (noise)
- **Detail 2**: Medium-high frequency (short cycles)
- **Detail n**: Lower frequency (longer cycles)

**Wavelet Decomposition Formula**

```
c_j,k = Σ x[n] × ψ_j,k[n]
```

Where ψ_j,k is the wavelet function at scale j and position k.

**Daubechies-4 Wavelet (db4)**

Used in implementation - good balance of smoothness and compact support.

#### Decomposition Visualization

```
Original Price Signal:
    ╱╲  ╱╲╱╲  ╱╲    ╱╲
   ╱  ╲╱    ╲╱  ╲  ╱  ╲
  ╱              ╲╱    ╲

Approximation (Trend):
       ╱────────╲
      ╱          ╲
     ╱            ╲

Detail 1 (High Frequency):
  ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲

Detail 2 (Medium Frequency):
    ╱╲    ╱╲    ╱╲
   ╱  ╲  ╱  ╲  ╱  ╲
  ╱    ╲╱    ╲╱    ╲
```

#### Implementation

```python
import pywt

# Decompose with Daubechies-4 wavelet, 3 levels
coeffs = pywt.wavedec(price_signal, 'db4', level=3)
# coeffs = [approximation, detail_3, detail_2, detail_1]

# Train ML model on each component
for coeff in coeffs:
    X, y = create_lagged_features(coeff, lookback=10)
    model = RandomForestRegressor(n_estimators=50, max_depth=5)
    model.fit(X, y)
    forecast = model.predict(last_sequence)

# Reconstruct forecast
reconstructed = pywt.waverec(forecasted_coeffs, 'db4')
```

#### Signal Generation

```python
price_change = (forecast_price - current_price) / current_price * 100

if price_change > 3:
    signal = "STRONG BUY"
elif price_change > 1:
    signal = "BUY"
elif price_change < -3:
    signal = "STRONG SELL"
elif price_change < -1:
    signal = "SELL"
else:
    signal = "HOLD"
```

#### Key Metrics

**Signal-to-Noise Ratio (SNR)**

```
SNR = 10 × log₁₀(Signal_Power / Noise_Power)

Signal_Power = Variance(Approximation)
Noise_Power = Average(Variance(Details))
```

Higher SNR = cleaner trend signal, more reliable predictions.

---

## Advanced Strategies

### 11. Ensemble Stacking

**Category**: Multi-model ensemble

**Risk Level**: Medium

**Core Concept**: Combines predictions from multiple algorithms using weighted voting, leveraging the strengths of different approaches.

#### Architecture

```
                    Input Data (Price History)
                              │
        ┌─────────┬─────────┬─┴─────────┬─────────┐
        ▼         ▼         ▼           ▼         ▼
    ┌───────┐ ┌───────┐ ┌───────┐ ┌─────────┐ ┌──────────┐
    │ ARIMA │ │ MACD  │ │  RSI  │ │MA Cross │ │Bollinger │
    └───┬───┘ └───┬───┘ └───┬───┘ └────┬────┘ └────┬─────┘
        │         │         │          │           │
        ▼         ▼         ▼          ▼           ▼
    Direction  Direction Direction Direction  Direction
    Confidence Confidence Confidence Confidence Confidence
        │         │         │          │           │
        └─────────┴─────────┴────┬─────┴───────────┘
                                 │
                          Weighted Voting
                                 │
                                 ▼
                          Final Signal
```

#### Component Models

**1. ARIMA Prediction**
```python
def predict_arima(prices):
    model = ARIMA(prices.tail(100), order=(1, 1, 1))
    forecast = model.fit().forecast(steps=5)
    direction = 1 if forecast[0] > prices[-1] else -1
    confidence = min(|forecast[0] - prices[-1]| / prices[-1], 1.0)
    return direction, confidence
```

**2. MACD Prediction**
```python
def predict_macd(prices):
    macd = ema_12 - ema_26
    signal_line = ema_9(macd)
    direction = 1 if macd[-1] > signal_line[-1] else -1
    confidence = min(|macd - signal| / price, 1.0)
    return direction, confidence
```

**3. RSI Prediction**
```python
def predict_rsi(prices):
    rsi = calculate_rsi(prices, 14)
    if rsi < 30:
        return 1, 1.0   # Strong oversold
    elif rsi > 70:
        return -1, 1.0  # Strong overbought
    elif rsi < 45:
        return 1, 0.5   # Mild bullish
    elif rsi > 55:
        return -1, 0.5  # Mild bearish
    else:
        return 0, 0.1   # Neutral
```

**4. Moving Average Crossover**
```python
def predict_ma_crossover(prices):
    sma_20 = sma(prices, 20)
    sma_50 = sma(prices, 50)
    
    # Detect crossover
    if sma_20[-1] > sma_50[-1] and sma_20[-2] <= sma_50[-2]:
        return 1, 1.0   # Golden cross
    elif sma_20[-1] < sma_50[-1] and sma_20[-2] >= sma_50[-2]:
        return -1, 1.0  # Death cross
    elif sma_20[-1] > sma_50[-1]:
        return 1, 0.3   # Above but no crossover
    else:
        return -1, 0.3
```

**5. Bollinger Bands**
```python
def predict_bollinger(prices):
    percent_b = (price - lower) / (upper - lower)
    
    if percent_b < 0.2:
        return 1, 0.8   # Near lower band
    elif percent_b > 0.8:
        return -1, 0.8  # Near upper band
    else:
        return 0, 0.2
```

#### Weighted Voting

```python
weights = {
    'ARIMA': 0.25,      # Highest weight - forward-looking
    'MACD': 0.20,       # Good momentum indicator
    'RSI': 0.20,        # Good reversal indicator
    'MA_Cross': 0.20,   # Trend following
    'Bollinger': 0.15   # Mean reversion
}

weighted_score = Σ (direction_i × confidence_i × weight_i)
```

#### Signal Generation

```python
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
```

#### Agreement Metrics

```python
buy_votes = count(models where direction > 0)
sell_votes = count(models where direction < 0)
hold_votes = count(models where direction == 0)

agreement = max(buy_votes, sell_votes, hold_votes) / total_models × 100
```

Higher agreement = higher confidence in the signal.

---

### 12. Q-Learning Portfolio

**Category**: Reinforcement Learning

**Risk Level**: High

**Core Concept**: An agent learns optimal trading actions (long/neutral/short) by interacting with the market environment and receiving rewards based on returns.

#### Reinforcement Learning Framework

```
┌─────────────────────────────────────────────────┐
│                  Environment                     │
│                (Stock Market)                    │
│                                                  │
│  State: Market conditions (momentum, volatility) │
│  Reward: Trading returns - transaction costs     │
└─────────────────┬───────────────────────────────┘
                  │
         Action   │   State, Reward
            ▼     │     │
┌─────────────────┴─────┴─────────────────────────┐
│                    Agent                         │
│              (Q-Learning Algorithm)              │
│                                                  │
│            Q-Table: State × Action → Value       │
│            Policy: Choose action with max Q      │
└─────────────────────────────────────────────────┘
```

#### Mathematical Foundation

**Q-Value Update (Bellman Equation)**

```
Q(s, a) ← Q(s, a) + α × [r + γ × max_a' Q(s', a') - Q(s, a)]
```

Where:
- Q(s, a) = Value of taking action a in state s
- α = Learning rate (0.1)
- r = Immediate reward
- γ = Discount factor (0.95)
- s' = Next state
- max_a' Q(s', a') = Best future value

**State Discretization**

```python
def discretize_state(returns, volatility):
    # Convert continuous momentum to discrete state (0-9)
    if returns > 0.02:
        return min(9, 5 + int(returns * 100))  # States 6-9
    elif returns < -0.02:
        return max(0, 5 + int(returns * 100))  # States 0-4
    else:
        return 5  # Neutral state
```

**Actions**

| Action | Meaning | Position |
|--------|---------|----------|
| 0 | SHORT | Bet on price decrease |
| 1 | NEUTRAL | No position |
| 2 | LONG | Bet on price increase |

#### Reward Function

```python
next_return = (price_tomorrow - price_today) / price_today

if action == 0:  # Short
    reward = -next_return - 0.001  # Profit if price drops
elif action == 1:  # Neutral
    reward = 0                      # No profit/loss
else:  # Long
    reward = next_return - 0.001   # Profit if price rises

# 0.001 = Transaction cost
```

#### Training Loop

```python
q_table = np.zeros((10, 3))  # 10 states × 3 actions

for day in training_period:
    state = discretize_state(momentum[day], volatility[day])
    
    # Epsilon-greedy action selection
    if random() < epsilon:
        action = random_action()  # Explore
    else:
        action = argmax(q_table[state])  # Exploit
    
    # Get reward from environment
    reward = calculate_reward(action, returns[day+1])
    
    # Update Q-value
    next_state = discretize_state(momentum[day+1], volatility[day+1])
    q_table[state, action] += alpha * (
        reward + gamma * max(q_table[next_state]) - q_table[state, action]
    )
```

#### Signal Generation

```python
current_state = discretize_state(current_momentum, current_volatility)
optimal_action = argmax(q_table[current_state])

action_map = {0: "SHORT", 1: "HOLD", 2: "LONG"}
signal = action_map[optimal_action]
```

#### Key Metrics

- **Q-Value**: Expected cumulative reward for state-action pair
- **Cumulative Reward**: Total profit from training
- **Win Rate**: Percentage of profitable actions
- **Episodes Trained**: Number of days used for learning

---

### 13. Statistical Arbitrage (Pairs Trading)

**Category**: Market-neutral statistical strategy

**Risk Level**: Medium

**Core Concept**: Exploit temporary price divergences between historically correlated assets, betting on mean reversion.

#### Mathematical Foundation

**Step 1: Test for Cointegration**

Two series are cointegrated if a linear combination is stationary:

```
Z_t = Y_t - β × X_t
```

Where Z_t is stationary (mean-reverting).

**Engle-Granger Test**:
1. Regress Y on X to find β (hedge ratio)
2. Test residuals for stationarity (ADF test)

**Step 2: Linear Regression for Hedge Ratio**

```
Stock_A = α + β × Stock_B + ε

β = Cov(A, B) / Var(B)
```

β is the hedge ratio - how many shares of B to short for each share of A.

**Step 3: Calculate Spread**

```
Spread_t = Price_A_t - β × Price_B_t
```

**Step 4: Z-Score Normalization**

```
Z_t = (Spread_t - μ_spread) / σ_spread

μ_spread = Rolling mean of spread (60 days)
σ_spread = Rolling std of spread (60 days)
```

#### Trading Logic

```
Z-Score
   +2 ─────────────────────  ← SELL SPREAD (Short A, Long B)
      
    0 ─────────────────────  ← Fair value (close positions)
      
   -2 ─────────────────────  ← BUY SPREAD (Long A, Short B)
```

**Signal Generation**:
```python
if z_score > 2.0:
    signal = "SELL SPREAD"
    # Action: Short Stock A, Long Stock B
elif z_score < -2.0:
    signal = "BUY SPREAD"
    # Action: Long Stock A, Short Stock B
else:
    signal = "HOLD"
```

#### Visual Example

```
Price
    │    Stock A ────
    │   ╱        ╲
    │  ╱          ╲  Stock B ----
    │ ╱            ╲╱
    │╱──────────────╲───────────
    │                ╲  ╱
    │                 ╲╱
    └────────────────────────────
                Spread widens    Spread narrows
                (Z > 2)          (converges)
                  │                   │
              SELL SPREAD      Close positions
```

#### Key Metrics

- **Z-Score**: Current deviation from mean (in std units)
- **Hedge Ratio**: Shares of B per share of A
- **Correlation**: Historical price correlation
- **Half-Life**: Expected time for spread to revert halfway

---

## Factor & Explainability Models

### 14. Fama-French 5-Factor Model

**Category**: Academic factor model

**Risk Level**: Low

**Core Concept**: Explains stock returns using exposure to market, size, value, profitability, and investment factors.

#### Mathematical Foundation

**The 5-Factor Model**

```
R_i - R_f = α + β_MKT(R_m - R_f) + β_SMB×SMB + β_HML×HML + β_RMW×RMW + β_CMA×CMA + ε
```

Where:
- R_i - R_f = Stock excess return
- R_m - R_f = Market excess return (MKT)
- SMB = Small Minus Big (size factor)
- HML = High Minus Low (value factor)
- RMW = Robust Minus Weak (profitability)
- CMA = Conservative Minus Aggressive (investment)
- α = Alpha (unexplained excess return)

#### Factor Definitions

| Factor | Long Portfolio | Short Portfolio | What It Captures |
|--------|---------------|-----------------|------------------|
| MKT | Market | Risk-free | Market risk |
| SMB | Small caps | Large caps | Size premium |
| HML | High B/M | Low B/M | Value premium |
| RMW | High profit | Low profit | Quality premium |
| CMA | Low investment | High investment | Investment premium |

#### Regression Implementation

```python
import statsmodels.api as sm

# Prepare data
X = pd.DataFrame({
    'MKT': market_returns - risk_free,
    'SMB': smb_returns,
    'HML': hml_returns,
    'RMW': rmw_returns,
    'CMA': cma_returns
})
X = sm.add_constant(X)
y = stock_returns - risk_free

# Run regression
model = sm.OLS(y, X).fit()

# Extract results
alpha = model.params['const']
betas = {factor: model.params[factor] for factor in ['MKT', 'SMB', 'HML', 'RMW', 'CMA']}
r_squared = model.rsquared
```

#### Interpreting Results

**Alpha (α)**
- α > 0: Stock outperforms factor-adjusted expectations
- α < 0: Stock underperforms
- Significant α: Manager skill or mispricing

**Betas**
| β_MKT | Interpretation |
|-------|----------------|
| > 1.2 | Aggressive (amplifies market moves) |
| 0.8-1.2 | Market neutral |
| < 0.8 | Defensive (dampens market moves) |

| β_SMB | Interpretation |
|-------|----------------|
| > 0 | Small cap tilt |
| < 0 | Large cap tilt |

| β_HML | Interpretation |
|-------|----------------|
| > 0 | Value tilt |
| < 0 | Growth tilt |

#### Expected Return Calculation

```python
risk_premia = {
    'MKT': 0.06,   # 6% market premium
    'SMB': 0.02,   # 2% size premium
    'HML': 0.03,   # 3% value premium
    'RMW': 0.025,  # 2.5% profitability premium
    'CMA': 0.02    # 2% investment premium
}

expected_return = 0.05  # Risk-free rate
for factor, beta in betas.items():
    expected_return += beta * risk_premia[factor]
```

#### Signal Generation

```python
if alpha_annual > 0.05 and alpha_pvalue < 0.1:
    signal = "BUY"      # Positive, significant alpha
elif alpha_annual < -0.05 and alpha_pvalue < 0.1:
    signal = "SELL"     # Negative, significant alpha
else:
    signal = "HOLD"     # No significant alpha
```

---

### 15. SHAP Explainer

**Full Name**: SHapley Additive exPlanations

**Category**: Model interpretability

**Risk Level**: Medium

**Core Concept**: Uses game theory (Shapley values) to explain how each feature contributes to a specific prediction.

#### Mathematical Foundation

**Shapley Value Formula**

For feature i:

```
φ_i = Σ [|S|!(|F|-|S|-1)! / |F|!] × [f(S ∪ {i}) - f(S)]
```

Where:
- S = Subset of features not including i
- F = All features
- f(S) = Model prediction using only features in S
- The sum is over all possible subsets

**Interpretation**: Average marginal contribution of feature i across all possible feature combinations.

#### SHAP Properties

1. **Local Accuracy**: Sum of SHAP values equals prediction minus base value
   ```
   f(x) = φ_0 + Σ φ_i
   ```

2. **Missingness**: Features with no impact have φ = 0

3. **Consistency**: If a feature's contribution increases in a new model, its SHAP value doesn't decrease

#### Implementation

```python
import shap

# Train base model (Random Forest)
model = RandomForestClassifier(n_estimators=100, max_depth=8)
model.fit(X_train, y_train)

# Create SHAP explainer
explainer = shap.TreeExplainer(model)

# Calculate SHAP values for current prediction
shap_values = explainer.shap_values(current_features)

# For multi-class, shap_values[class_idx] gives values for that class
shap_for_prediction = shap_values[predicted_class]
```

#### Visualization Concept

**Waterfall Plot**:
```
Base Value: 0.33 (equal probability)
       │
       │  +0.15  Return_5D (positive momentum)
       │  ──────►
       │  +0.08  RSI (oversold)
       │  ────►
       │  -0.05  Volatility (high)
       │  ◄──
       │  +0.12  SMA_20_Dist (above average)
       │  ─────►
       │
Final: 0.63 (BUY probability)
```

#### Feature Attribution

```python
# Global importance: average |SHAP| across all predictions
global_importance = np.abs(shap_values).mean(axis=0)

# Local attribution: SHAP values for this specific prediction
local_shap = shap_values[current_prediction]

# Identify drivers
positive_drivers = [(name, val) for name, val in zip(features, local_shap) if val > 0]
negative_drivers = [(name, val) for name, val in zip(features, local_shap) if val < 0]
```

#### Signal Generation

```python
# Same as Random Forest, but with explainability
prediction = model.predict(current_features)
prediction_proba = model.predict_proba(current_features)

signal_map = {0: "SELL", 1: "HOLD", 2: "BUY"}
signal = signal_map[prediction]

# Output includes WHY the model made this prediction
top_positive_driver = positive_drivers[0]  # e.g., "RSI: oversold"
top_negative_driver = negative_drivers[0]  # e.g., "Volatility: high"
```

#### Why SHAP Matters

| Traditional ML | SHAP-Enhanced ML |
|----------------|------------------|
| "Model says BUY" | "Model says BUY because RSI is oversold (+0.15), momentum is positive (+0.12), despite high volatility (-0.05)" |
| Black box | Transparent reasoning |
| Hard to trust | Builds confidence |
| Can't debug | Easy to identify issues |

---

## AI/NLP Strategies

### 16. FinBERT Sentiment Analysis

**Category**: Natural Language Processing

**Risk Level**: High

**Core Concept**: Uses a financial domain-specific BERT model to analyze news sentiment and generate trading signals.

#### Architecture

**BERT (Bidirectional Encoder Representations from Transformers)**

```
Input: "[CLS] Apple stock surges after earnings beat [SEP]"
         │
    Token Embeddings + Position Embeddings
         │
    ┌────┴────┐
    │ Encoder │ × 12 layers
    │  Block  │
    └────┬────┘
         │
    [CLS] token embedding
         │
    Classification Head
         │
    Sentiment: {Positive: 0.85, Neutral: 0.10, Negative: 0.05}
```

**FinBERT Specifics**:
- Pre-trained on financial text (news, reports, filings)
- Fine-tuned for financial sentiment classification
- Three classes: Positive, Negative, Neutral

#### Implementation Pipeline

```python
# 1. Fetch news
news_items = get_real_news(ticker)  # From Google News RSS
headlines = [n['title'] for n in news_items]

# 2. Run FinBERT
from transformers import pipeline
finbert = pipeline("sentiment-analysis", model="ProsusAI/finbert")
results = finbert(headlines)

# 3. Calculate aggregate sentiment
total_score = 0
for result in results:
    if result['label'] == 'positive':
        sentiment_val = 1
    elif result['label'] == 'negative':
        sentiment_val = -1
    else:
        sentiment_val = 0
    
    weighted_score = sentiment_val * result['score']
    total_score += weighted_score

avg_score = total_score / len(results)
```

#### Sentiment Scoring

```
Headline: "Apple beats earnings expectations"
FinBERT Output: {label: "positive", score: 0.92}
Contribution: +1 × 0.92 = +0.92

Headline: "Tech stocks face regulatory pressure"
FinBERT Output: {label: "negative", score: 0.78}
Contribution: -1 × 0.78 = -0.78

Average Score: (0.92 - 0.78) / 2 = 0.07
```

#### Signal Generation

```python
if avg_score > 0.15:
    signal = "BULLISH"
elif avg_score < -0.15:
    signal = "BEARISH"
else:
    signal = "NEUTRAL"
```

#### Example Output

```json
{
  "signal": "BULLISH",
  "sentiment_score": 0.23,
  "article_count": 15,
  "analysis_details": [
    {
      "headline": "Apple announces record iPhone sales",
      "sentiment": "positive",
      "confidence": 0.94,
      "source": "Reuters"
    },
    {
      "headline": "Supply chain concerns weigh on tech sector",
      "sentiment": "negative",
      "confidence": 0.71,
      "source": "Bloomberg"
    }
  ]
}
```

#### Limitations

| Challenge | Impact |
|-----------|--------|
| News already priced in | Signal may be late |
| Sarcasm/irony | Misclassification |
| Financial jargon | May need domain tuning |
| Headline vs. article | Headlines can be misleading |
| Volume of news | Noise from irrelevant stories |

---

## Strategy Comparison Matrix

| Strategy | Type | Risk | Data Needed | Best For |
|----------|------|------|-------------|----------|
| MACD | Technical | Low | 50+ days | Trend following |
| RSI | Technical | Low | 30+ days | Reversal detection |
| Bollinger | Technical | Medium | 30+ days | Volatility trading |
| ARIMA | Time Series | Medium | 100+ days | Price forecasting |
| GARCH | Time Series | Medium | 100+ days | Volatility forecasting |
| VAR | Time Series | High | 100+ days | Multi-asset analysis |
| Random Forest | ML | Medium | 200+ days | Direction prediction |
| XGBoost | ML | Medium | 200+ days | Direction prediction |
| SVM | ML | Medium | 200+ days | Binary classification |
| Wavelet+ML | Hybrid | High | 200+ days | Signal decomposition |
| Ensemble | Multi-model | Medium | 100+ days | Consensus signals |
| Q-Learning | RL | High | 100+ days | Adaptive trading |
| Pairs Trading | Statistical | Medium | 1+ years | Market-neutral |
| Fama-French | Factor | Low | 1+ years | Factor analysis |
| SHAP | Explainability | Medium | 200+ days | Transparent ML |
| FinBERT | NLP | High | Real-time news | Sentiment trading |

---

## Mathematical Notation Reference

| Symbol | Meaning |
|--------|---------|
| P_t | Price at time t |
| r_t | Return at time t |
| σ | Standard deviation (volatility) |
| μ | Mean |
| EMA | Exponential Moving Average |
| SMA | Simple Moving Average |
| α | Alpha (excess return) / Learning rate |
| β | Beta (factor exposure) / GARCH parameter |
| γ | Discount factor |
| ε | Error term / Exploration rate |
| φ | SHAP value / AR coefficient |
| θ | MA coefficient |
| Σ | Summation |
| ∀ | For all |
| ∈ | Element of |
| argmax | Argument that maximizes |

---

## Further Reading

1. **Technical Analysis**: Murphy, J. - "Technical Analysis of the Financial Markets"
2. **Time Series**: Hamilton, J. - "Time Series Analysis"
3. **Machine Learning**: Hastie, T. et al. - "Elements of Statistical Learning"
4. **Factor Models**: Fama, E. & French, K. - Original papers on SSRN
5. **Reinforcement Learning**: Sutton, R. & Barto, A. - "Reinforcement Learning: An Introduction"
6. **SHAP**: Lundberg, S. - "A Unified Approach to Interpreting Model Predictions"

---

*This document complements [algo_compare.md](algo_compare.md) which covers the backtesting and comparison system.*