import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, Heart, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const helplines = [
  { name: "National Suicide Prevention Lifeline", number: "988", region: "US" },
  { name: "Crisis Text Line", number: "Text HOME to 741741", region: "US" },
  { name: "AASRA", number: "9820466726", region: "India" },
  { name: "iCall", number: "9152987821", region: "India" },
  { name: "Vandrevala Foundation", number: "1860-2662-345", region: "India" },
  { name: "Samaritans", number: "116 123", region: "UK" },
];

export default function CrisisModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6" />
                  <h2 className="text-xl font-bold">You're Not Alone</h2>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-sm text-white/90">
                It sounds like you're going through a really tough time. Please reach out to someone who can help.
              </p>
            </div>

            {/* Helplines */}
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Crisis helpline numbers:
              </p>
              {helplines.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{h.name}</p>
                    <p className="text-xs text-gray-500">{h.region}</p>
                  </div>
                  <a
                    href={`tel:${h.number.replace(/\D/g, '')}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {h.number}
                  </a>
                </div>
              ))}

              <div className="mt-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  💜 Remember: Asking for help is a sign of strength. You matter, and people care about you.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <Button onClick={onClose} className="w-full bg-gradient-to-r from-purple-500 to-teal-500 hover:opacity-90">
                I Understand
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}