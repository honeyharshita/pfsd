import React, { useState, useEffect } from 'react';
import { localApi } from '@/api/localApiClient';
import { aiApi } from '@/api/aiInsightsClient';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, RefreshCw, Heart, Sparkles, Loader2, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const positiveFacts = [
  "🧠 Your brain can form new positive neural pathways at any age.",
  "💪 Acts of kindness boost serotonin in both giver and receiver.",
  "🌿 Spending 20 minutes in nature lowers cortisol by 20%.",
  "😊 Smiling (even fake) triggers real happiness chemicals.",
  "🎵 Music activates the same brain reward regions as food.",
  "🤝 Strong social connections extend life by up to 7 years.",
  "💤 A 20-minute nap improves alertness as much as caffeine.",
  "🌅 Morning sunlight regulates your circadian rhythm naturally.",
  "✍️ Writing down goals makes you 42% more likely to achieve them.",
  "🙏 Gratitude practice increases dopamine and serotonin levels.",
];

const successStories = [
  { name: "Maya", story: "Failed her first startup. Used the lessons to build a $10M company 3 years later. 'Failure was my best teacher.'", emoji: "🚀" },
  { name: "James", story: "Battled anxiety for years. Started meditation. Now teaches mindfulness to 500+ students weekly.", emoji: "🧘" },
  { name: "Sofia", story: "Lost her job during tough times. Used the time to learn coding. Now a senior developer at her dream company.", emoji: "💻" },
  { name: "Ravi", story: "Struggled with depression. Started a journal. Three years of entries became a published book that helped thousands.", emoji: "📚" },
  { name: "Aisha", story: "Felt overwhelmed as a student. Broke goals into tiny steps. Graduated top of her class.", emoji: "🎓" },
];

const affirmationFragments = {
  starts: [
    'You are allowed to grow at your own pace',
    'Even small progress is meaningful progress',
    'Your effort today is building your future strength',
    'You can begin again without shame',
    'Your calm can return one breath at a time',
    'You are more capable than this moment suggests',
    'What feels heavy today can still be carried gently',
    'Your consistency matters more than perfection',
    'You are not behind, you are becoming',
    'You can choose one clear step and trust it',
  ],
  middles: [
    'and every intentional action is rewiring your confidence.',
    'and your nervous system learns safety through steady routines.',
    'and each focused minute is proof of your resilience.',
    'and your setbacks are data, not definitions.',
    'and your self-respect grows when you keep promises to yourself.',
    'and your pace is still valid even when it is slower than expected.',
    'and today is a good day to simplify, not surrender.',
    'and every boundary you keep protects your energy.',
    'and one courageous choice can shift the whole day.',
    'and you do not need to feel perfect to move forward.',
  ],
  closes: [
    'Keep going with kindness.',
    'You are doing better than you think.',
    'Trust your next step.',
    'Your future self will thank you for this moment.',
    'You are still on your path.',
    'Progress is happening, even quietly.',
    'Stay steady and keep showing up.',
    'You can do hard things gently.',
    'One step is enough for now.',
    'Let this be your reset, not your ending.',
  ]
};

function hashText(input = '') {
  const text = String(input || '');
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildLocalAffirmations(seedValue = Date.now(), count = 3) {
  const seed = Math.abs(Number(seedValue) || Date.now());
  const created = [];
  const used = new Set();

  for (let i = 0; i < count * 3 && created.length < count; i += 1) {
    const a = affirmationFragments.starts[(seed + i * 3) % affirmationFragments.starts.length];
    const b = affirmationFragments.middles[(seed + i * 5 + 7) % affirmationFragments.middles.length];
    const c = affirmationFragments.closes[(seed + i * 7 + 13) % affirmationFragments.closes.length];
    const line = `${a}, ${b} ${c}`;
    const key = line.toLowerCase();
    if (!used.has(key)) {
      used.add(key);
      created.push(line);
    }
  }

  return created.slice(0, count);
}

function normalizeAffirmations(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.map(String);
  if (Array.isArray(payload.affirmations)) return payload.affirmations.map(String);
  if (typeof payload.text === 'string') {
    return payload.text
      .split(/\n|\r|\.|\u2022|\-/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);
  }
  return [];
}

export default function PositivityFeed() {
  const [likedQuotes, setLikedQuotes] = useState({});
  const [dailyAffirmation, setDailyAffirmation] = useState(null);
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);

  const [recentAffirmations, setRecentAffirmations] = useState(() => {
    try {
      const stored = localStorage.getItem('positivity_affirmation_history');
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const json = await localApi.entities.list('Quote', '-likes', 20);
      return json?.data || [];
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex(prev => (prev + 1) % positiveFacts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const generateAffirmation = async () => {
    setLoadingAffirmation(true);
    const seed = Date.now() + generationCount * 31 + hashText(positiveFacts[factIndex] || 'fact');
    const historySet = new Set(recentAffirmations.map((item) => item.toLowerCase()));

    try {
      const apiResult = await aiApi.positivityFeed('neutral', 8);
      const remote = normalizeAffirmations(apiResult);
      const local = buildLocalAffirmations(seed, 8);
      const merged = [...remote, ...local]
        .map((line) => String(line).trim())
        .filter(Boolean)
        .filter((line, idx, arr) => arr.findIndex((v) => v.toLowerCase() === line.toLowerCase()) === idx);

      const fresh = merged.filter((line) => !historySet.has(line.toLowerCase()));
      const selected = (fresh.length >= 3 ? fresh : merged).slice(0, 3);

      const newHistory = [...selected, ...recentAffirmations].slice(0, 80);
      setRecentAffirmations(newHistory);
      try {
        localStorage.setItem('positivity_affirmation_history', JSON.stringify(newHistory));
      } catch {
        // ignore storage errors
      }

      setDailyAffirmation({
        affirmations: selected,
        theme: `Fresh Boost ${generationCount + 1}`,
      });
    } catch {
      const local = buildLocalAffirmations(seed, 12)
        .filter((line) => !historySet.has(line.toLowerCase()));
      const selected = (local.length >= 3 ? local : buildLocalAffirmations(seed + 17, 6)).slice(0, 3);
      const newHistory = [...selected, ...recentAffirmations].slice(0, 80);
      setRecentAffirmations(newHistory);
      try {
        localStorage.setItem('positivity_affirmation_history', JSON.stringify(newHistory));
      } catch {
        // ignore storage errors
      }

      setDailyAffirmation({
        affirmations: selected,
        theme: `Offline Boost ${generationCount + 1}`,
      });
    } finally {
      setGenerationCount((prev) => prev + 1);
      setLoadingAffirmation(false);
    }
  };

  const toggleLike = async (quote) => {
    setLikedQuotes(prev => ({ ...prev, [quote.id]: !prev[quote.id] }));
    await localApi.entities.update('Quote', quote.id, { likes: (quote.likes || 0) + (likedQuotes[quote.id] ? -1 : 1) });
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-500" />
            Daily Positivity Feed
          </h1>
          <p className="text-gray-500 mt-1">Quotes, stories, and facts to brighten your day</p>
        </div>

        {/* Rotating Fact */}
        <div className="bg-gradient-to-r from-purple-500 to-teal-500 rounded-2xl p-6 text-white mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <p className="text-xs font-semibold opacity-80 mb-3 uppercase tracking-wide">🔬 Did You Know?</p>
          <AnimatePresence mode="wait">
            <motion.p key={factIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="text-lg font-medium relative z-10">
              {positiveFacts[factIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* AI Affirmations */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" /> AI Daily Affirmations
            </h3>
            <Button variant="outline" size="sm" onClick={generateAffirmation} disabled={loadingAffirmation} className="rounded-xl">
              {loadingAffirmation ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
          {dailyAffirmation ? (
            <div className="space-y-3">
              {dailyAffirmation.affirmations?.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-xl border-l-4 ${
                    i === 0 ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' :
                    i === 1 ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20' :
                    'border-pink-400 bg-pink-50 dark:bg-pink-900/20'
                  }`}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">💫 {a}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <button onClick={generateAffirmation}
              className="w-full py-8 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-800 text-purple-400 hover:border-purple-400 hover:text-purple-600 transition-all">
              Click to generate your personalized affirmations ✨
            </button>
          )}
        </div>

        {/* Success Stories */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            🌟 Inspiring Stories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {successStories.map((story, i) => (
              <motion.div key={i} whileHover={{ y: -2 }}
                className="glass-card rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{story.emoji}</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{story.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{story.story}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quotes */}
        {quotes.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Quote className="w-5 h-5 text-amber-500" /> Motivational Quotes
            </h3>
            <div className="space-y-4">
              {quotes.map((quote, i) => (
                <motion.div key={quote.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className={`glass-card rounded-2xl p-5 border-l-4 ${
                    ['border-purple-400', 'border-teal-400', 'border-pink-400', 'border-amber-400', 'border-blue-400'][i % 5]
                  }`}>
                  <p className="text-gray-700 dark:text-gray-300 italic mb-3">"{quote.text}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">— {quote.author || 'Unknown'}</span>
                    <button onClick={() => toggleLike(quote)}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors">
                      <Heart className={`w-4 h-4 ${likedQuotes[quote.id] ? 'fill-red-500 text-red-500' : ''}`} />
                      {(quote.likes || 0) + (likedQuotes[quote.id] ? 1 : 0)}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}