import express from 'express';
import { getDb } from '../db.js';
import { predictMoodWeighted } from '../services/aiService.js';

const router = express.Router();

function normalizeUserEmail(userEmail) {
  return String(userEmail || 'anonymous').trim().toLowerCase() || 'anonymous';
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function summarizeTopMood(history = []) {
  const counts = history.reduce((acc, entry) => {
    const mood = String(entry?.mood || 'neutral').trim().toLowerCase();
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
}

async function handlePredictMood(req, res) {
  try {
    const source = req.method === 'GET' ? req.query : req.body || {};
    const userEmail = normalizeUserEmail(source.userEmail);
    const currentFeeling = String(source.currentFeeling || source.current_feeling || '').trim();
    const sleepHours = parseNumber(source.sleepHours ?? source.sleep_hours, 7);
    const stressLevel = parseNumber(source.stressLevel ?? source.stress_level, 5);
    const energyLevel = parseNumber(source.energyLevel ?? source.energy_level, 6);
    const days = Math.max(1, Math.min(14, parseInt(source.days ?? source.forecastDays ?? 1, 10) || 1));

    const db = getDb();
    const allMoods = await db.list('MoodEntry');
    const recentMoods = allMoods
      .filter((entry) => {
        const entryEmail = entry?.user_email;
        const normalizedEntryEmail = normalizeUserEmail(entryEmail);

        // Keep backward compatibility: old mood entries were stored without user_email.
        if (userEmail === 'anonymous' && (entryEmail == null || String(entryEmail).trim() === '')) {
          return true;
        }

        return normalizedEntryEmail === userEmail;
      })
      .sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0))
      .slice(0, 30);

    const forecast = predictMoodWeighted({
      moodHistory: recentMoods,
      currentFeeling,
      sleepHours,
      stressLevel,
      energyLevel,
      activityData: source.activityData || {},
    });

    const storedPrediction = await db.create('MoodPrediction', {
      user_email: userEmail,
      forecast_window_days: days,
      input: {
        currentFeeling,
        sleepHours,
        stressLevel,
        energyLevel,
      },
      mood_history_count: recentMoods.length,
      dominant_history_mood: summarizeTopMood(recentMoods),
      predicted_mood: forecast.predicted_mood,
      prediction: forecast.prediction,
      explanation: forecast.explanation,
      confidence: forecast.confidence,
      trend: forecast.trend,
      based_on_entries: forecast.based_on_entries,
      history_summary: forecast.history_summary,
      weight_breakdown: forecast.weight_breakdown,
      signal_summary: forecast.signal_summary,
      top_tips: forecast.top_tips,
      risk_factors: forecast.risk_factors,
      positive_factors: forecast.positive_factors,
    });

    return res.json({
      success: true,
      endpoint: '/api/predict-mood',
      user_email: userEmail,
      forecast_window_days: days,
      stored_prediction_id: storedPrediction?.id || null,
      stored_prediction: storedPrediction,
      ...forecast,
      recommendations: forecast.top_tips,
    });
  } catch (error) {
    console.error('[ERR] /api/predict-mood', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

router.get('/predict-mood', handlePredictMood);
router.post('/predict-mood', handlePredictMood);

export default router;
