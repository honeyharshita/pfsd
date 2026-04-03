import React, { useState } from 'react';
import { localApi } from '@/api/localApiClient';
import { aiApi } from '@/api/aiInsightsClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { BookOpen, Plus, Sparkles, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const emotionColors = {
  happy: 'bg-yellow-100 text-yellow-800',
  sad: 'bg-blue-100 text-blue-800',
  stressed: 'bg-orange-100 text-orange-800',
  stress: 'bg-orange-100 text-orange-800',
  anxious: 'bg-amber-100 text-amber-800',
  angry: 'bg-red-100 text-red-800',
  grateful: 'bg-green-100 text-green-800',
  positive: 'bg-emerald-100 text-emerald-800',
  calm: 'bg-cyan-100 text-cyan-800',
  hopeful: 'bg-purple-100 text-purple-800',
  neutral: 'bg-gray-100 text-gray-800',
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function countMatches(text, words = []) {
  return words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
}

function buildLocalJournalAnalysis(content = '') {
  const text = String(content || '').trim();
  const lower = text.toLowerCase();

  const emotionScores = [
    { emotion: 'anxious', score: countMatches(lower, ['anxious', 'worried', 'panic', 'overwhelm', 'nervous']) * 1.4 },
    { emotion: 'sad', score: countMatches(lower, ['sad', 'down', 'lonely', 'cry', 'empty', 'hurt']) * 1.3 },
    { emotion: 'stressed', score: countMatches(lower, ['stress', 'stressed', 'pressure', 'deadline', 'drained', 'exhausted']) * 1.3 },
    { emotion: 'angry', score: countMatches(lower, ['angry', 'frustrated', 'irritated', 'furious']) * 1.2 },
    { emotion: 'hopeful', score: countMatches(lower, ['hopeful', 'better', 'improving', 'progress', 'healing']) * 1.2 },
    { emotion: 'grateful', score: countMatches(lower, ['grateful', 'thankful', 'appreciate', 'blessed']) * 1.1 },
    { emotion: 'calm', score: countMatches(lower, ['calm', 'peaceful', 'steady', 'balanced', 'grounded']) * 1.1 },
  ]
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const themeScores = [
    { theme: 'work and responsibility', score: countMatches(lower, ['work', 'job', 'school', 'study', 'deadline', 'task']) },
    { theme: 'relationships', score: countMatches(lower, ['friend', 'family', 'partner', 'lonely', 'alone', 'relationship']) },
    { theme: 'rest and energy', score: countMatches(lower, ['sleep', 'tired', 'rest', 'energy', 'drained', 'exhausted']) },
    { theme: 'change and uncertainty', score: countMatches(lower, ['change', 'uncertain', 'future', 'new', 'transition']) },
    { theme: 'healing and growth', score: countMatches(lower, ['heal', 'healing', 'grow', 'progress', 'learn']) },
    { theme: 'gratitude and support', score: countMatches(lower, ['grateful', 'thankful', 'support', 'kind', 'help']) },
  ]
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const positiveHits = countMatches(lower, ['happy', 'good', 'calm', 'hopeful', 'grateful', 'peaceful', 'better']);
  const negativeHits = countMatches(lower, ['sad', 'anxious', 'stress', 'angry', 'tired', 'worried', 'panic', 'overwhelm']);
  const sentiment_score = Number(clamp((positiveHits - negativeHits) * 0.2 - 0.1 + clamp(text.length / 900, 0, 1) * 0.1, -1, 1).toFixed(2));
  const detected_emotions = emotionScores.length > 0 ? emotionScores.slice(0, 3).map((item) => item.emotion) : ['neutral'];
  const primaryEmotion = detected_emotions[0];
  const primaryTheme = themeScores[0]?.theme || 'your current emotional state';

  return {
    analysis: primaryEmotion === 'neutral'
      ? `This entry feels reflective and steady. The main theme is ${primaryTheme}, and the smallest details in your day may be worth noticing.`
      : `This entry carries a ${primaryEmotion} tone, with ${primaryTheme} standing out. You may benefit from a small grounding step that supports your energy and focus.`,
    detected_emotions,
    sentiment_score,
    triggers: themeScores.slice(0, 3).map((item) => item.theme),
    themes: themeScores.slice(0, 4).map((item) => item.theme),
    summary_title: primaryEmotion === 'neutral' ? 'Reflective Balance' : `${primaryEmotion.charAt(0).toUpperCase() + primaryEmotion.slice(1)} Pattern`,
    reflection_prompt: primaryEmotion === 'neutral'
      ? 'What part of this day felt most meaningful to you?'
      : `What would help you feel more supported when ${primaryTheme} comes up again?`,
    supportive_note: primaryEmotion === 'neutral'
      ? 'You do not need a big emotional shift for this entry to matter.'
      : `Your feelings make sense, and a small step around ${primaryTheme} could help you feel steadier.`,
    emotion: primaryEmotion,
    suggestions: primaryEmotion === 'neutral'
      ? ['Notice one small detail you want to remember from today.']
      : [`Take one small grounding step related to ${primaryTheme}.`, 'Keep the next action simple and realistic.'],
  };
}

function normalizeJournalAnalysis(result = {}) {
  const rawEmotions = Array.isArray(result.detected_emotions)
    ? result.detected_emotions
    : Array.isArray(result.emotions)
      ? result.emotions
      : [];
  const rawThemes = Array.isArray(result.themes) ? result.themes : [];
  const rawTriggers = Array.isArray(result.triggers) ? result.triggers : [];
  const rawSuggestions = Array.isArray(result.suggestions) ? result.suggestions : [];

  return {
    analysis: String(result.analysis || result.summary || result.brief_observation || '').trim(),
    detected_emotions: rawEmotions.length > 0 ? rawEmotions : ['neutral'],
    sentiment_score: Number.isFinite(Number(result.sentiment_score)) ? Number(result.sentiment_score) : 0,
    triggers: rawTriggers.length > 0 ? rawTriggers : rawThemes,
    themes: rawThemes.length > 0 ? rawThemes : rawTriggers,
    summary_title: String(result.summary_title || result.title || 'Journal Insight').trim(),
    reflection_prompt: String(result.reflection_prompt || 'What feels most important about this entry?').trim(),
    supportive_note: String(result.supportive_note || 'Thank you for reflecting today.').trim(),
    emotion: String(result.emotion || rawEmotions[0] || 'neutral').trim(),
    suggestions: rawSuggestions.length > 0 ? rawSuggestions : [String(result.supportive_note || 'Take one small supportive step today.').trim()],
    stored_analysis_id: String(result.stored_analysis_id || '').trim(),
  };
}

export default function Journal() {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journalEntries'],
    queryFn: async () => {
      const json = await localApi.entities.list('JournalEntry', '-date', 50);
      return json?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => localApi.entities.create('JournalEntry', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      setShowForm(false);
      setContent('');
    },
  });

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setAnalyzing(true);
    setSubmitError('');

    let analysisResult;
    try {
      const response = await aiApi.journalAnalysis({ content, userEmail: 'anonymous' });
      analysisResult = normalizeJournalAnalysis(response.reply || response);
    } catch (error) {
      analysisResult = buildLocalJournalAnalysis(content);
    }

    try {
      await createMutation.mutateAsync({
        content,
        ai_analysis: analysisResult.analysis,
        detected_emotions: analysisResult.detected_emotions,
        sentiment_score: analysisResult.sentiment_score,
        date: format(new Date(), 'yyyy-MM-dd'),
        summary_title: analysisResult.summary_title,
        reflection_prompt: analysisResult.reflection_prompt,
        supportive_note: analysisResult.supportive_note,
        themes: analysisResult.themes,
        triggers: analysisResult.triggers,
        emotion: analysisResult.emotion,
        suggestions: analysisResult.suggestions,
        stored_analysis_id: analysisResult.stored_analysis_id || null,
      });
    } catch (error) {
      setSubmitError(error.message || 'Failed to save the journal entry.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-purple-500" />
              AI Journal
            </h1>
            <p className="text-gray-500 mt-1">Write your thoughts & get AI insights</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-purple-500 to-teal-500 rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> New Entry
          </Button>
        </div>

        {/* Write Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-2xl p-6 mb-8"
            >
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">What's on your mind?</h3>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write freely about your thoughts, feelings, and experiences today..."
                className="min-h-[200px] rounded-xl"
              />
              <div className="flex gap-3 mt-4">
                <Button onClick={handleSubmit} disabled={!content.trim() || analyzing} className="bg-gradient-to-r from-purple-500 to-teal-500">
                  {analyzing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Save & Analyze</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
              {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{entries.length}</p>
            <p className="text-xs text-gray-500">Total Entries</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {entries.length > 0 ? (entries.reduce((s,e) => s + (e.sentiment_score || 0), 0) / entries.length).toFixed(1) : '–'}
            </p>
            <p className="text-xs text-gray-500">Avg Sentiment</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {entries.filter(e => e.gratitude_items?.length > 0).length}
            </p>
            <p className="text-xs text-gray-500">Gratitude Days</p>
          </div>
        </div>

        {/* Entries */}
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {entry.date}
                </div>
                {entry.sentiment_score != null && (
                  <Badge variant="secondary" className={entry.sentiment_score > 0 ? 'bg-green-100 text-green-700' : entry.sentiment_score < -0.3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}>
                    {entry.sentiment_score > 0 ? 'Positive' : entry.sentiment_score < -0.3 ? 'Negative' : 'Neutral'}
                  </Badge>
                )}
              </div>

              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">{entry.content}</p>

              {entry.detected_emotions?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {entry.detected_emotions.map((emotion, j) => (
                    <Badge key={j} className={emotionColors[emotion.toLowerCase()] || 'bg-gray-100 text-gray-700'}>
                      {emotion}
                    </Badge>
                  ))}
                </div>
              )}

              {entry.ai_analysis && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mt-3">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-medium mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> AI Insight
                  </div>
                  <p className="text-sm text-purple-800 dark:text-purple-300">{entry.ai_analysis}</p>
                </div>
              )}

              {(entry.emotion || entry.stored_analysis_id || entry.suggestions?.length > 0) && (
                <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-4 mt-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {entry.emotion && (
                      <Badge className={emotionColors[String(entry.emotion).toLowerCase()] || 'bg-gray-100 text-gray-700'}>
                        Emotion: {entry.emotion}
                      </Badge>
                    )}
                    {entry.stored_analysis_id && (
                      <Badge variant="outline" className="text-xs text-gray-500">
                        Saved analysis: {entry.stored_analysis_id}
                      </Badge>
                    )}
                  </div>

                  {entry.suggestions?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Suggestions</p>
                      <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        {entry.suggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {entry.gratitude_items?.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mt-3">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">🙏 Gratitude Items</p>
                  <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                    {entry.gratitude_items.map((item, j) => (
                      <li key={j}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}

          {entries.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">No journal entries yet. Start writing!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}