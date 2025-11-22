"""
Fama-French Multi-Factor Model Strategy
Academic gold standard for understanding stock returns
"""
import numpy as np
import pandas as pd
from fastapi import HTTPException
from typing import List
import statsmodels.api as sm
from .base import BaseStrategy, StrategyResponse
from .utils import get_historical_data, convert_to_serializable


class FamaFrenchStrategy(BaseStrategy):
    """
    Fama-French Multi-Factor Model
    - Explains stock returns using market, size, value, profitability, and investment factors
    - Calculates alpha (excess return) and factor exposures (betas)
    - Used for portfolio construction and risk analysis
    """
    
    def generate_synthetic_factors(self, market_returns, n_days):
        """
        Generate synthetic factor returns based on market conditions
        In production, use Ken French's data library for real factors
        """
        np.random.seed(42)
        
        # SMB (Small Minus Big) - Size factor
        # Small caps tend to outperform when market is volatile
        market_vol = market_returns.rolling(20).std().fillna(0.01)
        smb = np.random.normal(0.0002, 0.008, n_days) + 0.3 * market_vol.values
        
        # HML (High Minus Low) - Value factor
        # Value stocks outperform in certain regimes
        hml = np.random.normal(0.0001, 0.007, n_days) - 0.2 * market_returns.values
        
        # RMW (Robust Minus Weak) - Profitability factor
        rmw = np.random.normal(0.0002, 0.005, n_days) + 0.1 * market_returns.values
        
        # CMA (Conservative Minus Aggressive) - Investment factor
        cma = np.random.normal(0.0001, 0.004, n_days) - 0.1 * market_returns.values
        
        # Risk-free rate (approximate daily)
        rf = np.full(n_days, 0.05 / 252)  # ~5% annual rate
        
        return pd.DataFrame({
            'SMB': smb,
            'HML': hml,
            'RMW': rmw,
            'CMA': cma,
            'RF': rf
        }, index=market_returns.index)
    
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="Fama-French requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            # 1. Fetch stock data
            df = get_historical_data(ticker, period="2y")
            
            if len(df) < 252:  # At least 1 year of data
                raise ValueError("Not enough data for Fama-French (need 252+ days)")
            
            # 2. Fetch market proxy (SPY)
            market_df = get_historical_data("SPY", period="2y")
            
            # 3. Calculate returns
            stock_returns = df['Close'].pct_change().dropna()
            market_returns = market_df['Close'].pct_change().dropna()
            
            # Align dates
            common_idx = stock_returns.index.intersection(market_returns.index)
            stock_returns = stock_returns.loc[common_idx]
            market_returns = market_returns.loc[common_idx]
            
            # 4. Generate/fetch factor data
            factors = self.generate_synthetic_factors(market_returns, len(common_idx))
            factors.index = common_idx
            
            # Market excess return
            mkt_excess = market_returns - factors['RF']
            
            # Stock excess return
            stock_excess = stock_returns - factors['RF']
            
            # 5. Run Fama-French 5-Factor Regression
            X = pd.DataFrame({
                'MKT': mkt_excess,
                'SMB': factors['SMB'],
                'HML': factors['HML'],
                'RMW': factors['RMW'],
                'CMA': factors['CMA']
            })
            
            X = sm.add_constant(X)
            y = stock_excess
            
            # Remove any NaN
            valid_idx = X.dropna().index.intersection(y.dropna().index)
            X = X.loc[valid_idx]
            y = y.loc[valid_idx]
            
            model = sm.OLS(y, X).fit()
            
            # 6. Extract results
            alpha = model.params['const']
            alpha_annual = alpha * 252  # Annualize
            alpha_pvalue = model.pvalues['const']
            
            betas = {
                'MKT': model.params['MKT'],
                'SMB': model.params['SMB'],
                'HML': model.params['HML'],
                'RMW': model.params['RMW'],
                'CMA': model.params['CMA']
            }
            
            beta_pvalues = {
                'MKT': model.pvalues['MKT'],
                'SMB': model.pvalues['SMB'],
                'HML': model.pvalues['HML'],
                'RMW': model.pvalues['RMW'],
                'CMA': model.pvalues['CMA']
            }
            
            r_squared = model.rsquared
            adj_r_squared = model.rsquared_adj
            
            # 7. Interpret results
            # Alpha interpretation
            if alpha_annual > 0.05 and alpha_pvalue < 0.1:
                alpha_signal = "Positive Alpha"
                signal = "BUY"
            elif alpha_annual < -0.05 and alpha_pvalue < 0.1:
                alpha_signal = "Negative Alpha"
                signal = "SELL"
            else:
                alpha_signal = "No Significant Alpha"
                signal = "HOLD"
            
            # Factor exposure analysis
            factor_exposures = []
            for factor, beta in betas.items():
                significance = "Significant" if beta_pvalues[factor] < 0.05 else "Not Significant"
                interpretation = ""
                
                if factor == 'MKT':
                    if beta > 1.2:
                        interpretation = "Aggressive (High Market Risk)"
                    elif beta < 0.8:
                        interpretation = "Defensive (Low Market Risk)"
                    else:
                        interpretation = "Market Neutral"
                elif factor == 'SMB':
                    interpretation = "Small Cap Tilt" if beta > 0 else "Large Cap Tilt"
                elif factor == 'HML':
                    interpretation = "Value Tilt" if beta > 0 else "Growth Tilt"
                elif factor == 'RMW':
                    interpretation = "Quality Tilt" if beta > 0 else "Speculative Tilt"
                elif factor == 'CMA':
                    interpretation = "Conservative" if beta > 0 else "Aggressive Investment"
                
                factor_exposures.append({
                    "factor": factor,
                    "beta": round(float(beta), 4),
                    "p_value": round(float(beta_pvalues[factor]), 4),
                    "significance": significance,
                    "interpretation": interpretation
                })
            
            # Risk assessment
            market_beta = betas['MKT']
            if market_beta > 1.2:
                risk_level = "High"
            elif market_beta < 0.8:
                risk_level = "Low"
            else:
                risk_level = "Medium"
            
            # Expected return calculation (using current risk premia estimates)
            risk_premia = {
                'MKT': 0.06,   # 6% market risk premium
                'SMB': 0.02,   # 2% size premium
                'HML': 0.03,   # 3% value premium
                'RMW': 0.025,  # 2.5% profitability premium
                'CMA': 0.02    # 2% investment premium
            }
            
            expected_return = 0.05  # Start with risk-free rate (~5%)
            for factor, beta in betas.items():
                expected_return += beta * risk_premia[factor]
            
            # Calculate residual volatility
            residual_vol = model.resid.std() * np.sqrt(252)
            
            return StrategyResponse(
                strategy_name="Fama-French 5-Factor",
                signal=signal,
                metrics=convert_to_serializable({
                    "alpha_daily": round(float(alpha), 6),
                    "alpha_annual": round(float(alpha_annual) * 100, 2),
                    "alpha_p_value": round(float(alpha_pvalue), 4),
                    "alpha_interpretation": alpha_signal,
                    "market_beta": round(float(betas['MKT']), 3),
                    "r_squared": round(float(r_squared), 3),
                    "adj_r_squared": round(float(adj_r_squared), 3),
                    "expected_return": round(float(expected_return) * 100, 2),
                    "residual_volatility": round(float(residual_vol) * 100, 2),
                    "risk_level": risk_level,
                    "current_price": round(float(df['Close'].iloc[-1]), 2)
                }),
                chart_data=convert_to_serializable({
                    "cumulative_returns": (1 + stock_returns).cumprod().tail(252).tolist(),
                    "market_returns": (1 + market_returns).cumprod().tail(252).tolist(),
                    "residuals": model.resid.tail(60).tolist(),
                    "factor_betas": [betas[f] for f in ['MKT', 'SMB', 'HML', 'RMW', 'CMA']],
                    "factor_names": ['MKT', 'SMB', 'HML', 'RMW', 'CMA']
                }),
                analysis_details=factor_exposures
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Fama-French Error: {str(e)}")