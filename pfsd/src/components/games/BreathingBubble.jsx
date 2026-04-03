import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

export default function BreathingBubble() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('inhale');
  const [count, setCount] = useState(4);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          setPhase(p => p === 'inhale' ? 'hold' : p === 'hold' ? 'exhale' : 'inhale');
          return 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const phaseColors = {
    inhale: 'from-purple-400 to-indigo-500',
    hold: 'from-teal-400 to-cyan-500',
    exhale: 'from-pink-400 to-rose-500',
  };

  const phaseScale = {
    inhale: 1.5,
    hold: 1.5,
    exhale: 1,
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <motion.div
        animate={{
          scale: isActive ? phaseScale[phase] : 1,
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
        className={`w-40 h-40 rounded-full bg-gradient-to-br ${phaseColors[phase]} flex items-center justify-center shadow-2xl`}
      >
        <div className="text-center text-white">
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-sm capitalize">{isActive ? phase : 'Ready'}</p>
        </div>
      </motion.div>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        {phase === 'inhale' ? 'Breathe in slowly...' : phase === 'hold' ? 'Hold your breath...' : 'Breathe out gently...'}
      </p>

      <Button
        onClick={() => { setIsActive(!isActive); setPhase('inhale'); setCount(4); }}
        className="mt-4 bg-gradient-to-r from-purple-500 to-teal-500 rounded-xl"
      >
        {isActive ? <><Pause className="w-4 h-4 mr-2" /> Stop</> : <><Play className="w-4 h-4 mr-2" /> Start</>}
      </Button>
    </div>
  );
}