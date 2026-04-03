import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GROQ_MODEL = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
const DJANGO_GRAPHQL_URL = process.env.DJANGO_GRAPHQL_URL || 'http://localhost:8000/graphql/';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';
const OLLAMA_FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || 'llama3.2:1b';

export function requireOpenAIKey() {
  const key = process.env.OPENAI_API_KEY || '';
  const isPlaceholder = /YOUR-OPENAI-API-KEY|YOUR_KEY_HERE|sk-proj-YOUR/i.test(key);
  if (!key.trim() || isPlaceholder) {
    const err = new Error('OPENAI_API_KEY is required');
    err.statusCode = 500;
    throw err;
  }
}

export function getOpenAIClient() {
  requireOpenAIKey();
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function getClaudeClient() {
  const key = process.env.CLAUDE_API_KEY || '';
  if (!key.trim()) {
    return null;
  }
  return new Anthropic({ apiKey: key });
}

export function getGroqClient() {
  const key = process.env.GROQ_API_KEY || '';
  if (!key.trim()) {
    return null;
  }
  return new OpenAI({
    apiKey: key,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function tryExtractJson(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const direct = tryParseJson(raw);
  if (direct) return direct;

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    const parsedFenced = tryParseJson(fenced[1]);
    if (parsedFenced) return parsedFenced;
  }

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const sliced = raw.slice(firstBrace, lastBrace + 1);
    return tryParseJson(sliced);
  }

  return null;
}

function isRetryableProviderFailure(error) {
  const message = (error?.message || '').toLowerCase();
  return (
    message.includes('429') ||
    message.includes('insufficient_quota') ||
    message.includes('rate limit') ||
    message.includes('openai_api_key is required') ||
    message.includes('invalid api key') ||
    message.includes('temporarily unavailable') ||
    message.includes('decommissioned')
  );
}

async function invokeClaudeFallback({ prompt, responseJsonSchema = null }) {
  const claude = getClaudeClient();
  if (!claude) {
    throw new Error('Claude API key not configured');
  }

  const wantsStructured = Boolean(responseJsonSchema && typeof responseJsonSchema === 'object');
  const systemPrompt = wantsStructured
    ? 'Return ONLY valid JSON that matches the requested schema. No markdown, no explanations.'
    : 'Be concise, practical, and context-aware. Respond naturally and helpfully.';

  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 900,
    system: systemPrompt,
    messages: [
      { role: 'user', content: prompt }
    ]
  });

  const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
  console.log('[AI-Claude] model=%s promptLen=%d responseLen=%d', CLAUDE_MODEL, prompt.length, raw.length);

  if (wantsStructured) {
    const parsed = tryParseJson(raw);
    if (!parsed) {
      const err = new Error('Claude did not return valid JSON');
      err.statusCode = 502;
      err.raw = raw;
      throw err;
    }
    return parsed;
  }

  return { reply: raw };
}

async function invokeGroqFallback({ prompt, responseJsonSchema = null }) {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  const wantsStructured = Boolean(responseJsonSchema && typeof responseJsonSchema === 'object');
  const systemPrompt = wantsStructured
    ? 'Return ONLY valid JSON that matches the requested schema. No markdown.'
    : 'Be concise, practical, and context-aware.';

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 900
  });

  const raw = completion.choices?.[0]?.message?.content || '';
  console.log('[AI-Groq] model=%s promptLen=%d responseLen=%d', GROQ_MODEL, prompt.length, raw.length);

  if (wantsStructured) {
    const parsed = tryExtractJson(raw);
    if (!parsed) {
      const err = new Error('Groq did not return valid JSON');
      err.statusCode = 502;
      err.raw = raw;
      throw err;
    }
    return parsed;
  }

  return { reply: raw };
}

async function invokeOllamaFallback({ prompt, responseJsonSchema = null }) {
  const wantsStructured = Boolean(responseJsonSchema && typeof responseJsonSchema === 'object');
  const systemPrompt = wantsStructured
    ? 'Return ONLY valid JSON that matches the requested schema. No markdown or commentary.'
    : 'Be concise, practical, empathetic, and context-aware.';

  const tryModel = async (modelName, timeoutMs = 2000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelName,
          stream: false,
          format: wantsStructured ? 'json' : undefined,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          options: {
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        const err = new Error(`Ollama HTTP ${response.status}${details ? `: ${details}` : ''}`);
        err.statusCode = response.status;
        throw err;
      }

      const data = await response.json().catch(() => ({}));
      const raw = data?.message?.content || '';
      console.log('[AI-Ollama] model=%s promptLen=%d responseLen=%d', modelName, prompt.length, raw.length);
      return raw;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  let raw = '';
  try {
    raw = await tryModel(OLLAMA_MODEL, 2000);
  } catch (error) {
    const lowMemory = /requires more system memory|out of memory|insufficient memory/i.test(error.message || '');
    const isTimeout = error?.name === 'AbortError' || error?.message?.includes('timeout');
    if (lowMemory && OLLAMA_FALLBACK_MODEL && OLLAMA_FALLBACK_MODEL !== OLLAMA_MODEL) {
      console.warn('[WARN] Ollama model %s failed due to memory; retrying with %s', OLLAMA_MODEL, OLLAMA_FALLBACK_MODEL);
      raw = await tryModel(OLLAMA_FALLBACK_MODEL, 2000);
    } else if (isTimeout) {
      console.warn('[WARN] Ollama timeout after 2s, moving to next provider');
      throw error;
    } else {
      throw error;
    }
  }

  if (wantsStructured) {
    const parsed = tryExtractJson(raw);
    if (!parsed) {
      const err = new Error('Ollama did not return valid JSON');
      err.statusCode = 502;
      err.raw = raw;
      throw err;
    }
    return parsed;
  }

  return { reply: raw };
}

async function invokeDjangoFallback({ prompt, responseJsonSchema = null }) {
  const query = `query($prompt: String!, $language: String) {
    invokeLlm(prompt: $prompt, language: $language)
  }`;

  // Ask Django LLM endpoint for structured JSON when schema is requested.
  const shapedPrompt = responseJsonSchema
    ? `${prompt}\n\nReturn ONLY valid JSON.`
    : prompt;

  const response = await fetch(DJANGO_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ query, variables: { prompt: shapedPrompt, language: 'en' } })
  });

  if (!response.ok) {
    throw new Error(`Django fallback HTTP ${response.status}`);
  }

  const json = await response.json().catch(() => ({}));
  if (json.errors?.length) {
    throw new Error(json.errors[0].message || 'Django fallback GraphQL error');
  }

  const payload = json?.data?.invokeLlm;
  if (!payload?.success) {
    throw new Error(payload?.error || 'Django fallback failed');
  }

  const text = payload.response || '';

  if (responseJsonSchema) {
    const parsed = tryParseJson(text);
    if (!parsed) {
      const err = new Error('Django fallback did not return valid JSON');
      err.statusCode = 502;
      err.raw = text;
      throw err;
    }
    return parsed;
  }

  return { reply: text };
}

export async function invokeLLM({ prompt, responseJsonSchema = null, fileUrls = [] }) {
  if (!prompt || typeof prompt !== 'string') {
    const err = new Error('prompt is required');
    err.statusCode = 400;
    throw err;
  }

  const wantsStructured = Boolean(responseJsonSchema && typeof responseJsonSchema === 'object');

  try {
    console.log('[AI] Attempting Ollama first (local, fastest)');
    return await invokeOllamaFallback({ prompt, responseJsonSchema });
  } catch (ollamaError) {
    console.warn('[WARN] Ollama failed, attempting Claude:', ollamaError.message);
    try {
      return await invokeClaudeFallback({ prompt, responseJsonSchema });
    } catch (claudeError) {
      console.warn('[WARN] Claude unavailable, attempting Groq:', claudeError.message);
      try {
        return await invokeGroqFallback({ prompt, responseJsonSchema });
      } catch (groqError) {
        console.warn('[WARN] Groq unavailable, attempting OpenAI:', groqError.message);
        try {
          const openai = getOpenAIClient();
          const content = [{ type: 'text', text: prompt }];
          for (const url of fileUrls || []) {
            if (typeof url === 'string' && url.length > 0) {
              content.push({ type: 'image_url', image_url: { url } });
            }
          }

          const systemPrompt = wantsStructured
            ? 'Return ONLY valid JSON that matches the requested schema. No markdown.'
            : 'Be concise, practical, and context-aware.';

          const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content }
            ],
            temperature: 0.8,
            max_tokens: 900
          });

          const raw = completion.choices?.[0]?.message?.content || '';
          console.log('[AI] OpenAI model=%s responseLen=%d', MODEL, raw.length);

          if (wantsStructured) {
            const parsed = tryParseJson(raw);
            if (!parsed) {
              const err = new Error('OpenAI did not return valid JSON');
              err.statusCode = 502;
              err.raw = raw;
              throw err;
            }
            return parsed;
          }

          return { reply: raw };
        } catch (openaiError) {
          console.warn('[WARN] OpenAI unavailable, attempting Django:', openaiError.message);
          try {
            return await invokeDjangoFallback({ prompt, responseJsonSchema });
          } catch (djangoError) {
            const err = new Error(
              `All AI providers failed. ollama=${ollamaError.message}; claude=${claudeError.message}; groq=${groqError.message}; openai=${openaiError.message}; django=${djangoError.message}`
            );
            err.statusCode = 503;
            throw err;
          }
        }
      }
    }
  }
}
