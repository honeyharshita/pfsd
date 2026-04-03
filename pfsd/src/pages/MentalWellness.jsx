import React, { useState } from 'react';
import {
  MoodForecast,
  TriggerAnalyzer,
  ColorTherapy,
  PositivityFeed
} from '../components/ai-insights/index';

export default function MentalWellness() {
  const [showAffirmations, setShowAffirmations] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🌿 Mental Wellness Coaching</h1>
          <p className="text-gray-600 text-lg">
            Your personalized mental health companion powered by AI
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Wellness Card */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-teal-500">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">📊 Your Daily Wellness Check</h2>
              <p className="text-gray-600 mb-6">
                Start your day with personalized insights about your mood trends, potential triggers, and therapeutic recommendations.
              </p>
              <MoodForecast />
            </div>

            {/* Triggers & Patterns */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-orange-500">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">⚡ Understanding Your Triggers</h2>
              <p className="text-gray-600 mb-6">
                Identify patterns and emotional triggers to better manage your responses and protect your wellbeing.
              </p>
              <TriggerAnalyzer />
            </div>
          </div>

          {/* Right Column - Recommendations */}
          <div className="space-y-6">
            {/* Color Therapy */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-pink-500">
              <h3 className="text-lg font-bold mb-4 text-gray-800">🎨 Color Therapy</h3>
              <ColorTherapy />
            </div>

            {/* Affirmations Toggle */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <button
                onClick={() => setShowAffirmations(!showAffirmations)}
                className="w-full mb-4 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                {showAffirmations ? '✨ Hide' : '✨ Show'} Daily Affirmations
              </button>

              {showAffirmations && (
                <div>
                  <PositivityFeed />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wellness Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🧘',
              title: 'Mindfulness',
              tips: ['Practice 5-10 min meditation daily', 'Focus on breathing', 'Be present in the moment']
            },
            {
              icon: '💪',
              title: 'Physical Health',
              tips: ['Exercise 30 min daily', 'Get quality sleep', 'Eat nutritious meals']
            },
            {
              icon: '🤝',
              title: 'Social Connection',
              tips: ['Connect with loved ones', 'Share your feelings', 'Seek support when needed']
            }
          ].map((section, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-3 text-gray-800">{section.icon} {section.title}</h3>
              <ul className="space-y-2">
                {section.tips.map((tip, tipIdx) => (
                  <li key={tipIdx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-500 font-bold">✓</span>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Help Resources */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-md">
          <h3 className="font-bold text-blue-900 mb-2">📞 Need Additional Support?</h3>
          <p className="text-sm text-blue-800 mb-3">
            If you're experiencing a mental health crisis, please reach out to:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>National Suicide Prevention Lifeline:</strong>
              <p>1-800-273-8255</p>
            </div>
            <div>
              <strong>Crisis Text Line:</strong>
              <p>Text "HELLO" to 741741</p>
            </div>
            <div>
              <strong>International Association:</strong>
              <p>Find local resources at iasp.info</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
