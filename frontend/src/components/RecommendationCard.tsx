'use client';

import React from 'react';
import { RecommendationResult, DepartmentRecommendationResult, CatalogRecommendationItem } from '@/types';
import { BookOpen, Check, Sparkles, Target, Info, Clock, Calendar } from 'lucide-react';
import { formatPercent, formatManila } from '@/lib/utils';

interface RecommendationCardProps {
  result: RecommendationResult | DepartmentRecommendationResult;
  title?: string;
  subtitle?: string;
  facultyName?: string;
  timestamp?: string | null;
  statsRow?: React.ReactNode;
  noticeBanner?: React.ReactNode;
  scopeLabel?: string;
}

// ─── Mini SVG Donut Chart ────────────────────────────────────────────────────
function DonutChart({ probability, color = '#10b981' }: { probability: number; color?: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(Math.max(probability, 0), 1) * circ;
  const gap = circ - filled;

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      {/* Track */}
      <circle cx="26" cy="26" r={r} fill="none" stroke="#1e293b" strokeWidth="7" />
      {/* Fill */}
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeDasharray={`${filled} ${gap}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* Center label */}
      <text
        x="26"
        y="30"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fontFamily="monospace"
        fill={color}
      >
        {Math.round(probability * 100)}%
      </text>
    </svg>
  );
}

// ─── Color scale for rank ────────────────────────────────────────────────────
function rankColor(rank: number): string {
  if (rank === 1) return '#10b981'; // emerald
  if (rank === 2) return '#f59e0b'; // gold
  return '#64748b';                 // slate
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function RecommendationCard({
  result,
  title,
  subtitle,
  facultyName,
  timestamp,
  statsRow,
  noticeBanner,
  scopeLabel,
}: RecommendationCardProps) {
  const rawPredictions: any[] =
    (result as any).prediction?.top_predictions ||
    (result as any).prediction?.top_categories ||
    [];

  const predictions = rawPredictions.map((p: any) => ({
    training_category: p.training_category,
    probability: typeof p.department_score === 'number' ? p.department_score : p.probability || 0,
    rank: p.rank || 1,
    coverage: typeof p.faculty_coverage === 'number' ? p.faculty_coverage : null,
  }));

  const items: CatalogRecommendationItem[] = result.recommendations || [];

  const rawTimestamp = timestamp || result.generated_at || result.last_recommendation_at;
  const formattedTime = rawTimestamp
    ? new Date(rawTimestamp).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  const cardTitle =
    title ||
    (facultyName
      ? `Training Recommendations — ${facultyName}`
      : (result as any).department_name || (result as any).department
      ? `Department Training Recommendations — ${(result as any).department_name || (result as any).department}`
      : (result as any).campus_name
      ? `Campus Training Recommendations — ${(result as any).campus_name}`
      : 'Personalized Training Needs Analysis');

  return (
    <div className="space-y-8">
      {/* ── Optional Stats Row ────────────────────────────────────────────── */}
      {statsRow && <div>{statsRow}</div>}

      {/* ── Optional Notice Banner ───────────────────────────────────────── */}
      {noticeBanner && <div>{noticeBanner}</div>}

      {/* ── Header Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-5 sm:p-6 shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <img
            src="/images/hero-2.png"
            alt="QSU Recommender"
            className="w-40 h-40 object-contain"
          />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/images/logo.png"
              alt="QSU Recommender"
              className="w-11 h-11 object-contain shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-xs font-mono font-bold text-light-text dark:text-white">
                  {scopeLabel || 'Model Recommendation Engine'}
                </span>
                <span className="text-[10px] font-mono text-light-text dark:text-dark-muted">
                  v{result.model?.version || '2.0.0'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                {cardTitle}
              </h2>
              {subtitle && (
                <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Timestamp Badge */}
          {formattedTime && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-green/10 border border-brand-green/20 text-brand-green text-xs font-mono shrink-0">
              <Clock className="w-3.5 h-3.5 text-brand-green" />
              <span>Result as of: <strong className="text-white font-semibold">{formattedTime}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 1: Model Predictions (compact, secondary) ─────────────── */}
      <div className="space-y-3">
        {/* Section header with description */}
        <div className="flex items-start gap-3 px-1">
          <Target className="w-4 h-4 text-light-text dark:text-dark-muted mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-light-text dark:text-dark-text">ML Model Competency Gap Predictions</h3>
            <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed mt-0.5">
              These are the <strong className="text-light-text dark:text-dark-text">underlying competency areas</strong> where the machine learning model has identified potential training gaps based on your assessment scores. The probability score reflects confidence — not a ranking of importance. Use these as <em>diagnostic signals</em> rather than direct action items.
            </p>
          </div>
        </div>

        {/* Compact prediction cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {predictions.map((pred) => {
            const color = rankColor(pred.rank);
            return (
              <div
                key={pred.training_category}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-brand-green transition-all"
              >
                <DonutChart probability={pred.probability} color={color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
                    >
                      #{pred.rank}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-light-text dark:text-dark-text leading-snug">{pred.training_category}</p>
                  <p className="text-[11px] font-mono text-light-text dark:text-dark-muted mt-0.5">
                    {formatPercent(pred.probability)} · {(pred.probability).toFixed(3)} raw
                    {pred.coverage !== null && ` · ${Math.round(pred.coverage * 100)}% demand`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Recommended Training Programs (prominent, primary) ──── */}
      <div className="space-y-4">
        {/* Section header with description */}
        <div className="flex items-start gap-3 px-1">
          <BookOpen className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
          <div>
            <h3 className="text-base font-extrabold text-white">Recommended Training Programs</h3>
            <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed mt-0.5">
              These are <strong className="text-light-text dark:text-dark-text">specific training programs</strong> matched from the institutional catalog that directly address your identified competency gaps above. The <em>Match Score</em> reflects how closely each program aligns with your predicted training needs. These are your <strong className="text-light-text dark:text-white">primary action items</strong> — enroll in these programs to develop the flagged competencies.
            </p>
          </div>
        </div>

        {/* Tip banner */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-brand-gold/8 border border-brand-gold/20">
          <Info className="w-4 h-4 text-brand-gold shrink-0" />
          <p className="text-xs text-brand-gold-dark">
            Programs are ranked by <strong>match score</strong> — start with the highest scoring programs first for maximum impact.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-light-border dark:border-dark-border rounded-2xl">
            <p className="text-light-text dark:text-dark-muted text-sm">No catalog programs matched for these competency categories yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={item.training_id}
                className="relative p-5 rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-brand-gold/40 hover:bg-light-bg dark:hover:bg-dark-card transition-all group shadow-lg"
              >
                {/* Rank indicator stripe */}
                <div
                  className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                  style={{ backgroundColor: idx === 0 ? '#f59e0b' : idx === 1 ? '#10b981' : '#334155' }}
                />

                <div className="pl-3 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2.5">
                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-light-text dark:text-white bg-brand-green/10 px-2.5 py-0.5 rounded border border-brand-green/20">
                        {item.training_id}
                      </span>
                      <span className="text-xs font-semibold text-brand-gold-dark bg-brand-gold/10 px-2.5 py-0.5 rounded border border-brand-gold/20">
                        {item.category}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20">
                          ★ Top Match
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-extrabold text-light-text dark:text-dark-text group-hover:text-brand-gold-dark transition-colors leading-snug">
                      {item.title}
                    </h4>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed max-w-2xl">
                        {item.description}
                      </p>
                    )}

                    {/* Match reason */}
                    <div className="flex items-start gap-2 text-xs text-light-text dark:text-white bg-emerald-500/5 border border-brand-green/15 rounded-lg px-3 py-2">
                      <Check className="w-3.5 h-3.5 text-brand-green shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item.reason}</span>
                    </div>
                  </div>

                  {/* Match score gauge */}
                  <div className="flex flex-col items-center justify-center shrink-0 sm:min-w-[90px]">
                    <DonutChart
                      probability={item.match_score}
                      color={item.match_score >= 0.7 ? '#10b981' : item.match_score >= 0.4 ? '#f59e0b' : '#64748b'}
                    />
                    <span className="text-[10px] text-light-text dark:text-dark-muted text-center mt-1 leading-tight">
                      Match<br />Score
                    </span>
                    <span className="text-[10px] font-mono text-light-text dark:text-dark-muted mt-0.5">
                      {(item.match_score).toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
