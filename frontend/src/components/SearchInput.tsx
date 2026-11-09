'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  // Store onChange in ref to prevent re-triggering debounce on every parent re-render
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Track the last value emitted to the parent to prevent duplicate triggers
  const lastEmittedValueRef = useRef(initialValue);
  const isInitialMount = useRef(true);

  // Sync state if parent changes initialValue externally (e.g. clear filters)
  useEffect(() => {
    if (initialValue !== lastEmittedValueRef.current) {
      setSearchTerm(initialValue);
      lastEmittedValueRef.current = initialValue;
    }
  }, [initialValue]);

  // Debounced notification on actual user keystrokes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only debounce if the search term actually changed from what was already emitted
    if (searchTerm === lastEmittedValueRef.current) {
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      lastEmittedValueRef.current = searchTerm;
      onChangeRef.current(searchTerm);
      setIsDebouncing(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  const handleClear = () => {
    setSearchTerm('');
    lastEmittedValueRef.current = '';
    setIsDebouncing(false);
    onChangeRef.current('');
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-light-text dark:text-dark-muted absolute left-3.5 pointer-events-none" />
      
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-light-bg dark:bg-dark-bg/80 border border-light-border dark:border-dark-border/80 hover:border-brand-green focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs text-white placeholder:text-light-text dark:placeholder:text-dark-muted rounded-xl pl-9.5 pr-8 py-2.5 outline-none transition-all"
      />

      {isDebouncing && searchTerm ? (
        <Loader2 className="w-3.5 h-3.5 text-brand-green animate-spin absolute right-3" />
      ) : searchTerm ? (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded-md text-light-text dark:text-dark-muted hover:text-white hover:bg-white dark:bg-dark-bg absolute right-2.5 transition-colors"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
}
