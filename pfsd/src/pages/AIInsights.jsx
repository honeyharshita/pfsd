import React, { useState } from 'react';
import {
  CameraMood,
  MoodForecast,
  TriggerAnalyzer,
  WeeklyReport,
  DecisionHelper,
  GameTip,
  EmotionStory,
  ColorTherapy,
  StudyHelp,
  PositivityFeed
} from '../components/ai-insights/index';
import { useLanguage } from '@/components/shared/LanguageContext';

export default function AIInsights() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: `📋 ${t('aiInsights.overview')}`, icon: '📋' },
    { id: 'mood', label: `😊 ${t('aiInsights.mood')}`, icon: '😊' },
    { id: 'decision', label: `⚖️ ${t('aiInsights.decision')}`, icon: '⚖️' },
    { id: 'emotions', label: `💭 ${t('aiInsights.emotions')}`, icon: '💭' },
    { id: 'wellness', label: `💚 ${t('aiInsights.wellness')}`, icon: '💚' },
    { id: 'learning', label: `📚 ${t('aiInsights.learning')}`, icon: '📚' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🧠 {t('aiInsights.title')}</h1>
          <p className="text-gray-600 text-lg">{t('aiInsights.subtitle')}</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex flex-wrap gap-2 bg-white p-3 rounded-lg shadow-md">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-max">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('aiInsights.welcome')}</h2>
                <div className="space-y-4 text-gray-700">
                  <p>{t('aiInsights.intro')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: '📸 Camera Mood Analysis', desc: 'Analyze your mood from photos' },
                      { title: '📊 Mood Forecast', desc: 'Predict mood trends over time' },
                      { title: '⚡ Trigger Analyzer', desc: 'Identify emotional triggers' },
                      { title: '📋 Weekly Report', desc: 'Get comprehensive wellness summary' },
                      { title: '⚖️ Decision Helper', desc: 'Make informed decisions' },
                      { title: '🎮 Game Tips', desc: 'Personalized gaming advice' },
                      { title: '📖 Emotion Story', desc: 'Reflective narratives' },
                      { title: '🎨 Color Therapy', desc: 'Therapeutic color guidance' },
                      { title: '📚 Study Helper', desc: 'Personalized study plans' },
                      { title: '✨ Positivity Feed', desc: 'Daily affirmations' }
                    ].map((feature, idx) => (
                      <div key={idx} className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-md">
                        <p className="font-semibold text-gray-800">{feature.title}</p>
                        <p className="text-sm text-gray-600">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Mood Tab */}
          {activeTab === 'mood' && (
            <>
              <MoodForecast />
              <TriggerAnalyzer />
              <div className="lg:col-span-2">
                <CameraMood />
              </div>
            </>
          )}

          {/* Decision Tab */}
          {activeTab === 'decision' && (
            <div className="lg:col-span-2">
              <DecisionHelper />
            </div>
          )}

          {/* Emotions Tab */}
          {activeTab === 'emotions' && (
            <>
              <EmotionStory />
              <ColorTherapy />
            </>
          )}

          {/* Wellness Tab */}
          {activeTab === 'wellness' && (
            <>
              <div className="lg:col-span-2">
                <WeeklyReport />
              </div>
              <GameTip />
              <div className="lg:col-span-1">
                <PositivityFeed />
              </div>
            </>
          )}

          {/* Learning Tab */}
          {activeTab === 'learning' && (
            <div className="lg:col-span-2">
              <StudyHelp />
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-md">
          <p className="text-sm text-gray-700">
            <strong>💡 Tip:</strong> {t('aiInsights.tip')}
          </p>
        </div>
      </div>
    </div>
  );
}
