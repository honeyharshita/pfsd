import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import { cn } from '@/lib/utils';
import { LanguageProvider } from './components/shared/LanguageContext';

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mindful_dark_mode');
    if (saved === 'true') setDarkMode(true);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      localStorage.setItem('mindful_dark_mode', String(!prev));
      return !prev;
    });
  };

  return (
    <LanguageProvider>
      <div className={cn(darkMode && "dark-mode dark")}>
        <style>{`
          .dark-mode { background-color: #0f0a1a; color: #e5e7eb; }
          .dark-mode .bg-white { background-color: #1a1025; }
          .dark-mode .bg-gray-50, .dark-mode .bg-gray-100 { background-color: #150e22; }
          .dark-mode .text-gray-900 { color: #f3f4f6; }
          .dark-mode .text-gray-800 { color: #e5e7eb; }
          .dark-mode .text-gray-700 { color: #d1d5db; }
          .dark-mode .text-gray-600 { color: #9ca3af; }
          .dark-mode .text-gray-500 { color: #6b7280; }
          .dark-mode .border-gray-200 { border-color: #2d2040; }
          .dark-mode .border-gray-100 { border-color: #251a38; }
        `}</style>

        <div className="hidden md:block">
          <Sidebar currentPage={currentPageName} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        </div>

        <main className={cn(
          "min-h-screen transition-all duration-300 pb-16 md:pb-0",
          "md:ml-[240px]",
          darkMode ? "bg-[#0f0a1a]" : "bg-gradient-to-br from-purple-50/50 via-white to-teal-50/30"
        )}>
          {children}
        </main>

        <MobileNav currentPage={currentPageName} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      </div>
    </LanguageProvider>
  );
}