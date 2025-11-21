"""
Reinforcement Learning Trading Strategy
Uses Q-Learning for portfolio position management
"""
import numpy as np
import pandas as pd
from fastapi import HTTPException
from typing import List
from .base import BaseStrategy, StrategyResponse
from .utils import get_historical_data, convert_to_serializable


class RLPortfolioStrategy(BaseStrategy):
    """
    Q-Learning Portfolio Manager
    Learns optimal position sizing (Long, Neutral, Short) based on market states
    """
    
    def __init__(self):
        # Q-Learning parameters
        self.states = 10  # Discretized market states (momentum bins)
        self.actions = 3  # 0: Short, 1: Neutral, 2: Long
        self.learning_rate = 0.1
        self.discount_factor = 0.95
        self.epsilon = 0.1  # Exploration rate
    
    def discretize_state(self, returns, volatility):
        """
        Convert continuous market features into discrete state
        State based on momentum (returns) and volatility
        """
        # Discretize returns into 10 bins
        if returns > 0.02:
            return min(9, 5 + int(returns * 100))  # Strong positive
        elif returns < -0.02:
            return max(0, 5 + int(returns * 100))  # Strong negative
        else:
            return 5  # Neutral
    
    def run(self, inputs: List[str]) -> StrategyResponse:
        if len(inputs) != 1:
            raise HTTPException(status_code=400, detail="RL Strategy requires exactly 1 ticker")
        
        ticker = inputs[0]
        
        try:
            # 1. Fetch Data
            df = get_historical_data(ticker, period="1y")
            
            if len(df) < 100:
                raise ValueError("Not enough data for RL training (need 100+ days)")
            
            close_prices = df['Close']
            
            # 2. Calculate features
            returns = close_prices.pct_change()
            volatility = returns.rolling(window=20).std()
            momentum = returns.rolling(window=10).mean()
            
            # 3. Initialize Q-Table
            q_table = np.zeros((self.states, self.actions))
            
            # 4. Train Q-Learning Agent
            episode_rewards = []
            position_history = []
            
            for i in range(30, len(close_prices) - 1):
                # Current state
                current_return = float(momentum.iloc[i])
                current_vol = float(volatility.iloc[i]) if not pd.isna(volatility.iloc[i]) else 0.01
                state = self.discretize_state(current_return, current_vol)
                
                # Choose action (epsilon-greedy)
                if np.random.random() < self.epsilon:
                    action = np.random.randint(self.actions)
                else:
                    action = np.argmax(q_table[state])
                
                # Execute action and observe reward
                next_return = float(close_prices.iloc[i + 1] / close_prices.iloc[i] - 1)
                
                # Reward function: position * return - transaction cost
                if action == 0:  # Short
                    reward = -next_return - 0.001
                elif action == 1:  # Neutral
                    reward = 0
                else:  # Long
                    reward = next_return - 0.001
                
                # Next state
                next_state_return = float(momentum.iloc[i + 1]) if i + 1 < len(momentum) else current_return
                next_state = self.discretize_state(next_state_return, current_vol)
                
                # Q-Learning update
                old_q = q_table[state, action]
                next_max = np.max(q_table[next_state])
                new_q = old_q + self.learning_rate * (reward + self.discount_factor * next_max - old_q)
                q_table[state, action] = new_q
                
                episode_rewards.append(reward)
                position_history.append(action)
            
            # 5. Generate current signal
            current_return = float(momentum.iloc[-1])
            current_vol = float(volatility.iloc[-1]) if not pd.isna(volatility.iloc[-1]) else 0.01
            current_state = self.discretize_state(current_return, current_vol)
            optimal_action = np.argmax(q_table[current_state])
            
            action_map = {0: "SHORT", 1: "HOLD", 2: "LONG"}
            signal = action_map[optimal_action]
            
            # 6. Calculate performance metrics
            cumulative_reward = np.sum(episode_rewards)
            avg_reward = np.mean(episode_rewards[-30:])  # Last 30 days
            win_rate = np.sum([1 for r in episode_rewards if r > 0]) / len(episode_rewards) * 100
            
            # Q-value confidence
            q_values = q_table[current_state]
            confidence = (np.max(q_values) - np.mean(q_values)) / (np.std(q_values) + 0.001)
            
            return StrategyResponse(
                strategy_name="RL Q-Learning",
                signal=signal,
                metrics=convert_to_serializable({
                    "optimal_action": action_map[optimal_action],
                    "q_value": round(float(q_values[optimal_action]), 4),
                    "confidence": round(float(confidence), 2),
                    "cumulative_reward": round(float(cumulative_reward), 4),
                    "avg_reward_30d": round(float(avg_reward), 4),
                    "win_rate": round(float(win_rate), 2),
                    "current_price": round(float(close_prices.iloc[-1]), 2),
                    "episodes_trained": len(episode_rewards)
                }),
                chart_data=convert_to_serializable({
                    "cumulative_rewards": np.cumsum(episode_rewards[-100:]).tolist(),
                    "q_values_long": q_table[:, 2].tolist(),
                    "q_values_short": q_table[:, 0].tolist(),
                    "position_history": position_history[-100:]
                })
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"RL Algorithm Error: {str(e)}")