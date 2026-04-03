import express from 'express';
import { sendAIError } from './aiError.js';
import { buildDecisionHelperAnalysis } from '../services/aiService.js';

const router = express.Router();

// Get decision help
router.post('/help', async (req, res) => {
  try {
    const {
      situation = '',
      context = '',
      options = [],
      userEmail = 'anonymous',
    } = req.body || {};

    const decisionText = String(situation || context || '').trim();
    if (!decisionText) {
      return res.status(400).json({ success: false, error: 'situation is required' });
    }

    const analysis = buildDecisionHelperAnalysis({
      decision: decisionText,
      context: String(context || ''),
      options,
    });

    return res.json({
      success: true,
      reply: analysis,
      analysis: analysis.summary,
      recommendation: analysis.recommendation,
      final_suggestion: analysis.final_suggestion,
      ...analysis,
      user_email: userEmail,
    });
  } catch (error) {
    console.error('[ERR] /api/decision/help', error.message);
    return sendAIError(res, error, 'decision.help');
  }
});

export default router;
