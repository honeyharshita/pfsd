import React, { useState } from 'react';
import { aiApi } from '../../api/aiInsightsClient';
import { Loader2, Zap } from 'lucide-react';

const GAMES = ['breathing', 'emotion-match', 'gratitude', 'memory', 'mood-color', 'self-care', 'stress-buster'];
const MOODS = ['happy', 'sad', 'anxious', 'calm', 'neutral', 'tired', 'energetic'];

export default function GameTip() {
  const [selectedGame, setSelectedGame] = useState('stress-buster');
  const [selectedMood, setSelectedMood] = useState('neutral');
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetTip = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await aiApi.gameTip(selectedGame, selectedMood);
      setTip(data.tip || data);
    } catch (err) {
      setError(err.message || 'Failed to get game tip');
      setTip('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">🎮 Game Tip</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Game
          </label>
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {GAMES.map((game) => (
              <option key={game} value={game}>
                {game.replace(/-/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Current Mood
          </label>
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {MOODS.map((mood) => (
              <option key={mood} value={mood}>
                {mood.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGetTip}
          disabled={loading}
          className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-md transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Get Personalized Tip
        </button>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {tip && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-md border-l-4 border-purple-500">
            <p className="text-sm text-gray-700">{tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}
