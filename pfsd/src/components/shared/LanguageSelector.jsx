import React, { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { LANGUAGES, useLanguage } from './LanguageContext';
import { cn } from '@/lib/utils';

export default function LanguageSelector({ collapsed }) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LANGUAGES[language];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl w-full text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
        <Globe className="w-4 h-4 flex-shrink-0 text-purple-500" />
        {!collapsed && (
          <span className="text-xs font-medium flex items-center gap-1.5">
            <span>{current?.flag}</span>
            <span className="truncate">{current?.name}</span>
          </span>
        )}
      </button>

      {open && (
        <div className={cn(
          "absolute bottom-full mb-1 z-[100] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 overflow-hidden",
          collapsed ? "left-14 w-48" : "left-0 right-0"
        )}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">{t('common.language')}</p>
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(LANGUAGES).map(([code, lang]) => (
              <button key={code} onClick={() => { setLanguage(code); setOpen(false); }}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors",
                  language === code ? "text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10" : "text-gray-700 dark:text-gray-300"
                )}>
                <span className="text-base">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
                {language === code && <span className="ml-auto text-purple-500 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}