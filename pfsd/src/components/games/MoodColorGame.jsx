import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const colorMoods = [
  { color: 'bg-yellow-400', name: 'Joy', hex: '#facc15' },
  { color: 'bg-blue-400', name: 'Calm', hex: '#60a5fa' },
  { color: 'bg-red-400', name: 'Passion', hex: '#f87171' },
  { color: 'bg-green-400', name: 'Growth', hex: '#4ade80' },
  { color: 'bg-purple-400', name: 'Wisdom', hex: '#a78bfa' },
  { color: 'bg-pink-400', name: 'Love', hex: '#f472b6' },
  { color: 'bg-orange-400', name: 'Energy', hex: '#fb923c' },
  { color: 'bg-teal-400', name: 'Peace', hex: '#2dd4bf' },
  { color: 'bg-indigo-400', name: 'Depth', hex: '#818cf8' },
];

export default function MoodColorGame() {
  const [selected, setSelected] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const toggleColor = (index) => {
    if (showResult) return;
    setSelected(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const getReading = () => {
    if (selected.length === 0) return "Select colors that speak to you right now";
    const selectedMoods = selected.map(i => colorMoods[i].name);
    return `Your energy right now: ${selectedMoods.join(' + ')}. ${
      selectedMoods.includes('Calm') || selectedMoods.includes('Peace')
        ? "You're in a balanced state. 🌊"
        : selectedMoods.includes('Joy') || selectedMoods.includes('Love')
          ? "You're radiating positive energy! ✨"
          : selectedMoods.includes('Passion') || selectedMoods.includes('Energy')
            ? "You have a powerful drive right now! 🔥"
            : "Your emotional palette is unique and beautiful. 🎨"
    }`;
  };

  return (
    <div className="py-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Choose the colors that represent how you feel right now
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {colorMoods.map((item, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleColor(i)}
            className={cn(
              "aspect-square rounded-2xl transition-all flex flex-col items-center justify-center gap-2",
              item.color,
              selected.includes(i) ? "ring-4 ring-offset-2 ring-gray-800 dark:ring-white scale-105 shadow-lg" : "opacity-70 hover:opacity-100"
            )}
          >
            <span className="text-white text-sm font-medium drop-shadow">{item.name}</span>
          </motion.button>
        ))}
      </div>

      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-center"
        >
          <p className="text-sm text-gray-700 dark:text-gray-300">{getReading()}</p>
        </motion.div>
      )}
    </div>
  );
}