import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  MessageCircle, BarChart3, Gamepad2, BookOpen, Music, PieChart,
  ArrowRight, Sparkles, Heart, Brain, Shield, Star, CloudSun,
  FileText, Zap, Flame, Library, Palette, GraduationCap,
  Scale, Camera, BookMarked
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import FloatingEmojis from '../components/shared/FloatingEmojis';
import { useLanguage } from '../components/shared/LanguageContext';

const features = [
  { titleKey: 'nav.chat', descKey: 'Sentiment-aware conversations with voice & camera', icon: MessageCircle, page: 'Chat', gradient: 'from-purple-500 to-indigo-600' },
  { titleKey: 'nav.moodTracker', descKey: 'Daily check-ins with reflection questions', icon: BarChart3, page: 'MoodTracker', gradient: 'from-teal-400 to-cyan-500' },
  { titleKey: 'nav.moodForecast', descKey: 'AI predicts tomorrow\'s mood', icon: CloudSun, page: 'MoodForecast', gradient: 'from-amber-400 to-orange-500' },
  { titleKey: 'nav.weeklyReport', descKey: 'AI-generated weekly self-reflection', icon: FileText, page: 'WeeklyReport', gradient: 'from-teal-500 to-emerald-600' },
  { titleKey: 'nav.triggerAnalyzer', descKey: 'Discover your emotional triggers', icon: Zap, page: 'EmotionTrigger', gradient: 'from-yellow-400 to-amber-500' },
  { titleKey: 'nav.games', descKey: '7 interactive mental exercises', icon: Gamepad2, page: 'Games', gradient: 'from-orange-400 to-pink-500' },
  { titleKey: 'nav.journal', descKey: 'Write & get AI emotional insights', icon: BookOpen, page: 'Journal', gradient: 'from-blue-400 to-purple-500' },
  { titleKey: 'nav.meditation', descKey: 'Guided relaxation & calming music', icon: Music, page: 'Meditation', gradient: 'from-green-400 to-teal-500' },
  { titleKey: 'nav.habitBuilder', descKey: 'Build daily wellness habits', icon: Flame, page: 'HabitBuilder', gradient: 'from-red-400 to-orange-500' },
  { titleKey: 'nav.emotionStory', descKey: 'AI generates motivational stories', icon: BookMarked, page: 'EmotionStory', gradient: 'from-pink-500 to-rose-600' },
  { titleKey: 'nav.photoMood', descKey: 'Camera captures & reads your mood', icon: Camera, page: 'MoodPhotoUpload', gradient: 'from-violet-500 to-purple-600' },
  { titleKey: 'nav.colorTherapy', descKey: 'Healing colors for your mood', icon: Palette, page: 'ColorTherapy', gradient: 'from-pink-400 to-fuchsia-500' },
  { titleKey: 'nav.studyHelp', descKey: 'Emotion-based study techniques', icon: GraduationCap, page: 'StudySuggestions', gradient: 'from-blue-500 to-indigo-600' },
  { titleKey: 'nav.decisionHelper', descKey: 'AI-guided emotional decisions', icon: Scale, page: 'DecisionHelper', gradient: 'from-indigo-400 to-violet-600' },
  { titleKey: 'nav.safeSpace', descKey: 'Private reflection sanctuary', icon: Shield, page: 'SafeSpace', gradient: 'from-emerald-400 to-teal-600' },
  { titleKey: 'nav.positivityFeed', descKey: 'Quotes, stories & AI affirmations', icon: Star, page: 'PositivityFeed', gradient: 'from-yellow-400 to-amber-600' },
  { titleKey: 'nav.resourceLibrary', descKey: 'Evidence-based mental wellness', icon: Library, page: 'ResourceLibrary', gradient: 'from-cyan-500 to-blue-600' },
  { titleKey: 'nav.dashboard', descKey: 'Visual wellness analytics', icon: PieChart, page: 'Dashboard', gradient: 'from-pink-400 to-rose-500' },
];

const stats = [
  { label: 'Features', value: '20+', icon: Sparkles },
  { label: 'Wellness Games', value: '7', icon: Gamepad2 },
  { label: 'AI Powered', value: '100%', icon: Brain },
  { label: 'Always Available', value: '24/7', icon: Heart },
];

export default function Home() {
  const { t } = useLanguage();

  const highlights = [
    { emoji: '🔮', titleKey: 'nav.moodForecast', desc: 'Rare AI feature that predicts your tomorrow', page: 'MoodForecast', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
    { emoji: '📸', titleKey: 'nav.photoMood', desc: 'Live camera reads your emotion with AI', page: 'MoodPhotoUpload', color: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800' },
    { emoji: '🎙️', titleKey: 'nav.chat', desc: 'Voice chat — just speak your mind', page: 'Chat', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
    { emoji: '⚡', titleKey: 'nav.triggerAnalyzer', desc: 'Discover what causes your emotional shifts', page: 'EmotionTrigger', color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingEmojis />

      {/* ── About Banner at Top ── */}
      <div className="px-6 md:px-12 pt-8 pb-0">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600/10 via-fuchsia-500/10 to-teal-500/10 border border-purple-200 dark:border-purple-800 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-teal-400 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">Sentiment-Aware Conversational AI for Mental Wellness</p>
                <p className="text-xs text-gray-500">20+ AI-powered tools • Voice & Camera • 10 Languages • Real-time emotion analysis</p>
              </div>
            </div>
            <Link to={createPageUrl('About')}>
              <Button size="sm" variant="outline" className="rounded-xl text-purple-600 border-purple-300 dark:border-purple-700 whitespace-nowrap flex-shrink-0">
                Learn More <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative px-6 pt-16 pb-20 md:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              {t('home.heroBadge')}
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              <span className="gradient-text">{t('home.heroLine1')}</span>
              <br />
              <span className="text-gray-800 dark:text-gray-100">{t('home.heroLine2')}</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('home.heroSub')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('Chat')}>
                <Button className="bg-gradient-to-r from-purple-600 to-teal-500 hover:opacity-90 text-white px-8 py-6 text-lg rounded-2xl shadow-xl shadow-purple-500/20 w-full sm:w-auto">
                  <MessageCircle className="w-5 h-5 mr-2" /> {t('common.startChatting')}
                </Button>
              </Link>
              <Link to={createPageUrl('MoodPhotoUpload')}>
                <Button variant="outline" className="px-8 py-6 text-lg rounded-2xl border-2 border-pink-300 dark:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-pink-700 dark:text-pink-400 w-full sm:w-auto">
                  <Camera className="w-5 h-5 mr-2" /> Camera Mood
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Decorative blobs */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute bottom-20 left-10 w-64 h-64 bg-teal-300/20 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />
          <div className="absolute top-40 left-1/2 w-48 h-48 bg-pink-300/15 rounded-full blur-3xl animate-pulse delay-500 pointer-events-none" />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-6 md:px-12 mb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
              className="glass-card rounded-2xl p-5 text-center hover:shadow-lg transition-shadow">
              <stat.icon className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Unique Highlights ── */}
      <section className="px-6 md:px-12 mb-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              ✨ <span className="gradient-text">{t('home.uniqueTitle')}</span> — {t('home.uniqueSub')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {highlights.map((h, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} whileHover={{ y: -5 }}>
                <Link to={createPageUrl(h.page)}>
                  <div className={`rounded-2xl p-5 border-2 h-full transition-all hover:shadow-lg cursor-pointer ${h.color}`}>
                    <span className="text-4xl mb-3 block">{h.emoji}</span>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{t(h.titleKey)}</h3>
                    <p className="text-sm text-gray-500">{h.desc}</p>
                    <div className="flex items-center text-purple-600 dark:text-purple-400 text-xs font-medium mt-3 gap-1">
                      Try it <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className="px-6 md:px-12 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              {t('home.allFeaturesTitle')} <span className="gradient-text">{t('home.allFeaturesHighlight')}</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              {features.length} comprehensive tools designed to support your mental health journey
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.03 }} whileHover={{ y: -5, scale: 1.01 }}>
                <Link to={createPageUrl(feature.page)} className="block h-full">
                  <div className="glass-card rounded-2xl p-5 h-full hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 group">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{t(feature.titleKey)}</h3>
                    <p className="text-sm text-gray-500 mb-3">{feature.descKey}</p>
                    <div className="flex items-center text-purple-600 dark:text-purple-400 text-xs font-medium gap-1 group-hover:gap-2 transition-all">
                      Explore <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 md:px-12 pb-28 md:pb-16">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-teal-500 rounded-3xl p-10 md:p-14 text-white text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
            <div className="relative z-10">
              <Brain className="w-14 h-14 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.cta')}</h2>
              <p className="text-lg text-white/80 max-w-lg mx-auto mb-8">
                {t('home.heroSub')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to={createPageUrl('Chat')}>
                  <Button className="bg-white text-purple-700 hover:bg-gray-100 px-8 py-6 text-lg rounded-2xl font-semibold w-full sm:w-auto">
                    {t('common.getStarted')} <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to={createPageUrl('MoodTracker')}>
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-2xl font-semibold w-full sm:w-auto">
                    {t('common.trackMood')}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}