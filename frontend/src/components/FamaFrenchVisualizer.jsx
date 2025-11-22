import React from 'react';
import { Scale, TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';

// Shared components
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

const FactorBetaBar = ({ factor, beta, interpretation, significant }) => {
  const maxBeta = 2;
  const normalizedBeta = Math.min(Math.abs(beta) / maxBeta, 1) * 100;
  const isPositive = beta > 0;
  
  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-300 font-mono text-sm">{factor}</span>
        <span className={`text-xs px-2 py-1 rounded ${significant ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
          {significant ? 'Significant' : 'Not Sig.'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden relative">
          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600"></div>
          {isPositive ? (
            <div 
              className="absolute h-full bg-green-500 left-1/2"
              style={{ width: `${normalizedBeta / 2}%` }}
            />
          ) : (
            <div 
              className="absolute h-full bg-red-500 right-1/2"
              style={{ width: `${normalizedBeta / 2}%` }}
            />
          )}
        </div>
        <span className={`font-mono font-bold w-16 text-right ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {beta > 0 ? '+' : ''}{beta.toFixed(3)}
        </span>
      </div>
      <div className="text-xs text-slate-500 mt-2">{interpretation}</div>
    </div>
  );
};

export const FamaFrenchVisualizer = ({ data }) => {
  if (!data) return null;
  
  const { metrics, chart_data, analysis_details } = data;
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Signal & Alpha */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center">
          <SignalBadge signal={data.signal} />
        </div>
        <MetricCard 
          title="Alpha (Annual)" 
          value={`${metrics.alpha_annual > 0 ? '+' : ''}${metrics.alpha_annual}%`}
          subtext={metrics.alpha_interpretation}
          highlight={Math.abs(metrics.alpha_annual) > 2}
        />
        <MetricCard 
          title="Market Beta" 
          value={metrics.market_beta}
          subtext={`R²: ${metrics.r_squared}`}
        />
      </div>

      {/* Alpha Significance */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Scale className="w-4 h-4" /> Alpha Analysis
        </h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-slate-400 text-xs uppercase mb-2">Daily Alpha</div>
            <div className={`text-3xl font-bold font-mono ${metrics.alpha_daily > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.alpha_daily > 0 ? '+' : ''}{(metrics.alpha_daily * 100).toFixed(4)}%
            </div>
            <div className="text-xs text-slate-500 mt-2">Excess return per day</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-slate-400 text-xs uppercase mb-2">Alpha P-Value</div>
            <div className="text-3xl font-bold font-mono text-white">
              {metrics.alpha_p_value.toFixed(4)}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {metrics.alpha_p_value < 0.05 ? '✓ Statistically significant' : '✗ Not significant'}
            </div>
          </div>
        </div>
      </div>

      {/* Factor Exposures */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4" /> Factor Exposures (Betas)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis_details?.map((factor, idx) => (
            <FactorBetaBar 
              key={factor.factor}
              factor={factor.factor}
              beta={factor.beta}
              interpretation={factor.interpretation}
              significant={factor.significance === 'Significant'}
            />
          ))}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Cumulative Returns vs Market (1 Year)
        </h4>
        <div className="bg-slate-900 rounded-lg p-4 h-48 relative">
          <div className="absolute inset-0">
            <SimpleLineChart 
              data={chart_data?.cumulative_returns || []} 
              label="Stock"
              color="rgb(59, 130, 246)"
            />
          </div>
          <div className="absolute inset-0" style={{ opacity: 0.5 }}>
            <SimpleLineChart 
              data={chart_data?.market_returns || []} 
              label="Market"
              color="rgb(148, 163, 184)"
            />
          </div>
        </div>
        <div className="mt-2 flex justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-400">Stock Returns</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500"></div>
            <span className="text-slate-400">Market Returns</span>
          </div>
        </div>
      </div>

      {/* Expected Return & Risk */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard 
          title="Expected Return" 
          value={`${metrics.expected_return}%`}
          subtext="Annual (factor model)"
          highlight={true}
        />
        <MetricCard 
          title="Residual Volatility" 
          value={`${metrics.residual_volatility}%`}
          subtext="Idiosyncratic risk"
        />
        <MetricCard 
          title="Risk Level" 
          value={metrics.risk_level}
          subtext={`Beta: ${metrics.market_beta}`}
        />
      </div>

      {/* Factor Definitions */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">📊 Fama-French 5 Factors</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div><strong className="text-blue-400">MKT:</strong> <span className="text-slate-400">Market excess return (beta)</span></div>
            <div><strong className="text-blue-400">SMB:</strong> <span className="text-slate-400">Small Minus Big (size factor)</span></div>
            <div><strong className="text-blue-400">HML:</strong> <span className="text-slate-400">High Minus Low (value factor)</span></div>
          </div>
          <div className="space-y-2">
            <div><strong className="text-blue-400">RMW:</strong> <span className="text-slate-400">Robust Minus Weak (profitability)</span></div>
            <div><strong className="text-blue-400">CMA:</strong> <span className="text-slate-400">Conservative Minus Aggressive (investment)</span></div>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">💡 Interpretation</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>• <strong>Alpha:</strong> Return not explained by factors - manager skill or anomaly</li>
          <li>• <strong>R-squared:</strong> How much of return is explained by the 5 factors</li>
          <li>• <strong>High Beta MKT:</strong> Aggressive stock, amplifies market moves</li>
          <li>• <strong>Positive SMB:</strong> Behaves like small cap stocks</li>
          <li>• <strong>Positive HML:</strong> Value stock characteristics</li>
          <li>• <strong>Use Case:</strong> Portfolio construction, risk attribution, performance analysis</li>
        </ul>
      </div>
    </div>
  );
};