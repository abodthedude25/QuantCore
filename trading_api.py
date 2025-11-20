import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from functools import lru_cache
import time
import requests
from bs4 import BeautifulSoup

# Data Science Imports
import yfinance as yf
import pandas as pd
import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.stattools import coint

# AI Imports
from transformers import pipeline
import torch

# ==========================================
# 1. CONFIGURATION & GLOBAL STATE
# ==========================================

app = FastAPI(title="QuantCore Production API", version="1.0.0")

# Enable CORS for your React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global ML Models (Loaded on Startup)
ml_models = {}

@app.on_event("startup")
async def load_models():
    """
    Pre-load heavy AI models into memory to ensure low latency requests.
    """
    print("--- SYSTEM STARTUP: LOADING AI MODELS ---")
    try:
        # Check if GPU is available for faster processing
        device = 0 if torch.cuda.is_available() else -1
        ml_models['finbert'] = pipeline(
            "sentiment-analysis", 
            model="ProsusAI/finbert", 
            device=device
        )
        print("✅ FinBERT Loaded Successfully")
    except Exception as e:
        print(f"❌ Error loading FinBERT: {e}")

# ==========================================
# 2. DATA INGESTION LAYER (With Caching)
# ==========================================

@lru_cache(maxsize=100)
def get_historical_data(ticker: str, period: str = "1y"):
    """
    Fetches and caches stock data. 
    Cache prevents rate-limiting from Yahoo Finance.
    """
    df = yf.download(ticker, period=period, progress=False)
    if df.empty:
        raise ValueError(f"No data found for ticker {ticker}")
    
    # Ensure we have a proper DataFrame with standard column names
    if isinstance(df.columns, pd.MultiIndex):
        # Flatten multi-index columns
        df.columns = [col[0] if isinstance(col, tuple) else col for col in df.columns]
    
    return df

def get_real_news(ticker: str):
    """
    Fetches news from Google News RSS instead of Yahoo.
    Google RSS is faster, more reliable, and doesn't rate-limit as hard.
    """
    # 1. Construct the URL (We add 'stock' to ensure financial context)
    # Example: https://news.google.com/rss/search?q=AAPL+stock
    url = f"https://news.google.com/rss/search?q={ticker}+stock&hl=en-US&gl=US&ceid=US:en"

    # 2. Fake a Browser Header (CRITICAL: Prevents 403 Forbidden errors)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(url, headers=headers, timeout=5)
        
        # 3. Parse XML (requires lxml or features='xml')
        soup = BeautifulSoup(response.content, features="xml")
        items = soup.findAll('item')

        formatted_news = []
        
        # 4. Extract top 5 articles
        for item in items[:50]:
            title = item.title.text
            link = item.link.text
            # pubDate is usually present in RSS
            pub_date = item.pubDate.text if item.pubDate else "Recent"
            
            # Clean up title (Google often adds " - Publisher Name" at the end)
            publisher = "Unknown"
            if " - " in title:
                try:
                    parts = title.rsplit(" - ", 1)
                    title = parts[0]
                    publisher = parts[1]
                except:
                    pass

            formatted_news.append({
                "title": title,
                "link": link,
                "publisher": publisher,
                "published": pub_date
            })
            
        print(f"✅ Found {len(formatted_news)} articles for {ticker}")
        return formatted_news

    except Exception as e:
        print(f"❌ News fetch error for {ticker}: {e}")
        return []

# ==========================================
# 3. STRATEGY INTERFACE (The "Plug-in" System)
# ==========================================

class StrategyResponse(BaseModel):
    strategy_name: str
    signal: str  # BUY, SELL, HOLD
    metrics: Dict[str, Any]
    chart_data: Optional[Dict[str, Any]] = None
    analysis_details: Optional[List[Dict[str, Any]]] = None

class BaseStrategy(ABC):
    @abstractmethod
    def run(self, inputs: List[str]) -> StrategyResponse:
        pass

# ==========================================
# 4. TECHNICAL INDICATOR HELPER FUNCTIONS
# ==========================================

def calculate_ema(data: pd.Series, period: int) -> pd.Series:
    """Calculate Exponential Moving Average"""
    return data.ewm(span=period, adjust=False).mean()

def calculate_sma(data: pd.Series, period: int) -> pd.Series:
    """Calculate Simple Moving Average"""
    return data.rolling(window=period).mean()

# ==========================================
# 5. ALGORITHM IMPLEMENTATIONS
# ==========================================

class MACDStrategy(BaseStrategy):
    """
    Moving Average Convergence Divergence Strategy
    Captures momentum by comparing short-term and long-term trends
    """
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="MACD requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            # 1. Fetch Data
            df = get_historical_data(ticker, period="6mo")
            
            if len(df) < 50:
                raise ValueError("Not enough data for MACD calculation (need 50+ days)")
            
            # 2. Calculate MACD Components
            close_prices = df['Close']
            
            # Standard MACD parameters
            ema_12 = calculate_ema(close_prices, 12)
            ema_26 = calculate_ema(close_prices, 26)
            
            macd_line = ema_12 - ema_26
            signal_line = calculate_ema(macd_line, 9)
            histogram = macd_line - signal_line
            
            # 3. Generate Signal - Extract scalar values
            current_macd = float(macd_line.iloc[-1])
            current_signal = float(signal_line.iloc[-1])
            current_histogram = float(histogram.iloc[-1])
            previous_histogram = float(histogram.iloc[-2])
            
            signal = "HOLD"
            signal_strength = abs(current_histogram)
            
            # Crossover detection
            if current_histogram > 0 and previous_histogram <= 0:
                signal = "STRONG BUY"  # Bullish crossover
            elif current_histogram > 0:
                signal = "BUY"  # Positive momentum
            elif current_histogram < 0 and previous_histogram >= 0:
                signal = "STRONG SELL"  # Bearish crossover
            elif current_histogram < 0:
                signal = "SELL"  # Negative momentum
            
            # 4. Prepare Chart Data (last 60 days)
            chart_length = min(60, len(macd_line))
            
            return StrategyResponse(
                strategy_name="MACD",
                signal=signal,
                metrics={
                    "macd_value": round(current_macd, 2),
                    "signal_value": round(current_signal, 2),
                    "histogram": round(current_histogram, 2),
                    "current_price": round(float(close_prices.iloc[-1]), 2),
                    "signal_strength": round(signal_strength, 2),
                    "trend": "Bullish" if current_histogram > 0 else "Bearish"
                },
                chart_data={
                    "macd": macd_line.tail(chart_length).fillna(0).tolist(),
                    "signal": signal_line.tail(chart_length).fillna(0).tolist(),
                    "histogram": histogram.tail(chart_length).fillna(0).tolist()
                }
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"MACD Algorithm Error: {str(e)}")


class RSIStrategy(BaseStrategy):
    """
    Relative Strength Index Strategy
    Identifies overbought/oversold conditions (0-100 scale)
    """
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="RSI requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            # 1. Fetch Data
            df = get_historical_data(ticker, period="6mo")
            
            if len(df) < 30:
                raise ValueError("Not enough data for RSI calculation (need 30+ days)")
            
            # 2. Calculate RSI (14-period standard)
            close_prices = df['Close']
            delta = close_prices.diff()
            
            # Separate gains and losses
            gain = delta.where(delta > 0, 0)
            loss = -delta.where(delta < 0, 0)
            
            # Calculate rolling averages
            avg_gain = gain.rolling(window=14).mean()
            avg_loss = loss.rolling(window=14).mean()
            
            # Calculate RS and RSI
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
            
            # 3. Generate Signal - Extract scalar values
            current_rsi = float(rsi.iloc[-1])
            previous_rsi = float(rsi.iloc[-2])
            
            signal = "HOLD"
            zone = "Neutral"
            
            if current_rsi < 30:
                signal = "STRONG BUY"
                zone = "Oversold"
            elif current_rsi < 40:
                signal = "BUY"
                zone = "Approaching Oversold"
            elif current_rsi > 70:
                signal = "STRONG SELL"
                zone = "Overbought"
            elif current_rsi > 60:
                signal = "SELL"
                zone = "Approaching Overbought"
            
            # Detect divergences (simplified)
            rsi_trend = "Rising" if current_rsi > previous_rsi else "Falling"
            
            # 4. Prepare Chart Data
            chart_length = min(60, len(rsi))
            
            return StrategyResponse(
                strategy_name="RSI",
                signal=signal,
                metrics={
                    "rsi_value": round(current_rsi, 2),
                    "zone": zone,
                    "trend": rsi_trend,
                    "current_price": round(float(close_prices.iloc[-1]), 2),
                    "overbought_threshold": 70,
                    "oversold_threshold": 30
                },
                chart_data={
                    "rsi": rsi.tail(chart_length).fillna(50).tolist(),
                    "price": close_prices.tail(chart_length).tolist()
                }
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"RSI Algorithm Error: {str(e)}")


class BollingerBandsStrategy(BaseStrategy):
    """
    Bollinger Bands Strategy
    Combines trend + volatility using standard deviation bands
    """
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="Bollinger Bands requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            # 1. Fetch Data
            df = get_historical_data(ticker, period="6mo")
            
            if len(df) < 30:
                raise ValueError("Not enough data for Bollinger Bands (need 30+ days)")
            
            # 2. Calculate Bollinger Bands (20-day standard)
            close_prices = df['Close']
            
            # Middle Band (SMA)
            sma_20 = calculate_sma(close_prices, 20)
            
            # Calculate standard deviation
            std_20 = close_prices.rolling(window=20).std()
            
            # Upper and Lower Bands (2 standard deviations)
            upper_band = sma_20 + (std_20 * 2)
            lower_band = sma_20 - (std_20 * 2)
            
            # 3. Calculate Band Width and %B
            band_width = ((upper_band - lower_band) / sma_20) * 100
            
            # %B tells us where price is relative to bands
            # 0 = at lower band, 0.5 = at middle, 1 = at upper band
            percent_b = (close_prices - lower_band) / (upper_band - lower_band)
            
            # 4. Generate Signal - Extract scalar values
            current_price = float(close_prices.iloc[-1])
            current_upper = float(upper_band.iloc[-1])
            current_lower = float(lower_band.iloc[-1])
            current_middle = float(sma_20.iloc[-1])
            current_percent_b = float(percent_b.iloc[-1])
            current_bandwidth = float(band_width.iloc[-1])
            
            signal = "HOLD"
            position = "Neutral"
            
            # Signal logic based on price position and volatility
            if current_percent_b < 0.2:
                signal = "STRONG BUY"
                position = "Near Lower Band"
            elif current_percent_b < 0.4:
                signal = "BUY"
                position = "Below Middle"
            elif current_percent_b > 0.8:
                signal = "STRONG SELL"
                position = "Near Upper Band"
            elif current_percent_b > 0.6:
                signal = "SELL"
                position = "Above Middle"
            
            # Volatility assessment
            volatility = "Low" if current_bandwidth < 10 else "High" if current_bandwidth > 20 else "Normal"
            
            # 5. Prepare Chart Data
            chart_length = min(60, len(close_prices))
            
            return StrategyResponse(
                strategy_name="Bollinger Bands",
                signal=signal,
                metrics={
                    "current_price": round(current_price, 2),
                    "upper_band": round(current_upper, 2),
                    "middle_band": round(current_middle, 2),
                    "lower_band": round(current_lower, 2),
                    "percent_b": round(current_percent_b, 2),
                    "bandwidth": round(current_bandwidth, 2),
                    "position": position,
                    "volatility": volatility
                },
                chart_data={
                    "price": close_prices.tail(chart_length).tolist(),
                    "upper": upper_band.tail(chart_length).fillna(0).tolist(),
                    "middle": sma_20.tail(chart_length).fillna(0).tolist(),
                    "lower": lower_band.tail(chart_length).fillna(0).tolist()
                }
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Bollinger Bands Algorithm Error: {str(e)}")


class PairsTradingStrategy(BaseStrategy):
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 2:
            raise HTTPException(status_code=400, detail="Pairs trading requires exactly 2 tickers")
        
        t1, t2 = inputs[0], inputs[1]
        
        try:
            # 1. Fetch Data
            s1_df = get_historical_data(t1)
            s2_df = get_historical_data(t2)
            
            # Extract close prices
            s1 = s1_df['Adj Close'] if 'Adj Close' in s1_df.columns else s1_df['Close']
            s2 = s2_df['Adj Close'] if 'Adj Close' in s2_df.columns else s2_df['Close']
            
            # 2. Align Data
            df = pd.concat([s1, s2], axis=1, join='inner')
            df.columns = [t1, t2]
            
            if len(df) < 30:
                raise ValueError("Not enough overlapping data points")

            # 3. Math (Cointegration & Z-Score)
            X = sm.add_constant(df[t2])
            model = sm.OLS(df[t1], X).fit()
            hedge_ratio = model.params[t2]
            
            spread = df[t1] - (hedge_ratio * df[t2])
            
            window = 60
            rolling_mean = spread.rolling(window=window).mean()
            rolling_std = spread.rolling(window=window).std()
            z_score = (spread - rolling_mean) / rolling_std
            
            current_z = float(z_score.iloc[-1])
            
            # 4. Signal Logic
            signal = "HOLD"
            if current_z > 2.0:
                signal = "SELL SPREAD"
            elif current_z < -2.0:
                signal = "BUY SPREAD"
                
            return StrategyResponse(
                strategy_name="Statistical Arbitrage",
                signal=signal,
                metrics={
                    "z_score": round(current_z, 2),
                    "hedge_ratio": round(float(hedge_ratio), 4),
                    "correlation": round(float(df[t1].corr(df[t2])), 3),
                    "latest_price_a": round(float(df[t1].iloc[-1]), 2),
                    "latest_price_b": round(float(df[t2].iloc[-1]), 2)
                },
                chart_data={
                    "zscore": z_score.tail(100).fillna(0).tolist()
                }
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Algorithm Error: {str(e)}")


class SentimentStrategy(BaseStrategy):
    def run(self, inputs: List[str]) -> StrategyResponse:
        ticker = inputs[0]
        
        if 'finbert' not in ml_models:
             raise HTTPException(status_code=503, detail="AI Model is still loading. Please wait.")

        # 1. Get Real News
        news_items = get_real_news(ticker)
        
        if not news_items:
            return StrategyResponse(
                strategy_name="FinBERT Sentiment",
                signal="NEUTRAL",
                metrics={"sentiment_score": 0, "article_count": 0},
                analysis_details=[]
            )

        # 2. Process Text - Filter out empty/None headlines
        headlines = [n['title'] for n in news_items if n.get('title') and n['title'].strip()]
        
        if not headlines:
            return StrategyResponse(
                strategy_name="FinBERT Sentiment",
                signal="NEUTRAL",
                metrics={"sentiment_score": 0, "article_count": 0},
                analysis_details=[]
            )
        
        # 3. Run AI Inference
        try:
            results = ml_models['finbert'](headlines)
        except Exception as e:
            print(f"FinBERT error: {e}")
            return StrategyResponse(
                strategy_name="FinBERT Sentiment",
                signal="NEUTRAL",
                metrics={"sentiment_score": 0, "article_count": 0, "error": "AI inference failed"},
                analysis_details=[]
            )
        
        # 4. Aggregate Scores
        total_score = 0
        details = []
        
        for i, res in enumerate(results):
            sentiment_val = 0
            if res['label'] == 'positive': sentiment_val = 1
            elif res['label'] == 'negative': sentiment_val = -1
            
            weighted_score = sentiment_val * res['score']
            total_score += weighted_score
            
            details.append({
                "headline": headlines[i],
                "sentiment": res['label'],
                "confidence": round(res['score'], 2),
                "source": news_items[i].get('publisher', 'Unknown')
            })
            
        avg_score = total_score / len(results)
        
        signal = "NEUTRAL"
        if avg_score > 0.15: signal = "BULLISH"
        if avg_score < -0.15: signal = "BEARISH"

        return StrategyResponse(
            strategy_name="FinBERT Sentiment",
            signal=signal,
            metrics={
                "sentiment_score": round(avg_score, 3),
                "article_count": len(results)
            },
            analysis_details=details
        )

# ==========================================
# 6. API ENDPOINTS
# ==========================================

strategies = {
    "pairs": PairsTradingStrategy(),
    "sentiment": SentimentStrategy(),
    "macd": MACDStrategy(),
    "rsi": RSIStrategy(),
    "bollinger": BollingerBandsStrategy()
}

class StrategyRequest(BaseModel):
    strategy_id: str
    tickers: List[str]

@app.get("/")
def health_check():
    return {"status": "online", "models_loaded": list(ml_models.keys())}

@app.get("/strategies")
def list_strategies():
    """Returns all available strategies for frontend to consume"""
    return {
        "strategies": [
            {
                "id": "macd",
                "name": "MACD Momentum",
                "category": "technical",
                "inputs": 1,
                "risk": "Low"
            },
            {
                "id": "rsi",
                "name": "RSI Oscillator",
                "category": "technical",
                "inputs": 1,
                "risk": "Low"
            },
            {
                "id": "bollinger",
                "name": "Bollinger Bands",
                "category": "technical",
                "inputs": 1,
                "risk": "Medium"
            },
            {
                "id": "pairs",
                "name": "Statistical Arbitrage",
                "category": "statistical",
                "inputs": 2,
                "risk": "Medium"
            },
            {
                "id": "sentiment",
                "name": "AI Sentiment Analysis",
                "category": "ai",
                "inputs": 1,
                "risk": "High"
            }
        ]
    }

@app.post("/execute", response_model=StrategyResponse)
def execute_strategy(req: StrategyRequest):
    if req.strategy_id not in strategies:
        raise HTTPException(status_code=404, detail="Strategy ID not found")
    
    strategy = strategies[req.strategy_id]
    return strategy.run(req.tickers)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)