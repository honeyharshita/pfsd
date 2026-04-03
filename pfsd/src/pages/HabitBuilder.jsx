import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Flame, Plus, CheckCircle, Circle, Droplets, Sun, Dumbbell, Moon, Brain, Coffee, Leaf, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DEFAULT_HABITS = [
  { id: 'water', name: 'Drink 8 glasses of water', icon: '💧', color: 'from-blue-400 to-cyan-500', category: 'health' },
  { id: 'sleep', name: 'Sleep by 10:30 PM', icon: '🌙', color: 'from-indigo-400 to-purple-500', category: 'rest' },
  { id: 'exercise', name: 'Exercise 5 minutes', icon: '🏃', color: 'from-orange-400 to-red-500', category: 'fitness' },
  { id: 'sunlight', name: 'Take a sunlight break', icon: '☀️', color: 'from-yellow-400 to-amber-500', category: 'wellness' },
  { id: 'gratitude', name: 'Write 3 gratitudes', icon: '🙏', color: 'from-pink-400 to-rose-500', category: 'mindset' },
  { id: 'breathe', name: 'Breathing exercise', icon: '🌬️', color: 'from-teal-400 to-green-500', category: 'mindset' },
  { id: 'no_screen', name: '30-min screen detox', icon: '📵', color: 'from-purple-400 to-indigo-500', category: 'digital' },
  { id: 'read', name: 'Read for 10 minutes', icon: '📚', color: 'from-green-400 to-teal-500', category: 'growth' },
];

export default function HabitBuilder() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [completed, setCompleted] = useState({});

  const toggleHabit = (habitId) => {
    setCompleted(prev => ({ ...prev, [habitId]: !prev[habitId] }));
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = Math.round((completedCount / DEFAULT_HABITS.length) * 100);

  const getStreakMessage = () => {
    if (completedCount === 0) return "Start your day with a healthy habit! 🌱";
    if (completedCount < 3) return "Great start! Keep going 💪";
    if (completedCount < 6) return "You're doing amazing! 🌟";
    if (completedCount < DEFAULT_HABITS.length) return "Almost there! You're a wellness champion! 🏆";
    return "Perfect day! You crushed all habits! 🎉";
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500" />
            AI Habit Builder
          </h1>
          <p className="text-gray-500 mt-1">Build mental health habits one day at a time</p>
        </div>

        {/* Progress Hero */}
        <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-3xl p-8 text-white mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm">Today's Progress</p>
              <p className="text-4xl font-black">{completedCount}/{DEFAULT_HABITS.length}</p>
              <p className="text-white/90 mt-1">{getStreakMessage()}</p>
            </div>
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="8"
                  strokeDasharray={`${progress * 2.64} 264`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{progress}%</span>
              </div>
            </div>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full">
            <motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEFAULT_HABITS.map((habit, i) => {
            const isDone = completed[habit.id];
            return (
              <motion.button key={habit.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => toggleHabit(habit.id)}
                className={cn(
                  "flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all",
                  isDone
                    ? `bg-gradient-to-r ${habit.color} border-transparent shadow-lg`
                    : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-purple-200"
                )}>
                <span className="text-3xl">{habit.icon}</span>
                <div className="flex-1">
                  <p className={cn("font-semibold text-sm", isDone ? "text-white" : "text-gray-700 dark:text-gray-300")}>
                    {habit.name}
                  </p>
                  <p className={cn("text-xs mt-0.5 capitalize", isDone ? "text-white/80" : "text-gray-400")}>
                    {habit.category}
                  </p>
                </div>
                {isDone ? (
                  <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Tips */}
        <div className="glass-card rounded-2xl p-6 mt-8">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" /> Why These Habits Matter
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { tip: "💧 Hydration improves focus and reduces anxiety by up to 40%", color: "bg-blue-50 dark:bg-blue-900/20" },
              { tip: "☀️ 10 minutes of sunlight boosts serotonin and vitamin D naturally", color: "bg-yellow-50 dark:bg-yellow-900/20" },
              { tip: "🌙 Consistent sleep time regulates your emotional processing", color: "bg-indigo-50 dark:bg-indigo-900/20" },
              { tip: "🌬️ Deep breathing activates the parasympathetic nervous system", color: "bg-teal-50 dark:bg-teal-900/20" },
            ].map((item, i) => (
              <div key={i} className={`rounded-xl p-3 ${item.color}`}>
                <p className="text-sm text-gray-700 dark:text-gray-300">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}