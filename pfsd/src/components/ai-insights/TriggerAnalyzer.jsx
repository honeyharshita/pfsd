// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { aiApi } from '../../api/aiInsightsClient';
import { Loader2, AlertCircle } from 'lucide-react';

const categoryLabels = {
  workload: 'Workload',
  social: 'Social Situations',
  people: 'People / Relationships',
  sleep: 'Sleep / Energy',
  change: 'Change / Uncertainty',
};

export default function TriggerAnalyzer() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setLoading(false);
  }, []);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await aiApi.triggerAnalyzer({ description });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze triggers');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">⚡ Trigger Analyzer</h3>

      <div className="mb-4">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what tends to trigger you, like meetings, being ignored, work pressure, conflict, or lack of sleep..."
          className="w-full min-h-28 rounded-md border border-gray-300 p-3 text-sm outline-none focus:border-orange-500"
        />
      </div>

      <button
        onClick={fetchAnalysis}
        disabled={loading}
        className="w-full mb-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-md transition"
      >
        {loading ? 'Analyzing...' : 'Analyze Triggers'}
      </button>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.category_summary && (
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <div key={key} className="rounded-md bg-slate-50 p-2 text-slate-700">
                  <div className="font-semibold">{label}</div>
                  <div>{result.category_summary[key] || 0}</div>
                </div>
              ))}
            </div>
          )}

          {/* Identified Triggers */}
          {result.triggers && Array.isArray(result.triggers) && result.triggers.length > 0 && (
            <div>
              <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Identified Triggers
              </h4>
              <ul className="space-y-2">
                {result.triggers.map((trigger, idx) => (
                  <li key={idx} className="p-2 bg-orange-50 rounded-md text-sm text-gray-700">
                    {typeof trigger === 'string' ? trigger : `${trigger.trigger} · ${trigger.frequency} · ${trigger.severity}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.categorized_triggers && (
            <div className="space-y-3">
              {Object.entries(categoryLabels).map(([key, label]) => {
                const items = result.categorized_triggers[key] || [];
                return (
                  <div key={key}>
                    <h4 className="font-semibold text-gray-700 mb-2">{label}</h4>
                    {items.length > 0 ? (
                      <ul className="space-y-2">
                        {items.map((item, index) => (
                          <li key={index} className="p-2 bg-slate-50 rounded-md text-sm text-gray-700">
                            {item.trigger} · {item.frequency} · {item.severity}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No strong triggers detected in this category yet.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Patterns */}
          {result.patterns && Array.isArray(result.patterns) && result.patterns.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Patterns Noticed:</h4>
              <ul className="space-y-2">
                {result.patterns.map((pattern, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-purple-500 font-bold">→</span>
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Coping Strategies */}
          {result.coping_strategies && Array.isArray(result.coping_strategies) && result.coping_strategies.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-700 mb-2">💡 Coping Strategies:</h4>
              <ul className="space-y-2">
                {result.coping_strategies.map((strategy, idx) => (
                  <li key={idx} className="p-2 bg-green-50 rounded-md text-sm text-gray-700">
                    {strategy}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={fetchAnalysis}
            className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-md transition"
          >
            Refresh Analysis
          </button>
        </div>
      )}
    </div>
  );
}
