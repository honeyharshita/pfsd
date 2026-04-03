import React, { useState } from 'react';
import { aiApi } from '../api/aiInsightsClient';
import { motion } from 'framer-motion';
import { Scale, Plus, Loader2, CheckCircle, Brain, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function DecisionHelper() {
  const [situation, setSituation] = useState('');
  const [options, setOptions] = useState([
    { name: '', pros: [''], cons: [''] },
    { name: '', pros: [''], cons: [''] },
  ]);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const updateOption = (optIdx, field, val) => {
    setOptions(prev => { const u = [...prev]; u[optIdx] = { ...u[optIdx], [field]: val }; return u; });
  };

  const updateListItem = (optIdx, listField, itemIdx, val) => {
    setOptions(prev => {
      const u = [...prev];
      const list = [...u[optIdx][listField]];
      list[itemIdx] = val;
      u[optIdx] = { ...u[optIdx], [listField]: list };
      return u;
    });
  };

  const addListItem = (optIdx, listField) => {
    setOptions(prev => {
      const u = [...prev];
      u[optIdx] = { ...u[optIdx], [listField]: [...u[optIdx][listField], ''] };
      return u;
    });
  };

  const analyze = async () => {
    setLoading(true);
    setError('');
    // Auto-name empty options
    const optionsData = options.map((o, i) => ({
      name: o.name.trim() || `Option ${i + 1}`,
      pros: o.pros.filter(Boolean),
      cons: o.cons.filter(Boolean)
    }));

    try {
      const context = optionsData
        .map((o) => `Option: ${o.name}\nPros: ${o.pros.length ? o.pros.join(', ') : 'none listed'}\nCons: ${o.cons.length ? o.cons.join(', ') : 'none listed'}`)
        .join('\n\n');

      const result = await aiApi.decisionHelper({
        decision: situation,
        situation,
        context,
        options: optionsData,
        userEmail: 'anonymous',
      });

      setDecision(result);
      setStep(3);
    } catch (err) {
      setError(err?.message || 'Unable to generate decision insights right now. Please try again.');
      setDecision(null);
    } finally {
      setLoading(false);
    }
  };

  const colors = ['from-purple-400 to-indigo-500', 'from-teal-400 to-cyan-500', 'from-pink-400 to-rose-500', 'from-amber-400 to-orange-500'];

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <Scale className="w-8 h-8 text-indigo-500" /> Emotional Decision Helper
          </h1>
          <p className="text-gray-500 mt-1">AI-powered clarity for tough decisions</p>
        </div>

        {/* Steps indicator */}
        <div className="flex gap-2 mb-8">
          {['Situation', 'Options', 'AI Insight'].map((s, i) => (
            <div key={i} className={`flex-1 py-2 rounded-xl text-center text-sm font-medium transition-all ${step >= i + 1 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
              {i + 1}. {s}
            </div>
          ))}
        </div>

        {/* Step 1: Situation */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Describe your situation</h3>
            <p className="text-sm text-gray-500 mb-4">What decision are you facing? Share how you're feeling about it — be as open as you like.</p>
            <Textarea value={situation} onChange={e => setSituation(e.target.value)}
              placeholder="e.g. 'I'm nervous about choosing between two job offers. One pays more but requires relocating, the other is closer to family but lower salary. I feel torn and anxious...'"
              className="min-h-[150px] rounded-xl mb-4" />
            <Button onClick={() => setStep(2)} disabled={!situation.trim()}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl w-full py-3">
              Continue →
            </Button>
          </motion.div>
        )}

        {/* Step 2: Options */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}
            <p className="text-sm text-gray-500 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3">
              💡 Name your options and add pros/cons. Option names are optional — just fill in what you know.
            </p>
            {options.map((opt, oi) => (
              <div key={oi} className={`rounded-2xl bg-gradient-to-r ${colors[oi]} p-0.5`}>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5">
                  <Input value={opt.name} onChange={e => updateOption(oi, 'name', e.target.value)}
                    placeholder={`Option ${oi + 1} name (optional)...`}
                    className="font-semibold rounded-xl mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    {['pros', 'cons'].map(type => (
                      <div key={type}>
                        <p className={`text-xs font-bold uppercase mb-2 ${type === 'pros' ? 'text-green-600' : 'text-red-500'}`}>
                          {type === 'pros' ? '✅ Pros' : '❌ Cons'}
                        </p>
                        {opt[type].map((item, ii) => (
                          <Input key={ii} value={item} onChange={e => updateListItem(oi, type, ii, e.target.value)}
                            placeholder={`${type === 'pros' ? 'Advantage' : 'Disadvantage'} ${ii + 1}...`}
                            className="mb-2 rounded-xl text-sm h-9" />
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => addListItem(oi, type)} className="text-gray-400 text-xs w-full">
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {options.length < 4 && (
              <Button variant="outline" onClick={() => setOptions(prev => [...prev, { name: '', pros: [''], cons: [''] }])}
                className="w-full rounded-2xl border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Another Option
              </Button>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">← Back</Button>
              <Button onClick={analyze} disabled={loading}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3">
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                  : <><Brain className="w-4 h-4 mr-2" /> Get AI Insight</>
                }
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Result */}
        {step === 3 && decision && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-2">🧠 AI Analysis</p>
              <p className="text-gray-700 dark:text-gray-300">{decision.summary}</p>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Option Scores</h4>
              <div className="space-y-4">
                {decision.option_analyses?.map((opt, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-gray-700 dark:text-gray-300">{opt.option_name}</p>
                      <span className={`text-sm font-bold ${opt.score >= 7 ? 'text-green-500' : opt.score >= 5 ? 'text-yellow-500' : 'text-red-400'}`}>{opt.score}/10</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-1.5">
                      <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all" style={{ width: `${opt.score * 10}%` }} />
                    </div>
                    <p className="text-xs text-gray-500">{opt.emotional_impact}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-800">
              <Heart className="w-5 h-5 text-amber-500 mb-2" />
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">Key Question to Ask Yourself</p>
              <p className="text-amber-800 dark:text-amber-300 font-medium">"{decision.key_question}"</p>
            </div>

            {(decision.green_flags?.length > 0 || decision.red_flags?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {decision.green_flags?.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4">
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-2">✅ Green Flags</p>
                    {decision.green_flags.map((f, i) => <p key={i} className="text-sm text-gray-700 dark:text-gray-300">• {f}</p>)}
                  </div>
                )}
                {decision.red_flags?.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">🚩 Red Flags</p>
                    {decision.red_flags.map((f, i) => <p key={i} className="text-sm text-gray-700 dark:text-gray-300">• {f}</p>)}
                  </div>
                )}
              </div>
            )}

            <div className="glass-card rounded-2xl p-5">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500" /> Balanced Recommendation
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{decision.balanced_recommendation}</p>
              {decision.next_step && (
                <div className="mt-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3">
                  <p className="text-teal-700 dark:text-teal-400 text-sm font-medium">Next Step: {decision.next_step}</p>
                </div>
              )}
            </div>

            <Button
              onClick={() => { setStep(1); setSituation(''); setDecision(null); setError(''); setOptions([{ name: '', pros: [''], cons: [''] }, { name: '', pros: [''], cons: [''] }]); }}
              variant="outline" className="w-full rounded-xl py-3">
              Start New Decision
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}