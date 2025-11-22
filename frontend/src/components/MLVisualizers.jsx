import React from 'react';
import { TreeDeciduous, Zap, Target, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

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

const FeatureImportanceBar = ({ feature, importance, maxImportance }) => {
  const width = (importance / maxImportance) * 100;
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="w-32 text-xs text-slate-400 truncate" title={feature}>{feature}</div>
      <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="w-16 text-right font-mono text-xs text-slate-300">
        {(importance * 100).toFixed(2)}%
      </div>
    </div>
  );
};

// Random Forest Visualizer
export const RandomForestVisualizer = ({ data }) => {
  if (!data) return null;
  
  const { metrics, chart_data, analysis_details } = data;
  const maxImportance = Math.max(...(chart_data?.feature_importance || [1]));
  
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
          <TreeDeciduous className="w-4 h-4" /> Prediction Probabilities
        </h4>
        <div className="space-y-3">
          <ProbabilityBar label="DOWN" value={metrics.prob_down} color="bg-red-500" />
          <ProbabilityBar label="HOLD" value={metrics.prob_hold} color="bg-slate-500" />
          <ProbabilityBar label="UP" value={metrics.prob_up} color="bg-green-500" />
        </div>
      </div>

      {/* Feature Importance */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Feature Importance (Top 15)
        </h4>
        <div className="space-y-1">
          {chart_data?.feature_names?.map((name, idx) => (
            <FeatureImportanceBar 
              key={name}
              feature={name}
              importance={chart_data.feature_importance[idx]}
              maxImportance={maxImportance}
            />
          ))}
        </div>
      </div>

      {/* Model Info */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard 
          title="Trees" 
          value={metrics.n_trees}
          subtext="Ensemble size"
        />
        <MetricCard 
          title="Features" 
          value={metrics.n_features}
          subtext="Input dimensions"
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
          <li>• <strong>Random Forest:</strong> Ensemble of {metrics.n_trees} decision trees voting on direction</li>
          <li>• <strong>Feature Importance:</strong> Technical indicators ranked by predictive power</li>
          <li>• <strong>Confidence:</strong> Agreement among trees (higher = more reliable)</li>
          <li>• <strong>Overfitting Check:</strong> Train vs Test accuracy gap indicates generalization</li>
        </ul>
      </div>
    </div>
  );
};

// XGBoost Visualizer
export const XGBoostVisualizer = ({ data }) => {
  if (!data) return null;
  
  const { metrics, chart_data, analysis_details } = data;
  const maxImportance = Math.max(...(chart_data?.feature_importance || [1]));
  
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
          highlight={metrics.confidence > 0.55}
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
          <Zap className="w-4 h-4" /> Prediction Probabilities
        </h4>
        <div className="space-y-3">
          <ProbabilityBar label="DOWN" value={metrics.prob_down} color="bg-red-500" />
          <ProbabilityBar label="HOLD" value={metrics.prob_hold} color="bg-slate-500" />
          <ProbabilityBar label="UP" value={metrics.prob_up} color="bg-green-500" />
        </div>
      </div>

      {/* Feature Importance */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> XGBoost Feature Importance
        </h4>
        <div className="space-y-1">
          {chart_data?.feature_names?.map((name, idx) => (
            <FeatureImportanceBar 
              key={name}
              feature={name}
              importance={chart_data.feature_importance[idx]}
              maxImportance={maxImportance}
            />
          ))}
        </div>
      </div>

      {/* Model Parameters */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4">Model Hyperparameters</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold font-mono text-white">{metrics.n_estimators}</div>
            <div className="text-xs text-slate-400">Boosting Rounds</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold font-mono text-white">{metrics.max_depth}</div>
            <div className="text-xs text-slate-400">Max Depth</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold font-mono text-white">{metrics.learning_rate}</div>
            <div className="text-xs text-slate-400">Learning Rate</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold font-mono text-white">{metrics.n_features}</div>
            <div className="text-xs text-slate-400">Features</div>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">💡 Interpretation</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>• <strong>XGBoost:</strong> Gradient boosting - each tree corrects previous errors</li>
          <li>• <strong>Regularization:</strong> L1/L2 penalties prevent overfitting</li>
          <li>• <strong>Learning Rate:</strong> Controls contribution of each tree (lower = more stable)</li>
          <li>• <strong>Popular in:</strong> Kaggle competitions, financial modeling, tabular data</li>
        </ul>
      </div>
    </div>
  );
};

// SVM Visualizer
export const SVMVisualizer = ({ data }) => {
  if (!data) return null;
  
  const { metrics, chart_data, analysis_details } = data;
  const maxCorr = Math.max(...(chart_data?.feature_correlations || [1]));
  
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
          subtext={`Kernel: ${metrics.kernel}`}
          highlight={metrics.confidence > 0.55}
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
          <Target className="w-4 h-4" /> Prediction Probabilities
        </h4>
        <div className="space-y-3">
          <ProbabilityBar label="DOWN" value={metrics.prob_down} color="bg-red-500" />
          <ProbabilityBar label="HOLD" value={metrics.prob_hold} color="bg-slate-500" />
          <ProbabilityBar label="UP" value={metrics.prob_up} color="bg-green-500" />
        </div>
      </div>

      {/* Feature Correlations */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Feature Correlations with Target
        </h4>
        <div className="space-y-1">
          {chart_data?.feature_names?.map((name, idx) => (
            <FeatureImportanceBar 
              key={name}
              feature={name}
              importance={chart_data.feature_correlations[idx]}
              maxImportance={maxCorr}
            />
          ))}
        </div>
      </div>

      {/* SVM Model Info */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard 
          title="Kernel" 
          value={metrics.kernel}
          subtext="Radial Basis Function"
        />
        <MetricCard 
          title="Support Vectors" 
          value={metrics.avg_support_vectors}
          subtext="Avg per classifier"
        />
        <MetricCard 
          title="Decision Margin" 
          value={metrics.decision_margin.toFixed(3)}
          subtext="Separation confidence"
        />
      </div>

      {/* Interpretation */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">💡 Interpretation</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>• <strong>SVM:</strong> Finds optimal hyperplane separating price movements</li>
          <li>• <strong>RBF Kernel:</strong> Projects data into higher dimensions for non-linear separation</li>
          <li>• <strong>Support Vectors:</strong> Critical data points defining the decision boundary</li>
          <li>• <strong>Best for:</strong> Small-medium datasets, high-dimensional feature spaces</li>
          <li>• <strong>Theoretical Foundation:</strong> Based on Vapnik's statistical learning theory</li>
        </ul>
      </div>
    </div>
  );
};