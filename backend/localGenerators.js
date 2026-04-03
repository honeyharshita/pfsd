/**
 * Enhanced Local AI Generators - Used when Gemini API is unavailable
 * These generate context-aware responses based on mood data and rules
 */

function hashText(input = '') {
  const text = String(input || '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hasFaceSignalInput(faceSignals = {}) {
  const expression = String(faceSignals.faceExpression || faceSignals.expression || '').trim();
  if (expression) return true;

  const numericKeys = [
    'smileScore', 'smile', 'neutralScore', 'neutral', 'frownScore', 'frown',
    'stressSignal', 'browTension', 'fatigueSignal', 'eyeStrain', 'detectionConfidence', 'faceConfidence',
  ];

  return numericKeys.some((key) => Number.isFinite(Number(faceSignals[key])) && Number(faceSignals[key]) > 0);
}

function normalizeFaceExpression(faceSignals = {}) {
  const expression = String(faceSignals.faceExpression || faceSignals.expression || '').toLowerCase().trim();
  if (/(cry|crying|tear|tears|sob|sobbing)/.test(expression)) {
    return 'frown';
  }
  if (expression === 'smile' || expression === 'neutral' || expression === 'frown') {
    return expression;
  }

  const smileScore = Number(faceSignals.smileScore || faceSignals.smile || 0);
  const neutralScore = Number(faceSignals.neutralScore || faceSignals.neutral || 0);
  const frownScore = Number(faceSignals.frownScore || faceSignals.frown || 0);

  if (smileScore >= Math.max(neutralScore, frownScore) && smileScore >= 0.45) return 'smile';
  if (frownScore >= Math.max(smileScore, neutralScore) && frownScore >= 0.4) return 'frown';
  if (neutralScore >= 0.45) return 'neutral';
  return '';
}

function mapFaceExpressionToMood(faceSignals = {}) {
  const expression = normalizeFaceExpression(faceSignals);
  if (!expression) {
    return {
      face_expression: '',
      detected_mood: null,
      mood_confidence: null,
      confidence: null,
      mapping_reason: '',
    };
  }
  const stressSignal = clamp(Number(faceSignals.stressSignal || faceSignals.browTension || 0), 0, 1);
  const fatigueSignal = clamp(Number(faceSignals.fatigueSignal || faceSignals.eyeStrain || 0), 0, 1);
  const confidenceInput = clamp(Number(faceSignals.detectionConfidence || faceSignals.faceConfidence || 0), 0, 1);

  if (expression === 'smile') {
    const confidence = clamp(Math.round((0.74 + confidenceInput * 0.2) * 100), 65, 96);
    return {
      face_expression: 'smile',
      detected_mood: 'happy',
      mood_confidence: confidence,
      confidence: Number((confidence / 100).toFixed(2)),
      mapping_reason: 'Mapped expression smile -> happy',
    };
  }

  if (expression === 'neutral') {
    const confidence = clamp(Math.round((0.7 + confidenceInput * 0.18) * 100), 62, 94);
    return {
      face_expression: 'neutral',
      detected_mood: 'calm',
      mood_confidence: confidence,
      confidence: Number((confidence / 100).toFixed(2)),
      mapping_reason: 'Mapped expression neutral -> calm',
    };
  }

  const isStress = (stressSignal + fatigueSignal) / 2 >= 0.55;
  const mappedMood = isStress ? 'stressed' : 'sad';
  const confidence = clamp(Math.round((0.69 + confidenceInput * 0.2 + (isStress ? 0.06 : 0)) * 100), 61, 95);
  return {
    face_expression: 'frown',
    detected_mood: mappedMood,
    mood_confidence: confidence,
    confidence: Number((confidence / 100).toFixed(2)),
    mapping_reason: isStress
      ? 'Mapped expression frown -> stressed (high stress/fatigue signal)'
      : 'Mapped expression frown -> sad (lower stress/fatigue signal)',
  };
}

export function generateCameraMoodAnalysis(imageOrMessage = '', faceSignals = {}) {
  const input = String(imageOrMessage || '');
  const lower = input.toLowerCase();
  const hash = hashText(input);

  const moodProfiles = {
    happy: {
      color_analysis: 'Brighter tones and open color balance suggest uplifted emotional energy.',
      atmosphere: 'The frame feels light and expressive with an optimistic tone.',
      emotional_story: 'Your expression suggests moments of relief or joy, as if you are reconnecting with what feels good right now.',
      reflection: 'What helped you feel this lighter shift today?',
      suggested_activity: 'Capture three good moments from today in a gratitude note.',
      brief_observation: 'This image carries a positive and emotionally open tone.'
    },
    calm: {
      color_analysis: 'Soft, balanced tones suggest emotional steadiness and self-regulation.',
      atmosphere: 'The atmosphere feels grounded and composed.',
      emotional_story: 'You appear present and emotionally stable, with a gentle, centered energy.',
      reflection: 'What helps you protect this calm during stressful moments?',
      suggested_activity: 'Do a 5-minute breathing reset to preserve your calm.',
      brief_observation: 'This photo reflects a calm and centered mood.'
    },
    sad: {
      color_analysis: 'Lower visual energy and muted tones can reflect emotional heaviness.',
      atmosphere: 'The image feels quieter and more inward-looking.',
      emotional_story: 'Your expression suggests emotional weight, possibly needing more rest, support, or validation.',
      reflection: 'What would feel like genuine emotional support today?',
      suggested_activity: 'Write one honest paragraph about what feels heavy, then one supportive reply to yourself.',
      brief_observation: 'The mood appears subdued with signs of emotional heaviness.'
    },
    stressed: {
      color_analysis: 'Tighter visual tension and uneven balance may reflect cognitive load.',
      atmosphere: 'The atmosphere feels busy or pressure-filled.',
      emotional_story: 'Your face suggests active mental load, like you are carrying too many concerns at once.',
      reflection: 'Which one task can you remove or delay to reduce pressure now?',
      suggested_activity: 'Try a 2-minute box breathing cycle before your next task.',
      brief_observation: 'There are signs of pressure and emotional fatigue in this frame.'
    },
    anxious: {
      color_analysis: 'Subtle visual tension and intensity cues suggest a vigilant emotional state.',
      atmosphere: 'The frame feels alert and uncertain.',
      emotional_story: 'You appear emotionally alert, possibly anticipating outcomes before they happen.',
      reflection: 'What small grounding action would help your body feel safer right now?',
      suggested_activity: 'Use the 5-4-3-2-1 grounding method to settle your nervous system.',
      brief_observation: 'This image suggests heightened alertness and anxious energy.'
    },
    angry: {
      color_analysis: 'Stronger contrast and intensity can align with activated emotional boundaries.',
      atmosphere: 'The atmosphere feels charged and forceful.',
      emotional_story: 'Your expression suggests frustration or anger, often linked to a need that has not been respected yet.',
      reflection: 'What boundary needs to be voiced clearly and calmly?',
      suggested_activity: 'Take a brisk 5-minute walk, then write one calm boundary statement.',
      brief_observation: 'The frame shows signs of high emotional activation.'
    },
    neutral: {
      color_analysis: 'Moderate visual balance suggests an emotionally mixed or neutral baseline.',
      atmosphere: 'The atmosphere is steady without strong emotional extremes.',
      emotional_story: 'You appear reflective and balanced, which can be a useful reset point.',
      reflection: 'What emotion is most subtle right now, but still important?',
      suggested_activity: 'Do a short mood check-in and name one need for the next hour.',
      brief_observation: 'This image reflects a neutral, reflective state.'
    }
  };

  const explicitRules = [
    { pattern: /smile|laugh|joy|happy|excited|positive/, mood: 'happy' },
    { pattern: /neutral|calm face|relaxed face/, mood: 'calm' },
    { pattern: /frown|furrow|tight jaw/, mood: 'stressed' },
    { pattern: /calm|peace|relaxed|serene/, mood: 'calm' },
    { pattern: /sad|down|upset|cry|crying|tear|tears|sob|sobbing/, mood: 'sad' },
    { pattern: /stress|stressed|pressure|overwhelm|tired/, mood: 'stressed' },
    { pattern: /anxious|anxiety|worried|panic|nervous/, mood: 'anxious' },
    { pattern: /angry|mad|frustrated|irritated/, mood: 'angry' },
  ];

  const hasFaceSignals = hasFaceSignalInput(faceSignals);
  const faceMapping = hasFaceSignals ? mapFaceExpressionToMood(faceSignals) : {
    face_expression: '',
    detected_mood: null,
    mood_confidence: null,
    confidence: null,
    mapping_reason: '',
  };
  let detectedMood = faceMapping.detected_mood || null;
  for (const rule of explicitRules) {
    if (!detectedMood && rule.pattern.test(lower)) {
      detectedMood = rule.mood;
      break;
    }
  }

  if (!detectedMood) {
    const pool = ['happy', 'calm', 'sad', 'stressed', 'anxious', 'angry', 'neutral'];
    detectedMood = pool[hash % pool.length];
  }

  const profile = moodProfiles[detectedMood] || moodProfiles.neutral;
  const confidence = faceMapping.mood_confidence
    ? clamp(faceMapping.mood_confidence, 58, 97)
    : clamp(62 + (hash % 29), 58, 94);

  return {
    detected_mood: detectedMood,
    face_expression: faceMapping.face_expression || 'unknown',
    mapping_reason: faceMapping.mapping_reason || 'Mapped with keyword and visual fallback rules.',
    mood_confidence: confidence,
    confidence: Number((confidence / 100).toFixed(2)),
    color_analysis: profile.color_analysis,
    atmosphere: profile.atmosphere,
    emotional_story: profile.emotional_story,
    reflection: profile.reflection,
    suggested_activity: profile.suggested_activity,
    brief_observation: profile.brief_observation,
  };
}

export function generateMoodForecast(moodHistory = []) {
  const recent = moodHistory.slice(-7) || [];
  
  if (recent.length === 0) {
    return {
      trend: 'insufficient_data',
      prediction: 'Log more moods to see trends and forecasts.',
      recommendations: [
        'Track your mood daily for 1-2 weeks',
        'Note what affects your mood most',
        'Use patterns to predict peaks and valleys'
      ],
      confidence: 0.2
    };
  }

  const avgIntensity = recent.reduce((sum, m) => sum + (m.intensity || 5), 0) / recent.length;
  const trend = avgIntensity > 6.5 ? 'improving' : avgIntensity > 4 ? 'stable' : 'declining';

  return {
    trend,
    prediction: `Based on your last ${recent.length} weeks, your mood is trending ${trend}. Continue monitoring patterns.`,
    recommendations: [
      'Identify your triggers (what lifts or lowers your mood)',
      'Schedule preventive self-care on predicted low days',
      'Celebrate improvements with your support system'
    ],
    confidence: Math.min(0.95, 0.5 + recent.length * 0.06)
  };
}

export function generateTriggerAnalysis(journalEntries = []) {
  if (!journalEntries || journalEntries.length < 2) {
    return {
      triggers: [],
      patterns: [],
      coping_strategies: [
        'Keep a weekly trigger journal',
        'Note time, situation, emotion, and intensity for each entry',
        'Look for patterns after 2-3 weeks of consistent tracking'
      ]
    };
  }

  const keywords = {
    stress_triggers: ['deadline', 'work', 'pressure', 'overwhelm', 'conflict'],
    joy_triggers: ['friend', 'family', 'laugh', 'success', 'accomplish'],
    anxiety_triggers: ['change', 'uncertain', 'future', 'unknown', 'new'],
    sadness_triggers: ['loss', 'alone', 'reject', 'fail', 'disappoint']
  };

  const content = journalEntries.map(e => (e.content || '').toLowerCase()).join(' ');
  const triggers = [];

  for (const [category, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (content.includes(word)) {
        triggers.push({ category: category.replace('_', ' '), trigger: word });
        break;
      }
    }
  }

  return {
    triggers: triggers.slice(0, 5),
    patterns: [
      `${triggers.length}+ emotional themes identified`,
      'Review your entries to spot patterns',
      'Notice timing and contexts'
    ],
    coping_strategies: [
      'Box breathing: 4-in, 4-hold, 4-out, 4-hold (2 min)',
      'Name the emotion: Labeling reduces intensity',
      'Physical movement: Short walk, stretching, or dancing',
      'Connect: Call a friend or text your support group',
      'Creative outlet: Write, draw, or play music'
    ]
  };
}

export function generateWeeklyReport(moodHistory = [], journalEntries = []) {
  const recent = moodHistory.slice(-7) || [];
  const avgMood = recent.length > 0
    ? (recent.reduce((sum, m) => sum + (m.intensity || 5), 0) / recent.length).toFixed(1)
    : 'N/A';

  return {
    week_summary: {
      days_tracked: recent.length,
      average_mood_intensity: avgMood,
      highest_mood: recent.length > 0 ? Math.max(...recent.map(m => m.intensity || 5)) : 'N/A',
      lowest_mood: recent.length > 0 ? Math.min(...recent.map(m => m.intensity || 5)) : 'N/A'
    },
    emotional_themes: journalEntries.slice(-14).map(e => e.note || '').filter(Boolean).slice(0, 3),
    wins_this_week: [
      'Completed mood tracking',
      'Reflected in journal',
      'Used coping strategies',
      'Practiced self-compassion'
    ],
    recommendations: [
      'Continue daily mood tracking for patterns',
      'Dedicate 10 min daily to reflection',
      'Schedule one joy activity this week',
      'Try one new stress management technique'
    ],
    html: `
      <div style="font-family: Arial; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
        <h1>Your Weekly Wellness Report</h1>
        <p>You tracked <strong>${recent.length}</strong> days this week. Great consistency!</p>
        <p>Average mood intensity: <strong>${avgMood}/10</strong></p>
        <h3>This Week's Highlights</h3>
        <ul>
          ${['Consistent tracking', 'Self-reflection', 'Mindfulness practice'].map(h => `<li>${h}</li>`).join('')}
        </ul>
        <h3>Next Steps</h3>
        <ul>
          ${['Set one wellness goal', 'Schedule self-care time', 'Share your progress'].map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
    `
  };
}

export function generateDecisionAnalysis(decision = '', context = '') {
  const words = `${decision} ${context}`.toLowerCase().split(/\s+/);
  const hasRisk = /risk|danger|hard|difficult|worry/.test(words.join(' '));
  const hasUrgency = /now|soon|today|asap|quick/.test(words.join(' '));

  return {
    decision_summary: decision || 'No decision provided',
    pros: [
      'Opportunity for growth',
      'Chance to learn something new',
      'Builds confidence',
      'Moves you forward'
    ],
    cons: [
      hasRisk ? 'Potential unfamiliar territory' : 'May require preparation',
      'Change takes energy',
      'Unknown outcomes',
      'Stepping outside comfort zone'
    ],
    recommendation: hasUrgency
      ? 'Take time to think it through, but don\'t overthink. Set a decision deadline.'
      : 'Sleep on it. Your intuition often knows the answer.',
    next_steps: [
      'List 3 best possible outcomes',
      'List 3 worst possible outcomes',
      'Rate your readiness 1-10',
      'Ask a trusted person their perspective',
      'Trust your gut feeling'
    ]
  };
}

export function generateGameTip(game = 'breathing', mood = 'neutral') {
  const tips = {
    breathing: {
      neutral: 'Try the 4-7-8 technique: Breathe in for 4, hold for 7, exhale for 8. Repeat 4 times.',
      stressed: 'Box breathing calms your nervous system: 4 counts in, hold 4, out 4, hold 4. Try 5 rounds.',
      happy: 'Extend your exhales longer than inhales – it signals safety to your body!'
    },
    emotion_match: {
      neutral: 'Match colors to emotions. What color feels most like you right now?',
      stressed: 'Red for intensity, blue for calm, green for balance. Find your color.',
      happy: 'Yellow for joy, orange for warmth – let the colors lift your spirit!'
    },
    stress_buster: {
      neutral: 'Take 2 minutes to do 20 jumping jacks or dance to your favorite song.',
      stressed: 'Quick reset: cold water on face, shake your body, or power pose for 2 min.',
      happy: 'Celebrate! Do a victory dance or share your energy with someone.'
    }
  };

  return tips[game]?.[mood] || tips[game]?.neutral || 'You\'ve got this! Small steps lead to big changes.';
}

function seedFromValue(input) {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.abs(Math.floor(input));
  }
  const text = String(input || Date.now());
  return text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function generateEmotionStory(emotions = [], variationSeed = null) {
  const emotionList = Array.isArray(emotions) ? emotions : [emotions];
  const primaryEmotion = emotionList[0] || 'neutral';
  const moodStack = emotionList.join(', ');
  const seed = seedFromValue(variationSeed);

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

  const enforceStoryLength = (text, emotion) => {
    const current = String(text || '').trim();
    const countWords = (value) => String(value || '').split(/\s+/).filter(Boolean).length;
    let result = current;

    const enrichByMood = {
      sad: [
        'They let themselves grieve without apologizing for it. Instead of calling themselves weak, they treated their sadness as information about what mattered to them.',
        'They reached out to one trusted person and sent a simple message: I do not need answers, I just need company. That small act interrupted the isolation.',
      ],
      stressed: [
        'They took out a notebook and separated everything into three columns: now, later, and not mine. The page did not erase pressure, but it made decisions visible.',
        'With each item they postponed or removed, their breathing steadied. Productivity stopped being panic and started becoming focused movement.',
      ],
      anxious: [
        'They named five things they could see, four they could touch, three they could hear, two they could smell, and one they could taste. Their body received the signal that this moment was survivable.',
        'The fear did not vanish instantly, but it lost authority. They remembered that anxious thoughts can be loud without being true.',
      ],
      angry: [
        'They wrote one sentence that named the boundary clearly, without blaming language, and practiced saying it out loud until it sounded steady.',
        'Their anger stopped feeling like chaos and started feeling like guidance. It pointed directly toward what needed to change.',
      ],
      happy: [
        'They paused to store the moment intentionally: one deep breath, one photo, one line in a journal. Joy became memory instead of blur.',
        'They also chose one way to extend this energy into tomorrow, proving that happiness can be both felt and sustained with care.',
      ],
      calm: [
        'They protected their calm with simple structure: fewer notifications, a short walk, and one meaningful task done at an unhurried pace.',
        'That steadiness reminded them that peace is not passive. It is an active choice repeated in ordinary moments.',
      ],
      neutral: [
        'In this balanced state, they noticed patterns they usually missed during emotional highs and lows. Clarity made planning easier.',
        'They chose one realistic intention for tomorrow and ended the day with direction instead of pressure.',
      ],
    };

    const expansion = enrichByMood[emotion] || enrichByMood.neutral;
    let index = 0;
    while (countWords(result) < 150 && index < expansion.length) {
      result = `${result}\n\n${expansion[index]}`.trim();
      index += 1;
    }

    if (countWords(result) < 150) {
      result = `${result}\n\nMotivational ending: One intentional step is enough to change direction. Keep moving with self-respect, and your next chapter will be stronger than your last.`.trim();
    }

    const words = result.split(/\s+/).filter(Boolean);
    if (words.length > 250) {
      result = `${words.slice(0, 250).join(' ')}...`;
    }

    return result;
  };

  const storyFrames = [
    {
      title: 'The Quiet Turn',
      setting: 'a train platform at dusk',
      character: 'someone carrying too much in silence',
      turningPoint: 'they chose to name the feeling instead of hiding it',
      takeaway: 'naming the feeling is often the first act of healing',
      emotionalArc: {
        sad: 'The weight they carried was invisible to others, but in their chest it was heavy and real. They felt the ache of something missing, something that should have been different. But standing there, watching the last train of the evening approach, they realized: this ache means you loved, that you wanted more, that you care deeply. That is not weakness—that is the proof of a heart that feels.',
        stressed: 'The pressure built like steam in a closed room, and their shoulders hunched higher with each passing minute. They kept running through the list of things that had to be done, should be done, might fail if not done. But then, in the noise of the platform, they heard something quieter: What if I chose just one thing to focus on? What if the rest could wait? That single question shifted everything.',
        anxious: 'Their mind raced ahead to a hundred what-ifs, each one more vivid than the last. The future felt unsafe, unpredictable, dangerous. But waiting for that train, feeling the ground beneath their feet, they grounded their attention in what was actually true right now: they were standing, breathing, alive. The danger was in their mind, not in this moment. And this moment was safe.',
        angry: 'Heat rose in their chest—the heat of boundary crossed, of respect denied, of words they had held back for too long. They stood at that platform feeling the power of their anger, and for the first time, they did not push it down. Instead, they asked: What do I need to protect? What is worth saying calmly and firmly? Their anger became clarity.',
        happy: 'The lightness in their step mirrored the lightness in their heart. They felt the warmth of possibility, the lift of knowing things were going well. But more than that, they noticed they were noticing—grateful for the small moment of peace, for the approaching light of the train. Happiness deepened when they stopped trying to hold it and started savoring it.',
        calm: 'The evening air felt steady, the platform quiet. After weeks of noise and pressure, this stillness was a gift they were finally letting themselves receive. They stood peacefully, not trying to solve anything, not pushing into the next task. Just present, just breathing, just allowing themselves to be still.',
        neutral: 'They stood at the platform in that familiar middle ground—not high, not low, just steady. This was the useful space where they could notice what mattered without the loud noise of extreme emotion. The evening stretched ahead, neither promised nor threatened. It was simply the next moment, waiting for them to step into it.',
      }
    },
    {
      title: 'Small Light, Same Room',
      setting: 'a dim bedroom with one warm lamp',
      character: 'a person who felt stuck and unseen',
      turningPoint: 'they made one tiny change and noticed the room felt different',
      takeaway: 'small steps can shift the whole emotional weather',
      emotionalArc: {
        sad: 'The wall of the dark room felt like it was pressing in. They wanted to cry but felt too tired even for that. The heaviness made everything seem pointless—why move, why change anything? But then they noticed the lamp in the corner, still off. With effort that felt huge, they reached over and turned it on. Soft light filled the room. It did not make the sadness go away, but it made the room feel less like a tomb and more like a space where healing could happen.',
        stressed: 'Everything on the nightstand looked like a task waiting to happen. The phone with messages they had not answered, the laptop with emails unread, the journal with thoughts they had not processed. The overwhelm was total. But they picked up the phone and did one single thing: turned off notifications. That simple act—removing one source of noise—let them breathe. And in that breath, they realized: I do not have to fix everything tonight. One thing at a time.',
        anxious: 'Their heart was racing with a low hum of dread, even in the quiet room. Every small sound felt charged with potential danger. Their body was braced, scanning, waiting. They needed grounding. They turned on the warm lamp, and the soft light helped anchor them to the present moment. They pressed their feet into the ground, felt the bed beneath them, and whispered: I am safe. This room is safe. I can breathe.',
        angry: 'They threw themselves onto the bed, still hot with frustration. The unfairness of it burned. How many times did they have to accept less than they deserved? But in the darkness, they turned on the lamp and sat up. In that small pool of warm light, they let themselves feel the anger fully—not to explode, but to understand it. What line got crossed? What do I need? By the end of sitting there, the heat had transformed into something clearer: determination.',
        happy: 'The room was already a good space, but when they turned on the warm lamp, it became radiant. They smiled at how a single light changed everything. They sat reflecting on the day, on what had gone right, and noticed: small choices compound. This lamp, this moment of happiness—these were choices they could make again tomorrow. And the feeling deepened.',
        calm: 'They had been seeking calm for days, and finally in this room, under the warm lamp, they found the edge of it. They did not force or try. They simply sat, let their shoulders drop, and let the quiet room teach them what steadiness felt like. One small change—turning on the light instead of sitting in darkness—was enough to find the entry point to peace.',
        neutral: 'In the neutral space of the room, under the lamp, they could think clearly. No emotion was pushing them too hard in any direction. This was the useful ground where they could notice: what small shift would help tomorrow? What matters most? The lamp illuminated not just the room, but the path forward.',
      }
    },
    {
      title: 'The Bridge Home',
      setting: 'a long walk across a windy bridge',
      character: 'someone balancing fear and hope at the same time',
      turningPoint: 'they realized both feelings could exist without canceling each other',
      takeaway: 'mixed emotions still point toward a real next step',
      emotionalArc: {
        sad: 'Walking this bridge felt like carrying the weight of something that ended, something they loved and had to let go. Each step was bittersweet—forward, but away from what was familiar. The sadness was real and deep. But halfway across, looking down at the water, they understood: moving forward does not mean stopping honoring what meant something. They could grieve and still walk. They could miss and still keep going.',
        stressed: 'The bridge was long, and their mind kept racing ahead to everything waiting on the other side. The pressure sat on their shoulders. But with each step, they made a deal with themselves: focus on this bridge. Not the pile of things to do, not the worried thoughts about tomorrow. Just: left foot, right foot, the wind, the view. By the middle of the bridge, their body had settled. The pressure was still there, but they had found a way to move through it.',
        anxious: 'Every board of the bridge felt slightly unsafe, and the wind felt like a threat. They wanted to turn back, to return to what felt known. But they also knew: fear lies about what is actually dangerous. They kept walking, slowly, and noticed: one step after another, the bridge held them. Nothing bad happened. By the end, they had proven to themselves that they could move through uncertainty and still be okay.',
        angry: 'The wind matched their inner fire—they were mad about the unfairness of crossing this bridge, of having to do the hard work, of change being forced on them. They walked with that anger, not running from it. And halfway across, they realized: this anger is fuel. This is the power that will help me stand firm in what matters. And they crossed with a fiercer stride.',
        happy: 'The bridge felt beautiful—the weather was on their side, the view was expansive, and their heart felt light. They walked slowly, not rushing, because they were enjoying the journey itself. Happiness made the bridge feel less like an obstacle and more like an adventure. They noticed small things—birds, light, the feeling of being alive and moving.',
        calm: 'The calm person walked this bridge peacefully, not in a hurry. They noticed the rhythm of their steps, the pattern of the bridge beneath them, the cycle of breath. There was no fight, no resistance. Just presence. The bridge became a meditation, a quiet moment of moving through the world with steadiness.',
        neutral: 'The neutral emotional state made the bridge practical—they could assess the path, notice where the footing was safe, and choose their way carefully. No emotion made them reckless or frozen. They walked with clear-eyed intention, neither rushed nor stuck.',
      }
    },
  ];

  // Build story narratives with emotional depth
  function buildRichStory(angle, emotionArc, primaryEmotion) {
    const emotionalContent = emotionArc;
    const motivationalEnding = {
      sad: 'And in that understanding—that their capacity to feel deeply was their greatest strength—they allowed themselves to rest. Tomorrow, they would take one small step toward light. But tonight, they honored the depth of their heart.',
      stressed: 'And in that quiet moment, their list suddenly felt manageable again. Not because the tasks disappeared, but because they had chosen clarity over panic. They would handle what mattered, skip what did not, and trust their ability to adapt. The evening felt different now.',
      anxious: 'And in that moment of grounding, their nervous system believed them. They were here, they were safe, and this moment held no hidden danger. They breathed, and their body relaxed just enough. That was enough. That was more than enough.',
      angry: 'And in that clarity, their anger became their advocate. They would be clear, firm, and kind to themselves. They would protect the boundaries that kept their dignity intact. The heat transformed into resolve.',
      happy: 'And in that savoring, they understood: happiness is not something that happens to you. It is something you build, notice, and protect. They ended their day grateful for every bright moment.',
      calm: 'And in that peace, they understood: calm is a skill they had learned. They could return to this whenever they needed it. The world was loud, but inside, they had built a place of stillness.',
      neutral: 'And in that clarity, they made a small plan for tomorrow. Not because they were pushed by emotion, but because steady awareness had shown them the way. They were ready to continue.',
    };

    const storyText = [
      emotionalContent,
      motivationalEnding[primaryEmotion] || motivationalEnding.neutral
    ].join('\n\n');

    return storyText;
  }

  const emotionProfiles = {
    sad: {
      opening: 'the ache of carrying grief without a place to put it',
      morals: [
        'Sadness softens when it is named and shared with care.',
        'Missing out can hurt, but it does not define your worth.',
        'Healing is often quiet and still deeply meaningful.',
        'You do not have to rush your recovery to deserve peace.',
        'Grief asks for gentleness, not performance.',
        'Even heavy days can contain one honest step forward.',
        'Feeling hurt is not failure; it is human.',
        'Support becomes easier to receive when we stop hiding pain.',
        'Small acts of self-kindness rebuild strength.',
        'Rest is a valid response to emotional pain.',
      ],
      reflections: [
        'What would make today feel 10% softer for you?',
        'Which moment hurt most, and what support do you wish you had there?',
        'What can you stop blaming yourself for today?',
        'Who is one safe person you can be honest with this week?',
        'What helps you feel less alone when sadness rises?',
        'What small comfort can you give yourself tonight?',
        'What expectation can you lower to protect your energy?',
        'When did you still show courage, even while sad?',
        'What does gentle progress look like for you this week?',
        'What would compassion say to you right now?',
      ],
      quotes: [
        'Tears are not the opposite of strength; they are evidence of care.',
        'Even a slow sunrise still becomes daylight.',
        'A heavy heart can still move forward one step at a time.',
        'You are not behind; you are healing.',
        'Softness is a strategy, not a weakness.',
        'There is no wrong speed for recovery.',
        'You are allowed to rest while you rebuild.',
        'Hope often arrives quietly, not loudly.',
        'Being honest about pain is a form of courage.',
        'You are still growing on days that feel gray.',
      ],
    },
    stressed: {
      opening: 'the pressure of trying to hold everything together',
      morals: [
        'Stress shrinks when priorities become clear.',
        'Doing one thing well is better than doing everything at once.',
        'Boundaries protect focus, not laziness.',
        'Calm planning beats panic-driven speed.',
        'You can be responsible without being available to everything.',
        'Overload is a signal to simplify, not self-attack.',
        'A reset is productive when your system is overloaded.',
        'You do not owe perfection to prove effort.',
        'Focus is built by removal as much as action.',
        'Pause is part of performance when pressure is high.',
      ],
      reflections: [
        'Which one task matters most right now?',
        'What can be postponed without real consequence?',
        'What boundary would lower your stress today?',
        'Where are you spending energy that is not required?',
        'What does enough look like for today?',
        'What can you delegate, skip, or shorten?',
        'What is one reset you can schedule before evening?',
        'Which demand is loud but not important?',
        'How can you protect one focused hour tomorrow?',
        'What support would make this workload sustainable?',
      ],
      quotes: [
        'Pressure is loud, but clarity has the final word.',
        'One focused step beats ten scattered ones.',
        'You are allowed to choose fewer priorities.',
        'Rest is not a reward; it is maintenance.',
        'Boundaries are productivity tools in disguise.',
        'Urgency is not always importance.',
        'Simplify first, then accelerate.',
        'You can carry responsibility without carrying everything.',
        'Calm is a strategy, not an accident.',
        'Your worth does not rise with your stress level.',
      ],
    },
    anxious: {
      opening: 'the restlessness that arrives before the worst has even happened',
      morals: [
        'Anxiety eases when attention returns to what is real now.',
        'Uncertainty is uncomfortable, but it is not always danger.',
        'Grounding gives the mind a place to stand.',
        'You can feel fear and still make clear decisions.',
        'Control grows through small actions, not endless prediction.',
        'The body settles when it is given rhythm and breath.',
        'Worry is a signal to pause, not proof of catastrophe.',
        'Safety can be practiced in the present moment.',
        'Not every thought deserves equal trust.',
        'Courage often looks like staying present.',
      ],
      reflections: [
        'What is true right now, not just possible later?',
        'What physical cue tells you anxiety is rising?',
        'Which grounding action helps your body fastest?',
        'What fear are you treating as a fact?',
        'What is one controllable step for the next 15 minutes?',
        'What would you say to a friend feeling this same fear?',
        'What uncertainty can you allow without solving tonight?',
        'Which thought can you label as worry, not certainty?',
        'How can you make your environment feel safer right now?',
        'What routine helps you return to baseline?',
      ],
      quotes: [
        'You do not have to solve tomorrow to breathe today.',
        'The present is smaller than your fear, and safer too.',
        'A steady breath is a quiet vote for safety.',
        'Uncertainty is a place, not a verdict.',
        'Ground first, then think.',
        'You are allowed to pause before predicting.',
        'Calm can be practiced one breath at a time.',
        'Not every alarm in your mind is an emergency.',
        'Your body can relearn safety.',
        'Presence is stronger than panic.',
      ],
    },
    angry: {
      opening: 'the heat that comes from feeling ignored or pushed too far',
      morals: [
        'Anger can point to a boundary worth protecting.',
        'Clarity turns reaction into response.',
        'Strong feelings need direction, not suppression.',
        'Respect starts with naming what is not okay.',
        'Pause creates space between pain and action.',
        'Boundaries are strongest when they are calm and specific.',
        'Anger often guards a deeper unmet need.',
        'You can be firm without becoming harsh.',
        'Power grows when expression stays intentional.',
        'Repair begins when truth is spoken clearly.',
      ],
      reflections: [
        'What boundary did this moment expose?',
        'What need underneath anger needs a voice?',
        'What response would future-you respect?',
        'Where do you need to be clearer next time?',
        'How can you communicate firmly without escalation?',
        'What part of this anger is hurt, not hostility?',
        'What action protects your dignity right now?',
        'What conversation are you postponing?',
        'Which trigger repeats and needs a new plan?',
        'What would calm strength look like here?',
      ],
      quotes: [
        'Anger is energy; wisdom is where you aim it.',
        'A clear boundary is calmer than a loud argument.',
        'You can be strong and measured at once.',
        'Pause is not weakness; it is control.',
        'Truth lands better when it is steady.',
        'Firm is not cruel.',
        'You do not have to explode to be heard.',
        'Respect begins where silence ends.',
        'Channel the fire; do not become it.',
        'Your voice is strongest when it is intentional.',
      ],
    },
    happy: {
      opening: 'the bright, moving energy that comes when life feels open again',
      morals: [
        'Joy grows when we slow down enough to notice it.',
        'Gratitude stabilizes good moments into good memories.',
        'Happiness deepens when it is shared.',
        'Celebrating progress keeps momentum alive.',
        'Lightness is powerful fuel for meaningful action.',
        'Receiving joy fully is a healthy practice.',
        'Small wins deserve full recognition.',
        'Positive seasons are built from repeated tiny choices.',
        'Joy and discipline can support each other.',
        'Good days are data too, not accidents only.',
      ],
      reflections: [
        'What gave you energy today that you can repeat?',
        'Who can you share this good moment with?',
        'How can you protect this momentum tomorrow?',
        'What habit helped create this lighter mood?',
        'What are you grateful for right now?',
        'How can you store this moment for harder days?',
        'What success did you almost overlook today?',
        'Where can this joy become service to someone else?',
        'What boundary helps preserve this happiness?',
        'How can you make room for more of this next week?',
      ],
      quotes: [
        'Joy is strongest when you let it be seen.',
        'A grateful heart notices more of what is good.',
        'Celebrate the small win; it trains the mind for hope.',
        'Lightness can be a discipline.',
        'Happiness is a skill of attention.',
        'Good moments count even when they are brief.',
        'Let the bright day teach you what works.',
        'Joy shared is joy multiplied.',
        'You are allowed to enjoy what you built.',
        'Keep the window open for good things.',
      ],
    },
    calm: {
      opening: 'the steady breath that comes after a long period of noise',
      morals: [
        'Calm is an achievement, not an absence.',
        'Stillness can restore what pressure depleted.',
        'Steady rhythms protect long-term resilience.',
        'Quiet focus is a powerful form of strength.',
        'Recovery is progress, not delay.',
        'Peace becomes durable when practiced daily.',
        'A slow pace can still move life forward.',
        'Composure helps better choices arrive naturally.',
        'Stability is built in ordinary moments.',
        'Protected calm improves everything downstream.',
      ],
      reflections: [
        'What routine helps you keep this steadiness?',
        'How can you protect this calm tomorrow?',
        'Which noise can you reduce this week?',
        'What habit quietly supports your peace?',
        'Where does your body feel most at ease?',
        'What helps you recover fastest after stress?',
        'How can you preserve this pace in busy days?',
        'What boundary keeps your mind clear?',
        'What does peaceful productivity look like for you?',
        'How can you make this calm shareable at home or work?',
      ],
      quotes: [
        'Calm is a practice you can return to daily.',
        'Quiet does not mean empty; it means restored.',
        'A steady mind sees farther.',
        'Peace is productive.',
        'Stillness is not stopping; it is aligning.',
        'Protect your calm like a priority.',
        'Composure is a kind of power.',
        'Slow and clear beats fast and scattered.',
        'Balance is built, not found.',
        'Your pace can be your advantage.',
      ],
    },
    neutral: {
      opening: 'the quiet space where nothing feels sharp, but everything still matters',
      morals: [
        'Neutral moments are useful checkpoints, not empty spaces.',
        'Clarity often appears between emotional extremes.',
        'Ordinary days can still move life forward.',
        'A reset is most powerful when noticed early.',
        'Steady awareness builds future resilience.',
        'Not every meaningful shift feels dramatic.',
        'Small signals are easier to hear in quiet moods.',
        'Balanced days help prepare for difficult ones.',
        'Consistency grows in emotionally moderate moments.',
        'Calm observation creates better decisions later.',
      ],
      reflections: [
        'What subtle feeling deserves attention right now?',
        'What worked today that you can repeat tomorrow?',
        'What is one quiet win from this day?',
        'What would make this steady mood more meaningful?',
        'Where can you use this clarity for planning?',
        'What small habit can you strengthen today?',
        'What signal might you miss if you rush?',
        'How can this reset point support your week?',
        'What does a balanced day teach you about your needs?',
        'What intention do you want to carry into tomorrow?',
      ],
      quotes: [
        'Quiet days are where strong habits are built.',
        'Clarity often whispers before it speaks loudly.',
        'Balance is useful even when it feels ordinary.',
        'A neutral day can still be a meaningful day.',
        'Steady is a direction, not just a mood.',
        'The middle ground can be fertile ground.',
        'Small signals matter.',
        'Ordinary moments can hold important answers.',
        'Use calm days to prepare for hard days.',
        'Consistency grows best in quiet weather.',
      ],
    },
  };

  const profile = emotionProfiles[primaryEmotion] || emotionProfiles.neutral;
  const moodSignatureScore = emotionList.join('').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const frameIndex = (seed + primaryEmotion.length + moodStack.length + moodSignatureScore) % storyFrames.length;
  const angle = storyFrames[frameIndex];

  const variantIndex = (seed + frameIndex + primaryEmotion.length) % 10;
  const moral = profile.morals[variantIndex];
  const reflection = profile.reflections[(variantIndex + frameIndex) % 10];
  const quote = profile.quotes[(variantIndex + seed) % 10];

  // Build rich story with emotional depth and motivational ending
  const emotionalArcContent = angle.emotionalArc[primaryEmotion] || angle.emotionalArc.neutral;
  const storyText = enforceStoryLength(
    buildRichStory(angle, emotionalArcContent, primaryEmotion),
    primaryEmotion
  );
  const sentimentScore = sentimentByMood[primaryEmotion] ?? sentimentByMood.neutral;
  const emotionalIntensityScore = intensityByMood[primaryEmotion] ?? intensityByMood.neutral;

  return {
    title: angle.title,
    story: storyText,
    moral,
    affirmation: `I can feel ${moodStack || primaryEmotion}, and still move gently toward what helps me heal.`,
    reflection_question: reflection,
    quote,
    generated_at: new Date().toISOString(),
    emotion_signature: emotionList,
    story_theme: angle.takeaway,
    word_count: (storyText.match(/\S+/g) || []).length,
    sentiment_score: sentimentScore,
    emotional_intensity_score: emotionalIntensityScore,
  };
}

export function generateColorTherapy(mood = 'neutral') {
  const colors = {
    happy: { color: '#FFD700', name: 'Golden Yellow', benefit: 'Boosts joy and optimism' },
    calm: { color: '#87CEEB', name: 'Sky Blue', benefit: 'Promotes peace and tranquility' },
    energetic: { color: '#FF6B6B', name: 'Coral Red', benefit: 'Ignites passion and motivation' },
    sad: { color: '#9370DB', name: 'Purple', benefit: 'Encourages reflection and wisdom' },
    anxious: { color: '#98FF98', name: 'Mint Green', benefit: 'Reduces stress and brings balance' },
    neutral: { color: '#DDD0C8', name: 'Taupe', benefit: 'Grounds and centers you' }
  };

  const selected = colors[mood] || colors.neutral;

  return {
    recommended_color: selected.name,
    color_hex: selected.color,
    benefit: selected.benefit,
    suggestion: `Spend 5-10 minutes surrounded by ${selected.name}. Wear it, look at it, visualize it. Let the color work its magic.`,
    activities: [
      `Wear something in ${selected.name}`,
      `Visualize yourself bathed in ${selected.name} light`,
      `Find something in nature with this color`,
      `Paint, color, or decorate with ${selected.name}`
    ]
  };
}

export function generateStudyHelp(subject = '', duration = 60, difficulty = 'medium', mood = 'neutral', energyLevel = 6) {
  const normalizedMood = String(mood || 'neutral').toLowerCase();
  const energy = Math.max(1, Math.min(10, Number(energyLevel) || 6));
  const durationMinutes = Math.max(15, Math.min(240, Number(duration) || 60));

  const subjectStrategies = {
    math: { lightTask: 'work a few easy problems', deepTask: 'solve mixed practice sets', recallTask: 'review formulas and examples' },
    science: { lightTask: 'label diagrams and flashcards', deepTask: 'connect concepts and mechanisms', recallTask: 'summarize key definitions' },
    language: { lightTask: 'review vocabulary', deepTask: 'write or speak in full sentences', recallTask: 'translate and self-test' },
    history: { lightTask: 'scan timelines and key names', deepTask: 'explain causes and effects', recallTask: 'recall events from memory' },
    default: { lightTask: 'review notes briefly', deepTask: 'do active recall questions', recallTask: 'teach the topic aloud' },
  };

  const moodStrategies = {
    stress: {
      technique: 'Pomodoro + breaks',
      focusMinutes: 20,
      breakMinutes: 7,
      sessionStyle: 'short focus bursts with breathing breaks',
      firstTask: 'start with a small, clearly defined task',
      tips: ['Use one task per block', 'Keep a water bottle nearby', 'Take a 60-second reset before each block'],
      effortLevel: 'light-to-moderate',
    },
    stressed: {
      technique: 'Pomodoro + breaks',
      focusMinutes: 20,
      breakMinutes: 7,
      sessionStyle: 'short focus bursts with breathing breaks',
      firstTask: 'start with a small, clearly defined task',
      tips: ['Use one task per block', 'Keep a water bottle nearby', 'Take a 60-second reset before each block'],
      effortLevel: 'light-to-moderate',
    },
    anxious: {
      technique: 'Pomodoro + breaks',
      focusMinutes: 18,
      breakMinutes: 7,
      sessionStyle: 'grounded focus blocks with short decompression',
      firstTask: 'start with the easiest visible task',
      tips: ['Ground before you begin', 'Write down the next step only', 'Avoid multitasking'],
      effortLevel: 'light-to-moderate',
    },
    sad: {
      technique: 'Light activation blocks',
      focusMinutes: 15,
      breakMinutes: 6,
      sessionStyle: 'gentle momentum with easy wins first',
      firstTask: 'start with a low-friction review task',
      tips: ['Aim for progress, not perfection', 'Use easy recall first', 'Celebrate completion of each block'],
      effortLevel: 'light',
    },
    calm: {
      technique: energy >= 7 ? 'Deep work intervals' : 'Balanced focus blocks',
      focusMinutes: energy >= 7 ? 35 : 25,
      breakMinutes: energy >= 7 ? 5 : 6,
      sessionStyle: energy >= 7 ? 'focused deep work with short resets' : 'steady blocks with clear objectives',
      firstTask: energy >= 7 ? 'tackle the hardest item first' : 'start with an important medium-task',
      tips: ['Keep objectives specific', 'Use one block for one outcome', 'Track progress after each session'],
      effortLevel: energy >= 7 ? 'high' : 'moderate',
    },
    happy: {
      technique: 'Deep work intervals',
      focusMinutes: energy >= 7 ? 40 : 30,
      breakMinutes: energy >= 7 ? 5 : 6,
      sessionStyle: 'high-energy focus windows with deliberate recovery',
      firstTask: 'use your energy on the hardest topic first',
      tips: ['Protect momentum by starting quickly', 'Use active recall', 'Take breaks before you feel drained'],
      effortLevel: 'high',
    },
    angry: {
      technique: 'Pomodoro + breaks',
      focusMinutes: 18,
      breakMinutes: 7,
      sessionStyle: 'short blocks to cool intensity and keep control',
      firstTask: 'choose a simple task to regain control',
      tips: ['Do not start with the hardest topic', 'Use movement during breaks', 'Write distractions down instead of chasing them'],
      effortLevel: 'light-to-moderate',
    },
    neutral: {
      technique: energy >= 7 ? 'Deep work intervals' : 'Pomodoro + breaks',
      focusMinutes: energy >= 7 ? 30 : 22,
      breakMinutes: energy >= 7 ? 6 : 7,
      sessionStyle: energy >= 7 ? 'productive longer blocks' : 'steady and manageable work cycles',
      firstTask: 'start with a clear win',
      tips: ['Keep the plan simple', 'Use active recall', 'Avoid long unfocused sessions'],
      effortLevel: energy >= 7 ? 'high' : 'moderate',
    },
  };

  const strategy = moodStrategies[normalizedMood] || moodStrategies.neutral;
  const subjectStrategy = subjectStrategies[String(subject || '').toLowerCase()] || subjectStrategies.default;
  const effectiveFocus = Math.max(10, Math.min(45, Math.round(strategy.focusMinutes + (energy >= 8 ? 3 : 0))));
  const effectiveBreak = Math.max(4, Math.min(10, strategy.breakMinutes));
  const cycles = Math.max(1, Math.floor(durationMinutes / (effectiveFocus + effectiveBreak)));

  return {
    recommendation_type: strategy.technique,
    focus_level: strategy.effortLevel,
    subject: subject || 'General',
    mood: normalizedMood,
    energy_level: energy,
    total_duration: `${durationMinutes} minutes`,
    session_style: strategy.sessionStyle,
    first_task: `${subjectStrategy[energy >= 7 ? 'deepTask' : 'lightTask']}; ${strategy.firstTask}.`,
    structured_suggestions: {
      before_study: [
        'Clear your workspace',
        normalizedMood === 'stress' || normalizedMood === 'stressed' || normalizedMood === 'anxious'
          ? 'Take 3 slow breaths before starting'
          : 'Set one clear goal for this session',
      ],
      during_study: [
        energy >= 7 ? subjectStrategy.deepTask : subjectStrategy.lightTask,
        subjectStrategy.recallTask,
        strategy.tips[0],
      ],
      breaks: [
        `Take ${effectiveBreak}-minute breaks`,
        normalizedMood === 'stressed' || normalizedMood === 'anxious' ? 'Stand up and reset your breathing' : 'Walk, stretch, or hydrate',
      ],
      after_study: [
        'Write one thing you learned',
        'Mark the next starting point for later',
      ],
    },
    schedule: Array.from({ length: cycles }, (_, i) => ({
      session: i + 1,
      focus: `${effectiveFocus} min`,
      break: `${effectiveBreak} min`,
      task_type: energy >= 7 ? 'deep work' : 'light review',
    })),
    tips: [
      `Mood: ${normalizedMood}`,
      `Energy: ${energy}/10`,
      ...strategy.tips,
    ],
    motivation: energy >= 7
      ? 'You have enough energy for meaningful progress. Use it on the hardest task first.'
      : 'Keep the session light and consistent. Small wins still move you forward.',
  };
}

export function generatePositivityAffirmation(mood = 'neutral', name = 'Friend') {
  const affirmations = {
    happy: [
      `${name}, your joy is contagious – keep shining!`,
      `You're glowing today. Celebrate YOU.`,
      `Your happiness matters. Thank you for that light.`
    ],
    sad: [
      `${name}, this moment doesn't define you. You are stronger than you know.`,
      `It's okay to feel. You're allowed to grieve, to rest, to heal.`,
      `Softness isn't weakness – it's wisdom. Be gentle with yourself.`
    ],
    anxious: [
      `${name}, you've survived 100% of your bad days. You're resilient.`,
      `Anxiety is a liar. You are more capable than it says.`,
      `One breath at a time. You're safe. You're here. You matter.`
    ],
    calm: [
      `${name}, this peace is well-deserved. Hold onto it.`,
      `You're grounded. Keep that centered feeling.`,
      `Calm mind, clear heart. You're in sync.`
    ],
    neutral: [
      `${name}, you're doing better than you think.`,
      `Every day is a chance to be kind to yourself.`,
      `You matter exactly as you are, right now.`
    ]
  };

  const selected = affirmations[mood] || affirmations.neutral;
  return selected[Math.floor(Math.random() * selected.length)];
}
