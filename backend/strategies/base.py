"""
Base strategy classes and types for trading algorithms
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


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