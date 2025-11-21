import React from 'react';
import { Waves, Activity, BarChart3 } from 'lucide-react';
import { SignalBadge, MetricCard, SimpleLineChart } from './SharedComponents';

export const WaveletVisualizer = ({ data }) => {
  if (!data) return null;
  
  const { metrics, chart_data, analysis_details } = data;
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Signal & Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-center">
          <SignalBadge signal={data.signal} />
        </div>
        <MetricCard 
          title="Expected Change" 
          value={`${metrics.expected_change > 0 ? '+' : ''}${metrics.expected_change}%`}
          subtext="Forecast vs Current"
          highlight={Math.abs(metrics.expected_change) > 2}
        />
        <MetricCard 
          title="SNR" 
          value={`${metrics.signal_to_noise_ratio} dB`}
          subtext="Signal quality"
        />
      </div>

      {/* Wavelet Decomposition Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Waves className="w-4 h-4" /> Wavelet Decomposition
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-2">Original Signal</div>
            <div className="h-32">
              <SimpleLineChart 
                data={chart_data?.original_signal || []} 
                label="Price"
                color="rgb(148, 163, 184)"
              />
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-2">Approximation (Trend)</div>
            <div className="h-32">
              <SimpleLineChart 
                data={chart_data?.approximation || []} 
                label="Low Freq"
                color="rgb(59, 130, 246)"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-2">Detail 1 (High Frequency)</div>
            <div className="h-32">
              <SimpleLineChart 
                data={chart_data?.detail_1 || []} 
                label="Noise"
                color="rgb(239, 68, 68)"
              />
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-2">Reconstructed Forecast</div>
            <div className="h-32">
              <SimpleLineChart 
                data={chart_data?.reconstructed || []} 
                label="Forecast"
                color="rgb(34, 197, 94)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Price Forecast */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard 
          title="Current Price" 
          value={`$${metrics.current_price}`}
          subtext="Today"
        />
        <MetricCard 
          title="Forecast Price" 
          value={`$${metrics.forecast_price}`}
          subtext="Next period"
          highlight={true}
        />
        <MetricCard 
          title="Trend" 
          value={metrics.trend_direction}
          subtext={`Strength: ${metrics.trend_strength}%`}
        />
      </div>

      {/* Component Analysis */}
      {analysis_details && analysis_details.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Frequency Component Forecasts
          </h4>
          <div className="space-y-2">
            {analysis_details.map((comp, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900 rounded-lg p-3">
                <span className="text-slate-300 text-sm">{comp.name}</span>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Current</div>
                    <div className="text-sm font-mono text-white">{comp.current.toFixed(4)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Forecast</div>
                    <div className="text-sm font-mono text-blue-400">{comp.forecast.toFixed(4)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Size</div>
                    <div className="text-sm font-mono text-slate-400">{comp.size}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Info */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">📊 Model Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Wavelet Type:</span>
            <span className="text-white ml-2 font-mono">{metrics.wavelet_type}</span>
          </div>
          <div>
            <span className="text-slate-400">Decomposition Levels:</span>
            <span className="text-white ml-2 font-mono">{metrics.decomposition_levels}</span>
          </div>
          <div>
            <span className="text-slate-400">Components:</span>
            <span className="text-white ml-2 font-mono">{metrics.components_analyzed}</span>
          </div>
          <div>
            <span className="text-slate-400">SNR:</span>
            <span className="text-white ml-2 font-mono">{metrics.signal_to_noise_ratio} dB</span>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h4 className="text-slate-300 font-bold mb-3">💡 Interpretation</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>• <strong>Wavelet Transform:</strong> Decomposes signal into different frequency components</li>
          <li>• <strong>Approximation:</strong> Low-frequency trend component (main price direction)</li>
          <li>• <strong>Details:</strong> High-frequency noise and short-term fluctuations</li>
          <li>• <strong>ML Prediction:</strong> Random Forest predicts each component separately</li>
          <li>• <strong>SNR:</strong> Higher signal-to-noise ratio = clearer trend, more reliable</li>
          <li>• <strong>Reconstruction:</strong> Components combined to form final forecast</li>
        </ul>
      </div>
    </div>
  );
};