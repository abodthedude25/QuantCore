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
  Layers
} from 'lucide-react';

// Import visualizer components
import { RLVisualizer } from './components/RLVisualizer';
import { EnsembleVisualizer } from './components/EnsembleVisualizer';
import { WaveletVisualizer } from './components/WaveletVisualizer';

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
  }
];

// Backend API URL - change this if your backend runs on a different port
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

// Simple Line Chart Component
const SimpleLineChart = ({ data, label, color = "rgb(59, 130, 246)" }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
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

// --- 3. STRATEGY VISUALIZERS ---

const MACDVisualizer = ({ data }) => {
  if (!data) return null;
  
  const { metrics, chart_data } = data;
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Signal & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center">
          <SignalBadge signal={data.signal} />
        </div>
        <MetricCard 
          title="Histogram" 
          value={metrics.histogram} 
          subtext={`Trend: ${metrics.trend}`}
          highlight={Math.abs(metrics.histogram) > 1}
        />
        <MetricCard 
          title="Current Price" 
          value={`$${metrics.current_price}`}
          subtext="Latest Close"
        />
      </div>

      {/* MACD Lines Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <LineChart className="w-4 h-4" /> MACD Line vs Signal Line
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-48">
          <div className="bg-slate-900 rounded-lg p-4">
            <SimpleLineChart 
              data={chart_data?.macd || []} 
              label="MACD Line"
              color="rgb(59, 130, 246)"
            />
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <SimpleLineChart 
              data={chart_data?.signal || []} 
              label="Signal Line"
              color="rgb(234, 179, 8)"
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-400">MACD: {metrics.macd_value}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-slate-400">Signal: {metrics.signal_value}</span>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">💡 Interpretation</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>• <strong>MACD Line:</strong> Difference between 12-day and 26-day EMA</li>
          <li>• <strong>Signal Line:</strong> 9-day EMA of MACD (triggers buy/sell)</li>
          <li>• <strong>Crossover:</strong> MACD crossing above Signal = Bullish, below = Bearish</li>
          <li>• <strong>Histogram:</strong> Distance between lines (momentum strength)</li>
        </ul>
      </div>
    </div>
  );
};

const RSIVisualizer = ({ data }) => {
  if (!data) return null;
  
  const { metrics, chart_data } = data;
  const rsi_value = metrics.rsi_value;
  
  const gaugeRotation = (rsi_value / 100) * 180 - 90;
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <SignalBadge signal={data.signal} />
          <div className="mt-4 text-sm text-slate-400">
            <div className="flex justify-between mb-2">
              <span>Zone:</span>
              <span className="font-bold text-white">{metrics.zone}</span>
            </div>
            <div className="flex justify-between">
              <span>Trend:</span>
              <span className={`font-bold ${metrics.trend === 'Rising' ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.trend}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="text-center">
            <div className="text-slate-400 text-xs uppercase font-bold mb-2">RSI Value</div>
            <div className="text-5xl font-bold font-mono text-white mb-2">{rsi_value}</div>
            
            <div className="relative w-full h-24 mt-4">
              <div className="absolute inset-x-0 bottom-0 h-12 rounded-full" style={{
                background: 'linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(234, 179, 8) 50%, rgb(239, 68, 68) 100%)'
              }}></div>
              <div className="absolute inset-x-0 bottom-0 flex justify-between px-4 text-xs text-slate-400 pt-14">
                <span>0</span>
                <span>30</span>
                <span>50</span>
                <span>70</span>
                <span>100</span>
              </div>
              <div 
                className="absolute bottom-6 left-1/2 w-1 h-8 bg-white rounded-full transform origin-bottom transition-transform duration-500"
                style={{ 
                  transform: `translateX(-50%) rotate(${gaugeRotation}deg)`,
                  left: `${rsi_value}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Gauge className="w-4 h-4" /> RSI History (60 Days)
        </h4>
        <div className="bg-slate-900 rounded-lg p-4 h-48 relative">
          <SimpleLineChart 
            data={chart_data?.rsi || []} 
            label="RSI"
            color="rgb(168, 85, 247)"
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-full border-t border-red-500/30" style={{ top: '20%' }}></div>
            <div className="absolute w-full border-t border-green-500/30" style={{ top: '80%' }}></div>
          </div>
        </div>
        <div className="mt-4 flex justify-between text-xs text-slate-400">
          <span>Oversold Zone: &lt; 30</span>
          <span>Neutral: 30-70</span>
          <span>Overbought Zone: &gt; 70</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Current Price" value={`$${metrics.current_price}`} />
        <MetricCard title="Oversold" value="< 30" subtext="Buy Zone" />
        <MetricCard title="Overbought" value="> 70" subtext="Sell Zone" />
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">💡 Interpretation</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>• <strong>RSI &lt; 30:</strong> Oversold condition - potential buying opportunity</li>
          <li>• <strong>RSI &gt; 70:</strong> Overbought condition - potential selling opportunity</li>
          <li>• <strong>RSI 40-60:</strong> Neutral zone - no clear signal</li>
          <li>• <strong>Divergences:</strong> Price making new highs/lows while RSI doesn't = reversal signal</li>
        </ul>
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
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center">
          <SignalBadge signal={data.signal} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard 
            title="Position" 
            value={metrics.position.split(' ')[0]}
            subtext={metrics.position}
            highlight={true}
          />
          <MetricCard 
            title="Volatility" 
            value={metrics.volatility}
            subtext={`BW: ${metrics.bandwidth}%`}
          />
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4" /> Price vs Bollinger Bands (60 Days)
        </h4>
        <div className="bg-slate-900 rounded-lg p-4 h-64 relative">
          <div className="relative w-full h-full">
            <div className="absolute inset-0" style={{ opacity: 0.3 }}>
              <SimpleLineChart data={chart_data?.upper || []} label="Upper" color="rgb(239, 68, 68)" />
            </div>
            <div className="absolute inset-0" style={{ opacity: 0.3 }}>
              <SimpleLineChart data={chart_data?.lower || []} label="Lower" color="rgb(34, 197, 94)" />
            </div>
            <div className="absolute inset-0">
              <SimpleLineChart data={chart_data?.middle || []} label="Middle" color="rgb(148, 163, 184)" />
            </div>
            <div className="absolute inset-0">
              <SimpleLineChart data={chart_data?.price || []} label="Price" color="rgb(59, 130, 246)" />
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-400">Upper Band</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500"></div>
            <span className="text-slate-400">Middle (SMA)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-slate-400">Lower Band</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-400">Current Price</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Upper Band" value={`$${metrics.upper_band}`} />
        <MetricCard title="Middle Band" value={`$${metrics.middle_band}`} />
        <MetricCard title="Lower Band" value={`$${metrics.lower_band}`} />
        <MetricCard title="Current" value={`$${metrics.current_price}`} highlight={true} />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">%B Indicator</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-8 rounded-full relative" style={{
              background: 'linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(234, 179, 8) 50%, rgb(239, 68, 68) 100%)'
            }}>
              <div 
                className="absolute top-0 w-1 h-8 bg-white rounded-full transition-all duration-500"
                style={{ left: `${Math.min(Math.max(metrics.percent_b * 100, 0), 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>0 (Lower)</span>
              <span>0.5 (Middle)</span>
              <span>1 (Upper)</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-white">{metrics.percent_b}</div>
            <div className="text-xs text-slate-400">%B Value</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">💡 Interpretation</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>• <strong>Near Lower Band:</strong> Oversold, potential bounce upward (BUY)</li>
          <li>• <strong>Near Upper Band:</strong> Overbought, potential reversal downward (SELL)</li>
          <li>• <strong>Bandwidth:</strong> Narrow bands = low volatility (squeeze), wide = high volatility</li>
          <li>• <strong>Bollinger Squeeze:</strong> When bands contract tightly, often precedes big price moves</li>
        </ul>
      </div>
    </div>
  );
};

const PairsVisualizer = ({ data }) => {
  if (!data) return null;
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center">
          <SignalBadge signal={data.signal} />
        </div>
        <MetricCard title="Z-Score" value={data.metrics?.z_score} subtext="Threshold: +/- 2.0" highlight={Math.abs(data.metrics?.z_score) > 2} />
        <MetricCard title="Correlation" value={data.metrics?.correlation} subtext="Last 6 mos" />
      </div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 h-64 flex items-center justify-center">
        <div className="text-center">
            <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">Z-Score Spread Chart</p>
            <p className="text-xs text-slate-500 mt-2">Current Z-Score: {data.metrics?.z_score}</p>
        </div>
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
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center">
          <SignalBadge signal={data.signal} />
        </div>
        <MetricCard title="Confidence Score" value={data.metrics?.sentiment_score} highlight={true} />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Newspaper className="w-4 h-4" /> Recent Analysis
        </h4>
        <div className="space-y-3">
          {data.analysis_details?.length > 0 ? (
            data.analysis_details.map((item, i) => (
              <div key={i} className="flex justify-between items-start border-b border-slate-700 pb-2 last:border-0">
                <span className="text-slate-300 text-sm w-3/4">{item.headline}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${item.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' : item.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  {item.sentiment}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-4">No recent news articles found</div>
          )}
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
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center">
          <SignalBadge signal={data.signal} />
        </div>
        <MetricCard 
          title="Expected Return" 
          value={`${metrics.expected_return > 0 ? '+' : ''}${metrics.expected_return}%`}
          subtext="30-day forecast"
          highlight={Math.abs(metrics.expected_return) > 5}
        />
        <MetricCard 
          title="Confidence" 
          value={metrics.confidence}
          subtext={`AIC: ${metrics.model_aic}`}
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <TrendingUpDown className="w-4 h-4" /> Historical Price & 30-Day Forecast
        </h4>
        <div className="bg-slate-900 rounded-lg p-4 h-64 relative">
          <div className="relative w-full h-full">
            <div className="absolute inset-0">
              <SimpleLineChart 
                data={chart_data?.historical || []} 
                label="Historical"
                color="rgb(148, 163, 184)"
              />
            </div>
            <div className="absolute inset-0" style={{ opacity: 0.2 }}>
              <SimpleLineChart 
                data={chart_data?.upper_bound || []} 
                label="Upper CI"
                color="rgb(34, 197, 94)"
              />
            </div>
            <div className="absolute inset-0" style={{ opacity: 0.2 }}>
              <SimpleLineChart 
                data={chart_data?.lower_bound || []} 
                label="Lower CI"
                color="rgb(239, 68, 68)"
              />
            </div>
            <div className="absolute inset-0">
              <SimpleLineChart 
                data={chart_data?.forecast || []} 
                label="Forecast"
                color="rgb(59, 130, 246)"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500"></div>
            <span className="text-slate-400">Historical Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-400">ARIMA Forecast</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard 
          title="Current Price" 
          value={`$${metrics.current_price}`}
          subtext="Today"
        />
        <MetricCard 
          title="1-Day Forecast" 
          value={`$${metrics.forecast_1d}`}
          subtext="Tomorrow"
          highlight={true}
        />
        <MetricCard 
          title="30-Day Forecast" 
          value={`$${metrics.forecast_30d}`}
          subtext="1 Month"
          highlight={true}
        />
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">📊 Model Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Model Type:</span>
            <span className="text-white ml-2 font-mono">ARIMA(1,1,1)</span>
          </div>
          <div>
            <span className="text-slate-400">AIC Score:</span>
            <span className="text-white ml-2 font-mono">{metrics.model_aic}</span>
          </div>
          <div>
            <span className="text-slate-400">BIC Score:</span>
            <span className="text-white ml-2 font-mono">{metrics.model_bic}</span>
          </div>
          <div>
            <span className="text-slate-400">Forecast Horizon:</span>
            <span className="text-white ml-2 font-mono">30 days</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">💡 Interpretation</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>• <strong>ARIMA:</strong> AutoRegressive Integrated Moving Average - models time series patterns</li>
          <li>• <strong>Forecast:</strong> Predicted price based on historical patterns and trends</li>
          <li>• <strong>Confidence Bands:</strong> Shaded area shows uncertainty range (wider = less certain)</li>
          <li>• <strong>Lower AIC/BIC:</strong> Better model fit to historical data</li>
          <li>• <strong>Limitations:</strong> Cannot predict external shocks or regime changes</li>
        </ul>
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
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center">
          <SignalBadge signal={data.signal} />
        </div>
        <MetricCard 
          title="Volatility Regime" 
          value={metrics.regime}
          subtext={`Risk: ${metrics.risk_level}`}
          highlight={metrics.risk_level === "High"}
        />
        <MetricCard 
          title="Current Vol" 
          value={`${metrics.current_volatility}%`}
          subtext="20-day realized"
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Waves className="w-4 h-4" /> Realized vs Forecast Volatility
        </h4>
        <div className="bg-slate-900 rounded-lg p-4 h-64 relative">
          <div className="relative w-full h-full">
            <div className="absolute inset-0">
              <SimpleLineChart 
                data={chart_data?.realized_vol || []} 
                label="Realized"
                color="rgb(148, 163, 184)"
              />
            </div>
            <div className="absolute inset-0">
              <SimpleLineChart 
                data={chart_data?.forecast_vol || []} 
                label="Forecast"
                color="rgb(234, 179, 8)"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500"></div>
            <span className="text-slate-400">Realized Volatility (60 days)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-slate-400">GARCH Forecast (30 days)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard 
          title="5-Day Vol" 
          value={`${metrics.vol_5d}%`}
          subtext="Very Short Term"
        />
        <MetricCard 
          title="20-Day Vol" 
          value={`${metrics.vol_20d}%`}
          subtext="Short Term"
        />
        <MetricCard 
          title="60-Day Vol" 
          value={`${metrics.vol_60d}%`}
          subtext="Medium Term"
        />
        <MetricCard 
          title="30-Day Forecast" 
          value={`${metrics.forecast_30d}%`}
          subtext="Predicted"
          highlight={true}
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4">GARCH(1,1) Model Parameters</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-slate-400 text-xs uppercase mb-2">Alpha (ARCH)</div>
            <div className="text-3xl font-bold font-mono text-white">{metrics.alpha}</div>
            <div className="text-xs text-slate-500 mt-2">
              Weight on recent shocks
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-slate-400 text-xs uppercase mb-2">Beta (GARCH)</div>
            <div className="text-3xl font-bold font-mono text-white">{metrics.beta}</div>
            <div className="text-xs text-slate-500 mt-2">
              Weight on past volatility
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-400">
          <strong>Persistence:</strong> α + β = {(metrics.alpha + metrics.beta).toFixed(4)}
          {(metrics.alpha + metrics.beta) > 0.95 && 
            <span className="ml-2 text-yellow-400">(High persistence - shocks last long)</span>
          }
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Returns Distribution (Last 60 Days)
        </h4>
        <div className="bg-slate-900 rounded-lg p-4 h-32">
          <SimpleLineChart 
            data={chart_data?.returns || []} 
            label="Daily Returns %"
            color="rgb(168, 85, 247)"
          />
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">💡 Interpretation</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>• <strong>GARCH:</strong> Captures volatility clustering - calm periods vs turbulent periods</li>
          <li>• <strong>High Volatility:</strong> Higher risk, wider price swings, reduce position size</li>
          <li>• <strong>Low Volatility:</strong> Calmer markets, potentially increase exposure</li>
          <li>• <strong>Alpha:</strong> Reaction to recent shocks (ARCH effect)</li>
          <li>• <strong>Beta:</strong> Persistence of volatility (GARCH effect)</li>
          <li>• <strong>Use Case:</strong> Risk management, options pricing, portfolio sizing</li>
        </ul>
      </div>
    </div>
  );
};

const VARVisualizer = ({ data }) => {
  if (!data) return null;
  
  const { metrics, chart_data, analysis_details } = data;
  
  const grangerData = analysis_details?.find(d => d.type === 'granger_causality')?.results || {};
  const corrData = analysis_details?.find(d => d.type === 'correlations')?.top_pairs || [];
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center">
          <SignalBadge signal={data.signal} />
        </div>
        <MetricCard 
          title="Primary Ticker" 
          value={metrics.primary_ticker}
          subtext="Lead indicator"
          highlight={true}
        />
        <MetricCard 
          title="Forecast Return" 
          value={`${metrics.forecast_return > 0 ? '+' : ''}${metrics.forecast_return}%`}
          subtext="10-day prediction"
          highlight={Math.abs(metrics.forecast_return) > 1}
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Network className="w-4 h-4" /> {metrics.primary_ticker} Forecast (10 Days)
        </h4>
        <div className="bg-slate-900 rounded-lg p-4 h-48 relative">
          <div className="relative w-full h-full">
            <div className="absolute inset-0" style={{ opacity: 0.5 }}>
              <SimpleLineChart 
                data={chart_data?.historical || []} 
                label="Historical"
                color="rgb(148, 163, 184)"
              />
            </div>
            <div className="absolute inset-0">
              <SimpleLineChart 
                data={chart_data?.forecast || []} 
                label="VAR Forecast"
                color="rgb(59, 130, 246)"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4">Multi-Asset Returns</h4>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-slate-400 text-xs uppercase mb-3">Current Returns (%)</div>
            <div className="space-y-2">
              {Object.entries(metrics.current_returns).map(([ticker, value]) => (
                <div key={ticker} className="flex justify-between items-center bg-slate-900 rounded p-2">
                  <span className="font-mono text-sm text-slate-300">{ticker}</span>
                  <span className={`font-mono font-bold ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {value > 0 ? '+' : ''}{value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs uppercase mb-3">Forecast Returns (%)</div>
            <div className="space-y-2">
              {Object.entries(metrics.forecast_returns).map(([ticker, value]) => (
                <div key={ticker} className="flex justify-between items-center bg-slate-900 rounded p-2">
                  <span className="font-mono text-sm text-slate-300">{ticker}</span>
                  <span className={`font-mono font-bold ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {value > 0 ? '+' : ''}{value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {corrData.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h4 className="text-slate-300 font-bold mb-4">Asset Correlations</h4>
          <div className="space-y-2">
            {corrData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900 rounded p-3">
                <span className="text-slate-300 font-mono">{item.pair}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.correlation > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.abs(item.correlation) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-bold w-16 text-right">{item.correlation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(grangerData).length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h4 className="text-slate-300 font-bold mb-4">Granger Causality Tests</h4>
          <div className="text-xs text-slate-400 mb-3">
            Tests whether one asset's past values help predict another's returns
          </div>
          <div className="space-y-2">
            {Object.entries(grangerData).map(([relationship, result]) => (
              <div key={relationship} className="flex items-center justify-between bg-slate-900 rounded p-3">
                <span className="text-slate-300 font-mono text-sm">{relationship}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">p-value: {result.p_value}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${result.significant ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                    {result.significant ? 'Significant' : 'Not Significant'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">📊 Model Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Model Type:</span>
            <span className="text-white ml-2 font-mono">VAR({metrics.optimal_lag})</span>
          </div>
          <div>
            <span className="text-slate-400">Optimal Lag:</span>
            <span className="text-white ml-2 font-mono">{metrics.optimal_lag} periods</span>
          </div>
        </div>
        {metrics.strongest_relationship && (
          <div className="mt-3 text-sm">
            <span className="text-slate-400">Strongest Relationship:</span>
            <span className="text-white ml-2">
              {metrics.strongest_relationship.pair} ({metrics.strongest_relationship.correlation})
            </span>
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">💡 Interpretation</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>• <strong>VAR:</strong> Captures how multiple assets influence each other over time</li>
          <li>• <strong>Granger Causality:</strong> If A→B is significant, A's past helps predict B</li>
          <li>• <strong>Correlation:</strong> Positive = move together, Negative = move opposite</li>
          <li>• <strong>Lag Order:</strong> Number of past periods used for prediction</li>
          <li>• <strong>Use Case:</strong> Portfolio construction, risk hedging, sector rotation</li>
        </ul>
      </div>
    </div>
  );
};

// --- 4. MAIN APP ---

export default function App() {
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
        if (response.ok) {
          setServerStatus(true);
        }
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
      
      if (validInputs.length === 0) {
        throw new Error('Please enter at least one ticker symbol');
      }

      const response = await fetch(`${API_BASE_URL}/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy_id: activeStrategyId,
          tickers: validInputs
        })
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
      case 'pairs':
        return ['KO', 'PEP'];
      case 'var':
        return ['AAPL', 'MSFT', '', ''];
      default:
        return ['AAPL'];
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            Q
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight">QuantCore</div>
            <div className="text-xs text-slate-500">Algorithm Dashboard</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {['Technical Indicators', 'Statistical Models', 'Machine Learning', 'Time Series Models', 'Advanced Algorithms'].map(category => {
            const algos = STATIC_STRATEGIES.filter(s => s.category === category);
            if (algos.length === 0) return null;
            
            return (
              <div key={category}>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">
                  {category}
                </div>
                <div className="space-y-1">
                  {algos.map(algo => (
                    <button
                      key={algo.id}
                      onClick={() => { 
                        setActiveStrategyId(algo.id); 
                        setResult(null);
                        setError(null);
                        setInputs(getDefaultInputs(algo.id)); 
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeStrategyId === algo.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
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
             <h2 className="text-xl font-bold text-white">{activeStrategy.name}</h2>
             <RiskBadge level={activeStrategy.risk} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            
            <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-slate-800 rounded-xl p-6">
               <p className="text-slate-300 leading-relaxed">{activeStrategy.description}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                {activeStrategy.inputs.map((label, idx) => (
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
                    {activeStrategyId === 'macd' && <MACDVisualizer data={result} />}
                    {activeStrategyId === 'rsi' && <RSIVisualizer data={result} />}
                    {activeStrategyId === 'bollinger' && <BollingerBandsVisualizer data={result} />}
                    {activeStrategyId === 'pairs' && <PairsVisualizer data={result} />}
                    {activeStrategyId === 'sentiment' && <SentimentVisualizer data={result} />}
                    {activeStrategyId === 'arima' && <ARIMAVisualizer data={result} />}
                    {activeStrategyId === 'garch' && <GARCHVisualizer data={result} />}
                    {activeStrategyId === 'var' && <VARVisualizer data={result} />}
                    {activeStrategyId === 'rl' && <RLVisualizer data={result} />}
                    {activeStrategyId === 'ensemble' && <EnsembleVisualizer data={result} />}
                    {activeStrategyId === 'wavelet' && <WaveletVisualizer data={result} />}
                </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}