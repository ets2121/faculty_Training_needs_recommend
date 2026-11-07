'use client';

import React, { useState } from 'react';
import { CompetencyProfile } from '@/types';
import {
  Award,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Layers,
  FileText,
} from 'lucide-react';

interface CompetencyProfilingCardProps {
  profile: CompetencyProfile & { department_metrics?: any };
  defaultExpanded?: boolean;
  isDepartment?: boolean;
  departmentName?: string;
  facultyCount?: number;
}

export default function CompetencyProfilingCard({
  profile,
  defaultExpanded = false,
  isDepartment = false,
  departmentName,
  facultyCount,
}: CompetencyProfilingCardProps) {
  // Main accordion state (compact by default)
  const [isAccordionOpen, setIsAccordionOpen] = useState(defaultExpanded);

  // Sub-collapsible sections (compact by default to avoid visual overload)
  const [showPartBreakdown, setShowPartBreakdown] = useState(false);
  const [showDomainBreakdown, setShowDomainBreakdown] = useState(false);
  const [showDeepDiagnostic, setShowDeepDiagnostic] = useState(false);

  // Friendly Level Mapping (Low, Mid, High)
  const levelTier =
    profile.level_tier ||
    (profile.overall_level === 'Developing'
      ? 'Low'
      : profile.overall_level === 'Proficient'
      ? 'Mid'
      : 'High');

  // Custom Visual Themes per Level
  const getBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'High':
        return {
          title: 'High Competency',
          subtitle: 'Advanced Standing (Mastery Phase)',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
          dot: 'bg-emerald-500',
          gradient: 'from-emerald-500/20 via-brand-green/10 to-transparent',
          barColor: 'bg-emerald-500',
        };
      case 'Mid':
        return {
          title: 'Mid Competency',
          subtitle: 'Proficient Standing (Practicing Phase)',
          bg: 'bg-brand-gold/10 border-brand-gold/30 text-amber-800 dark:text-amber-200',
          dot: 'bg-brand-gold',
          gradient: 'from-brand-gold/20 via-amber-500/10 to-transparent',
          barColor: 'bg-brand-gold',
        };
      default: // Low
        return {
          title: 'Low Competency',
          subtitle: 'Developing Standing (Foundational Phase)',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
          dot: 'bg-rose-500',
          gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
          barColor: 'bg-rose-500',
        };
    }
  };

  const getTierPill = (tier: string) => {
    switch (tier) {
      case 'High':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'Mid':
        return 'bg-brand-gold/15 text-amber-800 dark:text-amber-300 border-brand-gold/30';
      default:
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
    }
  };

  const badge = getBadgeStyle(levelTier);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md transition-all">
      {/* Background Ambient Glow */}
      <div
        className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br ${badge.gradient} rounded-full blur-3xl pointer-events-none opacity-25`}
      />

      {/* ── COMPACT ACCORDION HEADER (Glanceable & Clickable) ──────────────── */}
      <div
        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
        className="w-full text-left p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3.5 hover:bg-light-bg/40 dark:hover:bg-dark-bg/30 transition-all cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-brand-green" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-brand-green/15 text-brand-green border border-brand-green/25">
                {isDepartment ? 'Department Competency Evaluation' : 'Competency Evaluation'}
              </span>
              <span className="text-[11px] text-light-text dark:text-dark-muted font-medium truncate">
                {isDepartment
                  ? `Multi-Faculty Assessment Synthesis${
                      facultyCount || profile.department_metrics?.faculty_count
                        ? ` (${facultyCount || profile.department_metrics?.faculty_count} Faculty Evaluated)`
                        : ''
                    }`
                  : 'Based on Questionnaire Assessment'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-light-text dark:text-white mt-0.5 tracking-tight flex items-center gap-2">
              <span>
                {isDepartment
                  ? departmentName
                    ? `Department Competency Level — ${departmentName}`
                    : 'Department Competency Level'
                  : 'Assessed Competency Level'}
              </span>
            </h3>
          </div>
        </div>

        {/* Level Banner & Prominent Text Action Button */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 flex-wrap">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${badge.bg} shadow-sm`}>
            <span className={`w-2 h-2 rounded-full animate-ping ${badge.dot}`} />
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-wider">
                {isDepartment ? 'DEPT LEVEL' : 'LEVEL'}: {levelTier}
              </div>
              <p className="text-[10px] font-medium opacity-90 leading-tight">
                {profile.overall_level} ({profile.overall_index.toFixed(2)}/5.0)
              </p>
            </div>
          </div>

          {/* Explicit Expand / Collapse Text Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAccordionOpen(!isAccordionOpen);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-md transition-all group"
          >
            <span>
              {isAccordionOpen
                ? isDepartment
                  ? 'Hide Department Details'
                  : 'Hide Assessment Details'
                : isDepartment
                ? 'Show Department Assessment Details'
                : 'Show Assessment Details'}
            </span>
            {isAccordionOpen ? (
              <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            ) : (
              <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── EXPANDABLE EVALUATION DETAILS (Compact & Structured) ─────────── */}
      {isAccordionOpen && (
        <div className="p-4 sm:p-5 pt-0 border-t border-light-border dark:border-dark-border/80 space-y-4 animate-fade-in mt-1">
          {/* 1. Clear Key Insight with Visual Highlights & ML Confirmation Signal */}
          <div className="p-4 sm:p-5 rounded-2xl bg-light-bg/80 dark:bg-dark-bg/60 border border-light-border dark:border-dark-border space-y-3.5 mt-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-light-border/60 dark:border-dark-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-gold shrink-0" />
                <h4 className="font-extrabold text-sm sm:text-base text-light-text dark:text-white tracking-tight">
                  {profile.explanation.headline}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getTierPill(levelTier)}`}>
                  {levelTier} Tier ({profile.overall_index.toFixed(2)}/5.0)
                </span>
                {profile.ml_signal && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20">
                    ⚡ {profile.ml_signal.model_support_label}
                  </span>
                )}
              </div>
            </div>

            {/* Highlighted Key Points Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border">
                <span className="text-[10px] uppercase font-mono tracking-wider text-light-text/60 dark:text-dark-muted block">
                  {isDepartment ? 'Department Strengths' : 'Demonstrated Strengths'}
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block truncate">
                  {profile.explanation.strengths_summary ||
                    (profile.strengths?.[0]?.title ?? 'Core Pedagogy')}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border">
                <span className="text-[10px] uppercase font-mono tracking-wider text-light-text/60 dark:text-dark-muted block">
                  {isDepartment ? 'Department Priority Gaps' : 'Priority Growth Gaps'}
                </span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-0.5 block truncate">
                  {profile.explanation.gaps_summary ||
                    (profile.growth_areas?.[0]?.title ?? 'Specialized Domains')}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border">
                <span className="text-[10px] uppercase font-mono tracking-wider text-light-text/60 dark:text-dark-muted block">
                  {isDepartment ? 'Department Strategy' : 'Recommended Action'}
                </span>
                <span className="text-xs font-bold text-brand-green mt-0.5 block truncate">
                  {isDepartment ? 'Targeted Faculty Upskilling' : 'Applied Specialization'}
                </span>
              </div>
            </div>

            {/* Diagnostic Summary Text */}
            <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
              {profile.explanation.summary}
            </p>

            {/* Strategy & ML Deficit Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-light-border/60 dark:border-dark-border/60 text-xs">
              <span className="flex items-center gap-1.5 text-brand-green font-semibold">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>Focus: {profile.explanation.target_training_focus}</span>
              </span>
              {profile.ml_signal?.top_predicted_deficit && (
                <span className="text-[11px] text-brand-gold font-mono">
                  Model Predicted Priority: <strong>{profile.ml_signal.top_predicted_deficit}</strong>
                </span>
              )}
            </div>
          </div>

          {/* 2. Questionnaire Part Level Breakdown (Collapsible Drawer with Explicit Button) */}
          {profile.part_levels && profile.part_levels.length > 0 && (
            <div className="rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setShowPartBreakdown(!showPartBreakdown)}
                className="w-full text-left p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-light-bg/50 dark:hover:bg-dark-bg/40 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-green" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-light-text dark:text-white">
                    {isDepartment ? 'Department Questionnaire Composition Breakdown' : 'Questionnaire Required Parts Level Assessment'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-light-muted-surface dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text/60 dark:text-dark-muted hidden sm:inline-block">
                    5 Required Parts
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-green/10 text-brand-green text-xs font-bold hover:bg-brand-green hover:text-white transition-all">
                  <span>{showPartBreakdown ? 'Hide 5-Part Breakdown' : 'Show 5-Part Breakdown'}</span>
                  {showPartBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {showPartBreakdown && (
                <div className="p-3.5 sm:p-4 pt-0 border-t border-light-border/60 dark:border-dark-border/60 animate-fade-in mt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {profile.part_levels.map((part) => (
                      <div
                        key={part.part_number}
                        className="p-3 rounded-xl border border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/40 flex flex-col justify-between gap-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold text-light-text dark:text-white truncate">
                            Part {part.part_number}: {part.title}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 ${getTierPill(
                              part.level_tier
                            )}`}
                          >
                            {part.level_tier} Level
                          </span>
                        </div>

                        <div className="text-[11px] text-light-text dark:text-dark-muted leading-snug">
                          <strong className="text-light-text dark:text-dark-text block mb-0.5">
                            {part.level_label}
                          </strong>
                          <span className="text-[10.5px] opacity-90">{part.why}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Skill Domain Breakdown (Collapsible Drawer with Explicit Button) */}
          <div className="rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setShowDomainBreakdown(!showDomainBreakdown)}
              className="w-full text-left p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-light-bg/50 dark:hover:bg-dark-bg/40 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-gold" />
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-light-text dark:text-white">
                  {isDepartment ? 'Department Competency Domain Scores' : 'Competency Domain Scores'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-light-muted-surface dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text/60 dark:text-dark-muted hidden sm:inline-block">
                  {isDepartment ? 'Core, Functional, Leadership collective averages' : 'Core, Functional, Leadership'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-gold/10 text-amber-800 dark:text-amber-200 text-xs font-bold hover:bg-brand-gold hover:text-white transition-all">
                <span>{showDomainBreakdown ? 'Hide Domain Scores' : 'Show Domain Scores'}</span>
                {showDomainBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showDomainBreakdown && (
              <div className="p-3.5 sm:p-4 pt-0 border-t border-light-border/60 dark:border-dark-border/60 animate-fade-in mt-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {Object.entries(profile.domains).map(([domainKey, d]) => {
                    const domainTier =
                      d.level === 'Developing' ? 'Low' : d.level === 'Proficient' ? 'Mid' : 'High';
                    return (
                      <div
                        key={domainKey}
                        className="p-3 rounded-xl border border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/40 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-light-text dark:text-white capitalize">
                            {domainKey} Domain
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${getTierPill(
                              domainTier
                            )}`}
                          >
                            {domainTier} ({d.index.toFixed(2)})
                          </span>
                        </div>
                        {/* Micro Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-light-border dark:bg-dark-border overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              domainTier === 'High'
                                ? 'bg-emerald-500'
                                : domainTier === 'Mid'
                                ? 'bg-brand-gold'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(10, (d.index / 5.0) * 100))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-dark-muted pt-0.5">
                          <span>{d.count} Skills</span>
                          {d.gaps_count > 0 ? (
                            <span className="text-amber-500 font-semibold">
                              {d.gaps_count} gap{d.gaps_count > 1 ? 's' : ''} flagged
                            </span>
                          ) : (
                            <span className="text-emerald-500 font-medium">No gaps</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Deep Diagnostic (Strengths & Gaps) with Explicit Button */}
          <div className="rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setShowDeepDiagnostic(!showDeepDiagnostic)}
              className="flex items-center justify-between w-full p-3.5 sm:p-4 hover:bg-light-bg/50 dark:hover:bg-dark-bg/40 text-xs font-bold text-light-text dark:text-white transition-all focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-green" />
                <span className="font-mono uppercase tracking-wider">
                  {isDepartment ? 'Department Strengths & Critical Growth Gaps' : 'Top Strengths & Flagged Growth Gaps'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-green/10 text-brand-green text-xs font-bold hover:bg-brand-green hover:text-white transition-all">
                <span>{showDeepDiagnostic ? 'Hide Deep Dive' : isDepartment ? 'Show Department Deep Dive' : 'Show Strengths & Gaps Deep Dive'}</span>
                {showDeepDiagnostic ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showDeepDiagnostic && (
              <div className="p-3.5 sm:p-4 pt-0 border-t border-light-border/60 dark:border-dark-border/60 animate-fade-in mt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Strengths */}
                  <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isDepartment ? 'Department Standout Strengths' : 'Standout Strengths (Proficiency ≥ 4)'}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {profile.strengths.map((s) => (
                        <li
                          key={s.key}
                          className="flex items-center justify-between py-1 border-b border-emerald-500/10 last:border-0"
                        >
                          <span className="text-light-text dark:text-white font-medium">{s.title}</span>
                          <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {s.proficiency}/5
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Growth Areas */}
                  <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold uppercase text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{isDepartment ? 'Department Priority Gaps (Target Upskilling)' : 'Priority Growth Gaps (Need Upskilling)'}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {profile.growth_areas.map((g) => (
                        <li
                          key={g.key}
                          className="py-1 border-b border-amber-500/10 last:border-0 space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-light-text dark:text-white font-medium">
                              {g.title}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500">
                              Gap: +{g.gap}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-light-text/70 dark:text-dark-muted">
                            {g.reason}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
