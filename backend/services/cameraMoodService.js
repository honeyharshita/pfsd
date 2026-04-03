function clamp(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

function normalizeText(value = '') {
  return String(value || '').trim().toLowerCase();
}

function pickFirstKeyword(text, keywords = []) {
  for (const keyword of keywords) {
    if (text.includes(keyword)) return keyword;
  }
  return '';
}

function normalizeFaceExpression(faceExpression = '', faceSignals = {}) {
  const direct = normalizeText(faceExpression || faceSignals.faceExpression || faceSignals.expression || '');

  if (/smile|grin|laugh/.test(direct)) return 'smile';
  if (/neutral|plain|normal/.test(direct)) return 'neutral';
  if (/frown|cry|tear|sad face/.test(direct)) return 'frown';

  if (direct === 'smile' || direct === 'neutral' || direct === 'frown') {
    return direct;
  }

  const smileScore = clamp(faceSignals.smileScore ?? faceSignals.smile ?? 0, 0, 1);
  const neutralScore = clamp(faceSignals.neutralScore ?? faceSignals.neutral ?? 0, 0, 1);
  const frownScore = clamp(faceSignals.frownScore ?? faceSignals.frown ?? 0, 0, 1);

  const maxScore = Math.max(smileScore, neutralScore, frownScore);
  if (maxScore < 0.42) return '';
  if (maxScore === smileScore) return 'smile';
  if (maxScore === frownScore) return 'frown';
  return 'neutral';
}

function normalizeMoodHint(faceExpression = '', faceSignals = {}) {
  const merged = `${faceExpression || ''} ${faceSignals.moodHint || ''} ${faceSignals.fallbackMoodHint || ''} ${faceSignals.emotionHint || ''}`.toLowerCase();

  const directMood = pickFirstKeyword(merged, [
    'happy',
    'sad',
    'angry',
    'calm',
    'anxious',
    'stress',
    'stressed',
  ]);

  if (!directMood) return '';
  if (directMood === 'stress') return 'stressed';
  return directMood;
}

export function detectCameraMood({ faceExpression = '', faceSignals = {} } = {}) {
  const normalizedExpression = normalizeFaceExpression(faceExpression, faceSignals);
  const moodHint = normalizeMoodHint(faceExpression, faceSignals);

  const detectionConfidence = clamp(faceSignals.detectionConfidence ?? faceSignals.faceConfidence ?? 0.65, 0, 1);
  const stressSignal = clamp(faceSignals.stressSignal ?? faceSignals.browTension ?? 0, 0, 1);
  const anxietySignal = clamp(faceSignals.anxietySignal ?? faceSignals.eyeTension ?? 0, 0, 1);
  const angerSignal = clamp(faceSignals.angerSignal ?? faceSignals.jawTension ?? 0, 0, 1);

  if (moodHint) {
    const boosted = clamp(Math.round((0.74 + detectionConfidence * 0.24) * 100), 70, 98);
    return {
      face_expression: normalizedExpression || moodHint,
      detected_mood: moodHint,
      mood_confidence: boosted,
      confidence: Number((boosted / 100).toFixed(2)),
      mapping_reason: `Mapped explicit mood hint -> ${moodHint}`,
    };
  }

  if (normalizedExpression === 'smile') {
    const score = clamp(Math.round((0.72 + detectionConfidence * 0.24) * 100), 68, 98);
    return {
      face_expression: 'smile',
      detected_mood: 'happy',
      mood_confidence: score,
      confidence: Number((score / 100).toFixed(2)),
      mapping_reason: 'Mapped smile -> happy',
    };
  }

  if (normalizedExpression === 'neutral') {
    const score = clamp(Math.round((0.7 + detectionConfidence * 0.22) * 100), 65, 96);
    return {
      face_expression: 'neutral',
      detected_mood: 'calm',
      mood_confidence: score,
      confidence: Number((score / 100).toFixed(2)),
      mapping_reason: 'Mapped neutral -> calm',
    };
  }

  if (normalizedExpression === 'frown') {
    const isStressed = stressSignal >= 0.56;
    const mood = isStressed ? 'stressed' : 'sad';
    const score = clamp(Math.round((0.69 + detectionConfidence * 0.22 + (isStressed ? 0.05 : 0)) * 100), 63, 95);
    return {
      face_expression: 'frown',
      detected_mood: mood,
      mood_confidence: score,
      confidence: Number((score / 100).toFixed(2)),
      mapping_reason: isStressed ? 'Mapped frown -> stressed (high stress signal)' : 'Mapped frown -> sad',
    };
  }

  if (angerSignal >= 0.62) {
    const score = clamp(Math.round((0.67 + angerSignal * 0.28) * 100), 64, 94);
    return {
      face_expression: 'tense',
      detected_mood: 'angry',
      mood_confidence: score,
      confidence: Number((score / 100).toFixed(2)),
      mapping_reason: 'Mapped tension signals -> angry',
    };
  }

  if (anxietySignal >= 0.58) {
    const score = clamp(Math.round((0.66 + anxietySignal * 0.26) * 100), 63, 93);
    return {
      face_expression: 'alert',
      detected_mood: 'anxious',
      mood_confidence: score,
      confidence: Number((score / 100).toFixed(2)),
      mapping_reason: 'Mapped vigilance signals -> anxious',
    };
  }

  return {
    face_expression: normalizedExpression || 'unknown',
    detected_mood: 'calm',
    mood_confidence: 61,
    confidence: 0.61,
    mapping_reason: 'No strong expression found; defaulting to calm baseline.',
  };
}
