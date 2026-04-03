import express from 'express';
import { invokeGemini, invokeGeminiJSON, hasGeminiKey } from '../gemini.js';
import * as localGen from '../localGenerators.js';
import { getDb } from '../db.js';
import {
  runAIService,
  predictMoodWeighted,
  detectEmotionalTriggers,
  buildWeeklyDataDrivenReport,
  buildDecisionHelperAnalysis,
  buildJournalAnalysisResult,
  ensureLongEmotionStory,
  buildMoodAdaptiveStudyPlan,
} from '../services/aiService.js';
import { detectCameraMood } from '../services/cameraMoodService.js';

const router = express.Router();

/**
 * Unified AI service wrapper
 * Tries Gemini first, falls back to local generator if Gemini unavailable
 */
async function aiService(generator, fallbackFn, options = {}) {
  return runAIService(generator, fallbackFn, options);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function countMatches(text, words = []) {
  return words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
}

function buildJournalAnalysisFallback(content = '') {
  return buildJournalAnalysisResult({ content });
}

function normalizeJournalAnalysis(result = {}) {
  const detectedEmotions = Array.isArray(result.detected_emotions)
    ? result.detected_emotions
    : Array.isArray(result.emotions)
      ? result.emotions
      : [];
  const themes = Array.isArray(result.themes) ? result.themes : [];
  const triggers = Array.isArray(result.triggers) ? result.triggers : [];
  const suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];

  return {
    analysis: String(result.analysis || result.summary || result.brief_observation || 'This entry has been saved, but the analysis was too short to parse.').trim(),
    summary_title: String(result.summary_title || result.title || 'Journal Insight').trim(),
    detected_emotions: detectedEmotions.length > 0 ? detectedEmotions : ['neutral'],
    sentiment_score: Number.isFinite(Number(result.sentiment_score)) ? Number(result.sentiment_score) : 0,
    triggers: triggers.length > 0 ? triggers : themes,
    themes: themes.length > 0 ? themes : triggers,
    reflection_prompt: String(result.reflection_prompt || 'What feels most important about this entry?').trim(),
    supportive_note: String(result.supportive_note || 'Thank you for taking the time to reflect.').trim(),
    emotion: String(result.emotion || detectedEmotions[0] || 'neutral').trim(),
    suggestions: suggestions.length > 0 ? suggestions : [String(result.supportive_note || 'Take one small supportive step today.').trim()],
  };
}

function getCameraMoodCopy(mood = 'calm') {
  const copy = {
    happy: {
      color_analysis: 'Brighter tones and open balance suggest uplifting emotional energy.',
      atmosphere: 'The frame feels light and expressive with an optimistic tone.',
      emotional_story: 'Your expression suggests relief, joy, or a positive emotional lift in this moment.',
      reflection: 'What helped you feel this lighter shift today?',
      suggested_activity: 'Capture one more positive moment and write a quick gratitude line.',
      brief_observation: 'This image carries a positive and emotionally open tone.',
    },
    calm: {
      color_analysis: 'Soft, balanced tones suggest emotional steadiness and self-regulation.',
      atmosphere: 'The atmosphere feels grounded and composed.',
      emotional_story: 'You appear present and emotionally stable, with a gentle, centered energy.',
      reflection: 'What helps you protect this calm during stressful moments?',
      suggested_activity: 'Do a 5-minute breathing reset to preserve your calm.',
      brief_observation: 'This photo reflects a calm and centered mood.',
    },
    sad: {
      color_analysis: 'Lower visual energy can reflect emotional heaviness.',
      atmosphere: 'The frame feels inward and quiet.',
      emotional_story: 'Your expression suggests emotional weight and the need for gentle support.',
      reflection: 'What would make you feel emotionally held right now?',
      suggested_activity: 'Write one compassionate message to yourself.',
      brief_observation: 'The mood appears subdued with signs of emotional heaviness.',
    },
    stressed: {
      color_analysis: 'Tighter visual tension may reflect mental load and fatigue.',
      atmosphere: 'The scene feels pressured and mentally busy.',
      emotional_story: 'The photo suggests you may be carrying several demands at once.',
      reflection: 'Which one task can you simplify immediately?',
      suggested_activity: 'Do one box-breathing cycle before your next task.',
      brief_observation: 'There are signs of pressure and emotional fatigue in this frame.',
    },
    anxious: {
      color_analysis: 'Subtle intensity cues suggest a vigilant emotional state.',
      atmosphere: 'The mood feels alert and uncertain.',
      emotional_story: 'Your expression looks attentive, possibly anticipating what comes next.',
      reflection: 'What helps your body feel safer in this moment?',
      suggested_activity: 'Use the 5-4-3-2-1 grounding exercise.',
      brief_observation: 'This image suggests heightened alertness and anxious energy.',
    },
    angry: {
      color_analysis: 'High intensity contrast can align with activated emotional boundaries.',
      atmosphere: 'The frame feels charged and forceful.',
      emotional_story: 'This expression suggests frustration that may be signaling an unmet need or boundary.',
      reflection: 'What boundary needs to be stated clearly and calmly?',
      suggested_activity: 'Take a short walk and write one clear boundary sentence.',
      brief_observation: 'The frame shows signs of high emotional activation.',
    },
  };

  return copy[mood] || copy.calm;
}

// ============ 1. Camera Mood Analysis ============
router.post('/camera-mood', async (req, res) => {
  try {
    const { imageUrl, userEmail = 'anonymous', faceSignals = {}, faceExpression = '' } = req.body;

    if (!imageUrl && !faceExpression && !faceSignals?.expression && !faceSignals?.faceExpression) {
      return res.status(400).json({ success: false, error: 'imageUrl or face expression signals are required' });
    }

    // Extract base64 from data URL when image is provided
    const base64Match = imageUrl ? imageUrl.match(/data:([^;]+);base64,(.+)/) : null;
    const base64 = base64Match ? base64Match[2] : (imageUrl || '');
    const mimeType = base64Match ? base64Match[1] : 'image/jpeg';

    const fallbackSignals = {
      ...(faceSignals || {}),
      faceExpression: faceExpression || faceSignals?.faceExpression || faceSignals?.expression || '',
    };
    const fallback = () => localGen.generateCameraMoodAnalysis(imageUrl || faceExpression || '', fallbackSignals);
    const mappedFromSignals = detectCameraMood({
      faceExpression: fallbackSignals.faceExpression,
      faceSignals: fallbackSignals,
    });

    const result = await aiService(
      {
        name: 'camera-mood',
        prompt: 'Analyze mood from image...',
        mimeType,
        imageData: base64,
        json: true
      },
      fallback,
      { forceLocal: !hasGeminiKey() || !base64 }
    );

    // If result is string, parse it
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    const normalized = {
      detected_mood: String(parsed.detected_mood || 'neutral').toLowerCase(),
      face_expression: String(parsed.face_expression || fallbackSignals.faceExpression || 'neutral').toLowerCase(),
      mapping_reason: String(parsed.mapping_reason || 'Mapped with camera mood rules.'),
      mood_confidence: Number.isFinite(Number(parsed.mood_confidence))
        ? Number(parsed.mood_confidence)
        : Number.isFinite(Number(parsed.confidence))
          ? Math.round(Number(parsed.confidence) <= 1 ? Number(parsed.confidence) * 100 : Number(parsed.confidence))
          : 68,
      color_analysis: String(parsed.color_analysis || 'Color and light suggest a mixed but understandable emotional state.'),
      atmosphere: String(parsed.atmosphere || 'The overall atmosphere looks reflective and personal.'),
      emotional_story: String(parsed.emotional_story || parsed.brief_observation || 'Your expression suggests a meaningful emotional moment worth noticing.'),
      reflection: String(parsed.reflection || 'What feels most important about your current mood right now?'),
      suggested_activity: String(parsed.suggested_activity || 'Take one slow breath and do a short check-in with yourself.'),
      brief_observation: String(parsed.brief_observation || 'Camera-based mood analysis complete.'),
      confidence: Number.isFinite(Number(parsed.confidence))
        ? Number(Number(parsed.confidence) <= 1 ? Number(parsed.confidence) : Number(parsed.confidence) / 100)
        : Number((Math.max(1, Math.min(99, Number(parsed.mood_confidence) || 68)) / 100).toFixed(2)),
    };

    // Deterministic mapping has priority whenever expression/signals are provided.
    if (mappedFromSignals?.detected_mood) {
      normalized.detected_mood = String(mappedFromSignals.detected_mood || normalized.detected_mood).toLowerCase();
      normalized.face_expression = String(mappedFromSignals.face_expression || normalized.face_expression).toLowerCase();
      normalized.mapping_reason = String(mappedFromSignals.mapping_reason || normalized.mapping_reason);
      normalized.mood_confidence = Number(mappedFromSignals.mood_confidence || normalized.mood_confidence);
      normalized.confidence = Number(mappedFromSignals.confidence || normalized.confidence);
    }

    const moodCopy = getCameraMoodCopy(normalized.detected_mood);
    normalized.color_analysis = moodCopy.color_analysis;
    normalized.atmosphere = moodCopy.atmosphere;
    normalized.emotional_story = moodCopy.emotional_story;
    normalized.reflection = moodCopy.reflection;
    normalized.suggested_activity = moodCopy.suggested_activity;
    normalized.brief_observation = moodCopy.brief_observation;

    // Store mood entry
    const db = getDb();
    await db.create('MoodEntry', {
      user_email: userEmail,
      mood: normalized.detected_mood || 'neutral',
      intensity: Math.max(1, Math.min(10, Math.round((normalized.confidence || 0.5) * 10))),
      source: 'camera',
      note: normalized.brief_observation || 'Camera analysis'
    });

    await db.create('CameraMoodAnalysis', {
      user_email: userEmail,
      detected_mood: normalized.detected_mood,
      face_expression: normalized.face_expression,
      mood_confidence: normalized.mood_confidence,
      confidence: normalized.confidence,
      mapping_reason: normalized.mapping_reason,
      color_analysis: normalized.color_analysis,
      atmosphere: normalized.atmosphere,
      emotional_story: normalized.emotional_story,
      reflection: normalized.reflection,
      suggested_activity: normalized.suggested_activity,
      brief_observation: normalized.brief_observation,
      face_signals: fallbackSignals,
      source: 'camera',
    });

    return res.json({ success: true, ...normalized });
  } catch (error) {
    console.error('[ERR] /api/ai/camera-mood', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 2. Mood Forecast ============
router.post('/mood-forecast', async (req, res) => {
  try {
    const {
      userEmail = 'anonymous',
      currentFeeling = '',
      sleepHours = 7,
      stressLevel = 5,
      energyLevel = 6,
      activityData = {},
    } = req.body || {};
    const db = getDb();

    // Fetch recent mood history
    const moods = await db.list('MoodEntry');
    const userMoods = moods.filter(m => m.user_email === userEmail).slice(-30);

    const buildFallbackForecast = () => predictMoodWeighted({
      moodHistory: userMoods,
      currentFeeling,
      sleepHours,
      stressLevel,
      energyLevel,
      activityData,
    });

    const result = await aiService(
      {
        name: 'mood-forecast',
        json: true,
        prompt: `You are a mental wellness AI. Predict tomorrow's mood from the following inputs and return JSON with keys: predicted_mood, confidence, morning_forecast, afternoon_forecast, evening_forecast, key_insight, top_tips, risk_factors, positive_factors.

Current feeling: "${currentFeeling || 'not provided'}"
Sleep hours: ${sleepHours}
Stress level: ${stressLevel}/10
Energy level: ${energyLevel}/10
Recent mood history: ${userMoods.map(m => `${m.mood}(${m.intensity || 5}/10)`).join(', ') || 'none'}

Use a predicted_mood of one of: happy, calm, neutral, stressed, sad, anxious, angry.
Weigh recent mood history and the current feeling, not just the sliders. Return a specific non-neutral mood whenever the inputs point clearly away from neutral.`
      },
      buildFallbackForecast,
      { forceLocal: !hasGeminiKey() }
    );

    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    return res.json({ success: true, ...parsed });
  } catch (error) {
    console.error('[ERR] /api/ai/mood-forecast', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 2. Journal Analysis ============
router.post('/journal-analysis', async (req, res) => {
  try {
    const { content = '', userEmail = 'anonymous', language = 'en' } = req.body || {};

    if (!String(content).trim()) {
      return res.status(400).json({ success: false, error: 'content is required' });
    }

    const fallback = () => buildJournalAnalysisFallback(content);

    const result = await aiService(
      {
        name: 'journal-analysis',
        json: true,
        prompt: `You are a supportive journal companion.

Analyze this journal entry deeply and return JSON with these keys:
- analysis: a short empathetic paragraph that references the actual entry text
- summary_title: a short title for the insight
- detected_emotions: array of 2-4 emotions
- sentiment_score: number from -1 to 1
- triggers: array of likely triggers or themes
- themes: array of broader emotional themes
- reflection_prompt: one thoughtful question
- supportive_note: one validating sentence

Rules:
- Be specific to the journal entry below.
- Do not return generic neutral advice.
- If the entry is mixed, mention the mix.
- Keep the tone empathetic, grounded, and helpful.

Journal entry:
"""
${content}
"""

User language: ${language}
User email: ${userEmail}`,
      },
      fallback,
      { forceLocal: !hasGeminiKey() }
    );

    const reply = normalizeJournalAnalysis(result);
    const db = getDb();
    const storedAnalysis = await db.create('JournalAnalysis', {
      user_email: userEmail,
      content,
      language,
      analysis_content: JSON.stringify(reply),
      emotion: reply.emotion,
      sentiment_score: reply.sentiment_score,
      summary_title: reply.summary_title,
    });

    return res.json({
      success: true,
      reply,
      stored_analysis_id: storedAnalysis?.id || null,
      ...reply,
    });
  } catch (error) {
    console.error('[ERR] /api/ai/journal-analysis', error.message);
    const fallbackReply = normalizeJournalAnalysis(buildJournalAnalysisFallback(req.body?.content || ''));
    return res.json({ success: true, reply: fallbackReply, ...fallbackReply, fallback: true });
  }
});

// ============ 3. Trigger Analyzer ============
router.post('/trigger-analyzer', async (req, res) => {
  try {
    const {
      userEmail = 'anonymous',
      description = '',
      notes = [],
      journalContents = [],
      moodDistribution = {},
    } = req.body || {};

    const db = getDb();
    const journals = await db.list('JournalEntry');
    const normalizedEmail = String(userEmail || 'anonymous').trim().toLowerCase() || 'anonymous';

    const userJournals = journals
      .filter((entry) => {
        const rowEmail = String(entry?.user_email || '').trim().toLowerCase();
        if (normalizedEmail === 'anonymous' && !rowEmail) return true;
        return rowEmail === normalizedEmail;
      })
      .slice(-30);

    const conversations = await db.list('ChatConversation');

    const chatMessages = conversations
      .filter((entry) => {
        const rowEmail = String(entry?.user_email || '').trim().toLowerCase();
        if (normalizedEmail === 'anonymous' && !rowEmail) return true;
        return rowEmail === normalizedEmail;
      })
      .slice(-4)
      .flatMap((c) => Array.isArray(c.messages) ? c.messages : [])
      .filter((m) => m && typeof m.content === 'string')
      .slice(-60)
      .map((m) => m.content);

    const inlineJournalContents = Array.isArray(journalContents)
      ? journalContents
      : String(journalContents || '').trim()
        ? [String(journalContents)]
        : [];

    const mergedJournalContents = [
      ...inlineJournalContents,
      ...userJournals.map((entry) => String(entry?.content || '')).filter(Boolean),
    ];

    const analysis = detectEmotionalTriggers({
      description,
      notes,
      journalContents: mergedJournalContents,
      chatMessages,
    });

    const categorizedTriggers = {
      workload: analysis.top_triggers.filter((item) => item.category === 'workload'),
      social: analysis.top_triggers.filter((item) => item.category === 'social'),
      people: analysis.top_triggers.filter((item) => item.category === 'people'),
      sleep: analysis.top_triggers.filter((item) => item.category === 'sleep'),
      change: analysis.top_triggers.filter((item) => item.category === 'change'),
    };

    return res.json({
      success: true,
      endpoint: '/api/ai/trigger-analyzer',
      top_triggers: analysis.top_trigger_labels,
      triggers: analysis.top_triggers,
      top_triggers_details: analysis.top_triggers,
      negative_trigger_frequency: analysis.negative_trigger_frequency,
      keyword_summary: analysis.keyword_summary,
      category_summary: analysis.category_summary,
      categorized_triggers: categorizedTriggers,
      dominant_category: analysis.dominant_category,
      patterns: analysis.patterns,
      source_mode: analysis.source_mode,
      sources_analyzed: {
        description: Boolean(String(description || '').trim()),
        notes: Array.isArray(notes) ? notes.length : String(notes || '').trim() ? 1 : 0,
        journal_entries: mergedJournalContents.length,
        chat_messages: chatMessages.length,
      },
      mood_distribution: moodDistribution,
    });
  } catch (error) {
    console.error('[ERR] /api/ai/trigger-analyzer', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 4. Weekly Report ============
router.get('/weekly-report', async (req, res) => {
  try {
    const { userEmail = 'anonymous', format = 'json' } = req.query;
    const db = getDb();

    const moods = await db.list('MoodEntry');
    const journals = await db.list('JournalEntry');

    const userMoods = moods.filter(m => m.user_email === userEmail && new Date(m.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const userJournals = journals.filter(j => j.user_email === userEmail && new Date(j.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const achievements = await db.list('Achievement');
    const userAchievements = achievements.filter((a) => a.user_email === userEmail);

    const generateReport = async () => {
      const geminiResponse = await invokeGeminiJSON({
        prompt: `Generate weekly wellness report. Moods: ${userMoods.map(m => `${m.mood}(${m.intensity})`).join(', ')}. Journals: ${userJournals.map(j => j.content).join(' ')}. Return JSON with: { "week_summary": {...}, "themes": ["str1"], "wins": ["str1"], "recommendations": ["str1"], "html": "html_string" }`
      });
      return geminiResponse;
    };

    const fallback = () => {
      const report = buildWeeklyDataDrivenReport({
        moods: userMoods,
        journals: userJournals,
        activities: userAchievements,
      });
      return {
        ...localGen.generateWeeklyReport(userMoods, userJournals),
        ...report,
      };
    };

    const report = await aiService(
      {
        name: 'weekly-report',
        prompt: `Generate comprehensive weekly report for: ${userMoods.length} mood entries, ${userJournals.length} journal entries`
      },
      fallback,
      { forceLocal: !hasGeminiKey() }
    );

    if (format === 'html') {
      res.contentType('text/html');
      return res.send(report.html || '<p>Report generated</p>');
    }

    return res.json({ success: true, ...report });
  } catch (error) {
    console.error('[ERR] /api/ai/weekly-report', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 5. Decision Helper ============
router.post('/decision-helper', async (req, res) => {
  try {
    const {
      decision = '',
      situation = '',
      context = '',
      options = [],
      userEmail = 'anonymous',
    } = req.body || {};

    const decisionText = String(decision || situation || '').trim();
    const contextText = String(context || '').trim();
    const optionList = Array.isArray(options) ? options : [];

    if (!decisionText) {
      return res.status(400).json({ success: false, error: 'decision is required' });
    }

    const toCleanPoint = (value) => {
      const text = String(value || '').trim();
      if (!text) return '';
      if (/^(yes|no|ok|n\/a|na|none|null|-|\.)$/i.test(text)) return '';
      if (text.length < 3) return '';
      return text;
    };

    const inferOptionName = (name, pros = [], cons = [], index = 0) => {
      const clean = String(name || '').trim();
      if (clean && !/^option\s*\d+$/i.test(clean)) {
        return clean;
      }

      const source = [...pros, ...cons].find(Boolean) || '';
      const s = source.toLowerCase();
      if (/salary|pay|income|money|financial/.test(s)) return 'Financial upside path';
      if (/family|partner|friend|home|support/.test(s)) return 'Support system path';
      if (/growth|learn|career|skill|promotion/.test(s)) return 'Career growth path';
      if (/stable|security|safe|predictable/.test(s)) return 'Stability path';
      if (/risk|uncertain|startup|volatile/.test(s)) return 'High-risk high-reward path';
      if (/stress|burnout|pressure|commute|hours/.test(s)) return 'Low-stress path';
      return `Option ${index + 1}`;
    };

    const hashString = (value) => {
      let hash = 0;
      for (let i = 0; i < value.length; i += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const normalizeOptions = () => {
      if (optionList.length === 0) {
        return [
          { name: 'Option 1', pros: [], cons: [] },
          { name: 'Option 2', pros: [], cons: [] },
        ];
      }

      return optionList.map((opt, idx) => {
        const pros = Array.isArray(opt?.pros) ? opt.pros.map((p) => toCleanPoint(p)).filter(Boolean) : [];
        const cons = Array.isArray(opt?.cons) ? opt.cons.map((c) => toCleanPoint(c)).filter(Boolean) : [];
        return {
          name: inferOptionName(opt?.name, pros, cons, idx),
          pros,
          cons,
        };
      });
    };

    const buildFallbackDecision = () => {
      const normalizedOptions = normalizeOptions();
      const fullText = `${decisionText} ${contextText}`.toLowerCase();
      const factors = {
        money: /salary|pay|income|financial|money|budget|cost|expensive|cheap/,
        growth: /career|growth|learn|skill|future|promotion|opportunity|startup|challenge/,
        family: /family|partner|friends|support|home|parents|children|relationship/,
        wellbeing: /stress|anxious|overwhelm|tired|burnout|panic|pressure|mental health|balance|calm/,
        stability: /stable|security|safe|risk|uncertain|predictable|volatility/,
        logistics: /relocate|move|commute|distance|travel|hours|time zone/,
      };

      const priorities = Object.fromEntries(Object.keys(factors).map((key) => [key, factors[key].test(fullText) ? 1.35 : 1]));

      const optionFactorSignals = (optText) => {
        const lower = optText.toLowerCase();
        return {
          money: /salary|pay|income|money|financial|bonus|equity|cost/.test(lower),
          growth: /growth|learn|career|promotion|skill|challenge|startup/.test(lower),
          family: /family|partner|friends|home|support|close to/.test(lower),
          wellbeing: /stress|burnout|pressure|balance|calm|rest|energy|mental/.test(lower),
          stability: /stable|security|safe|predictable|risk|uncertain/.test(lower),
          logistics: /relocate|commute|move|distance|hours|travel|schedule/.test(lower),
        };
      };

      const scoreOption = (opt) => {
        let score = 5 + (opt.pros.length * 0.95) - (opt.cons.length * 0.85);
        const prosText = `${opt.name} ${opt.pros.join(' ')}`;
        const consText = `${opt.cons.join(' ')}`;
        const prosSignals = optionFactorSignals(prosText);
        const consSignals = optionFactorSignals(consText);

        Object.keys(priorities).forEach((key) => {
          if (prosSignals[key]) score += 0.85 * priorities[key];
          if (consSignals[key]) score -= 0.9 * priorities[key];
        });

        if (/high salary|higher salary|pay more/.test(prosText.toLowerCase()) && priorities.money > 1) score += 0.5;
        if (/less stress|better balance|close to home|support/.test(prosText.toLowerCase()) && (priorities.wellbeing > 1 || priorities.family > 1)) score += 0.6;
        if (/high risk|uncertain|volatile/.test(consText.toLowerCase()) && priorities.stability > 1) score -= 0.8;

        return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
      };

      const analyzed = normalizedOptions.map((opt) => {
        const score = scoreOption(opt);
        const strongestPro = opt.pros[0] || 'clear upside';
        const mainRisk = opt.cons[0] || 'manageable trade-off';
        const emotionalImpact = score >= 7.5
          ? `Likely to feel lighter emotionally because it supports ${strongestPro.toLowerCase()}.`
          : score >= 5.5
            ? `Emotionally workable, but ${mainRisk.toLowerCase()} could create tension in demanding periods.`
            : `May increase emotional strain if ${mainRisk.toLowerCase()} remains unaddressed.`;

        const longTermOutlook = score >= 7.5
          ? 'Strong long-term potential if you stay consistent and review trade-offs regularly.'
          : score >= 5.5
            ? 'Mixed long-term outlook; success depends on how well you manage the main downside.'
            : 'Long-term fit looks weak unless your circumstances change significantly.';

        return {
          option_name: opt.name,
          emotional_impact: emotionalImpact,
          long_term_outlook: longTermOutlook,
          score,
          pros: opt.pros,
          cons: opt.cons,
        };
      }).sort((a, b) => b.score - a.score);

      const top = analyzed[0];
      const second = analyzed[1];

      const redFlags = [];
      const greenFlags = [];
      analyzed.forEach((item) => {
        (item.cons || []).slice(0, 2).forEach((c) => redFlags.push(`${item.option_name}: ${c}`));
        (item.pros || []).slice(0, 2).forEach((p) => greenFlags.push(`${item.option_name}: ${p}`));
      });

      if (redFlags.length === 0 && /risk|uncertain|pressure|stress/.test(fullText)) {
        redFlags.push('Current emotional pressure may make short-term decisions feel more urgent than necessary.');
      }
      if (greenFlags.length === 0 && /support|growth|calm|stable/.test(fullText)) {
        greenFlags.push('You already identified what matters most to you, which improves decision clarity.');
      }

      const dominantPriority = Object.entries(priorities).sort((a, b) => b[1] - a[1])[0]?.[0] || 'balance';
      const keyQuestionMap = {
        family: 'Which option protects both your emotional support system and your future goals?',
        money: 'If you choose higher financial upside, what emotional cost are you truly willing to carry?',
        wellbeing: 'Which option lowers weekly emotional load instead of only solving short-term pressure?',
        growth: 'Which option gives you meaningful growth without eroding your wellbeing?',
        stability: 'How much uncertainty can you realistically handle for the next 6-12 months?',
        logistics: 'Which option keeps your day-to-day life sustainable, not just attractive on paper?',
        balance: 'Which option matches who you want to be 6 months from now, not just today?',
      };

      const keyQuestion = keyQuestionMap[dominantPriority] || keyQuestionMap.balance;

      const variants = [
        {
          summary: second
            ? `Your strongest fit is ${top.option_name}, with ${second.option_name} close behind. The difference comes from how each option handles your top priorities this week.`
            : `This decision appears to have one workable option, but its trade-offs should be managed deliberately.`,
          recommendation: top
            ? `Favor ${top.option_name}, and pre-commit one boundary to reduce its main downside.`
            : 'Pick the option that protects emotional stability first, then optimize other goals.',
          next: top
            ? `Pilot ${top.option_name} for 7 days and track stress, energy, and confidence daily.`
            : 'Write three non-negotiables, then score each option against them.',
        },
        {
          summary: second
            ? `${top.option_name} currently leads because it aligns better with what you care about most; ${second.option_name} may still work if its key risk is controlled.`
            : `The available option can work, but clarity will improve if you define your non-negotiables first.`,
          recommendation: top
            ? `Choose ${top.option_name} if you can actively manage the downside in advance.`
            : 'Use a short experiment before committing long term.',
          next: top
            ? `Before committing, write one mitigation step for the top risk in ${top.option_name}.`
            : 'Have one honest conversation with a trusted person, then decide within a fixed deadline.',
        },
        {
          summary: second
            ? `Comparing both paths, ${top.option_name} gives a better emotional and practical fit right now than ${second.option_name}.`
            : `This choice is less about perfection and more about reducing future regret.`,
          recommendation: top
            ? `Lean toward ${top.option_name}, but schedule a review checkpoint after the first 2 weeks.`
            : 'Take the safer short-term step while preserving room to pivot.',
          next: top
            ? `Set a two-week checkpoint for ${top.option_name}: what improved, what worsened, what to adjust.`
            : 'Document your decision criteria in one page and revisit after one week.',
        },
      ];

      const variantIndex = hashString(`${decisionText}|${contextText}|${normalizedOptions.map((o) => o.name).join('|')}`) % variants.length;
      const selectedVariant = variants[variantIndex];

      return {
        summary: selectedVariant.summary,
        option_analyses: analyzed.map((item) => ({
          option_name: item.option_name,
          emotional_impact: item.emotional_impact,
          long_term_outlook: item.long_term_outlook,
          score: item.score,
        })),
        balanced_recommendation: selectedVariant.recommendation,
        key_question: keyQuestion,
        red_flags: redFlags.slice(0, 5),
        green_flags: greenFlags.slice(0, 5),
        next_step: selectedVariant.next,
      };
    };

    const generateHelp = async () => {
      const geminiResponse = await invokeGeminiJSON({
        prompt: `You are a decision coach. Analyze this decision with emotional and practical balance.

User decision: "${decisionText}"
Context: "${contextText || 'none'}"
Options: ${JSON.stringify(normalizeOptions())}

Return JSON with keys exactly:
{
  "summary": "string",
  "option_analyses": [
    {
      "option_name": "string",
      "emotional_impact": "string",
      "long_term_outlook": "string",
      "score": 0-10
    }
  ],
  "balanced_recommendation": "string",
  "key_question": "string",
  "red_flags": ["string"],
  "green_flags": ["string"],
  "next_step": "string"
}`
      });
      return geminiResponse;
    };

    const fallback = () => buildDecisionHelperAnalysis({
      decision: decisionText,
      context: contextText,
      options: normalizeOptions(),
    });

    const result = await aiService(
      {
        name: 'decision-helper',
        prompt: `Analyze decision: "${decisionText}" with context: "${contextText}" and options: ${JSON.stringify(normalizeOptions())}`,
        json: true,
      },
      fallback,
      { forceLocal: !hasGeminiKey() }
    );

    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    const base = buildDecisionHelperAnalysis({
      decision: decisionText,
      context: contextText,
      options: normalizeOptions(),
    });
    const optionAnalyses = Array.isArray(parsed?.option_analyses) && parsed.option_analyses.length > 0
      ? parsed.option_analyses.map((item, index) => ({
        option_name: String(item.option_name || `Option ${index + 1}`),
        emotional_impact: String(item.emotional_impact || 'Emotional impact depends on your current stress and support level.'),
        long_term_outlook: String(item.long_term_outlook || 'Long-term outcome depends on consistency and boundaries.'),
        score: Math.max(1, Math.min(10, Number(item.score || 5))),
      }))
      : base.option_analyses;

    const normalized = {
      summary: String(parsed?.summary || base.summary),
      option_analyses: optionAnalyses,
      balanced_recommendation: String(parsed?.balanced_recommendation || parsed?.recommendation || base.balanced_recommendation),
      recommendation: String(parsed?.recommendation || parsed?.balanced_recommendation || base.recommendation || base.balanced_recommendation),
      final_suggestion: String(parsed?.final_suggestion || base.final_suggestion),
      key_question: String(parsed?.key_question || base.key_question),
      red_flags: Array.isArray(parsed?.red_flags) ? parsed.red_flags : base.red_flags,
      green_flags: Array.isArray(parsed?.green_flags) ? parsed.green_flags : base.green_flags,
      next_step: String(parsed?.next_step || (Array.isArray(parsed?.next_steps) ? parsed.next_steps[0] : '') || base.next_step),
      next_steps: Array.isArray(parsed?.next_steps) && parsed.next_steps.length > 0 ? parsed.next_steps : base.next_steps,
      pros: Array.isArray(parsed?.pros) ? parsed.pros : base.pros,
      cons: Array.isArray(parsed?.cons) ? parsed.cons : base.cons,
      user_email: userEmail,
    };

    return res.json({ success: true, ...normalized });
  } catch (error) {
    console.error('[ERR] /api/ai/decision-helper', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 6. Game Tip (Stress Buster) ============
router.post('/game-tip', async (req, res) => {
  try {
    const { game = 'breathing', mood = 'neutral' } = req.body;

    const generateTip = async () => {
      const geminiResponse = await invokeGemini({
        prompt: `Generate a personalized tip for the "${game}" game to help with "${mood}" mood. Keep it short, actionable, and encouraging.`
      });
      return geminiResponse;
    };

    const fallback = () => localGen.generateGameTip(game, mood);

    const tip = await aiService(
      {
        name: 'game-tip',
        prompt: `Personalized tip for ${game} game in ${mood} mood`
      },
      fallback,
      { forceLocal: !hasGeminiKey() }
    );

    return res.json({ success: true, tip: typeof tip === 'string' ? tip : tip.text });
  } catch (error) {
    console.error('[ERR] /api/ai/game-tip', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 7. Emotion Story ============
router.post('/emotion-story', async (req, res) => {
  try {
    const { emotions = [], variationSeed = null } = req.body;
    const emotionList = Array.isArray(emotions) ? emotions.filter(Boolean) : [emotions].filter(Boolean);
    const primaryEmotion = emotionList[0] || 'neutral';
    const seedText = String(variationSeed ?? Date.now());
    const seedNumber = seedText.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const emotionSignature = `${emotionList.join('|')}|${seedText}`;
    const styleSeeds = [
      'warm and intimate',
      'hopeful and cinematic',
      'gentle and reflective',
      'grounded and practical',
      'poetic but clear',
    ];
    const sceneSeeds = [
      'a dawn bus stop',
      'a quiet kitchen',
      'a rainy sidewalk',
      'a small bedroom with one lamp on',
      'a train platform at sunset',
    ];
    const formatSeeds = [
      'classic narrative in 3 short paragraphs',
      'journal-entry format with mini headers',
      'scene and inner-voice format',
      'three numbered story beats',
      'short letter-to-self format',
    ];
    const style = styleSeeds[(emotionSignature.length + primaryEmotion.length + seedNumber) % styleSeeds.length];
    const scene = sceneSeeds[(emotionSignature.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) || 0) % sceneSeeds.length];
    const formatStyle = formatSeeds[seedNumber % formatSeeds.length];
    const sentimentByMood = {
      sad: -0.72,
      stressed: -0.62,
      anxious: -0.76,
      angry: -0.82,
      happy: 0.78,
      calm: 0.42,
      neutral: 0,
    };
    const intensityByMood = {
      sad: 76,
      stressed: 82,
      anxious: 88,
      angry: 92,
      happy: 72,
      calm: 38,
      neutral: 48,
    };

    const generateStory = async () => {
      const geminiResponse = await invokeGeminiJSON({
        prompt: `Write a unique, compassionate emotion story as JSON.

Emotions: ${emotionList.join(', ') || 'neutral'}
Primary emotion: ${primaryEmotion}
Desired style: ${style}
Scene: ${scene}
Format style: ${formatStyle}
Variation seed: ${seedText}

Return JSON with keys:
- title
- story
- moral
- affirmation
- reflection_question
- quote

Rules:
- Make the story specific to the emotions above.
- Use a different emotional situation and wording each time.
- Do not use generic self-help phrasing.
- Follow the requested format style.
- End with a grounded but hopeful takeaway.`
      });
      return geminiResponse;
    };

    const fallback = () => localGen.generateEmotionStory(emotions, variationSeed);

    const story = await aiService(
      {
        name: 'emotion-story',
        json: true,
        prompt: `Create a unique reflective emotion story in JSON.

Emotions: ${emotionList.join(', ') || 'neutral'}
Primary emotion: ${primaryEmotion}
Style seed: ${style}
Scene seed: ${scene}
Format seed: ${formatStyle}
Variation seed: ${seedText}

Return JSON with title, story, moral, affirmation, reflection_question, and quote.`
      },
      fallback,
      { forceLocal: !hasGeminiKey() }
    );

    const normalized = typeof story === 'string'
      ? {
        title: 'Emotion Story',
        story,
        moral: '',
        affirmation: '',
        reflection_question: '',
        quote: '',
        sentiment_score: sentimentByMood[primaryEmotion] ?? 0,
        emotional_intensity_score: intensityByMood[primaryEmotion] ?? 48,
      }
      : {
        ...story,
        quote: String(story?.quote || ''),
        sentiment_score: Number.isFinite(Number(story?.sentiment_score))
          ? Number(story.sentiment_score)
          : (sentimentByMood[primaryEmotion] ?? 0),
        emotional_intensity_score: Number.isFinite(Number(story?.emotional_intensity_score))
          ? Math.max(0, Math.min(100, Number(story.emotional_intensity_score)))
          : (intensityByMood[primaryEmotion] ?? 48),
      };

    // New stories from generateEmotionStory already have proper length and emotional depth
    // Skip ensureLongEmotionStory since the enhanced generator handles this
    return res.json({ success: true, ...normalized });
  } catch (error) {
    console.error('[ERR] /api/ai/emotion-story', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 8. Color Therapy ============
router.post('/color-therapy', async (req, res) => {
  try {
    const { mood = 'neutral' } = req.body;

    const generateColor = async () => {
      const geminiResponse = await invokeGeminiJSON({
        prompt: `Suggest a therapeutic color for "${mood}" mood. Return JSON with: { "color_name": "str", "hex": "#XXXXXX", "benefit": "str", "suggestion": "str", "activities": ["str1", "str2"] }`
      });
      return geminiResponse;
    };

    const fallback = () => localGen.generateColorTherapy(mood);

    const result = await aiService(
      {
        name: 'color-therapy',
        prompt: `Therapeutic color recommendation for ${mood} mood`
      },
      fallback,
      { forceLocal: !hasGeminiKey() }
    );

    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    return res.json({ success: true, ...parsed });
  } catch (error) {
    console.error('[ERR] /api/ai/color-therapy', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 9. Study Help ============
router.post('/study-help', async (req, res) => {
  try {
    const { subject = '', duration = 60, difficulty = 'medium', mood = 'neutral', energyLevel = 6 } = req.body;
    const normalizedMood = String(mood || 'neutral').toLowerCase();
    const normalizedEnergy = Math.max(1, Math.min(10, Number(energyLevel) || 6));

    const normalizeStudyResponse = (payload = {}) => {
      const schedule = Array.isArray(payload.schedule)
        ? payload.schedule
        : Array.isArray(payload.study_plan?.schedule)
          ? payload.study_plan.schedule
          : [];
      const tips = Array.isArray(payload.tips) ? payload.tips : [];
      const structuredSuggestions = payload.structured_suggestions || payload.study_plan?.structured_suggestions || {
        before_study: [],
        during_study: [],
        breaks: [],
        after_study: [],
      };

      return {
        recommendation_type: payload.recommendation_type || payload.technique || payload.study_plan?.technique || 'Pomodoro + breaks',
        focus_level: payload.focus_level || 'moderate',
        subject: payload.subject || subject || 'General',
        mood: payload.mood || normalizedMood,
        energy_level: Number(payload.energy_level || normalizedEnergy),
        session_style: payload.session_style || 'Structured study blocks',
        first_task: payload.first_task || 'Start with a clear, manageable task',
        structured_suggestions: structuredSuggestions,
        schedule: schedule.map((item, index) => ({
          session: item.session || index + 1,
          focus: item.focus || item.study || '25 min',
          break: item.break || '5 min',
          task_type: item.task_type || 'study',
        })),
        tips: tips.length > 0 ? tips : ['Start small', 'Stay consistent', 'Take real breaks'],
        motivation: payload.motivation || 'You can make meaningful progress with a realistic plan.',
      };
    };

    const generatePlan = async () => {
      const geminiResponse = await invokeGeminiJSON({
        prompt: `Create a structured study plan.

Subject: "${subject}"
Duration: ${duration} minutes
Difficulty: "${difficulty}"
Mood: "${normalizedMood}"
Energy level: ${normalizedEnergy}/10

Rules:
- If mood is stress/anxious/stressed, recommend Pomodoro + breaks.
- If energy is low (1-4), recommend light tasks and short focus blocks.
- If energy is high (7-10), recommend deep work and harder tasks first.
- Return JSON with: { "recommendation_type": "str", "focus_level": "low|moderate|high", "mood": "str", "energy_level": number, "session_style": "str", "first_task": "str", "structured_suggestions": { "before_study": ["str"], "during_study": ["str"], "breaks": ["str"], "after_study": ["str"] }, "schedule": [{ "session": 1, "focus": "25 min", "break": "5 min", "task_type": "str" }], "tips": ["str1", "str2"], "motivation": "str" }`
      });
      return geminiResponse;
    };

    const fallback = () => {
      const local = localGen.generateStudyHelp(subject, duration, difficulty, normalizedMood, normalizedEnergy);
      const adaptive = buildMoodAdaptiveStudyPlan({ subject, duration, difficulty, mood: normalizedMood, energyLevel: normalizedEnergy });
      return normalizeStudyResponse({
        ...local,
        ...adaptive,
      });
    };

    const result = await aiService(
      {
        name: 'study-help',
        prompt: `Study plan for ${subject}, ${duration}min, ${difficulty}, mood ${normalizedMood}, energy ${normalizedEnergy}`
      },
      fallback,
      { forceLocal: !hasGeminiKey() }
    );

    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    return res.json({ success: true, ...normalizeStudyResponse(parsed) });
  } catch (error) {
    console.error('[ERR] /api/ai/study-help', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 10. Positivity Feed ============
router.get('/positivity-feed', async (req, res) => {
  try {
    const { userEmail = 'anonymous', userName = 'Friend', mood = 'neutral', count = 3 } = req.query;

    const generateAffirmations = async () => {
      const geminiResponse = await invokeGemini({
        prompt: `Generate ${count} unique, personalized affirmations for ${userName} who is feeling "${mood}". Each affirmation should be 1-2 sentences, warm, and validating. Format as JSON array: ["aff1", "aff2", "aff3"]`
      });
      try {
        return JSON.parse(geminiResponse);
      } catch {
        return [geminiResponse];
      }
    };

    const generateOne = () => localGen.generatePositivityAffirmation(mood, userName);
    const fallback = () => Array(parseInt(count) || 3).fill(0).map(() => generateOne());

    const result = await aiService(
      {
        name: 'positivity-feed',
        prompt: `Generate ${count} affirmations for mood: ${mood}`
      },
      fallback,
      { forceLocal: !hasGeminiKey() }
    );

    const affirmations = Array.isArray(result) ? result : [result];
    return res.json({ success: true, affirmations });
  } catch (error) {
    console.error('[ERR] /api/ai/positivity-feed', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
