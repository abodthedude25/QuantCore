import React from 'react';
import { Layers, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { SignalBadge, MetricCard, SimpleLineChart } from './SharedComponents';

export const EnsembleVisualizer = ({ data }) => {
  if (!data) return null;
  
  const { metrics, chart_data, analysis_details } = data;
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Signal & Consensus */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center">
          <SignalBadge signal={data.signal} />
        </div>
        <MetricCard 
          title="Ensemble Score" 
          value={metrics.ensemble_score}
          subtext={`Confidence: ${metrics.confidence}`}
          highlight={Math.abs(metrics.ensemble_score) > 0.3}
        />
        <MetricCard 
          title="Agreement" 
          value={`${metrics.agreement}%`}
          subtext={`${metrics.models_used} models`}
          highlight={metrics.agreement > 80}
        />
      </div>

      {/* Model Votes */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Individual Model Predictions
        </h4>
        <div className="space-y-3">
          {analysis_details?.map((model, idx) => (
            <div key={idx} className="flex items-center justify-between bg-slate-900 rounded-lg p-4">
              <div className="flex items-center gap-3">
                {model.prediction === 'BUY' && <CheckCircle className="w-5 h-5 text-green-400" />}
                {model.prediction === 'SELL' && <XCircle className="w-5 h-5 text-red-400" />}
                {model.prediction === 'HOLD' && <MinusCircle className="w-5 h-5 text-slate-400" />}
                <span className="text-slate-300 font-mono text-sm">{model.model}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded text-xs font-bold ${
                  model.prediction === 'BUY' ? 'bg-green-500/20 text-green-400' :
                  model.prediction === 'SELL' ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {model.prediction}
                </span>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Confidence</div>
                  <div className="text-sm font-bold text-white">{model.confidence}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Weight</div>
                  <div className="text-sm font-bold text-slate-300">{model.weight}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vote Distribution */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard 
          title="Buy Votes" 
          value={metrics.buy_votes}
          icon={<CheckCircle className="w-4 h-4 text-green-400" />}
        />
        <MetricCard 
          title="Sell Votes" 
          value={metrics.sell_votes}
          icon={<XCircle className="w-4 h-4 text-red-400" />}
        />
        <MetricCard 
          title="Hold Votes" 
          value={metrics.hold_votes}
          icon={<MinusCircle className="w-4 h-4 text-slate-400" />}
        />
      </div>

      {/* Price Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4">Price History (60 Days)</h4>
        <div className="bg-slate-900 rounded-lg p-4 h-48">
          <SimpleLineChart 
            data={chart_data?.price_history || []} 
            label="Price"
            color="rgb(59, 130, 246)"
          />
        </div>
        <div className="mt-4 text-sm text-slate-400">
          Current Price: <span className="text-white font-mono">${metrics.current_price}</span>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">💡 Interpretation</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>• <strong>Ensemble Method:</strong> Combines multiple algorithms to reduce individual weaknesses</li>
          <li>• <strong>Models Used:</strong> ARIMA, MACD, RSI, MA Crossover, Bollinger Bands</li>
          <li>• <strong>Weighted Voting:</strong> Each model contributes based on historical accuracy</li>
          <li>• <strong>High Agreement:</strong> When most models agree, signal is more reliable</li>
          <li>• <strong>Ensemble Score:</strong> Final combined prediction strength</li>
        </ul>
      </div>
    </div>
  );
};