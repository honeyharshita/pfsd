import React, { useState, useEffect } from 'react';
import { localApi } from '@/api/localApiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, addMonths } from 'date-fns';
import { BarChart3, Plus, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import MoodSelector from '../components/mood/MoodSelector';
import MoodCalendar from '../components/mood/MoodCalendar';
import MoodReflection from '../components/mood/MoodReflection';
import { useLanguage } from '@/components/shared/LanguageContext';

export default function MoodTracker() {
  const { t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState('');
  const [intensity, setIntensity] = useState([5]);
  const [note, setNote] = useState('');
  const [reflectionAnswers, setReflectionAnswers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['moodEntries'],
    queryFn: async () => {
      const json = await localApi.entities.list('MoodEntry', '-date', 100);
      return json?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => localApi.entities.create('MoodEntry', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodEntries'] });
      setShowForm(false);
      setSelectedMood('');
      setNote('');
      setIntensity([5]);
    },
  });

  const handleSubmit = () => {
    if (!selectedMood) return;
    createMutation.mutate({
      user_email: 'anonymous',
      mood: selectedMood,
      intensity: intensity[0],
      note: [note, ...reflectionAnswers].filter(Boolean).join(' | '),
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const todayEntry = entries.find(e => e.date === format(new Date(), 'yyyy-MM-dd'));
  const weekEntries = entries.slice(0, 7);

  const moodCounts = entries.reduce((acc, e) => {
    acc[e.mood] = (acc[e.mood] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              {t('moodTracker.title')}
            </h1>
            <p className="text-gray-500 mt-1">{t('moodTracker.subtitle')}</p>
          </div>
          {!todayEntry && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-purple-500 to-teal-500 hover:opacity-90 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> {t('moodTracker.checkIn')}
            </Button>
          )}
        </div>

        {/* Today's status */}
        {todayEntry && (
          <div className="glass-card rounded-2xl p-6 mb-8">
            <p className="text-sm text-gray-500 mb-2">{t('moodTracker.todayMood')}</p>
            <div className="flex items-center gap-4">
              <span className="text-4xl">
                {{'happy':'😊','calm':'😌','neutral':'🙂','stressed':'😰','sad':'😢','angry':'😡','anxious':'😟'}[todayEntry.mood]}
              </span>
              <div>
                <p className="font-semibold text-lg capitalize text-gray-800 dark:text-gray-100">{todayEntry.mood}</p>
                <p className="text-sm text-gray-500">{t('moodTracker.intensity')}: {todayEntry.intensity}/10</p>
                {todayEntry.note && <p className="text-sm text-gray-400 mt-1">{todayEntry.note}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Check-in Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass-card rounded-2xl p-6 mb-8"
          >
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('moodTracker.howFeeling')}</h3>
            <MoodSelector selected={selectedMood} onSelect={setSelectedMood} />

            <div className="mt-6">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                {t('moodTracker.intensity')}: {intensity[0]}/10
              </label>
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                max={10}
                min={1}
                step={1}
                className="my-4"
              />
            </div>

            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('chat.placeholder')}
              className="mt-4 rounded-xl"
            />

            {selectedMood && (
              <MoodReflection mood={selectedMood} onAnswers={setReflectionAnswers} />
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={handleSubmit} disabled={!selectedMood} className="bg-gradient-to-r from-purple-500 to-teal-500">
                {t('moodTracker.saveCheckIn')}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>{t('moodTracker.cancel')}</Button>
            </div>
          </motion.div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('moodTracker.totalEntries'), value: entries.length, icon: Calendar },
            { label: t('moodTracker.mostCommon'), value: Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-', icon: TrendingUp },
            { label: t('moodTracker.thisWeek'), value: weekEntries.length, icon: BarChart3 },
            { label: t('moodTracker.avgIntensity'), value: entries.length ? (entries.reduce((s, e) => s + (e.intensity || 5), 0) / entries.length).toFixed(1) : '-', icon: TrendingUp },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 text-center">
              <stat.icon className="w-5 h-5 text-purple-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100 capitalize">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <MoodCalendar
          entries={entries}
          currentMonth={currentMonth}
          onChangeMonth={(dir) => setCurrentMonth(prev => addMonths(prev, dir))}
        />

        {/* Recent History */}
        <div className="glass-card rounded-2xl p-6 mt-8">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('moodTracker.recentHistory')}</h3>
          <div className="space-y-3">
            {entries.slice(0, 10).map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {{'happy':'😊','calm':'😌','neutral':'🙂','stressed':'😰','sad':'😢','angry':'😡','anxious':'😟'}[entry.mood]}
                  </span>
                  <div>
                    <p className="font-medium text-sm capitalize text-gray-700 dark:text-gray-300">{entry.mood}</p>
                    <p className="text-xs text-gray-400">{entry.date}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">{entry.intensity}/10</div>
              </div>
            ))}
            {entries.length === 0 && (
              <p className="text-center text-gray-400 py-8">{t('moodTracker.noEntries')}</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}