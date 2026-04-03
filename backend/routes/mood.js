import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

// Create mood entry
router.post('/create', async (req, res) => {
  try {
    const { mood, intensity = 5, note = '', userEmail = 'anonymous' } = req.body;
    const db = getDb();
    
    const entry = await db.create('MoodEntry', {
      user_email: userEmail,
      mood,
      intensity: parseInt(intensity),
      note,
      date: new Date().toISOString().split('T')[0]
    });

    res.json(entry);
  } catch (error) {
    console.error('Create mood error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get mood history
router.get('/history', async (req, res) => {
  try {
    const { userEmail = 'anonymous', limit = 50 } = req.query;
    const db = getDb();
    
    // Get entries from all users, then filter
    const allEntries = await db.list('MoodEntry');
    const entries = allEntries
      .filter(e => e.user_email === userEmail)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.json(entries || []);
  } catch (error) {
    console.error('Get mood history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get mood stats
router.get('/stats', async (req, res) => {
  try {
    const { userEmail = 'anonymous', days = 30 } = req.query;
    const db = getDb();
    
    const allEntries = await db.list('MoodEntry');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const entries = allEntries.filter(e => {
      const entryDate = new Date(e.date);
      return e.user_email === userEmail && entryDate >= cutoffDate;
    });

    const moodCounts = {};
    let totalIntensity = 0;

    entries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      totalIntensity += entry.intensity || 5;
    });

    res.json({
      distribution: moodCounts,
      average_intensity: entries.length ? totalIntensity / entries.length : 0,
      total_entries: entries.length
    });
  } catch (error) {
    console.error('Get mood stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
