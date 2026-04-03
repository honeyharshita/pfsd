import express from 'express';
import { getDb } from '../db.js';
import { invokeLLM, requireOpenAIKey } from '../openai.js';
import { callDjangoGraphQL } from './djangoProxy.js';
import { sendAIError } from './aiError.js';

const router = express.Router();

// Analyze mood triggers
router.post('/triggers', async (req, res) => {
  try {
    const { userEmail = 'anonymous' } = req.body || {};
    const db = getDb();

    // Get user's mood history from database
    const allMoods = await db.list('MoodEntry');
    const moodHistory = allMoods
      .filter(m => m.user_email === userEmail)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);

    const historyText = moodHistory
      .map(e => `${e.date}: ${e.mood} - ${e.note || 'no note'}`)
      .join('\n');

    let reply;
    try {
      const djangoData = await callDjangoGraphQL(
        `query($input: String!, $userId: String, $language: String) {
          triggerAnalysis(input: $input, userId: $userId, language: $language)
        }`,
        { input: historyText || 'No mood records yet.', userId: userEmail, language: 'en' }
      );
      const djangoReply = djangoData?.triggerAnalysis;
      if (djangoReply?.success) {
        reply = {
          analysis: djangoReply.advice || JSON.stringify(djangoReply.triggers || []),
          recommendations: Array.isArray(djangoReply.triggers) ? djangoReply.triggers : []
        };
      }
    } catch (djangoError) {
      console.warn('[WARN] Django triggerAnalysis unavailable, using local LLM:', djangoError.message);
    }

    if (!reply) {
      requireOpenAIKey();
      reply = await invokeLLM({
        prompt: `Analyze emotional triggers from this data and return JSON with keys: analysis, recommendations(array).\n${historyText || 'No mood records yet.'}`,
        responseJsonSchema: {
          type: 'object',
          properties: {
            analysis: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } }
          },
          required: ['analysis', 'recommendations']
        }
      });
    }

    return res.json({ success: true, reply, ...reply });
  } catch (error) {
    console.error('[ERR] /api/analysis/triggers', error.message);
    return sendAIError(res, error, 'analysis.triggers');
  }
});

// Analyze emotion story
router.post('/emotion-story', async (req, res) => {
  try {
    const { trigger, userEmail = 'anonymous', language = 'en' } = req.body || {};

    if (!trigger) {
      return res.status(400).json({ success: false, error: 'trigger is required' });
    }

    let reply;
    try {
      const djangoData = await callDjangoGraphQL(
        `query($prompt: String!, $userId: String, $language: String) {
          emotionStory(prompt: $prompt, userId: $userId, language: $language)
        }`,
        { prompt: trigger, userId: userEmail, language }
      );
      const djangoReply = djangoData?.emotionStory;
      if (djangoReply?.success) {
        reply = { story: djangoReply.story || djangoReply.takeaway || '' };
      }
    } catch (djangoError) {
      console.warn('[WARN] Django emotionStory unavailable, using local LLM:', djangoError.message);
    }

    if (!reply) {
      requireOpenAIKey();
      reply = await invokeLLM({
        prompt: `Create a hopeful, empathetic short story for someone dealing with this trigger: ${trigger}. Return JSON with key: story.`,
        responseJsonSchema: {
          type: 'object',
          properties: { story: { type: 'string' } },
          required: ['story']
        }
      });
    }

    return res.json({ success: true, reply, ...reply });
  } catch (error) {
    console.error('[ERR] /api/analysis/emotion-story', error.message);
    return sendAIError(res, error, 'analysis.emotion-story');
  }
});

export default router;
