"""
Trading Strategies Package
"""
from .base import BaseStrategy, StrategyResponse
from .reinforcement_learning import RLPortfolioStrategy
from .ensemble import EnsembleStrategy
from .wavelet import WaveletMLStrategy
from .random_forest import RandomForestStrategy
from .xgboost_strategy import XGBoostStrategy
from .svm import SVMStrategy
from .fama_french import FamaFrenchStrategy
from .shap_explainer import SHAPExplainerStrategy

__all__ = [
    'BaseStrategy',
    'StrategyResponse',
    'RLPortfolioStrategy',
    'EnsembleStrategy',
    'WaveletMLStrategy',
    'RandomForestStrategy',
    'XGBoostStrategy',
    'SVMStrategy',
    'FamaFrenchStrategy',
    'SHAPExplainerStrategy'
]