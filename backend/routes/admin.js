import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const db = getDb();

    const totalMoods = (await db.list('MoodEntry')).length;
    const totalJournals = (await db.list('JournalEntry')).length;
    const totalChats = (await db.list('ChatConversation')).length;
    const crisisAlerts = (await db.list('CrisisAlert')).filter(c => c.status === 'new').length;

    res.json({
      total_mood_entries: totalMoods,
      total_journal_entries: totalJournals,
      total_conversations: totalChats,
      pending_crisis_alerts: crisisAlerts
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get mood distribution for charts
router.get('/mood-distribution', async (req, res) => {
  try {
    const db = getDb();

    const allMoods = await db.list('MoodEntry');
    const distribution = {};

    allMoods.forEach(item => {
      distribution[item.mood] = (distribution[item.mood] || 0) + 1;
    });

    res.json(distribution);
  } catch (error) {
    console.error('Mood distribution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get crisis alerts
router.get('/crisis-alerts', async (req, res) => {
  try {
    const db = getDb();

    const allAlerts = await db.list('CrisisAlert');
    const alerts = allAlerts
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50);

    res.json(alerts);
  } catch (error) {
    console.error('Crisis alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
