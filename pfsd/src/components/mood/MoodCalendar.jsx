import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const moodColors = {
  happy: 'bg-yellow-400',
  calm: 'bg-blue-400',
  neutral: 'bg-purple-400',
  stressed: 'bg-orange-400',
  sad: 'bg-indigo-400',
  angry: 'bg-red-400',
  anxious: 'bg-amber-400',
};

const moodEmojis = {
  happy: '😊',
  calm: '😌',
  neutral: '🙂',
  stressed: '😰',
  sad: '😢',
  angry: '😡',
  anxious: '😟',
};

export default function MoodCalendar({ entries, currentMonth, onChangeMonth }) {
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const startDay = getDay(start);

  const getMoodForDay = (day) => {
    const entry = entries.find(e => isSameDay(new Date(e.date), day));
    return entry;
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => onChangeMonth(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => onChangeMonth(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {Array(startDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map((day) => {
          const entry = getMoodForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "aspect-square rounded-xl flex items-center justify-center text-sm transition-all relative",
                entry ? `${moodColors[entry.mood]} text-white` : "bg-gray-50 dark:bg-gray-800 text-gray-400",
                isToday && "ring-2 ring-purple-500 ring-offset-2"
              )}
              title={entry ? `${entry.mood} - ${entry.note || ''}` : format(day, 'd')}
            >
              {entry ? (
                <span className="text-lg">{moodEmojis[entry.mood]}</span>
              ) : (
                <span className="text-xs">{format(day, 'd')}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-6 justify-center">
        {Object.entries(moodColors).map(([mood, color]) => (
          <div key={mood} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded-full", color)} />
            <span className="text-xs text-gray-500 capitalize">{mood}</span>
          </div>
        ))}
      </div>
    </div>
  );
}