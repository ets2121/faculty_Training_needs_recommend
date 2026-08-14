'use client';

import React from 'react';

// ─── Table Skeleton Loader ───────────────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full animate-pulse space-y-3">
      {/* Skeleton header */}
      <div className="h-10 bg-slate-800/60 rounded-xl w-full flex items-center px-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 bg-slate-700/60 rounded-md"
            style={{ width: i === 0 ? '25%' : i === cols - 1 ? '15%' : '20%' }}
          />
        ))}
      </div>

      {/* Skeleton rows */}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="h-14 bg-slate-900/40 border border-slate-800/40 rounded-xl px-4 flex items-center gap-4"
          >
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 bg-slate-800/80 rounded-md"
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
          className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-800 rounded w-20" />
            <div className="h-4 bg-slate-800 rounded w-16" />
          </div>
          <div className="h-5 bg-slate-800/80 rounded w-3/4" />
          <div className="h-3 bg-slate-800/60 rounded w-full" />
          <div className="h-3 bg-slate-800/60 rounded w-5/6" />
          <div className="flex gap-2 pt-2">
            <div className="h-4 bg-slate-800 rounded w-14" />
            <div className="h-4 bg-slate-800 rounded w-14" />
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
      <div className="h-40 rounded-3xl bg-slate-900/60 border border-slate-800 p-8 flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-slate-800 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-slate-800 rounded w-1/3" />
          <div className="h-4 bg-slate-800/60 rounded w-1/4" />
          <div className="h-4 bg-slate-800/40 rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-64 rounded-3xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
          <div className="h-5 bg-slate-800 rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-800/60 rounded" />
            <div className="h-4 bg-slate-800/60 rounded" />
            <div className="h-4 bg-slate-800/60 rounded" />
          </div>
        </div>
        <div className="h-64 rounded-3xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
          <div className="h-5 bg-slate-800 rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-800/60 rounded" />
            <div className="h-4 bg-slate-800/60 rounded" />
            <div className="h-4 bg-slate-800/60 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
