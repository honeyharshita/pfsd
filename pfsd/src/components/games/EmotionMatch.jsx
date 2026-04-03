import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const questionBank = [
  { text: "I lost my job today and I don't know what to do.", answer: 'sad', options: ['Happy', 'Sad', 'Calm', 'Angry'] },
  { text: "I just got promoted! I can't believe it!", answer: 'happy', options: ['Anxious', 'Sad', 'Happy', 'Stressed'] },
  { text: "My exam is tomorrow and I haven't studied at all.", answer: 'anxious', options: ['Happy', 'Calm', 'Anxious', 'Angry'] },
  { text: 'Someone cut me off in traffic and nearly caused an accident.', answer: 'angry', options: ['Sad', 'Happy', 'Calm', 'Angry'] },
  { text: 'I spent the evening reading by the fireplace.', answer: 'calm', options: ['Stressed', 'Calm', 'Anxious', 'Sad'] },
  { text: 'My best friend is moving to another country next week.', answer: 'sad', options: ['Happy', 'Angry', 'Sad', 'Calm'] },
  { text: 'I have three deadlines tomorrow and no time to complete any of them.', answer: 'stressed', options: ['Happy', 'Stressed', 'Calm', 'Sad'] },
  { text: 'I finally finished a project I worked on for months.', answer: 'happy', options: ['Calm', 'Happy', 'Sad', 'Angry'] },
  { text: 'I keep worrying that something bad will happen before my interview.', answer: 'anxious', options: ['Happy', 'Calm', 'Anxious', 'Sad'] },
  { text: 'I feel peaceful after a long walk in the evening.', answer: 'calm', options: ['Calm', 'Angry', 'Sad', 'Stressed'] },
  { text: 'My roommate keeps ignoring my messages and it hurts.', answer: 'sad', options: ['Happy', 'Sad', 'Angry', 'Calm'] },
  { text: 'I am exhausted because I slept only three hours.', answer: 'stressed', options: ['Happy', 'Stressed', 'Calm', 'Anxious'] },
  { text: 'A stranger yelled at me in the store and I felt my blood boil.', answer: 'angry', options: ['Sad', 'Angry', 'Calm', 'Happy'] },
  { text: 'I had a great dinner with my family and felt really loved.', answer: 'happy', options: ['Happy', 'Sad', 'Angry', 'Calm'] },
  { text: "I have too many things happening at once and I can't focus.", answer: 'stressed', options: ['Calm', 'Stressed', 'Happy', 'Sad'] },
  { text: 'I feel relieved after talking through my worries with a close friend.', answer: 'calm', options: ['Calm', 'Angry', 'Sad', 'Anxious'] },
  { text: 'I am worried about moving to a new city and starting over.', answer: 'anxious', options: ['Happy', 'Calm', 'Anxious', 'Stressed'] },
  { text: 'I feel proud because I handled a hard conversation well.', answer: 'happy', options: ['Sad', 'Happy', 'Angry', 'Calm'] },
];

function shuffleArray(items) {
  const copied = [...items];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function buildRoundQuestions(previousRound = [], count = 7) {
  const previousTexts = new Set(previousRound.map((item) => item.text));
  const available = questionBank.filter((item) => !previousTexts.has(item.text));
  const pool = available.length >= count ? available : questionBank;
  return shuffleArray(pool)
    .slice(0, Math.min(count, pool.length))
    .map((item) => ({
      ...item,
      options: shuffleArray(item.options),
    }));
}

export default function EmotionMatch() {
  const [roundQuestions, setRoundQuestions] = useState(() => buildRoundQuestions());
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const q = roundQuestions[current];
  const isCorrect = selected?.toLowerCase() === q?.answer;
  const isFinished = current >= roundQuestions.length;

  const nextRound = () => {
    setRoundQuestions(buildRoundQuestions(roundQuestions));
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
  };

  const handleSelect = (option) => {
    if (selected || !q) return;
    setSelected(option);
    setShowResult(true);

    if (option.toLowerCase() === q.answer) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      setCurrent((prev) => prev + 1);
      setSelected(null);
      setShowResult(false);
    }, 1200);
  };

  const reset = () => {
    nextRound();
  };

  const roundCount = roundQuestions.length || 7;

  if (isFinished) {
    return (
      <div className="text-center py-8">
        <p className="text-5xl mb-4">{score >= 5 ? '🎉' : score >= 3 ? '👍' : '💪'}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{score}/{roundCount}</p>
        <p className="text-gray-500 mt-2">
          {score >= 5 ? 'Excellent emotional intelligence!' : score >= 3 ? 'Good job! Keep practicing!' : 'Practice makes perfect!'}
        </p>
        <Button onClick={reset} className="mt-4 bg-gradient-to-r from-purple-500 to-teal-500">
          <RotateCcw className="w-4 h-4 mr-2" /> Play Again
        </Button>
      </div>
    );
  }

  if (!q) {
    return null;
  }

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">Question {current + 1}/{roundCount}</p>
        <p className="text-sm font-medium text-purple-600">Score: {score}</p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 mb-6">
        <p className="text-gray-800 dark:text-gray-100 font-medium italic">"{q.text}"</p>
      </div>

      <p className="text-sm text-gray-500 mb-3">What emotion is this person feeling?</p>

      <div className="grid grid-cols-2 gap-3">
        {q.options.map((option) => (
          <motion.button
            key={`${q.text}-${option}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(option)}
            className={cn(
              'p-4 rounded-xl border-2 text-sm font-medium transition-all',
              selected === option
                ? isCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700'
                  : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700'
                : showResult && option.toLowerCase() === q.answer
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 text-gray-700 dark:text-gray-300'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              {selected === option && (isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />)}
              {option}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}