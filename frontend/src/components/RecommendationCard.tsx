'use client';

import React from 'react';
import { RecommendationResult, CatalogRecommendationItem } from '@/types';
import { BookOpen, Check, Sparkles, Target, Info } from 'lucide-react';
import { formatPercent } from '@/lib/utils';

interface RecommendationCardProps {
  result: RecommendationResult;
  facultyName?: string;
}

// ─── Mini SVG Donut Chart ────────────────────────────────────────────────────
function DonutChart({ probability, color = '#10b981' }: { probability: number; color?: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const filled = probability * circ;
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
export default function RecommendationCard({ result, facultyName }: RecommendationCardProps) {
  const predictions = result.prediction?.top_predictions || [];
  const items: CatalogRecommendationItem[] = result.recommendations || [];

  return (
    <div className="space-y-8">

      {/* ── Header Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-5 border border-emerald-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Sparkles className="w-40 h-40 text-emerald-400" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-mono font-bold text-emerald-400">AI Recommendation Engine</span>
              <span className="text-[10px] font-mono text-slate-500">v{result.model?.version}</span>
            </div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              {facultyName ? `Training Recommendations — ${facultyName}` : 'Personalized Training Needs Analysis'}
            </h2>
          </div>
        </div>
      </div>

      {/* ── Section 1: Model Predictions (compact, secondary) ─────────────── */}
      <div className="space-y-3">
        {/* Section header with description */}
        <div className="flex items-start gap-3 px-1">
          <Target className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-slate-200">ML Model Competency Gap Predictions</h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
              These are the <strong className="text-slate-300">underlying competency areas</strong> where the machine learning model has identified potential training gaps based on your assessment scores. The probability score reflects confidence — not a ranking of importance. Use these as <em>diagnostic signals</em> rather than direct action items.
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
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-slate-700 transition-all"
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
                  <p className="text-xs font-semibold text-slate-200 leading-snug">{pred.training_category}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {formatPercent(pred.probability)} · {(pred.probability).toFixed(3)} raw
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
          <BookOpen className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-base font-extrabold text-white">Recommended Training Programs</h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
              These are <strong className="text-slate-300">specific training programs</strong> matched from the institutional catalog that directly address your identified competency gaps above. The <em>Match Score</em> reflects how closely each program aligns with your predicted training needs. These are your <strong className="text-emerald-400">primary action items</strong> — enroll in these programs to develop the flagged competencies.
            </p>
          </div>
        </div>

        {/* Tip banner */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gold-500/8 border border-gold-500/20">
          <Info className="w-4 h-4 text-gold-400 shrink-0" />
          <p className="text-xs text-gold-300">
            Programs are ranked by <strong>match score</strong> — start with the highest scoring programs first for maximum impact.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-sm">No catalog programs matched for these competency categories yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={item.training_id}
                className="relative p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-gold-500/40 hover:bg-slate-900/80 transition-all group shadow-lg"
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
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                        {item.training_id}
                      </span>
                      <span className="text-xs font-semibold text-gold-300 bg-gold-500/10 px-2.5 py-0.5 rounded border border-gold-500/20">
                        {item.category}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">
                          ★ Top Match
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-extrabold text-slate-100 group-hover:text-gold-300 transition-colors leading-snug">
                      {item.title}
                    </h4>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                        {item.description}
                      </p>
                    )}

                    {/* Match reason */}
                    <div className="flex items-start gap-2 text-xs text-emerald-400/90 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item.reason}</span>
                    </div>
                  </div>

                  {/* Match score gauge */}
                  <div className="flex flex-col items-center justify-center min-w-[90px] shrink-0">
                    <DonutChart
                      probability={item.match_score}
                      color={item.match_score >= 0.7 ? '#10b981' : item.match_score >= 0.4 ? '#f59e0b' : '#64748b'}
                    />
                    <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight">
                      Match<br />Score
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 mt-0.5">
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
