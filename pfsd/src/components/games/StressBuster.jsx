import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  "You are enough! 💜",
  "This too shall pass ✨",
  "Breathe... 🌊",
  "You're doing great! 🌟",
  "Peace is within you 🦋",
  "Stay strong! 💪",
  "You matter! ❤️",
  "Let it go... 🍃",
  "Smile, you deserve it 😊",
  "One step at a time 🌈",
];

const colors = [
  'bg-purple-400', 'bg-teal-400', 'bg-pink-400', 'bg-blue-400',
  'bg-amber-400', 'bg-green-400', 'bg-indigo-400', 'bg-rose-400',
];

export default function StressBuster() {
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const idRef = useRef(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(prev => {
        if (prev.length < 8) {
          const nextId = idRef.current;
          idRef.current += 1;
          return [...prev, {
            id: nextId,
            x: 10 + Math.random() * 80,
            y: 10 + Math.random() * 70,
            size: 40 + Math.random() * 40,
            color: colors[Math.floor(Math.random() * colors.length)],
          }];
        }
        return prev;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const popBubble = (id) => {
    setBubbles(prev => {
      const exists = prev.some(b => b.id === id);
      if (!exists) {
        return prev;
      }

      setScore(current => current + 1);
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
      setTimeout(() => setMessage(''), 1500);

      return prev.filter(b => b.id !== id);
    });
  };

  return (
    <div className="relative h-80 rounded-2xl bg-gradient-to-br from-purple-50 to-teal-50 dark:from-purple-900/20 dark:to-teal-900/20 overflow-hidden">
      <div className="absolute top-4 left-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl px-4 py-2 z-10">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Score: {score}</p>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-4 py-2 z-10"
          >
            <p className="text-sm font-medium text-purple-600 dark:text-purple-300">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {bubbles.map((bubble) => (
        <motion.button
          key={bubble.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0 }}
          onPointerDown={(event) => {
            event.preventDefault();
            popBubble(bubble.id);
          }}
          onClick={() => popBubble(bubble.id)}
          className={`absolute rounded-full ${bubble.color} opacity-80 hover:opacity-100 cursor-pointer shadow-lg transition-shadow hover:shadow-xl`}
          style={{
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            width: bubble.size,
            height: bubble.size,
            zIndex: 5,
          }}
        />
      ))}

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-400">
        Click bubbles to release stress!
      </p>
    </div>
  );
}