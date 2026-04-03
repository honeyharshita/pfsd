import React, { useState } from 'react';
import { localApi } from '@/api/localApiClient';
import { aiApi } from '../api/aiInsightsClient';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, Brain, AlertTriangle, Shield, Loader2, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

function buildLocalTriggerAnalysis({ description = '', notes = [], journalContents = [], moodDistribution = {} } = {}) {
  const text = [description, ...(Array.isArray(notes) ? notes : []), ...(Array.isArray(journalContents) ? journalContents : [])]
    .join(' ')
    .toLowerCase();

  const triggerRules = [
    {
      category: 'workload',
      trigger: 'Too many tasks, deadlines, or exams',
      regex: /too many tasks|overwhelm|deadline|busy|pressure|workload|multitask|too much|exam|exams|test|quiz|assignment|homework|study load/g,
      associated_mood: 'anxious',
      severity: 'high',
      frequency: 'frequent',
      strategy: 'Break work into one task at a time and set a hard stop for the day.',
      quick_tip: 'Pick one priority and ignore the rest until it is finished.',
    },
    {
      category: 'social',
      trigger: 'Meetings or social performance',
      regex: /meeting|meetings|present|presentation|call|interview|crowd|public|speaking|social|group|class discussion|networking/g,
      associated_mood: 'anxious',
      severity: 'medium',
      frequency: 'occasional',
      strategy: 'Use a short grounding ritual before social or performance situations.',
      quick_tip: 'Take 3 slow breaths before you enter the room or call.',
    },
    {
      category: 'social',
      trigger: 'Not participating or feeling left out in activities',
      regex: /not participating|participation|left out|excluded|did not join|didn't join|not included|missing out|could not join|game|games|activity|activities|sports/g,
      associated_mood: 'sad',
      severity: 'medium',
      frequency: 'occasional',
      strategy: 'Choose one small activity to join this week and prepare a simple first step ahead of time.',
      quick_tip: 'Start with one low-pressure group activity and stay for at least 10 minutes.',
    },
    {
      category: 'people',
      trigger: 'Feeling ignored, dismissed, or unsupported in relationships',
      regex: /ignored|alone|left out|unsupported|unseen|rejected|unimportant|nobody cares|dismissed|not cared for|relationship|friendship|family conflict|partner/g,
      associated_mood: 'sad',
      severity: 'high',
      frequency: 'frequent',
      strategy: 'Reach out to one trusted person and name the feeling directly.',
      quick_tip: 'Text one person before you spiral into silence.',
    },
    {
      category: 'people',
      trigger: 'Conflict or criticism',
      regex: /argue|fight|critic|blame|conflict|yell|anger|mad|frustrat|irritat/g,
      associated_mood: 'angry',
      severity: 'medium',
      frequency: 'occasional',
      strategy: 'Pause before responding and leave space between the trigger and your reply.',
      quick_tip: 'Do not answer immediately if your body feels hot or tense.',
    },
    {
      category: 'change',
      trigger: 'Uncertainty or change',
      regex: /uncertain|unknown|change|new|transition|future|unstable|unsure|risk/g,
      associated_mood: 'anxious',
      severity: 'medium',
      frequency: 'frequent',
      strategy: 'Create a small plan for the next 24 hours instead of solving everything at once.',
      quick_tip: 'Focus only on the next step, not the whole future.',
    },
    {
      category: 'sleep',
      trigger: 'Low rest or burnout',
      regex: /tired|exhaust|drain|burnout|sleep|rest|fatigue|worn out|no energy/g,
      associated_mood: 'stressed',
      severity: 'high',
      frequency: 'frequent',
      strategy: 'Reduce demand, protect sleep, and avoid stacking hard tasks back to back.',
      quick_tip: 'A short pause now can prevent a bigger crash later.',
    },
  ];

  const topTriggers = [];
  const preventionStrategies = [];
  const copingStrategies = [];
  const categorizedTriggers = {
    workload: [],
    social: [],
    people: [],
    sleep: [],
    change: [],
  };

  triggerRules.forEach((rule) => {
    const matches = text.match(rule.regex) || [];
    if (matches.length === 0) {
      return;
    }

    const frequency = matches.length >= 3 ? 'very frequent' : matches.length === 2 ? 'frequent' : rule.frequency;
    const severity = matches.length >= 3 ? 'high' : rule.severity;
    const entry = {
      trigger: rule.trigger,
      frequency,
      severity,
      associated_mood: rule.associated_mood,
    };

    topTriggers.push(entry);
    categorizedTriggers[rule.category].push(entry);
    preventionStrategies.push({
      trigger: rule.trigger,
      strategy: rule.strategy,
      quick_tip: rule.quick_tip,
    });
    copingStrategies.push(rule.quick_tip);
  });

  const positiveTriggers = [];
  if (/exercise|walk|move|workout|gym|stretch/.test(text)) positiveTriggers.push('Exercise or movement');
  if (/family|friend|support|partner|talk|connect/.test(text)) positiveTriggers.push('Time with supportive family or friends');
  if (/sleep|rest|bed|nap|tired but rested/.test(text)) positiveTriggers.push('Getting enough sleep');
  if (/done|finished|accomplish|complete|progress/.test(text)) positiveTriggers.push('Finishing one clear task');
  if (/walk|outside|fresh air|nature/.test(text)) positiveTriggers.push('Fresh air or a walk');
  if (/quiet|calm|alone time|peace|peaceful/.test(text)) positiveTriggers.push('Quiet time without interruptions');

  const negativeSignals = (text.match(/stress|anxious|panic|overwhelm|sad|down|lonely|ignored|tired|exhaust|burnout|angry|frustrat|irritat|exam|deadline/g) || []).length;
  const positiveSignals = (text.match(/exercise|good|calm|supported|helped|progress|relaxed|peaceful|rested/g) || []).length;
  const sentenceChunks = description
    .split(/[.!?\n]+/)
    .map((piece) => piece.trim())
    .filter(Boolean);

  const overallAssessment = topTriggers.length > 0
    ? `Your main trigger pattern is ${topTriggers.slice(0, 2).map((item) => item.trigger.toLowerCase()).join(' and ')}. ${positiveTriggers.length > 0 ? 'You also have some helpful positive triggers to lean on.' : 'Focus on preventing overload early.'}`
    : description.trim()
      ? 'Your description suggests a mixed but manageable pattern. No strong trigger repeated often enough to dominate, so the context matters more than a single event.'
      : 'There is not enough detail yet. Add a few specific situations, emotions, or body signals and the analysis will become sharper.';

  const assessedChallenges = Math.max(0, Math.min(7, topTriggers.length + (negativeSignals > positiveSignals ? 1 : 0) + (/(exam|test|quiz|assignment|homework|deadline)/.test(text) ? 1 : 0)));
  const analyzedNotes = Math.max(0, Math.min(20, (Array.isArray(notes) ? notes.length : 0) + (sentenceChunks.length > 0 ? sentenceChunks.length : 0) + (topTriggers.length > 0 ? topTriggers.length : 0)));
  const analyzedJournalEntries = Math.max(0, Math.min(20, (Array.isArray(journalContents) ? journalContents.length : 0)));

  return {
    top_triggers: topTriggers.slice(0, 5),
    triggers: topTriggers.slice(0, 5),
    categorized_triggers: {
      workload: categorizedTriggers.workload.slice(0, 5),
      social: categorizedTriggers.social.slice(0, 5),
      people: categorizedTriggers.people.slice(0, 5),
      sleep: categorizedTriggers.sleep.slice(0, 5),
      change: categorizedTriggers.change.slice(0, 5),
    },
    patterns: sentenceChunks.length > 0
      ? ['Your description is the strongest signal.']
      : [],
    prevention_strategies: preventionStrategies.slice(0, 5),
    coping_strategies: copingStrategies.slice(0, 5),
    positive_triggers: positiveTriggers.slice(0, 6),
    overall_assessment: overallAssessment,
    challenging_days: assessedChallenges,
    notes_analyzed: analyzedNotes,
    journal_entries: analyzedJournalEntries,
    source_text_used: Boolean(description.trim() || notes.length || journalContents.length),
    source_summary: description.trim()
      ? `Using your description: "${description.trim().slice(0, 120)}${description.trim().length > 120 ? '...' : ''}"`
      : 'Using mood and journal history because no description was entered.',
    mood_distribution: moodDistribution,
  };
}

export default function EmotionTrigger() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selfDescription, setSelfDescription] = useState('');

  const { data: moods = [] } = useQuery({
    queryKey: ['triggerMoods'],
    queryFn: async () => {
      const json = await localApi.entities.list('MoodEntry', '-date', 50);
      return json?.data || [];
    },
  });

  const { data: journals = [] } = useQuery({
    queryKey: ['triggerJournals'],
    queryFn: async () => {
      const json = await localApi.entities.list('JournalEntry', '-date', 30);
      return json?.data || [];
    },
  });

  const negativeMoods = moods.filter(m => ['stressed', 'sad', 'angry', 'anxious'].includes(m.mood));
  const notes = moods.filter(m => m.note).map(m => `${m.mood}: ${m.note}`);
  const journalContents = journals.slice(0, 5).map(j => j.content);
  const descriptionSignals = selfDescription.trim() ? selfDescription.trim().split(/\s+/).length : 0;
  const previewChallengingDays = analysis?.challenging_days ?? (selfDescription.trim() ? Math.max(1, /stress|anxious|worr|panic|overwhelm|exam|test|quiz|deadline|too many/.test(selfDescription.toLowerCase()) ? 2 : 1) : negativeMoods.length);
  const previewNotesAnalyzed = analysis?.notes_analyzed ?? (notes.length || descriptionSignals ? Math.max(1, notes.length + (descriptionSignals > 0 ? 1 : 0)) : 0);
  const previewJournalEntries = analysis?.journal_entries ?? journals.length;
  const categorySummary = analysis?.category_summary || {};
  const dominantCategory = analysis?.dominant_category || 'mixed';

  const analyze = async () => {
    setLoading(true);
    setError('');
    try {
      const moodDistribution = moods.reduce((acc, m) => {
        acc[m.mood] = (acc[m.mood] || 0) + 1;
        return acc;
      }, {});

      const localDescriptionAnalysis = buildLocalTriggerAnalysis({
        description: selfDescription,
        notes: notes.slice(0, 15),
        journalContents,
        moodDistribution,
      });

      const result = await aiApi.triggerAnalyzer({
        description: selfDescription,
        notes: notes.slice(0, 15),
        journalContents,
        moodDistribution,
      });

      // If user entered a description, trust description-first analysis so output stays aligned
      // with current text even when backend responds with generic historical patterns.
      if (selfDescription.trim()) {
        const merged = {
          ...result,
          ...localDescriptionAnalysis,
          source_mode: 'description-first-ui',
        };
        setAnalysis(merged);
      } else {
        setAnalysis(result);
      }
    } catch (error) {
      const moodDistribution = moods.reduce((acc, m) => {
        acc[m.mood] = (acc[m.mood] || 0) + 1;
        return acc;
      }, {});

      setError(error?.message || 'The AI service is unavailable right now. Showing a local analysis instead.');
      setAnalysis(buildLocalTriggerAnalysis({
        description: selfDescription,
        notes: notes.slice(0, 15),
        journalContents,
        moodDistribution,
      }));
    } finally {
      setLoading(false);
    }
  };

  const frequencyColor = { rare: 'text-green-500', occasional: 'text-yellow-500', frequent: 'text-orange-500', 'very frequent': 'text-red-500' };
  const severityBg = { low: 'bg-green-50 dark:bg-green-900/20', medium: 'bg-yellow-50 dark:bg-yellow-900/20', high: 'bg-red-50 dark:bg-red-900/20' };
  const categoryTitles = {
    workload: 'Workload',
    social: 'Social Situations',
    people: 'People / Relationships',
    sleep: 'Sleep / Energy',
    change: 'Change / Uncertainty',
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" /> Emotion Trigger Analyzer
          </h1>
          <p className="text-gray-500 mt-1">AI identifies what causes your emotional shifts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{previewChallengingDays}</p>
            <p className="text-xs text-gray-500">Challenging Days</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-teal-500">{previewNotesAnalyzed}</p>
            <p className="text-xs text-gray-500">Notes Analyzed</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-500">{previewJournalEntries}</p>
            <p className="text-xs text-gray-500">Journal Entries</p>
          </div>
        </div>

        {/* Self description input */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Brain className="w-5 h-5 text-yellow-500" /> Describe Your Emotional Patterns
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Tell the AI about situations that upset or stress you — this helps even without tracked data.
          </p>
          <Textarea
            value={selfDescription}
            onChange={e => setSelfDescription(e.target.value)}
            placeholder="e.g. 'I get anxious before meetings, feel stressed when I have too many tasks, feel sad when I'm ignored by friends, feel great after exercise or spending time with family...'"
            className="rounded-xl min-h-[100px] text-sm"
          />
        </div>

        <Button onClick={analyze} disabled={loading}
          type="button"
          className="w-full mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-90 rounded-xl py-4 text-white font-semibold text-lg">
          {loading
            ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing your emotional patterns...</>
            : <><Brain className="w-5 h-5 mr-2" /> Analyze My Triggers</>
          }
        </Button>

        {error && (
          <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-800/50 dark:bg-yellow-900/20 dark:text-yellow-300">
            {error}
          </div>
        )}

        {analysis?.category_summary && (
          <div className="glass-card rounded-2xl p-5 mb-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Category Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
              {[
                ['workload', 'Workload'],
                ['social', 'Social'],
                ['people', 'People/Relationships'],
                ['sleep', 'Sleep/Energy'],
                ['change', 'Change'],
              ].map(([key, label]) => (
                <div key={key} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{categorySummary[key] || 0}</p>
                  <p className="text-[11px] text-gray-500">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500 capitalize">
              Dominant category: {dominantCategory.replace('_', ' ')}
            </p>
          </div>
        )}

        {analysis && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-100 dark:border-yellow-800">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2">🔍 Overall Assessment</p>
              <p className="text-gray-700 dark:text-gray-300">{analysis.overall_assessment}</p>
            </div>

            {analysis.top_triggers?.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" /> Identified Triggers
                </h3>
                <div className="space-y-3">
                  {analysis.top_triggers.map((t, i) => (
                    <div key={i} className={`rounded-xl p-4 ${severityBg[t.severity] || 'bg-gray-50 dark:bg-gray-800/50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-100">{t.trigger}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Associated with: <span className="capitalize">{t.associated_mood}</span></p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-semibold capitalize ${frequencyColor[t.frequency]}`}>{t.frequency}</p>
                          <p className="text-xs text-gray-400 capitalize">{t.severity} severity</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.categorized_triggers && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(categoryTitles).map(([key, title]) => {
                  const items = analysis.categorized_triggers[key] || [];
                  return (
                    <div key={key} className="glass-card rounded-2xl p-5">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
                        {title}
                      </h3>
                      {items.length > 0 ? (
                        <div className="space-y-2">
                          {items.map((item, index) => (
                            <div key={index} className={`rounded-xl p-3 ${severityBg[item.severity] || 'bg-gray-50 dark:bg-gray-800/50'}`}>
                              <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{item.trigger}</p>
                              <p className="text-xs text-gray-500 mt-1 capitalize">
                                {item.frequency} · {item.severity} severity · {item.associated_mood}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No strong triggers detected in this category yet.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {analysis.prevention_strategies?.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-500" /> Prevention Strategies
                </h3>
                <div className="space-y-4">
                  {analysis.prevention_strategies.map((s, i) => (
                    <div key={i} className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4">
                      <p className="font-medium text-teal-800 dark:text-teal-300 text-sm mb-1">For: {s.trigger}</p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">{s.strategy}</p>
                      <p className="text-teal-600 dark:text-teal-400 text-xs mt-2 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" /> Quick tip: {s.quick_tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.positive_triggers?.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" /> Positive Triggers — Do More!
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.positive_triggers.map((t, i) => (
                    <span key={i} className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                      ✨ {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}