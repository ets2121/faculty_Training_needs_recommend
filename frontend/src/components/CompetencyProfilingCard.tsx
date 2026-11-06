'use client';

import React, { useState } from 'react';
import { CompetencyProfile } from '@/types';
import { Award, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Sparkles, BookOpen, Layers } from 'lucide-react';

interface CompetencyProfilingCardProps {
  profile: CompetencyProfile;
}

export default function CompetencyProfilingCard({ profile }: CompetencyProfilingCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Badge styling based on level
  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'Advanced':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          gradient: 'from-emerald-500/20 via-brand-green/10 to-transparent',
        };
      case 'Proficient':
        return {
          bg: 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold-dark dark:text-brand-gold',
          dot: 'bg-brand-gold',
          gradient: 'from-brand-gold/20 via-amber-500/10 to-transparent',
        };
      default: // Developing
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
          dot: 'bg-rose-500',
          gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
        };
    }
  };

  const badge = getBadgeStyle(profile.overall_level);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-5 sm:p-6 shadow-xl transition-all">
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br ${badge.gradient} rounded-full blur-3xl pointer-events-none opacity-40`} />

      <div className="relative z-10 space-y-6">
        {/* Top Header: Step Badge & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-brand-green/15 text-brand-green border border-brand-green/25">
                  Tier 1 Evaluation Model
                </span>
                <span className="text-xs text-light-text dark:text-dark-muted">
                  Faculty Needs Assessment
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-light-text dark:text-white mt-0.5">
                Current Competency Level & Assessment
              </h3>
            </div>
          </div>

          {/* Level Pill */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${badge.bg}`}>
            <span className={`w-2 h-2 rounded-full animate-ping ${badge.dot}`} />
            <span>{profile.level_title}</span>
            <span className="font-mono opacity-80">({profile.overall_index.toFixed(2)} / 5.0)</span>
          </div>
        </div>

        {/* User-Friendly "Why this level?" Banner */}
        <div className="p-4 sm:p-5 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/80 space-y-3">
          <div className="flex items-center gap-2 text-brand-gold-dark dark:text-brand-gold font-bold text-sm">
            <Sparkles className="w-4 h-4 shrink-0" />
            <h4>Why this level? — {profile.explanation.headline}</h4>
          </div>
          <p className="text-xs sm:text-sm text-light-text dark:text-dark-text leading-relaxed">
            {profile.explanation.summary}
          </p>
          <div className="flex items-start sm:items-center gap-2 pt-1 text-xs text-brand-green font-medium">
            <BookOpen className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>Target Training Focus:</strong> {profile.explanation.target_training_focus}
            </span>
          </div>
        </div>

        {/* Domain Score Breakdown Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(profile.domains).map(([domainKey, d]) => (
            <div
              key={domainKey}
              className="p-3.5 rounded-xl border border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-card/50 flex items-center justify-between"
            >
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-light-text dark:text-dark-muted capitalize">
                  {domainKey} Competencies
                </p>
                <p className="text-xs font-bold text-light-text dark:text-white mt-0.5">
                  {d.level} <span className="text-[11px] font-mono text-dark-muted font-normal">({d.index.toFixed(2)})</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-green/10 text-brand-green border border-brand-green/20">
                  {d.count} Skills
                </span>
                {d.gaps_count > 0 && (
                  <p className="text-[10px] text-amber-500 mt-1 font-medium">
                    {d.gaps_count} gap{d.gaps_count > 1 ? 's' : ''} flagged
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Toggleable Diagnostic Details: Strengths & Growth Areas */}
        <div className="pt-1">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-xs font-bold text-brand-green hover:underline focus:outline-none"
          >
            <Layers className="w-4 h-4" />
            <span>{showDetails ? 'Hide Detailed Competency Analysis' : 'View Strengths & Growth Gaps Analysis'}</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in pt-2">
              {/* Strengths */}
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" />
                  <span>Key Competency Strengths</span>
                </div>
                {profile.strengths.length === 0 ? (
                  <p className="text-xs text-dark-muted">No standout strengths recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {profile.strengths.map((s) => (
                      <li key={s.key} className="flex items-start justify-between text-xs gap-2">
                        <span className="text-light-text dark:text-dark-text font-medium">{s.title}</span>
                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                          {s.proficiency}/5
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Growth Areas (Gaps) */}
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Identified Growth Gaps (Needs Training)</span>
                </div>
                {profile.growth_areas.length === 0 ? (
                  <p className="text-xs text-dark-muted">No significant training gaps identified.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {profile.growth_areas.map((g) => (
                      <li key={g.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="text-light-text dark:text-dark-text font-medium">{g.title}</span>
                          <span className="font-mono text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded shrink-0">
                            Gap: +{g.gap}
                          </span>
                        </div>
                        <p className="text-[11px] text-light-text/70 dark:text-dark-muted">
                          {g.reason}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

