import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

router.post('/settings', async (req, res) => {
  try {
    const {
      userEmail = 'anonymous',
      notification_preferences = {},
    } = req.body || {};

    const db = getDb();
    const all = await db.list('UserWellness');
    const existing = all.find((item) => item.user_email === userEmail);

    const payload = {
      user_email: userEmail,
      notification_preferences,
      updated_at: new Date().toISOString(),
    };

    let record;
    if (existing) {
      record = await db.update(existing.id, payload);
    } else {
      record = await db.create('UserWellness', payload);
    }

    return res.json({ success: true, data: record });
  } catch (error) {
    console.error('[ERR] /api/notifications/settings', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reminders', async (req, res) => {
  try {
    const { userEmail = 'anonymous' } = req.query;
    const db = getDb();
    const all = await db.list('UserWellness');
    const wellness = all.find((item) => item.user_email === userEmail);
    const prefs = wellness?.notification_preferences || {};

    const reminders = [];
    const now = new Date();
    const lastDaily = wellness?.daily_checkin_last_sent ? new Date(wellness.daily_checkin_last_sent) : null;
    const lastGratitude = wellness?.gratitude_reminder_last_sent ? new Date(wellness.gratitude_reminder_last_sent) : null;

    if (prefs.daily_checkin && (!lastDaily || !isSameDay(lastDaily, now))) {
      reminders.push({
        id: 'daily-checkin',
        type: 'reminder',
        title: 'Daily check-in reminder',
        description: 'Log your mood today to keep AI insights accurate.',
      });
    }

    if (prefs.gratitude_reminder && (!lastGratitude || !isSameDay(lastGratitude, now))) {
      reminders.push({
        id: 'gratitude-reminder',
        type: 'reminder',
        title: 'Gratitude reminder',
        description: 'Write one gratitude note to support your emotional momentum.',
      });
    }

    if (reminders.length > 0 && wellness) {
      const updatePayload = { updated_at: new Date().toISOString() };
      if (reminders.find((r) => r.id === 'daily-checkin')) updatePayload.daily_checkin_last_sent = now.toISOString();
      if (reminders.find((r) => r.id === 'gratitude-reminder')) updatePayload.gratitude_reminder_last_sent = now.toISOString();
      await db.update(wellness.id, updatePayload);
    }

    return res.json({ success: true, reminders });
  } catch (error) {
    console.error('[ERR] /api/notifications/reminders', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/alerts', async (req, res) => {
  try {
    const {
      userEmail = 'anonymous',
      title = 'Alert',
      message = '',
      severity = 'info',
      source = 'system',
    } = req.body || {};

    const db = getDb();
    const created = await db.create('NotificationEvent', {
      user_email: userEmail,
      title,
      message,
      severity,
      source,
      created_at: new Date().toISOString(),
    });

    return res.json({ success: true, data: created });
  } catch (error) {
    console.error('[ERR] /api/notifications/alerts', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
