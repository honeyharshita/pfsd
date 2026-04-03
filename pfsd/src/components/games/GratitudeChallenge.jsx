import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Plus, Sparkles, Check } from 'lucide-react';
import { localApi } from '@/api/localApiClient';
import { format } from 'date-fns';

export default function GratitudeChallenge() {
  const [items, setItems] = useState(['', '', '']);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const filledItems = items.filter(i => i.trim());
    if (filledItems.length === 0) return;
    setSaving(true);
    await localApi.entities.create('JournalEntry', {
      content: `Gratitude entries: ${filledItems.join(', ')}`,
      gratitude_items: filledItems,
      date: format(new Date(), 'yyyy-MM-dd'),
      detected_emotions: ['grateful', 'positive'],
      sentiment_score: 0.8,
    });
    setSaving(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Wonderful!</h3>
        <p className="text-gray-500 mt-2">Your gratitude has been saved. Keep the streak going! 🔥</p>
        <Button
          onClick={() => { setSubmitted(false); setItems(['', '', '']); }}
          variant="outline"
          className="mt-4"
        >
          Write More
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Write 3 things you're grateful for today</p>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-amber-500" />
            </div>
            <Input
              value={item}
              onChange={(e) => {
                const newItems = [...items];
                newItems[i] = e.target.value;
                setItems(newItems);
              }}
              placeholder={`Gratitude #${i + 1}...`}
              className="rounded-xl"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-4">
        <Button
          onClick={() => setItems([...items, ''])}
          variant="outline"
          size="sm"
          className="rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1" /> Add More
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={items.every(i => !i.trim()) || saving}
          className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl"
        >
          {saving ? 'Saving...' : 'Save Gratitude'} ✨
        </Button>
      </div>
    </div>
  );
}