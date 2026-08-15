'use client';

import React from 'react';
import { Sparkles, Brain, RefreshCw } from 'lucide-react';

// ─── Table Skeleton Loader ───────────────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full animate-pulse space-y-3">
      {/* Skeleton header */}
      <div className="h-10 bg-white dark:bg-dark-bg/60 dark:bg-white dark:bg-dark-bg/60 rounded-xl w-full flex items-center px-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 bg-light-border dark:bg-dark-border rounded-md"
            style={{ width: i === 0 ? '25%' : i === cols - 1 ? '15%' : '20%' }}
          />
        ))}
      </div>

      {/* Skeleton rows */}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="h-14 bg-white dark:bg-dark-card dark:bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/40 rounded-xl px-4 flex items-center gap-4"
          >
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 bg-white dark:bg-dark-bg/80 rounded-md"
                style={{
                  width: c === 0 ? '30%' : c === cols - 1 ? '12%' : '18%',
                  opacity: 1 - r * 0.1,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card Grid Skeleton Loader ───────────────────────────────────────────────
export function CardGridSkeleton({ count = 4, cols = 'grid-cols-1 md:grid-cols-2' }: { count?: number; cols?: string }) {
  return (
    <div className={`grid ${cols} gap-4 animate-pulse`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-white dark:bg-dark-bg rounded w-20" />
            <div className="h-4 bg-white dark:bg-dark-bg rounded w-16" />
          </div>
          <div className="h-5 bg-white dark:bg-dark-bg/80 rounded w-3/4" />
          <div className="h-3 bg-white dark:bg-dark-bg/60 rounded w-full" />
          <div className="h-3 bg-white dark:bg-dark-bg/60 rounded w-5/6" />
          <div className="flex gap-2 pt-2">
            <div className="h-4 bg-white dark:bg-dark-bg rounded w-14" />
            <div className="h-4 bg-white dark:bg-dark-bg rounded w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Profile Skeleton Loader ─────────────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-40 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-8 flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-dark-bg shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-white dark:bg-dark-bg rounded w-1/3" />
          <div className="h-4 bg-white dark:bg-dark-bg/60 rounded w-1/4" />
          <div className="h-4 bg-white dark:bg-dark-bg/40 rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-64 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 space-y-4">
          <div className="h-5 bg-white dark:bg-dark-bg rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-4 bg-white dark:bg-dark-bg/60 rounded" />
            <div className="h-4 bg-white dark:bg-dark-bg/60 rounded" />
            <div className="h-4 bg-white dark:bg-dark-bg/60 rounded" />
          </div>
        </div>
        <div className="h-64 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 space-y-4">
          <div className="h-5 bg-white dark:bg-dark-bg rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-4 bg-white dark:bg-dark-bg/60 rounded" />
            <div className="h-4 bg-white dark:bg-dark-bg/60 rounded" />
            <div className="h-4 bg-white dark:bg-dark-bg/60 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recommendation Skeleton Loader (when generating/re-running) ─────────────
export function RecommendationSkeleton({ message = 'Running ML Prediction Engine & Matching Training Programs...' }: { message?: string }) {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Banner Skeleton with pulsing message */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center text-brand-green shrink-0">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-green" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-3.5 bg-brand-green/40 rounded-full w-28" />
              <span className="h-3.5 bg-white dark:bg-dark-bg rounded-full w-16" />
            </div>
            <div className="h-5 bg-light-border dark:bg-dark-border rounded-lg w-3/4 max-w-md" />
            <p className="text-xs text-brand-green font-mono flex items-center gap-1.5 pt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{message}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Model Prediction Categories Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white dark:bg-dark-bg rounded-full" />
          <div className="h-4 bg-white dark:bg-dark-bg rounded w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card"
            >
              <div className="w-13 h-13 rounded-full bg-white dark:bg-dark-bg shrink-0" style={{ width: 52, height: 52 }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white dark:bg-dark-bg rounded w-12" />
                <div className="h-4 bg-light-border dark:bg-dark-border rounded w-full" />
                <div className="h-3 bg-white dark:bg-dark-bg rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Catalog Recommendation Cards Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white dark:bg-dark-bg rounded-full" />
          <div className="h-4 bg-white dark:bg-dark-bg rounded w-56" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-white dark:bg-dark-bg rounded w-16" />
                  <div className="h-4 bg-white dark:bg-dark-bg rounded w-28" />
                </div>
                <div className="h-5 bg-light-border dark:bg-dark-border rounded w-4/5" />
                <div className="h-3 bg-white dark:bg-dark-bg/80 rounded w-full" />
                <div className="h-3 bg-white dark:bg-dark-bg/80 rounded w-2/3" />
                <div className="h-7 bg-brand-green/10 border border-brand-green/20 rounded-lg w-full max-w-lg" />
              </div>
              <div className="w-20 h-20 bg-white dark:bg-dark-bg/80 rounded-2xl shrink-0 self-center md:self-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
