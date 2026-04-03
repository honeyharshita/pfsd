import Sentiment from 'sentiment';

const sentimentAnalyzer = new Sentiment();

/**
 * Advanced sentiment detection with multi-level analysis
 * Returns: { sentiment: string, score: number, confidence: number, subEmotions: array }
 */
export function advancedSentimentAnalysis(text) {
  if (!text || typeof text !== 'string') {
    return {
      sentiment: 'neutral',
      score: 0.5,
      confidence: 0,
      subEmotions: [],
      emotion_states: ['unknown']
    };
  }

  const input = text.toLowerCase();
  
  // Use sentiment library for core analysis
  const sentimentResult = sentimentAnalyzer.analyze(text);
  
  // Map sentiment score to 0-1 range
  // sentimentResult.score can range from -Infinity to +Infinity
  let normalizedScore = 0.5;
  if (sentimentResult.score > 0) {
    normalizedScore = Math.min(0.95, 0.5 + (sentimentResult.score / 10));
  } else if (sentimentResult.score < 0) {
    normalizedScore = Math.max(0.05, 0.5 + (sentimentResult.score / 10));
  }

  // Emotion detection patterns
  const emotions = {
    happiness: {
      keywords: ['happy', 'joy', 'excited', 'great', 'awesome', 'love', 'wonderful', 'fantastic', 'blessed', 'grateful', 'amazing', 'thrilled', 'delighted'],
      weight: 1.2
    },
    sadness: {
      keywords: ['sad', 'down', 'depressed', 'hopeless', 'lonely', 'miserable', 'upset', 'grief', 'heartbreak', 'devastated', 'empty', 'worthless', 'numb'],
      weight: 1.2
    },
    stress: {
      keywords: ['stressed', 'anxious', 'overwhelmed', 'panic', 'worried', 'nervous', 'tense', 'pressure', 'deadline', 'overload', 'anxious', 'frantic', 'hectic', 'crazy', 'urgent', 'rush', 'exam'],
      weight: 1.3  // Increased weight for stress
    },
    anger: {
      keywords: ['angry', 'furious', 'mad', 'frustrated', 'irritated', 'annoyed', 'enraged', 'hate', 'disgusted', 'livid', 'rage'],
      weight: 1.1
    },
    fear: {
      keywords: ['afraid', 'scared', 'terrified', 'anxious', 'dread', 'frightened', 'nervous', 'worried', 'dreading'],
      weight: 1.0
    },
    motivation: {
      keywords: ['excited', 'energized', 'motivated', 'inspired', 'determined', 'passionate', 'driven', 'focused', 'pumped', 'eager'],
      weight: 1.2
    },
    fatigue: {
      keywords: ['tired', 'exhausted', 'exhaustion', 'drained', 'fatigued', 'sleepy', 'worn out', 'weary', 'burnt out', 'burnout'],
      weight: 1.1
    },
    peace: {
      keywords: ['calm', 'peaceful', 'relaxed', 'serene', 'content', 'tranquil', 'at ease', 'mindful', 'zen', 'chill'],
      weight: 1.1
    }
  };

  // Detect present emotions
  const detectedEmotions = [];
  for (const [emotion, data] of Object.entries(emotions)) {
    let score = 0;
    for (const keyword of data.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = input.match(regex) || [];
      score += matches.length * data.weight;
    }
    if (score > 0) {
      detectedEmotions.push({ emotion, score, confidence: Math.min(1, score / 3) });
    }
  }

  // Sort by score
  detectedEmotions.sort((a, b) => b.score - a.score);
  const topEmotions = detectedEmotions.slice(0, 3).map(e => e.emotion);

  // Determine primary sentiment category
  let primarySentiment = 'neutral';
  let confidence = 0;

  if (detectedEmotions.length > 0) {
    const topEmotion = detectedEmotions[0];
    confidence = topEmotion.confidence;

    if (['happiness', 'motivation', 'peace'].includes(topEmotion.emotion)) {
      primarySentiment = 'positive';
      // Adjust score upward for positive emotions
      normalizedScore = Math.min(0.95, normalizedScore + 0.15);
    } else if (['sadness', 'anger', 'fear'].includes(topEmotion.emotion)) {
      primarySentiment = 'negative';
      // Adjust score downward for negative emotions
      normalizedScore = Math.max(0.05, normalizedScore - 0.15);
    } else if (['stress', 'fatigue'].includes(topEmotion.emotion)) {
      primarySentiment = 'stressed';
      normalizedScore = Math.max(0.1, Math.min(0.4, normalizedScore));
    }
  }

  // Check for mixed emotions
  if (detectedEmotions.length > 1) {
    const topTwoScores = detectedEmotions.slice(0, 2).map(e => e.score);
    if (topTwoScores[0] < topTwoScores[1] * 1.5) {
      primarySentiment = 'mixed';
    }
  }

  // Check for crisis indicators
  if (/suicide|kill myself|want to die|end my life|self harm|hurt myself|hopeless|no reason/.test(input)) {
    primarySentiment = 'critical';
    normalizedScore = 0.05;
    confidence = 1.0;
    topEmotions.unshift('critical');
  }

  return {
    sentiment: primarySentiment,
    score: Math.round(normalizedScore * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    emotion_states: topEmotions,
    subEmotions: detectedEmotions.slice(0, 5),
    raw_score: sentimentResult.score,
    keywords: sentimentResult.words || []
  };
}

/**
 * Extract themes from conversation history
 */
export function extractThemes(conversationHistory = []) {
  const allText = conversationHistory
    .filter(m => m && m.role === 'user' && typeof m.content === 'string')
    .map(m => m.content.toLowerCase())
    .join(' ');

  const themes = {
    anxiety: /anx|stress|panic|overwhelm|nervous|worry|pressure|deadline|exam|test/,
    depression: /sad|down|depress|hopeless|empty|numb|worthless|hollow|lonely/,
    anger: /angry|mad|frustrat|irritat|enraged|furious|mad/,
    sleep: /sleep|insomnia|tired|exhaust|sleep quality|rest|night|awake|doze|nap/,
    work: /work|job|career|deadline|project|boss|coworker|meeting|office|professional/,
    relationships: /relationship|friend|family|partner|alone|lonely|love|dating|breakup|social/,
    health: /health|sick|illness|pain|exercise|diet|fitness|workout|gym/,
    productivity: /productiv|focus|procrast|task|goal|achieve|efficient|plan|schedule/,
    learning: /learn|study|exam|skill|training|education|code|programming|school|homework/,
    spirituality: /spiritual|faith|meaning|purpose|gratitude|mindful|meditation|yoga|zen/,
    games: /play|game|challenge|puzzle|trivia|quiz|memory|breathing game|gratitude challenge/,
    entertainment: /movie|music|watch|listen|show|entertainment|fun|enjoy|relax/
  };

  const detected = [];
  for (const [theme, regex] of Object.entries(themes)) {
    if (regex.test(allText)) {
      detected.push(theme);
    }
  }

  return detected.length ? detected : ['general'];
}

/**
 * Build context from last N messages
 * Focuses on the most recent and relevant parts
 */
export function buildContextWindow(conversationHistory = [], maxMessages = 5) {
  if (!Array.isArray(conversationHistory)) {
    return {
      recent_messages: [],
      themes: [],
      sentiment_trend: 'stable',
      context_summary: ''
    };
  }

  // Get last N valid messages
  const validMessages = conversationHistory
    .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string')
    .slice(-maxMessages);

  const userMessages = validMessages
    .filter(m => m.role === 'user')
    .map(m => m.content);

  const themes = extractThemes(validMessages);

  // Detect sentiment trend
  const recentSentiments = validMessages
    .filter(m => m.sentiment_score !== null && m.sentiment_score !== undefined)
    .map(m => m.sentiment_score)
    .slice(-3);

  let sentimentTrend = 'stable';
  if (recentSentiments.length >= 2) {
    const trend = recentSentiments[recentSentiments.length - 1] - recentSentiments[0];
    if (trend > 0.2) sentimentTrend = 'improving';
    if (trend < -0.2) sentimentTrend = 'declining';
  }

  // Create summary
  const contextSummary = userMessages
    .slice(-2)
    .map((msg, idx) => `${idx + 1}. ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`)
    .join(' | ');

  return {
    recent_messages: validMessages,
    themes,
    sentiment_trend: sentimentTrend,
    context_summary: contextSummary,
    user_messages: userMessages
  };
}

/**
 * Validate response quality
 */
export function validateResponse(response) {
  if (!response || typeof response !== 'string') {
    return {
      valid: false,
      error: 'Response is empty or not a string'
    };
  }

  const wordCount = response.trim().split(/\s+/).length;
  if (wordCount < 10) {
    return {
      valid: false,
      error: 'Response too short (min 10 words)',
      wordCount
    };
  }

  if (wordCount > 2000) {
    return {
      valid: false,
      error: 'Response too long (max 2000 words)',
      wordCount
    };
  }

  return {
    valid: true,
    wordCount,
    hasQuestions: response.includes('?'),
    confidence: Math.min(1, wordCount / 150)
  };
}
