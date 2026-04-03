import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

const badgeConfig = {
  bronze: { icon: Medal, color: 'from-amber-600 to-amber-800', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200' },
  silver: { icon: Star, color: 'from-gray-400 to-gray-600', bg: 'bg-gray-50 dark:bg-gray-800/30', border: 'border-gray-300' },
  gold: { icon: Trophy, color: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200' },
  platinum: { icon: Award, color: 'from-purple-400 to-indigo-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200' },
};

const typeLabels = {
  gratitude_streak: 'Gratitude Streak',
  meditation_sessions: 'Meditation Master',
  journal_entries: 'Journal Writer',
  mood_checkins: 'Mood Tracker',
  games_played: 'Game Player',
  positive_days: 'Positive Days',
};

export default function AchievementBadge({ achievement, compact = false }) {
  const config = badgeConfig[achievement.badge_level || 'bronze'];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", config.bg, "border", config.border)}>
        <Icon className="w-3 h-3" />
        {typeLabels[achievement.type]}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn(
        "relative p-4 rounded-2xl border overflow-hidden",
        config.bg, config.border,
        !achievement.unlocked && "opacity-40 grayscale"
      )}
    >
      <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", config.color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{typeLabels[achievement.type]}</h4>
      <p className="text-xs text-gray-500 mt-1">
        {achievement.count || 0} {achievement.unlocked ? '✓ Unlocked' : 'to unlock'}
      </p>
      {achievement.unlocked && (
        <div className="absolute top-2 right-2">
          <span className="text-lg">🏆</span>
        </div>
      )}
    </motion.div>
  );
}