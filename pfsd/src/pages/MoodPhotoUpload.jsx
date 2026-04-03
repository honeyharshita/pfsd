import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '@/api/aiInsightsClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, Sparkles, RotateCcw, FlipHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as faceapi from 'face-api.js';

const FACE_API_MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
let faceApiModelsPromise = null;

const moodGradients = {
  happy: 'from-yellow-400 to-amber-500', calm: 'from-blue-400 to-cyan-500',
  sad: 'from-indigo-400 to-blue-600', stressed: 'from-orange-400 to-red-500',
  anxious: 'from-amber-400 to-orange-500', angry: 'from-red-400 to-rose-600',
  neutral: 'from-purple-400 to-violet-500', peaceful: 'from-teal-400 to-green-500',
};
const moodEmoji = { happy:'😊', calm:'😌', sad:'😢', stressed:'😰', anxious:'😟', angry:'😡', neutral:'🙂', peaceful:'🌿' };

function hashText(input = '') {
  const text = String(input || '');
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function loadFaceApiModels() {
  if (!faceApiModelsPromise) {
    faceApiModelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(FACE_API_MODEL_URL),
    ]);
  }
  return faceApiModelsPromise;
}

function mapExpressionToMood(expression = '') {
  const normalized = String(expression || '').toLowerCase();
  if (normalized === 'happy') {
    return { faceExpression: 'smile', moodHint: 'happy' };
  }
  if (normalized === 'sad') {
    return { faceExpression: 'frown', moodHint: 'sad' };
  }
  if (normalized === 'angry') {
    return { faceExpression: 'angry', moodHint: 'angry' };
  }
  if (normalized === 'fearful') {
    return { faceExpression: 'anxious', moodHint: 'anxious' };
  }
  if (normalized === 'disgusted') {
    return { faceExpression: 'stress', moodHint: 'stressed' };
  }
  if (normalized === 'surprised') {
    return { faceExpression: 'alert', moodHint: 'anxious' };
  }
  return { faceExpression: 'neutral', moodHint: 'calm' };
}

async function detectFaceMood(dataUrl = '') {
  try {
    await loadFaceApiModels();
    const image = await loadImageFromDataUrl(dataUrl);
    const detections = await faceapi
      .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.45 }))
      .withFaceExpressions();

    if (!detections.length) {
      return null;
    }

    const bestDetection = detections.reduce((best, current) => {
      const bestArea = (best.detection?.box?.width || 0) * (best.detection?.box?.height || 0);
      const currentArea = (current.detection?.box?.width || 0) * (current.detection?.box?.height || 0);
      if (currentArea > bestArea) return current;
      return best;
    }, detections[0]);

    const expressions = bestDetection.expressions || {};
    const ranked = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
    const [expression = 'neutral', confidence = 0.5] = ranked[0] || ['neutral', 0.5];
    const mapped = mapExpressionToMood(expression);

    return {
      ...mapped,
      expression,
      detectionConfidence: Number(confidence.toFixed(2)),
      allExpressions: Object.fromEntries(Object.entries(expressions).map(([key, value]) => [key, Number(value.toFixed(3))])),
    };
  } catch {
    return null;
  }
}

async function extractPhotoSignals(dataUrl = '') {
  try {
    const img = await loadImageFromDataUrl(dataUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const width = 56;
    const height = 56;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);

    let sumL = 0;
    let sumL2 = 0;
    let sumS = 0;
    let sumWarmth = 0;
    let centerSumL = 0;
    let centerCount = 0;
    let centerDiff = 0;

    const cx = width / 2;
    const cy = height / 2;
    const centerRadius = Math.min(width, height) * 0.28;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const l = (r + g + b) / 3;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const s = max - min;
      const warmth = r - b;

      sumL += l;
      sumL2 += l * l;
      sumS += s;
      sumWarmth += warmth;

      const pixel = i / 4;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= centerRadius * centerRadius) {
        centerSumL += l;
        centerCount += 1;
      }

      if (x > 0) {
        const prev = i - 4;
        const pr = data[prev];
        const pg = data[prev + 1];
        const pb = data[prev + 2];
        const pl = (pr + pg + pb) / 3;
        centerDiff += Math.abs(l - pl);
      }
    }

    const count = data.length / 4;
    const mean = sumL / Math.max(1, count);
    const variance = (sumL2 / Math.max(1, count)) - (mean * mean);
    const contrast = Math.sqrt(Math.max(0, variance));

    return {
      brightness: mean,
      contrast,
      saturation: sumS / Math.max(1, count),
      warmth: sumWarmth / Math.max(1, count),
      centerBrightness: centerSumL / Math.max(1, centerCount),
      edgeContrast: centerDiff / Math.max(1, count),
    };
  } catch {
    return {
      brightness: 130,
      contrast: 34,
      saturation: 42,
      warmth: 0,
      centerBrightness: 130,
      edgeContrast: 16,
    };
  }
}

function normalizeCameraResult(raw = {}) {
  const mood = String(raw.detected_mood || raw.mood || 'neutral').toLowerCase();
  const confidence = Number.isFinite(Number(raw.mood_confidence))
    ? Number(raw.mood_confidence)
    : Number.isFinite(Number(raw.confidence))
      ? Math.round(Number(raw.confidence) * 100)
      : 70;

  return {
    detected_mood: mood,
    mood_confidence: Math.max(1, Math.min(99, confidence)),
    color_analysis: raw.color_analysis || 'Color and lighting suggest a reflective emotional tone.',
    atmosphere: raw.atmosphere || 'The atmosphere feels personal and emotionally expressive.',
    emotional_story: raw.emotional_story || raw.brief_observation || 'This photo captures a meaningful emotional moment.',
    reflection: raw.reflection || 'What feels most true for you in this moment?',
    suggested_activity: raw.suggested_activity || 'Take three slow breaths and notice one feeling clearly.',
  };
}

function buildLocalCameraFallback(imageUrl = '', signals = null) {
  const seed = hashText(imageUrl);
  const s = signals || {
    brightness: 130,
    contrast: 34,
    saturation: 42,
    warmth: 0,
    centerBrightness: 130,
    edgeContrast: 16,
  };

  const scores = {
    happy: 0,
    calm: 0,
    sad: 0,
    stressed: 0,
    anxious: 0,
    angry: 0,
    neutral: 0,
  };

  if (s.brightness > 160) {
    scores.happy += 2.6;
    scores.calm += 1.4;
  } else if (s.brightness < 96) {
    scores.sad += 2.3;
    scores.stressed += 1.5;
  } else {
    scores.neutral += 1.0;
    scores.calm += 0.7;
  }

  if (s.contrast > 52) {
    scores.anxious += 1.8;
    scores.angry += 1.6;
    scores.stressed += 1.0;
  } else if (s.contrast < 26) {
    scores.calm += 1.7;
    scores.neutral += 1.2;
  }

  if (s.saturation > 66) {
    scores.happy += 1.5;
    scores.angry += 0.9;
  } else if (s.saturation < 34) {
    scores.sad += 1.4;
    scores.calm += 0.8;
  }

  if (s.warmth > 13) {
    scores.happy += 1.1;
    scores.angry += 1.0;
  } else if (s.warmth < -8) {
    scores.sad += 1.0;
    scores.calm += 0.9;
  }

  if (s.centerBrightness < s.brightness - 12) {
    scores.sad += 0.8;
    scores.stressed += 0.7;
  }

  if (s.edgeContrast > 18) {
    scores.anxious += 0.8;
  }

  const tieBreaker = (seed % 97) / 500;
  Object.keys(scores).forEach((moodKey, idx) => {
    scores[moodKey] += ((seed + idx * 17) % 13) / 100 + tieBreaker;
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  let mood = ranked[0][0];

  // Avoid overusing neutral unless image signals are genuinely balanced.
  if (mood === 'neutral' && ranked[1] && ranked[1][1] > ranked[0][1] - 0.45) {
    mood = ranked[1][0];
  }

  const contentByMood = {
    happy: {
      color_analysis: 'Brighter visual balance suggests positive emotional energy.',
      atmosphere: 'The photo feels open and lightly optimistic.',
      emotional_story: 'Your expression appears lighter, as if there is some emotional relief in this moment.',
      reflection: 'What helped you feel this positive shift today?',
      suggested_activity: 'Capture one more positive moment and write a quick gratitude line.',
    },
    calm: {
      color_analysis: 'Soft tones suggest emotional steadiness and regulation.',
      atmosphere: 'The atmosphere appears grounded and composed.',
      emotional_story: 'You seem centered, with a calm presence in this frame.',
      reflection: 'How can you protect this calm for the next few hours?',
      suggested_activity: 'Take a 3-minute mindful breathing pause.',
    },
    sad: {
      color_analysis: 'Lower visual energy can reflect emotional heaviness.',
      atmosphere: 'The frame feels inward and quiet.',
      emotional_story: 'Your expression suggests emotional weight and the need for gentle support.',
      reflection: 'What would make you feel emotionally held right now?',
      suggested_activity: 'Write one compassionate message to yourself.',
    },
    stressed: {
      color_analysis: 'Tighter visual tension may reflect mental load and fatigue.',
      atmosphere: 'The scene feels pressured and mentally busy.',
      emotional_story: 'The photo suggests you may be carrying several demands at once.',
      reflection: 'Which one task can you simplify immediately?',
      suggested_activity: 'Do one box-breathing cycle before your next task.',
    },
    anxious: {
      color_analysis: 'Subtle intensity cues suggest a vigilant emotional state.',
      atmosphere: 'The mood feels alert and uncertain.',
      emotional_story: 'Your expression looks attentive, possibly anticipating what comes next.',
      reflection: 'What helps your body feel safer in this moment?',
      suggested_activity: 'Use the 5-4-3-2-1 grounding exercise.',
    },
    angry: {
      color_analysis: 'High intensity contrast can align with activated emotional boundaries.',
      atmosphere: 'The frame feels charged and forceful.',
      emotional_story: 'This expression suggests frustration that may be signaling an unmet need or boundary.',
      reflection: 'What boundary needs to be stated clearly and calmly?',
      suggested_activity: 'Take a short walk and write one clear boundary sentence.',
    },
    neutral: {
      color_analysis: 'Balanced visual composition suggests a neutral emotional baseline.',
      atmosphere: 'The atmosphere feels steady and reflective.',
      emotional_story: 'Your expression appears neutral but attentive, a useful point for self-check-in.',
      reflection: 'What subtle emotion is present beneath neutral right now?',
      suggested_activity: 'Pause for 60 seconds and name your top emotional need.',
    },
  };

  return {
    detected_mood: mood,
    mood_confidence: Math.max(58, Math.min(96, 62 + Math.round((ranked[0][1] - (ranked[1]?.[1] || 0)) * 18) + (seed % 7))),
    ...contentByMood[mood],
  };
}

export default function MoodPhotoUpload() {
  const [phase, setPhase] = useState('camera'); // camera | preview | result
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [cameraError, setCameraError] = useState(null);
  const [streamObj, setStreamObj] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Assign stream to video element once both are ready
  useEffect(() => {
    if (streamObj && videoRef.current) {
      videoRef.current.srcObject = streamObj;
      videoRef.current.play().catch(() => {});
    }
  }, [streamObj]);

  // Start camera when phase = camera or facingMode changes
  useEffect(() => {
    if (phase !== 'camera') {
      setStreamObj(null);
      return;
    }

    let cancelled = false;
    setCameraError(null);

    navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(s => {
      if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
      setStreamObj(s);
    }).catch(() => {
      if (!cancelled) setCameraError('Camera access denied. Please allow camera permission and try again.');
    });

    return () => {
      cancelled = true;
      setStreamObj(prev => { prev?.getTracks().forEach(t => t.stop()); return null; });
    };
  }, [phase, facingMode]);

  const flipCamera = () => setFacingMode(prev => prev === 'user' ? 'environment' : 'user');

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.85));
    setPhase('preview');
    streamObj?.getTracks().forEach(t => t.stop());
    setStreamObj(null);
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    setLoading(true);
    const signals = await extractPhotoSignals(capturedImage);
    const localAnalysis = normalizeCameraResult(buildLocalCameraFallback(capturedImage, signals));
    try {
      const faceMood = await detectFaceMood(capturedImage);
      const result = await aiApi.cameraMood({
        imageUrl: capturedImage,
        userEmail: 'anonymous',
        faceSignals: {
          faceExpression: faceMood?.faceExpression || localAnalysis.detected_mood,
          moodHint: faceMood?.moodHint || '',
          fallbackMoodHint: localAnalysis.detected_mood,
          fallbackConfidence: localAnalysis.mood_confidence / 100,
          detectionConfidence: faceMood?.detectionConfidence ?? 0,
          expressions: faceMood?.allExpressions || {},
        },
        faceExpression: faceMood?.faceExpression || localAnalysis.detected_mood || '',
      });
      const apiAnalysis = normalizeCameraResult(result);
      setAnalysis(apiAnalysis);
      setPhase('result');
    } catch (error) {
      setAnalysis(normalizeCameraResult(buildLocalCameraFallback(capturedImage, signals)));
      setPhase('result');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setCapturedImage(null); setAnalysis(null); setPhase('camera'); };

  return (
    <div className="p-4 md:p-10 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
              <Camera className="w-7 h-7 text-pink-500" /> Camera Mood Analysis
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Take a photo — AI analyzes your emotional state</p>
          </div>
          {phase !== 'camera' && (
            <Button variant="ghost" onClick={reset} className="rounded-xl gap-2">
              <RotateCcw className="w-4 h-4" /> Retake
            </Button>
          )}
        </div>

        {/* CAMERA PHASE */}
        {phase === 'camera' && (
          <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
            {cameraError ? (
              <div className="h-72 flex flex-col items-center justify-center gap-4 text-center p-6">
                <Camera className="w-14 h-14 text-gray-300" />
                <p className="text-gray-500 text-sm">{cameraError}</p>
                <Button onClick={() => { setCameraError(null); setPhase('camera'); setStreamObj(null); }} className="rounded-xl">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="relative bg-black">
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className="w-full"
                  style={{
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                    maxHeight: '450px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewfinder overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-8 border-2 border-white/30 rounded-2xl" />
                  <div className="absolute top-10 left-10 w-5 h-5 border-l-2 border-t-2 border-white rounded-tl" />
                  <div className="absolute top-10 right-10 w-5 h-5 border-r-2 border-t-2 border-white rounded-tr" />
                  <div className="absolute bottom-20 left-10 w-5 h-5 border-l-2 border-b-2 border-white rounded-bl" />
                  <div className="absolute bottom-20 right-10 w-5 h-5 border-r-2 border-b-2 border-white rounded-br" />
                </div>

                {/* Camera controls */}
                <div className="absolute bottom-0 left-0 right-0 p-5 flex items-center justify-center gap-8 bg-gradient-to-t from-black/70 to-transparent">
                  <button onClick={flipCamera}
                    className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                    <FlipHorizontal className="w-5 h-5" />
                  </button>
                  <button onClick={capturePhoto}
                    className="w-18 h-18 rounded-full bg-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
                    style={{ width: 70, height: 70 }}>
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" />
                  </button>
                  <div className="w-11 h-11" />
                </div>

                {!streamObj && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <p className="text-center text-xs text-gray-400 py-3 px-4">
              Point the camera at yourself or anything that represents your mood
            </p>
          </div>
        )}

        {/* PREVIEW PHASE */}
        {phase === 'preview' && capturedImage && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
              <img src={capturedImage} alt="Captured" className="w-full object-cover max-h-96" />
            </div>
            <Button onClick={analyzeImage} disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl py-5 text-base font-semibold shadow-xl shadow-pink-500/20">
              {loading
                ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing your photo...</>
                : <><Sparkles className="w-5 h-5 mr-2" /> Analyze Mood</>
              }
            </Button>
          </motion.div>
        )}

        {/* RESULT PHASE */}
        {phase === 'result' && analysis && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className={`rounded-3xl bg-gradient-to-br ${moodGradients[analysis.detected_mood] || 'from-purple-400 to-teal-500'} p-8 text-white text-center shadow-2xl`}>
                <p className="text-5xl mb-3">{moodEmoji[analysis.detected_mood] || '🎨'}</p>
                <h2 className="text-2xl font-bold capitalize mb-1">{analysis.detected_mood}</h2>
                <p className="text-white/80 text-sm">{analysis.mood_confidence}% confidence</p>
              </div>
              {capturedImage && (
                <div className="glass-card rounded-2xl overflow-hidden">
                  <img src={capturedImage} alt="Your mood" className="w-full max-h-48 object-cover" />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card rounded-2xl p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">🎨 Color Analysis</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.color_analysis}</p>
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">✨ Atmosphere</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.atmosphere}</p>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">💭 Emotional Story</p>
                <p className="text-gray-700 dark:text-gray-300">{analysis.emotional_story}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-5 border border-purple-100 dark:border-purple-800">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-2">💜 Reflection for You</p>
                <p className="text-gray-700 dark:text-gray-300 italic">"{analysis.reflection}"</p>
              </div>
              {analysis.suggested_activity && (
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-4 border border-teal-100 dark:border-teal-800">
                  <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">💡 Suggested: {analysis.suggested_activity}</p>
                </div>
              )}
              <Button onClick={reset} variant="outline" className="w-full rounded-2xl py-4 border-2">
                <Camera className="w-4 h-4 mr-2" /> Take Another Photo
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}