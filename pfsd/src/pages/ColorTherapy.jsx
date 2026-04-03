import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/shared/LanguageContext';

const colorTherapy = {
  stressed: {
    primary: '#60a5fa', name: 'Soft Blue', gradient: 'from-blue-200 via-sky-200 to-cyan-200',
    description: 'Blue calms the nervous system, slows heart rate, and induces a sense of peace.',
    affirmation: 'Like still water, I am calm and clear.',
    breathTip: 'Visualize breathing in this blue light. Feel it cool and quiet your mind.',
    emoji: '💙'
  },
  angry: {
    primary: '#4ade80', name: 'Forest Green', gradient: 'from-green-200 via-emerald-200 to-teal-200',
    description: 'Green reduces aggression, restores balance, and connects you to natural calm.',
    affirmation: 'I release what I cannot control. Nature grounds me.',
    breathTip: 'Imagine standing in a green forest. Each breath brings earthy calm.',
    emoji: '💚'
  },
  sad: {
    primary: '#fde68a', name: 'Warm Yellow', gradient: 'from-yellow-100 via-amber-100 to-orange-100',
    description: 'Warm yellow lifts mood, increases optimism, and stimulates mental activity.',
    affirmation: 'The sun still shines. I carry warmth within me.',
    breathTip: 'Picture warm golden light filling your chest with each inhale.',
    emoji: '💛'
  },
  anxious: {
    primary: '#d8b4fe', name: 'Soft Lavender', gradient: 'from-purple-100 via-violet-100 to-indigo-100',
    description: 'Lavender promotes relaxation, reduces anxiety, and quiets racing thoughts.',
    affirmation: 'I am safe. This moment is enough.',
    breathTip: 'Let the soft purple wrap around your thoughts like a gentle blanket.',
    emoji: '💜'
  },
  happy: {
    primary: '#fb923c', name: 'Vibrant Orange', gradient: 'from-orange-200 via-amber-200 to-yellow-200',
    description: 'Orange amplifies joy, creativity, and social energy. Channel this feeling!',
    affirmation: 'I radiate joy and attract wonderful experiences.',
    breathTip: 'Let this warm energy flow outward, filling your whole body.',
    emoji: '🧡'
  },
  calm: {
    primary: '#67e8f9', name: 'Aqua', gradient: 'from-cyan-100 via-teal-100 to-sky-100',
    description: 'Aqua enhances clarity, communication, and deepens peaceful awareness.',
    affirmation: 'I flow with life. Clarity comes naturally to me.',
    breathTip: 'Breathe like gentle ocean waves. In and out, rhythmically.',
    emoji: '🩵'
  },
  neutral: {
    primary: '#c4b5fd', name: 'Violet', gradient: 'from-violet-100 via-purple-100 to-indigo-100',
    description: 'Violet connects mind, body, and spirit. It inspires wisdom and inner peace.',
    affirmation: 'I am balanced and open to life\'s possibilities.',
    breathTip: 'Imagine violet light at your crown, connecting you to something larger.',
    emoji: '🔮'
  }
};

const moods = [
  { key: 'stressed', emoji: '😰', label: 'Stressed' },
  { key: 'angry', emoji: '😡', label: 'Angry' },
  { key: 'sad', emoji: '😢', label: 'Sad' },
  { key: 'anxious', emoji: '😟', label: 'Anxious' },
  { key: 'happy', emoji: '😊', label: 'Happy' },
  { key: 'calm', emoji: '😌', label: 'Calm' },
  { key: 'neutral', emoji: '🙂', label: 'Neutral' },
];

export default function ColorTherapy() {
  const { t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState(null);
  const [isImmersed, setIsImmersed] = useState(false);

  const therapy = selectedMood ? colorTherapy[selectedMood] : null;

  if (isImmersed && therapy) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className={`fixed inset-0 bg-gradient-to-br ${therapy.gradient} flex flex-col items-center justify-center p-8 z-50`}>
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 4 }}
          className="text-center">
          <p className="text-8xl mb-6">{therapy.emoji}</p>
          <h2 className="text-3xl font-bold text-gray-700 mb-4">{therapy.name}</h2>
          <p className="text-gray-600 text-lg mb-6 max-w-md">{therapy.breathTip}</p>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <p className="text-gray-700 italic font-medium">"{therapy.affirmation}"</p>
          </div>
        </motion.div>
        <Button onClick={() => setIsImmersed(false)} className="bg-white/70 text-gray-700 hover:bg-white rounded-2xl px-8">
          {t('colorTherapy.exitImmersive')}
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <Palette className="w-8 h-8 text-pink-500" />
            {t('colorTherapy.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('colorTherapy.subtitle')}</p>
        </div>

        {/* Mood picker */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">{t('colorTherapy.howFeeling')}</p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {moods.map((mood) => {
              const t = colorTherapy[mood.key];
              return (
                <motion.button key={mood.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMood(mood.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all",
                    selectedMood === mood.key
                      ? "border-transparent shadow-lg scale-105"
                      : "border-gray-100 dark:border-gray-800"
                  )}
                  style={selectedMood === mood.key ? { backgroundColor: t.primary + '40', borderColor: t.primary } : {}}>
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{mood.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Color Therapy Card */}
        <AnimatePresence>
          {therapy && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className={`rounded-3xl bg-gradient-to-br ${therapy.gradient} p-8 mb-6`}>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{therapy.emoji}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-700">{t('colorTherapy.therapyColor')}: {therapy.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 rounded-full shadow-md" style={{ backgroundColor: therapy.primary }} />
                      <span className="text-sm text-gray-500">{therapy.primary}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{therapy.description}</p>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">{t('colorTherapy.breathingVisualization')}</p>
                  <p className="text-gray-700">{therapy.breathTip}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">{t('colorTherapy.affirmation')}</p>
                  <p className="text-gray-700 italic">"{therapy.affirmation}"</p>
                </div>
              </div>

              <Button onClick={() => setIsImmersed(true)}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold text-lg">
                <Sparkles className="w-5 h-5 mr-2" /> {t('colorTherapy.enterImmersive')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}