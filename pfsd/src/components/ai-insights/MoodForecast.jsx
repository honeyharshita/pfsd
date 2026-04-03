// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { aiApi } from '../../api/aiInsightsClient';
import { Loader2, TrendingUp, TrendingDown, Brain } from 'lucide-react';
import { useLanguage } from '../shared/LanguageContext';

export default function MoodForecast() {
  const { t } = useLanguage();
  const [result, setResult] = useState(/** @type {any} */ (null));
  const [currentFeeling, setCurrentFeeling] = useState('');
  const [sleepHours, setSleepHours] = useState(7);
  const [stressLevel, setStressLevel] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await aiApi.moodForecast({
        currentFeeling,
        sleepHours,
        stressLevel,
        energyLevel,
      });
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.analyzing');
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">📊 {t('moodForecastPage.title')}</h3>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="space-y-3 p-3 border border-gray-200 rounded-md bg-gray-50">
            <label className="text-xs font-semibold text-gray-700 block">{t('moodForecastPage.currentFeeling')}</label>
            <textarea
              value={currentFeeling}
              onChange={(e) => setCurrentFeeling(e.target.value)}
              placeholder="Example: I feel stressed and tired after a long day"
              className="w-full text-sm p-2 border border-gray-300 rounded-md"
              rows={3}
            />
            <div className="grid grid-cols-1 gap-2 text-xs text-gray-700">
              <label className="flex items-center justify-between gap-2">
                <span>Sleep hours: {sleepHours.toFixed(1)}h</span>
                <input type="range" min="3" max="12" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className="w-40" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>Stress: {stressLevel}/10</span>
                <input type="range" min="1" max="10" step="1" value={stressLevel} onChange={(e) => setStressLevel(Number(e.target.value))} className="w-40" />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span>Energy: {energyLevel}/10</span>
                <input type="range" min="1" max="10" step="1" value={energyLevel} onChange={(e) => setEnergyLevel(Number(e.target.value))} className="w-40" />
              </label>
            </div>
            <button
              onClick={fetchForecast}
              className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 rounded-md transition"
            >
              Recalculate Forecast
            </button>
          </div>

          {/* Trend */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-md">
            <div className="flex items-center gap-3 mb-2">
              {result.trend === 'improving' ? (
                <TrendingUp className="w-6 h-6 text-green-500" />
              ) : (
                <TrendingDown className="w-6 h-6 text-orange-500" />
              )}
              <span className="text-lg font-semibold capitalize">{result.predicted_mood || result.trend}</span>
            </div>
            <p className="text-sm text-gray-600">{result.prediction || result.explanation || t('common.analyzing')}</p>
          </div>

          {result.explanation && (
            <div className="p-4 bg-white border border-gray-200 rounded-md">
                <div className="flex items-center gap-2 mb-2 text-gray-700 font-semibold">
                <Brain className="w-4 h-4 text-blue-500" /> {t('moodForecastPage.whyForecast')}
              </div>
              <p className="text-sm text-gray-600 leading-6">{result.explanation}</p>
              {result.recent_history_summary && (
                <p className="text-xs text-gray-500 mt-2">{result.recent_history_summary}</p>
              )}
            </div>
          )}

          {/* Recommendations */}
          {(Array.isArray(result.top_tips) || Array.isArray(result.recommendations)) && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">{t('moodForecastPage.recommendations')}:</h4>
              <ul className="space-y-2">
                {(result.top_tips || result.recommendations || []).map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.confidence && (
            <div className="text-xs text-gray-500 text-center pt-2">
              {t('moodForecastPage.confidence')}: {(result.confidence * 100).toFixed(0)}%
            </div>
          )}

          <button
            onClick={fetchForecast}
            className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition"
          >
            Refresh Forecast
          </button>
        </div>
      )}
    </div>
  );
}
