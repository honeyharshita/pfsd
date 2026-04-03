import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Wind, Zap, Brain, RotateCcw, Palette, Heart, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BreathingBubble from '../components/games/BreathingBubble';
import StressBuster from '../components/games/StressBuster';
import EmotionMatch from '../components/games/EmotionMatch';
import SelfCareWheel from '../components/games/SelfCareWheel';
import GratitudeChallenge from '../components/games/GratitudeChallenge';
import MemoryGame from '../components/games/MemoryGame';
import MoodColorGame from '../components/games/MoodColorGame';

const games = [
  { id: 'breathing', name: 'Breathing Bubble', icon: Wind, desc: 'Guided breathing exercise', component: BreathingBubble },
  { id: 'stress', name: 'Stress Buster', icon: Zap, desc: 'Pop bubbles to release stress', component: StressBuster },
  { id: 'emotion', name: 'Emotion Match', icon: Brain, desc: 'Identify emotions in sentences', component: EmotionMatch },
  { id: 'wheel', name: 'Self-Care Wheel', icon: RotateCcw, desc: 'Spin for a random activity', component: SelfCareWheel },
  { id: 'gratitude', name: 'Gratitude', icon: Heart, desc: 'Daily gratitude challenge', component: GratitudeChallenge },
  { id: 'memory', name: 'Memory Match', icon: Sparkles, desc: 'Match emotions & strategies', component: MemoryGame },
  { id: 'color', name: 'Mood Colors', icon: Palette, desc: 'Express mood through colors', component: MoodColorGame },
];

export default function Games() {
  const [activeGame, setActiveGame] = useState('breathing');
  const ActiveComponent = games.find(g => g.id === activeGame)?.component;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-purple-500" />
            Wellness Games
          </h1>
          <p className="text-gray-500 mt-1">Interactive games to support your mental health</p>
        </div>

        {/* Game selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {games.map((game) => (
            <motion.button
              key={game.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveGame(game.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                activeGame === game.id
                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-100 dark:border-gray-800 hover:border-purple-200 bg-white dark:bg-gray-800/50'
              }`}
            >
              <game.icon className={`w-6 h-6 mb-2 ${activeGame === game.id ? 'text-purple-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-semibold ${activeGame === game.id ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                {game.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{game.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* Active game */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            {React.createElement(games.find(g => g.id === activeGame)?.icon || Gamepad2, { className: 'w-5 h-5 text-purple-500' })}
            {games.find(g => g.id === activeGame)?.name}
          </h2>
          {ActiveComponent && <ActiveComponent />}
        </div>
      </motion.div>
    </div>
  );
}