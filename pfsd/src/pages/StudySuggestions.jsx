import React, { useState } from 'react';
import { aiApi } from '@/api/aiInsightsClient';
import { motion } from 'framer-motion';
import { GraduationCap, Loader2, Clock, Brain, Zap, Coffee, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/shared/LanguageContext';
import { cn } from '@/lib/utils';

const moods = [
  { key: 'stressed', emoji: '😰', label: 'Stressed', color: 'from-orange-400 to-red-500' },
  { key: 'anxious', emoji: '😟', label: 'Anxious', color: 'from-amber-400 to-orange-500' },
  { key: 'sad', emoji: '😢', label: 'Sad', color: 'from-indigo-400 to-blue-500' },
  { key: 'tired', emoji: '😴', label: 'Tired', color: 'from-gray-400 to-slate-500' },
  { key: 'distracted', emoji: '😵', label: 'Distracted', color: 'from-purple-400 to-violet-500' },
  { key: 'motivated', emoji: '💪', label: 'Motivated', color: 'from-green-400 to-teal-500' },
  { key: 'happy', emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-amber-500' },
];

function hashText(input = '') {
  const text = String(input || '');
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function detectSubjectTrack(subject = '') {
  const s = String(subject || '').toLowerCase();
  if (/math|algebra|calculus|geometry|statistics/.test(s)) return 'math';
  if (/physics|chemistry|biology|science|lab/.test(s)) return 'science';
  if (/history|civics|geography|politic|economics/.test(s)) return 'humanities';
  if (/program|coding|javascript|python|java|react|algorithm|data structure/.test(s)) return 'programming';
  if (/english|language|grammar|writing|essay|literature/.test(s)) return 'language';
  if (/exam|test|revision|final|board/.test(s)) return 'exam';
  return 'general';
}

function buildLocalStudyPlan(moodKey = 'neutral', subject = 'general') {
  const track = detectSubjectTrack(subject);
  const seed = hashText(`${moodKey}|${subject}`);

  const trackBlueprints = {
    math: {
      technique: ['Worked Example Ladder', 'Error Log Loop', 'Problem Stack Sprint'],
      core: 'Solve in increasing difficulty: concept warm-up, guided problems, then timed application.',
      techniques: [
        { name: 'Concept Snapshot', emoji: '🧠', description: 'Write formulas and one solved example before attempts.', duration: 12 },
        { name: 'Timed Problem Blocks', emoji: '⏱️', description: 'Do short timed sets to build speed and accuracy.', duration: 20 },
        { name: 'Mistake Journal', emoji: '📝', description: 'Track repeated errors and rewrite corrected steps.', duration: 10 },
      ],
      wins: ['Finish 5 targeted problems', 'Correct one repeated mistake pattern', 'Summarize one formula family'],
    },
    science: {
      technique: ['Diagram + Recall Cycle', 'Teach-Back Science Loop', 'Concept-to-Question Bridge'],
      core: 'Switch between visual diagrams, active recall, and short explanation drills.',
      techniques: [
        { name: 'Diagram Mapping', emoji: '🧪', description: 'Convert the chapter into quick process diagrams.', duration: 15 },
        { name: 'Why-How Cards', emoji: '🧩', description: 'Use flashcards that force causal explanations.', duration: 18 },
        { name: 'Mini Oral Explain', emoji: '🎙️', description: 'Explain one topic aloud in 90 seconds.', duration: 8 },
      ],
      wins: ['Master one process flow', 'Answer 10 recall prompts', 'Explain one complex concept aloud'],
    },
    humanities: {
      technique: ['Theme Timeline Method', 'PEEL Paragraph Drill', 'Compare-and-Connect Review'],
      core: 'Study by themes and causes, not isolated facts, then practice concise written recall.',
      techniques: [
        { name: 'Theme Timeline', emoji: '📚', description: 'Map events by cause-effect and turning points.', duration: 18 },
        { name: 'PEEL Burst', emoji: '✍️', description: 'Write one evidence-based paragraph per key theme.', duration: 16 },
        { name: 'Comparison Grid', emoji: '🗂️', description: 'Compare two chapters in a quick table.', duration: 10 },
      ],
      wins: ['Finish one timeline', 'Write two PEEL paragraphs', 'Review one comparison grid'],
    },
    programming: {
      technique: ['Code-Run-Explain Loop', 'Bug Hunt Practice', 'Build Tiny Feature Sprint'],
      core: 'Alternate coding, debugging, and explanation to convert passive understanding into skill.',
      techniques: [
        { name: 'Focused Coding Sprint', emoji: '💻', description: 'Implement one function without switching tabs.', duration: 25 },
        { name: 'Debug Replay', emoji: '🐞', description: 'Fix one bug and write the root cause in one line.', duration: 15 },
        { name: 'Explain to Rubber Duck', emoji: '🦆', description: 'Explain logic flow out loud from input to output.', duration: 8 },
      ],
      wins: ['Complete one mini feature', 'Fix one real bug', 'Document one reusable pattern'],
    },
    language: {
      technique: ['Read-Speak-Write Stack', 'Vocabulary in Context', 'Active Recall Grammar Loop'],
      core: 'Use short cycles: read, speak, and write to reinforce memory from multiple channels.',
      techniques: [
        { name: 'Shadow Reading', emoji: '🗣️', description: 'Read and repeat short passages with pacing.', duration: 12 },
        { name: 'Context Vocab', emoji: '📖', description: 'Learn words through sentence usage, not lists.', duration: 15 },
        { name: 'Grammar Quick Fix', emoji: '✅', description: 'Practice one grammar rule with 10 examples.', duration: 10 },
      ],
      wins: ['Use 10 new words in context', 'Record one spoken summary', 'Correct one grammar weakness'],
    },
    exam: {
      technique: ['Mock + Review Loop', 'Weak Area First Pass', 'Pressure Simulation Drill'],
      core: 'Simulate exam pressure briefly, then spend most time reviewing mistakes deeply.',
      techniques: [
        { name: 'Mini Mock Test', emoji: '🧾', description: 'Attempt a short timed paper segment.', duration: 25 },
        { name: 'Error Review', emoji: '🔍', description: 'Categorize mistakes: concept, speed, or reading.', duration: 15 },
        { name: 'Recovery Drill', emoji: '♻️', description: 'Redo wrong questions without notes.', duration: 12 },
      ],
      wins: ['Finish one timed section', 'Fix top 3 weak points', 'Raise accuracy on reattempt'],
    },
    general: {
      technique: ['Focus Block Planner', 'Recall + Notes Loop', 'One Goal Session'],
      core: 'Use a clear goal, active recall, and a small review loop to keep momentum.',
      techniques: [
        { name: 'Goal Lock-In', emoji: '🎯', description: 'Define one measurable study output before starting.', duration: 8 },
        { name: 'Deep Focus Block', emoji: '🧠', description: 'Single-task with distractions removed.', duration: 25 },
        { name: 'Review Snapshot', emoji: '📌', description: 'Summarize key points in 5 lines.', duration: 10 },
      ],
      wins: ['Finish one defined output', 'Avoid context-switching', 'Write short end-of-session summary'],
    },
  };

  const moodAdjustments = {
    stressed: { focus: 18, breakLen: 7, mindset: 'Lower pressure by narrowing scope to one target at a time.' },
    anxious: { focus: 16, breakLen: 6, mindset: 'Use grounding before each block and keep tasks very concrete.' },
    sad: { focus: 20, breakLen: 8, mindset: 'Start small and celebrate completion, not intensity.' },
    tired: { focus: 14, breakLen: 6, mindset: 'Use shorter cycles and active methods to avoid mental drift.' },
    distracted: { focus: 12, breakLen: 5, mindset: 'Use strict short timers and one-tab focus only.' },
    motivated: { focus: 28, breakLen: 6, mindset: 'Use your momentum on the hardest topic first.' },
    happy: { focus: 24, breakLen: 6, mindset: 'Convert positive energy into deep, structured work.' },
  };

  const blueprint = trackBlueprints[track] || trackBlueprints.general;
  const moodPlan = moodAdjustments[moodKey] || { focus: 22, breakLen: 6, mindset: 'Keep a steady pace and complete one key objective.' };
  const techniqueName = blueprint.technique[seed % blueprint.technique.length];

  const sessionStructure = [
    { phase: 'Settle + Setup', duration: 5, activity: `Clear workspace and define one output for ${subject || 'this session'}.` },
    { phase: 'Focus Block 1', duration: moodPlan.focus, activity: blueprint.core },
    { phase: 'Recovery Break', duration: moodPlan.breakLen, activity: 'Stand up, hydrate, no scrolling.' },
    { phase: 'Focus Block 2', duration: Math.max(10, moodPlan.focus - 2), activity: 'Practice or recall without looking at notes first.' },
    { phase: 'Quick Review', duration: 7, activity: 'Write key takeaways and next step for tomorrow.' },
  ];

  const rotatedTechniques = blueprint.techniques
    .map((item, idx) => ({ ...item, duration_minutes: Math.max(6, item.duration + ((seed + idx) % 5) - 2) }))
    .sort((a, b) => ((a.name.length + seed) % 7) - ((b.name.length + seed) % 7));

  return {
    main_technique: `${techniqueName} (${(subject || track).toUpperCase()})`,
    main_description: `${blueprint.core} This plan is adjusted for a ${moodKey} state so you can stay consistent without burnout.`,
    session_structure: sessionStructure,
    techniques: rotatedTechniques,
    environment_tips: [
      'Keep only the required material on your desk.',
      moodKey === 'distracted' ? 'Put phone in another room during focus blocks.' : 'Use full-screen mode and block notifications.',
      track === 'programming' ? 'Keep terminal and editor only; close extra tabs.' : 'Use one notebook page per concept to reduce clutter.',
    ],
    mindset_tip: moodPlan.mindset,
    quick_wins: blueprint.wins,
  };
}

function moodTuning(moodKey = 'neutral') {
  const map = {
    stressed: {
      durationFactor: 0.78,
      techniquePrefix: 'Decompression',
      quickWins: ['Finish one focused block without rushing', 'Close all non-essential tabs', 'Complete one must-do task'],
      mindset: 'Keep the bar realistic today: consistency over intensity.'
    },
    anxious: {
      durationFactor: 0.72,
      techniquePrefix: 'Grounding',
      quickWins: ['Start with a 60-second grounding reset', 'Complete one simple concrete output', 'Do one confidence rebuild question'],
      mindset: 'Reduce uncertainty by turning tasks into concrete micro-steps.'
    },
    sad: {
      durationFactor: 0.82,
      techniquePrefix: 'Gentle Start',
      quickWins: ['Open materials and complete 10 minutes', 'Finish one easy section first', 'Write one supportive self-note after study'],
      mindset: 'Small wins still count. Start gently and keep momentum kind.'
    },
    tired: {
      durationFactor: 0.68,
      techniquePrefix: 'Low-Energy',
      quickWins: ['Use two short focus cycles', 'Stand/stretch during breaks', 'Review key points verbally'],
      mindset: 'Short, active cycles beat long passive reading when energy is low.'
    },
    distracted: {
      durationFactor: 0.62,
      techniquePrefix: 'Attention Lock',
      quickWins: ['Phone out of reach', 'One-tab focus for first block', 'Complete one task before context-switching'],
      mindset: 'Protect attention first, then content mastery follows.'
    },
    motivated: {
      durationFactor: 1.18,
      techniquePrefix: 'Momentum',
      quickWins: ['Tackle hardest topic first', 'Finish one stretch challenge', 'End with quick revision loop'],
      mindset: 'Use this momentum on high-value problems while energy is strong.'
    },
    happy: {
      durationFactor: 1.08,
      techniquePrefix: 'Flow',
      quickWins: ['Convert positive energy into deep work', 'Complete one full cycle from learn to recall', 'Log one achievement from today'],
      mindset: 'Channel your positive state into sustained focused output.'
    },
    neutral: {
      durationFactor: 1.0,
      techniquePrefix: 'Steady',
      quickWins: ['Complete planned blocks', 'Summarize key points in 5 lines', 'Set first task for next session'],
      mindset: 'Steady rhythm is your advantage right now.'
    },
  };
  return map[moodKey] || map.neutral;
}

function normalizeStudyResult(raw, moodKey, subject) {
  const localPlan = buildLocalStudyPlan(moodKey, subject);
  const tuning = moodTuning(moodKey);
  const moodLabel = moodKey ? moodKey.charAt(0).toUpperCase() + moodKey.slice(1) : 'Current';
  const subjectLabel = (subject || detectSubjectTrack(subject)).toUpperCase();
  const applyDuration = (value, min = 6) => Math.max(min, Math.round(Number(value || 12) * tuning.durationFactor));

  if (raw?.main_technique && raw?.techniques) {
    const baseStructure = Array.isArray(raw.session_structure) && raw.session_structure.length > 0
      ? raw.session_structure
      : localPlan.session_structure;

    return {
      main_technique: `${tuning.techniquePrefix} ${raw.main_technique} (${subjectLabel})`,
      main_description: `${raw.main_description || localPlan.main_description} Mood mode: ${moodLabel}. ${tuning.mindset}`,
      session_structure: baseStructure.map((phase, idx) => ({
        phase: phase.phase || `Phase ${idx + 1}`,
        duration: applyDuration(phase.duration || 20),
        activity: `${phase.activity || localPlan.session_structure[idx % localPlan.session_structure.length].activity}`,
      })),
      techniques: (Array.isArray(raw.techniques) && raw.techniques.length > 0 ? raw.techniques : localPlan.techniques).map((tech, idx) => ({
        ...tech,
        name: `${tuning.techniquePrefix} ${tech.name || `Technique ${idx + 1}`}`,
        duration_minutes: applyDuration(tech.duration_minutes || 12),
      })),
      environment_tips: [
        ...(Array.isArray(raw.environment_tips) ? raw.environment_tips.slice(0, 2) : []),
        ...localPlan.environment_tips.slice(0, 2),
      ].slice(0, 4),
      mindset_tip: `${raw.mindset_tip || localPlan.mindset_tip} ${tuning.mindset}`,
      quick_wins: [...tuning.quickWins, ...(Array.isArray(raw.quick_wins) ? raw.quick_wins.slice(0, 2) : [])].slice(0, 4),
    };
  }

  if (raw?.study_plan || raw?.technique || raw?.schedule || raw?.tips) {
    const plan = raw.study_plan || {};
    const baseSchedule = Array.isArray(plan.schedule) ? plan.schedule : Array.isArray(raw.schedule) ? raw.schedule : [];
    const session_structure = baseSchedule.length > 0
      ? baseSchedule.map((item, idx) => ({
          phase: item.phase || `Session ${item.session || idx + 1}`,
          duration: Number(String(item.study || item.duration || '25').match(/\d+/)?.[0] || 25),
          activity: item.activity || `Study: ${item.study || '25 min'} | Break: ${item.break || '5 min'}`,
        }))
      : localPlan.session_structure;

    const tips = Array.isArray(raw.tips) ? raw.tips : [];
    const techniques = tips.slice(0, 3).map((tip, idx) => ({
      name: ['Focus Drill', 'Recall Sprint', 'Review Reset'][idx] || `Technique ${idx + 1}`,
      emoji: ['🎯', '🧠', '♻️'][idx] || '✨',
      description: String(tip),
      duration_minutes: [20, 15, 10][idx] || 12,
    }));

    return {
      main_technique: `${tuning.techniquePrefix} ${plan.technique || raw.technique || `Study Plan for ${subject || 'General'}`}`,
      main_description: `${raw.motivation || 'Follow this structure step by step and adjust after one cycle.'} Mood mode: ${moodLabel}.`,
      session_structure: session_structure.map((s) => ({ ...s, duration: applyDuration(s.duration || 20) })),
      techniques: (techniques.length > 0 ? techniques : localPlan.techniques).map((t, idx) => ({
        ...t,
        name: `${tuning.techniquePrefix} ${t.name || `Technique ${idx + 1}`}`,
        duration_minutes: applyDuration(t.duration_minutes || 12),
      })),
      environment_tips: ['Keep distractions away', 'Use a timer', 'Review errors before moving on', ...localPlan.environment_tips].slice(0, 4),
      mindset_tip: `${raw.motivation || 'Progress over perfection. One block at a time.'} ${tuning.mindset}`,
      quick_wins: [...tuning.quickWins, ...(Array.isArray(raw.tips) ? raw.tips.slice(0, 2) : localPlan.quick_wins.slice(0, 2))].slice(0, 4),
    };
  }

  return localPlan;
}

export default function StudySuggestions() {
  const { t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState(null);
  const [subject, setSubject] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = React.useRef(null);

  const generate = async () => {
    if (!selectedMood) return;
    setLoading(true);
    setError('');
    setSuggestions(null);

    const cleanSubject = subject.trim();
    const difficultyByMood = {
      stressed: 'easy', anxious: 'easy', sad: 'easy', tired: 'easy',
      distracted: 'medium', motivated: 'hard', happy: 'medium',
    };

    try {
      const apiPromise = aiApi.studyHelp(
        cleanSubject || 'general',
        60,
        difficultyByMood[selectedMood.key] || 'medium',
        selectedMood.key
      );
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Study API timeout')), 9000);
      });
      const raw = await Promise.race([apiPromise, timeoutPromise]);
      setSuggestions(normalizeStudyResult(raw, selectedMood.key, cleanSubject || 'general'));
    } catch (_error) {
      setSuggestions(buildLocalStudyPlan(selectedMood.key, cleanSubject || 'general'));
      setError('Using offline study planner because AI service is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (minutes) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveTimer(minutes);
    setTimeLeft(minutes * 60);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setActiveTimer(null); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-blue-500" />
            {t('studySuggestions.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('studySuggestions.subtitle')}</p>
        </div>

        {/* Active Timer */}
        {activeTimer && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white text-center mb-6">
            <p className="text-sm opacity-80 mb-1">{t('studySuggestions.focusTimer')}</p>
            <p className="text-5xl font-black">{formatTime(timeLeft)}</p>
            <Button onClick={() => { clearInterval(timerRef.current); setActiveTimer(null); }}
              variant="ghost" className="text-white/70 mt-3">{t('studySuggestions.stopTimer')}</Button>
          </motion.div>
        )}

        {/* Setup */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">{t('studySuggestions.beforeStudy')}</p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-6">
            {moods.map((mood) => (
              <motion.button key={mood.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMood(mood)}
                className={cn("flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all",
                  selectedMood?.key === mood.key
                    ? `bg-gradient-to-br ${mood.color} border-transparent`
                    : "border-gray-100 dark:border-gray-800 hover:border-blue-200")}>
                <span className="text-2xl">{mood.emoji}</span>
                <span className={cn("text-xs font-medium", selectedMood?.key === mood.key ? "text-white" : "text-gray-500")}>{mood.label}</span>
              </motion.button>
            ))}
          </div>

          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder={t('studySuggestions.subjectPlaceholder')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm mb-4" />

          <Button onClick={generate} disabled={!selectedMood || loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-3 font-semibold">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('studySuggestions.gettingSuggestions')}</> : <><Brain className="w-4 h-4 mr-2" /> {t('studySuggestions.getPlan')}</>}
          </Button>
          {error && <p className="mt-3 text-xs text-amber-500">{error}</p>}
        </div>

        {/* Results */}
        {suggestions && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 text-lg mb-2">⭐ {suggestions.main_technique}</h3>
              <p className="text-blue-700 dark:text-blue-400 text-sm">{suggestions.main_description}</p>
            </div>

            {/* Session structure */}
            {suggestions.session_structure?.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" /> {t('studySuggestions.sessionStructure')}
                </h4>
                <div className="space-y-2">
                  {suggestions.session_structure.map((phase, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className="w-16 text-center">
                        <span className="text-sm font-bold text-blue-600">{phase.duration}min</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-700 dark:text-gray-300">{phase.phase}</p>
                        <p className="text-xs text-gray-500">{phase.activity}</p>
                      </div>
                        <Button size="sm" variant="outline" onClick={() => startTimer(phase.duration)} className="text-xs rounded-lg">
                        {t('studySuggestions.start')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Techniques */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.techniques?.map((tech, i) => (
                <div key={i} className="glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{tech.emoji} {tech.name}</p>
                    <Button size="sm" onClick={() => startTimer(tech.duration_minutes)}
                      className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-xs rounded-lg">
                      {tech.duration_minutes}min
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">{tech.description}</p>
                </div>
              ))}
            </div>

            {/* Quick wins & mindset */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.quick_wins?.length > 0 && (
                <div className="glass-card rounded-2xl p-5">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">⚡ Quick Wins</h4>
                  <ul className="space-y-2">
                    {suggestions.quick_wins.map((w, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-green-500">✓</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {suggestions.mindset_tip && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-5">
                  <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-2">💜 Mindset Tip</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{suggestions.mindset_tip}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}