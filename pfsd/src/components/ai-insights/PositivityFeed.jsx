import React, { useState, useEffect } from 'react';
import { aiApi } from '../../api/aiInsightsClient';
import { Loader2, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

const MOODS = ['happy', 'sad', 'anxious', 'calm', 'neutral', 'tired', 'motivated', 'inspired'];

export default function PositivityFeed() {
  const [selectedMood, setSelectedMood] = useState('calm');
  const [affirmations, setAffirmations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAffirmations();
  }, [selectedMood]);

  const fetchAffirmations = async () => {
    setLoading(true);
    setError('');
    setCurrentIndex(0);
    try {
      const data = await aiApi.positivityFeed(selectedMood, 5);
      if (data.affirmations) {
        setAffirmations(Array.isArray(data.affirmations) ? data.affirmations : [data.affirmations]);
      } else if (Array.isArray(data)) {
        setAffirmations(data);
      } else {
        setAffirmations([data]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch affirmations');
      setAffirmations([]);
    } finally {
      setLoading(false);
    }
  };

  const nextAffirmation = () => {
    setCurrentIndex((prev) => (prev + 1) % affirmations.length);
  };

  const prevAffirmation = () => {
    setCurrentIndex((prev) => (prev - 1 + affirmations.length) % affirmations.length);
  };

  const currentAffirmation = affirmations[currentIndex];

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold mb-4 text-gray-800 text-center">
        ✨ Daily Positivity Feed
      </h3>

      {/* Mood Selector */}
      <div className="mb-6 space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          What mood would you like affirmations for?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                selectedMood === mood
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Affirmation Carousel */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : affirmations.length > 0 ? (
        <div className="space-y-4">
          {/* Main Affirmation Card */}
          <div className="relative min-h-48 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-lg p-8 shadow-md flex items-center justify-center text-center">
            <div className="absolute top-4 right-4">
              <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">
              {currentAffirmation}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevAffirmation}
              disabled={affirmations.length <= 1}
              className="p-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-sm text-gray-600">
              {currentIndex + 1} / {affirmations.length}
            </div>

            <button
              onClick={nextAffirmation}
              disabled={affirmations.length <= 1}
              className="p-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Carousel Dots */}
          <div className="flex justify-center gap-2">
            {affirmations.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition ${
                  idx === currentIndex ? 'bg-pink-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchAffirmations}
            className="w-full mt-4 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-md transition"
          >
            Get New Affirmations
          </button>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-md text-sm text-center">
          {error}
        </div>
      ) : (
        <div className="text-center p-8 text-gray-500">
          No affirmations available
        </div>
      )}
    </div>
  );
}
