import React, { useState } from 'react';
import { localApi } from '@/api/localApiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Shield, Users, MessageCircle, AlertTriangle, BarChart3,
  TrendingUp, CheckCircle, Eye, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';

const MOOD_COLORS = {
  happy: '#facc15', calm: '#60a5fa', neutral: '#a78bfa',
  stressed: '#fb923c', sad: '#818cf8', angry: '#f87171', anxious: '#fbbf24'
};

const severityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function Admin() {
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const json = await localApi.entities.list('User', '', 1000);
      return json?.data || [];
    },
  });

  const { data: moods = [] } = useQuery({
    queryKey: ['adminMoods'],
    queryFn: async () => {
      const json = await localApi.entities.list('MoodEntry', '-date', 500);
      return json?.data || [];
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['crisisAlerts'],
    queryFn: async () => {
      const json = await localApi.entities.list('CrisisAlert', '-created_at', 50);
      return json?.data || [];
    },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['adminConversations'],
    queryFn: async () => {
      const json = await localApi.entities.list('ChatConversation', '-created_at', 100);
      return json?.data || [];
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }) => localApi.entities.update('CrisisAlert', id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crisisAlerts'] }),
  });

  const moodCounts = moods.reduce((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(moodCounts).map(([mood, count]) => ({
    name: mood, value: count, fill: MOOD_COLORS[mood]
  }));

  const moodPercent = (mood) => moods.length ? Math.round((moodCounts[mood] || 0) / moods.length * 100) : 0;

  const newAlerts = alerts.filter(a => a.status === 'new');

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-500" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Platform analytics and crisis management</p>
        </div>

        {/* Crisis Alerts Banner */}
        {newAlerts.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">
                {newAlerts.length} New Crisis Alert{newAlerts.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">Immediate review required</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: users.length, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: 'Mood Entries', value: moods.length, icon: BarChart3, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
            { label: 'Conversations', value: conversations.length, icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Crisis Alerts', value: alerts.length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
          ].map((stat, i) => (
            <div key={i} className={`rounded-2xl p-5 ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Emotion Analytics */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Emotion Analytics</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">No data</div>
            )}
            <div className="space-y-2 mt-4">
              {Object.entries(MOOD_COLORS).map(([mood, color]) => (
                <div key={mood} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm capitalize text-gray-600 dark:text-gray-400">{mood}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{moodPercent(mood)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* User List */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Users ({users.length})</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {users.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold">
                      {u.full_name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{u.full_name || 'User'}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{u.role || 'user'}</Badge>
                </div>
              ))}
              {users.length === 0 && <p className="text-center text-gray-400 py-4">No users yet</p>}
            </div>
          </div>
        </div>

        {/* Crisis Alerts */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Crisis Alerts
          </h3>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={severityColors[alert.severity]}>{alert.severity}</Badge>
                    <Badge variant="outline">{alert.status}</Badge>
                  </div>
                  <span className="text-xs text-gray-400">{alert.created_at ? format(new Date(alert.created_at), 'MMM d, HH:mm') : ''}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">"{alert.trigger_message}"</p>
                <p className="text-xs text-gray-400 mb-3">User: {alert.user_email || 'Anonymous'}</p>
                {alert.status === 'new' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAlertMutation.mutate({ id: alert.id, data: { status: 'reviewing' } })}
                    >
                      <Eye className="w-3 h-3 mr-1" /> Review
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => updateAlertMutation.mutate({ id: alert.id, data: { status: 'resolved' } })}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-gray-400">No crisis alerts. All clear!</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}