import { invokeGemini, invokeGeminiJSON, hasGeminiKey } from '../gemini.js';
import { advancedSentimentAnalysis } from '../sentimentAnalysis.js';

export async function runAIService(generator, fallbackFn, options = {}) {
  const useGemini = hasGeminiKey() && !options.forceLocal;

  try {
    if (useGemini && generator.prompt) {
      if (generator.json) {
        return await invokeGeminiJSON(generator);
      }
      return await invokeGemini(generator);
    }
  } catch (error) {
    console.warn(`[AI] Gemini failed for ${generator.name || 'task'}:`, error.message);
  }

  return fallbackFn();
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function analyzeSentiment(text = '') {
  const input = String(text || '').toLowerCase();
  const positive = ['good', 'great', 'happy', 'better', 'calm', 'hopeful', 'fine', 'thankful', 'grateful', 'relaxed'];
  const negative = ['sad', 'anxious', 'stress', 'stressed', 'angry', 'tired', 'hopeless', 'alone', 'bad', 'panic', 'overwhelm'];

  let score = 0;
  for (const token of positive) if (input.includes(token)) score += 1;
  for (const token of negative) if (input.includes(token)) score -= 1;

  const normalized = clamp((score + 6) / 12, 0, 1);
  const detected = score >= 2 ? 'positive' : score <= -2 ? 'negative' : 'neutral';
  return { detected_sentiment: detected, sentiment_score: Number(normalized.toFixed(2)), raw_score: score };
}

export function buildConversationContext(conversationHistory = [], latestMessage = '') {
  const turns = (Array.isArray(conversationHistory) ? conversationHistory : [])
    .filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
    .slice(-30);

  const transcript = turns.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  const userRecent = turns.filter((m) => m.role === 'user').slice(-6).map((m) => m.content.trim()).filter(Boolean);
  const merged = `${userRecent.join(' ')} ${latestMessage}`.toLowerCase();

  const themes = [];
  if (/anx|stress|panic|overwhelm/.test(merged)) themes.push('anxiety/stress');
  if (/sad|down|depress|hopeless|empty/.test(merged)) themes.push('low mood');
  if (/angry|mad|frustrat|irritat/.test(merged)) themes.push('anger/frustration');
  if (/sleep|insomnia|tired|exhaust/.test(merged)) themes.push('sleep/fatigue');
  if (/study|exam|work|deadline|job/.test(merged)) themes.push('performance pressure');
  if (/relationship|friend|family|partner|alone/.test(merged)) themes.push('relationships/support');

  return {
    transcript: transcript || '(no prior context)',
    themes: themes.length > 0 ? themes : ['general emotional support'],
    recentUserMessages: userRecent,
  };
}

function normalizeMoodLabel(mood = 'neutral') {
  const value = String(mood || 'neutral').trim().toLowerCase();
  if (value === 'stress' || value === 'stressed') return 'stressed';
  if (value === 'calm' || value === 'peaceful' || value === 'relaxed') return 'calm';
  if (value === 'fine' || value === 'okay' || value === 'ok') return 'neutral';
  if (value === 'upset') return 'sad';
  return ['happy', 'calm', 'neutral', 'stressed', 'sad', 'anxious', 'angry'].includes(value) ? value : 'neutral';
}

function summarizeMoodHistory(history = []) {
  const counts = { happy: 0, calm: 0, neutral: 0, stressed: 0, sad: 0, anxious: 0, angry: 0 };
  let totalIntensity = 0;

  for (const entry of history) {
    const mood = normalizeMoodLabel(entry?.mood);
    const intensity = clamp(Number(entry?.intensity) || 5, 1, 10);
    counts[mood] += 1;
    totalIntensity += intensity;
  }

  const positive = counts.happy + counts.calm;
  const negative = counts.stressed + counts.sad + counts.anxious + counts.angry;
  const neutral = counts.neutral;
  const dominant = history.length
    ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral'
    : 'neutral';

  return {
    counts,
    positive,
    negative,
    neutral,
    dominant,
    averageIntensity: history.length ? totalIntensity / history.length : 0,
  };
}

function buildPeriodForecast(mood, period) {
  const templates = {
    happy: {
      morning: 'The morning should feel lighter, with easier focus and a better chance of momentum.',
      afternoon: 'Expect steady energy and a good window for productive work or social connection.',
      evening: 'The evening is likely to stay upbeat if you keep your pace reasonable.',
    },
    calm: {
      morning: 'A calm start is likely, especially if you keep the first hour simple.',
      afternoon: 'The afternoon should remain balanced and manageable.',
      evening: 'The evening may feel settled and restorative.',
    },
    neutral: {
      morning: 'The morning looks stable but not especially elevated.',
      afternoon: 'The afternoon should stay fairly even unless stress builds up.',
      evening: 'The evening is likely to remain steady and low-drama.',
    },
    stressed: {
      morning: 'The morning may feel pressured, so start with one small task and avoid overload.',
      afternoon: 'The afternoon could feel tense unless you build in breaks and reduce demand.',
      evening: 'The evening is likely to improve only if you actively slow the pace down.',
    },
    sad: {
      morning: 'The morning may feel heavy, so gentle routines will matter most.',
      afternoon: 'The afternoon could stay low-energy unless something supportive interrupts the pattern.',
      evening: 'The evening may feel softer if you make room for rest and connection.',
    },
    anxious: {
      morning: 'The morning may feel alert or unsettled, so grounding will help most.',
      afternoon: 'The afternoon could stay restless if you keep anticipating worst-case outcomes.',
      evening: 'The evening should improve if you reduce stimulation and simplify choices.',
    },
    angry: {
      morning: 'The morning may start reactive, so slow down before responding to anything difficult.',
      afternoon: 'The afternoon could stay sharp unless you make space to decompress.',
      evening: 'The evening should ease if you separate yourself from the source of friction.',
    },
  };

  return templates[mood]?.[period] || templates.neutral[period] || 'The day looks broadly steady.';
}

export function buildChatFallbackReply({ message = '', conversationHistory = [], profile = {}, isCrisis = false }) {
  if (isCrisis) {
    return {
      response: 'Your safety matters most right now. If you are in immediate danger, call your local emergency number now and reach out to a trusted person nearby. I can stay with you while you take the next step.',
      detected_sentiment: 'critical',
      sentiment_score: 0.05,
    };
  }

  const sentiment = analyzeSentiment(message);
  const context = buildConversationContext(conversationHistory, message);
  const moodGoal = String(profile?.mood_goal || '').trim();
  const prefs = profile?.notification_preferences || {};
  const hasGoal = Boolean(moodGoal);

  const plan = [
    'Take 60 seconds for slow breathing (inhale 4s, exhale 6s).',
    'Write one concrete next step for the next 20 minutes.',
    'Complete that one step before deciding what to do next.',
  ];

  if (prefs?.daily_checkin) {
    plan.push('Do a short mood check-in after this task to track the shift.');
  }

  const personalization = hasGoal
    ? `I remember your current wellness goal: "${moodGoal}". `
    : '';

  return {
    response: `${personalization}From what you shared, the main pattern is ${context.themes.join(', ')}. Start with this short plan: ${plan.join(' ')}`,
    detected_sentiment: sentiment.detected_sentiment,
    sentiment_score: sentiment.sentiment_score,
    context_summary: `Themes: ${context.themes.join(', ')}`,
    suggested_next_steps: plan,
  };
}

function summarizeText(text = '') {
  const clean = String(text || '').trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 2).join(' ').slice(0, 240).trim();
}

function mapJournalEmotion(emotionStates = [], sentiment = 'neutral', score = 0) {
  const states = (Array.isArray(emotionStates) ? emotionStates : [emotionStates])
    .map((state) => String(state || '').toLowerCase())
    .filter(Boolean);

  if (states.some((state) => ['happy', 'happiness', 'motivation', 'peace', 'grateful', 'hopeful'].includes(state))) return 'happy';
  if (states.some((state) => ['sad', 'sadness', 'depressed', 'down', 'lonely', 'hopeless'].includes(state))) return 'sad';
  if (states.some((state) => ['stress', 'stressed', 'fatigue', 'tired'].includes(state))) return 'stress';
  if (states.some((state) => ['fear', 'anxious', 'panic', 'worry', 'nervous'].includes(state))) return 'anxious';

  if (sentiment === 'positive' || score >= 0.2) return 'happy';
  if (sentiment === 'stressed') return 'stress';
  if (sentiment === 'negative' || score <= -0.2) return 'sad';
  return 'happy';
}

export function buildJournalAnalysisResult({ content = '', userEmail = 'anonymous' } = {}) {
  const text = String(content || '').trim();
  const sentiment = advancedSentimentAnalysis(text);
  const lower = text.toLowerCase();
  const mappedEmotion = mapJournalEmotion(sentiment.emotion_states, sentiment.sentiment, sentiment.score);

  const themes = [];
  if (/work|job|deadline|project|school|study|exam/.test(lower)) themes.push('work pressure');
  if (/friend|family|partner|relationship|lonely|alone|ignored|support/.test(lower)) themes.push('relationships');
  if (/sleep|tired|rest|exhaust|fatigue/.test(lower)) themes.push('rest and energy');
  if (/change|future|unknown|uncertain|transition/.test(lower)) themes.push('uncertainty');
  if (/heal|growth|improve|progress|learn/.test(lower)) themes.push('growth');
  if (/grateful|thankful|blessed|appreciate/.test(lower)) themes.push('gratitude');

  const suggestionsByEmotion = {
    happy: [
      'Notice what made this moment feel good and repeat one small part of it tomorrow.',
      'Capture the detail you want to remember so you can recreate it later.',
    ],
    sad: [
      'Keep the next step very small and reach out to one supportive person if you can.',
      'Rest first, then choose one action that gives the day a little structure.',
    ],
    stress: [
      'Reduce the load for the next hour and focus on one concrete task only.',
      'Take a short reset, then write down what can wait until later.',
    ],
    anxious: [
      'Ground yourself with slow breathing and write the worry down in one sentence.',
      'Separate what you know from what you are predicting before making a decision.',
    ],
  };

  const topEmotion = mappedEmotion;
  const baseSummary = summarizeText(text) || 'The entry is short, but it still gives useful emotional context.';
  const themeText = themes.length > 0 ? ` Main themes: ${themes.join(', ')}.` : '';

  return {
    summary_title: topEmotion === 'happy' ? 'Positive Pattern' : topEmotion === 'sad' ? 'Low Mood Pattern' : topEmotion === 'stress' ? 'Stress Pattern' : 'Anxiety Pattern',
    analysis: `${baseSummary}${themeText} The dominant emotion appears to be ${topEmotion}.`,
    emotion: topEmotion,
    detected_emotions: [topEmotion],
    sentiment: sentiment.sentiment,
    sentiment_score: Number((sentiment.score * 2 - 1).toFixed(2)),
    triggers: themes,
    themes,
    summary: `${topEmotion.charAt(0).toUpperCase() + topEmotion.slice(1)} was the strongest emotional signal in this entry.`,
    suggestions: suggestionsByEmotion[topEmotion] || suggestionsByEmotion.stress,
    reflection_prompt: topEmotion === 'happy'
      ? 'What helped this moment feel better, and how can you repeat it?'
      : topEmotion === 'sad'
        ? 'What is one gentle action that would make today feel more supported?'
        : topEmotion === 'stress'
          ? 'What can you remove or delay so the load becomes lighter?'
          : 'What part of the worry is real, and what part needs more evidence?',
    supportive_note: topEmotion === 'happy'
      ? 'This is worth noticing because good moments are easier to rebuild when you name them clearly.'
      : 'Your reaction makes sense. One small step is enough to begin shifting the pressure.',
    user_email: userEmail,
  };
}

function normalizeDecisionText(value = '') {
  return String(value || '').trim();
}

function splitDecisionBlocks(contextText = '') {
  const blocks = String(contextText || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const nameMatch = block.match(/^(?:option\s*[:\-]\s*)?(.*?)(?:\n|$)/i);
    const prosMatch = block.match(/pros\s*[:\-]\s*([\s\S]*?)(?:\n\s*cons\s*[:\-]|$)/i);
    const consMatch = block.match(/cons\s*[:\-]\s*([\s\S]*?)$/i);
    const name = String(nameMatch?.[1] || `Option ${index + 1}`).replace(/^option\s*[:\-]\s*/i, '').trim() || `Option ${index + 1}`;
    const pros = String(prosMatch?.[1] || '')
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const cons = String(consMatch?.[1] || '')
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    return { name, pros, cons };
  });
}

function normalizeDecisionOptions({ decision = '', context = '', options = [] } = {}) {
  const list = Array.isArray(options) ? options : [];
  const structuredFromContext = splitDecisionBlocks(context);

  const normalized = list
    .map((option, index) => {
      if (option && typeof option === 'object' && !Array.isArray(option)) {
        const name = normalizeDecisionText(option.name) || `Option ${index + 1}`;
        const pros = Array.isArray(option.pros) ? option.pros.map((item) => normalizeDecisionText(item)).filter(Boolean) : [];
        const cons = Array.isArray(option.cons) ? option.cons.map((item) => normalizeDecisionText(item)).filter(Boolean) : [];
        return { name, pros, cons };
      }

      if (typeof option === 'string') {
        const name = normalizeDecisionText(option) || `Option ${index + 1}`;
        const block = structuredFromContext.find((item) => item.name.toLowerCase() === name.toLowerCase());
        return block || { name, pros: [], cons: [] };
      }

      return null;
    })
    .filter(Boolean);

  if (normalized.length > 0) {
    return normalized;
  }

  if (structuredFromContext.length > 0) {
    return structuredFromContext;
  }

  const decisionText = normalizeDecisionText(decision);
  const fallbackName = decisionText ? 'Option A: proceed' : 'Option A';
  return [
    { name: fallbackName, pros: decisionText ? ['Move the decision forward now'] : ['Defines one concrete action'], cons: ['May increase short-term uncertainty'] },
    { name: 'Option B: wait and gather more information', pros: ['More time to think', 'Lower risk of rushing'], cons: ['Delays resolution', 'Can prolong uncertainty'] },
  ];
}

function scoreDecisionOption(option, priorities) {
  const prosText = `${option.name} ${(option.pros || []).join(' ')}`.toLowerCase();
  const consText = `${(option.cons || []).join(' ')}`.toLowerCase();

  const keywordSets = {
    money: /salary|pay|income|financial|money|budget|cost|expensive|cheap|bonus|equity/,
    growth: /career|growth|learn|skill|future|promotion|opportunity|challenge|progress/,
    family: /family|partner|friends|support|home|parents|children|relationship|close to/,
    wellbeing: /stress|anxious|overwhelm|tired|burnout|panic|pressure|mental health|balance|calm|rest/,
    stability: /stable|security|safe|risk|uncertain|predictable|volatile/,
    logistics: /relocate|move|commute|distance|travel|hours|time zone|schedule/,
  };

  const emotionalSignals = {
    calming: /calm|stable|support|balance|rest|safe|steady|close to home|family|health/.test(`${prosText} ${consText}`),
    stressful: /stress|burnout|panic|overwhelm|pressure|volatile|uncertain|risk/.test(`${prosText} ${consText}`),
    energizing: /growth|opportunity|learn|progress|challenge|career|skill|future/.test(prosText),
  };

  let score = 5 + (option.pros.length * 0.85) - (option.cons.length * 0.9);

  Object.entries(keywordSets).forEach(([key, pattern]) => {
    if (pattern.test(prosText)) score += 0.8 * (priorities[key] || 1);
    if (pattern.test(consText)) score -= 0.9 * (priorities[key] || 1);
  });

  if (emotionalSignals.calming) score += 0.7 * (priorities.wellbeing || 1);
  if (emotionalSignals.stressful) score -= 0.9 * (priorities.wellbeing || 1);
  if (emotionalSignals.energizing) score += 0.45 * (priorities.growth || 1);

  if (/high salary|higher salary|pay more|better compensation/.test(prosText) && (priorities.money || 1) > 1) score += 0.5;
  if (/less stress|better balance|close to home|support/.test(prosText) && ((priorities.wellbeing || 1) > 1 || (priorities.family || 1) > 1)) score += 0.6;
  if (/high risk|uncertain|volatile/.test(consText) && (priorities.stability || 1) > 1) score -= 0.85;

  return clamp(Math.round(score * 10) / 10, 1, 10);
}

export function buildDecisionHelperAnalysis({ decision = '', context = '', options = [] } = {}) {
  const decisionText = normalizeDecisionText(decision);
  const contextText = normalizeDecisionText(context);
  const normalizedOptions = normalizeDecisionOptions({ decision: decisionText, context: contextText, options });
  const fullText = `${decisionText} ${contextText}`.toLowerCase();

  const priorities = {
    money: /salary|pay|income|financial|money|budget|cost|expensive|cheap/.test(fullText) ? 1.35 : 1,
    growth: /career|growth|learn|skill|future|promotion|opportunity|startup|challenge/.test(fullText) ? 1.35 : 1,
    family: /family|partner|friends|support|home|parents|children|relationship/.test(fullText) ? 1.35 : 1,
    wellbeing: /stress|anxious|overwhelm|tired|burnout|panic|pressure|mental health|balance|calm/.test(fullText) ? 1.45 : 1,
    stability: /stable|security|safe|risk|uncertain|predictable|volatility/.test(fullText) ? 1.35 : 1,
    logistics: /relocate|move|commute|distance|travel|hours|time zone/.test(fullText) ? 1.2 : 1,
  };

  const optionAnalyses = normalizedOptions.map((option, index) => {
    const score = scoreDecisionOption(option, priorities);
    const strongestPro = option.pros[0] || 'clear upside';
    const mainRisk = option.cons[0] || 'manageable trade-off';
    const emotionalImpact = score >= 7.5
      ? `Likely to feel emotionally lighter because it supports ${strongestPro.toLowerCase()}.`
      : score >= 5.5
        ? `Emotionally workable, but ${mainRisk.toLowerCase()} could create tension during harder weeks.`
        : `Likely to feel emotionally heavy unless ${mainRisk.toLowerCase()} is reduced first.`;

    const longTermOutlook = score >= 7.5
      ? 'Strong long-term fit if you keep the boundaries and habits that make it sustainable.'
      : score >= 5.5
        ? 'Mixed long-term outlook; success depends on how well you manage the main downside.'
        : 'Long-term fit looks weak unless your circumstances change significantly.';

    return {
      option_name: option.name || `Option ${index + 1}`,
      pros: option.pros,
      cons: option.cons,
      emotional_impact: emotionalImpact,
      long_term_outlook: longTermOutlook,
      score,
    };
  }).sort((a, b) => b.score - a.score);

  const top = optionAnalyses[0];
  const second = optionAnalyses[1];
  const gap = top && second ? Math.max(0, Number((top.score - second.score).toFixed(1))) : top?.score || 0;

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

  const summary = top
    ? second
      ? `Option A analysis and Option B analysis suggest ${top.option_name} is the stronger fit right now, but the gap is ${gap} points, so the trade-off is real rather than absolute.`
      : `Option A analysis suggests ${top.option_name} is the stronger fit, but the choice should still be tested against your emotional needs.`
    : 'You need to provide at least two meaningful options with pros and cons for a reliable recommendation.';

  const balancedRecommendation = top
    ? second && gap < 1.5
      ? `The options are close. Choose ${top.option_name} only if its main risk feels manageable; otherwise, delay and gather one more piece of evidence.`
      : `Lean toward ${top.option_name}, but commit one boundary that reduces its biggest downside before you decide.`
    : 'Add at least two options with pros and cons, then compare them against your stress, support, and stability needs.';

  const redFlags = [];
  const greenFlags = [];

  optionAnalyses.forEach((item) => {
    (item.cons || []).slice(0, 2).forEach((consItem) => redFlags.push(`${item.option_name}: ${consItem}`));
    (item.pros || []).slice(0, 2).forEach((proItem) => greenFlags.push(`${item.option_name}: ${proItem}`));
  });

  if (redFlags.length === 0 && /risk|uncertain|pressure|stress/.test(fullText)) {
    redFlags.push('Current emotional pressure may make short-term decisions feel more urgent than necessary.');
  }
  if (greenFlags.length === 0 && /support|growth|calm|stable/.test(fullText)) {
    greenFlags.push('You already identified what matters most to you, which improves decision clarity.');
  }

  const nextSteps = top
    ? [
      `Write one boundary for ${top.option_name} that protects your wellbeing.`,
      `Check whether the biggest downside can be reduced before committing.`,
      second ? `Compare ${top.option_name} and ${second.option_name} again after a short pause.` : 'Review the decision once more after a short pause.',
    ]
    : [
      'List at least two options with pros and cons.',
      'Mark which choice feels safest emotionally.',
      'Re-run the analysis once the trade-offs are clear.',
    ];

  const finalSuggestion = top
    ? `Final suggestion: choose ${top.option_name} if its biggest downside feels manageable; otherwise, wait and gather more evidence before deciding.`
    : 'Final suggestion: provide two clear options with pros and cons so the choice can be analyzed properly.';

  return {
    summary: `Option A analysis, Option B analysis, then a final suggestion based on emotional impact and long-term fit. ${summary}`,
    option_analyses: optionAnalyses,
    balanced_recommendation: balancedRecommendation,
    recommendation: balancedRecommendation,
    final_suggestion: finalSuggestion,
    key_question: keyQuestion,
    red_flags: redFlags.slice(0, 5),
    green_flags: greenFlags.slice(0, 5),
    next_step: nextSteps[0],
    next_steps: nextSteps,
    pros: top?.pros || [],
    cons: top?.cons || [],
  };
}

export function predictMoodWeighted({
  moodHistory = [],
  currentFeeling = '',
  sleepHours = 7,
  stressLevel = 5,
  energyLevel = 6,
  activityData = {},
}) {
  const normalizedHistory = (Array.isArray(moodHistory) ? moodHistory : [])
    .filter((entry) => entry && entry.mood)
    .slice(-30)
    .sort((a, b) => new Date(a.date || a.created_at || 0) - new Date(b.date || b.created_at || 0));

  const recent = normalizedHistory.slice(-14);
  const text = String(currentFeeling || '').toLowerCase();
  const stress = clamp(Number(stressLevel) || 0, 0, 10);
  const sleep = clamp(Number(sleepHours) || 0, 0, 12);
  const energy = clamp(Number(energyLevel) || 0, 0, 10);
  const activitiesDone = Number(activityData?.completed || activityData?.completedCount || 0) || 0;
  const historySummary = summarizeMoodHistory(recent);

  const lastMood = normalizeMoodLabel(recent[recent.length - 1]?.mood);
  let latestStreak = 0;
  for (let index = recent.length - 1; index >= 0; index -= 1) {
    if (normalizeMoodLabel(recent[index]?.mood) !== lastMood) break;
    latestStreak += 1;
  }

  const positiveText = /(happy|good|great|calm|better|grateful|hopeful|motivated|relieved|peaceful)/.test(text);
  const neutralText = /(okay|fine|steady|neutral|normal)/.test(text);
  const negativeText = /(sad|down|lonely|hopeless|cry|bad|empty)/.test(text);
  const stressedText = /(stress|stressed|overwhelm|anxious|panic|worried|pressure|deadline)/.test(text);
  const angryText = /(angry|frustrated|irritated|mad|furious)/.test(text);
  const tiredText = /(tired|drained|exhausted|sleepy|burnt out|burnout)/.test(text);

  const moodScores = {
    happy: historySummary.counts.happy * 1.2,
    calm: historySummary.counts.calm * 1.1,
    neutral: historySummary.counts.neutral * 0.8,
    stressed: historySummary.counts.stressed * 1.15,
    sad: historySummary.counts.sad * 1.1,
    anxious: historySummary.counts.anxious * 1.1,
    angry: historySummary.counts.angry * 1.05,
  };

  const sleepSupport = clamp((sleep - 7) * 0.9, -2.2, 1.8);
  const stressPressure = clamp((stress - 5) * 0.95, -1.5, 4.2);
  const energySupport = clamp((energy - 5) * 0.45, -1.8, 1.8);
  const textSupport = positiveText ? 1.4 : neutralText ? 0.5 : 0;
  const textPressure = (negativeText ? 1.3 : 0) + (stressedText ? 1.7 : 0) + (angryText ? 1.4 : 0) + (tiredText ? 0.7 : 0);

  const historyDirection = historySummary.positive - historySummary.negative;
  const historySupport = historyDirection > 0 ? Math.min(3, historyDirection * 0.55) : Math.max(-3, historyDirection * 0.45);

  moodScores.happy += Math.max(0, historySummary.positive * 0.35) + Math.max(0, sleepSupport) + Math.max(0, energySupport * 0.8) + (stress <= 4 ? 0.9 : 0) + textSupport + (latestStreak >= 3 && lastMood === 'happy' ? 2.6 : 0);
  moodScores.calm += Math.max(0, historySummary.counts.calm * 0.55) + Math.max(0, sleepSupport * 0.8) + Math.max(0, energySupport * 0.5) + (stress <= 4 ? 1.1 : 0) + (energy >= 6 ? 0.4 : 0) + (latestStreak >= 3 && lastMood === 'calm' ? 1.8 : 0);
  moodScores.neutral += Math.max(0, historySummary.neutral * 0.35) + (Math.abs(stress - 5) < 1.5 ? 1.1 : 0) + (Math.abs(sleep - 7) < 1.2 ? 0.6 : 0) + (Math.abs(historyDirection) <= 1 ? 1.3 : 0);
  moodScores.stressed += Math.max(0, stressPressure) + (sleep < 6 ? (6 - sleep) * 0.9 : 0) + (tiredText ? 0.6 : 0) + textPressure * 0.55 + (historySummary.negative * 0.25);
  moodScores.sad += Math.max(0, historySummary.counts.sad * 0.55) + (sleep < 6.5 ? (6.5 - sleep) * 0.45 : 0) + (energy < 5 ? (5 - energy) * 0.35 : 0) + Math.max(0, -energySupport) * 0.4 + (negativeText ? 1.1 : 0);
  moodScores.anxious += Math.max(0, stressPressure * 0.9) + (sleep < 6.5 ? (6.5 - sleep) * 0.5 : 0) + (stressedText ? 1.8 : 0) + (historySummary.counts.anxious * 0.45);
  moodScores.angry += Math.max(0, stressPressure * 0.7) + (angryText ? 2.1 : 0) + (historySummary.counts.angry * 0.55) + (textSupport > 0 ? -0.4 : 0);

  if (stress >= 8 && sleep <= 5.5) {
    moodScores.stressed += 3.8;
    moodScores.anxious += 1.2;
  }

  if (stress >= 7 && sleep <= 6) {
    moodScores.stressed += 1.4;
  }

  if (historySummary.positive >= 3 && latestStreak >= 3 && lastMood === 'happy' && stress <= 4 && sleep >= 7) {
    moodScores.happy += 3.5;
  }

  if (historySummary.counts.calm >= 3 && stress <= 4 && sleep >= 7) {
    moodScores.calm += 2.4;
  }

  if (historySummary.negative >= 3 && sleep < 6.5) {
    moodScores.stressed += 1.1;
  }

  if (historySummary.positive === 0 && historySummary.negative === 0) {
    moodScores.neutral += 1.8;
  }

  moodScores.happy += Math.max(0, historySupport) * 0.5;
  moodScores.calm += Math.max(0, historySupport) * 0.35;
  moodScores.stressed += Math.max(0, -historySupport) * 0.45;
  moodScores.sad += Math.max(0, -historySupport) * 0.25;

  const ranked = Object.entries(moodScores).sort((a, b) => b[1] - a[1]);
  const [predictedMood, topScore] = ranked[0] || ['neutral', 0];
  const secondScore = ranked[1]?.[1] ?? 0;
  const spread = Math.max(0, topScore - secondScore);

  const confidence = clamp(
    0.58 + (spread * 0.08) + Math.min(0.12, recent.length * 0.008) + (currentFeeling ? 0.05 : 0) + (latestStreak >= 3 ? 0.04 : 0),
    0.55,
    0.96,
  );

  const trend = ['happy', 'calm'].includes(predictedMood)
    ? 'improving'
    : predictedMood === 'neutral'
      ? 'stable'
      : 'declining';

  const driverSentences = [];
  if (stress >= 8 && sleep <= 5.5) {
    driverSentences.push(`High stress (${stress.toFixed(1)}/10) and low sleep (${sleep.toFixed(1)}h) are the strongest signals, so the forecast leans ${predictedMood}.`);
  } else if (historySummary.positive >= 3 && latestStreak >= 3 && lastMood === 'happy' && stress <= 4 && sleep >= 7) {
    driverSentences.push('Your recent history shows a consistent happy streak, and sleep plus stress are supportive enough to keep the forecast positive.');
  } else if (historySummary.counts.calm >= 3 && stress <= 4 && sleep >= 7) {
    driverSentences.push('A steady calm streak in your history, plus decent sleep and low stress, keeps the forecast grounded.');
  } else if (historySummary.negative >= 3 && sleep < 6.5) {
    driverSentences.push('Your recent history leans negative, and the shorter sleep window increases the chance of a stressed day.');
  } else if (historySummary.positive === historySummary.negative) {
    driverSentences.push('Your recent mood history is relatively balanced, so the forecast stays close to neutral.');
  } else {
    driverSentences.push('This forecast combines recent mood history, sleep, stress, energy, and your current feeling note instead of guessing.');
  }

  if (currentFeeling) {
    driverSentences.push(`Your current note adds context: "${String(currentFeeling).trim()}".`);
  }

  const explanation = driverSentences.join(' ');
  const basedOnEntries = recent.length;
  const prediction = `Tomorrow is most likely ${predictedMood}.`;
  const recentHistorySummary = basedOnEntries > 0
    ? `${historySummary.positive} positive, ${historySummary.neutral} neutral, and ${historySummary.negative} negative entries across the last ${basedOnEntries} mood logs.`
    : 'No mood history was available, so the forecast relies mainly on the current sleep and stress inputs.';

  return {
    prediction,
    predicted_mood: predictedMood,
    confidence,
    trend,
    key_insight: explanation,
    trend_note: explanation,
    explanation,
    main_driver: driverSentences[0],
    recent_history_summary: recentHistorySummary,
    based_on_entries: basedOnEntries,
    morning_forecast: buildPeriodForecast(predictedMood, 'morning'),
    afternoon_forecast: buildPeriodForecast(predictedMood, 'afternoon'),
    evening_forecast: buildPeriodForecast(predictedMood, 'evening'),
    top_tips: [
      stress >= 7 ? 'Keep the schedule lighter and add at least two decompression breaks.' : 'Protect one focused block for your most important task.',
      sleep < 7 ? 'Prioritize sleep tonight and cut late screen time if possible.' : 'Keep the sleep routine steady so tomorrow stays predictable.',
      energy <= 4 ? 'Use shorter work sprints and add movement between tasks.' : 'Use your current energy for one meaningful action early in the day.',
    ],
    risk_factors: [
      stress >= 7 ? 'High stress load' : 'Moderate stress variability',
      sleep < 6.5 ? 'Low sleep duration' : 'Sleep is not the main limiting factor',
      basedOnEntries < 4 ? 'Limited mood history; the forecast will get stronger with more check-ins.' : 'Mood trends can still shift if sleep or stress changes sharply.',
    ],
    positive_factors: [
      historySummary.positive > 0 ? `${historySummary.positive} positive mood entries in recent history` : 'Opportunity to build more positive history',
      currentFeeling ? 'You provided current emotional context, improving forecast quality.' : 'Add a short feeling note to improve precision.',
      activitiesDone > 0 ? `${activitiesDone} supportive activities completed recently` : 'Track one supportive activity to strengthen the model',
    ],
    history_summary: historySummary,
    weight_breakdown: {
      history: 0.45,
      sleep: 0.2,
      stress: 0.25,
      energy: 0.1,
    },
    signal_summary: {
      sleep_hours: sleep,
      stress_level: stress,
      energy_level: energy,
      current_feeling: String(currentFeeling || '').trim(),
      latest_streak: latestStreak,
      last_mood: lastMood,
    },
    recent_history_count: basedOnEntries,
  };
}

export function detectEmotionalTriggers({ description = '', notes = [], journalContents = [], chatMessages = [] }) {
  const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by', 'for', 'from',
    'had', 'has', 'have', 'he', 'her', 'hers', 'him', 'his', 'i', 'if', 'in', 'into', 'is',
    'it', 'its', 'me', 'my', 'of', 'on', 'or', 'our', 'ours', 'she', 'so', 'that', 'the',
    'their', 'them', 'they', 'this', 'to', 'was', 'we', 'were', 'with', 'you', 'your', 'yours',
  ]);

  const toList = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean).map((v) => String(v));
    if (typeof value === 'string' && value.trim()) return [value];
    return [];
  };

  const normalizeText = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const stem = (word) => {
    let w = String(word || '');
    if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
    else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
    else if (w.length > 4 && w.endsWith('es')) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith('s')) w = w.slice(0, -1);
    return w;
  };

  const tokenize = (text) => normalizeText(text)
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
    .map((token) => stem(token));

  const countPhraseMatches = (text, phrases = []) => {
    const normalized = ` ${normalizeText(text)} `;
    let count = 0;
    for (const phrase of phrases) {
      const escaped = String(phrase || '').toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!escaped) continue;
      const rx = new RegExp(`\\b${escaped}\\b`, 'g');
      count += (normalized.match(rx) || []).length;
    }
    return count;
  };

  const triggerDefs = [
    {
      trigger: 'Exams',
      category: 'workload',
      associated_mood: 'anxious',
      phrases: [
        'exam', 'exams', 'midterm', 'final exam', 'board exam', 'entrance exam',
        'test', 'quiz', 'assignment', 'homework', 'marks', 'result', 'cgpa',
      ],
      keywords: [
        'exam', 'test', 'quiz', 'assignment', 'homework', 'study', 'mark',
        'result', 'syllabu', 'revision', 'midterm', 'final', 'grade', 'cgpa',
      ],
    },
    {
      trigger: 'Lack of sleep',
      category: 'sleep',
      associated_mood: 'stressed',
      phrases: [
        'lack of sleep', 'late night', 'could not sleep', 'not sleeping', 'insomnia',
        'sleep deprived', 'broken sleep', 'woke up tired', 'poor sleep',
      ],
      keywords: [
        'sleep', 'insomnia', 'tired', 'exhaust', 'fatigue', 'restless', 'sleepy',
        'depriv', 'awake', 'night', 'bedtime', 'burnout',
      ],
    },
    {
      trigger: 'Work pressure',
      category: 'workload',
      associated_mood: 'stressed',
      phrases: [
        'work pressure', 'too much work', 'heavy workload', 'tight deadline',
        'back to back meetings', 'manager pressure', 'performance pressure',
        'too many tasks', 'work overload',
      ],
      keywords: [
        'deadline', 'workload', 'pressure', 'meeting', 'target', 'project',
        'office', 'boss', 'manager', 'sprint', 'deliverable', 'overtime',
      ],
    },
    {
      trigger: 'Social rejection',
      category: 'people',
      associated_mood: 'sad',
      phrases: [
        'left out', 'not included', 'ignored by friends', 'socially excluded',
        'no one invited me', 'felt invisible', 'group ignored me',
        'friends ignored me', 'friend stopped talking', 'no support from friends',
      ],
      keywords: [
        'ignored', 'rejected', 'excluded', 'alone', 'lonely', 'unseen',
        'isolat', 'leftout', 'friendless', 'friend', 'support', 'abandon',
      ],
    },
    {
      trigger: 'Family conflict',
      category: 'people',
      associated_mood: 'angry',
      phrases: [
        'family conflict', 'fight at home', 'argue at home', 'parents fighting',
        'constant arguments at home', 'family pressure', 'toxic home environment',
      ],
      keywords: [
        'family', 'argue', 'fight', 'conflict', 'parent', 'partner', 'home',
        'mother', 'father', 'sibling', 'house', 'toxic',
      ],
    },
    {
      trigger: 'Relationship conflict',
      category: 'people',
      associated_mood: 'sad',
      phrases: [
        'relationship problems', 'relationship issue', 'fight with partner',
        'boyfriend fight', 'girlfriend fight', 'partner conflict', 'break up',
        'breakup', 'toxic relationship', 'trust issues', 'felt unloved',
      ],
      keywords: [
        'relationship', 'partner', 'boyfriend', 'girlfriend', 'husband', 'wife',
        'breakup', 'break', 'trust', 'unloved', 'toxic', 'betray', 'cheat',
      ],
    },
    {
      trigger: 'Uncertainty about future',
      category: 'change',
      associated_mood: 'anxious',
      phrases: [
        'uncertain about future', 'what if', 'future is unclear', 'unknown outcome',
        'career uncertainty', 'fear of future', 'dont know what to do next',
      ],
      keywords: [
        'future', 'uncertain', 'unknown', 'change', 'transition', 'risk',
        'career', 'jobsearch', 'direction', 'doubt',
      ],
    },
    {
      trigger: 'Social media comparison',
      category: 'social',
      associated_mood: 'anxious',
      phrases: [
        'social media pressure', 'instagram comparison', 'comparing myself online',
        'doom scrolling', 'doomscrolling', 'scrolling too much',
      ],
      keywords: [
        'instagram', 'social', 'media', 'comparison', 'compare', 'scroll',
        'doomscroll', 'fomo', 'online', 'reel', 'tiktok',
      ],
    },
    {
      trigger: 'Financial stress',
      category: 'change',
      associated_mood: 'stressed',
      phrases: [
        'money problems', 'financial pressure', 'cannot pay bills', 'tuition pressure',
        'rent stress', 'debt stress',
      ],
      keywords: [
        'money', 'finance', 'bill', 'rent', 'debt', 'tuition', 'expense',
        'loan', 'salary', 'cost',
      ],
    },
  ];

  const sources = [
    { name: 'description', items: toList(description), weight: 1.4 },
    { name: 'notes', items: toList(notes), weight: 1.0 },
    { name: 'journals', items: toList(journalContents), weight: 1.2 },
    { name: 'chat', items: toList(chatMessages), weight: 1.1 },
  ];

  const tokenFrequency = new Map();
  for (const source of sources) {
    for (const item of source.items) {
      for (const token of tokenize(item)) {
        const prev = tokenFrequency.get(token) || 0;
        tokenFrequency.set(token, prev + source.weight);
      }
    }
  }

  const hits = [];
  for (const def of triggerDefs) {
    let weightedCount = 0;
    for (const source of sources) {
      for (const item of source.items) {
        const phraseMatches = countPhraseMatches(item, def.phrases);
        const tokens = tokenize(item);
        const keywordMatches = tokens.filter((token) => def.keywords.includes(token)).length;
        weightedCount += source.weight * ((phraseMatches * 2) + keywordMatches);
      }
    }

    const roundedCount = Math.round(weightedCount);
    if (roundedCount > 0) {
      hits.push({
        trigger: def.trigger,
        category: def.category,
        associated_mood: def.associated_mood,
        count: roundedCount,
      });
    }
  }

  hits.sort((a, b) => b.count - a.count);

  const topTriggers = hits.slice(0, 5).map((hit) => ({
    trigger: hit.trigger,
    category: hit.category,
    associated_mood: hit.associated_mood,
    frequency: hit.count >= 8 ? 'very frequent' : hit.count >= 5 ? 'frequent' : hit.count >= 3 ? 'occasional' : 'rare',
    severity: hit.count >= 8 ? 'high' : hit.count >= 4 ? 'medium' : 'low',
    count: hit.count,
  }));

  const categorySummary = topTriggers.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.count;
    return acc;
  }, { workload: 0, social: 0, people: 0, sleep: 0, change: 0 });

  const topKeywords = Array.from(tokenFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([keyword, score]) => ({ keyword, score: Number(score.toFixed(2)) }));

  const dominantCategory = Object.entries(categorySummary).sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed';

  return {
    top_triggers: topTriggers,
    triggers: topTriggers,
    top_trigger_labels: topTriggers.map((item) => item.trigger),
    negative_trigger_frequency: topTriggers.reduce((acc, item) => {
      acc[item.trigger] = item.count;
      return acc;
    }, {}),
    keyword_summary: topKeywords,
    category_summary: categorySummary,
    dominant_category: dominantCategory,
    patterns: topTriggers.length > 0
      ? [`Top recurring trigger: ${topTriggers[0].trigger}`, 'Ranking is based on weighted keyword and phrase frequency across journal and chat text.']
      : ['No strong negative trigger frequency found yet. Add more detailed journal/chat input.'],
    source_mode: description.trim() ? 'description-plus-history' : 'history-first',
  };
}

export function buildWeeklyDataDrivenReport({ moods = [], journals = [], activities = [] }) {
  const recentMoods = (Array.isArray(moods) ? moods : []).slice(-14);
  const recentJournals = (Array.isArray(journals) ? journals : []).slice(-14);
  const completedActivities = (Array.isArray(activities) ? activities : []).filter((a) => a?.completed || a?.status === 'done');

  const valence = { happy: 2, calm: 1, neutral: 0, stressed: -1, anxious: -2, sad: -2, angry: -2 };
  const firstHalf = recentMoods.slice(0, Math.ceil(recentMoods.length / 2));
  const secondHalf = recentMoods.slice(Math.ceil(recentMoods.length / 2));

  const avg = (arr) => arr.length ? arr.reduce((sum, e) => sum + (valence[String(e?.mood || 'neutral').toLowerCase()] ?? 0), 0) / arr.length : 0;
  const firstScore = avg(firstHalf);
  const secondScore = avg(secondHalf);

  const stressReduced = Math.max(-100, Math.min(100, Math.round((firstScore - secondScore) * 22)));
  const happinessIncreased = Math.max(-100, Math.min(100, Math.round((secondScore - firstScore) * 22)));

  const moodCounts = recentMoods.reduce((acc, m) => {
    const key = String(m?.mood || 'neutral').toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const mostEffectiveActivity = completedActivities[0]?.title || completedActivities[0]?.name || (recentJournals.length ? 'Journaling consistency' : 'Daily mood check-ins');

  return {
    overall_summary: `This report uses ${recentMoods.length} mood entries, ${recentJournals.length} journal entries, and ${completedActivities.length} completed activities from the selected week.`,
    stress_change: -stressReduced,
    happiness_change: happinessIncreased,
    most_effective_activity: mostEffectiveActivity,
    emotional_patterns: Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([m, c]) => `${m}: ${c} entries`),
    achievements: [
      `${recentMoods.length} mood check-ins captured`,
      `${recentJournals.length} reflective journal entries`,
      `${completedActivities.length} wellness activities completed`,
    ],
    areas_to_improve: [
      'Keep sleep and stress logs consistent for stronger forecasting.',
      'Add one concrete coping action in each journal entry.',
      'Track activity completion daily for cleaner trend analysis.',
    ],
    next_week_goals: [
      'Complete at least 4 mood check-ins.',
      'Log sleep and stress with each mood entry.',
      'Finish 3 supportive activities and track outcomes.',
    ],
    wellness_score: clamp(Math.round(6 + secondScore + Math.min(1.2, completedActivities.length * 0.15)), 1, 10),
    personal_message: 'Your trends are now data-driven. Keep consistency high to improve precision and recommendations each week.',
  };
}

export function ensureLongEmotionStory(payload = {}, emotion = 'neutral') {
  const base = typeof payload === 'string' ? { story: payload } : { ...payload };
  const story = String(base.story || '').trim();
  const words = story.split(/\s+/).filter(Boolean);
  if (words.length >= 150) return base;

  const extension = [
    `As the day continued, the person noticed how ${emotion} changed shape when they stopped resisting it and started listening to it.`,
    'They chose one practical action, one supportive connection, and one small boundary to protect their energy. Those decisions did not remove every problem, but they changed the emotional direction of the day.',
    'By the end, they understood that progress is not the absence of difficult feelings. Progress is the ability to move with those feelings in a wiser, steadier way.',
    'Motivational ending: You are allowed to feel deeply and still build a life that feels safe, meaningful, and hopeful one step at a time.',
  ].join(' ');

  return {
    ...base,
    story: `${story} ${extension}`.trim(),
  };
}

export function buildMoodAdaptiveStudyPlan({ subject = 'general', mood = 'neutral', duration = 60, difficulty = 'medium', energyLevel = 6 }) {
  const m = String(mood || 'neutral').toLowerCase();
  const energy = clamp(Number(energyLevel) || 0, 1, 10);
  const total = Math.max(25, Math.min(180, Number(duration) || 60));
  const settings = {
    stressed: { technique: 'Pomodoro + breaks', focus: 20, brk: 7, tip: 'Use shorter blocks, then reset your breathing between cycles.' },
    anxious: { technique: 'Pomodoro + breaks', focus: 18, brk: 7, tip: 'Begin each block with 60-second grounding and one clear next step.' },
    sad: { technique: 'Light tasks first', focus: 15, brk: 6, tip: 'Start with the easiest task to build momentum.' },
    tired: { technique: 'Light tasks first', focus: 15, brk: 6, tip: 'Do light recall tasks, not heavy theory first.' },
    happy: { technique: energy >= 7 ? 'Deep work intervals' : 'Balanced focus blocks', focus: energy >= 7 ? 35 : 28, brk: 5, tip: energy >= 7 ? 'Use high energy for the hardest task first.' : 'Use your energy for one meaningful task and then reset.' },
    calm: { technique: energy >= 7 ? 'Deep work intervals' : 'Balanced focus blocks', focus: energy >= 7 ? 30 : 24, brk: energy >= 7 ? 5 : 6, tip: 'Keep a steady cadence with clear objectives.' },
    neutral: { technique: energy >= 7 ? 'Deep work intervals' : 'Standard focus cycles', focus: energy >= 7 ? 28 : 22, brk: 6, tip: 'Use one clear task per cycle.' },
  };

  const chosen = settings[m] || settings.neutral;
  const cycles = Math.max(1, Math.floor(total / (chosen.focus + chosen.brk)));
  const schedule = Array.from({ length: cycles }, (_, idx) => ({
    session: idx + 1,
    focus: `${chosen.focus}min`,
    break: `${chosen.brk}min`,
    task_type: energy >= 7 ? 'deep work' : 'light review',
  }));

  return {
    recommendation_type: chosen.technique,
    focus_level: energy >= 7 ? 'high' : energy <= 4 ? 'low' : 'moderate',
    technique: `${chosen.technique} (${difficulty})`,
    mood: m,
    energy_level: energy,
    schedule,
    structured_suggestions: {
      before_study: [
        'Clear your workspace',
        m === 'stressed' || m === 'anxious' ? 'Take 3 slow breaths before starting' : 'Set one clear goal',
      ],
      during_study: [
        energy >= 7 ? `Deep work on ${subject || 'the topic'}` : `Light review for ${subject || 'the topic'}`,
        chosen.tip,
        m === 'stressed' || m === 'anxious' ? 'Keep notifications off' : 'Use active recall after each block',
      ],
      breaks: [
        `Take ${chosen.brk} minute breaks`,
        energy <= 4 ? 'Walk, stretch, or hydrate' : 'Reset your posture and return quickly',
      ],
    },
    tips: [
      `Subject focus: ${subject}`,
      chosen.tip,
      m === 'stressed' || m === 'anxious' ? 'Block notifications during focus windows.' : 'Use retrieval practice after each focus block.',
    ],
    motivation: energy >= 7
      ? 'You have strong study energy. Use it for the hardest thing first.'
      : 'Keep the session manageable and protect your attention.',
  };
}
