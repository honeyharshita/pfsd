import React, { useState } from 'react';
import { aiApi } from '../api/aiInsightsClient';
import { motion } from 'framer-motion';
import { TrendingUp, Brain, Moon, Zap, Loader2, CloudSun, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/components/shared/LanguageContext';

const moodEmoji = { happy:'😊', calm:'😌', neutral:'🙂', stressed:'😰', sad:'😢', angry:'😡', anxious:'😟' };
const moodGradient = {
  happy: 'from-yellow-400 to-amber-500', calm: 'from-blue-400 to-cyan-500',
  neutral: 'from-purple-400 to-violet-500', stressed: 'from-orange-400 to-red-500',
  sad: 'from-indigo-400 to-blue-600', angry: 'from-red-400 to-rose-600', anxious: 'from-amber-400 to-orange-500',
};

export default function MoodForecast() {
  const { t } = useLanguage();
  const [sleepHours, setSleepHours] = useState([7]);
  const [stressLevel, setStressLevel] = useState([5]);
  const [energyLevel, setEnergyLevel] = useState([6]);
  const [currentFeeling, setCurrentFeeling] = useState('');
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateForecast = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await aiApi.moodForecast({
        currentFeeling,
        sleepHours: sleepHours[0],
        stressLevel: stressLevel[0],
        energyLevel: energyLevel[0],
      });

      setForecast(result);
    } catch (err) {
      setError(err.message || 'Failed to generate mood forecast');
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <CloudSun className="w-8 h-8 text-amber-500" /> {t('moodForecastPage.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('moodForecastPage.subtitle')}</p>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" /> {t('moodForecastPage.currentFeeling')}
          </h3>

          {/* Current feeling text */}
          <div className="mb-6">
            <Textarea
              value={currentFeeling}
              onChange={e => setCurrentFeeling(e.target.value)}
              placeholder={t('moodForecastPage.currentFeelingLabel')}
              className="rounded-xl min-h-[90px] text-sm"
            />
            <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {t('moodForecastPage.yourCurrentInput')}
            </p>
          </div>

          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" /> {t('moodForecastPage.tonightFactors')}
          </h3>

          <div className="space-y-7">
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" /> {t('moodForecastPage.plannedSleepHours')}
                </Label>
                <span className="text-lg font-bold text-indigo-500">{sleepHours[0]}h</span>
              </div>
              <Slider value={sleepHours} onValueChange={setSleepHours} min={3} max={12} step={0.5} />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>3h</span><span>7-9h ideal</span><span>12h</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" /> {t('moodForecastPage.currentStressLevel')}
                </Label>
                <span className={`text-lg font-bold ${stressLevel[0] > 7 ? 'text-red-500' : stressLevel[0] > 4 ? 'text-orange-500' : 'text-green-500'}`}>{stressLevel[0]}/10</span>
              </div>
              <Slider value={stressLevel} onValueChange={setStressLevel} min={1} max={10} step={1} />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" /> {t('moodForecastPage.currentEnergyLevel')}
                </Label>
                <span className="text-lg font-bold text-yellow-500">{energyLevel[0]}/10</span>
              </div>
              <Slider value={energyLevel} onValueChange={setEnergyLevel} min={1} max={10} step={1} />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <Button onClick={generateForecast} disabled={loading}
            className="mt-6 w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-90 rounded-xl py-3 text-white font-semibold text-base">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('moodForecastPage.analyzing')}</> : <><TrendingUp className="w-4 h-4 mr-2" /> {t('moodForecastPage.generateForecast')}</>}
          </Button>
        </div>

        {forecast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`rounded-3xl bg-gradient-to-br ${moodGradient[forecast.predicted_mood] || 'from-purple-400 to-teal-500'} p-8 text-white text-center mb-6 shadow-xl`}>
              <p className="text-6xl mb-3">{moodEmoji[forecast.predicted_mood] || '🙂'}</p>
              <h2 className="text-2xl font-bold capitalize mb-1">{t('moodForecastPage.tomorrow')}: {forecast.predicted_mood}</h2>
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1 text-sm mb-4">
                <Brain className="w-3.5 h-3.5" /> {forecast.confidence > 1 ? forecast.confidence : Math.round(forecast.confidence * 100)}% confidence
              </div>
              <p className="text-white/90 max-w-md mx-auto">{forecast.key_insight}</p>
            </div>

            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                <Brain className="w-4 h-4 text-slate-500" /> {t('moodForecastPage.whyForecast')}
              </div>
              <p className="text-sm text-slate-600 leading-6">
                {forecast.trend_note || t('moodForecastPage.yourCurrentInput')}
              </p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-white p-3 border border-slate-200">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">{t('moodForecastPage.currentFeelingLabel')}</p>
                  <p className="mt-1 text-slate-700">{currentFeeling.trim() || t('moodForecastPage.notProvided')}</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-slate-200">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">{t('moodForecastPage.recentHistory')}</p>
                  <p className="mt-1 text-slate-700">{forecast.recent_history_summary || t('moodForecastPage.noRecentHistory')}</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-slate-200">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">{t('moodForecastPage.mainDriver')}</p>
                  <p className="mt-1 text-slate-700">{forecast.main_driver || t('moodForecastPage.mixedInputs')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { time: 'Morning', icon: '🌅', text: forecast.morning_forecast, color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
                { time: 'Afternoon', icon: '☀️', text: forecast.afternoon_forecast, color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
                { time: 'Evening', icon: '🌙', text: forecast.evening_forecast, color: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' },
              ].map(period => (
                <div key={period.time} className={`rounded-2xl p-4 border ${period.color}`}>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{period.icon} {period.time}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{period.text}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card rounded-2xl p-5">
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> {t('moodForecastPage.tipsForTomorrow')}
                </h4>
                <ul className="space-y-2">
                  {forecast.top_tips?.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {t('moodForecastPage.watchOutFor')}
                </h4>
                <ul className="space-y-2">
                  {forecast.risk_factors?.map((risk, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">⚠</span> {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}