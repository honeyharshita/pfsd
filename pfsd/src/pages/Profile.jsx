import React, { useState, useEffect } from 'react';
import { localApi } from '@/api/localApiClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Settings, Heart, Target, Bell, Award, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AchievementBadge from '../components/shared/AchievementBadge';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/components/shared/LanguageContext';

export default function Profile() {
  const { user: authUser } = useAuth();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [moodGoal, setMoodGoal] = useState('');
  const [notifications, setNotifications] = useState({
    daily_checkin: true,
    gratitude_reminder: true,
    meditation_reminder: false,
  });

  const queryClient = useQueryClient();

  const { data: wellness } = useQuery({
    queryKey: ['userWellness'],
    queryFn: async () => {
      const json = await localApi.entities.list('UserWellness', '-updated_at', 200);
      const rows = json?.data || [];
      const email = authUser?.email || 'anonymous';
      return rows.find((item) => item.user_email === email) || rows[0] || null;
    },
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const json = await localApi.entities.list('Achievement', '-created_at', 200);
      return json?.data || [];
    },
  });

  const { data: moods = [] } = useQuery({
    queryKey: ['profileMoods'],
    queryFn: async () => {
      const json = await localApi.entities.list('MoodEntry', '-date', 200);
      return json?.data || [];
    },
  });

  const { data: journals = [] } = useQuery({
    queryKey: ['profileJournals'],
    queryFn: async () => {
      const json = await localApi.entities.list('JournalEntry', '-date', 200);
      return json?.data || [];
    },
  });

  useEffect(() => {
    localApi.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (wellness) {
      setMoodGoal(wellness.mood_goal || '');
      setNotifications(wellness.notification_preferences || notifications);
    }
  }, [wellness]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        mood_goal: moodGoal,
        user_email: authUser?.email || 'anonymous',
        notification_preferences: notifications,
        wellness_score: Math.min(100, moods.length * 2 + journals.length * 3),
        gratitude_streak: journals.filter(j => j.gratitude_items?.length > 0).length,
      };
      if (wellness) {
        await localApi.entities.update('UserWellness', wellness.id, data);
      } else {
        await localApi.entities.create('UserWellness', data);
      }

      await fetch('http://localhost:5000/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: authUser?.email || 'anonymous',
          notification_preferences: notifications,
        }),
      });

      localStorage.setItem('mindful_daily_checkin_enabled', notifications.daily_checkin ? 'true' : 'false');
      queryClient.invalidateQueries({ queryKey: ['userWellness'] });

      toast({
        title: t('profile.settingsSavedTitle'),
        description: t('profile.settingsSavedDesc'),
      });
    } catch (error) {
      toast({
        title: t('profile.saveFailedTitle'),
        description: t('profile.saveFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const wellnessScore = wellness?.wellness_score || Math.min(100, moods.length * 2 + journals.length * 3);

  // Generate sample achievements
  const allAchievements = [
    { type: 'mood_checkins', count: moods.length, badge_level: moods.length >= 30 ? 'gold' : moods.length >= 14 ? 'silver' : 'bronze', unlocked: moods.length >= 7 },
    { type: 'journal_entries', count: journals.length, badge_level: journals.length >= 20 ? 'gold' : journals.length >= 10 ? 'silver' : 'bronze', unlocked: journals.length >= 3 },
    { type: 'gratitude_streak', count: journals.filter(j => j.gratitude_items?.length).length, badge_level: 'silver', unlocked: journals.filter(j => j.gratitude_items?.length).length >= 5 },
    { type: 'positive_days', count: moods.filter(m => ['happy', 'calm'].includes(m.mood)).length, badge_level: 'gold', unlocked: moods.filter(m => ['happy', 'calm'].includes(m.mood)).length >= 5 },
    { type: 'meditation_sessions', count: 0, badge_level: 'bronze', unlocked: false },
    { type: 'games_played', count: 0, badge_level: 'bronze', unlocked: false },
  ];

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-purple-500" />
          {t('profile.title')}
        </h1>

        {/* User Info */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.full_name?.[0] || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{user?.full_name || 'Loading...'}</h2>
              <p className="text-sm text-gray-500">{user?.email || ''}</p>
            </div>
          </div>

          {/* Wellness Score */}
          <div className="bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-900/20 dark:to-teal-900/20 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('profile.wellnessScore')}</p>
              <p className="text-2xl font-bold text-purple-600">{wellnessScore}/100</p>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${wellnessScore}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-teal-500 rounded-full"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{moods.length}</p>
              <p className="text-xs text-gray-500">{t('profile.checkins')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{journals.length}</p>
              <p className="text-xs text-gray-500">{t('profile.journalEntries')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {allAchievements.filter(a => a.unlocked).length}
              </p>
              <p className="text-xs text-gray-500">{t('profile.badgesEarned')}</p>
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" /> {t('profile.moodGoals')}
          </h3>
          <Textarea
            value={moodGoal}
            onChange={(e) => setMoodGoal(e.target.value)}
            placeholder={t('profile.moodGoalsPlaceholder')}
            className="rounded-xl mb-4"
          />

          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-500" /> {t('profile.notifications')}
          </h3>
          <div className="space-y-4">
            {[
              { key: 'daily_checkin', label: t('profile.dailyCheckin') },
              { key: 'gratitude_reminder', label: t('profile.gratitudeReminder') },
              { key: 'meditation_reminder', label: t('profile.meditationReminder') },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <Label className="text-sm text-gray-600 dark:text-gray-400">{item.label}</Label>
                <Switch
                  checked={notifications[item.key] || false}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.key]: checked }))}
                />
              </div>
            ))}
          </div>

          <Button onClick={handleSave} className="mt-6 bg-gradient-to-r from-purple-500 to-teal-500 rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t('profile.saveSettings')}
          </Button>
        </div>

        {/* Achievements */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" /> {t('profile.achievements')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {allAchievements.map((a, i) => (
              <AchievementBadge key={i} achievement={a} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}