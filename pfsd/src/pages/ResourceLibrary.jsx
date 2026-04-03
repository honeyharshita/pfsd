import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Library, Search, ChevronRight, BookOpen, Wind, Brain, Heart, Shield, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/shared/LanguageContext';

const resources = [
  {
    category: 'Stress Management',
    color: 'from-orange-400 to-red-500',
    emoji: '🧘',
    icon: Zap,
    articles: [
      { title: 'What Causes Stress?', summary: 'Learn about the biological and psychological roots of stress responses.', readTime: '4 min', content: 'Stress is your body\'s reaction to challenges. Cortisol and adrenaline flood your system, preparing you for "fight or flight." Chronic stress occurs when this system stays activated too long, affecting sleep, immunity, and mood.\n\nCommon causes include work pressure, relationship conflicts, financial worries, and health concerns. Recognizing your personal stress triggers is the first step to managing them.' },
      { title: 'The 4-7-8 Breathing Technique', summary: 'A powerful breathing method to instantly reduce anxiety.', readTime: '3 min', content: 'Dr. Andrew Weil developed this technique: Inhale for 4 counts, hold for 7, exhale for 8. The extended exhale activates your parasympathetic nervous system, counteracting the stress response.\n\nPractice twice daily and whenever you feel stress rising. Within 2 weeks, many people notice significantly reduced anxiety levels.' },
      { title: 'Progressive Muscle Relaxation', summary: 'Tense and release technique to melt away physical tension.', readTime: '5 min', content: 'Start from your toes: tense each muscle group for 5 seconds, then release for 30 seconds. Move slowly up your body. This technique works because physical tension mirrors emotional tension - releasing one releases the other.' },
    ]
  },
  {
    category: 'Understanding Anxiety',
    color: 'from-amber-400 to-yellow-500',
    emoji: '💛',
    icon: Brain,
    articles: [
      { title: 'How Anxiety Works in the Brain', summary: 'The neuroscience behind anxious thoughts and feelings.', readTime: '5 min', content: 'Anxiety originates in the amygdala, your brain\'s alarm system. When it perceives threat (real or imagined), it triggers the stress response before your rational prefrontal cortex can evaluate the situation.\n\nThis is why anxious thoughts feel so urgent and real. Understanding this helps you pause and ask: "Is this a real threat or my amygdala overreacting?"' },
      { title: 'Grounding Techniques (5-4-3-2-1)', summary: 'Quick grounding exercises to stop anxiety spirals.', readTime: '3 min', content: 'When anxiety spikes, use your senses to ground yourself: Name 5 things you can SEE, 4 things you can TOUCH, 3 you can HEAR, 2 you can SMELL, 1 you can TASTE.\n\nThis interrupts the anxious thought loop by forcing your attention to the present moment.' },
      { title: 'Cognitive Reframing for Anxiety', summary: 'Change how you think to change how you feel.', readTime: '6 min', content: 'Anxious thinking involves cognitive distortions like catastrophizing ("This will be a disaster"), mind-reading ("They think I\'m stupid"), and all-or-nothing thinking.\n\nPractice asking: What\'s the evidence? What\'s the worst realistic outcome? What would I tell a friend in this situation?' },
    ]
  },
  {
    category: 'Managing Anger',
    color: 'from-red-400 to-rose-500',
    emoji: '❤️',
    icon: Shield,
    articles: [
      { title: 'The Anger Iceberg', summary: 'What really lies beneath anger and how to address it.', readTime: '4 min', content: 'Anger is often a secondary emotion covering vulnerable feelings like fear, hurt, shame, or embarrassment. The visible anger is the tip of the iceberg.\n\nAsk yourself: "What am I really feeling beneath this anger?" Often identifying the primary emotion reduces anger\'s intensity dramatically.' },
      { title: 'STOP Technique for Anger', summary: 'A 4-step method to interrupt anger before it escalates.', readTime: '3 min', content: 'S - Stop what you\'re doing. T - Take a breath (6 slow deep breaths). O - Observe your body, thoughts, and emotions. P - Proceed with awareness and intention.\n\nThis creates a pause between trigger and reaction, giving your prefrontal cortex time to engage.' },
    ]
  },
  {
    category: 'Building Emotional Resilience',
    color: 'from-teal-400 to-green-500',
    emoji: '🌱',
    icon: Heart,
    articles: [
      { title: 'What is Emotional Resilience?', summary: 'How to bounce back stronger from emotional challenges.', readTime: '5 min', content: 'Resilience isn\'t about not feeling pain - it\'s about recovering from it. Research shows resilience is built through social connections, purposeful thinking, self-care, and learning from adversity.\n\nThe key: resilience is a skill, not a fixed trait. Every challenge is training for the next one.' },
      { title: 'Building a Resilience Toolkit', summary: '10 practical strategies for emotional strength.', readTime: '7 min', content: '1. Nurture relationships - social support is the #1 resilience factor\n2. View problems as temporary\n3. Practice optimistic thinking\n4. Take decisive actions\n5. Find your purpose\n6. Maintain perspective\n7. Cultivate self-compassion\n8. Practice mindfulness\n9. Create routines\n10. Celebrate small wins' },
    ]
  },
  {
    category: 'Mindfulness & Meditation',
    color: 'from-blue-400 to-indigo-500',
    emoji: '🧠',
    icon: Wind,
    articles: [
      { title: 'The Science of Mindfulness', summary: 'How mindfulness physically changes your brain.', readTime: '6 min', content: 'MRI studies show that 8 weeks of mindfulness practice literally changes brain structure: the amygdala shrinks, the prefrontal cortex thickens, and neural pathways associated with stress weaken.\n\nMindfulness trains your attention to observe thoughts without getting caught in them. This meta-awareness is the foundation of emotional regulation.' },
      { title: 'Body Scan Meditation', summary: 'A simple full-body awareness practice for deep relaxation.', readTime: '4 min', content: 'Lie comfortably. Starting at your feet, slowly move attention up your body. Notice sensations without judgment - warmth, pressure, tingling. When your mind wanders, gently return.\n\n20 minutes of body scan practice equals 2-3 hours of deep sleep quality rest for the body.' },
    ]
  },
];

export default function ResourceLibrary() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeArticle, setActiveArticle] = useState(null);

  const filtered = resources.filter(r =>
    !searchQuery || r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.articles.some(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (activeArticle) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <button onClick={() => setActiveArticle(null)} className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm mb-6 hover:gap-3 transition-all">
            ← {t('resourceLibrary.back')}
          </button>
          <div className={`h-2 w-full rounded-full bg-gradient-to-r ${activeArticle.color} mb-6`} />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{activeArticle.title}</h1>
          <p className="text-sm text-gray-400 mb-6">📚 {activeArticle.readTime} {t('resourceLibrary.read')}</p>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {activeArticle.content.split('\n\n').map((para, i) => (
              <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{para}</p>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <Library className="w-8 h-8 text-blue-500" />
            {t('resourceLibrary.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('resourceLibrary.subtitle')}</p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('resourceLibrary.searchPlaceholder')}
            className="pl-12 rounded-2xl border-gray-200 dark:border-gray-700 h-12 text-base" />
        </div>

        <div className="space-y-6">
          {filtered.map((category, ci) => (
            <motion.div key={ci} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }}>
              <div className={`bg-gradient-to-r ${category.color} rounded-2xl p-1`}>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{category.emoji}</span>
                    <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">{category.category}</h2>
                    <span className="text-sm text-gray-400">{category.articles.length} articles</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {category.articles.map((article, ai) => (
                      <motion.button key={ai} whileHover={{ y: -2 }}
                        onClick={() => setActiveArticle({ ...article, color: category.color })}
                        className="text-left p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:shadow-md transition-all">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-1">{article.title}</p>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{article.summary}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">📖 {article.readTime}</span>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}