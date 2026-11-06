'use client';

import React, { useState } from 'react';
import { CompetencyProfile } from '@/types';
import { Award, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Sparkles, BookOpen, Layers, Info, ShieldCheck } from 'lucide-react';

interface CompetencyProfilingCardProps {
  profile: CompetencyProfile;
}

export default function CompetencyProfilingCard({ profile }: CompetencyProfilingCardProps) {
  const [showDetails, setShowDetails] = useState(true);

  // Friendly Level Mapping
  const levelTier = profile.level_tier || (profile.overall_level === 'Developing' ? 'Low' : profile.overall_level === 'Proficient' ? 'Mid' : 'High');
  
  // Custom Visual Themes per Level
  const getBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'High':
        return {
          title: 'High Competency',
          subtitle: 'Advanced & Exemplary Faculty Standing',
          tagline: 'Ready for Leadership, Mentorship & Specialized Innovation',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
          badgePill: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-500',
          gradient: 'from-emerald-500/20 via-brand-green/10 to-transparent',
          barColor: 'bg-emerald-500',
        };
      case 'Mid':
        return {
          title: 'Mid Competency',
          subtitle: 'Proficient & Operationally Competent',
          tagline: 'Consistent Performance with Opportunities in Emerging Areas',
          bg: 'bg-brand-gold/10 border-brand-gold/30 text-amber-800 dark:text-amber-200',
          badgePill: 'bg-brand-gold/20 text-brand-gold-dark dark:text-brand-gold border-brand-gold/40',
          dot: 'bg-brand-gold',
          gradient: 'from-brand-gold/20 via-amber-500/10 to-transparent',
          barColor: 'bg-brand-gold',
        };
      default: // Low
        return {
          title: 'Low Competency',
          subtitle: 'Developing / High Priority for Support',
          tagline: 'Immediate Foundation & Skills Development Recommended',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
          badgePill: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40',
          dot: 'bg-rose-500',
          gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
          barColor: 'bg-rose-500',
        };
    }
  };

  const badge = getBadgeStyle(levelTier);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 sm:p-7 shadow-xl transition-all">
      {/* Background Ambient Glow */}
      <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${badge.gradient} rounded-full blur-3xl pointer-events-none opacity-40`} />

      <div className="relative z-10 space-y-6">
        
        {/* ── 1. Top Section: Big Bold Assessment Header ───────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-light-border dark:border-dark-border pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-brand-green/15 text-brand-green border border-brand-green/25">
                Competency Evaluation Model
              </span>
              <span className="text-xs text-light-text dark:text-dark-muted font-medium">
                Individual Needs Assessment Diagnostic
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-light-text dark:text-white tracking-tight">
              Assessed Competency Level
            </h2>
            <p className="text-xs sm:text-sm text-light-text dark:text-dark-muted max-w-xl">
              Calculated across your 19 Core, Functional, and Leadership skill assessments.
            </p>
          </div>

          {/* Prominent Visual Level Banner */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl border ${badge.bg} shadow-sm shrink-0`}>
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-dark-bg/60 border border-current/20 flex items-center justify-center shrink-0 shadow-inner">
              <Award className="w-6 h-6 text-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full animate-ping ${badge.dot}`} />
                <span className="text-sm font-black uppercase tracking-wider">
                  {badge.title}
                </span>
              </div>
              <p className="text-xs font-semibold opacity-90 mt-0.5">
                {badge.subtitle}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono opacity-80">
                <span>Score: <strong>{profile.overall_index.toFixed(2)}</strong> / 5.0</span>
                <span>•</span>
                <span className="capitalize">{levelTier === 'Low' ? 'Foundational Phase' : levelTier === 'Mid' ? 'Practicing Phase' : 'Mastery Phase'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. "Why this level?" Friendly Explanation Card ───────────────── */}
        <div className="rounded-2xl bg-light-bg/70 dark:bg-dark-bg/60 border border-light-border dark:border-dark-border p-5 space-y-3.5 shadow-sm">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-brand-gold-dark dark:text-brand-gold font-extrabold text-sm sm:text-base">
              <Sparkles className="w-5 h-5 shrink-0" />
              <h3>Why this level? — {profile.explanation.headline}</h3>
            </div>
            <span className="hidden sm:inline-flex text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold-dark border border-brand-gold/20">
              Clear Summary
            </span>
          </div>

          <p className="text-xs sm:text-sm text-light-text dark:text-dark-text leading-relaxed">
            {profile.explanation.summary}
          </p>

          <div className="p-3.5 rounded-xl bg-brand-green/8 border border-brand-green/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-brand-green font-bold">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Recommended Training Strategy:</span>
            </div>
            <span className="font-semibold text-light-text dark:text-white sm:text-right">
              {profile.explanation.target_training_focus}
            </span>
          </div>
        </div>

        {/* ── 3. Three Competency Domain Summary ───────────────────────────── */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-light-text dark:text-dark-muted px-1">
            Skill Domain Breakdown
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {Object.entries(profile.domains).map(([domainKey, d]) => {
              const domainTier = d.level === 'Developing' ? 'Low' : d.level === 'Proficient' ? 'Mid' : 'High';
              return (
                <div
                  key={domainKey}
                  className="p-4 rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-brand-green/40 transition-all flex flex-col justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-light-text dark:text-white capitalize">
                      {domainKey} Domain
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      domainTier === 'High'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                        : domainTier === 'Mid'
                        ? 'bg-brand-gold/10 text-brand-gold-dark dark:text-brand-gold border-brand-gold/25'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                    }`}>
                      {domainTier} Level
                    </span>
                  </div>

                  {/* Progress bar visual */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-light-text dark:text-dark-muted">Proficiency Score</span>
                      <strong className="text-light-text dark:text-white">{d.index.toFixed(2)} / 5.0</strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-light-border dark:bg-dark-border overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          domainTier === 'High' ? 'bg-emerald-500' : domainTier === 'Mid' ? 'bg-brand-gold' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, (d.index / 5.0) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-light-border dark:border-dark-border/50 text-light-text dark:text-dark-muted">
                    <span>{d.count} Evaluated Skills</span>
                    {d.gaps_count > 0 ? (
                      <span className="text-amber-500 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {d.gaps_count} Growth Gap{d.gaps_count > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-emerald-500 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Strong
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 4. Toggleable Diagnostic: Strengths vs Gaps ──────────────────── */}
        <div className="pt-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border text-xs font-bold text-light-text dark:text-white hover:border-brand-green transition-all"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-green" />
              <span>Detailed Competency Diagnostics (Key Strengths & Growth Gaps)</span>
            </div>
            {showDetails ? <ChevronUp className="w-4 h-4 text-brand-green" /> : <ChevronDown className="w-4 h-4 text-brand-green" />}
          </button>

          {showDetails && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              {/* Strengths Card */}
              <div className="p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4" />
                    <span>Top Strengths</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                    High Mastery
                  </span>
                </div>
                {profile.strengths.length === 0 ? (
                  <p className="text-xs text-light-text dark:text-dark-muted">No standout strengths recorded.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {profile.strengths.map((s) => (
                      <li key={s.key} className="flex items-center justify-between text-xs gap-3 p-2.5 rounded-xl bg-white/60 dark:bg-dark-card/60 border border-emerald-500/15">
                        <span className="text-light-text dark:text-dark-text font-bold">{s.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                            {s.proficiency}/5 Proficiency
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Growth Areas (Gaps) Card */}
              <div className="p-5 rounded-2xl border border-rose-500/25 bg-rose-500/5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Growth Gaps (Needs Training)</span>
                  </div>
                  <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-bold">
                    Target Interventions
                  </span>
                </div>
                {profile.growth_areas.length === 0 ? (
                  <p className="text-xs text-light-text dark:text-dark-muted">No urgent training gaps flagged.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {profile.growth_areas.map((g) => (
                      <li key={g.key} className="space-y-1 p-2.5 rounded-xl bg-white/60 dark:bg-dark-card/60 border border-rose-500/15">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="text-light-text dark:text-dark-text font-bold">{g.title}</span>
                          <span className="font-mono text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-md shrink-0">
                            Gap: +{g.gap}
                          </span>
                        </div>
                        <p className="text-[11px] text-light-text dark:text-dark-muted leading-relaxed">
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
