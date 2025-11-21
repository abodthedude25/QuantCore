import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import warnings
warnings.filterwarnings('ignore')

# Import strategy modules
from strategies.base import StrategyResponse
from strategies.reinforcement_learning import RLPortfolioStrategy
from strategies.ensemble import EnsembleStrategy
from strategies.wavelet import WaveletMLStrategy

# Import existing strategies (inline for now, but could be modularized)
from strategies.utils import (
    get_historical_data, 
    get_real_news,
    calculate_ema,
    calculate_sma,
    convert_to_serializable
)

import yfinance as yf
import pandas as pd
import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.stattools import coint
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import grangercausalitytests
from statsmodels.tsa.vector_ar.var_model import VAR
from arch import arch_model
from transformers import pipeline
import torch
from strategies.base import BaseStrategy

# ==========================================
# CONFIGURATION & GLOBAL STATE
# ==========================================

app = FastAPI(title="QuantCore Production API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ml_models = {}

@app.on_event("startup")
async def load_models():
    print("--- SYSTEM STARTUP: LOADING AI MODELS ---")
    try:
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
# EXISTING STRATEGY IMPLEMENTATIONS
# (Keep all existing strategies working)
# ==========================================

class MACDStrategy(BaseStrategy):
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="MACD requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            df = get_historical_data(ticker, period="6mo")
            
            if len(df) < 50:
                raise ValueError("Not enough data for MACD calculation (need 50+ days)")
            
            close_prices = df['Close']
            
            ema_12 = calculate_ema(close_prices, 12)
            ema_26 = calculate_ema(close_prices, 26)
            
            macd_line = ema_12 - ema_26
            signal_line = calculate_ema(macd_line, 9)
            histogram = macd_line - signal_line
            
            current_macd = float(macd_line.iloc[-1])
            current_signal = float(signal_line.iloc[-1])
            current_histogram = float(histogram.iloc[-1])
            previous_histogram = float(histogram.iloc[-2])
            
            signal = "HOLD"
            signal_strength = abs(current_histogram)
            
            if current_histogram > 0 and previous_histogram <= 0:
                signal = "STRONG BUY"
            elif current_histogram > 0:
                signal = "BUY"
            elif current_histogram < 0 and previous_histogram >= 0:
                signal = "STRONG SELL"
            elif current_histogram < 0:
                signal = "SELL"
            
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
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="RSI requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            df = get_historical_data(ticker, period="6mo")
            
            if len(df) < 30:
                raise ValueError("Not enough data for RSI calculation (need 30+ days)")
            
            close_prices = df['Close']
            delta = close_prices.diff()
            
            gain = delta.where(delta > 0, 0)
            loss = -delta.where(delta < 0, 0)
            
            avg_gain = gain.rolling(window=14).mean()
            avg_loss = loss.rolling(window=14).mean()
            
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
            
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
            
            rsi_trend = "Rising" if current_rsi > previous_rsi else "Falling"
            
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
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="Bollinger Bands requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            df = get_historical_data(ticker, period="6mo")
            
            if len(df) < 30:
                raise ValueError("Not enough data for Bollinger Bands (need 30+ days)")
            
            close_prices = df['Close']
            
            sma_20 = calculate_sma(close_prices, 20)
            
            std_20 = close_prices.rolling(window=20).std()
            
            upper_band = sma_20 + (std_20 * 2)
            lower_band = sma_20 - (std_20 * 2)
            
            band_width = ((upper_band - lower_band) / sma_20) * 100
            
            percent_b = (close_prices - lower_band) / (upper_band - lower_band)
            
            current_price = float(close_prices.iloc[-1])
            current_upper = float(upper_band.iloc[-1])
            current_lower = float(lower_band.iloc[-1])
            current_middle = float(sma_20.iloc[-1])
            current_percent_b = float(percent_b.iloc[-1])
            current_bandwidth = float(band_width.iloc[-1])
            
            signal = "HOLD"
            position = "Neutral"
            
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
            
            volatility = "Low" if current_bandwidth < 10 else "High" if current_bandwidth > 20 else "Normal"
            
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
            s1_df = get_historical_data(t1)
            s2_df = get_historical_data(t2)
            
            s1 = s1_df['Adj Close'] if 'Adj Close' in s1_df.columns else s1_df['Close']
            s2 = s2_df['Adj Close'] if 'Adj Close' in s2_df.columns else s2_df['Close']
            
            df = pd.concat([s1, s2], axis=1, join='inner')
            df.columns = [t1, t2]
            
            if len(df) < 30:
                raise ValueError("Not enough overlapping data points")

            X = sm.add_constant(df[t2])
            model = sm.OLS(df[t1], X).fit()
            hedge_ratio = model.params[t2]
            
            spread = df[t1] - (hedge_ratio * df[t2])
            
            window = 60
            rolling_mean = spread.rolling(window=window).mean()
            rolling_std = spread.rolling(window=window).std()
            z_score = (spread - rolling_mean) / rolling_std
            
            current_z = float(z_score.iloc[-1])
            
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

        news_items = get_real_news(ticker)
        
        if not news_items:
            return StrategyResponse(
                strategy_name="FinBERT Sentiment",
                signal="NEUTRAL",
                metrics={"sentiment_score": 0, "article_count": 0},
                analysis_details=[]
            )

        headlines = [n['title'] for n in news_items if n.get('title') and n['title'].strip()]
        
        if not headlines:
            return StrategyResponse(
                strategy_name="FinBERT Sentiment",
                signal="NEUTRAL",
                metrics={"sentiment_score": 0, "article_count": 0},
                analysis_details=[]
            )
        
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


class ARIMAStrategy(BaseStrategy):
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="ARIMA requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            df = get_historical_data(ticker, period="2y")
            
            if len(df) < 100:
                raise ValueError("Not enough data for ARIMA (need 100+ days)")
            
            close_prices = df['Close']
            
            train_data = close_prices.tail(200)
            
            model = ARIMA(train_data, order=(1, 1, 1))
            fitted_model = model.fit()
            
            forecast_steps = 30
            forecast_result = fitted_model.forecast(steps=forecast_steps)
            
            forecast_df = fitted_model.get_forecast(steps=forecast_steps)
            forecast_ci = forecast_df.conf_int()
            
            current_price = float(close_prices.iloc[-1])
            forecast_price = float(forecast_result.iloc[0])
            forecast_30d = float(forecast_result.iloc[-1])
            
            expected_return = ((forecast_30d - current_price) / current_price) * 100
            
            signal = "HOLD"
            if expected_return > 5:
                signal = "STRONG BUY"
            elif expected_return > 2:
                signal = "BUY"
            elif expected_return < -5:
                signal = "STRONG SELL"
            elif expected_return < -2:
                signal = "SELL"
            
            aic = fitted_model.aic
            bic = fitted_model.bic
            
            return StrategyResponse(
                strategy_name="ARIMA Forecast",
                signal=signal,
                metrics=convert_to_serializable({
                    "current_price": round(current_price, 2),
                    "forecast_1d": round(forecast_price, 2),
                    "forecast_30d": round(forecast_30d, 2),
                    "expected_return": round(expected_return, 2),
                    "model_aic": round(aic, 2),
                    "model_bic": round(bic, 2),
                    "confidence": "High" if abs(expected_return) > 5 else "Medium" if abs(expected_return) > 2 else "Low"
                }),
                chart_data=convert_to_serializable({
                    "historical": close_prices.tail(60).tolist(),
                    "forecast": forecast_result.tolist(),
                    "upper_bound": forecast_ci.iloc[:, 1].tolist(),
                    "lower_bound": forecast_ci.iloc[:, 0].tolist()
                })
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"ARIMA Algorithm Error: {str(e)}")


class GARCHStrategy(BaseStrategy):
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="GARCH requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            df = get_historical_data(ticker, period="1y")
            
            if len(df) < 100:
                raise ValueError("Not enough data for GARCH (need 100+ days)")
            
            close_prices = df['Close']
            
            returns = close_prices.pct_change().dropna() * 100
            
            model = arch_model(returns, vol='Garch', p=1, q=1)
            fitted_model = model.fit(disp='off')
            
            forecast_steps = 30
            forecasts = fitted_model.forecast(horizon=forecast_steps)
            
            variance_forecast = forecasts.variance.values[-1, :]
            volatility_forecast = np.sqrt(variance_forecast)
            
            current_volatility = float(returns.tail(20).std())
            forecast_vol_1d = float(volatility_forecast[0])
            forecast_vol_30d = float(volatility_forecast[-1])
            avg_forecast_vol = float(volatility_forecast.mean())
            
            vol_5d = float(returns.tail(5).std())
            vol_20d = float(returns.tail(20).std())
            vol_60d = float(returns.tail(60).std())
            
            vol_percentile = (current_volatility - vol_60d) / vol_60d * 100
            
            regime = "Normal"
            risk_level = "Medium"
            
            if vol_percentile > 50:
                regime = "High Volatility"
                risk_level = "High"
            elif vol_percentile > 25:
                regime = "Elevated Volatility"
                risk_level = "Medium-High"
            elif vol_percentile < -25:
                regime = "Low Volatility"
                risk_level = "Low"
            
            signal = "HOLD"
            if forecast_vol_30d > current_volatility * 1.5:
                signal = "REDUCE EXPOSURE"
            elif forecast_vol_30d < current_volatility * 0.7:
                signal = "INCREASE EXPOSURE"
            
            return StrategyResponse(
                strategy_name="GARCH Volatility",
                signal=signal,
                metrics=convert_to_serializable({
                    "current_volatility": round(current_volatility, 2),
                    "forecast_1d": round(forecast_vol_1d, 2),
                    "forecast_30d": round(forecast_vol_30d, 2),
                    "vol_5d": round(vol_5d, 2),
                    "vol_20d": round(vol_20d, 2),
                    "vol_60d": round(vol_60d, 2),
                    "regime": regime,
                    "risk_level": risk_level,
                    "alpha": round(float(fitted_model.params['alpha[1]']), 4),
                    "beta": round(float(fitted_model.params['beta[1]']), 4)
                }),
                chart_data=convert_to_serializable({
                    "realized_vol": returns.tail(60).abs().tolist(),
                    "forecast_vol": volatility_forecast.tolist(),
                    "returns": returns.tail(60).tolist()
                })
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"GARCH Algorithm Error: {str(e)}")


class VARStrategy(BaseStrategy):
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) < 2:
            raise HTTPException(status_code=400, detail="VAR requires at least 2 tickers")
        
        if len(inputs) > 4:
            raise HTTPException(status_code=400, detail="VAR limited to 4 tickers for performance")
        
        try:
            dfs = []
            for ticker in inputs:
                df = get_historical_data(ticker, period="1y")
                close_prices = df['Close']
                returns = close_prices.pct_change().dropna() * 100
                dfs.append(returns)
            
            combined_df = pd.concat(dfs, axis=1, join='inner')
            combined_df.columns = inputs
            
            if len(combined_df) < 100:
                raise ValueError("Not enough overlapping data (need 100+ days)")
            
            combined_df = combined_df.dropna()
            
            model = VAR(combined_df)
            lag_order = model.select_order(maxlags=10)
            optimal_lag = int(lag_order.aic)
            
            fitted_model = model.fit(optimal_lag)
            
            forecast_steps = 10
            forecast = fitted_model.forecast(combined_df.values[-optimal_lag:], steps=forecast_steps)
            
            causality_results = {}
            for i, ticker_a in enumerate(inputs):
                for j, ticker_b in enumerate(inputs):
                    if i != j:
                        try:
                            test_result = grangercausalitytests(
                                combined_df[[ticker_b, ticker_a]], 
                                maxlag=optimal_lag, 
                                verbose=False
                            )
                            p_value = test_result[optimal_lag][0]['ssr_ftest'][1]
                            causality_results[f"{ticker_a}→{ticker_b}"] = {
                                "p_value": round(p_value, 4),
                                "significant": p_value < 0.05
                            }
                        except:
                            pass
            
            primary_ticker = inputs[0]
            primary_forecast = forecast[:, 0]
            
            current_returns = {ticker: round(float(combined_df[ticker].iloc[-1]), 2) for ticker in inputs}
            
            forecast_returns = {
                ticker: round(float(forecast[0, i]), 2) 
                for i, ticker in enumerate(inputs)
            }
            
            corr_matrix = combined_df.corr()
            
            avg_forecast = float(primary_forecast.mean())
            signal = "HOLD"
            
            if avg_forecast > 1.0:
                signal = "BUY"
            elif avg_forecast > 2.0:
                signal = "STRONG BUY"
            elif avg_forecast < -1.0:
                signal = "SELL"
            elif avg_forecast < -2.0:
                signal = "STRONG SELL"
            
            strongest_pairs = []
            for i, ticker_a in enumerate(inputs):
                for j, ticker_b in enumerate(inputs):
                    if i < j:
                        corr_val = corr_matrix.iloc[i, j]
                        strongest_pairs.append({
                            "pair": f"{ticker_a}-{ticker_b}",
                            "correlation": round(float(corr_val), 3)
                        })
            
            strongest_pairs.sort(key=lambda x: abs(x['correlation']), reverse=True)
            
            return StrategyResponse(
                strategy_name="VAR Multi-Asset",
                signal=signal,
                metrics=convert_to_serializable({
                    "primary_ticker": primary_ticker,
                    "forecast_return": round(avg_forecast, 2),
                    "optimal_lag": optimal_lag,
                    "current_returns": current_returns,
                    "forecast_returns": forecast_returns,
                    "strongest_relationship": strongest_pairs[0] if strongest_pairs else None
                }),
                chart_data=convert_to_serializable({
                    "forecast": primary_forecast.tolist(),
                    "historical": combined_df[primary_ticker].tail(60).tolist()
                }),
                analysis_details=convert_to_serializable([
                    {
                        "type": "granger_causality",
                        "results": causality_results
                    },
                    {
                        "type": "correlations",
                        "top_pairs": strongest_pairs[:3]
                    }
                ])
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"VAR Algorithm Error: {str(e)}")

STATIC_STRATEGIES = [
    {"id": "macd", "name": "MACD Momentum", "risk": "Low", "inputs": 1},
    {"id": "rsi", "name": "RSI Oscillator", "risk": "Low", "inputs": 1},
    {"id": "bollinger", "name": "Bollinger Bands", "risk": "Medium", "inputs": 1},
    {"id": "sentiment", "name": "AI Sentiment Analysis", "risk": "High", "inputs": 1},
    {"id": "arima", "name": "ARIMA Forecast", "risk": "Medium", "inputs": 1},
    {"id": "garch", "name": "GARCH Volatility", "risk": "Medium", "inputs": 1},
    {"id": "rl", "name": "Q-Learning Portfolio", "risk": "High", "inputs": 1},
    {"id": "ensemble", "name": "Ensemble Stacking", "risk": "Medium", "inputs": 1},
    {"id": "wavelet", "name": "Wavelet + ML", "risk": "High", "inputs": 1}
]


from datetime import datetime, timedelta
from typing import List, Dict, Any
import pandas as pd
class BacktestResult(BaseModel):
    strategy_id: str
    strategy_name: str
    signal_history: List[str]
    accuracy: float
    cumulative_return: float
    win_rate: float
    total_trades: int
    correct_predictions: int
    avg_confidence: float
    risk_level: str

class CompareRequest(BaseModel):
    ticker: str
    period: str  # "1w", "1m", "3m", "6m", "1y"

class CompareResponse(BaseModel):
    ticker: str
    period: str
    start_date: str
    end_date: str
    current_price: float
    period_return: float
    results: List[BacktestResult]
    best_strategy: str
    best_accuracy: float
    best_return: float

def backtest_strategy(strategy_id: str, strategy: BaseStrategy, ticker: str, lookback_days: int) -> BacktestResult:
    """
    Backtest a strategy over historical data
    """
    try:
        # Get historical data
        df = get_historical_data(ticker, period="2y")
        
        if len(df) < lookback_days:
            lookback_days = len(df)
        
        # Use data from lookback period
        test_data = df.tail(lookback_days)
        
        signals = []
        correct = 0
        total = 0
        confidences = []
        
        # Simple backtesting: check if signal direction matches next day's move
        for i in range(len(test_data) - 1):
            try:
                # Run strategy on current data
                result = strategy.run([ticker])
                
                signal = result.signal
                signals.append(signal)
                
                # Get confidence if available
                if hasattr(result.metrics, 'get'):
                    conf = result.metrics.get('confidence', 0.5)
                elif isinstance(result.metrics, dict):
                    conf = result.metrics.get('confidence', 0.5)
                else:
                    conf = 0.5
                confidences.append(float(conf) if isinstance(conf, (int, float)) else 0.5)
                
                # Check if prediction was correct
                current_price = test_data.iloc[i]['Close']
                next_price = test_data.iloc[i + 1]['Close']
                actual_move = 'UP' if next_price > current_price else 'DOWN'
                
                predicted_move = 'UP' if any(x in signal for x in ['BUY', 'LONG', 'BULLISH', 'INCREASE']) else 'DOWN' if any(x in signal for x in ['SELL', 'SHORT', 'BEARISH', 'REDUCE']) else 'NEUTRAL'
                
                if predicted_move != 'NEUTRAL':
                    total += 1
                    if predicted_move == actual_move:
                        correct += 1
                        
            except Exception as e:
                continue
        
        # Calculate metrics
        accuracy = (correct / total * 100) if total > 0 else 0
        win_rate = accuracy
        
        # Calculate cumulative return (simplified)
        start_price = float(test_data.iloc[0]['Close'])
        end_price = float(test_data.iloc[-1]['Close'])
        cumulative_return = ((end_price - start_price) / start_price) * 100
        
        # Get strategy metadata
        strategy_info = next((s for s in STATIC_STRATEGIES if s['id'] == strategy_id), None)
        
        return BacktestResult(
            strategy_id=strategy_id,
            strategy_name=strategy_info['name'] if strategy_info else strategy_id,
            signal_history=signals[-10:],
            accuracy=round(accuracy, 2),
            cumulative_return=round(cumulative_return, 2),
            win_rate=round(win_rate, 2),
            total_trades=total,
            correct_predictions=correct,
            avg_confidence=round(sum(confidences) / len(confidences) if confidences else 0, 2),
            risk_level=strategy_info['risk'] if strategy_info else 'Medium'
        )
        
    except Exception as e:
        print(f"Backtest error for {strategy_id}: {e}")
        strategy_info = next((s for s in STATIC_STRATEGIES if s['id'] == strategy_id), None)
        return BacktestResult(
            strategy_id=strategy_id,
            strategy_name=strategy_info['name'] if strategy_info else strategy_id,
            signal_history=[],
            accuracy=0,
            cumulative_return=0,
            win_rate=0,
            total_trades=0,
            correct_predictions=0,
            avg_confidence=0,
            risk_level=strategy_info['risk'] if strategy_info else 'Medium'
        )

# ==========================================
# API ENDPOINTS
# ==========================================

strategies = {
    "pairs": PairsTradingStrategy(),
    "sentiment": SentimentStrategy(),
    "macd": MACDStrategy(),
    "rsi": RSIStrategy(),
    "bollinger": BollingerBandsStrategy(),
    "arima": ARIMAStrategy(),
    "garch": GARCHStrategy(),
    "var": VARStrategy(),
    "rl": RLPortfolioStrategy(),
    "ensemble": EnsembleStrategy(),
    "wavelet": WaveletMLStrategy()
}

class StrategyRequest(BaseModel):
    strategy_id: str
    tickers: List[str]

@app.get("/")
def health_check():
    return {"status": "online", "models_loaded": list(ml_models.keys()), "version": "2.0.0"}

@app.get("/strategies")
def list_strategies():
    return {
        "strategies": [
            {"id": "macd", "name": "MACD Momentum", "category": "technical", "inputs": 1, "risk": "Low"},
            {"id": "rsi", "name": "RSI Oscillator", "category": "technical", "inputs": 1, "risk": "Low"},
            {"id": "bollinger", "name": "Bollinger Bands", "category": "technical", "inputs": 1, "risk": "Medium"},
            {"id": "pairs", "name": "Statistical Arbitrage", "category": "statistical", "inputs": 2, "risk": "Medium"},
            {"id": "sentiment", "name": "AI Sentiment Analysis", "category": "ai", "inputs": 1, "risk": "High"},
            {"id": "arima", "name": "ARIMA Forecast", "category": "timeseries", "inputs": 1, "risk": "Medium"},
            {"id": "garch", "name": "GARCH Volatility", "category": "timeseries", "inputs": 1, "risk": "Medium"},
            {"id": "var", "name": "VAR Multi-Asset", "category": "timeseries", "inputs": "2-4", "risk": "High"},
            {"id": "rl", "name": "Q-Learning Portfolio", "category": "advanced", "inputs": 1, "risk": "High"},
            {"id": "ensemble", "name": "Ensemble Stacking", "category": "advanced", "inputs": 1, "risk": "Medium"},
            {"id": "wavelet", "name": "Wavelet + ML", "category": "advanced", "inputs": 1, "risk": "High"}
        ]
    }

@app.post("/execute", response_model=StrategyResponse)
def execute_strategy(req: StrategyRequest):
    if req.strategy_id not in strategies:
        raise HTTPException(status_code=404, detail="Strategy ID not found")
    
    strategy = strategies[req.strategy_id]
    return strategy.run(req.tickers)


@app.post("/compare", response_model=CompareResponse)
async def compare_strategies(req: CompareRequest):
    """
    Compare all applicable trading strategies for a given ticker
    """
    ticker = req.ticker
    period = req.period
    
    # Map period to days
    period_map = {
        "1w": 7,
        "1m": 30,
        "3m": 90,
        "6m": 180,
        "1y": 365
    }
    
    lookback_days = period_map.get(period, 30)
    
    try:
        # Get price data for the period
        df = get_historical_data(ticker, period="2y")
        
        if len(df) < lookback_days:
            raise HTTPException(status_code=400, detail="Not enough historical data")
        
        period_data = df.tail(lookback_days)
        start_price = float(period_data.iloc[0]['Close'])
        end_price = float(period_data.iloc[-1]['Close'])
        period_return = ((end_price - start_price) / start_price) * 100
        
        # Get all single-ticker strategies
        single_ticker_strategies = [
            ("macd", strategies["macd"]),
            ("rsi", strategies["rsi"]),
            ("bollinger", strategies["bollinger"]),
            ("arima", strategies["arima"]),
            ("garch", strategies["garch"]),
            ("rl", strategies["rl"]),
            ("ensemble", strategies["ensemble"]),
            ("wavelet", strategies["wavelet"])
        ]
        
        # Backtest each strategy
        results = []
        for strategy_id, strategy in single_ticker_strategies:
            result = backtest_strategy(strategy_id, strategy, ticker, lookback_days)
            results.append(result)
        
        # Find best strategy by accuracy
        best_by_accuracy = max(results, key=lambda x: x.accuracy)
        best_by_return = max(results, key=lambda x: abs(x.cumulative_return))
        
        # Calculate composite score for each result (without modifying the object)
        results_with_scores = []
        for result in results:
            composite_score = (result.accuracy * 0.6) + (abs(result.cumulative_return) * 0.4)
            results_with_scores.append((result, composite_score))
        
        # Find best overall by composite score
        best_overall_tuple = max(results_with_scores, key=lambda x: x[1])
        best_overall = best_overall_tuple[0]
        
        return CompareResponse(
            ticker=ticker,
            period=period,
            start_date=period_data.index[0].strftime("%Y-%m-%d"),
            end_date=period_data.index[-1].strftime("%Y-%m-%d"),
            current_price=round(end_price, 2),
            period_return=round(period_return, 2),
            results=sorted(results, key=lambda x: x.accuracy, reverse=True),
            best_strategy=best_overall.strategy_name,
            best_accuracy=round(best_by_accuracy.accuracy, 2),
            best_return=round(best_by_return.cumulative_return, 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)