import express from 'express';
import { getDb } from '../db.js';
import { invokeLLM, requireOpenAIKey } from '../openai.js';
import { callDjangoGraphQL } from './djangoProxy.js';
import { sendAIError } from './aiError.js';

const router = express.Router();

// Forecast mood
router.get('/predict', async (req, res) => {
  try {
    const { userEmail = 'anonymous', days = 7 } = req.query;
    const db = getDb();

    // Get recent mood history
    const allMoods = await db.list('MoodEntry');
    const recentMoods = allMoods
      .filter(m => m.user_email === userEmail)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);

    const historyText = recentMoods
      .reverse()
      .map(m => `${m.date}: ${m.mood} (${m.intensity}/10)`)
      .join('\n');

    let reply;
    try {
      const djangoData = await callDjangoGraphQL(
        `query($data: String!, $userId: String, $language: String) {
          moodForecast(data: $data, userId: $userId, language: $language)
        }`,
        { data: historyText || 'No mood history provided.', userId: userEmail, language: 'en' }
      );
      const djangoReply = djangoData?.moodForecast;
      if (djangoReply?.success) {
        reply = {
          forecast: djangoReply.forecast || 'Forecast generated.',
          based_on_entries: recentMoods.length
        };
      }
    } catch (djangoError) {
      console.warn('[WARN] Django moodForecast unavailable, using local LLM:', djangoError.message);
    }

    if (!reply) {
      requireOpenAIKey();
      reply = await invokeLLM({
        prompt: `Forecast mood for next ${days} days from this history. Return JSON with keys: forecast, based_on_entries.\n${historyText || 'No mood history provided.'}`,
        responseJsonSchema: {
          type: 'object',
          properties: {
            forecast: { type: 'string' },
            based_on_entries: { type: 'number' }
          },
          required: ['forecast']
        }
      });
    }
    if (reply.based_on_entries == null) {
      reply.based_on_entries = recentMoods.length;
    }

    return res.json({ success: true, reply, ...reply });
  } catch (error) {
    console.error('[ERR] /api/forecaster/predict', error.message);
    return sendAIError(res, error, 'forecaster.predict');
  }
});

export default router;
