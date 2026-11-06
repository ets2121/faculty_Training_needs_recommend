'use client';

import React, { useState } from 'react';
import { CompetencyProfile } from '@/types';
import { Award, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Sparkles, BookOpen, Layers, ShieldCheck, ChevronRight } from 'lucide-react';

interface CompetencyProfilingCardProps {
  profile: CompetencyProfile;
  defaultExpanded?: boolean;
}

export default function CompetencyProfilingCard({ profile, defaultExpanded = false }: CompetencyProfilingCardProps) {
  // Main accordion state
  const [isAccordionOpen, setIsAccordionOpen] = useState(defaultExpanded);
  // Internal diagnostic details state
  const [showDiagnosticDetails, setShowDiagnosticDetails] = useState(false);

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
          iconColor: 'text-emerald-500',
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
          iconColor: 'text-brand-gold',
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
          iconColor: 'text-rose-500',
        };
    }
  };

  const badge = getBadgeStyle(levelTier);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-xl transition-all">
      {/* Background Ambient Glow */}
      <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${badge.gradient} rounded-full blur-3xl pointer-events-none opacity-30`} />

      {/* ── ACCORDION HEADER (Always Visible & Clickable) ────────────────── */}
      <button
        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
        className="w-full text-left p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-light-bg/40 dark:hover:bg-dark-bg/30 transition-all focus:outline-none"
      >
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-brand-green" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-brand-green/15 text-brand-green border border-brand-green/25">
                Evaluation Model
              </span>
              <span className="text-xs text-light-text dark:text-dark-muted font-medium">
                Needs Assessment Diagnostic
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-light-text dark:text-white mt-1 tracking-tight flex items-center gap-2">
              <span>Assessed Competency Level</span>
            </h3>
            <p className="text-xs text-light-text dark:text-dark-muted truncate mt-0.5 max-w-xl">
              {isAccordionOpen ? 'Click to collapse evaluation details' : 'Click to view full "Why this level?" diagnostic, domain scores, and skill gaps'}
            </p>
          </div>
        </div>

        {/* Level Banner & Accordion Toggle Icon */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border ${badge.bg} shadow-sm`}>
            <span className={`w-2.5 h-2.5 rounded-full animate-ping ${badge.dot}`} />
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <span>LEVEL: {levelTier}</span>
                <span className="font-mono opacity-75 font-normal">({profile.overall_index.toFixed(2)}/5.0)</span>
              </div>
              <p className="text-[10px] font-medium opacity-90 leading-tight">
                {badge.subtitle.split('/')[0].trim()}
              </p>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border flex items-center justify-center text-brand-green">
            {isAccordionOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* ── ACCORDION BODY (Expandable Details) ─────────────────────────── */}
      {isAccordionOpen && (
        <div className="p-5 sm:p-6 pt-0 border-t border-light-border dark:border-dark-border/80 space-y-6 animate-fade-in mt-1">
          
          {/* "Why this level?" Friendly Explanation Card */}
          <div className="rounded-2xl bg-light-bg/70 dark:bg-dark-bg/60 border border-light-border dark:border-dark-border p-5 space-y-3.5 shadow-sm mt-4">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-brand-gold-dark dark:text-brand-gold font-extrabold text-sm sm:text-base">
                <Sparkles className="w-5 h-5 shrink-0" />
                <h4>Why this level? — {profile.explanation.headline}</h4>
              </div>
              <span className="hidden sm:inline-flex text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold-dark border border-brand-gold/20">
                Diagnostic Justification
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

          {/* Three Competency Domain Summary */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-light-text dark:text-dark-muted px-1">
              Skill Domain Breakdown & Progress
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
                          <AlertTriangle className="w-3 h-3" /> {d.gaps_count} Gap{d.gaps_count > 1 ? 's' : ''}
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

          {/* Sub-Accordion: Strengths vs Gaps */}
          <div className="pt-1">
            <button
              onClick={() => setShowDiagnosticDetails(!showDiagnosticDetails)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border text-xs font-bold text-light-text dark:text-white hover:border-brand-green transition-all"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-green" />
                <span>Detailed Skill Strengths & Growth Areas Breakdown</span>
              </div>
              {showDiagnosticDetails ? <ChevronUp className="w-4 h-4 text-brand-green" /> : <ChevronDown className="w-4 h-4 text-brand-green" />}
            </button>

            {showDiagnosticDetails && (
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
                          <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md shrink-0">
                            {s.proficiency}/5
                          </span>
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
                      Targeted for Catalog
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
      )}
    </div>
  );
}
