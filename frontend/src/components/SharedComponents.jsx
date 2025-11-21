import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const RiskBadge = ({ level }) => {
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

export const SignalBadge = ({ signal }) => {
  const getColor = () => {
    if (signal.includes('BUY') || signal.includes('INCREASE') || signal.includes('LONG')) 
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (signal.includes('SELL') || signal.includes('REDUCE') || signal.includes('SHORT')) 
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (signal.includes('BULLISH')) 
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (signal.includes('BEARISH')) 
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
  };
  
  return (
    <div className={`px-4 py-2 rounded-lg border-2 ${getColor()} font-bold text-lg flex items-center gap-2`}>
      {(signal.includes('BUY') || signal.includes('BULLISH') || signal.includes('INCREASE') || signal.includes('LONG')) && 
        <TrendingUp className="w-5 h-5" />}
      {(signal.includes('SELL') || signal.includes('BEARISH') || signal.includes('REDUCE') || signal.includes('SHORT')) && 
        <TrendingDown className="w-5 h-5" />}
      {signal}
    </div>
  );
};

export const InputField = ({ label, value, onChange, optional }) => (
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

export const MetricCard = ({ title, value, subtext, highlight = false, icon }) => (
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

export const SimpleLineChart = ({ data, label, color = "rgb(59, 130, 246)" }) => {
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