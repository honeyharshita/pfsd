import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const emojis = ['😊', '💜', '🌟', '✨', '🦋', '🌸', '💫', '🌈', '🍃', '💖'];

export default function FloatingEmojis() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => {
        const filtered = prev.filter(p => Date.now() - p.created < 3000);
        if (filtered.length < 5) {
          return [...filtered, {
            id: Date.now(),
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            x: Math.random() * 100,
            created: Date.now()
          }];
        }
        return filtered;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: window.innerHeight, x: `${p.x}vw` }}
            animate={{ opacity: [0, 1, 0], y: -50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute text-2xl"
            style={{ left: `${p.x}%` }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}