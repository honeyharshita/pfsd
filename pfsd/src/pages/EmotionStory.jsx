import React, { useState } from 'react';
import { aiApi } from '@/api/aiInsightsClient';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Loader2, RefreshCw, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/shared/LanguageContext';
import { cn } from '@/lib/utils';

const moods = [
  { key: 'sad', emoji: '😢', label: 'Sad', color: 'from-indigo-400 to-blue-500' },
  { key: 'stressed', emoji: '😰', label: 'Stressed', color: 'from-orange-400 to-red-500' },
  { key: 'anxious', emoji: '😟', label: 'Anxious', color: 'from-amber-400 to-orange-500' },
  { key: 'angry', emoji: '😡', label: 'Angry', color: 'from-red-400 to-rose-500' },
  { key: 'happy', emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-amber-500' },
  { key: 'neutral', emoji: '🙂', label: 'Neutral', color: 'from-purple-400 to-violet-500' },
  { key: 'calm', emoji: '😌', label: 'Calm', color: 'from-blue-400 to-cyan-500' },
];

function toSeedNumber(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return Math.abs(Math.floor(seed));
  }
  const text = String(seed || '0');
  return text.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function normalizeText(value = '') {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildGuaranteedDifferentStory(emotionKey, variationSeed = 0) {
  const seed = toSeedNumber(variationSeed);
  const themes = {
    sad: ['grief and self-kindness', 'missing out and belonging', 'slow healing'],
    stressed: ['pressure and priorities', 'overload and boundaries', 'focus under noise'],
    anxious: ['uncertainty and grounding', 'future fear and present safety', 'control and acceptance'],
    angry: ['boundaries and respect', 'hurt beneath anger', 'response over reaction'],
    happy: ['joy and gratitude', 'momentum and meaning', 'lightness and focus'],
    calm: ['stillness and strength', 'rest and clarity', 'quiet confidence'],
    neutral: ['transition and awareness', 'reset and intention', 'ordinary moments with meaning'],
  };

  const sceneBank = [
    'a bus ride after a long day',
    'a school corridor before class',
    'a park bench at sunset',
    'a kitchen table in the early morning',
    'a balcony during light rain',
    'a quiet room before sleep',
  ];

  const twistBank = [
    'they wrote one honest sentence instead of pretending they were fine',
    'they chose one tiny action and let that be enough for the day',
    'they asked for support instead of disappearing into silence',
    'they paused, breathed, and named the feeling without judgment',
    'they let go of perfection and protected one important priority',
    'they noticed the emotion was a message, not an enemy',
  ];

  const endings = [
    'By night, the feeling had not vanished, but it no longer controlled the whole story.',
    'The day did not become perfect, but it became manageable and honest.',
    'They still had questions, but they finally had direction too.',
    'Nothing dramatic happened, yet something real changed inside them.',
    'The emotion stayed present, but so did their courage.',
    'They ended the day lighter, not because life changed, but because they did.',
  ];

  const moralBank = {
    sad: [
      'Sadness softens when it is named and held with care.',
      'Healing can be slow and still meaningful.',
      'Pain is easier to carry when shared honestly.',
      'Gentleness is strength during difficult days.',
      'You do not need to rush recovery to be progressing.',
      'Rest can be a wise response to emotional weight.',
      'Missing out hurts, but it does not define your value.',
      'Self-kindness makes hard days survivable.',
      'Small comfort can change the direction of a day.',
      'Hope often returns quietly before it returns loudly.',
    ],
    stressed: [
      'Focus improves when priorities are reduced.',
      'You can be responsible without carrying everything.',
      'Boundaries are part of sustainable productivity.',
      'One clear step beats scattered urgency.',
      'Stress is a signal to simplify, not self-attack.',
      'Pause protects performance under pressure.',
      'Progress is steadier when you define enough.',
      'Calm planning outperforms panic planning.',
      'Removing tasks is also productive work.',
      'Your worth is not measured by your overload.',
    ],
    anxious: [
      'Anxiety eases when attention returns to the present.',
      'Uncertainty does not always mean danger.',
      'Grounding gives fear less room to grow.',
      'You can feel fear and still choose wisely.',
      'Small actions create real control.',
      'Breath can interrupt panic loops.',
      'Not every thought is a fact.',
      'Safety can be practiced in small moments.',
      'Presence is a skill that reduces fear.',
      'Calm begins with one anchored choice.',
    ],
    angry: [
      'Anger can reveal a boundary that needs protection.',
      'Pause turns reaction into response.',
      'Firm communication can stay respectful.',
      'Strong feelings need direction, not suppression.',
      'Clarity is stronger than escalation.',
      'Anger often guards an unmet need.',
      'You can be powerful without being harsh.',
      'Boundaries are strongest when specific.',
      'Intentional words protect dignity.',
      'Truth lands better when delivered steadily.',
    ],
    happy: [
      'Joy grows when it is noticed fully.',
      'Gratitude makes good moments stick.',
      'Celebration fuels healthy momentum.',
      'Lightness can be a source of strength.',
      'Small wins deserve recognition.',
      'Sharing joy deepens it.',
      'Good days can teach repeatable habits.',
      'Happiness is sustained by attention.',
      'Receiving joy is a healthy practice.',
      'Momentum becomes meaning when guided well.',
    ],
    calm: [
      'Calm is an active achievement.',
      'Stillness restores what stress drains.',
      'Steady routines protect resilience.',
      'Quiet focus is a form of strength.',
      'Recovery is productive progress.',
      'Peace grows through daily practice.',
      'Slow pace can still move life forward.',
      'Composure supports better decisions.',
      'Stability forms in ordinary moments.',
      'Protected calm improves everything downstream.',
    ],
    neutral: [
      'Neutral moments are useful reset points.',
      'Clarity often appears between emotional extremes.',
      'Ordinary days can still shape growth.',
      'Steady awareness builds future resilience.',
      'Small signals are easier to notice in calm.',
      'Balanced days prepare us for harder days.',
      'Consistency grows in quiet emotional weather.',
      'Not every meaningful shift feels dramatic.',
      'Observation now improves choices later.',
      'The middle ground can be productive ground.',
    ],
  };

  const reflectionBank = {
    sad: [
      'What would make today feel 10% softer?',
      'What support do you need that you have not asked for yet?',
      'What expectation can you lower to protect your energy?',
      'Who helps you feel less alone when sadness rises?',
      'What small comfort would help tonight?',
      'When were you brave even while hurting?',
      'What part of this pain deserves compassion, not judgment?',
      'What can you stop blaming yourself for today?',
      'What helps you feel grounded when emotions get heavy?',
      'What gentle step feels possible right now?',
    ],
    stressed: [
      'What single task matters most right now?',
      'What can be postponed safely?',
      'What boundary would lower pressure today?',
      'Where can you simplify instead of push harder?',
      'What does enough look like today?',
      'What can you delegate, shorten, or skip?',
      'When can you schedule a real reset?',
      'Which demand is loud but not important?',
      'How can you protect one focused hour?',
      'What support would make this sustainable?',
    ],
    anxious: [
      'What is true right now, not later?',
      'What grounding action helps your body most?',
      'Which fear are you treating like certainty?',
      'What can you control in the next 15 minutes?',
      'What would you tell a friend feeling this?',
      'What uncertainty can you allow for now?',
      'Which thought can you label as worry, not fact?',
      'How can you make this moment feel safer?',
      'What breathing pattern helps you settle fastest?',
      'What routine helps your nervous system reset?',
    ],
    angry: [
      'What boundary did this moment expose?',
      'What need is under this anger?',
      'What response would future-you respect?',
      'How can you communicate firmly and clearly?',
      'What conversation are you postponing?',
      'Where can calm strength replace escalation?',
      'What part of this anger is hurt?',
      'What action protects your dignity now?',
      'Which trigger needs a new plan?',
      'What does a respectful boundary sound like here?',
    ],
    happy: [
      'What gave you energy that you can repeat?',
      'Who can you share this good moment with?',
      'How can you protect this momentum tomorrow?',
      'What habit helped create this mood?',
      'What are you most grateful for today?',
      'How can you store this memory for hard days?',
      'What success did you almost overlook?',
      'How can this joy become support for others?',
      'What boundary protects your happiness?',
      'Where can you make room for more of this next week?',
    ],
    calm: [
      'What routine helps you keep this steadiness?',
      'How can you protect this calm tomorrow?',
      'Which noise can you reduce this week?',
      'What habit quietly supports your peace?',
      'Where does your body feel most at ease?',
      'How do you recover fastest after stress?',
      'How can you keep this pace on busy days?',
      'What boundary keeps your mind clear?',
      'What does peaceful productivity look like?',
      'How can you share this calm with others?',
    ],
    neutral: [
      'What subtle feeling deserves attention right now?',
      'What worked today that you can repeat tomorrow?',
      'What is one quiet win from this day?',
      'What would make this steady mood meaningful?',
      'Where can you use this clarity for planning?',
      'What small habit can you strengthen now?',
      'What signal might you miss if you rush?',
      'How can this reset support your week?',
      'What does a balanced day teach about your needs?',
      'What intention do you want for tomorrow?',
    ],
  };

  const quoteBank = {
    sad: ['You are not behind; you are healing.', 'Softness is not weakness.', 'Even slow healing is healing.', 'A heavy heart can still move forward.', 'Rest is allowed.', 'Honesty is courage.', 'You can grieve and still grow.', 'Hope can be quiet.', 'Care counts.', 'Gentle steps still count.'],
    stressed: ['Simplify first, then accelerate.', 'One focused step beats ten rushed ones.', 'Boundaries protect performance.', 'Calm is a strategy.', 'Urgency is not always importance.', 'You can carry responsibility without carrying everything.', 'Pause is productive.', 'Clarity lowers pressure.', 'Enough is a complete sentence.', 'Steady beats frantic.'],
    anxious: ['Ground first, then think.', 'You do not need to solve tomorrow tonight.', 'Presence is stronger than panic.', 'A steady breath is real progress.', 'Uncertainty is not a verdict.', 'Not every thought is true.', 'Safety can be practiced.', 'This moment is survivable.', 'Pause is protection.', 'You can be afraid and still be brave.'],
    angry: ['Channel the fire; do not become it.', 'Firm can be kind.', 'Pause protects power.', 'Clear boundaries reduce chaos.', 'Your voice matters most when intentional.', 'Strong and steady can coexist.', 'Respect starts with clarity.', 'You do not have to shout to be heard.', 'Direction beats reaction.', 'Truth lands better when calm.'],
    happy: ['Joy grows where attention goes.', 'Celebrate what is working.', 'Good moments are data too.', 'Let gratitude anchor the day.', 'Lightness is strength.', 'Share the good.', 'Small wins matter.', 'You are allowed to enjoy this.', 'Notice joy before rushing past it.', 'Momentum loves gratitude.'],
    calm: ['Peace is productive.', 'Stillness restores.', 'Your pace can be your strength.', 'Quiet focus goes far.', 'Balance is built daily.', 'Protect your calm.', 'Composure is power.', 'Slow and clear wins.', 'Recovery is progress.', 'Steadiness is a skill.'],
    neutral: ['Quiet days build strong habits.', 'Clarity often whispers first.', 'Ordinary can be meaningful.', 'Steady is a direction.', 'Small signals matter.', 'Use calm days wisely.', 'Consistency grows in quiet weather.', 'Observe before reacting.', 'Balanced days prepare you well.', 'Middle ground has power.'],
  };

  const moodThemes = themes[emotionKey] || themes.neutral;
  const theme = moodThemes[seed % moodThemes.length];
  const scene = sceneBank[(seed + emotionKey.length) % sceneBank.length];
  const twist = twistBank[(seed + emotionKey.length * 3) % twistBank.length];
  const ending = endings[(seed + emotionKey.length * 5) % endings.length];
  const morals = moralBank[emotionKey] || moralBank.neutral;
  const reflections = reflectionBank[emotionKey] || reflectionBank.neutral;
  const quotes = quoteBank[emotionKey] || quoteBank.neutral;
  const variant = (seed + scene.length + theme.length) % 10;

  return {
    title: `${theme.split(' ')[0].charAt(0).toUpperCase() + theme.split(' ')[0].slice(1)} Shift`,
    story: [
      `In ${scene}, someone carrying ${emotionKey} realized the real theme was ${theme}.`,
      `At the turning point, ${twist}. That small decision changed the emotional direction of the moment.`,
      ending,
    ].join('\n\n'),
    moral: morals[variant],
    affirmation: `I can feel ${emotionKey} and still choose a response that protects my peace.`,
    reflection_question: reflections[(variant + 3) % 10],
    quote: quotes[(variant + 6) % 10],
  };
}

function buildFallbackStory(emotionKey, variationSeed = 0) {
  const seed = toSeedNumber(variationSeed);
  const baseByEmotion = {
    sad: {
      title: ['A Softer Morning', 'The Day of Slow Breathing', 'Rainlight and Recovery', 'Gentle Hour', 'Quiet Window', 'Morning Without Masks', 'Small Lantern', 'After the Tears', 'Steady Hands', 'Kind Evening'],
      hook: 'A woman woke before sunrise with sadness sitting heavily in her chest.',
      pivot: 'She stopped pretending she was okay and allowed the feeling to have a name.',
      close: 'Nothing became perfect, but the day became kinder once she stopped fighting herself.',
      moral: ['Sadness becomes easier to carry when it is acknowledged.', 'Naming pain can reduce its weight.', 'Healing is rarely loud, but still real.', 'Self-kindness is a skill for hard days.', 'Rest can be wise, not weak.', 'You can hurt and still move forward.', 'Compassion supports recovery.', 'Small comfort matters.', 'Soft pacing still counts.', 'You deserve care while healing.'],
      affirmation: 'I can be sad and still move with care.',
      reflection: ['What would feel gentler than forcing myself to be okay right now?', 'What support do I need today?', 'What can I stop blaming myself for?', 'Who makes me feel safer to open up?', 'What comfort can I choose tonight?', 'Where did I show courage today?', 'What expectation can I lower?', 'What helps me feel less alone?', 'What does gentle progress look like?', 'What would compassion say right now?'],
      quote: ['You are not behind; you are healing.', 'Even slow healing is healing.', 'Softness is strength.', 'A heavy heart can still move.', 'Rest is allowed.', 'Hope can be quiet.', 'Care counts.', 'Honesty is courage.', 'Gentle steps are still steps.', 'You are doing better than you think.']
    },
    stressed: {
      title: ['The Unfinished List', 'One Task at a Time', 'Pressure, Then Clarity', 'The Narrow Lane', 'After the Rush', 'Clear Desk, Clear Mind', 'Short Pause', 'The Priority Card', 'Three Breaths', 'Enough for Today'],
      hook: 'A man stared at a list of unfinished tasks and felt pressure rise in his chest.',
      pivot: 'He chose one task, set a timer, and gave his mind one lane to travel.',
      close: 'The stress did not vanish, but it no longer controlled the whole day.',
      moral: ['Stress gets lighter when focus gets narrower.', 'One clear task can reset a pressured day.', 'Boundaries protect your energy.', 'Pace matters under pressure.', 'Simplify before forcing speed.', 'Urgency is not always importance.', 'Pause can prevent burnout.', 'Remove tasks to recover focus.', 'Enough is a valid target.', 'Steady effort beats frantic effort.'],
      affirmation: 'I do not need to solve everything at once.',
      reflection: ['What is the single next step that would make today feel lighter?', 'What can I postpone?', 'What boundary do I need now?', 'Where can I simplify?', 'What does enough mean today?', 'What can be delegated?', 'When can I reset?', 'What demand is loud but not important?', 'How do I protect one focused hour?', 'What support would help most?'],
      quote: ['Simplify first, then accelerate.', 'One focused step beats ten rushed ones.', 'Boundaries protect performance.', 'Calm is a strategy.', 'Urgency is not always importance.', 'Pause is productive.', 'Clarity lowers pressure.', 'Enough is a complete sentence.', 'Steady beats frantic.', 'You can carry less and still do well.']
    },
    anxious: {
      title: ['The Waiting Room', 'Five Things in Front of Me', 'The Door Has Not Opened Yet', 'Anchored Breath', 'Present Tense', 'Quiet Ground', 'The Small Circle', 'Hold and Release', 'Window of Now', 'The Gentle Return'],
      hook: 'A girl sat in a waiting room with anxiety humming under her skin.',
      pivot: 'She grounded herself in what she could see and touch, not what she feared next.',
      close: 'Uncertainty stayed, but panic softened into steadiness.',
      moral: ['Grounding helps the present become larger than fear.', 'Anxiety softens when the body feels safe.', 'Not every thought is a prediction.', 'Control grows through small actions.', 'Breath can interrupt panic loops.', 'Uncertainty is uncomfortable, not always dangerous.', 'Presence can be practiced.', 'Fear can exist without driving choices.', 'Calm starts with one anchor.', 'You can be afraid and still steady.'],
      affirmation: 'I can stay in this moment without solving the whole future.',
      reflection: ['What would help me feel a little more anchored right now?', 'What is true in this exact moment?', 'Which grounding action helps fastest?', 'What fear am I treating as fact?', 'What can I control in 15 minutes?', 'What would I tell a friend?', 'What uncertainty can I allow tonight?', 'Which thought is worry, not certainty?', 'How can I make this moment safer?', 'What routine helps me reset?'],
      quote: ['Ground first, then think.', 'You do not need to solve tomorrow tonight.', 'Presence is stronger than panic.', 'A steady breath is progress.', 'Uncertainty is not a verdict.', 'Not every thought is true.', 'Safety can be practiced.', 'Pause is protection.', 'This moment is survivable.', 'You can be afraid and still be brave.']
    },
    angry: {
      title: ['The Heat in the Chest', 'The Boundary Beneath the Fire', 'After the Sharp Edge', 'Pause Before Words', 'The Clear Line', 'Under the Flame', 'Steady Voice', 'After the Trigger', 'Respect in Action', 'Calm Power'],
      hook: 'A person walked home angry after feeling ignored again.',
      pivot: 'They paused and asked what the anger was protecting underneath.',
      close: 'Once the need became clear, response replaced reaction.',
      moral: ['Anger can reveal a boundary that needs protection.', 'Pause turns reaction into response.', 'Clarity helps anger become useful.', 'Firm can remain respectful.', 'Strong feelings need direction.', 'Boundaries reduce repeated harm.', 'Truth is strongest when steady.', 'Intentional words protect dignity.', 'Calm strength is still strength.', 'Response builds better outcomes than reaction.'],
      affirmation: 'My feelings are real, and I can respond with clarity.',
      reflection: ['What need is my anger trying to protect?', 'What boundary did this expose?', 'How can I respond in a way I respect later?', 'What conversation am I avoiding?', 'What part is hurt under the anger?', 'What action protects my dignity now?', 'How can I be firm and calm?', 'Which trigger needs a new plan?', 'What words reflect my real need?', 'What would clear, respectful truth sound like?'],
      quote: ['Channel the fire; do not become it.', 'Firm can be kind.', 'Pause protects power.', 'Clear boundaries reduce chaos.', 'Intentional words carry weight.', 'Strong and steady can coexist.', 'Respect starts with clarity.', 'You do not have to shout to be heard.', 'Direction beats reaction.', 'Truth lands better when calm.']
    },
    happy: {
      title: ['The Open Window', 'Small Joy, Full Heart', 'Sunlight on the Floor', 'Bright Steps', 'Good News, Quiet Smile', 'The Lifted Hour', 'Warm Morning', 'Shared Laugh', 'Golden Pause', 'Light Carried Forward'],
      hook: 'A young woman noticed joy arriving in small flashes through the day.',
      pivot: 'She let herself pause and receive each moment instead of rushing past it.',
      close: 'By evening, joy felt less like luck and more like attention.',
      moral: ['Joy grows when you let yourself fully notice it.', 'Gratitude helps joy last longer.', 'Celebration supports momentum.', 'Good moods teach useful habits.', 'Small wins deserve full credit.', 'Joy deepens when shared.', 'Lightness can power meaningful action.', 'Receiving joy is healthy.', 'Attention strengthens positive moments.', 'Hope grows through repeated noticing.'],
      affirmation: 'I am allowed to receive good moments without shrinking them.',
      reflection: ['What is one small joy I can let myself keep today?', 'What gave me energy today?', 'How can I protect this momentum?', 'Who can I share this joy with?', 'What habit helped create this mood?', 'What am I grateful for right now?', 'What success did I almost overlook?', 'How can I store this memory for hard days?', 'What boundary protects this happiness?', 'How can I invite more of this next week?'],
      quote: ['Joy grows where attention goes.', 'Celebrate what is working.', 'Good moments are data too.', 'Let gratitude anchor the day.', 'Lightness is strength.', 'Share the good.', 'Small wins matter.', 'You are allowed to enjoy this.', 'Notice joy before rushing past it.', 'Momentum loves gratitude.']
    },
    calm: {
      title: ['The Quiet River', 'The Restoring Hour', 'Stillness With Meaning', 'Held by Silence', 'The Measured Day', 'Clear Water', 'Slow and Strong', 'Soft Horizon', 'Breath and Balance', 'The Steady Room'],
      hook: 'A traveler sat beside a river and felt calm settle around him.',
      pivot: 'He realized not every meaningful day needs urgency or noise.',
      close: 'He left lighter, not because life changed, but because he slowed enough to recover.',
      moral: ['Calm is not empty; it is repair.', 'Stillness restores strength.', 'Steady pace supports resilience.', 'Quiet focus improves choices.', 'Recovery is productive.', 'Peace can be practiced daily.', 'Composure is a form of power.', 'Balanced rhythms prevent overload.', 'Protecting calm protects performance.', 'Ordinary steadiness builds long-term strength.'],
      affirmation: 'My calm matters, and I can protect it.',
      reflection: ['What helps me stay steady when life gets noisy again?', 'How can I protect this calm tomorrow?', 'Which noise can I reduce this week?', 'What habit supports this peace?', 'Where does my body feel most at ease?', 'How do I recover fastest after stress?', 'How can I keep this pace on busy days?', 'What boundary keeps my mind clear?', 'What does peaceful productivity look like?', 'How can I share this calm with others?'],
      quote: ['Peace is productive.', 'Stillness restores.', 'Your pace can be your strength.', 'Quiet focus goes far.', 'Balance is built daily.', 'Protect your calm.', 'Composure is power.', 'Slow and clear wins.', 'Recovery is progress.', 'Steadiness is a skill.']
    },
    neutral: {
      title: ['The Quiet in Between', 'Ordinary, But Honest', 'The Space Before the Next Feeling', 'Middle Light', 'Plain Day, Clear Mind', 'Reset Hour', 'Unrushed Path', 'Balanced Frame', 'Simple and True', 'The Gentle Middle'],
      hook: 'A person moved through the day feeling neither high nor low.',
      pivot: 'In that ordinary space, they noticed clarity without drama.',
      close: 'By evening, neutral felt less empty and more like a reset point.',
      moral: ['Quiet moments still carry useful information.', 'Neutral days are useful reset points.', 'Clarity can appear without drama.', 'Balanced moods support better planning.', 'Ordinary days still shape growth.', 'Steady awareness strengthens resilience.', 'Small signals matter.', 'Consistency grows in quiet weather.', 'Not every shift needs intensity.', 'Observation now improves choices later.'],
      affirmation: 'Even calm days can help me understand myself.',
      reflection: ['What is this quiet moment showing me?', 'What subtle feeling deserves attention?', 'What worked today that I can repeat?', 'What is one quiet win from today?', 'What would make this steady mood meaningful?', 'Where can I use this clarity for planning?', 'What small habit can I strengthen now?', 'What signal might I miss if I rush?', 'How can this reset support my week?', 'What intention do I want for tomorrow?'],
      quote: ['Quiet days build strong habits.', 'Clarity often whispers first.', 'Ordinary can be meaningful.', 'Steady is a direction.', 'Small signals matter.', 'Use calm days wisely.', 'Consistency grows in quiet weather.', 'Observe before reacting.', 'Balanced days prepare you well.', 'Middle ground has power.']
    }
  };

  const base = baseByEmotion[emotionKey] || baseByEmotion.neutral;
  const variant = seed % 10;
  const title = base.title[variant % base.title.length];
  const formatType = seed % 4;

  let story;
  if (formatType === 0) {
    story = [base.hook, base.pivot, base.close].join('\n\n');
  } else if (formatType === 1) {
    story = `Journal Note:\n${base.hook}\n\nTurning Point:\n${base.pivot}\n\nBy Night:\n${base.close}`;
  } else if (formatType === 2) {
    story = `Scene: ${base.hook}\n\nInner Voice: ${base.pivot}\n\nOutcome: ${base.close}`;
  } else {
    story = `1) ${base.hook}\n2) ${base.pivot}\n3) ${base.close}`;
  }

  return {
    title,
    story,
    moral: Array.isArray(base.moral) ? base.moral[variant] : base.moral,
    affirmation: base.affirmation,
    reflection_question: Array.isArray(base.reflection) ? base.reflection[(variant + 2) % 10] : base.reflection,
    quote: Array.isArray(base.quote) ? base.quote[(variant + 5) % 10] : base.quote,
  };
}

function normalizeStory(result, selectedMood, variationSeed = 0) {
  if (!result) return buildFallbackStory(selectedMood?.key || 'neutral', variationSeed);
  if (typeof result === 'string') {
    return {
      ...buildFallbackStory(selectedMood?.key || 'neutral', variationSeed),
      story: result,
    };
  }

  const fallback = buildFallbackStory(selectedMood?.key || 'neutral', variationSeed);
  const storyText = result.story || result.text || fallback.story;
  const calculatedWordCount = String(storyText || '').trim().split(/\s+/).filter(Boolean).length;

  return {
    title: result.title || result.summary_title || fallback.title,
    story: storyText,
    moral: result.moral || result.takeaway || fallback.moral,
    affirmation: result.affirmation || fallback.affirmation,
    reflection_question: result.reflection_question || result.reflectionQuestion || fallback.reflection_question,
    quote: result.quote || fallback.quote,
    word_count: Number(result.word_count) || calculatedWordCount,
    sentiment_score: Number.isFinite(Number(result.sentiment_score)) ? Number(result.sentiment_score) : null,
    emotional_intensity_score: Number.isFinite(Number(result.emotional_intensity_score))
      ? Math.max(0, Math.min(100, Number(result.emotional_intensity_score)))
      : null,
  };
}

function getStoryIntensity(moodKey = 'neutral', sentimentScore = null, intensityScore = null) {
  const key = String(moodKey || 'neutral').toLowerCase();
  const moodBase = {
    sad: 68,
    stressed: 82,
    anxious: 88,
    angry: 92,
    happy: 66,
    calm: 38,
    neutral: 48,
  };

  const base = Number.isFinite(Number(intensityScore))
    ? Number(intensityScore)
    : (moodBase[key] || moodBase.neutral);
  const sentiment = Number.isFinite(Number(sentimentScore)) ? Number(sentimentScore) : 0;
  const adjusted = Math.max(0, Math.min(100, Math.round(base + (Math.abs(sentiment) * 11) - (sentiment > 0 ? 5 : 0))));

  const profileByMood = {
    sad: {
      high: { at: 76, label: 'Heavy', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
      mid: { at: 56, label: 'Reflective', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      low: { label: 'Softening', className: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300' },
    },
    stressed: {
      high: { at: 84, label: 'Overloaded', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
      mid: { at: 64, label: 'Pressured', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
      low: { label: 'Stabilizing', className: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300' },
    },
    anxious: {
      high: { at: 87, label: 'Hyperalert', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' },
      mid: { at: 67, label: 'On Edge', className: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300' },
      low: { label: 'Grounding', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' },
    },
    angry: {
      high: { at: 86, label: 'Intense', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' },
      mid: { at: 66, label: 'Activated', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
      low: { label: 'Refocusing', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
    },
    happy: {
      high: { at: 74, label: 'Uplifted', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
      mid: { at: 54, label: 'Bright', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
      low: { label: 'Light', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
    },
    calm: {
      high: { at: 56, label: 'Centered', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' },
      mid: { at: 38, label: 'Steady', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' },
      low: { label: 'Gentle', className: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300' },
    },
    neutral: {
      high: { at: 62, label: 'Engaged', className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' },
      mid: { at: 44, label: 'Balanced', className: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300' },
      low: { label: 'Even', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
    },
  };

  const profile = profileByMood[key] || profileByMood.neutral;
  if (adjusted >= profile.high.at) return { ...profile.high, score: adjusted };
  if (adjusted >= profile.mid.at) return { ...profile.mid, score: adjusted };
  return { ...profile.low, score: adjusted };
}

export default function EmotionStory() {
  const { t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState(null);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationCount, setGenerationCount] = useState(0);
  const [storyHistoryByMood, setStoryHistoryByMood] = useState({});
  const intensityMeta = getStoryIntensity(selectedMood?.key, story?.sentiment_score, story?.emotional_intensity_score);

  const generateStory = async () => {
    if (!selectedMood) return;
    setLoading(true);
    setStory(null);
    setError('');
    const variationSeed = Date.now() + Math.floor(Math.random() * 100000) + generationCount * 17;
    setGenerationCount((count) => count + 1);

    const ensureDifferent = (candidate) => {
      const moodKey = selectedMood.key;
      const history = Array.isArray(storyHistoryByMood[moodKey]) ? storyHistoryByMood[moodKey] : [];
      const candidateKey = normalizeText(candidate?.story || '');
      if (!candidateKey) {
        return buildGuaranteedDifferentStory(moodKey, variationSeed + 31);
      }

      const alreadyUsed = history.includes(candidateKey);
      if (!alreadyUsed) return candidate;

      return buildGuaranteedDifferentStory(moodKey, variationSeed + 97 + history.length * 11);
    };

    const saveToHistory = (selectedStory) => {
      const moodKey = selectedMood.key;
      const textKey = normalizeText(selectedStory?.story || '');
      if (!textKey) return;
      setStoryHistoryByMood((prev) => {
        const existing = Array.isArray(prev[moodKey]) ? prev[moodKey] : [];
        const updated = [textKey, ...existing.filter((item) => item !== textKey)].slice(0, 8);
        return { ...prev, [moodKey]: updated };
      });
    };

    try {
      const result = await aiApi.emotionStory([selectedMood.key], variationSeed);
      const normalized = normalizeStory(result, selectedMood, variationSeed);
      const uniqueStory = ensureDifferent(normalized);
      setStory(uniqueStory);
      saveToHistory(uniqueStory);
    } catch (err) {
      const fallback = buildFallbackStory(selectedMood.key, variationSeed);
      const uniqueStory = ensureDifferent(fallback);
      setStory(uniqueStory);
      saveToHistory(uniqueStory);
      setError(err.message || 'Failed to generate a fresh story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-pink-500" />
            {t('emotionStory.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('emotionStory.subtitle')}</p>
        </div>

        {/* Mood Selection */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">{t('emotionStory.prompt')}</p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {moods.map((mood) => (
              <motion.button key={mood.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMood(mood)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all",
                  selectedMood?.key === mood.key
                    ? `bg-gradient-to-br ${mood.color} border-transparent`
                    : "border-gray-100 dark:border-gray-800 hover:border-purple-200 bg-white dark:bg-gray-800"
                )}>
                <span className="text-2xl">{mood.emoji}</span>
                <span className={cn("text-xs font-medium", selectedMood?.key === mood.key ? "text-white" : "text-gray-500")}>{mood.label}</span>
              </motion.button>
            ))}
          </div>

          <Button onClick={generateStory} disabled={!selectedMood || loading}
            className="mt-5 w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 rounded-xl py-3 text-white font-semibold">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('emotionStory.crafting')}</> : <><Sparkles className="w-4 h-4 mr-2" /> {t('emotionStory.generate')}</>}
          </Button>
        </div>

        {/* Story Display */}
        <AnimatePresence>
          {story && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {selectedMood && (
                <div className={`rounded-3xl bg-gradient-to-br ${selectedMood.color} p-1 mb-6`}>
                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">✨ {story.title}</h2>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {story.word_count || 0} words
                          </span>
                          <span className={cn("text-xs px-2 py-1 rounded-full font-medium", intensityMeta.className)}>
                            Intensity: {intensityMeta.label} ({intensityMeta.score}/100)
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={generateStory} disabled={loading}>
                        <RefreshCw className={cn("w-4 h-4 text-gray-400", loading && "animate-spin")} />
                      </Button>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {story.story?.split('\n\n').map((para, i) => (
                        <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{para}</p>
                      ))}
                    </div>

                    {story.moral && (
                      <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border-l-4 border-amber-400">
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">Moral</p>
                        <p className="text-sm text-amber-800 dark:text-amber-300">{story.moral}</p>
                      </div>
                    )}

                    {story.affirmation && (
                      <div className="mt-4 bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-900/20 dark:to-teal-900/20 rounded-xl p-4 text-center">
                        <Heart className="w-5 h-5 text-pink-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 italic">"{story.affirmation}"</p>
                      </div>
                    )}

                    {story.reflection_question && (
                      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">💭 Reflection</p>
                        <p className="text-sm text-blue-800 dark:text-blue-300">{story.reflection_question}</p>
                      </div>
                    )}

                    {story.quote && (
                      <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border-l-4 border-emerald-400">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">Quote</p>
                        <p className="text-sm italic text-emerald-800 dark:text-emerald-300">"{story.quote}"</p>
                      </div>
                    )}

                    {error && (
                      <p className="mt-4 text-xs text-gray-400">{error}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}