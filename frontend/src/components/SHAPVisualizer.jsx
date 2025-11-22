import React from 'react';
import { Brain, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Eye, BarChart3 } from 'lucide-react';

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

const ProbabilityBar = ({ label, value, color }) => (
  <div className="flex items-center gap-3">
    <div className="w-16 text-xs text-slate-400">{label}</div>
    <div className="flex-1 h-6 bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${value * 100}%` }}
      />
    </div>
    <div className="w-16 text-right font-mono text-sm text-white">
      {(value * 100).toFixed(1)}%
    </div>
  </div>
);

// SHAP Value Bar - shows both direction and magnitude
const SHAPValueBar = ({ feature, shapValue, globalImportance, maxShap }) => {
  const normalizedShap = Math.min(Math.abs(shapValue) / maxShap, 1) * 100;
  const isPositive = shapValue > 0;
  
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400 truncate w-28" title={feature}>{feature}</span>
        <span className={`text-xs font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {shapValue > 0 ? '+' : ''}{shapValue.toFixed(4)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-4 bg-slate-800 rounded relative">
          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600"></div>
          {isPositive ? (
            <div 
              className="absolute h-full bg-gradient-to-r from-green-600 to-green-400 rounded-r left-1/2"
              style={{ width: `${normalizedShap / 2}%` }}
            />
          ) : (
            <div 
              className="absolute h-full bg-gradient-to-l from-red-600 to-red-400 rounded-l"
              style={{ width: `${normalizedShap / 2}%`, right: '50%' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Feature Contribution Card
const FeatureContributionCard = ({ feature, shapValue, direction, impact }) => {
  const isPositive = direction === 'Positive';
  
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      isPositive ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
    }`}>
      <div className="flex items-center gap-2">
        {isPositive ? (
          <ArrowUpCircle className="w-5 h-5 text-green-400" />
        ) : (
          <ArrowDownCircle className="w-5 h-5 text-red-400" />
        )}
        <span className="text-sm text-slate-300">{feature}</span>
      </div>
      <div className="text-right">
        <div className={`text-sm font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {shapValue > 0 ? '+' : ''}{shapValue.toFixed(4)}
        </div>
        <div className="text-xs text-slate-500">{impact} Impact</div>
      </div>
    </div>
  );
};

export const SHAPVisualizer = ({ data }) => {
  if (!data) return null;
  
  const { metrics, chart_data, analysis_details } = data;
  const maxShap = Math.max(...(chart_data?.shap_values?.map(v => Math.abs(v)) || [1]));
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Signal & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center">
          <SignalBadge signal={data.signal} />
        </div>
        <MetricCard 
          title="Confidence" 
          value={`${(metrics.confidence * 100).toFixed(1)}%`}
          subtext="Prediction certainty"
          highlight={metrics.confidence > 0.6}
        />
        <MetricCard 
          title="Test Accuracy" 
          value={`${(metrics.test_accuracy * 100).toFixed(1)}%`}
          subtext={`Train: ${(metrics.train_accuracy * 100).toFixed(1)}%`}
        />
      </div>

      {/* Probability Distribution */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4" /> Prediction Probabilities
        </h4>
        <div className="space-y-3">
          <ProbabilityBar label="DOWN" value={metrics.prob_down} color="bg-red-500" />
          <ProbabilityBar label="HOLD" value={metrics.prob_hold} color="bg-slate-500" />
          <ProbabilityBar label="UP" value={metrics.prob_up} color="bg-green-500" />
        </div>
      </div>

      {/* Main Drivers - Positive and Negative */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h4 className="text-green-400 font-bold mb-4 flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4" /> Pushing UP
          </h4>
          <div className="space-y-2">
            {chart_data?.positive_drivers?.slice(0, 5).map((driver, idx) => (
              <div key={idx} className="flex items-center justify-between bg-green-500/10 rounded p-2">
                <span className="text-sm text-slate-300">{driver.name}</span>
                <span className="text-sm font-mono text-green-400">+{driver.value.toFixed(4)}</span>
              </div>
            ))}
            {(!chart_data?.positive_drivers || chart_data.positive_drivers.length === 0) && (
              <div className="text-slate-500 text-sm text-center py-4">No positive drivers</div>
            )}
          </div>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h4 className="text-red-400 font-bold mb-4 flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4" /> Pushing DOWN
          </h4>
          <div className="space-y-2">
            {chart_data?.negative_drivers?.slice(0, 5).map((driver, idx) => (
              <div key={idx} className="flex items-center justify-between bg-red-500/10 rounded p-2">
                <span className="text-sm text-slate-300">{driver.name}</span>
                <span className="text-sm font-mono text-red-400">{driver.value.toFixed(4)}</span>
              </div>
            ))}
            {(!chart_data?.negative_drivers || chart_data.negative_drivers.length === 0) && (
              <div className="text-slate-500 text-sm text-center py-4">No negative drivers</div>
            )}
          </div>
        </div>
      </div>

      {/* SHAP Waterfall-style Plot */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4" /> SHAP Feature Contributions (Current Prediction)
        </h4>
        <div className="mb-4 text-sm text-slate-400">
          Base value: <span className="font-mono text-white">{metrics.base_value?.toFixed(4) || 'N/A'}</span>
          <span className="mx-2">→</span>
          Predicted: <span className="font-mono text-blue-400">{metrics.prediction}</span>
        </div>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {chart_data?.feature_names?.map((name, idx) => (
            <SHAPValueBar 
              key={name}
              feature={name}
              shapValue={chart_data.shap_values[idx]}
              globalImportance={chart_data.global_importance[idx]}
              maxShap={maxShap}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-slate-400">Pushes toward BUY</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-slate-400">Pushes toward SELL</span>
          </div>
        </div>
      </div>

      {/* Global vs Local Importance */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Global Feature Importance (Mean |SHAP|)
        </h4>
        <div className="space-y-2">
          {analysis_details?.slice(0, 10).map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-28 text-xs text-slate-400 truncate">{item.feature}</div>
              <div className="flex-1 h-4 bg-slate-900 rounded overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-500"
                  style={{ width: `${(item.global_importance / (analysis_details[0]?.global_importance || 1)) * 100}%` }}
                />
              </div>
              <div className="w-20 text-right text-xs text-slate-400">
                {(item.global_importance * 100).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Contribution Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4">Feature Attribution Details</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Feature</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">Global Importance</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">Local SHAP</th>
                <th className="text-center py-2 px-3 text-slate-400 font-medium">Direction</th>
                <th className="text-center py-2 px-3 text-slate-400 font-medium">Impact</th>
              </tr>
            </thead>
            <tbody>
              {analysis_details?.slice(0, 10).map((item, idx) => (
                <tr key={idx} className="border-b border-slate-800">
                  <td className="py-2 px-3 text-slate-300">{item.feature}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">
                    {(item.global_importance * 100).toFixed(2)}%
                  </td>
                  <td className={`py-2 px-3 text-right font-mono ${
                    item.local_shap_value > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {item.local_shap_value > 0 ? '+' : ''}{item.local_shap_value.toFixed(4)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {item.direction === 'Positive' ? (
                      <span className="text-green-400">↑ Bullish</span>
                    ) : (
                      <span className="text-red-400">↓ Bearish</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.impact === 'Strong' ? 'bg-purple-500/20 text-purple-400' :
                      item.impact === 'Moderate' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {item.impact}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Drivers Summary */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
          title="Top Positive Driver" 
          value={metrics.top_positive_driver}
          subtext="Pushing toward BUY"
          icon={<ArrowUpCircle className="w-4 h-4 text-green-400" />}
        />
        <MetricCard 
          title="Top Negative Driver" 
          value={metrics.top_negative_driver}
          subtext="Pushing toward SELL"
          icon={<ArrowDownCircle className="w-4 h-4 text-red-400" />}
        />
      </div>

      {/* SHAP Explanation */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">📊 Understanding SHAP Values</h4>
        <div className="space-y-3 text-slate-400 text-sm">
          <p>
            <strong className="text-blue-400">Shapley Values</strong> come from game theory - they fairly distribute 
            the "contribution" of each feature to the prediction.
          </p>
          <ul className="space-y-2 ml-4">
            <li>• <strong>Positive SHAP:</strong> Feature is pushing the prediction toward BUY</li>
            <li>• <strong>Negative SHAP:</strong> Feature is pushing the prediction toward SELL</li>
            <li>• <strong>Magnitude:</strong> Larger values = stronger influence on this prediction</li>
            <li>• <strong>Global vs Local:</strong> Global shows overall importance; Local shows this specific prediction</li>
          </ul>
        </div>
      </div>

      {/* Regulatory Note */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
          <Eye className="w-4 h-4" /> Model Explainability for Compliance
        </h4>
        <p className="text-slate-400 text-sm">
          SHAP provides the transparency required by many regulatory frameworks (GDPR, ECOA, SR 11-7). 
          This analysis shows exactly WHY the model made its prediction, enabling audit trails and 
          bias detection in algorithmic trading decisions.
        </p>
      </div>
    </div>
  );
};