import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Wind, BookOpen, Feather } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { localApi } from '@/api/localApiClient';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import BreathingBubble from '../components/games/BreathingBubble';

const backgrounds = [
  { id: 'forest', label: '🌿 Forest', class: 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/40' },
  { id: 'ocean', label: '🌊 Ocean', class: 'bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/40 dark:to-cyan-900/40' },
  { id: 'sunset', label: '🌅 Sunset', class: 'bg-gradient-to-br from-orange-100 to-pink-200 dark:from-orange-900/40 dark:to-pink-900/40' },
  { id: 'night', label: '🌙 Night', class: 'bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-900/40 dark:to-purple-900/40' },
  { id: 'minimal', label: '⬜ Minimal', class: 'bg-white dark:bg-gray-900' },
];

export default function SafeSpace() {
  const [activeTab, setActiveTab] = useState('breathe');
  const [background, setBackground] = useState(backgrounds[0]);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const queryClient = useQueryClient();

  const { data: reflections = [] } = useQuery({
    queryKey: ['safeSpaceReflections'],
    queryFn: async () => {
      const json = await localApi.entities.list('JournalEntry', '-date', 100);
      return json?.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data) => localApi.entities.create('JournalEntry', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safeSpaceReflections'] });
    },
  });

  const handleSave = async () => {
    const trimmed = reflection.trim();
    if (!trimmed) return;

    setSaving(true);
    setSaveError('');

    try {
      await saveMutation.mutateAsync({
        content: trimmed,
        date: format(new Date(), 'yyyy-MM-dd'),
        source: 'safe_space',
        ai_analysis: 'Private reflection saved for your history.',
        detected_emotions: ['reflective'],
        sentiment_score: 0,
      });
      setReflection('');
    } catch (error) {
      setSaveError(error.message || 'Could not save this reflection.');
    } finally {
      setSaving(false);
    }
  };

  const safeSpaceHistory = reflections.filter((entry) => entry.source === 'safe_space');

  return (
    <div className={cn("min-h-screen transition-all duration-700 p-6 md:p-10", background.class)}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm mb-4">
            <Shield className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Personal Safe Space</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-700 dark:text-gray-100">Welcome to Your Sanctuary</h1>
          <p className="text-gray-500 mt-2">A calm, private space just for you</p>
        </div>

        {/* Background selector */}
        <div className="flex gap-2 flex-wrap justify-center mb-8">
          {backgrounds.map(bg => (
            <button key={bg.id} onClick={() => setBackground(bg)}
              className={cn("px-3 py-1.5 rounded-full text-sm transition-all",
                background.id === bg.id
                  ? "bg-gray-700 dark:bg-white text-white dark:text-gray-900 shadow-md"
                  : "bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-white/80")}>
              {bg.label}
            </button>
          ))}
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-1.5 mb-6">
          {[
            { id: 'breathe', icon: Wind, label: 'Breathe' },
            { id: 'reflect', icon: Feather, label: 'Reflect' },
            { id: 'journal', icon: BookOpen, label: 'Journal' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 shadow text-gray-800 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-3xl p-6">
          {activeTab === 'breathe' && (
            <div>
              <h3 className="font-semibold text-center text-gray-700 dark:text-gray-200 mb-2">Guided Breathing</h3>
              <p className="text-sm text-center text-gray-500 mb-4">Focus on your breath. Let everything else fade away.</p>
              <BreathingBubble />
            </div>
          )}

          {activeTab === 'reflect' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">Reflection Prompts</h3>
              {[
                "What am I feeling right now, and where do I feel it in my body?",
                "What is one thing I can let go of today?",
                "What does my heart need most right now?",
                "What am I grateful for in this exact moment?",
                "What is one small thing I can do to take care of myself today?",
              ].map((prompt, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-white/70 dark:bg-gray-700/50 border border-white/50 dark:border-gray-600/50">
                  <p className="text-sm text-gray-600 dark:text-gray-300">💭 {prompt}</p>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'journal' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Private Reflection</h3>
              <p className="text-xs text-gray-400 mb-4">Write freely. Your reflections can be saved into your private history.</p>
              <Textarea value={reflection} onChange={e => setReflection(e.target.value)}
                placeholder="Let it all out here. Whatever you're feeling, it's okay to express it..."
                className="min-h-[250px] rounded-xl bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-600/50 resize-none" />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-400">{reflection.length} characters</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setReflection('')} className="text-gray-400 text-xs">
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!reflection.trim() || saving}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {saving ? 'Saving...' : 'Save Entry'}
                  </Button>
                </div>
              </div>
              {saveError && <p className="text-sm text-red-500">{saveError}</p>}

              <div className="pt-2 border-t border-white/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Saved History</h4>
                  <span className="text-xs text-gray-400">{safeSpaceHistory.length} saved</span>
                </div>

                {safeSpaceHistory.length > 0 ? (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {safeSpaceHistory.slice(0, 10).map((entry) => (
                      <div key={entry.id} className="rounded-xl bg-white/70 dark:bg-gray-700/50 border border-white/50 dark:border-gray-600/50 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-xs text-gray-400">{entry.date || 'Saved reflection'}</p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Saved
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap line-clamp-4">{entry.content}</p>
                        {entry.ai_analysis && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{entry.ai_analysis}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No saved reflections yet. Save one to build your history.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            🔒 This space is for you alone. Take all the time you need.
          </p>
        </div>
      </motion.div>
    </div>
  );
}