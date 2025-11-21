import React from 'react';
import { Zap, TrendingUp, TrendingDown, Brain } from 'lucide-react';

// Shared components (these should be copied from SharedComponents.jsx)
const SignalBadge = ({ signal }) => {
  const getColor = () => {
    if (signal.includes('BUY') || signal.includes('INCREASE') || signal.includes('LONG')) 
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (signal.includes('SELL') || signal.includes('REDUCE') || signal.includes('SHORT')) 
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
  };
  
  return (
    <div className={`px-4 py-2 rounded-lg border-2 ${getColor()} font-bold text-lg flex items-center gap-2`}>
      {(signal.includes('BUY') || signal.includes('LONG') || signal.includes('INCREASE')) && <TrendingUp className="w-5 h-5" />}
      {(signal.includes('SELL') || signal.includes('SHORT') || signal.includes('REDUCE')) && <TrendingDown className="w-5 h-5" />}
      {signal}
    </div>
  );
};

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

export const RLVisualizer = ({ data }) => {
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
          title="Q-Value" 
          value={metrics.q_value}
          subtext={`Confidence: ${metrics.confidence}`}
          highlight={Math.abs(metrics.confidence) > 1}
        />
        <MetricCard 
          title="Win Rate" 
          value={`${metrics.win_rate}%`}
          subtext={`${metrics.episodes_trained} episodes`}
        />
      </div>

      {/* Cumulative Rewards Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4" /> Cumulative Rewards (Last 100 Days)
        </h4>
        <div className="bg-slate-900 rounded-lg p-4 h-48">
          <SimpleLineChart 
            data={chart_data?.cumulative_rewards || []} 
            label="Rewards"
            color="rgb(168, 85, 247)"
          />
        </div>
      </div>

      {/* Q-Values */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4">Q-Value Table (State Values)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-lg p-4 h-32">
            <SimpleLineChart 
              data={chart_data?.q_values_long || []} 
              label="LONG Q-Values"
              color="rgb(34, 197, 94)"
            />
          </div>
          <div className="bg-slate-900 rounded-lg p-4 h-32">
            <SimpleLineChart 
              data={chart_data?.q_values_short || []} 
              label="SHORT Q-Values"
              color="rgb(239, 68, 68)"
            />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard 
          title="Optimal Action" 
          value={metrics.optimal_action}
          subtext="Current Recommendation"
          highlight={true}
        />
        <MetricCard 
          title="Avg Reward" 
          value={metrics.avg_reward_30d}
          subtext="Last 30 days"
        />
        <MetricCard 
          title="Current Price" 
          value={`$${metrics.current_price}`}
        />
      </div>

      {/* Interpretation */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">💡 Interpretation</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>• <strong>Q-Learning:</strong> Learns optimal trading actions through trial and error</li>
          <li>• <strong>Actions:</strong> LONG (buy), NEUTRAL (hold cash), SHORT (sell/short)</li>
          <li>• <strong>Q-Value:</strong> Expected future reward for taking this action</li>
          <li>• <strong>Win Rate:</strong> Percentage of profitable decisions made by agent</li>
          <li>• <strong>Cumulative Reward:</strong> Total profit/loss over training period</li>
        </ul>
      </div>
    </div>
  );
};