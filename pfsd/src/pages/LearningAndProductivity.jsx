import React, { useState } from 'react';
import { StudyHelp, DecisionHelper, GameTip } from '../components/ai-insights/index';

export default function LearningAndProductivity() {
  const [mode, setMode] = useState('study');

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📚 Learning & Productivity</h1>
          <p className="text-gray-600 text-lg">
            Personalized tools for effective learning and smart decision-making
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mb-6 flex flex-wrap gap-3 bg-white p-4 rounded-lg shadow-md">
          <button
            onClick={() => setMode('study')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              mode === 'study'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📖 Study Helper
          </button>
          <button
            onClick={() => setMode('decision')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              mode === 'decision'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚖️ Decision Helper
          </button>
          <button
            onClick={() => setMode('motivation')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              mode === 'motivation'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎮 Stay Motivated
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {mode === 'study' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">📖 Personalized Study Plans</h2>
                <p className="text-gray-600 mb-6">
                  Get AI-powered study recommendations tailored to your subject, available time, and learning style. Our system
                  considers your current mood and suggests optimal study techniques.
                </p>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
                  <StudyHelp />
                </div>
                <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Study Tips</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Use the Pomodoro Technique: 25 min focus + 5 min break</li>
                    <li>• Study in short bursts rather than marathon sessions</li>
                    <li>• Review material multiple times for better retention</li>
                    <li>• Take notes by hand for better memory encoding</li>
                    <li>• Test yourself frequently to identify weak areas</li>
                  </ul>
                </div>
              </div>
            )}

            {mode === 'decision' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">⚖️ Smart Decision Making</h2>
                <p className="text-gray-600 mb-6">
                  Facing a tough decision? Use our AI-powered decision helper to analyze pros and cons, get recommendations, and
                  plan your next steps strategically.
                </p>
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-lg">
                  <DecisionHelper />
                </div>
                <div className="mt-6 p-4 bg-teal-50 border-l-4 border-teal-500 rounded-md">
                  <h4 className="font-semibold text-teal-900 mb-2">🎯 Decision-Making Framework</h4>
                  <ol className="space-y-2 text-sm text-teal-800 list-decimal list-inside">
                    <li>Clearly define the decision you need to make</li>
                    <li>Gather all relevant information</li>
                    <li>Identify pros and cons systematically</li>
                    <li>Consider long-term consequences</li>
                    <li>Trust your gut feeling combined with analysis</li>
                    <li>Commit to your decision and review later</li>
                  </ol>
                </div>
              </div>
            )}

            {mode === 'motivation' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">🎮 Stay Motivated</h2>
                <p className="text-gray-600 mb-6">
                  Get personalized motivation and tips while you learn and work. Choose a game you're playing and your current mood
                  to receive encouragement tailored to your situation.
                </p>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg">
                  <GameTip />
                </div>
                <div className="mt-6 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-md">
                  <h4 className="font-semibold text-purple-900 mb-2">✨ Stay Inspired</h4>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li>• Remember why you started this journey</li>
                    <li>• Celebrate small wins along the way</li>
                    <li>• Find an accountability partner</li>
                    <li>• Reward yourself for achieving milestones</li>
                    <li>• Keep your motivation fuel tank full</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Productivity Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500">
              <h3 className="font-bold text-lg text-gray-800 mb-4">📊 Productivity Tips</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="font-semibold text-green-900">Morning Boost</p>
                  <p className="text-green-700">Start with hardest task first</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="font-semibold text-blue-900">Focus Blocks</p>
                  <p className="text-blue-700">Work in 90-min deep focus sessions</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-md">
                  <p className="font-semibold text-purple-900">Break Strategy</p>
                  <p className="text-purple-700">Take breaks every 90 minutes</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-md">
                  <p className="font-semibold text-orange-900">Evening Wrap-up</p>
                  <p className="text-orange-700">Review progress and plan next day</p>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-indigo-500">
              <h3 className="font-bold text-lg text-gray-800 mb-4">📚 Learning Resources</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <strong>Spaced Repetition:</strong>
                  <p className="text-xs text-gray-600">Review material at increasing intervals</p>
                </li>
                <li>
                  <strong>Active Recall:</strong>
                  <p className="text-xs text-gray-600">Test yourself without looking at notes</p>
                </li>
                <li>
                  <strong>Interleaving:</strong>
                  <p className="text-xs text-gray-600">Mix different topics while studying</p>
                </li>
                <li>
                  <strong>Elaboration:</strong>
                  <p className="text-xs text-gray-600">Explain concepts in your own words</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
