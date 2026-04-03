import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const sentimentEmoji = {
  happy: '😊',
  calm: '😌',
  sad: '😢',
  stressed: '😰',
  angry: '😡',
  anxious: '😟',
  neutral: '🙂',
};

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const emoji = message.sentiment ? sentimentEmoji[message.sentiment] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3 max-w-[85%]", isUser ? "ml-auto flex-row-reverse" : "")}
    >
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
        isUser ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-gradient-to-br from-teal-400 to-cyan-500"
      )}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={cn(
        "rounded-2xl px-4 py-3",
        isUser
          ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-tr-md"
          : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-tl-md"
      )}>
        <div className={cn("text-sm leading-relaxed whitespace-pre-wrap break-words", !isUser && "max-w-none") }>
          <p>{message.content}</p>
        </div>
        {emoji && !isUser && (
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <span>{emoji}</span>
            <span className="capitalize">{message.sentiment} detected</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}