import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Newspaper, 
  TrendingUp,
  TrendingDown,
  Zap, 
  AlertTriangle, 
  ArrowRight,
  BarChart3,
  Server,
  LineChart,
  Gauge,
  Target,
  TrendingUpDown,
  Waves,
  Network,
  Brain,
  Layers,
  GitCompare,
  TreeDeciduous,
  Scale,
  Eye
} from 'lucide-react';

// Import visualizer components
import { RLVisualizer } from './components/RLVisualizer';
import { EnsembleVisualizer } from './components/EnsembleVisualizer';
import { WaveletVisualizer } from './components/WaveletVisualizer';
import { CompareView } from './components/CompareView';
import { RandomForestVisualizer, XGBoostVisualizer, SVMVisualizer } from './components/MLVisualizers';
import { FamaFrenchVisualizer } from './components/FamaFrenchVisualizer';
import { SHAPVisualizer } from './components/SHAPVisualizer';

// --- 1. CONFIGURATION & TYPES ---

const STATIC_STRATEGIES = [
  {
    id: 'macd',
    name: 'MACD Momentum',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Tracks momentum by comparing 12-day and 26-day exponential moving averages. Identifies trend changes and crossovers for entry/exit signals.',
    risk: 'Low',
    category: 'Technical Indicators',
    inputs: ['Target Ticker']
  },
  {
    id: 'rsi',
    name: 'RSI Oscillator',
    icon: <Gauge className="w-5 h-5" />,
    description: 'Momentum oscillator measuring speed/change of price movements on a 0-100 scale. Identifies overbought (>70) and oversold (<30) conditions.',
    risk: 'Low',
    category: 'Technical Indicators',
    inputs: ['Target Ticker']
  },
  {
    id: 'bollinger',
    name: 'Bollinger Bands',
    icon: <Target className="w-5 h-5" />,
    description: 'Volatility bands placed around a 20-day moving average using standard deviation. Price near bands indicates potential reversals.',
    risk: 'Medium',
    category: 'Technical Indicators',
    inputs: ['Target Ticker']
  },
  {
    id: 'pairs',
    name: 'Statistical Arbitrage',
    icon: <Activity className="w-5 h-5" />,
    description: 'Exploits price inefficiencies between two correlated assets using cointegration and z-score analysis.',
    risk: 'Medium',
    category: 'Statistical Models',
    inputs: ['Ticker A', 'Ticker B']
  },
  {
    id: 'sentiment',
    name: 'AI Sentiment Analysis',
    icon: <Newspaper className="w-5 h-5" />,
    description: 'Uses FinBERT (NLP) to analyze news headlines and predict short-term market sentiment and volatility.',
    risk: 'High',
    category: 'Machine Learning',
    inputs: ['Target Ticker']
  },
  {
    id: 'arima',
    name: 'ARIMA Forecast',
    icon: <TrendingUpDown className="w-5 h-5" />,
    description: 'AutoRegressive Integrated Moving Average model. Forecasts future prices using past values, trends, and errors.',
    risk: 'Medium',
    category: 'Time Series Models',
    inputs: ['Target Ticker']
  },
  {
    id: 'garch',
    name: 'GARCH Volatility',
    icon: <Waves className="w-5 h-5" />,
    description: 'Models volatility clustering where high volatility follows high volatility. Predicts future volatility regimes.',
    risk: 'Medium',
    category: 'Time Series Models',
    inputs: ['Target Ticker']
  },
  {
    id: 'var',
    name: 'VAR Multi-Asset',
    icon: <Network className="w-5 h-5" />,
    description: 'Vector Autoregression captures dynamic relationships between multiple assets. Shows Granger causality and cross-asset impacts.',
    risk: 'High',
    category: 'Time Series Models',
    inputs: ['Ticker 1', 'Ticker 2', 'Ticker 3 (optional)', 'Ticker 4 (optional)']
  },
  {
    id: 'rl',
    name: 'Q-Learning Portfolio',
    icon: <Brain className="w-5 h-5" />,
    description: 'Reinforcement learning agent that learns optimal position sizing (LONG/NEUTRAL/SHORT) through trial and error. Maximizes cumulative rewards.',
    risk: 'High',
    category: 'Advanced Algorithms',
    inputs: ['Target Ticker']
  },
  {
    id: 'ensemble',
    name: 'Ensemble Stacking',
    icon: <Layers className="w-5 h-5" />,
    description: 'Combines predictions from 5 algorithms (ARIMA, MACD, RSI, MA Crossover, Bollinger Bands) using weighted voting for robust signals.',
    risk: 'Medium',
    category: 'Advanced Algorithms',
    inputs: ['Target Ticker']
  },
  {
    id: 'wavelet',
    name: 'Wavelet + ML',
    icon: <Waves className="w-5 h-5" />,
    description: 'Decomposes price signal into frequency components (trend vs noise) using Daubechies wavelets, then applies Random Forest ML to each component.',
    risk: 'High',
    category: 'Advanced Algorithms',
    inputs: ['Target Ticker']
  },
  {
    id: 'random_forest',
    name: 'Random Forest',
    icon: <TreeDeciduous className="w-5 h-5" />,
    description: 'Ensemble of decision trees voting on price direction (UP/DOWN/HOLD). Uses technical indicators as features. Robust to overfitting.',
    risk: 'Medium',
    category: 'ML Classifiers',
    inputs: ['Target Ticker']
  },
  {
    id: 'xgboost',
    name: 'XGBoost',
    icon: <Zap className="w-5 h-5" />,
    description: 'Gradient boosting algorithm that sequentially builds trees, each correcting previous errors. Top performer in Kaggle competitions.',
    risk: 'Medium',
    category: 'ML Classifiers',
    inputs: ['Target Ticker']
  },
  {
    id: 'svm',
    name: 'SVM Classifier',
    icon: <Target className="w-5 h-5" />,
    description: 'Support Vector Machine finds optimal hyperplane to classify price movements. Uses RBF kernel for non-linear decision boundaries.',
    risk: 'Medium',
    category: 'ML Classifiers',
    inputs: ['Target Ticker']
  },
  {
    id: 'fama_french',
    name: 'Fama-French 5-Factor',
    icon: <Scale className="w-5 h-5" />,
    description: 'Academic gold standard. Explains stock returns through market risk, size, value, profitability, and investment factors. Calculates alpha.',
    risk: 'Low',
    category: 'Factor Models',
    inputs: ['Target Ticker']
  },
  {
    id: 'shap',
    name: 'SHAP Explainer',
    icon: <Eye className="w-5 h-5" />,
    description: 'Model explainability using Shapley values from game theory. Understand WHY predictions are made. Critical for regulatory compliance.',
    risk: 'Medium',
    category: 'Explainability',
    inputs: ['Target Ticker']
  }
];

// Backend API URL
const API_BASE_URL = 'http://localhost:8000';

// --- 2. SHARED UI COMPONENTS ---

const RiskBadge = ({ level }) => {
  const colors = {
    Low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    High: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[level] || colors.Medium}`}>
      {level} Risk
    </span>
  );
};

const SignalBadge = ({ signal }) => {
  const getColor = () => {
    if (signal.includes('BUY') || signal.includes('INCREASE') || signal.includes('LONG')) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (signal.includes('SELL') || signal.includes('REDUCE') || signal.includes('SHORT')) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (signal.includes('BULLISH')) return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (signal.includes('BEARISH')) return 'bg-red-500/20 text-red-400 border-red-500/50';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
  };
  
  return (
    <div className={`px-4 py-2 rounded-lg border-2 ${getColor()} font-bold text-lg flex items-center gap-2`}>
      {(signal.includes('BUY') || signal.includes('BULLISH') || signal.includes('INCREASE') || signal.includes('LONG')) && <TrendingUp className="w-5 h-5" />}
      {(signal.includes('SELL') || signal.includes('BEARISH') || signal.includes('REDUCE') || signal.includes('SHORT')) && <TrendingDown className="w-5 h-5" />}
      {signal}
    </div>
  );
};

const InputField = ({ label, value, onChange, optional }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
      {label} {optional && <span className="text-slate-600">(optional)</span>}
    </label>
    <input 
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      className="bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono focus:border-blue-500 outline-none transition-colors"
      placeholder={optional ? "Optional" : "e.g., AAPL"}
    />
  </div>
);

const MetricCard = ({ title, value, subtext, highlight = false, icon }) => (
  <div className={`p-4 rounded-xl border ${highlight ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-800 border-slate-700'}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="text-slate-400 text-xs uppercase font-bold">{title}</div>
      {icon && <div className="text-slate-500">{icon}</div>}
    </div>
    <div className={`text-2xl font-bold font-mono ${highlight ? 'text-blue-400' : 'text-white'}`}>
      {value}
    </div>
    {subtext && <div className="text-slate-500 text-xs mt-1">{subtext}</div>}
  </div>
);

const SimpleLineChart = ({ data, label, color = "rgb(59, 130, 246)" }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="w-full h-full relative">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute top-2 right-2 text-xs text-slate-500 font-mono">{label}</div>
    </div>
  );
};

// --- 3. EXISTING STRATEGY VISUALIZERS ---

const MACDVisualizer = ({ data }) => {
  if (!data) return null;
  const { metrics, chart_data } = data;
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center">
          <SignalBadge signal={data.signal} />
        </div>
        <MetricCard title="Histogram" value={metrics.histogram} subtext={`Trend: ${metrics.trend}`} highlight={Math.abs(metrics.histogram) > 1} />
        <MetricCard title="Current Price" value={`$${metrics.current_price}`} subtext="Latest Close" />
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2"><LineChart className="w-4 h-4" /> MACD Line vs Signal Line</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-48">
          <div className="bg-slate-900 rounded-lg p-4"><SimpleLineChart data={chart_data?.macd || []} label="MACD Line" color="rgb(59, 130, 246)" /></div>
          <div className="bg-slate-900 rounded-lg p-4"><SimpleLineChart data={chart_data?.signal || []} label="Signal Line" color="rgb(234, 179, 8)" /></div>
        </div>
      </div>
    </div>
  );
};

const RSIVisualizer = ({ data }) => {
  if (!data) return null;
  const { metrics, chart_data } = data;
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <SignalBadge signal={data.signal} />
          <div className="mt-4 text-sm text-slate-400">
            <div className="flex justify-between mb-2"><span>Zone:</span><span className="font-bold text-white">{metrics.zone}</span></div>
            <div className="flex justify-between"><span>Trend:</span><span className={`font-bold ${metrics.trend === 'Rising' ? 'text-green-400' : 'text-red-400'}`}>{metrics.trend}</span></div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
          <div className="text-slate-400 text-xs uppercase font-bold mb-2">RSI Value</div>
          <div className="text-5xl font-bold font-mono text-white">{metrics.rsi_value}</div>
        </div>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4"><Gauge className="w-4 h-4 inline mr-2" />RSI History</h4>
        <div className="bg-slate-900 rounded-lg p-4 h-48"><SimpleLineChart data={chart_data?.rsi || []} label="RSI" color="rgb(168, 85, 247)" /></div>
      </div>
    </div>
  );
};

const BollingerBandsVisualizer = ({ data }) => {
  if (!data) return null;
  const { metrics, chart_data } = data;
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center"><SignalBadge signal={data.signal} /></div>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard title="Position" value={metrics.position.split(' ')[0]} subtext={metrics.position} highlight={true} />
          <MetricCard title="Volatility" value={metrics.volatility} subtext={`BW: ${metrics.bandwidth}%`} />
        </div>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4">Price vs Bollinger Bands</h4>
        <div className="bg-slate-900 rounded-lg p-4 h-64"><SimpleLineChart data={chart_data?.price || []} label="Price" color="rgb(59, 130, 246)" /></div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Upper Band" value={`$${metrics.upper_band}`} />
        <MetricCard title="Middle Band" value={`$${metrics.middle_band}`} />
        <MetricCard title="Lower Band" value={`$${metrics.lower_band}`} />
        <MetricCard title="Current" value={`$${metrics.current_price}`} highlight={true} />
      </div>
    </div>
  );
};

const PairsVisualizer = ({ data }) => {
  if (!data) return null;
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center"><SignalBadge signal={data.signal} /></div>
        <MetricCard title="Z-Score" value={data.metrics?.z_score} subtext="Threshold: +/- 2.0" highlight={Math.abs(data.metrics?.z_score) > 2} />
        <MetricCard title="Correlation" value={data.metrics?.correlation} subtext="Last 6 mos" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <MetricCard title="Price A" value={`$${data.metrics?.latest_price_a}`} />
        <MetricCard title="Price B" value={`$${data.metrics?.latest_price_b}`} />
      </div>
    </div>
  );
};

const SentimentVisualizer = ({ data }) => {
  if (!data) return null;
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center"><SignalBadge signal={data.signal} /></div>
        <MetricCard title="Confidence Score" value={data.metrics?.sentiment_score} highlight={true} />
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4"><Newspaper className="w-4 h-4 inline mr-2" />Recent Analysis</h4>
        <div className="space-y-3">
          {data.analysis_details?.length > 0 ? data.analysis_details.map((item, i) => (
            <div key={i} className="flex justify-between items-start border-b border-slate-700 pb-2 last:border-0">
              <span className="text-slate-300 text-sm w-3/4">{item.headline}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${item.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' : item.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>{item.sentiment}</span>
            </div>
          )) : <div className="text-center text-slate-500 py-4">No recent news</div>}
        </div>
      </div>
    </div>
  );
};

const ARIMAVisualizer = ({ data }) => {
  if (!data) return null;
  const { metrics, chart_data } = data;
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center"><SignalBadge signal={data.signal} /></div>
        <MetricCard title="Expected Return" value={`${metrics.expected_return > 0 ? '+' : ''}${metrics.expected_return}%`} subtext="30-day forecast" highlight={Math.abs(metrics.expected_return) > 5} />
        <MetricCard title="Confidence" value={metrics.confidence} subtext={`AIC: ${metrics.model_aic}`} />
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4">Historical & Forecast</h4>
        <div className="bg-slate-900 rounded-lg p-4 h-64"><SimpleLineChart data={chart_data?.historical || []} label="Historical" color="rgb(148, 163, 184)" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Current Price" value={`$${metrics.current_price}`} subtext="Today" />
        <MetricCard title="1-Day Forecast" value={`$${metrics.forecast_1d}`} highlight={true} />
        <MetricCard title="30-Day Forecast" value={`$${metrics.forecast_30d}`} highlight={true} />
      </div>
    </div>
  );
};

const GARCHVisualizer = ({ data }) => {
  if (!data) return null;
  const { metrics, chart_data } = data;
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center"><SignalBadge signal={data.signal} /></div>
        <MetricCard title="Volatility Regime" value={metrics.regime} subtext={`Risk: ${metrics.risk_level}`} highlight={metrics.risk_level === "High"} />
        <MetricCard title="Current Vol" value={`${metrics.current_volatility}%`} subtext="20-day realized" />
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4">Volatility</h4>
        <div className="bg-slate-900 rounded-lg p-4 h-48"><SimpleLineChart data={chart_data?.realized_vol || []} label="Realized" color="rgb(148, 163, 184)" /></div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="5-Day Vol" value={`${metrics.vol_5d}%`} />
        <MetricCard title="20-Day Vol" value={`${metrics.vol_20d}%`} />
        <MetricCard title="60-Day Vol" value={`${metrics.vol_60d}%`} />
        <MetricCard title="30-Day Forecast" value={`${metrics.forecast_30d}%`} highlight={true} />
      </div>
    </div>
  );
};

const VARVisualizer = ({ data }) => {
  if (!data) return null;
  const { metrics, chart_data } = data;
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center"><SignalBadge signal={data.signal} /></div>
        <MetricCard title="Primary Ticker" value={metrics.primary_ticker} highlight={true} />
        <MetricCard title="Forecast Return" value={`${metrics.forecast_return > 0 ? '+' : ''}${metrics.forecast_return}%`} subtext="10-day prediction" />
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4">Forecast</h4>
        <div className="bg-slate-900 rounded-lg p-4 h-48"><SimpleLineChart data={chart_data?.forecast || []} label="VAR Forecast" color="rgb(59, 130, 246)" /></div>
      </div>
    </div>
  );
};

// --- 4. MAIN APP ---

export default function App() {
  const [view, setView] = useState('strategy');
  const [activeStrategyId, setActiveStrategyId] = useState('macd');
  const [inputs, setInputs] = useState(['AAPL']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState(false);

  const activeStrategy = STATIC_STRATEGIES.find(s => s.id === activeStrategyId);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) setServerStatus(true);
      } catch (err) {
        setServerStatus(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  const runAlgorithm = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const validInputs = inputs.filter(ticker => ticker.trim() !== '');
      if (validInputs.length === 0) throw new Error('Please enter at least one ticker symbol');

      const response = await fetch(`${API_BASE_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy_id: activeStrategyId, tickers: validInputs })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
      if (err.message.includes('fetch')) {
        setError('Cannot connect to backend. Make sure the Python server is running on port 8000.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDefaultInputs = (strategyId) => {
    switch(strategyId) {
      case 'pairs': return ['KO', 'PEP'];
      case 'var': return ['AAPL', 'MSFT', '', ''];
      default: return ['AAPL'];
    }
  };

  const renderVisualizer = () => {
    if (!result) return null;
    
    switch(activeStrategyId) {
      case 'macd': return <MACDVisualizer data={result} />;
      case 'rsi': return <RSIVisualizer data={result} />;
      case 'bollinger': return <BollingerBandsVisualizer data={result} />;
      case 'pairs': return <PairsVisualizer data={result} />;
      case 'sentiment': return <SentimentVisualizer data={result} />;
      case 'arima': return <ARIMAVisualizer data={result} />;
      case 'garch': return <GARCHVisualizer data={result} />;
      case 'var': return <VARVisualizer data={result} />;
      case 'rl': return <RLVisualizer data={result} />;
      case 'ensemble': return <EnsembleVisualizer data={result} />;
      case 'wavelet': return <WaveletVisualizer data={result} />;
      case 'random_forest': return <RandomForestVisualizer data={result} />;
      case 'xgboost': return <XGBoostVisualizer data={result} />;
      case 'svm': return <SVMVisualizer data={result} />;
      case 'fama_french': return <FamaFrenchVisualizer data={result} />;
      case 'shap': return <SHAPVisualizer data={result} />;
      default: return <div className="text-slate-400">Visualizer not available</div>;
    }
  };

  // Group strategies by category
  const categories = [
    'Technical Indicators',
    'Statistical Models', 
    'Machine Learning',
    'Time Series Models',
    'Advanced Algorithms',
    'ML Classifiers',
    'Factor Models',
    'Explainability'
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">Q</div>
          <div>
            <div className="font-bold text-lg tracking-tight">QuantCore</div>
            <div className="text-xs text-slate-500">Algorithm Dashboard</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {/* Compare Button */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Analysis Tools</div>
            <button
              onClick={() => { setView('compare'); setResult(null); setError(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'compare' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <GitCompare className="w-5 h-5" />
              <span className="text-sm font-medium">Compare Strategies</span>
            </button>
          </div>

          {/* Strategy Categories */}
          {categories.map(category => {
            const algos = STATIC_STRATEGIES.filter(s => s.category === category);
            if (algos.length === 0) return null;
            
            return (
              <div key={category}>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">{category}</div>
                <div className="space-y-1">
                  {algos.map(algo => (
                    <button
                      key={algo.id}
                      onClick={() => { 
                        setView('strategy');
                        setActiveStrategyId(algo.id); 
                        setResult(null);
                        setError(null);
                        setInputs(getDefaultInputs(algo.id)); 
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'strategy' && activeStrategyId === algo.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      {algo.icon}
                      <span className="text-sm font-medium">{algo.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          
          <div className="pt-4 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">System</div>
            <div className="flex items-center gap-3 px-4 py-2 text-slate-500 text-sm">
              <Server className={`w-4 h-4 ${serverStatus ? 'text-emerald-500' : 'text-red-500'}`} />
              Backend: {serverStatus ? 'Online' : 'Offline'}
            </div>
            {!serverStatus && (
              <div className="mx-2 mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                Run: python trading_api.py
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center gap-4">
            {view === 'compare' ? (
              <>
                <h2 className="text-xl font-bold text-white">Strategy Comparison</h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">Analysis Tool</span>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white">{activeStrategy?.name}</h2>
                <RiskBadge level={activeStrategy?.risk} />
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {view === 'compare' ? (
              <CompareView />
            ) : (
              <>
                <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-slate-800 rounded-xl p-6">
                  <p className="text-slate-300 leading-relaxed">{activeStrategy?.description}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    {activeStrategy?.inputs.map((label, idx) => (
                      <div key={idx} className="flex-1 w-full">
                        <InputField 
                          label={label} 
                          value={inputs[idx] || ''} 
                          onChange={(val) => {
                            const newInputs = [...inputs];
                            newInputs[idx] = val;
                            setInputs(newInputs);
                          }}
                          optional={label.includes('optional')}
                        />
                      </div>
                    ))}
                    <button 
                      onClick={runAlgorithm}
                      disabled={loading || !serverStatus}
                      className="h-[42px] px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px] justify-center shadow-lg"
                    >
                      {loading ? <Zap className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {loading ? 'Analyzing...' : 'Run Analysis'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-red-400 font-bold mb-1">Error</h4>
                      <p className="text-slate-300">{error}</p>
                    </div>
                  </div>
                )}

                {result && !error && (
                  <div className="border-t border-slate-800 pt-8">
                    {renderVisualizer()}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}