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
      className="relative p-2 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-brand-green text-light-text dark:text-dark-text hover:text-brand-green transition-all duration-200"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-brand-gold animate-fade-in" />
      ) : (
        <Moon className="w-4 h-4 text-brand-green animate-fade-in" />
      )}
    </button>
  );
}
