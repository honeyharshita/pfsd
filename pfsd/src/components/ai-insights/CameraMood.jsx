import React, { useState } from 'react';
import { aiApi } from '../../api/aiInsightsClient';
import { Loader2 } from 'lucide-react';

/**
 * @typedef {Object} CameraMoodResult
 * @property {string=} detected_mood
 * @property {string=} brief_observation
 * @property {number=} confidence
 */

export default function CameraMood() {
  const [imageUrl, setImageUrl] = useState('');
  const [result, setResult] = useState(/** @type {CameraMoodResult | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!imageUrl) {
      setError('Please enter an image URL');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const data = /** @type {CameraMoodResult} */ (await aiApi.cameraMood({ imageUrl, userEmail: 'anonymous' }));
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze mood from image');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">📸 Camera Mood Analysis</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-md transition"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
          ) : null}
          Analyze Mood
        </button>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-md">
            <div className="text-sm font-semibold text-gray-700 mb-2">Detected Mood:</div>
            <div className="text-2xl font-bold mb-3">{result.detected_mood || 'Unknown'}</div>
            
            <div className="text-sm text-gray-600 mb-3">
              <strong>Observation:</strong> {result.brief_observation || 'No observation available'}
            </div>
            
            {result.confidence && (
              <div className="text-xs text-gray-500">
                Confidence: {(result.confidence * 100).toFixed(0)}%
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
