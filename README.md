# QuantCore Trading Dashboard

A professional algorithmic trading analysis platform featuring 11+ advanced trading strategies, real-time backtesting, and AI-powered insights.

![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-green.svg)
![React](https://img.shields.io/badge/react-18.0+-61DAFB.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🎯 Overview

QuantCore is a full-stack trading analysis dashboard that combines traditional technical analysis, advanced time-series models, machine learning, and reinforcement learning to provide comprehensive trading signals. The platform features a unique **Strategy Comparison Engine** that backtests all algorithms simultaneously to identify the best performer for any asset and timeframe.

### Key Features

- **11+ Trading Strategies**: From basic technical indicators to advanced ML/RL algorithms
- **Strategy Comparison**: Backtest and rank all strategies side-by-side
- **Real-time Analysis**: Instant signal generation with detailed metrics
- **AI Sentiment Analysis**: FinBERT-powered news sentiment extraction
- **Beautiful UI**: Modern, responsive interface with interactive visualizations
- **Production Ready**: FastAPI backend with React frontend

## 📊 Available Strategies

### Technical Indicators
- **MACD Momentum** - Exponential moving average crossovers
- **RSI Oscillator** - Overbought/oversold conditions (0-100 scale)
- **Bollinger Bands** - Volatility-based trading bands

### Statistical Models
- **Statistical Arbitrage** - Pairs trading with cointegration analysis

### Machine Learning
- **AI Sentiment Analysis** - FinBERT NLP on financial news headlines

### Time Series Models
- **ARIMA Forecast** - AutoRegressive Integrated Moving Average
- **GARCH Volatility** - Conditional heteroskedasticity modeling
- **VAR Multi-Asset** - Vector Autoregression with Granger causality

### Advanced Algorithms
- **Q-Learning Portfolio** - Reinforcement learning agent (LONG/NEUTRAL/SHORT)
- **Ensemble Stacking** - Weighted voting from 5+ sub-algorithms
- **Wavelet + ML** - Frequency decomposition with Random Forest

## 🏆 Strategy Comparison Engine

Compare all algorithms simultaneously to discover which performs best for your target asset and timeframe.

**Features:**
- Configurable periods: 1 week, 1 month, 3 months, 6 months, 1 year
- Performance metrics: Accuracy, win rate, total trades, correct predictions
- Visual rankings with gold/silver/bronze medals 🥇🥈🥉
- Automatic best strategy identification
- Risk level classification

**Performance Metrics:**
- **Accuracy**: % of correct directional predictions
- **Win Rate**: % of profitable trades
- **Total Trades**: Number of signals generated
- **Correct Predictions**: Count of accurate signals

[See detailed documentation →](ALGO_COMPARE.md)

## 🚀 Quick Start

### Prerequisites

```bash
# Backend
Python 3.9+
pip (Python package manager)

# Frontend
Node.js 16+
npm or yarn
```

### Installation

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd quantcore-dashboard
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python trading_api.py
```

The backend will run on `http://localhost:8000`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### Verify Installation

1. Open `http://localhost:5173` in your browser
2. Check for "Backend: Online" in the sidebar
3. Try running MACD analysis on AAPL
4. Click "Compare Strategies" to test the comparison feature

## 📖 Usage

### Running Individual Strategies

1. Select a strategy from the sidebar
2. Enter ticker symbol(s) as required
3. Click "Run Analysis"
4. View detailed results with metrics and charts

**Example: MACD Momentum**
```
Ticker: AAPL
Signal: STRONG BUY
MACD: 2.45
Signal Line: 1.87
Histogram: 0.58
```

### Comparing Strategies

1. Click "Compare Strategies" in the sidebar
2. Enter a ticker symbol (e.g., AAPL)
3. Select time period (1w to 1y)
4. Click "Compare All Strategies"
5. View rankings table with performance metrics

**Example Output:**
```
🥇 #1  Ensemble Stacking    68.5%  [16 correct / 23 trades]
🥈 #2  ARIMA Forecast       63.2%  [19 correct / 30 trades]
🥉 #3  MACD Momentum        61.8%  [21 correct / 34 trades]
```

### Understanding Signals

**Buy Signals:**
- STRONG BUY: High confidence upward movement
- BUY: Moderate confidence upward movement
- LONG: Position recommendation (for RL strategy)
- BULLISH: Positive sentiment (for AI strategy)

**Sell Signals:**
- STRONG SELL: High confidence downward movement
- SELL: Moderate confidence downward movement
- SHORT: Position recommendation (for RL strategy)
- BEARISH: Negative sentiment (for AI strategy)

**Neutral Signals:**
- HOLD: No clear directional signal
- NEUTRAL: Market indecision

## 🏗️ Project Structure

```
quantcore-dashboard/
├── backend/
│   ├── trading_api.py           # Main FastAPI application
│   ├── requirements.txt         # Python dependencies
│   └── strategies/
│       ├── __init__.py
│       ├── base.py             # Base strategy classes
│       ├── ensemble.py         # Ensemble stacking
│       ├── reinforcement_learning.py  # Q-Learning
│       ├── wavelet.py          # Wavelet + ML
│       └── utils.py            # Utility functions
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main application
│   │   ├── components/
│   │   │   ├── CompareView.jsx      # Strategy comparison
│   │   │   ├── RLVisualizer.jsx     # RL results display
│   │   │   ├── EnsembleVisualizer.jsx
│   │   │   ├── WaveletVisualizer.jsx
│   │   │   └── SharedComponents.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── index.html
│
└── README.md
```

## 🔧 API Documentation

### Base URL
```
http://localhost:8000
```

### Endpoints

#### Get Available Strategies
```http
GET /strategies
```

**Response:**
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

#### Execute Strategy
```http
POST /execute
Content-Type: application/json

{
  "strategy_id": "macd",
  "tickers": ["AAPL"]
}
```

**Response:**
```json
{
  "strategy_name": "MACD Momentum",
  "signal": "STRONG BUY",
  "metrics": {
    "macd_value": 2.45,
    "signal_value": 1.87,
    "histogram": 0.58,
    "current_price": 178.32
  },
  "chart_data": { ... }
}
```

#### Compare Strategies
```http
POST /compare
Content-Type: application/json

{
  "ticker": "AAPL",
  "period": "1m"
}
```

**Response:**
```json
{
  "ticker": "AAPL",
  "period": "1m",
  "current_price": 178.32,
  "period_return": 5.3,
  "results": [
    {
      "strategy_id": "ensemble",
      "strategy_name": "Ensemble Stacking",
      "accuracy": 68.5,
      "win_rate": 68.5,
      "total_trades": 23,
      "correct_predictions": 16,
      "risk_level": "Medium"
    },
    ...
  ],
  "best_strategy": "Ensemble Stacking",
  "best_accuracy": 68.5
}
```

### Interactive API Docs

Visit `http://localhost:8000/docs` for interactive Swagger documentation.

## 🎨 Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **yfinance** - Yahoo Finance data fetching
- **pandas** - Data manipulation
- **numpy** - Numerical computing
- **statsmodels** - Statistical models (ARIMA, VAR, GARCH)
- **scikit-learn** - Machine learning (Random Forest)
- **transformers** - Hugging Face (FinBERT)
- **PyTorch** - Deep learning backend
- **pywavelets** - Wavelet transform

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Fetch API** - HTTP requests

## ⚠️ Important Disclaimers

### Trading Risk
- **Past performance does not guarantee future results**
- This platform is for **analysis and research only**
- Not financial or investment advice
- Always validate signals with your own research
- Consider transaction costs, slippage, and market conditions

### Backtesting Limitations
- Simplified logic compared to real trading
- No transaction costs included
- No slippage modeling
- Perfect information assumption
- Market regime changes not captured

### Responsible Use
- Use for educational purposes
- Combine multiple strategies
- Consider risk tolerance
- Never invest more than you can afford to lose
- Consult financial professionals for advice

## 📈 Performance Notes

### Speed
- Individual strategy analysis: 1-5 seconds
- Strategy comparison: 10-30 seconds (8 strategies)
- Data caching improves subsequent runs
- First run slowest (data fetching)

### Optimization Tips
1. Use shorter periods for faster comparisons
2. Historical data is cached via `@lru_cache`
3. Start with simple tickers (AAPL, MSFT)
4. Backend runs CPU-intensive tasks
5. GPU support available for FinBERT

## 🐛 Troubleshooting

### Backend Issues

**Error: "No module named 'fastapi'"**
```bash
pip install -r requirements.txt
```

**Error: "Port 8000 already in use"**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

**Error: "FinBERT model loading failed"**
- Check internet connection
- Model downloads on first run (~400MB)
- CPU mode works but slower

### Frontend Issues

**Error: "Cannot connect to backend"**
- Verify backend is running on port 8000
- Check `API_BASE_URL` in `App.jsx`
- Disable browser CORS extensions

**Error: "Module not found"**
```bash
npm install
npm run dev
```

### Data Issues

**Error: "No data found for ticker"**
- Check ticker symbol is valid
- Yahoo Finance may be rate limiting
- Try different ticker or wait

**Error: "Not enough historical data"**
- Choose shorter time period
- Different ticker may have limited history
- Requires 100+ days for most strategies

## 🔮 Future Enhancements

### Planned Features
- [ ] Portfolio backtesting
- [ ] Walk-forward analysis
- [ ] Monte Carlo simulation
- [ ] Multi-asset comparison
- [ ] Export results (CSV/PDF)
- [ ] Historical performance charts
- [ ] Strategy correlation analysis
- [ ] Real-time alerts
- [ ] Paper trading integration
- [ ] Custom strategy builder

### Community Contributions
Pull requests welcome! Areas for contribution:
- Additional trading strategies
- UI/UX improvements
- Performance optimizations
- Documentation
- Testing coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

### Issues
Report bugs or request features via [GitHub Issues](https://github.com/yourusername/quantcore/issues)

### Documentation
- [Strategy Comparison Guide](ALGO_COMPARE.md)
- [API Documentation](http://localhost:8000/docs)
- [Integration Guide](docs/INTEGRATION_GUIDE.txt)

## 🙏 Acknowledgments

- Yahoo Finance for market data
- Hugging Face for FinBERT model
- FastAPI framework
- React and Tailwind CSS communities
- Open source contributors

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ for algorithmic traders**

*Disclaimer: This software is provided "as is" without warranty. Use at your own risk.*