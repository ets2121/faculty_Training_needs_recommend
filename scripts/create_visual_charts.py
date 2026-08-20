from pathlib import Path

code = """'use client';

import React from 'react';
import { TrendingUp, Award, Users, Building, Sparkles, BookOpen } from 'lucide-react';

// 1. Interactive Bar Chart Component
export function VisualBarChart({
  title,
  subtitle,
  data,
  maxVal,
}: {
  title: string;
  subtitle?: string;
  data: Array<{ label: string; value: number; color?: string }>;
  maxVal?: number;
}) {
  const calculatedMax = maxVal || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div>
        <h4 className="text-sm font-bold text-light-text dark:text-white">{title}</h4>
        {subtitle && <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="space-y-3 pt-1">
        {data.map((item, idx) => {
          const pct = Math.min(100, Math.round((item.value / calculatedMax) * 100));
          const barColor = item.color || (idx === 0 ? '#10b981' : idx === 1 ? '#0284c7' : idx === 2 ? '#f59e0b' : '#64748b');

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-light-text dark:text-slate-200">{item.label}</span>
                <span className="font-mono font-bold text-light-text dark:text-slate-100">{item.value}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 2. Interactive Donut Breakdown Chart
export function VisualDonutBreakdown({
  title,
  total,
  items,
}: {
  title: string;
  total: number;
  items: Array<{ label: string; count: number; color: string }>;
}) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <h4 className="text-sm font-bold text-light-text dark:text-white">{title}</h4>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG Donut Visual */}
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {items.map((item, i) => {
              const previousTotal = items.slice(0, i).reduce((acc, curr) => acc + curr.count, 0);
              const strokeDasharray = total > 0 ? `${(item.count / total) * 282.7} 282.7` : '0 282.7';
              const strokeDashoffset = total > 0 ? -((previousTotal / total) * 282.7) : 0;

              return (
                <circle
                  key={item.label}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="10"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl font-extrabold text-light-text dark:text-white">{total}</span>
            <span className="text-[10px] text-light-text dark:text-dark-muted uppercase font-mono">Total</span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="flex-1 space-y-2.5 w-full">
          {items.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-light-text dark:text-slate-300 font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-light-text dark:text-white">{item.count}</span>
                  <span className="text-[10px] text-light-text dark:text-dark-muted">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
"""

p = Path("frontend/src/components/AdminVisualCharts.tsx")
p.write_text(code, encoding="utf-8")
print("AdminVisualCharts.tsx created successfully.")