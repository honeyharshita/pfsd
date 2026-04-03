import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Brain, Heart, Shield, Sparkles, MessageCircle, BarChart3,
  Gamepad2, BookOpen, Music, PieChart, ArrowRight, Users, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/shared/LanguageContext';

const features = [
  { icon: MessageCircle, title: 'Sentiment-Aware AI Chat', desc: 'Our AI analyzes your messages to detect emotions like happiness, stress, and anxiety, then responds with empathy and personalized suggestions.' },
  { icon: Brain, title: 'Emotion Memory Graph', desc: 'The system stores relationships between your emotions, triggers, and solutions. It learns and suggests personalized coping strategies.' },
  { icon: BarChart3, title: 'Mood Tracking & Calendar', desc: 'Track your daily moods with a beautiful color-coded calendar and see your emotional patterns over time.' },
  { icon: Gamepad2, title: 'Mental Wellness Games', desc: '7 interactive games including Breathing Bubble, Stress Buster, Emotion Match, Self-Care Wheel, and more.' },
  { icon: BookOpen, title: 'AI-Powered Journal', desc: 'Write your thoughts and get AI-analyzed insights about your emotional trends, triggers, and improvements.' },
  { icon: Music, title: 'Guided Meditation', desc: 'Timed meditation sessions with breathing guides, calming music playlists, and nature sounds.' },
  { icon: PieChart, title: 'Analytics Dashboard', desc: 'Comprehensive visual analytics with mood distribution, sentiment trends, and emotion heatmaps.' },
  { icon: Shield, title: 'Crisis Detection', desc: 'Automatic detection of distress signals with immediate helpline information and admin alerts.' },
  { icon: Zap, title: 'AI Mood Prediction', desc: 'Machine learning predicts future mood patterns and suggests preventive wellness activities.' },
  { icon: Users, title: 'Personalized Recommendations', desc: 'Activity and resource suggestions based on your unique emotional history and preferences.' },
];

const techStack = [
  { name: 'Django', desc: 'Python Web Framework' },
  { name: 'MongoDB', desc: 'NoSQL Database' },
  { name: 'SurrealDB', desc: 'Graph Database' },
  { name: 'GraphQL', desc: 'API Layer' },
  { name: 'Python NLP', desc: 'AI/ML Libraries' },
  { name: 'React', desc: 'Frontend Framework' },
];

export default function About() {
  const { t } = useLanguage();
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
            <Heart className="w-4 h-4" />
            {t('about.badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            {t('about.titleLine1')}
            <br />
            <span className="gradient-text">{t('about.titleLine2')}</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
            {t('about.featuresTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-6 flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
            {t('about.techTitle')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {techStack.map((tech, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 text-center">
                <p className="font-bold text-purple-600 dark:text-purple-400 text-lg">{tech.name}</p>
                <p className="text-sm text-gray-500 mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture */}
        <div className="glass-card rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
            {t('about.architectureTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl text-white">🎨</span>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">Frontend</h4>
              <p className="text-sm text-gray-500 mt-1">React + Tailwind CSS with beautiful animations and responsive design</p>
            </div>
            <div className="p-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl text-white">⚙️</span>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">Backend</h4>
              <p className="text-sm text-gray-500 mt-1">Django + GraphQL API with MongoDB for data & SurrealDB for emotion graphs</p>
            </div>
            <div className="p-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl text-white">🤖</span>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">AI/ML Layer</h4>
              <p className="text-sm text-gray-500 mt-1">NLP sentiment analysis, emotion detection, and mood prediction models</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {t('about.readyTitle')}
          </h2>
          <Link to={createPageUrl('Chat')}>
            <Button className="bg-gradient-to-r from-purple-600 to-teal-500 text-white px-8 py-6 text-lg rounded-2xl">
              {t('about.cta')} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}