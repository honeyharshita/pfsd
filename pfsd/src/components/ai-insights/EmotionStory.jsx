// @ts-nocheck
import React, { useState } from 'react';
import { aiApi } from '../../api/aiInsightsClient.js';
import { Loader2, BookOpen } from 'lucide-react';

const EMOTIONS = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation'];

function getWordCount(text = '') {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function normalizeMoodKey(emotions = []) {
  const first = String(Array.isArray(emotions) ? emotions[0] : '').toLowerCase();
  if (first === 'sadness') return 'sad';
  if (first === 'fear') return 'anxious';
  if (first === 'joy') return 'happy';
  return first || 'neutral';
}

function getStoryIntensity(moodKey = 'neutral', sentimentScore = null, intensityScore = null) {
  const key = String(moodKey || 'neutral').toLowerCase();
  const moodBase = {
    sad: 68,
    stressed: 82,
    anxious: 88,
    angry: 92,
    happy: 66,
    calm: 38,
    neutral: 48,
  };
  const base = Number.isFinite(Number(intensityScore)) ? Number(intensityScore) : (moodBase[key] || moodBase.neutral);
  const sentiment = Number.isFinite(Number(sentimentScore)) ? Number(sentimentScore) : 0;
  const adjusted = Math.max(0, Math.min(100, Math.round(base + (Math.abs(sentiment) * 11) - (sentiment > 0 ? 5 : 0))));

  const profileByMood = {
    sad: {
      high: { at: 76, label: 'Heavy', className: 'bg-indigo-100 text-indigo-800' },
      mid: { at: 56, label: 'Reflective', className: 'bg-blue-100 text-blue-800' },
      low: { label: 'Softening', className: 'bg-gray-100 text-gray-800' },
    },
    stressed: {
      high: { at: 84, label: 'Overloaded', className: 'bg-orange-100 text-orange-800' },
      mid: { at: 64, label: 'Pressured', className: 'bg-amber-100 text-amber-800' },
      low: { label: 'Stabilizing', className: 'bg-lime-100 text-lime-800' },
    },
    anxious: {
      high: { at: 87, label: 'Hyperalert', className: 'bg-rose-100 text-rose-800' },
      mid: { at: 67, label: 'On Edge', className: 'bg-fuchsia-100 text-fuchsia-800' },
      low: { label: 'Grounding', className: 'bg-cyan-100 text-cyan-800' },
    },
    angry: {
      high: { at: 86, label: 'Intense', className: 'bg-rose-100 text-rose-800' },
      mid: { at: 66, label: 'Activated', className: 'bg-red-100 text-red-800' },
      low: { label: 'Refocusing', className: 'bg-orange-100 text-orange-800' },
    },
    happy: {
      high: { at: 74, label: 'Uplifted', className: 'bg-yellow-100 text-yellow-800' },
      mid: { at: 54, label: 'Bright', className: 'bg-emerald-100 text-emerald-800' },
      low: { label: 'Light', className: 'bg-teal-100 text-teal-800' },
    },
    calm: {
      high: { at: 56, label: 'Centered', className: 'bg-cyan-100 text-cyan-800' },
      mid: { at: 38, label: 'Steady', className: 'bg-sky-100 text-sky-800' },
      low: { label: 'Gentle', className: 'bg-gray-100 text-gray-800' },
    },
    neutral: {
      high: { at: 62, label: 'Engaged', className: 'bg-violet-100 text-violet-800' },
      mid: { at: 44, label: 'Balanced', className: 'bg-gray-100 text-gray-800' },
      low: { label: 'Even', className: 'bg-slate-100 text-slate-800' },
    },
  };

  const profile = profileByMood[key] || profileByMood.neutral;
  if (adjusted >= profile.high.at) return { ...profile.high, score: adjusted };
  if (adjusted >= profile.mid.at) return { ...profile.mid, score: adjusted };
  return { ...profile.low, score: adjusted };
}

export default function EmotionStory() {
  const [selectedEmotions, setSelectedEmotions] = useState(['joy']);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleEmotion = (emotion) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== emotion));
    } else {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  const handleGenerateStory = async () => {
    if (selectedEmotions.length === 0) {
      setError('Please select at least one emotion');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await aiApi.emotionStory(selectedEmotions);
      const normalized = typeof data === 'string'
        ? { story: data }
        : (data?.story && typeof data.story === 'string' ? data : { story: data?.story || String(data || '') });
      const storyText = normalized.story || '';
      setStory({
        ...normalized,
        word_count: Number(normalized.word_count) || getWordCount(storyText),
        sentiment_score: Number.isFinite(Number(normalized.sentiment_score)) ? Number(normalized.sentiment_score) : null,
        emotional_intensity_score: Number.isFinite(Number(normalized.emotional_intensity_score))
          ? Math.max(0, Math.min(100, Number(normalized.emotional_intensity_score)))
          : null,
      });
    } catch (err) {
      setError(err.message || 'Failed to generate emotion story');
      setStory(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Emotion Story
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select emotions you're experiencing:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EMOTIONS.map((emotion) => (
              <button
                key={emotion}
                onClick={() => toggleEmotion(emotion)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition ${
                  selectedEmotions.includes(emotion)
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {emotion}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerateStory}
          disabled={loading || selectedEmotions.length === 0}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-md transition"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
          ) : null}
          Generate Story
        </button>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {story && (
          <div className="p-4 bg-indigo-50 rounded-md space-y-3">
            {(() => {
              const intensity = getStoryIntensity(
                normalizeMoodKey(selectedEmotions),
                story.sentiment_score,
                story.emotional_intensity_score
              );
              return (
                <>
            <h4 className="font-semibold text-indigo-900">{story.title || 'Your Story'}</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-700 border border-indigo-100">
                {story.word_count || 0} words
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${intensity.className}`}>
                Intensity: {intensity.label} ({intensity.score}/100)
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{story.story || ''}</p>
            {story.moral && <p className="text-xs text-indigo-700 font-medium">Moral: {story.moral}</p>}
            {story.affirmation && <p className="text-xs text-indigo-600 italic">“{story.affirmation}”</p>}
            {story.reflection_question && <p className="text-xs text-gray-600">Reflection: {story.reflection_question}</p>}
                </>
              );
            })()}
            <div className="text-xs text-indigo-600 italic pt-2">
              Emotions: {selectedEmotions.join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
