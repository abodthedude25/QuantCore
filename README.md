# QuantCore - Multi-Algorithm Trading Dashboard

A production-ready quantitative trading platform with 5 distinct algorithms: MACD, RSI, Bollinger Bands, Statistical Arbitrage (Pairs Trading), and AI Sentiment Analysis.

## 🚀 Features

### Technical Indicators (Mathematical)
1. **MACD (Moving Average Convergence Divergence)**
   - Tracks momentum using 12-day and 26-day EMAs
   - Identifies trend changes and crossovers
   - Provides signal line for precise entry/exit points

2. **RSI (Relative Strength Index)**
   - Momentum oscillator (0-100 scale)
   - Identifies overbought (>70) and oversold (<30) conditions
   - Visual gauge for instant interpretation

3. **Bollinger Bands**
   - Volatility-based indicator using standard deviation
   - Shows price position relative to bands
   - Includes %B indicator for precise positioning

### Statistical Models
4. **Pairs Trading (Statistical Arbitrage)**
   - Exploits mean reversion between correlated assets
   - Uses cointegration and z-score analysis
   - Ideal for market-neutral strategies

### Machine Learning
5. **Sentiment Analysis (FinBERT)**
   - NLP-powered news analysis
   - Real-time sentiment scoring
   - Predicts short-term volatility

---

## 📦 Installation

### Backend (Python)

```bash
# 1. Install dependencies
pip install fastapi uvicorn yfinance pandas numpy statsmodels transformers torch --break-system-packages

# 2. Run the server
python backend_updated.py

# Server starts at http://localhost:8000
```

**Note**: First run will download the FinBERT model (~400MB). This is a one-time download.

---

## 📊 API Reference

### Base URL
```
http://localhost:8000
```

### Endpoints

#### `GET /`
Health check endpoint
```json
{
  "status": "online",
  "models_loaded": ["finbert"]
}
```

#### `GET /strategies`
List all available strategies
```json
{
  "strategies": [
    {
      "id": "macd",
      "name": "MACD Momentum",
      "category": "technical",
      "inputs": 1,
      "risk": "Low"
    },
    ...
  ]
}
```

#### `POST /execute`
Execute a strategy

**Request Body:**
```json
{
  "strategy_id": "macd",
  "tickers": ["AAPL"]
}
```

**Response:**
```json
{
  "strategy_name": "MACD",
  "signal": "STRONG BUY",
  "metrics": {
    "macd_value": 2.45,
    "signal_value": 1.89,
    "histogram": 0.56,
    "current_price": 178.23
  },
  "chart_data": {
    "macd": [...],
    "signal": [...],
    "histogram": [...]
  }
}
```

---

## 🎯 Usage Examples

### MACD
```bash
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{"strategy_id": "macd", "tickers": ["TSLA"]}'
```

### RSI
```bash
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{"strategy_id": "rsi", "tickers": ["AAPL"]}'
```

### Bollinger Bands
```bash
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{"strategy_id": "bollinger", "tickers": ["MSFT"]}'
```

### Pairs Trading
```bash
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{"strategy_id": "pairs", "tickers": ["KO", "PEP"]}'
```

### Sentiment Analysis
```bash
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{"strategy_id": "sentiment", "tickers": ["NVDA"]}'
```

---

## 🔧 Customization

### Adding New Algorithms

1. **Backend** - Create a new strategy class:
```python
class NewStrategy(BaseStrategy):
    def run(self, inputs: List[str]) -> StrategyResponse:
        # Your algorithm logic here
        return StrategyResponse(
            strategy_name="My Strategy",
            signal="BUY",
            metrics={...},
            chart_data={...}
        )

# Register it
strategies["new_strategy"] = NewStrategy()
```

2. **Frontend** - Add to STATIC_STRATEGIES and create visualizer:
```javascript
const NewStrategyVisualizer = ({ data }) => {
  // Your visualization components
};
```

### Modifying Signal Thresholds

For RSI, change oversold/overbought levels in `backend_updated.py`:
```python
if current_rsi < 25:  # More aggressive (was 30)
    signal = "STRONG BUY"
```

---

## 📈 Performance Optimization

### Backend Caching
- `@lru_cache` prevents redundant Yahoo Finance API calls
- Cache persists for the duration of the server session
- Clear cache: Restart the server

### Model Loading
- FinBERT loads once at startup (~10 seconds)
- Uses GPU automatically if CUDA is available
- For CPU-only: Model inference takes ~2-3 seconds per request

---

## 🛠️ Troubleshooting

### "No data found for ticker"
- Verify ticker symbol is correct (use uppercase)
- Check if market is open (Yahoo Finance may have delays)

### "FinBERT model loading error"
- Ensure stable internet connection for first download
- Check available disk space (model is 400MB)
- Try: `pip install --upgrade transformers torch`

### CORS errors in browser
- Backend already includes CORS middleware
- If still occurring, check browser console for specific error
- Try accessing backend directly: `http://localhost:8000/`

### Slow response times
- First request after startup is slower (cache warming)
- Sentiment analysis requires model inference (2-3 sec)
- Consider upgrading to GPU for faster inference

---

## 📚 Resources & References

### MACD
- [Investopedia: MACD](https://www.investopedia.com/terms/m/macd.asp)
- Gerald Appel's "Technical Analysis: Power Tools for Active Investors"

### RSI
- [Wilder's RSI Paper](https://en.wikipedia.org/wiki/Relative_strength_index)
- J. Welles Wilder "New Concepts in Technical Trading Systems" (1978)

### Bollinger Bands
- [John Bollinger's Official Site](https://www.bollingerbands.com/)
- "Bollinger on Bollinger Bands" by John Bollinger

### Pairs Trading
- [Pairs Trading Strategy Explanation](https://www.investopedia.com/articles/trading/04/090804.asp)
- Gatev et al. (2006) "Pairs Trading: Performance of a Relative-Value Arbitrage Rule"

### Sentiment Analysis
- [FinBERT Paper](https://arxiv.org/abs/1908.10063)
- [Hugging Face FinBERT Model](https://huggingface.co/ProsusAI/finbert)

---

## 🚀 Next Steps

1. **Add More Algorithms**: Implement ARIMA, LSTM, Random Forest
2. **Real-time Data**: Integrate WebSocket for live price updates
3. **Backtesting**: Add historical performance analysis
4. **Portfolio Management**: Track multiple positions simultaneously
5. **Alerts**: Email/SMS notifications when signals trigger
6. **Database**: Store historical predictions and track accuracy

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional technical indicators
- More sophisticated ML models
- Enhanced visualizations
- Backtesting framework
- Risk management features

---

**Built with ❤️ for quantitative traders and algo enthusiasts**