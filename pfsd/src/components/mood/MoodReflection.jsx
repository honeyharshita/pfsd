import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { MessageSquare } from 'lucide-react';

const questions = {
  stressed: [
    "What caused the stress today?",
    "Is this stress temporary or ongoing?",
    "What one small thing could help right now?",
  ],
  sad: [
    "What triggered this feeling of sadness?",
    "Is there someone you could reach out to?",
    "What usually helps you feel better?",
  ],
  anxious: [
    "What specifically are you worried about?",
    "How likely is the worst case scenario really?",
    "What can you control in this situation?",
  ],
  angry: [
    "What is really beneath this anger (hurt, fear, disappointment)?",
    "Is this worth your energy in 5 years?",
    "How could you express this constructively?",
  ],
  happy: [
    "What made you feel this way today?",
    "Who could you share this joy with?",
    "How can you create more moments like this?",
  ],
  calm: [
    "What helped you reach this calm state?",
    "What are you grateful for right now?",
    "How can you protect this peace?",
  ],
  neutral: [
    "What was the highlight of your day?",
    "What are you looking forward to?",
    "What would make tomorrow better?",
  ],
};

export default function MoodReflection({ mood, onAnswers }) {
  const [answers, setAnswers] = useState({});
  const qs = questions[mood] || questions.neutral;

  const update = (i, val) => {
    const updated = { ...answers, [i]: val };
    setAnswers(updated);
    onAnswers(Object.values(updated).filter(Boolean));
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-purple-500" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reflection Questions</p>
      </div>
      <div className="space-y-3">
        {qs.map((q, i) => (
          <div key={i}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{q}</p>
            <Input value={answers[i] || ''} onChange={e => update(i, e.target.value)}
              placeholder="Your answer (optional)..."
              className="rounded-xl text-sm h-9" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}