// @ts-nocheck

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
const API_BASE = `${BASE_URL}/api/ai`;
const PREDICTION_API_BASE = `${BASE_URL}/api`;

async function callAI(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  if (data !== null) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const rawText = await response.text();

  let payload = {};
  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = { text: rawText };
    }
  }

  if (!response.ok) {
    throw new Error(payload.error || payload.text || `API Error: ${response.status}`);
  }

  return payload;
}

async function callPredictionAPI(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  if (data !== null) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${PREDICTION_API_BASE}${endpoint}`, options);
  const rawText = await response.text();

  let payload = {};
  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = { text: rawText };
    }
  }

  if (!response.ok) {
    throw new Error(payload.error || payload.text || `API Error: ${response.status}`);
  }

  return payload;
}

export const aiApi = {
  cameraMood: ({ imageUrl = '', userEmail = 'anonymous', faceSignals = {}, faceExpression = '' } = {}) =>
    callAI('/camera-mood', 'POST', { imageUrl, userEmail, faceSignals, faceExpression }),
  journalAnalysis: ({ content = '', userEmail = 'anonymous', language = 'en' } = {}) =>
    callAI('/journal-analysis', 'POST', { content, userEmail, language }),
  moodForecast: ({ currentFeeling = '', sleepHours = 7, stressLevel = 5, energyLevel = 6, userEmail = 'anonymous' } = {}) =>
    callPredictionAPI('/predict-mood', 'POST', { currentFeeling, sleepHours, stressLevel, energyLevel, userEmail }),
  triggerAnalyzer: ({ description = '', notes = [], journalContents = [], moodDistribution = {}, userEmail = 'anonymous' } = {}) =>
    callAI('/trigger-analyzer', 'POST', { description, notes, journalContents, moodDistribution, userEmail }),
  weeklyReport: ({ userEmail = 'anonymous', weekStart, weekEnd, weekDescription = '' } = {}) =>
    callPredictionAPI('/weekly-report', 'POST', { userEmail, weekStart, weekEnd, weekDescription }),
  decisionHelper: (payloadOrDecision, context = '') => {
    if (typeof payloadOrDecision === 'object' && payloadOrDecision !== null) {
      return callAI('/decision-helper', 'POST', payloadOrDecision);
    }
    return callAI('/decision-helper', 'POST', { decision: payloadOrDecision || '', context });
  },
  gameTip: (game = 'breathing', mood = 'neutral') => callAI('/game-tip', 'POST', { game, mood }),
  emotionStory: (emotions = [], variationSeed = null) => callAI('/emotion-story', 'POST', { emotions, variationSeed }),
  colorTherapy: (mood = 'neutral') => callAI('/color-therapy', 'POST', { mood }),
  studyHelp: (subject = '', duration = 60, difficulty = 'medium', mood = 'neutral', energyLevel = 6) =>
    callAI('/study-help', 'POST', { subject, duration, difficulty, mood, energyLevel }),
  positivityFeed: (mood = 'neutral', count = 3) => callAI(`/positivity-feed?mood=${mood}&count=${count}`, 'GET'),
};
