import React, { useState } from 'react';
import { aiApi } from '../../api/aiInsightsClient';
import { Loader2, Palette } from 'lucide-react';
import { useLanguage } from '../shared/LanguageContext';

const MOODS = ['happy', 'sad', 'anxious', 'calm', 'neutral', 'tired', 'motivated', 'angry', 'lonely'];

export default function ColorTherapy() {
  const { t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState('calm');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetColor = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await aiApi.colorTherapy(selectedMood);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to get color therapy');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <Palette className="w-5 h-5" />
        {t('colorTherapy.discover')}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('colorTherapy.howFeeling')}
          </label>
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {MOODS.map((mood) => (
              <option key={mood} value={mood}>
                {mood.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGetColor}
          disabled={loading}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-md transition"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
          ) : null}
          {t('colorTherapy.discover')}
        </button>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Color Display */}
            {result.hex && (
              <div className="space-y-2">
                <div
                  className="w-full h-32 rounded-lg shadow-md border-4 border-gray-200 transition"
                  style={{ backgroundColor: result.hex }}
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700">{result.color_name}</span>
                  <span className="text-gray-500 font-mono">{result.hex}</span>
                </div>
              </div>
            )}

            {/* Benefit */}
            {result.benefit && (
              <div className="p-3 bg-pink-50 rounded-md">
                <h4 className="font-semibold text-pink-900 mb-1">💫 Benefit</h4>
                <p className="text-sm text-gray-700">{result.benefit}</p>
              </div>
            )}

            {/* Suggestion */}
            {result.suggestion && (
              <div className="p-3 bg-purple-50 rounded-md">
                <h4 className="font-semibold text-purple-900 mb-1">💎 Using This Color</h4>
                <p className="text-sm text-gray-700">{result.suggestion}</p>
              </div>
            )}

            {/* Activities */}
            {result.activities && Array.isArray(result.activities) && result.activities.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">🎨 Activities</h4>
                <ul className="space-y-1">
                  {result.activities.map((activity, idx) => (
                    <li key={idx} className="text-sm text-gray-600 pl-2">
                      • {activity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
