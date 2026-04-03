import React, { useState } from 'react';
import { aiApi } from '../../api/aiInsightsClient';
import { Loader2, BookMarked, Clock } from 'lucide-react';
import { useLanguage } from '../shared/LanguageContext';

/**
 * @typedef {Object} StudyHelpResult
 * @property {string} [recommendation_type]
 * @property {string} [focus_level]
 * @property {string} [technique]
 * @property {string} [session_style]
 * @property {string} [first_task]
 * @property {{ before_study?: string[], during_study?: string[], breaks?: string[], after_study?: string[] }} [structured_suggestions]
 * @property {Array<{ session?: number, focus?: string, break?: string, task_type?: string }>} [schedule]
 * @property {string[] | string} [tips]
 * @property {string} [motivation]
 */

export default function StudyHelp() {
  const { t } = useLanguage();
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(60);
  const [difficulty, setDifficulty] = useState('medium');
  const [mood, setMood] = useState('neutral');
  const [energyLevel, setEnergyLevel] = useState(6);
  const [result, setResult] = useState(/** @type {StudyHelpResult | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetStudyPlan = async () => {
    if (!subject.trim()) {
      setError(t('studyHelp.prompt'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await aiApi.studyHelp(subject, duration, difficulty, mood, energyLevel);
      setResult(/** @type {StudyHelpResult} */ (data));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.analyzing'));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <BookMarked className="w-5 h-5" />
        {t('studyHelp.title')}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('studyHelp.prompt')}
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Python, History, Math"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How much time do you have? ({duration} minutes)
          </label>
          <input
            type="range"
            min="15"
            max="240"
            step="15"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>15 min</span>
            <span>240 min</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['easy', 'medium', 'hard'].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  difficulty === level
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Mood
          </label>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            {['stressed', 'anxious', 'sad', 'calm', 'neutral', 'happy', 'angry'].map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Energy Level ({energyLevel}/10)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={energyLevel}
            onChange={(e) => setEnergyLevel(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        <button
          onClick={handleGetStudyPlan}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-md transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
          {t('studyHelp.generate')}
        </button>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {result.recommendation_type && (
              <div className="p-3 bg-blue-50 rounded-md border-l-4 border-blue-500">
                <h4 className="font-semibold text-blue-900 mb-1">🎯 {t('studyHelp.recommendation')}</h4>
                <p className="text-sm text-gray-700">{result.recommendation_type}</p>
              </div>
            )}

            {result.session_style && (
              <div className="p-3 bg-indigo-50 rounded-md border-l-4 border-indigo-500">
                <h4 className="font-semibold text-indigo-900 mb-1">🧭 {t('studyHelp.sessionStyle')}</h4>
                <p className="text-sm text-gray-700">{result.session_style}</p>
              </div>
            )}

            {result.first_task && (
              <div className="p-3 bg-amber-50 rounded-md border-l-4 border-amber-500">
                <h4 className="font-semibold text-amber-900 mb-1">✅ {t('studyHelp.firstTask')}</h4>
                <p className="text-sm text-gray-700">{result.first_task}</p>
              </div>
            )}

            {result.structured_suggestions && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">🗂️ {t('studyHelp.structuredSuggestions')}</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(result.structured_suggestions).map(([key, items]) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-800 mb-2 capitalize">{key.replace(/_/g, ' ')}</h5>
                      <ul className="space-y-1">
                        {Array.isArray(items)
                          ? items.map((item, idx) => (
                              <li key={idx} className="text-sm text-gray-600">• {item}</li>
                            ))
                          : <li className="text-sm text-gray-600">• {items}</li>}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technique */}
            {result.technique && (
              <div className="p-3 bg-green-50 rounded-md border-l-4 border-green-500">
                <h4 className="font-semibold text-green-900 mb-1">📚 Recommended Technique</h4>
                <p className="text-sm text-gray-700">{result.technique}</p>
              </div>
            )}

            {/* Schedule */}
            {result.schedule && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">⏱️ Study Schedule</h4>
                <div className="space-y-2">
                  {Array.isArray(result.schedule) ? (
                    result.schedule.map((item, idx) => (
                      <div key={idx} className="p-2 bg-gray-100 rounded-md text-sm">
                        Session {item.session || idx + 1}: {item.focus || 'Focus'} / {item.break || 'Break'} {item.task_type ? `- ${item.task_type}` : ''}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 bg-gray-100 rounded-md text-sm">
                      {result.schedule}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            {result.tips && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">💡 Study Tips</h4>
                <ul className="space-y-1">
                  {Array.isArray(result.tips) ? (
                    result.tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-gray-600 pl-2">
                        • {tip}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-600 pl-2">
                      • {result.tips}
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Motivation */}
            {result.motivation && (
              <div className="p-3 bg-yellow-50 rounded-md border-l-4 border-yellow-500">
                <h4 className="font-semibold text-yellow-900 mb-1">🎯 Stay Motivated</h4>
                <p className="text-sm text-gray-700">{result.motivation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
