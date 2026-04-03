import React, { useState } from 'react';
import { localApi } from '@/api/localApiClient';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { FileText, Loader2, TrendingUp, TrendingDown, Minus, Star, Award, Brain, Calendar, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeeklyReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weekDescription, setWeekDescription] = useState('');
  const [selectedWeekDate, setSelectedWeekDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: moods = [] } = useQuery({
    queryKey: ['reportMoods'],
    queryFn: async () => {
      const json = await localApi.entities.list('MoodEntry', '-date', 50);
      return json?.data || [];
    },
  });

  const { data: journals = [] } = useQuery({
    queryKey: ['reportJournals'],
    queryFn: async () => {
      const json = await localApi.entities.list('JournalEntry', '-date', 20);
      return json?.data || [];
    },
  });

  const getEntryDate = (entry) => entry?.date || entry?.created_at || '';
  const selectedWeek = new Date(`${selectedWeekDate}T00:00:00`);
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  const last7 = moods.filter(m => {
    const d = new Date(getEntryDate(m));
    return d >= weekStart && d <= weekEnd;
  });

  const weeklyChartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(weekStart, -i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayMoods = moods.filter(m => format(new Date(getEntryDate(m)), 'yyyy-MM-dd') === dayStr);
    const score = dayMoods.length ? dayMoods.reduce((s, m) => s + (m.intensity || 5), 0) / dayMoods.length : 0;
    return { day: format(day, 'EEE'), score: Math.round(score * 10) / 10 };
  });

  const generateReport = async () => {
    setLoading(true);
    const moodSummary = last7.map(m => `${getEntryDate(m)}: ${m.mood} (${m.intensity || 5}/10)${m.note ? ' - ' + m.note : ''}`).join('\n');
    const journalSummary = journals
      .filter(j => {
        const d = new Date(getEntryDate(j));
        return d >= weekStart && d <= weekEnd;
      })
      .slice(0, 5)
      .map(j => `${getEntryDate(j)}: ${j.content?.substring(0, 100)}`)
      .join('\n');
    const positiveDays = last7.filter(m => ['happy', 'calm'].includes(m.mood)).length;
    const negativeDays = last7.filter(m => ['stressed', 'sad', 'angry', 'anxious'].includes(m.mood)).length;

    try {
      const result = await localApi.reports.generateWeekly({
        userEmail: 'anonymous',
        weekDescription,
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      });
      setReport(result.reply || result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <FileText className="w-8 h-8 text-teal-500" /> Weekly Self-Reflection Report
          </h1>
          <p className="text-gray-500 mt-1">AI-generated insights about your week — even without tracked data</p>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 text-teal-500" /> Select Week
            </label>
            <input
              type="date"
              value={selectedWeekDate}
              onChange={(e) => setSelectedWeekDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-teal-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <p className="mt-2 text-xs text-gray-500">
              Report range: {format(weekStart, 'MMM d, yyyy')} to {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>

          {/* Week description input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Pencil className="w-4 h-4 text-teal-500" /> How was your week?
            </label>
            <Textarea
              value={weekDescription}
              onChange={e => setWeekDescription(e.target.value)}
              placeholder="Describe your week — highlights, challenges, how you felt, what you did, what stressed you out or made you happy... (e.g. 'This week was hectic, had too many meetings, felt anxious on Tuesday but Friday was great after a walk')"
              className="rounded-xl min-h-[100px] text-sm"
            />
          </div>

          {/* Chart */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-500" /> Tracked Mood This Week
              </h3>
              <span className="text-sm text-gray-500">{last7.length} check-ins</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weeklyChartData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="score" fill="url(#weekGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="weekGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
            {last7.length === 0 && (
              <p className="text-xs text-center text-gray-400 mt-1">No tracked mood this week — describe your week above</p>
            )}
          </div>

          <Button onClick={generateReport} disabled={loading && !weekDescription.trim()}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 rounded-xl py-3 text-white font-semibold">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating your report...</> : <><Brain className="w-4 h-4 mr-2" /> Generate Weekly Report</>}
          </Button>
        </div>

        {report && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl p-8 text-white text-center shadow-xl">
              <p className="text-6xl font-black mb-2">{report.wellness_score}</p>
              <p className="text-xl font-semibold opacity-90">Wellness Score</p>
              <p className="text-white/80 mt-3 max-w-md mx-auto">{report.overall_summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Stress Level', value: report.stress_change, unit: '%', invert: true },
                { label: 'Happiness', value: report.happiness_change, unit: '%', invert: false },
              ].map(item => {
                const improved = item.invert ? item.value < 0 : item.value > 0;
                const Icon = improved ? TrendingUp : item.value === 0 ? Minus : TrendingDown;
                return (
                  <div key={item.label} className={`rounded-2xl p-5 ${improved ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                    <Icon className={`w-6 h-6 mb-2 ${improved ? 'text-green-500' : 'text-orange-500'}`} />
                    <p className={`text-2xl font-bold ${improved ? 'text-green-600' : 'text-orange-600'}`}>
                      {item.value > 0 ? '+' : ''}{item.value}{item.unit}
                    </p>
                    <p className="text-sm text-gray-500">{item.label} Change</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">💜 Personal Message</p>
              <p className="text-gray-700 dark:text-gray-300 italic">"{report.personal_message}"</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-5">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" /> Patterns
                </h4>
                <ul className="space-y-2">
                  {report.emotional_patterns?.map((p, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {p}</li>)}
                </ul>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" /> Achievements
                </h4>
                <ul className="space-y-2">
                  {report.achievements?.map((a, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-400">🏆 {a}</li>)}
                </ul>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-teal-500" /> Next Week Goals
                </h4>
                <ul className="space-y-2">
                  {report.next_week_goals?.map((g, i) => <li key={i} className="text-sm text-gray-600 dark:text-gray-400">🎯 {g}</li>)}
                </ul>
              </div>
            </div>

            {report.most_effective_activity && (
              <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-2xl p-5 border border-green-100 dark:border-green-800">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">⭐ Most Effective Activity</p>
                <p className="text-lg font-bold text-green-800 dark:text-green-300 mt-1">{report.most_effective_activity}</p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}