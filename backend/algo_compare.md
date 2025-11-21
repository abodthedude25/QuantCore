# Strategy Comparison Engine

Complete guide to QuantCore's algorithm comparison and backtesting system.

## 📋 Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Understanding Results](#understanding-results)
- [Performance Metrics](#performance-metrics)
- [Backtesting Methodology](#backtesting-methodology)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)
- [Limitations](#limitations)
- [API Reference](#api-reference)
- [Advanced Usage](#advanced-usage)
- [FAQ](#faq)

## Overview

The Strategy Comparison Engine is QuantCore's flagship feature that allows you to backtest and compare all trading algorithms simultaneously. Instead of testing strategies one-by-one, you can instantly see which algorithm would have performed best over your chosen timeframe.

### Key Features

✅ **Simultaneous Backtesting** - Test 8+ strategies in one click  
✅ **Configurable Periods** - 1 week to 1 year lookback  
✅ **Comprehensive Metrics** - Accuracy, win rate, trade count  
✅ **Visual Rankings** - Gold/silver/bronze medals for top performers  
✅ **Risk Classification** - Low/Medium/High risk levels  
✅ **Automated Best-Strategy Selection** - Algorithm picks the winner  

### Supported Strategies

The comparison engine tests these single-ticker strategies:
- MACD Momentum
- RSI Oscillator
- Bollinger Bands
- ARIMA Forecast
- GARCH Volatility
- Q-Learning Portfolio
- Ensemble Stacking
- Wavelet + ML

*Note: Pairs Trading and VAR Multi-Asset require multiple tickers and are not included in comparisons.*

## How It Works

### Architecture

```
User Input (Ticker + Period)
         ↓
    Backend API
         ↓
  Historical Data Fetch
         ↓
    For Each Strategy:
      - Run algorithm on historical data
      - Generate signals at each point
      - Compare predictions vs actual moves
      - Calculate accuracy metrics
         ↓
    Aggregate Results
         ↓
    Rank by Performance
         ↓
    Return to Frontend
         ↓
  Display Rankings Table
```

### Backtesting Process

For each strategy and each day in the lookback period:

1. **Historical Context**: Use all data up to that point
2. **Signal Generation**: Run the algorithm to get BUY/SELL/HOLD
3. **Actual Movement**: Check if price went up or down next day
4. **Comparison**: Did the signal match the actual direction?
5. **Score**: Count correct predictions vs total predictions

### Performance Calculation

```python
# Simplified pseudocode
correct_predictions = 0
total_predictions = 0

for each_day in historical_data:
    signal = strategy.run(data_up_to_day)
    actual_move = price_tomorrow > price_today ? "UP" : "DOWN"
    
    if signal contains "BUY":
        predicted_move = "UP"
    elif signal contains "SELL":
        predicted_move = "DOWN"
    else:
        continue  # Skip neutral signals
    
    total_predictions += 1
    if predicted_move == actual_move:
        correct_predictions += 1

accuracy = (correct_predictions / total_predictions) * 100
```

## Getting Started

### Prerequisites

- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- Valid ticker symbol
- Historical data available (100+ days recommended)

### Step-by-Step Usage

#### 1. Access Compare View

Click **"Compare Strategies"** in the sidebar (purple button with compare icon).

#### 2. Enter Ticker Symbol

```
Ticker: AAPL
```

Use standard stock symbols:
- AAPL - Apple Inc.
- MSFT - Microsoft
- TSLA - Tesla
- SPY - S&P 500 ETF
- etc.

#### 3. Select Time Period

Choose from:
- **1 Week** (7 days) - Very short-term trends
- **1 Month** (30 days) - Short-term performance
- **3 Months** (90 days) - Medium-term trends
- **6 Months** (180 days) - Longer-term analysis
- **1 Year** (365 days) - Annual performance

#### 4. Run Comparison

Click **"Compare All Strategies"** button.

Wait 10-30 seconds for backtesting to complete.

#### 5. Analyze Results

Review the rankings table with:
- Rank (1st, 2nd, 3rd, etc.)
- Strategy name
- Risk level
- Accuracy percentage
- Win rate
- Total trades
- Correct predictions

## Understanding Results

### Rankings Table

```
┌──────┬───────────────────────┬────────┬──────────┬──────────┬────────┬────────┐
│ Rank │ Strategy              │ Risk   │ Accuracy │ Win Rate │ Trades │ Correct│
├──────┼───────────────────────┼────────┼──────────┼──────────┼────────┼────────┤
│ 🥇#1 │ Ensemble Stacking     │ Medium │  68.5%   │  68.5%   │   23   │   16   │
│ 🥈#2 │ ARIMA Forecast        │ Medium │  63.2%   │  63.2%   │   30   │   19   │
│ 🥉#3 │ MACD Momentum         │ Low    │  61.8%   │  61.8%   │   34   │   21   │
│  #4  │ Wavelet + ML          │ High   │  58.4%   │  58.4%   │   24   │   14   │
│  #5  │ RSI Oscillator        │ Low    │  55.7%   │  55.7%   │   27   │   15   │
│  #6  │ Bollinger Bands       │ Medium │  52.3%   │  52.3%   │   32   │   17   │
│  #7  │ Q-Learning Portfolio  │ High   │  49.1%   │  49.1%   │   22   │   11   │
│  #8  │ GARCH Volatility      │ Medium │  47.5%   │  47.5%   │   21   │   10   │
└──────┴───────────────────────┴────────┴──────────┴──────────┴────────┴────────┘
```

### Medal System

- 🥇 **Gold Medal** - Best performing strategy (#1)
- 🥈 **Silver Medal** - Second best (#2)
- 🥉 **Bronze Medal** - Third best (#3)

### Performance Classification

**Excellent** (60%+ accuracy)
- Significantly better than random (50%)
- Strong edge in the market
- Reliable signal generation

**Good** (50-60% accuracy)
- Slight edge over random
- Moderate reliability
- Worth considering

**Poor** (<50% accuracy)
- Worse than random guessing
- Not recommended for this asset/period
- May work better with different settings

## Performance Metrics

### Accuracy

**Definition**: Percentage of correct directional predictions

**Formula**: `(Correct Predictions / Total Predictions) × 100`

**Interpretation**:
- 70%+ : Exceptional performance
- 60-70% : Very good performance
- 50-60% : Moderate performance
- 40-50% : Below average
- <40% : Poor performance

**Example**:
```
Total Predictions: 23 trades
Correct Predictions: 16 trades
Accuracy: 16/23 = 69.6%
```

### Win Rate

**Definition**: Percentage of profitable trading decisions

**Calculation**: Same as accuracy in this implementation

**Use Case**: Indicates how often the strategy would have made money

### Total Trades

**Definition**: Number of non-neutral signals generated

**Importance**:
- More trades = more reliable statistics
- Fewer trades = less confidence in results
- Minimum 20 trades recommended for meaningful analysis

**Example**:
```
Strategy A: 50% accuracy, 50 trades → More reliable
Strategy B: 52% accuracy, 10 trades → Less reliable
```

### Correct Predictions

**Definition**: Absolute count of accurate signals

**Use Case**: Shows raw performance alongside percentage

**Example**:
```
30 total trades, 18 correct = 60% accuracy
vs
15 total trades, 9 correct = 60% accuracy

Both same percentage, but first has more data points
```

### Risk Level

**Categories**:
- **Low Risk**: Conservative strategies (MACD, RSI)
- **Medium Risk**: Balanced approaches (Bollinger, ARIMA, Ensemble)
- **High Risk**: Aggressive methods (RL, Wavelet, Sentiment)

**Impact**: Higher risk may yield higher returns but with more volatility

## Backtesting Methodology

### Data Requirements

**Minimum**: 100 days of historical data  
**Optimal**: 2+ years for robust testing  
**Source**: Yahoo Finance via yfinance library  

### Signal Classification

The backtester classifies signals as:

**Bullish (Predicted UP)**:
- Contains "BUY"
- Contains "LONG"
- Contains "BULLISH"
- Contains "INCREASE"

**Bearish (Predicted DOWN)**:
- Contains "SELL"
- Contains "SHORT"
- Contains "BEARISH"
- Contains "REDUCE"

**Neutral (Skipped)**:
- "HOLD"
- "NEUTRAL"
- Any other signals

*Note: Neutral signals are not counted in accuracy calculations.*

### Actual Movement

```python
if price_next_day > price_today:
    actual_movement = "UP"
else:
    actual_movement = "DOWN"
```

### Matching Logic

```python
if predicted_movement == actual_movement:
    correct_predictions += 1
```

### Simplified Assumptions

⚠️ **What's NOT included**:
- Transaction costs
- Slippage
- Bid-ask spreads
- Market impact
- Execution delays
- Overnight gaps
- Stop losses
- Position sizing
- Portfolio effects

⚠️ **What IS assumed**:
- Perfect execution
- Instant fills
- No costs
- Next-day close prices
- Full capital deployment
- Binary outcomes (up/down)

## Use Cases

### 1. Strategy Selection

**Goal**: Choose the best algorithm for a specific asset

**Process**:
1. Run comparison for target ticker
2. Select 1-3 month period
3. Choose top 3 performers
4. Validate with longer periods
5. Use best strategy for live signals

**Example**:
```
For AAPL trading:
→ Ensemble Stacking: 68% (1 month)
→ ARIMA Forecast: 71% (3 months)
→ Ensemble Stacking: 64% (6 months)

Conclusion: Ensemble is consistently strong
```

### 2. Asset Analysis

**Goal**: Understand which strategies work for different asset types

**Process**:
1. Compare multiple tickers
2. Note which strategies rank highest
3. Identify patterns

**Findings**:
```
Tech Stocks (AAPL, MSFT):
→ Ensemble, ARIMA work well

Commodities (GLD, SLV):
→ GARCH volatility performs better

Crypto (BTC-USD):
→ RL and Wavelet excel
```

### 3. Period Optimization

**Goal**: Find the optimal timeframe for each strategy

**Process**:
1. Run comparisons for all periods
2. Track each strategy's performance
3. Identify sweet spots

**Example**:
```
MACD Momentum:
→ 1 Week: 52%
→ 1 Month: 61% ✓
→ 3 Months: 54%
→ 6 Months: 58%

Best period: 1 month
```

### 4. Portfolio Diversification

**Goal**: Combine multiple strategies for robust signals

**Process**:
1. Identify top 3 performers
2. Use all three for signal generation
3. Require 2/3 agreement for trades
4. Reduces false signals

**Strategy**:
```
Portfolio Signal = Majority Vote

Example:
→ Ensemble: BUY
→ ARIMA: BUY
→ MACD: HOLD

Result: 2/3 BUY → Take position
```

### 5. Validation & Confidence

**Goal**: Validate current strategy choice

**Process**:
1. Backtest your current strategy
2. Compare against alternatives
3. If underperforming, consider switching

**Decision Framework**:
```
Current Strategy Accuracy: 52%
Best Alternative: 68%

Difference > 10% → Switch strategies
Difference < 5% → Keep current
```

## Best Practices

### 1. Multiple Timeframes

Don't rely on a single period. Test across:
- Short-term (1 week, 1 month)
- Medium-term (3 months)
- Long-term (6 months, 1 year)

Look for strategies that perform consistently.

### 2. Sample Size Matters

Prefer strategies with:
- 20+ total trades minimum
- More trades = more statistical significance
- Be cautious with <10 trade strategies

### 3. Risk Consideration

Match strategy risk to your tolerance:
- Conservative → Low risk strategies
- Moderate → Medium risk strategies
- Aggressive → High risk strategies

### 4. Out-of-Sample Testing

The comparison shows "in-sample" performance. For robust validation:
1. Test on period A (e.g., 3 months)
2. Validate on period B (next 3 months)
3. Check if performance holds

### 5. Combine with Fundamentals

Technical analysis (what we do) works best combined with:
- Fundamental analysis
- Market conditions
- News events
- Economic indicators

### 6. Regular Revalidation

Markets change. Re-run comparisons:
- Monthly for active trading
- Quarterly for position trading
- After major market events

### 7. Strategy Rotation

Don't stick to one strategy forever:
- Market regimes change
- Different strategies excel in different conditions
- Adapt based on recent comparisons

## Limitations

### 1. Survivorship Bias

**Issue**: Only tests on available data  
**Impact**: Doesn't account for delisted stocks  
**Mitigation**: Focus on established companies

### 2. Look-Ahead Bias

**Issue**: Strategies might use future information  
**Prevention**: Strict historical-only data in backtests  
**Note**: Our implementation prevents this

### 3. Overfitting

**Issue**: Strategies optimized for specific periods  
**Risk**: May not work in different market conditions  
**Solution**: Test multiple periods and assets

### 4. Perfect Information

**Issue**: Backtest assumes perfect execution  
**Reality**: Real trading has costs and slippage  
**Impact**: Real performance will be lower

### 5. Market Regime Changes

**Issue**: Past ≠ Future  
**Example**: Low volatility 2017 vs high volatility 2020  
**Mitigation**: Recent periods more relevant

### 6. Statistical Significance

**Issue**: Small sample sizes unreliable  
**Minimum**: 20+ trades for meaningful results  
**Ideal**: 50+ trades for confidence

### 7. Binary Simplification

**Issue**: Real markets aren't just up/down  
**Reality**: Magnitude matters (5% vs 0.5% moves)  
**Note**: Future updates may address this

## API Reference

### Compare Endpoint

**URL**: `POST /compare`

**Request Body**:
```json
{
  "ticker": "AAPL",
  "period": "1m"
}
```

**Parameters**:
- `ticker` (string, required): Stock symbol
- `period` (string, required): Time period
  - Valid values: `"1w"`, `"1m"`, `"3m"`, `"6m"`, `"1y"`

**Response**:
```json
{
  "ticker": "AAPL",
  "period": "1m",
  "start_date": "2024-10-20",
  "end_date": "2024-11-20",
  "current_price": 178.32,
  "period_return": 5.3,
  "results": [
    {
      "strategy_id": "ensemble",
      "strategy_name": "Ensemble Stacking",
      "signal_history": ["BUY", "HOLD", "STRONG BUY", ...],
      "accuracy": 68.5,
      "cumulative_return": 5.3,
      "win_rate": 68.5,
      "total_trades": 23,
      "correct_predictions": 16,
      "avg_confidence": 0.72,
      "risk_level": "Medium"
    },
    ...
  ],
  "best_strategy": "Ensemble Stacking",
  "best_accuracy": 68.5,
  "best_return": 5.3
}
```

**Error Responses**:

```json
// 400 Bad Request
{
  "detail": "Not enough historical data"
}

// 500 Internal Server Error
{
  "detail": "Comparison error: No data found for ticker XYZ"
}
```

### Example Usage

**cURL**:
```bash
curl -X POST http://localhost:8000/compare \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","period":"1m"}'
```

**Python**:
```python
import requests

response = requests.post(
    'http://localhost:8000/compare',
    json={'ticker': 'AAPL', 'period': '1m'}
)

data = response.json()
print(f"Best Strategy: {data['best_strategy']}")
print(f"Accuracy: {data['best_accuracy']}%")
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:8000/compare', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ticker: 'AAPL', period: '1m' })
});

const data = await response.json();
console.log(`Best Strategy: ${data.best_strategy}`);
console.log(`Accuracy: ${data.best_accuracy}%`);
```

## Advanced Usage

### Batch Comparison

Compare multiple tickers programmatically:

```python
tickers = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN']
period = '3m'

results = {}
for ticker in tickers:
    response = requests.post(
        'http://localhost:8000/compare',
        json={'ticker': ticker, 'period': period}
    )
    results[ticker] = response.json()

# Find overall best strategy
strategy_wins = {}
for ticker, data in results.items():
    best = data['best_strategy']
    strategy_wins[best] = strategy_wins.get(best, 0) + 1

print("Most consistently good strategy:", 
      max(strategy_wins, key=strategy_wins.get))
```

### Custom Analysis

Extract and analyze specific metrics:

```python
# Get comparison data
response = requests.post(
    'http://localhost:8000/compare',
    json={'ticker': 'AAPL', 'period': '6m'}
)
data = response.json()

# Analyze by risk level
by_risk = {}
for result in data['results']:
    risk = result['risk_level']
    if risk not in by_risk:
        by_risk[risk] = []
    by_risk[risk].append(result['accuracy'])

# Average accuracy by risk
for risk, accuracies in by_risk.items():
    avg = sum(accuracies) / len(accuracies)
    print(f"{risk} Risk Average: {avg:.1f}%")
```

### Performance Tracking

Track strategy performance over time:

```python
import pandas as pd
from datetime import datetime, timedelta

# Test multiple periods
periods = ['1m', '3m', '6m', '1y']
ticker = 'AAPL'

tracking = []
for period in periods:
    response = requests.post(
        'http://localhost:8000/compare',
        json={'ticker': ticker, 'period': period}
    )
    data = response.json()
    
    for result in data['results']:
        tracking.append({
            'period': period,
            'strategy': result['strategy_name'],
            'accuracy': result['accuracy'],
            'trades': result['total_trades']
        })

df = pd.DataFrame(tracking)
pivot = df.pivot(index='strategy', columns='period', values='accuracy')
print(pivot)
```

## FAQ

### General Questions

**Q: How long does a comparison take?**  
A: Typically 10-30 seconds for 8 strategies. Time varies based on:
- Data availability
- Period selected
- Server performance

**Q: Can I compare more than one ticker at a time?**  
A: Not in the UI currently. Use the API programmatically for batch comparisons.

**Q: Why are some strategies showing 0% accuracy?**  
A: Not enough signals generated during the period. Try:
- Longer time period
- Different ticker
- Different strategies

**Q: What's the difference between accuracy and win rate?**  
A: In the current implementation, they're the same. Future updates may separate:
- Accuracy: directional correctness
- Win rate: actual profitability considering magnitude

### Technical Questions

**Q: How is the "best strategy" determined?**  
A: Composite score: (Accuracy × 0.6) + (|Return| × 0.4)

**Q: Why don't Pairs Trading and VAR appear in comparisons?**  
A: They require multiple tickers. Comparison currently supports single-ticker strategies only.

**Q: Can I adjust the accuracy weighting?**  
A: Yes, modify the composite score calculation in `backend/trading_api.py`:
```python
composite_score = (result.accuracy * YOUR_WEIGHT) + ...
```

**Q: How can I export comparison results?**  
A: Currently manual. Future feature planned. For now:
- Copy from UI
- Use API and save JSON
- Screenshot the table

### Interpretation Questions

**Q: Is 55% accuracy good?**  
A: Marginally. It's better than random (50%) but:
- 60%+ is good
- 70%+ is excellent
- Consider transaction costs

**Q: Should I use the #1 ranked strategy?**  
A: Not always. Consider:
- Risk tolerance
- Trade frequency
- Consistency across periods
- Sample size (total trades)

**Q: Why do rankings change between periods?**  
A: Different strategies excel in different market conditions:
- Trending markets → momentum strategies
- Range-bound → mean reversion
- Volatile → GARCH performs better

**Q: Can I trust these results for live trading?**  
A: Use as guidance, not gospel:
- Past ≠ future
- Backtest ≠ live trading
- Always validate signals
- Use risk management

### Troubleshooting

**Q: "Not enough historical data" error**  
A: Solutions:
- Choose shorter period (1w instead of 1y)
- Try different ticker
- Check if ticker symbol is correct

**Q: All strategies showing similar accuracy**  
A: Could indicate:
- Strongly trending market (all agree)
- Choppy/random market (all struggle)
- Not enough differentiation in period

**Q: Results seem too good to be true**  
A: Red flags:
- Very small sample (<10 trades)
- Very short period
- Specific market condition
Always validate with different periods

## Conclusion

The Strategy Comparison Engine is a powerful tool for:
- Discovering which algorithms work best
- Optimizing strategy selection
- Understanding market dynamics
- Building confidence in signals

**Remember**:
- Past performance ≠ future results
- Use multiple validation methods
- Combine with other analysis
- Practice good risk management

**Best Results Come From**:
- Testing multiple periods
- Considering risk levels
- Validating across assets
- Regular reanalysis
- Combining with fundamentals

Ready to compare? Click "Compare Strategies" in the dashboard and start discovering which algorithms work best for your target assets!

---

**Questions or Issues?**  
- Check [README.md](README.md) for general docs
- Visit `/docs` endpoint for API details
- Review code in `backend/trading_api.py`

*Happy Trading! 📊*