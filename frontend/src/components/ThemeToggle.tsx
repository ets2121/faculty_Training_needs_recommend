'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle Theme"
      className="relative p-2 rounded-xl border border-slate-700/60 dark:border-slate-800 bg-slate-800/40 dark:bg-slate-900/60 hover:border-emerald-500/50 text-slate-300 dark:text-slate-300 hover:text-emerald-400 dark:hover:text-emerald-400 transition-all duration-200"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-gold-400 animate-fade-in" />
      ) : (
        <Moon className="w-4 h-4 text-emerald-600 animate-fade-in" />
      )}
    </button>
  );
}
