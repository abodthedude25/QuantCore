import React, { useState } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  BarChart3,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const PeriodButton = ({ period, label, active, onClick }) => (
  <button
    onClick={() => onClick(period)}
    className={`px-4 py-2 rounded-lg font-medium transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg' 
        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
    }`}
  >
    {label}
  </button>
);

const PerformanceBar = ({ value, max }) => {
  const percentage = Math.min((Math.abs(value) / max) * 100, 100);
  const isPositive = value >= 0;
  
  return (
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-500 ${
          isPositive ? 'bg-green-500' : 'bg-red-500'
        }`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

const RankBadge = ({ rank }) => {
  const colors = {
    1: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    2: 'bg-slate-400/20 text-slate-300 border-slate-400/50',
    3: 'bg-orange-500/20 text-orange-400 border-orange-500/50'
  };
  
  const icons = {
    1: '🥇',
    2: '🥈',
    3: '🥉'
  };
  
  if (rank > 3) return null;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-bold ${colors[rank]}`}>
      {icons[rank]} #{rank}
    </span>
  );
};

export const CompareView = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [period, setPeriod] = useState('1m');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const runComparison = async () => {
    if (!ticker.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`${API_BASE_URL}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          period: period
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Comparison failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Comparison Error:', err);
      setError(err.message || 'Failed to compare strategies');
    } finally {
      setLoading(false);
    }
  };

  const maxAccuracy = results ? Math.max(...results.results.map(r => r.accuracy)) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-white">Strategy Comparison</h2>
        </div>
        <p className="text-slate-400">
          Compare all trading algorithms and discover which performs best over your selected time period
        </p>
      </div>

      {/* Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ticker Input */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Ticker Symbol
            </label>
            <input 
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white font-mono text-lg focus:border-blue-500 outline-none transition-colors"
              placeholder="e.g., AAPL"
            />
          </div>

          {/* Period Selection */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Time Period
            </label>
            <div className="flex gap-2 flex-wrap">
              <PeriodButton period="1w" label="1 Week" active={period === '1w'} onClick={setPeriod} />
              <PeriodButton period="1m" label="1 Month" active={period === '1m'} onClick={setPeriod} />
              <PeriodButton period="3m" label="3 Months" active={period === '3m'} onClick={setPeriod} />
              <PeriodButton period="6m" label="6 Months" active={period === '6m'} onClick={setPeriod} />
              <PeriodButton period="1y" label="1 Year" active={period === '1y'} onClick={setPeriod} />
            </div>
          </div>
        </div>

        {/* Run Button */}
        <button 
          onClick={runComparison}
          disabled={loading}
          className="mt-6 w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? (
            <>
              <Zap className="w-5 h-5 animate-spin" />
              Running Comparison...
            </>
          ) : (
            <>
              <BarChart3 className="w-5 h-5" />
              Compare All Strategies
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-red-400 font-bold mb-1">Error</h4>
            <p className="text-slate-300">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase font-bold mb-2">Ticker</div>
              <div className="text-2xl font-bold font-mono text-white">{results.ticker}</div>
              <div className="text-xs text-slate-500 mt-1">Current: ${results.current_price}</div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase font-bold mb-2">Period Return</div>
              <div className={`text-2xl font-bold font-mono ${results.period_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {results.period_return > 0 ? '+' : ''}{results.period_return}%
              </div>
              <div className="text-xs text-slate-500 mt-1">{results.start_date} to {results.end_date}</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-4">
              <div className="text-yellow-400 text-xs uppercase font-bold mb-2 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Best Strategy
              </div>
              <div className="text-xl font-bold text-white">{results.best_strategy}</div>
              <div className="text-xs text-yellow-300 mt-1">{results.best_accuracy}% accuracy</div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase font-bold mb-2">Strategies Tested</div>
              <div className="text-2xl font-bold font-mono text-white">{results.results.length}</div>
              <div className="text-xs text-slate-500 mt-1">Single-ticker algorithms</div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Performance Rankings
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Ranked by prediction accuracy over the selected period
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Strategy
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Accuracy
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Win Rate
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Total Trades
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Correct Predictions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {results.results.map((result, index) => (
                    <tr 
                      key={result.strategy_id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        index === 0 ? 'bg-yellow-500/5' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RankBadge rank={index + 1} />
                        {index > 2 && <span className="text-slate-500 font-mono text-sm">#{index + 1}</span>}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                          <span className="font-medium text-white">{result.strategy_name}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          result.risk_level === 'Low' ? 'bg-blue-500/20 text-blue-400' :
                          result.risk_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {result.risk_level}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-mono font-bold text-lg">
                            {result.accuracy}%
                          </span>
                          {result.accuracy >= 60 && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                        <div className="mt-1 w-24">
                          <PerformanceBar value={result.accuracy} max={maxAccuracy} />
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-mono font-bold ${
                          result.win_rate >= 60 ? 'text-green-400' :
                          result.win_rate >= 40 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {result.win_rate}%
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-300 font-mono">{result.total_trades}</span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-green-400 font-mono font-bold">
                          {result.correct_predictions}
                        </span>
                        <span className="text-slate-500"> / {result.total_trades}</span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {result.accuracy >= 50 ? (
                            <TrendingUp className="w-5 h-5 text-green-400" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-400" />
                          )}
                          <span className={`text-sm font-medium ${
                            result.accuracy >= 60 ? 'text-green-400' :
                            result.accuracy >= 50 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {result.accuracy >= 60 ? 'Excellent' :
                             result.accuracy >= 50 ? 'Good' :
                             'Poor'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h4 className="text-slate-300 font-bold mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Top Performers
              </h4>
              <div className="space-y-2">
                {results.results.slice(0, 3).map((result, idx) => (
                  <div key={result.strategy_id} className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{result.strategy_name}</span>
                    <span className="text-white font-bold">{result.accuracy}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h4 className="text-slate-300 font-bold mb-3">💡 Insights</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>• Higher accuracy indicates better directional predictions</li>
                <li>• Win rate shows percentage of profitable trades</li>
                <li>• Consider risk level when choosing a strategy</li>
                <li>• Past performance doesn't guarantee future results</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};