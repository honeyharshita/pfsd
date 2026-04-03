import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy } from 'lucide-react';

const pairs = [
  { id: 1, text: 'Stress', match: 'Meditation' },
  { id: 2, text: 'Meditation', match: 'Stress' },
  { id: 3, text: 'Anger', match: 'Deep Breathing' },
  { id: 4, text: 'Deep Breathing', match: 'Anger' },
  { id: 5, text: 'Sadness', match: 'Journaling' },
  { id: 6, text: 'Journaling', match: 'Sadness' },
  { id: 7, text: 'Anxiety', match: 'Grounding' },
  { id: 8, text: 'Grounding', match: 'Anxiety' },
];

export default function MemoryGame() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  };

  const handleFlip = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [first, second] = newFlipped;
      if (cards[first].text === cards[second].match) {
        setMatched(prev => [...prev, first, second]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const isWon = matched.length === cards.length && cards.length > 0;

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">Match emotions with coping strategies</p>
        <p className="text-sm font-medium text-purple-600">Moves: {moves}</p>
      </div>

      {isWon ? (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-8">
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">You Won!</p>
          <p className="text-gray-500">Completed in {moves} moves</p>
          <Button onClick={resetGame} className="mt-4 bg-gradient-to-r from-purple-500 to-teal-500">
            <RotateCcw className="w-4 h-4 mr-2" /> Play Again
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {cards.map((card, i) => {
            const isFlipped = flipped.includes(i) || matched.includes(i);
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFlip(i)}
                className={`aspect-square rounded-xl text-xs font-medium p-2 transition-all ${
                  matched.includes(i)
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-300'
                    : isFlipped
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-transparent border-2 border-gray-200 dark:border-gray-700 hover:border-purple-200'
                }`}
              >
                {isFlipped ? card.text : '?'}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}