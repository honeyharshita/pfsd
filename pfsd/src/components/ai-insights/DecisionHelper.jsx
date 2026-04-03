import React, { useState } from 'react';
import { aiApi } from '../../api/aiInsightsClient';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function DecisionHelper() {
  const [decision, setDecision] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!decision.trim()) {
      setError('Please describe the decision you need to make');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await aiApi.decisionHelper(decision, context);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze decision');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">⚖️ Decision Helper</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What decision do you need to make?
          </label>
          <textarea
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            placeholder="e.g., Should I change jobs? Should I start a new project?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional context (optional)
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Any additional details that might help..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-16"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-md transition"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
          ) : null}
          Analyze Decision
        </button>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Pros */}
            {result.pros && Array.isArray(result.pros) && result.pros.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Pros
                </h4>
                <ul className="space-y-1">
                  {result.pros.map((pro, idx) => (
                    <li key={idx} className="text-sm text-gray-600 pl-2">
                      ✓ {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cons */}
            {result.cons && Array.isArray(result.cons) && result.cons.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Cons
                </h4>
                <ul className="space-y-1">
                  {result.cons.map((con, idx) => (
                    <li key={idx} className="text-sm text-gray-600 pl-2">
                      ✗ {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendation */}
            {result.recommendation && (
              <div className="p-3 bg-teal-50 rounded-md border-l-4 border-teal-500">
                <h4 className="font-semibold text-teal-900 mb-1">Recommendation</h4>
                <p className="text-sm text-gray-700">{result.recommendation}</p>
              </div>
            )}

            {/* Next Steps */}
            {result.next_steps && Array.isArray(result.next_steps) && result.next_steps.length > 0 && (
              <div>
                <h4 className="font-semibold text-blue-700 mb-2">Next Steps</h4>
                <ol className="space-y-1 list-decimal list-inside">
                  {result.next_steps.map((step, idx) => (
                    <li key={idx} className="text-sm text-gray-600">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
