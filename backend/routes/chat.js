import express from 'express';
import { getDb } from '../db.js';
import { invokeLLM, requireOpenAIKey } from '../openai.js';
import { sendAIError } from './aiError.js';
import { getChatConversation, saveChatConversation, deleteConversation, getFrequentEmotion } from '../chatDb.js';
import { advancedSentimentAnalysis, extractThemes } from '../sentimentAnalysis.js';

const router = express.Router();

const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'want to die',
  'end my life',
  'hopeless',
  'no reason to live',
  'self harm',
  'hurt myself'
];

const SYSTEM_PROMPT = [
  'You are a compassionate AI mental wellness companion.',
  '**CRITICAL RULES**:',
  '1. ALWAYS respond to the user\'s CURRENT message - this is your PRIMARY focus.',
  '2. Use past messages ONLY if they are directly relevant - do NOT repeat unrelated context.',
  '3. Do NOT say "Earlier you said X" unless it\'s very clearly relevant and helpful.',
  '4. Be emotionally intelligent, specific, and actionable.',
  '5. If the user asks for something specific (game, plan, exercise), provide it directly.',
  '6. If the user replies with a short follow-up like a number or option, interpret it as a choice from the current conversation.',
  '7. Avoid generic greetings and template responses.',
  '8. Match the user\'s emotion: if stressed, help reduce stress; if sad, show empathy.',
  'Respond in 3-6 clear sentences. Be warm but practical.'
].join(' ');

function toBaseEmotion(sentiment, emotionStates = [], content = '') {
  const lower = String(content || '').toLowerCase();
  if (/stress|stressed|stressing|anx|panic|overwhelm|pressure|deadline|exam|focus/.test(lower)) return 'stress';
  if (/sad|down|depress|hopeless|lonely|empty/.test(lower)) return 'sad';
  if (/happy|better|grateful|joy|excited|calm/.test(lower)) return 'happy';

  const primary = (emotionStates[0] || '').toLowerCase();
  if (primary.includes('stress') || sentiment === 'stressed') return 'stress';
  if (primary.includes('sad') || sentiment === 'negative') return 'sad';
  if (primary.includes('happy') || primary.includes('motivation') || sentiment === 'positive') return 'happy';
  return 'neutral';
}

function sanitizeMessages(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).trim(),
      emotion: typeof m.emotion === 'string' ? m.emotion : undefined,
      sentiment_score: typeof m.sentiment_score === 'number' ? m.sentiment_score : undefined,
      timestamp: m.timestamp || new Date().toISOString()
    }))
    .filter((m) => m.content.length > 0);
}

function mergeConversationHistory(stored = [], client = [], limit = 15) {
  const combined = [...sanitizeMessages(stored), ...sanitizeMessages(client)];
  const deduped = [];
  const seen = new Set();

  for (const item of combined) {
    const key = `${item.role}::${item.content}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return deduped.slice(-limit);
}

function inferUserProfile({ message, existingProfile = {}, themes = [] }) {
  const profile = {
    name: existingProfile?.name || null,
    common_problems: Array.isArray(existingProfile?.common_problems)
      ? [...existingProfile.common_problems]
      : []
  };

  const match = String(message || '').match(/\b(?:my name is|i am|i'm)\s+([A-Za-z]{2,20})\b/i);
  if (match && !profile.name) {
    profile.name = match[1];
  }

  const mappedProblems = {
    anxiety: 'stress',
    sleep: 'sleep',
    learning: 'exam stress',
    productivity: 'focus',
    work: 'work pressure',
    relationships: 'relationships'
  };

  for (const theme of themes) {
    const mapped = mappedProblems[theme];
    if (mapped && !profile.common_problems.includes(mapped)) {
      profile.common_problems.push(mapped);
    }
  }

  return profile;
}

function buildFallbackReply({ message, context }) {
  const safeName = (context.userName || '').trim();
  const blockedName = /^(local user|anonymous|null|undefined)$/i.test(safeName);
  const namePrefix = safeName && !blockedName ? `${safeName}, ` : '';
  const text = String(message || '').toLowerCase();
  const trimmedText = String(message || '').trim().toLowerCase();
  const isSimpleGreeting = isGreetingMessage(message) || /^(hi|hello|hey|hiya|hii|heyy|good morning|good afternoon|good evening)$/i.test(trimmedText);
  const isShortFollowUp = /^(yes|yep|yeah|sure|ok|okay|alright|do it|continue|go on|please|fine|first|second|third|1|2|3|one|two|three)$/i.test(trimmedText);
  const shouldUseContextLine = !isSimpleGreeting && !isShortFollowUp;
  const contextLine = shouldUseContextLine && context.lastRelevantUserMessage && !/^(1|2|3|yes|no|maybe|ok|okay|sure)$/i.test(String(context.lastRelevantUserMessage).trim())
    ? `You mentioned: "${context.lastRelevantUserMessage}".`
    : 'I appreciate you sharing this.';

  if (isSimpleGreeting) {
    return `${namePrefix}Hello! I’m here with you. Tell me what’s on your mind and I’ll respond to that directly.`;
  }

  const examFocus = /exam|study|focus|concentrat|revision|tomorrow|test/.test(text);
  const sleepPattern = /sleep|insomnia|night|bed|awake/.test(text);

  if (examFocus) {
    return `${namePrefix}${contextLine} Since exams and focus are the pain point, do this now: 1) pick one chapter or one question type only, 2) set a 25-minute timer and keep phone away, 3) write a 3-line summary at the end. Then take a 5-minute break and repeat once. Tell me your exact subject and I will create a 60-minute micro-plan.`;
  }

  if (sleepPattern && (context.lastEmotion === 'stress' || context.frequentEmotion === 'stress')) {
    return `${namePrefix}${contextLine} Stress + poor sleep can crush focus, so let’s reset tonight: 1) no screens for 30 minutes before bed, 2) write tomorrow’s first task on paper, 3) do 10 rounds of 4-in/6-out breathing in bed. If your mind races, I can give you a 3-minute guided wind-down script.`;
  }

  if (context.lastEmotion === 'stress' || context.frequentEmotion === 'stress') {
    return `${namePrefix}${contextLine} I hear the stress clearly. Start with one controlled move: 1) 90 seconds slow breathing, 2) choose one small task that can be finished in 15 minutes, 3) begin immediately before thinking about the rest. What is that one task?`;
  }

  if (context.lastEmotion === 'sad' || context.frequentEmotion === 'sad') {
    return `${namePrefix}${contextLine} I am with you. For the next 10 minutes: drink water, step into fresh air if possible, and write one kind sentence to yourself plus one tiny action you can finish today. If you want, I can help you choose that action now.`;
  }

  return `${namePrefix}${contextLine} Let’s make this concrete: share your biggest challenge in one sentence, and I’ll give you a specific 3-step plan you can start in the next 10 minutes.`;
}

function isGreetingMessage(message = '') {
  const text = String(message || '').trim().toLowerCase();
  if (!text) return false;
  return /^(hi|hello|hey|hiya|greetings|good (morning|afternoon|evening))(?:[!.,?\s]|$)/i.test(text);
}

function isGreetingOnlyReply(response = '') {
  const text = String(response || '').trim().toLowerCase();
  if (!text) return true;

  return [
    /^(hi|hello|hey|hiya|greetings)(?:[!.,?\s]|$)/i,
    /how can i help(?: you)?/i,
    /what can i do for you/i,
    /tell me more/i,
    /how are you feeling today/i,
    /nice to meet you/i,
    /i'?m here to help/i
  ].some((pattern) => pattern.test(text));
}

function shouldReplaceWithFallback({ message, response }) {
  if (!response || typeof response !== 'string') {
    return true;
  }

  if (isGreetingMessage(message)) {
    return false;
  }

  return isGreetingOnlyReply(response);
}

function getLastMessage(messages = [], role) {
  return [...messages].reverse().find((message) => message && message.role === role && typeof message.content === 'string') || null;
}

function looksLikeInteractiveMenu(text = '') {
  const lower = String(text || '').toLowerCase();
  return /choose one|select one|option 1|1\.|2\.|3\.|breathing game|memory challenge|gratitude prompt|which one\?|choose:/i.test(lower);
}

function detectConversationFocus(messages = []) {
  const lastAssistantMessage = getLastMessage(messages, 'assistant')?.content || '';
  const lastUserMessage = getLastMessage(messages, 'user')?.content || '';
  const combined = `${lastAssistantMessage} ${lastUserMessage}`.toLowerCase();

  if (/breathing game|memory challenge|gratitude prompt|choose one|pick one|select one/.test(combined)) {
    return 'game';
  }
  if (/study plan|study help|exam|revision|homework|assignment|learning|focus|concentration|subject|micro-plan/.test(combined)) {
    return 'study';
  }
  if (/stress|stressed|overwhelmed|anxious|panic|breathing|calm|relax|reset|wind-down/.test(combined)) {
    return 'stress';
  }
  if (/sleep|insomnia|night|bed|awake|rest|wind-down/.test(combined)) {
    return 'sleep';
  }
  if (/sad|down|lonely|depressed|empty|hopeless/.test(combined)) {
    return 'sad';
  }

  return null;
}

function buildFocusContinuationResponse(focus) {
  switch (focus) {
    case 'study':
      return {
        intent: 'STUDY_HELP_FOLLOW_UP',
        response: 'Yes. Start with one topic, study it for 25 minutes, take a 5-minute break, then test yourself with 3 quick questions. If you tell me the subject, I’ll turn it into a full plan.'
      };
    case 'stress':
      return {
        intent: 'STRESS_SUPPORT_FOLLOW_UP',
        response: 'Yes. Do 5 slow breaths now: inhale 4, hold 4, exhale 6. Then pick one tiny task you can finish in the next 10 minutes, and I’ll help you break it down.'
      };
    case 'sleep':
      return {
        intent: 'SLEEP_SUPPORT_FOLLOW_UP',
        response: 'Yes. Stop screens 30 minutes before bed, write tomorrow’s first task on paper, and do 10 slow breaths while lying down. If you want, I can give you a 3-minute wind-down routine.'
      };
    case 'sad':
      return {
        intent: 'EMOTIONAL_SUPPORT_FOLLOW_UP',
        response: 'I’m here with you. Start small: drink some water, sit somewhere quiet for one minute, and tell me the heaviest thing on your mind. I’ll respond directly to that.'
      };
    default:
      return null;
  }
}

function parseMenuChoice(text = '') {
  const lower = String(text || '').trim().toLowerCase();

  if (!lower) return null;
  if (/^(1|one|first|option one|option 1|breathing|breath|calm)$/.test(lower)) return '1';
  if (/^(2|two|second|option two|option 2|memory|remember|focus)$/.test(lower)) return '2';
  if (/^(3|three|third|option three|option 3|gratitude|thankful|thanks)$/.test(lower)) return '3';

  if (/\b(first|one|breathing)\b/.test(lower)) return '1';
  if (/\b(second|two|memory|focus)\b/.test(lower)) return '2';
  if (/\b(third|three|gratitude|thankful)\b/.test(lower)) return '3';

  return null;
}

function resolveInteractiveFollowUp(message = '', recentMessages = []) {
  const text = String(message || '').trim().toLowerCase();
  if (!text) return null;

  const focus = detectConversationFocus(recentMessages);
  const lastAssistantMessage = getLastMessage(recentMessages, 'assistant');
  const assistantText = String(lastAssistantMessage?.content || '').toLowerCase();
  const assistantStudyLike = /study plan|study help|exam|revision|homework|assignment|learning|subject|topic|focus|concentration|micro-plan/.test(assistantText);
  const assistantStressLike = /stress|stressed|overwhelmed|anxious|panic|breathing|calm|relax|reset/.test(assistantText);
  const assistantSleepLike = /sleep|insomnia|night|bed|awake|rest|wind-down/.test(assistantText);
  const assistantSadLike = /sad|lonely|down|depressed|empty|hopeless/.test(assistantText);
  const shortFollowUp = /^(yes|yep|yeah|sure|ok|okay|alright|do it|continue|go on|please|fine|first|second|third|1|2|3|one|two|three)$/i.test(text);

  if (shortFollowUp && assistantText) {
    if (assistantStudyLike) return buildFocusContinuationResponse('study');
    if (assistantStressLike) return buildFocusContinuationResponse('stress');
    if (assistantSleepLike) return buildFocusContinuationResponse('sleep');
    if (assistantSadLike) return buildFocusContinuationResponse('sad');
  }

  if (!lastAssistantMessage || !looksLikeInteractiveMenu(lastAssistantMessage.content)) {
    if (shortFollowUp && focus) {
      return buildFocusContinuationResponse(focus);
    }

    if (focus && /^(breathe|breathing|calm|relax|plan|study|sleep|reset|help me|do that)$/i.test(text)) {
      return buildFocusContinuationResponse(focus);
    }

    return null;
  }

  const isYes = /^(yes|yep|yeah|sure|ok|okay|alright|let's do it|do it|continue|go on)$/i.test(text);
  const isNo = /^(no|nope|nah|not now|stop|skip)$/i.test(text);
  const choice = parseMenuChoice(text);

  const selectionMap = {
    '1': {
      intent: 'GAME_SELECTION',
      response: 'Great choice. Let\'s do the Breathing Game. Inhale for 4, hold for 4, exhale for 6. Repeat 5 times. Tell me when you want round 2.'
    },
    '2': {
      intent: 'GAME_SELECTION',
      response: 'Great choice. Let\'s do the Memory Challenge. Look at 5 objects near you, memorize them for 20 seconds, then list them from memory. Want a harder round after this?'
    },
    '3': {
      intent: 'GAME_SELECTION',
      response: 'Great choice. Let\'s do the Gratitude Challenge. Name 3 things you\'re grateful for right now, even if they are small. If you want, I can make it more personal after that.'
    }
  };

  if (choice && selectionMap[choice]) {
    return selectionMap[choice];
  }

  if (isYes) {
    if (assistantStudyLike) {
      return buildFocusContinuationResponse('study');
    }
    if (assistantStressLike) {
      return buildFocusContinuationResponse('stress');
    }
    if (assistantSleepLike) {
      return buildFocusContinuationResponse('sleep');
    }
    if (assistantSadLike) {
      return buildFocusContinuationResponse('sad');
    }

    if (focus && ['study', 'stress', 'sleep', 'sad'].includes(focus)) {
      return buildFocusContinuationResponse(focus);
    }
    if (/breathing game|breathe|calm|breath/i.test(lastAssistantMessage.content)) {
      return selectionMap['1'];
    }
    if (/memory challenge|memory|focus/i.test(lastAssistantMessage.content)) {
      return selectionMap['2'];
    }
    if (/gratitude prompt|gratitude|thank/i.test(lastAssistantMessage.content)) {
      return selectionMap['3'];
    }
    return {
      intent: 'FOLLOW_UP_CONFIRMATION',
      response: 'Great. Tell me what you want next and I\'ll keep going with the current topic.'
    };
  }

  if (isNo) {
    return {
      intent: 'FOLLOW_UP_CONFIRMATION',
      response: 'No problem. If you want, I can switch to a different game, a study plan, or stress support.'
    };
  }

  const focusContinuation = buildFocusContinuationResponse(focus || 'game');
  if (focusContinuation && /^(yes|yep|yeah|sure|ok|okay|alright|do it|continue|go on)$/i.test(text)) {
    return focusContinuation;
  }

  if (/^(breathing|breath|calm|breathing game|memory challenge|gratitude challenge)$/i.test(text)) {
    return selectionMap['1'];
  }
  if (/^(memory|remember|focus|memory game)$/i.test(text)) {
    return selectionMap['2'];
  }
  if (/^(gratitude|thank|thanks|gratitude game|gratitude prompt)$/i.test(text)) {
    return selectionMap['3'];
  }

  return null;
}

/**
 * INTENT DETECTION: Identifies user intent BEFORE sending to LLM
 * Returns: { intent, confidence, messageToReturn? }
 * If intent is detected and messageToReturn exists, skip LLM and return directly
 */
function detectUserIntent(message = '', { lastEmotion } = {}) {
  const text = String(message || '').toLowerCase();
  
  // GAME intent
  const gamePatterns = /\b(play|game|challenge|puzzle|gratitude challenge|breathing|memory|quiz|trivia)\b/i;
  if (gamePatterns.test(text)) {
    return {
      intent: 'GAME',
      confidence: 0.95,
      messageToReturn: `Awesome! Let's play 🎮\n\nChoose one:\n1. Breathing Game - Calm your mind in 2 minutes\n2. Memory Challenge - Focus game to train attention\n3. Gratitude Prompt - Shift your perspective with one question\n\nWhich one?`
    };
  }

  // STUDY/FOCUS intent
  const studyPatterns = /\b(study|study help|focus|concentration|exam|test|revision|homework|assignment|learning|memorize|understand)\b/i;
  if (studyPatterns.test(text)) {
    return {
      intent: 'STUDY_HELP',
      confidence: 0.93,
      // Don't return early - let LLM handle this as it needs context
      messageToReturn: null
    };
  }

  // EMOTIONAL_SUPPORT intent (stress, anxiety, sadness)
  const emotionalPatterns = /\b(stressed|stressed out|overwhelmed|anxious|panic|sad|down|depressed|lonely|hurt|upset)\b/i;
  if (emotionalPatterns.test(text)) {
    // Don't return early - emotion detection will route properly
    return {
      intent: 'EMOTIONAL_SUPPORT',
      confidence: lastEmotion && (lastEmotion === 'stress' || lastEmotion === 'sad') ? 0.9 : 0.7,
      messageToReturn: null
    };
  }

  // DEFAULT: no specific intent
  return {
    intent: 'GENERAL',
    confidence: 0,
    messageToReturn: null
  };
}

/**
 * IMPROVED EMOTION ROUTING: Return context-aware response based on emotion
 */
function getEmotionBasedContext(emotion, themes, userName) {
  const nameLine = userName ? `${userName}, ` : '';
  
  if (emotion === 'stress') {
    return `${nameLine}I hear you're under pressure. Let's break this down into manageable steps.`;
  }
  if (emotion === 'sad') {
    return `${nameLine}I'm here with you. Let's find one small thing that can help right now.`;
  }
  if (emotion === 'happy') {
    return `${nameLine}That's wonderful! How can I help you build on this positive energy?`;
  }
  
  return null;
}

/**
 * CONTEXT WINDOW FIX: Only use last 5-8 recent messages (not 15)
 * Focus on recent, relevant context only
 */
function buildSmartContextWindow(storedMessages = [], clientMessages = [], currentUserMessage = '', limit = 8) {
  const combined = [...sanitizeMessages(storedMessages), ...sanitizeMessages(clientMessages)];
  
  // Deduplicate
  const deduped = [];
  const seen = new Set();
  for (const item of combined) {
    const key = `${item.role}::${item.content}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  // Take LAST 'limit' messages only (most recent context)
  const recent = deduped.slice(-limit);
  
  // Log context info
  console.log(`[CONTEXT] Using ${recent.length}/${limit} messages. Current user message: "${currentUserMessage.substring(0, 60)}..."`);
  
  return recent;
}

async function generateAssistantReply({ aiRequestPayload }) {
  const prompt = [
    'Respond using the provided AI_REQUEST_PAYLOAD JSON.',
    'Strictly follow the system prompt and conversation memory.',
    'Avoid generic advice. Personalize using prior conversation.',
    'Do not answer with a greeting unless the user message is a greeting.',
    'If the user shares any topic, respond to that topic directly.',
    'Return ONLY JSON.',
    '',
    'AI_REQUEST_PAYLOAD:',
    JSON.stringify(aiRequestPayload)
  ].join('\n');

  try {
    const result = await invokeLLM({
      prompt,
      responseJsonSchema: {
        type: 'object',
        properties: {
          response: { type: 'string' },
          detected_sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative', 'stressed', 'mixed', 'critical'] },
          sentiment_score: { type: 'number', minimum: 0, maximum: 1 },
          emotion: { type: 'string' },
          emotion_states: { type: 'array', items: { type: 'string' } },
          suggested_actions: { type: 'array', items: { type: 'string' } }
        },
        required: ['response']
      }
    });

    if (result?.response && typeof result.response === 'string') {
      return result;
    }
  } catch (error) {
    console.warn('[WARN] Structured LLM response failed, retrying as plain text:', error.message);
  }

  const latestUserMessage = aiRequestPayload?.messages?.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
  const textModePrompt = [
    'You are a compassionate mental wellness companion.',
    'Respond in plain text only. Do not output JSON, code blocks, or schemas.',
    'Be empathetic, specific, and actionable in 3-6 sentences.',
    '',
    `User message: ${latestUserMessage}`,
    `Last emotion: ${aiRequestPayload?.context?.lastEmotion || 'neutral'}`,
    `Frequent emotion: ${aiRequestPayload?.context?.frequentEmotion || 'neutral'}`,
    `Relevant themes: ${(aiRequestPayload?.context?.themes || []).join(', ') || 'general support'}`
  ].join('\n');

  const textReply = await invokeLLM({ prompt: textModePrompt });
  const response = typeof textReply?.reply === 'string' ? textReply.reply.trim() : '';
  const looksLikePayloadEcho = /^\s*\{[\s\S]*"system"[\s\S]*"messages"/i.test(response);
  if (!response) {
    return null;
  }
  if (looksLikePayloadEcho) {
    return null;
  }

  const sentiment = advancedSentimentAnalysis(response);
  const emotion = toBaseEmotion(sentiment.sentiment, sentiment.emotion_states, response);

  return {
    response,
    detected_sentiment: sentiment.sentiment,
    sentiment_score: sentiment.score,
    emotion,
    emotion_states: sentiment.emotion_states,
    suggested_actions: []
  };
}

router.post('/send', async (req, res) => {
  try {
    const {
      message,
      conversationHistory = [],
      userEmail = 'anonymous',
      userName = null,
      language = 'en'
    } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }

    console.log('\n=== CHAT REQUEST ===');
    console.log('[USER MESSAGE]:', message);

    const isCrisis = CRISIS_KEYWORDS.some((k) => message.toLowerCase().includes(k));
    const storedConversation = await getChatConversation(userEmail);
    const storedMessages = Array.isArray(storedConversation?.messages) ? storedConversation.messages : [];

    // FIX: Use smart context window (8 messages max, not 15)
    const memoryMessages = buildSmartContextWindow(storedMessages, conversationHistory, message, 8);
    const themes = extractThemes(memoryMessages);

    const followUpSelection = resolveInteractiveFollowUp(message, memoryMessages);
    if (followUpSelection) {
      console.log('[DETECTED FOLLOW-UP SELECTION]:', followUpSelection.intent);
      const responseObj = {
        success: true,
        response: followUpSelection.response,
        detected_sentiment: 'neutral',
        sentiment_score: 0.5,
        emotion: 'neutral',
        emotion_states: ['neutral'],
        intent: followUpSelection.intent,
        response_source: 'context_follow_up',
        is_direct_response: true,
        crisis: false
      };
      return res.json(responseObj);
    }

    const userSentiment = advancedSentimentAnalysis(message);
    const userEmotion = toBaseEmotion(userSentiment.sentiment, userSentiment.emotion_states, message);

    // DEBUG LOGGING
    console.log('[DETECTED EMOTION]:', userEmotion);
    console.log('[SENTIMENT]:', userSentiment.sentiment, `(score: ${userSentiment.score})`);
    console.log('[THEMES]:', themes);

    // INTENT DETECTION (TASK 2)
    const intentData = detectUserIntent(message, { lastEmotion: userEmotion });
    console.log('[DETECTED INTENT]:', intentData.intent, `(confidence: ${intentData.confidence})`);

    if (isGreetingMessage(message)) {
      return res.json({
        success: true,
        response: 'Hello! I’m here with you. Tell me what’s on your mind and I’ll respond to that directly.',
        detected_sentiment: 'neutral',
        sentiment_score: 0.5,
        emotion: 'neutral',
        emotion_states: ['neutral'],
        intent: 'GREETING',
        response_source: 'greeting_direct',
        is_direct_response: true,
        crisis: false
      });
    }

    if (intentData.intent === 'GENERAL' && message.trim().length <= 2) {
      const currentTopicHint = [...memoryMessages].reverse().find((item) => item.role === 'assistant' && typeof item.content === 'string' && item.content.trim().length > 0)?.content || '';
      if (currentTopicHint) {
        console.log('[SHORT FOLLOW-UP] Treating short message as a choice or continuation of the current topic');
      }
    }

    // If intent has early return message (like GAME), return immediately
    if (intentData.messageToReturn) {
      console.log('[INTENT MATCHED] Returning direct response for:', intentData.intent);
      const response_obj = {
        success: true,
        response: intentData.messageToReturn,
        detected_sentiment: userEmotion === 'happy' ? 'positive' : 'neutral',
        emotion: userEmotion,
        emotion_states: [userEmotion],
        intent: intentData.intent,
        response_source: 'intent_based',
        is_direct_response: true,
        crisis: isCrisis
      };
      return res.json(response_obj);
    }

    const userMessage = {
      role: 'user',
      content: message.trim(),
      emotion: userEmotion,
      sentiment_score: userSentiment.score,
      emotion_states: userSentiment.emotion_states,
      timestamp: new Date().toISOString()
    };

    const workingHistory = [...memoryMessages, userMessage].slice(-8);
    const frequentEmotion = getFrequentEmotion(workingHistory.filter((m) => m.role === 'user'));
    const lastEmotion = userEmotion;
    const inferredProfile = inferUserProfile({
      message,
      existingProfile: storedConversation?.user_profile,
      themes
    });

    if (!inferredProfile.name && typeof userName === 'string' && userName.trim()) {
      inferredProfile.name = userName.trim();
    }

    // IMPORTANT: Only get last relevant user message (not old unrelated ones)
    const lastRelevantUserMessage = [...workingHistory]
      .reverse()
      .find((m) => m.role === 'user' && m.content !== message)?.content || null;

    const aiRequestPayload = {
      system: SYSTEM_PROMPT,
      messages: workingHistory.map((m) => ({ role: m.role, content: m.content })),
      context: {
        lastEmotion,
        frequentEmotion,
        userName: inferredProfile.name || null,
        commonProblems: inferredProfile.common_problems || [],
        language,
        themes,
        lastRelevantUserMessage,
        intent: intentData.intent,
        responseRules: [
          'Focus on the CURRENT user message above all else.',
          'Only refer to past messages if very relevant.',
          'Avoid repeating context unnecessarily.',
          'Provide actionable suggestions.',
          'Keep a conversational and empathetic tone.'
        ]
      }
    };

    console.log('[PAYLOAD SENT TO LLM] Messages count:', workingHistory.length, 'Intent:', intentData.intent);

    let llmReply = null;
    let responseSource = 'fallback';

    try {
      llmReply = await generateAssistantReply({ aiRequestPayload });
      if (llmReply) {
        responseSource = 'llm';
      }
    } catch (error) {
      console.warn('[WARN] LLM generation failed:', error.message);
    }

    const fallbackContext = {
      userName: inferredProfile.name || null,
      lastEmotion,
      frequentEmotion,
      lastRelevantUserMessage
    };

    const llmResponseText = typeof llmReply?.response === 'string' ? llmReply.response.trim() : '';
    const useFallbackReply = shouldReplaceWithFallback({ message, response: llmResponseText });
    
    // TASK 5: Check for generic responses and prevent them
    if (llmResponseText && !useFallbackReply) {
      const isGeneric = /^(hi|hello|hey|tell me more|how are you|what can i|how can i)/.test(llmResponseText.toLowerCase());
      const isTooShort = llmResponseText.length < 15;
      
      if (isGeneric || isTooShort) {
        console.log('[GENERIC RESPONSE DETECTED] Replacing with fallback');
        useFallbackReply = true;
      }
    }

    const assistantResponseText = useFallbackReply
      ? buildFallbackReply({ message, context: fallbackContext })
      : llmResponseText;

    if (useFallbackReply) {
      responseSource = 'fallback';
      llmReply = null;
      console.log('[FALLBACK USED] Generic LLM response replaced');
    }

    const assistantSentiment = llmReply?.detected_sentiment || userSentiment.sentiment || 'neutral';
    const assistantEmotion = llmReply?.emotion || toBaseEmotion(assistantSentiment, llmReply?.emotion_states || [], assistantResponseText);

    const assistantMessage = {
      role: 'assistant',
      content: assistantResponseText,
      emotion: assistantEmotion,
      sentiment_score: typeof llmReply?.sentiment_score === 'number' ? llmReply.sentiment_score : userSentiment.score,
      emotion_states: llmReply?.emotion_states || [assistantEmotion],
      timestamp: new Date().toISOString()
    };

    console.log('[RESPONSE GENERATED]', `(${responseSource})`, assistantResponseText.substring(0, 80) + '...');

    const updatedMessages = [...workingHistory, assistantMessage].slice(-200);

    await saveChatConversation(userEmail, updatedMessages, {
      context_summary: themes.join(', '),
      detected_themes: themes,
      emotional_profile: {
        last_emotion: lastEmotion,
        frequent_emotion: frequentEmotion
      },
      user_profile: inferredProfile,
      memory_window_size: 8,
      is_crisis: isCrisis
    });

    if (isCrisis) {
      const db = getDb();
      await db.create('CrisisAlert', {
        user_email: userEmail,
        trigger_message: message,
        severity: 'critical',
        status: 'new'
      });
    }

    console.log('=== CHAT RESPONSE COMPLETE ===\n');

    return res.json({
      success: true,
      response: assistantResponseText,
      detected_sentiment: assistantSentiment,
      sentiment_score: assistantMessage.sentiment_score,
      emotion: assistantEmotion,
      emotion_states: assistantMessage.emotion_states,
      suggested_actions: llmReply?.suggested_actions || [],
      context: {
        lastEmotion,
        frequentEmotion,
        userName: inferredProfile.name || null,
        commonProblems: inferredProfile.common_problems || []
      },
      memory_messages_used: workingHistory.length,
      response_source: responseSource,
      intent: intentData.intent,
      crisis: isCrisis
    });
  } catch (error) {
    console.error('[ERR] /api/chat/send', error.message);
    return sendAIError(res, error, 'chat.send');
  }
});

router.post('/analyze-photo', async (req, res) => {
  try {
    const { imageUrl } = req.body || {};
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'imageUrl is required' });
    }

    requireOpenAIKey();
    const reply = await invokeLLM({
      prompt: 'Analyze emotional tone from the image and return JSON: { detected_mood, brief_observation }',
      responseJsonSchema: {
        type: 'object',
        properties: {
          detected_mood: { type: 'string' },
          brief_observation: { type: 'string' }
        },
        required: ['detected_mood', 'brief_observation']
      },
      fileUrls: [imageUrl]
    });

    return res.json({ success: true, ...reply });
  } catch (error) {
    return sendAIError(res, error, 'chat.analyze-photo');
  }
});

router.get('/history/:userEmail', async (req, res) => {
  try {
    const { userEmail = 'anonymous' } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const conversation = await getChatConversation(userEmail);

    if (!conversation) {
      return res.json({ success: true, messages: [], total_messages: 0 });
    }

    const messages = (conversation.messages || []).slice(-limit);
    return res.json({
      success: true,
      messages,
      total_messages: conversation.messages?.length || 0,
      detected_themes: conversation.detected_themes || [],
      emotional_profile: conversation.emotional_profile || null,
      user_profile: conversation.user_profile || null,
      memory_window_size: conversation.memory_window_size || 15,
      last_updated: conversation.updated_at || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/:userEmail', async (req, res) => {
  try {
    const { userEmail = 'anonymous' } = req.params;
    const conversation = await getChatConversation(userEmail);
    const messages = conversation?.messages || [];

    const total = messages.length;
    const byRole = {
      user: messages.filter((m) => m.role === 'user').length,
      assistant: messages.filter((m) => m.role === 'assistant').length
    };

    const emotionCounts = new Map();
    for (const msg of messages) {
      const e = msg.emotion || 'neutral';
      emotionCounts.set(e, (emotionCounts.get(e) || 0) + 1);
    }

    const topEmotions = Array.from(emotionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));

    return res.json({
      success: true,
      analytics: {
        total_messages: total,
        user_messages: byRole.user,
        assistant_messages: byRole.assistant,
        top_emotions: topEmotions,
        detected_themes: conversation?.detected_themes || [],
        emotional_profile: conversation?.emotional_profile || null,
        user_profile: conversation?.user_profile || null
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/clear/:userEmail', async (req, res) => {
  try {
    const { userEmail = 'anonymous' } = req.params;
    await deleteConversation(userEmail);
    return res.json({ success: true, message: 'Conversation cleared successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
