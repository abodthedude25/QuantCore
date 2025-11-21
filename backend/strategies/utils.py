"""
Utility functions for trading strategies
"""
import yfinance as yf
import pandas as pd
import numpy as np
from functools import lru_cache
import requests
from bs4 import BeautifulSoup


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
    Fetches news from Google News RSS.
    """
    url = f"https://news.google.com/rss/search?q={ticker}+stock&hl=en-US&gl=US&ceid=US:en"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(url, headers=headers, timeout=5)
        
        soup = BeautifulSoup(response.content, features="xml")
        items = soup.findAll('item')

        formatted_news = []
        
        for item in items[:50]:
            title = item.title.text
            link = item.link.text
            pub_date = item.pubDate.text if item.pubDate else "Recent"
            
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


def calculate_ema(data: pd.Series, period: int) -> pd.Series:
    """Calculate Exponential Moving Average"""
    return data.ewm(span=period, adjust=False).mean()


def calculate_sma(data: pd.Series, period: int) -> pd.Series:
    """Calculate Simple Moving Average"""
    return data.rolling(window=period).mean()


def convert_to_serializable(obj):
    """Convert numpy/pandas types to native Python types for JSON serialization"""
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, (np.bool_, np.bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.Series):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_to_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(item) for item in obj]
    return obj