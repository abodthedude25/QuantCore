# 🔬 Algorithm Comparison Guide

Quick reference for choosing the right algorithm for your trading strategy.

---

## 📊 Algorithm Comparison Matrix

| Algorithm | Type | Complexity | Best For | Risk Level | Timeframe |
|-----------|------|------------|----------|------------|-----------|
| **MACD** | Technical | Low | Trend identification | Low | Days-Weeks |
| **RSI** | Technical | Low | Reversal signals | Low | Days |
| **Bollinger Bands** | Technical | Medium | Volatility + reversals | Medium | Days-Weeks |
| **Pairs Trading** | Statistical | High | Market-neutral strategies | Medium | Weeks-Months |
| **Sentiment** | AI/ML | Medium | News-driven moves | High | Hours-Days |

---

## 🎯 When to Use Each Algorithm

### MACD (Moving Average Convergence Divergence)
**Use When:**
- ✅ You want to identify trend changes early
- ✅ Looking for momentum shifts
- ✅ Confirming existing trends
- ✅ Trading liquid, trending stocks

**Avoid When:**
- ❌ Market is range-bound (choppy)
- ❌ Stock has low volatility
- ❌ Looking for exact entry prices

**Best Pairs With:**
- Volume analysis
- Support/resistance levels
- RSI (for confirmation)

**Example Scenario:**
*Apple (AAPL) has been trending up. MACD line crosses above signal line → STRONG BUY. Stock continues rally for 2 weeks.*

---

### RSI (Relative Strength Index)
**Use When:**
- ✅ Looking for overbought/oversold conditions
- ✅ Expecting mean reversion
- ✅ Short-term trading (days)
- ✅ Stock has clear support/resistance

**Avoid When:**
- ❌ Strong trends (can stay overbought/oversold for long periods)
- ❌ Low-liquidity stocks
- ❌ During major news events

**Best Pairs With:**
- Bollinger Bands
- Support/resistance
- Volume confirmation

**Example Scenario:**
*Tesla (TSLA) drops 15% on no news. RSI hits 25 (oversold) → STRONG BUY. Stock rebounds 8% in 3 days.*

---

### Bollinger Bands
**Use When:**
- ✅ Analyzing volatility changes
- ✅ Looking for price extremes
- ✅ Anticipating breakouts (squeeze)
- ✅ Trading established stocks

**Avoid When:**
- ❌ Penny stocks (too volatile)
- ❌ IPOs (no historical baseline)
- ❌ During earnings (extreme volatility)

**Best Pairs With:**
- RSI (double confirmation)
- Volume analysis
- MACD (for trend direction)

**Example Scenario:**
*Microsoft (MSFT) consolidates for weeks (bands narrow). Price breaks above upper band with volume → Potential continuation.*

---

### Pairs Trading (Statistical Arbitrage)
**Use When:**
- ✅ You want market-neutral strategies
- ✅ Two stocks are historically correlated
- ✅ Looking for relative value plays
- ✅ Hedging directional risk

**Avoid When:**
- ❌ Stocks have low correlation (<0.7)
- ❌ Fundamentals diverge (merger, bankruptcy)
- ❌ One stock has major news event
- ❌ High transaction costs

**Best Pairs With:**
- Correlation analysis
- Fundamental checks
- Sector rotation analysis

**Example Scenario:**
*Coca-Cola (KO) and PepsiCo (PEP) usually move together. KO suddenly outperforms by 5%. Z-score = 2.5 → SELL SPREAD (short KO, long PEP). Spread reverts in 2 weeks.*

---

### Sentiment Analysis (AI/NLP)
**Use When:**
- ✅ Major news just broke
- ✅ Earnings season
- ✅ High-profile stocks (TSLA, NVDA)
- ✅ Short-term speculation (hours-days)

**Avoid When:**
- ❌ Low news coverage stocks
- ❌ Long-term investing
- ❌ During market holidays
- ❌ For illiquid stocks

**Best Pairs With:**
- Price action confirmation
- Volume analysis
- Technical indicators (for timing)

**Example Scenario:**
*Nvidia (NVDA) announces new AI chip. 5 positive headlines in 1 hour. Sentiment score = 0.85 → BULLISH. Stock gaps up 6% at open.*

---

## 🧪 Algorithm Strengths & Weaknesses

### MACD
**Strengths:**
- ✅ Clearly defined entry/exit signals
- ✅ Works well in trending markets
- ✅ Visual crossover is intuitive
- ✅ Lag is acceptable (not too late)

**Weaknesses:**
- ❌ Lagging indicator (based on past data)
- ❌ False signals in choppy markets
- ❌ Doesn't indicate strength of move
- ❌ Can miss fast reversals

---

### RSI
**Strengths:**
- ✅ Clear overbought/oversold levels
- ✅ Leading indicator (predicts reversals)
- ✅ Works across all timeframes
- ✅ Simple interpretation

**Weaknesses:**
- ❌ Can stay extreme for extended periods
- ❌ False signals during strong trends
- ❌ Sensitive to outliers
- ❌ Doesn't predict magnitude of reversal

---

### Bollinger Bands
**Strengths:**
- ✅ Adapts to volatility changes
- ✅ Identifies squeeze patterns (breakouts)
- ✅ Shows relative price levels
- ✅ Multiple signals (bands + %B)

**Weaknesses:**
- ❌ No directional bias
- ❌ Requires confirmation
- ❌ Less effective in strong trends
- ❌ Can give conflicting signals

---

### Pairs Trading
**Strengths:**
- ✅ Market-neutral (hedged)
- ✅ Statistical backing
- ✅ Lower risk than directional
- ✅ Exploits inefficiencies

**Weaknesses:**
- ❌ Requires two stocks (double fees)
- ❌ Complex execution (simultaneous trades)
- ❌ Cointegration can break down
- ❌ Capital intensive (need margin)

---

### Sentiment Analysis
**Strengths:**
- ✅ Captures psychology
- ✅ Early signal (before price moves)
- ✅ AI-powered (sophisticated)
- ✅ Real-time news integration

**Weaknesses:**
- ❌ News can be misleading
- ❌ Sentiment ≠ price action
- ❌ Requires frequent updates
- ❌ High false positive rate

---

## 🎨 Visual Signal Comparison

### MACD Signal Example
```
Price:  $175 → $178 → $182 (uptrend)
MACD:   1.5  → 2.1  → 2.8  (rising)
Signal: 1.8  → 2.0  → 2.2  (rising slower)
        
Signal: BUY (MACD > Signal and rising)
```

### RSI Signal Example
```
Price: $180 → $165 → $162 (falling)
RSI:   55   → 35   → 28   (oversold)
        
Signal: STRONG BUY (RSI < 30)
Action: Expect bounce to ~$170
```

### Bollinger Bands Signal Example
```
Upper:  $185 ═══════════
Price:  $183 ─────── (near upper)
Middle: $175 ───────────
Lower:  $165 ═══════════
        
Signal: SELL (price at upper band)
%B: 0.9 (very high)
```

### Pairs Trading Signal Example
```
Stock A (KO):  $55 → $58 (+5.5%)
Stock B (PEP): $65 → $65 (flat)
Spread: +2.5σ (very high)
        
Signal: SELL SPREAD
Action: Short KO, Long PEP
Target: Spread reverts to 0σ
```

### Sentiment Signal Example
```
Headlines:
✅ "Company beats earnings" (+0.9)
✅ "Analyst upgrade" (+0.8)
⚪ "New product launch" (+0.3)
        
Avg Sentiment: +0.67
Signal: BULLISH
```

---

## 🔀 Combining Algorithms (Strategy Ideas)

### Strategy 1: "Momentum Confirmation"
```
1. MACD shows crossover → BUY signal
2. Confirm with RSI > 50 (momentum confirmed)
3. Check Bollinger Bands (price not overbought)
Result: High-confidence entry
```

### Strategy 2: "Mean Reversion with Sentiment"
```
1. RSI < 30 → Stock oversold
2. Sentiment turns positive → Catalyst detected
3. Enter when RSI starts rising
Result: Catching bounce with confirmation
```

### Strategy 3: "Volatility Breakout"
```
1. Bollinger Bands squeeze (narrow)
2. Wait for price to break upper band
3. Confirm with MACD turning positive
Result: Ride the new trend
```

### Strategy 4: "Pairs + Sentiment"
```
1. Z-score shows extreme spread
2. Check sentiment on both stocks
3. If one has negative news → stronger signal
Result: News-driven convergence play
```

---

## 📈 Risk Management by Algorithm

| Algorithm | Stop Loss Strategy | Position Sizing | Hold Time |
|-----------|-------------------|-----------------|-----------|
| **MACD** | MACD crosses back | Standard (1-2%) | Days-Weeks |
| **RSI** | RSI crosses back to 50 | Larger (2-3%) | 1-5 Days |
| **Bollinger** | Price breaks opposite band | Standard (1-2%) | Days |
| **Pairs** | Z-score moves further out | Smaller (0.5-1%) | Weeks |
| **Sentiment** | News reverses | Small (0.5%) | Hours-Days |

---

## 🎓 Learning Path

### Beginner
1. Start with **RSI** (simplest interpretation)
2. Add **MACD** (understand momentum)
3. Practice with simulation mode

### Intermediate
4. Learn **Bollinger Bands** (volatility context)
5. Combine RSI + Bollinger for confirmation
6. Backtest strategies

### Advanced
7. Master **Pairs Trading** (statistical approach)
8. Add **Sentiment** (news edge)
9. Build multi-algorithm systems

---

## 🚀 Recommended Combinations

### For Day Trading
- Primary: **RSI** + **Sentiment**
- Secondary: Bollinger Bands
- Why: Fast signals, news-driven

### For Swing Trading
- Primary: **MACD** + **Bollinger Bands**
- Secondary: RSI
- Why: Trend + volatility context

### For Market-Neutral
- Primary: **Pairs Trading**
- Secondary: Sentiment (for timing)
- Why: Hedged, statistical

### For Long-Term
- Primary: **MACD** + **Sentiment**
- Secondary: Fundamental analysis
- Why: Trend + psychological edge

---

## 💡 Pro Tips

1. **No Single Algorithm is Perfect**: Use multiple for confirmation
2. **Context Matters**: Check overall market conditions
3. **Backtest First**: Validate strategies with historical data
4. **Risk Management**: Always use stop losses
5. **News Overrides Technicals**: Sentiment can trump patterns
6. **Correlation Checks**: Pairs trading needs stable relationships
7. **Volume Confirmation**: Add volume analysis to any signal
8. **Time of Day**: Different algorithms work better at different times

---

## 🎯 Quick Decision Tree

```
Is there recent news?
├─ YES → Use Sentiment Analysis
└─ NO  → Continue
    
Is market trending?
├─ YES → Use MACD
└─ NO  → Continue
    
Is volatility high?
├─ YES → Use Bollinger Bands
└─ NO  → Continue
    
Do you want market-neutral?
├─ YES → Use Pairs Trading
└─ NO  → Use RSI
```

---

**Choose wisely, trade safely! 📊🎯**