import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, MessageCircle, BarChart3, Gamepad2, Menu, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from './Sidebar';

const quickNav = [
  { name: 'Home', icon: Home, page: 'Home' },
  { name: 'Chat', icon: MessageCircle, page: 'Chat' },
  { name: 'Mood', icon: BarChart3, page: 'MoodTracker' },
  { name: 'Games', icon: Gamepad2, page: 'Games' },
  { name: 'Feed', icon: Star, page: 'PositivityFeed' },
];

export default function MobileNav({ currentPage, darkMode, onToggleDarkMode }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-purple-100 dark:border-purple-900/30">
      <div className="flex items-center">
        {quickNav.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <Link key={item.page} to={createPageUrl(item.page)}
              className={cn("flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors",
                isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-400 hover:text-purple-500"
              )}>
              <item.icon className={cn("w-5 h-5", isActive && "text-purple-600")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-gray-400 hover:text-purple-500">
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px]">
            <Sidebar currentPage={currentPage} darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}