import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

const activities = [
  { text: 'Drink a glass of water 💧', color: '#60a5fa' },
  { text: 'Take a 5-minute walk 🚶', color: '#34d399' },
  { text: 'Listen to your favorite song 🎵', color: '#a78bfa' },
  { text: 'Do 10 deep breaths 🌬️', color: '#f472b6' },
  { text: 'Write 3 things you are grateful for ✍️', color: '#fbbf24' },
  { text: 'Stretch for 2 minutes 🧘', color: '#fb923c' },
  { text: 'Call a friend or loved one 📞', color: '#818cf8' },
  { text: 'Look outside and notice nature 🌿', color: '#4ade80' },
  { text: 'Give yourself a compliment 💜', color: '#e879f9' },
  { text: 'Close your eyes for 1 minute 😌', color: '#38bdf8' },
];

export default function SelfCareWheel() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const newRotation = rotation + 720 + Math.random() * 360;
    setRotation(newRotation);

    setTimeout(() => {
      const normalizedAngle = newRotation % 360;
      const index = Math.floor(normalizedAngle / (360 / activities.length));
      setResult(activities[activities.length - 1 - index] || activities[0]);
      setSpinning(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative w-64 h-64 mb-6">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-purple-600" />
        
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: [0.17, 0.67, 0.12, 0.99] }}
          className="w-full h-full rounded-full overflow-hidden border-4 border-purple-200 dark:border-purple-800"
          style={{
            background: `conic-gradient(${activities.map((a, i) => `${a.color} ${i * (100 / activities.length)}% ${(i + 1) * (100 / activities.length)}%`).join(', ')})`
          }}
        >
          <div className="w-full h-full rounded-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-900 shadow-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </motion.div>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-5 text-center mb-4 max-w-xs"
        >
          <p className="font-semibold text-purple-700 dark:text-purple-300">{result.text}</p>
        </motion.div>
      )}

      <Button
        onClick={spin}
        disabled={spinning}
        className="bg-gradient-to-r from-purple-500 to-teal-500 rounded-xl"
      >
        <RotateCcw className={`w-4 h-4 mr-2 ${spinning ? 'animate-spin' : ''}`} />
        {spinning ? 'Spinning...' : 'Spin the Wheel!'}
      </Button>
    </div>
  );
}