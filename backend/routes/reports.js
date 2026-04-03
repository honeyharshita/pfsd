import express from 'express';
import { getDb } from '../db.js';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { sendAIError } from './aiError.js';
import { buildWeeklyDataDrivenReport } from '../services/aiService.js';

const router = express.Router();

function computeWeeklySignals({ weekDescription = '', moods = [], journals = [] } = {}) {
  const textParts = [
    String(weekDescription || ''),
    moods.map((m) => `${m.mood || ''} ${m.note || ''}`).join(' '),
    journals.map((j) => j.content || '').join(' '),
  ];
  const text = textParts.join(' ').toLowerCase();

  const positiveWordHits = (text.match(/good|better|calm|happy|relaxed|peace|support|walk|exercise|rest|sleep|progress|accomplish|grateful|hopeful/g) || []).length;
  const negativeWordHits = (text.match(/bad|stress|stressed|anxious|panic|overwhelm|sad|angry|tired|exhaust|burnout|pressure|conflict|lonely|worried/g) || []).length;

  const moodValence = {
    happy: 2,
    calm: 1,
    peaceful: 1,
    neutral: 0,
    stressed: -1,
    anxious: -2,
    sad: -2,
    angry: -2,
    tired: -1,
  };

  const moodSignals = moods.map((m) => {
    const key = String(m.mood || 'neutral').toLowerCase();
    return moodValence[key] ?? 0;
  });

  const moodAverage = moodSignals.length > 0
    ? moodSignals.reduce((sum, value) => sum + value, 0) / moodSignals.length
    : 0;

  const moodPositives = moodSignals.filter((value) => value > 0).length;
  const moodNegatives = moodSignals.filter((value) => value < 0).length;

  const stressChange = Math.max(
    -30,
    Math.min(
      30,
      (negativeWordHits * 4) - (positiveWordHits * 3) + (moodNegatives * 5) - (moodPositives * 4)
    )
  );

  const happinessChange = Math.max(
    -30,
    Math.min(
      30,
      (positiveWordHits * 4) - (negativeWordHits * 3) + (moodPositives * 5) - (moodNegatives * 4)
    )
  );

  const scoreFromText = 6 + Math.max(-2, Math.min(2, (positiveWordHits - negativeWordHits) / 4));
  const scoreFromMoods = 6 + Math.max(-2.5, Math.min(2.5, moodAverage * 1.4));
  const combinedScore = moods.length > 0
    ? (scoreFromText * 0.35) + (scoreFromMoods * 0.65)
    : scoreFromText;

  const wellnessScore = Math.max(1, Math.min(10, Math.round(combinedScore)));

  return {
    stressChange,
    happinessChange,
    wellnessScore,
    positiveWordHits,
    negativeWordHits,
  };
}

function normalizeRecordDate(record) {
  return record?.date || record?.created_at || record?.completed_at || record?.unlocked_date || null;
}

function isAnonymousUser(userEmail) {
  return String(userEmail || 'anonymous').toLowerCase() === 'anonymous';
}

function isRecordForUser(record, userEmail) {
  const recordEmail = String(record?.user_email || '').trim();
  if (isAnonymousUser(userEmail)) {
    return !recordEmail || recordEmail.toLowerCase() === 'anonymous';
  }
  return recordEmail.toLowerCase() === String(userEmail || '').toLowerCase();
}

function isCompletedActivity(activity = {}) {
  return Boolean(
    activity?.completed ||
    String(activity?.status || '').toLowerCase() === 'done' ||
    activity?.unlocked ||
    Number(activity?.count || 0) > 0
  );
}

function toMoodScores(moodValue = '') {
  const key = String(moodValue || 'neutral').toLowerCase();
  const table = {
    happy: { happiness: 85, stress: 20 },
    calm: { happiness: 75, stress: 30 },
    peaceful: { happiness: 78, stress: 26 },
    neutral: { happiness: 50, stress: 50 },
    stressed: { happiness: 35, stress: 75 },
    anxious: { happiness: 25, stress: 85 },
    sad: { happiness: 20, stress: 70 },
    angry: { happiness: 15, stress: 80 },
    tired: { happiness: 40, stress: 65 },
  };
  return table[key] || table.neutral;
}

function calculatePercentChange(values = []) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const midpoint = Math.ceil(values.length / 2);
  const firstHalf = values.slice(0, midpoint);
  const secondHalf = values.slice(midpoint);

  const avg = (arr) => (arr.length ? arr.reduce((sum, value) => sum + value, 0) / arr.length : 0);
  const firstAvg = avg(firstHalf);
  const secondAvg = avg(secondHalf);

  if (firstAvg === 0) return secondAvg === 0 ? 0 : 100;
  const raw = ((secondAvg - firstAvg) / Math.abs(firstAvg)) * 100;
  return Math.max(-100, Math.min(100, Math.round(raw)));
}

function pickMostEffectiveActivity(completedActivities = []) {
  if (!completedActivities.length) return 'No completed activity recorded this week';

  const counts = new Map();
  for (const activity of completedActivities) {
    const label = String(
      activity?.title || activity?.name || activity?.activity || activity?.type || 'Wellness activity'
    ).trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] || 'Wellness activity';
}

function createReadableSummary({ moodCount, completedCount, happinessChange, stressChange, activityLabel }) {
  const happinessText = happinessChange > 0 ? `up ${happinessChange}%` : happinessChange < 0 ? `down ${Math.abs(happinessChange)}%` : 'unchanged';
  const stressText = stressChange > 0 ? `up ${stressChange}%` : stressChange < 0 ? `down ${Math.abs(stressChange)}%` : 'unchanged';
  return `This weekly report is based on ${moodCount} real mood logs and ${completedCount} completed activities. Happiness is ${happinessText} while stress is ${stressText}. The most effective activity this week was ${activityLabel}.`;
}

async function weeklyReportHandler(req, res) {
  try {
    const input = req.method === 'GET' ? req.query : req.body;
    const {
      userEmail = 'anonymous',
      weekDescription = '',
      weekStart,
      weekEnd,
    } = input || {};
    const db = getDb();

    const rangeStart = weekStart ? new Date(weekStart) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const rangeEnd = weekEnd ? new Date(weekEnd) : endOfWeek(new Date(), { weekStartsOn: 1 });
    const isInRange = (record) => {
      const rawDate = normalizeRecordDate(record);
      if (!rawDate) return false;
      const parsed = new Date(rawDate);
      return !Number.isNaN(parsed.getTime()) && parsed >= rangeStart && parsed <= rangeEnd;
    };

    const [allMoods, allJournals, allAchievements] = await Promise.all([
      db.list('MoodEntry'),
      db.list('JournalEntry'),
      db.list('Achievement'),
    ]);

    const moods = allMoods
      .filter((m) => isRecordForUser(m, userEmail) && isInRange(m))
      .sort((a, b) => new Date(normalizeRecordDate(a)) - new Date(normalizeRecordDate(b)));

    const journals = allJournals
      .filter((j) => isRecordForUser(j, userEmail) && isInRange(j))
      .sort((a, b) => new Date(normalizeRecordDate(a)) - new Date(normalizeRecordDate(b)));

    const completedActivities = allAchievements
      .filter((a) => isRecordForUser(a, userEmail) && isInRange(a) && isCompletedActivity(a));

    const moodScores = moods.map((m) => toMoodScores(m?.mood));
    const happinessSeries = moodScores.map((s) => s.happiness);
    const stressSeries = moodScores.map((s) => s.stress);

    const happinessChangePercent = calculatePercentChange(happinessSeries);
    const stressChangePercent = calculatePercentChange(stressSeries);
    const mostEffectiveActivity = pickMostEffectiveActivity(completedActivities);

    const base = buildWeeklyDataDrivenReport({
      moods,
      journals,
      activities: completedActivities,
    });

    const signalMetrics = computeWeeklySignals({
      weekDescription,
      moods,
      journals,
    });

    const summary = createReadableSummary({
      moodCount: moods.length,
      completedCount: completedActivities.length,
      happinessChange: happinessChangePercent,
      stressChange: stressChangePercent,
      activityLabel: mostEffectiveActivity,
    });

    const reply = {
      ...base,
      overall_summary: summary,
      stress_change_percent: stressChangePercent,
      happiness_change_percent: happinessChangePercent,
      stress_change: stressChangePercent,
      happiness_change: happinessChangePercent,
      most_effective_activity: mostEffectiveActivity,
      emotional_patterns: Array.isArray(base.emotional_patterns) ? base.emotional_patterns : [],
      achievements: Array.isArray(base.achievements) ? base.achievements : [],
      areas_to_improve: Array.isArray(base.areas_to_improve) ? base.areas_to_improve : [],
      next_week_goals: Array.isArray(base.next_week_goals) ? base.next_week_goals : [],
      wellness_score: signalMetrics.wellnessScore,
      personal_message: `Week ${format(rangeStart, 'yyyy-MM-dd')} to ${format(rangeEnd, 'yyyy-MM-dd')}: keep logging daily so these percentage trends stay precise and useful.`,
      data_sources: {
        mood_logs_used: moods.length,
        journal_entries_used: journals.length,
        completed_activities_used: completedActivities.length,
      },
    };

    await db.create('WeeklyReport', {
      user_email: userEmail,
      week_start: format(rangeStart, 'yyyy-MM-dd'),
      week_end: format(rangeEnd, 'yyyy-MM-dd'),
      report_content: JSON.stringify(reply),
      mood_summary: `${reply.happiness_change_percent}% happiness change, ${reply.stress_change_percent}% stress change`,
    });

    return res.json({ success: true, reply, ...reply });
  } catch (error) {
    console.error('[ERR] /api/reports/weekly-report', error.message);
    return sendAIError(res, error, 'reports.weekly');
  }
}

// Generate weekly report
router.post('/weekly', weeklyReportHandler);
router.get('/weekly-report', weeklyReportHandler);
router.post('/weekly-report', weeklyReportHandler);

// Get charts data
router.get('/charts', async (req, res) => {
  try {
    const { userEmail = 'anonymous', days = 7 } = req.query;
    const db = getDb();

    const daysNum = parseInt(days);
    const allMoods = await db.list('MoodEntry');

    const moods = allMoods.filter(m => m.user_email === userEmail);

    const chartData = Array.from({ length: daysNum }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (daysNum - i - 1));
      const dateStr = format(date, 'yyyy-MM-dd');

      const dayMoods = moods.filter(m => m.date === dateStr);
      const score = dayMoods.length
        ? dayMoods.reduce((s, m) => s + (m.intensity || 5), 0) / dayMoods.length
        : 0;

      return {
        day: format(date, 'EEE'),
        score: Math.round(score * 10) / 10
      };
    });

    return res.json({ success: true, reply: chartData, data: chartData });
  } catch (error) {
    console.error('[ERR] /api/reports/charts', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
