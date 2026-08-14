'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (debouncedValue: string) => void;
  debounceMs?: number;
  className?: string;
}

export default function SearchInput({
  placeholder = 'Search...',
  value: initialValue = '',
  onChange,
  debounceMs = 300,
  className = '',
}: SearchInputProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  useEffect(() => {
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      onChange(searchTerm);
      setIsDebouncing(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs, onChange]);

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
      
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-950/80 border border-slate-700/80 hover:border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs text-white placeholder-slate-500 rounded-xl pl-9.5 pr-8 py-2.5 outline-none transition-all"
      />

      {isDebouncing && searchTerm ? (
        <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin absolute right-3" />
      ) : searchTerm ? (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 absolute right-2.5 transition-colors"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
}
