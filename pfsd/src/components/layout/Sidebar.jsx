import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Home, MessageCircle, BarChart3, Gamepad2, BookOpen,
  Music, PieChart, User, Shield, ChevronLeft,
  ChevronRight, Sun, Moon, Sparkles, Info, CloudSun,
  FileText, BookMarked, Zap, Flame, Library, Star,
  Palette, GraduationCap, Scale, Camera,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '../shared/LanguageContext';
import LanguageSelector from '../shared/LanguageSelector';

export default function Sidebar({ currentPage, darkMode, onToggleDarkMode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const { t } = useLanguage();

  const toggleGroup = (label) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const navGroups = [
    {
      key: 'main',
      label: t('common.main'),
      items: [
        { name: t('nav.home'), icon: Home, page: 'Home' },
        { name: t('nav.chat'), icon: MessageCircle, page: 'Chat' },
        { name: t('nav.moodTracker'), icon: BarChart3, page: 'MoodTracker' },
        { name: t('nav.dashboard'), icon: PieChart, page: 'Dashboard' },
      ]
    },
    {
      key: 'ai',
      label: t('common.aiFeatures'),
      items: [
        { name: t('nav.moodForecast'), icon: CloudSun, page: 'MoodForecast' },
        { name: t('nav.triggerAnalyzer'), icon: Zap, page: 'EmotionTrigger' },
        { name: t('nav.weeklyReport'), icon: FileText, page: 'WeeklyReport' },
        { name: t('nav.decisionHelper'), icon: Scale, page: 'DecisionHelper' },
      ]
    },
    {
      key: 'wellness',
      label: t('common.wellnessTools'),
      items: [
        { name: t('nav.games'), icon: Gamepad2, page: 'Games' },
        { name: t('nav.journal'), icon: BookOpen, page: 'Journal' },
        { name: t('nav.meditation'), icon: Music, page: 'Meditation' },
        { name: t('nav.habitBuilder'), icon: Flame, page: 'HabitBuilder' },
        { name: t('nav.safeSpace'), icon: Shield, page: 'SafeSpace' },
      ]
    },
    {
      key: 'creative',
      label: t('common.creative'),
      items: [
        { name: t('nav.emotionStory'), icon: BookMarked, page: 'EmotionStory' },
        { name: t('nav.photoMood'), icon: Camera, page: 'MoodPhotoUpload' },
        { name: t('nav.colorTherapy'), icon: Palette, page: 'ColorTherapy' },
        { name: t('nav.studyHelp'), icon: GraduationCap, page: 'StudySuggestions' },
      ]
    },
    {
      key: 'discover',
      label: t('common.discover'),
      items: [
        { name: t('nav.positivityFeed'), icon: Star, page: 'PositivityFeed' },
        { name: t('nav.resourceLibrary'), icon: Library, page: 'ResourceLibrary' },
        { name: t('nav.profile'), icon: User, page: 'Profile' },
        { name: t('nav.about'), icon: Info, page: 'About' },
        { name: t('nav.admin'), icon: Shield, page: 'Admin' },
      ]
    }
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full z-50 transition-all duration-300 flex flex-col",
      "bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-r border-purple-100 dark:border-purple-900/30",
      collapsed ? "w-[68px]" : "w-[240px]"
    )}>
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-teal-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg gradient-text whitespace-nowrap">MindfulAI</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-1">
        {navGroups.map((group) => (
          <div key={group.key}>
            {!collapsed && (
              <button onClick={() => toggleGroup(group.key)}
                className="flex items-center justify-between w-full px-3 py-1.5 mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{group.label}</span>
                <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform", collapsedGroups[group.key] && "-rotate-90")} />
              </button>
            )}
            {!collapsedGroups[group.key] && group.items.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <Link key={item.page} to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-purple-500/10 to-teal-500/10 text-purple-700 dark:text-purple-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600"
                  )}>
                  <item.icon className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-400 group-hover:text-purple-500"
                  )} />
                  {!collapsed && (
                    <span className="text-xs font-medium whitespace-nowrap">{item.name}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500" />
                  )}
                </Link>
              );
            })}
            {!collapsed && <div className="h-2" />}
          </div>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="p-2 border-t border-purple-100 dark:border-purple-900/30 space-y-1 flex-shrink-0">
        <LanguageSelector collapsed={collapsed} />
        <button onClick={onToggleDarkMode}
          className="flex items-center gap-3 px-3 py-2 rounded-xl w-full text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
          {darkMode ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
          {!collapsed && <span className="text-xs font-medium">{darkMode ? t('common.lightMode') : t('common.darkMode')}</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl w-full text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4 flex-shrink-0" /> : <ChevronLeft className="w-4 h-4 flex-shrink-0" />}
          {!collapsed && <span className="text-xs font-medium">{t('common.collapse')}</span>}
        </button>
      </div>
    </aside>
  );
}