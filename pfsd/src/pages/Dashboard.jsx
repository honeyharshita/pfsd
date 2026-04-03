import React from 'react';
import { localApi } from '@/api/localApiClient';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { PieChart, TrendingUp, Calendar, BarChart3, Brain, Heart, Sparkles, Flame } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RPieChart, Pie, Cell } from 'recharts';
import { useLanguage } from '@/components/shared/LanguageContext';

const MOOD_COLORS = {
  happy: '#facc15', calm: '#60a5fa', neutral: '#a78bfa',
  stressed: '#fb923c', sad: '#818cf8', angry: '#f87171', anxious: '#fbbf24'
};

function toValidDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const { data: moods = [] } = useQuery({
    queryKey: ['dashMoods'],
    queryFn: async () => {
      const json = await localApi.entities.list('MoodEntry', '-date', 200);
      return json?.data || [];
    },
  });

  const { data: journals = [] } = useQuery({
    queryKey: ['dashJournals'],
    queryFn: async () => {
      const json = await localApi.entities.list('JournalEntry', '-date', 100);
      return json?.data || [];
    },
  });

  // Mood distribution
  const moodCounts = moods.reduce((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(moodCounts).map(([mood, count]) => ({
    name: mood, value: count, fill: MOOD_COLORS[mood] || '#a78bfa'
  }));

  // Weekly trend
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayMoods = moods.filter(m => m.date === dayStr);
    const avgIntensity = dayMoods.length ? dayMoods.reduce((s, m) => s + (m.intensity || 5), 0) / dayMoods.length : 0;
    return { day: format(day, 'EEE'), intensity: Math.round(avgIntensity * 10) / 10, count: dayMoods.length };
  });

  // Sentiment trend from journals
  const sentimentData = journals
    .slice(0, 14)
    .reverse()
    .map((j) => {
      const parsedDate = toValidDate(j.date);
      return {
        date: parsedDate ? format(parsedDate, 'MMM d') : 'Unknown',
        score: Number(j.sentiment_score || 0),
      };
    });

  // Emotion heatmap data
  const emotionsByDay = {};
  moods.forEach(m => {
    const parsedDate = toValidDate(m.date);
    if (!parsedDate) return;
    const day = format(parsedDate, 'EEE');
    if (!emotionsByDay[day]) emotionsByDay[day] = {};
    emotionsByDay[day][m.mood] = (emotionsByDay[day][m.mood] || 0) + 1;
  });

  const positiveMoods = moods.filter(m => ['happy', 'calm'].includes(m.mood)).length;
  const positiveRate = moods.length ? Math.round((positiveMoods / moods.length) * 100) : 0;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <PieChart className="w-8 h-8 text-purple-500" />
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('dashboard.totalCheckins'), value: moods.length, icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: t('dashboard.journalEntries'), value: journals.length, icon: Brain, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
            { label: t('dashboard.positiveRate'), value: `${positiveRate}%`, icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
            { label: t('dashboard.currentStreak'), value: `${Math.min(moods.length, 7)}d`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-5 ${stat.bg}`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mood Distribution */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-500" /> {t('dashboard.moodDistribution')}
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RPieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">{t('dashboard.noData')}</div>
            )}
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-xs text-gray-500 capitalize">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-500" /> {t('dashboard.weeklyMoodIntensity')}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={last7}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="intensity" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sentiment Trend */}
          <div className="glass-card rounded-2xl p-6 lg:col-span-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" /> {t('dashboard.journalSentiment')}
            </h3>
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={sentimentData}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis domain={[-1, 1]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={3} dot={{ fill: '#14b8a6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                {t('dashboard.writeJournalPrompt')}
              </div>
            )}
          </div>
        </div>

        {/* Emotion Heatmap */}
        <div className="glass-card rounded-2xl p-6 mt-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" /> {t('dashboard.emotionHeatmap')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-gray-500 font-medium py-2">{t('moodTracker.todayMood')}</th>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <th key={d} className="text-center text-gray-500 font-medium py-2">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(MOOD_COLORS).map(mood => (
                  <tr key={mood}>
                    <td className="capitalize text-gray-600 dark:text-gray-400 py-1">{mood}</td>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                      const count = emotionsByDay[day]?.[mood] || 0;
                      return (
                        <td key={day} className="text-center py-1">
                          <div
                            className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-xs font-medium text-white"
                            style={{
                              backgroundColor: count > 0 ? MOOD_COLORS[mood] : '#f3f4f6',
                              opacity: count > 0 ? Math.min(0.4 + count * 0.2, 1) : 1,
                              color: count > 0 ? 'white' : '#d1d5db',
                            }}
                          >
                            {count || '·'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}