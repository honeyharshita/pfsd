import express from 'express';
import { invokeLLM } from '../openai.js';
import { callDjangoGraphQL, getDjangoBridgeStatus } from './djangoProxy.js';
import { sendAIError } from './aiError.js';

const router = express.Router();

router.get('/status', async (_req, res) => {
  const key = process.env.OPENAI_API_KEY || '';
  const openaiConfigured = Boolean(key.trim()) && !/YOUR-OPENAI-API-KEY|YOUR_KEY_HERE|sk-proj-YOUR/i.test(key);
  const djangoBridge = getDjangoBridgeStatus();

  let djangoHealth = { ok: false, error: null };
  try {
    const response = await fetch((process.env.DJANGO_GRAPHQL_URL || 'http://localhost:8000/graphql/').replace('/graphql/', '/health/'));
    djangoHealth.ok = response.ok;
    if (!response.ok) djangoHealth.error = `HTTP ${response.status}`;
  } catch (error) {
    djangoHealth.ok = false;
    djangoHealth.error = error.message;
  }

  return res.json({
    success: true,
    openai_configured: openaiConfigured,
    django_bridge: djangoBridge,
    django_health: djangoHealth,
    timestamp: new Date().toISOString()
  });
});

router.post('/invoke', async (req, res) => {
  try {
    const { prompt, response_json_schema, file_urls } = req.body || {};
    console.log('[REQ] POST /api/ai/invoke', {
      hasPrompt: Boolean(prompt),
      hasSchema: Boolean(response_json_schema),
      files: Array.isArray(file_urls) ? file_urls.length : 0
    });

    let result;
    try {
      const djangoData = await callDjangoGraphQL(
        `query($prompt: String!, $language: String) {
          invokeLlm(prompt: $prompt, language: $language)
        }`,
        { prompt, language: 'en' },
        90000
      );
      const djangoReply = djangoData?.invokeLlm;
      if (djangoReply?.success) {
        if (response_json_schema) {
          // Best-effort parsing for schema-based callers.
          try {
            result = typeof djangoReply.response === 'string' ? JSON.parse(djangoReply.response) : djangoReply.response;
          } catch {
            result = { response: djangoReply.response };
          }
        } else {
          result = { reply: djangoReply.response };
        }
      }
    } catch (djangoError) {
      console.warn('[WARN] Django invokeLlm unavailable, using local OpenAI:', djangoError.message);
    }

    if (!result) {
      result = await invokeLLM({
        prompt,
        responseJsonSchema: response_json_schema || null,
        fileUrls: Array.isArray(file_urls) ? file_urls : []
      });
    }

    return res.json({ success: true, reply: result });
  } catch (error) {
    console.error('[ERR] /api/ai/invoke', error.message);
    return sendAIError(res, error, 'ai.invoke');
  }
});

export default router;
