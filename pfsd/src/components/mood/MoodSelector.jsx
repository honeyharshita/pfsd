import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const moods = [
  { key: 'happy', emoji: '😊', label: 'Happy', color: 'from-yellow-300 to-amber-400' },
  { key: 'calm', emoji: '😌', label: 'Calm', color: 'from-blue-300 to-cyan-400' },
  { key: 'neutral', emoji: '🙂', label: 'Neutral', color: 'from-purple-300 to-violet-400' },
  { key: 'stressed', emoji: '😰', label: 'Stressed', color: 'from-orange-300 to-red-400' },
  { key: 'sad', emoji: '😢', label: 'Sad', color: 'from-indigo-300 to-blue-500' },
  { key: 'angry', emoji: '😡', label: 'Angry', color: 'from-red-400 to-rose-500' },
  { key: 'anxious', emoji: '😟', label: 'Anxious', color: 'from-amber-300 to-orange-500' },
];

export default function MoodSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
      {moods.map((mood) => (
        <motion.button
          key={mood.key}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(mood.key)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 border-2",
            selected === mood.key
              ? `bg-gradient-to-br ${mood.color} border-transparent shadow-lg`
              : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-purple-200"
          )}
        >
          <span className="text-3xl">{mood.emoji}</span>
          <span className={cn(
            "text-xs font-medium",
            selected === mood.key ? "text-white" : "text-gray-600 dark:text-gray-400"
          )}>
            {mood.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}