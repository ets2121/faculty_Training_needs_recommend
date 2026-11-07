'use client';

import React, { useState } from 'react';
import { RecommendationResult, DepartmentRecommendationResult, CatalogRecommendationItem } from '@/types';
import {
  BookOpen,
  Check,
  Sparkles,
  Target,
  Info,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Flame,
  Zap,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import { formatPercent } from '@/lib/utils';

interface RecommendationCardProps {
  result: RecommendationResult | DepartmentRecommendationResult;
  title?: string;
  subtitle?: string;
  facultyName?: string;
  timestamp?: string | null;
  statsRow?: React.ReactNode;
  noticeBanner?: React.ReactNode;
  scopeLabel?: string;
  isDepartment?: boolean;
  activeSection?: 'all' | 'recommendations' | 'predictions';
}

// ── Category Knowledge Base (Explains what each category covers) ─────────────
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Artificial Intelligence': 'Generative AI integration, prompt engineering, syllabus automation, and ethical AI in academia.',
  'Machine Learning': 'Supervised and unsupervised models, predictive analytics in education, and research model training.',
  'Data Analytics': 'Academic performance dashboards, data visualization with Power BI/Python, and institutional analytics.',
  'Cybersecurity': 'Data privacy compliance (RA 10173), securing research repositories, and digital hygiene practices.',
  'Cloud Computing': 'Cloud-based academic architectures, Google Workspace/AWS tools, and virtual computing labs.',
  'Learning Management Systems': 'Advanced administration of LMS platforms (Moodle/Classroom) and automated assessments.',
  'Educational Technology': 'Modern blended pedagogy, multimedia authoring, interactive whiteboards, and digital tools.',
  'Statistical Software': 'Quantitative data analysis using SPSS, R, Python, and statistical hypothesis testing.',
  'Research Methods': 'Rigorous research designs, mixed-methods analysis, grant proposal writing, and scientific publishing.',
  'Effective Teaching and Classroom Management': 'Modern pedagogical delivery, active learning strategies, and classroom dynamics.',
  'Innovative Instructional Material Development': 'Contextualized syllabi design, interactive modules, and digital courseware.',
  'Leadership and Strategic Management': 'Academic planning, department governance, peer coaching, and accreditation leadership.',
  'Outcomes-Based Education': 'Constructive alignment of intended learning outcomes (ILOs) and rubric evaluation.',
  'Research and Publication Writing': 'High-impact manuscript drafting and Scopus/Web of Science indexed publishing.',
  'Technology Transfer and Innovation': 'Commercialization of discoveries, utility model patents, and community extension adoption.',
};

// ── Mini SVG Donut Chart ────────────────────────────────────────────────────
function DonutChart({
  probability,
  color = '#159447',
  size = 56,
}: {
  probability: number;
  color?: string;
  size?: number;
}) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(Math.max(probability, 0), 1) * circ;
  const gap = circ - filled;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="currentColor"
        className="text-light-border/60 dark:text-dark-border/60"
        strokeWidth={size * 0.13}
      />
      {/* Fill */}
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.13}
        strokeDasharray={`${filled} ${gap}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* Center label */}
      <text
        x={center}
        y={center + size * 0.08}
        textAnchor="middle"
        fontSize={size * 0.22}
        fontWeight="800"
        fontFamily="monospace"
        fill={color}
      >
        {Math.round(probability * 100)}%
      </text>
    </svg>
  );
}

// ── Priority Tier Styling Helper ─────────────────────────────────────────────
function getPriorityStyle(tier?: string, rank?: number) {
  if (tier === 'High' || rank === 1) {
    return {
      label: 'High Priority',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      dotClass: 'bg-amber-500',
      tag: 'Primary Immediate Action',
      icon: Flame,
      iconColor: 'text-amber-500',
      borderAccent: 'border-l-amber-500',
      highlightBox: 'bg-amber-500/5 border-amber-500/20',
    };
  }
  if (tier === 'Medium' || rank === 2) {
    return {
      label: 'Medium Priority',
      badgeClass: 'bg-brand-green/15 text-brand-green border-brand-green/30',
      dotClass: 'bg-brand-green',
      tag: 'Core Development Milestone',
      icon: Zap,
      iconColor: 'text-brand-green',
      borderAccent: 'border-l-emerald-500',
      highlightBox: 'bg-emerald-500/5 border-emerald-500/20',
    };
  }
  return {
    label: 'Complementary',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    dotClass: 'bg-blue-500',
    tag: 'Elective Broadening Milestone',
    icon: Bookmark,
    iconColor: 'text-blue-500',
    borderAccent: 'border-l-blue-500',
    highlightBox: 'bg-blue-500/5 border-blue-500/20',
  };
}

// ── Color scale for rank ────────────────────────────────────────────────────
function rankColor(rank: number): string {
  if (rank === 1) return '#f59e0b'; // amber/gold for top priority
  if (rank === 2) return '#10b981'; // emerald for mid
  return '#3b82f6';                 // blue for tertiary
}

export default function RecommendationCard({
  result,
  title,
  subtitle,
  facultyName,
  timestamp,
  statsRow,
  noticeBanner,
  scopeLabel,
  isDepartment,
  activeSection = 'all',
}: RecommendationCardProps) {
  // ML predictions collapsed by default to keep page clean
  const [isPredictionsOpen, setIsPredictionsOpen] = useState(false);

  const isDeptMode =
    isDepartment !== undefined
      ? isDepartment
      : Boolean(
          (result as any).department ||
          (result as any).department_name ||
          (result as any).campus_name ||
          (result as any).faculty_count !== undefined ||
          scopeLabel?.toLowerCase().includes('department') ||
          scopeLabel?.toLowerCase().includes('campus')
        );

  const rawPredictions: any[] =
    (result as any).prediction?.top_predictions ||
    (result as any).prediction?.top_categories ||
    [];

  const predictions = rawPredictions.slice(0, 3).map((p: any) => ({
    training_category: p.training_category,
    probability: typeof p.department_score === 'number' ? p.department_score : p.probability || 0,
    rank: p.rank || 1,
    coverage: typeof p.faculty_coverage === 'number' ? p.faculty_coverage : null,
  }));

  const items: CatalogRecommendationItem[] = (result.recommendations || []).slice(0, 3);

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
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-5 sm:p-7 shadow-xl">
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
                <span className="text-xs font-mono font-bold text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded border border-brand-green/20">
                  {scopeLabel || (isDeptMode ? 'Department Multi-Faculty Synthesis' : 'Random Forest Recommendation Engine')}
                </span>
                <span className="text-[10px] font-mono text-light-text/60 dark:text-dark-muted">
                  v{result.model?.version || '2026.10'}
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-light-text dark:text-white tracking-tight">
                {cardTitle}
              </h2>
              {subtitle && (
                <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Timestamp Badge */}
          {formattedTime && (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-white text-xs font-mono shrink-0 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-brand-green" />
              <span>
                Generated: <strong className="font-semibold text-brand-green">{formattedTime}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 1: ML Model Competency Gap Predictions (Evidence & Algorithm Deficits) ── */}
      {(activeSection === 'all' || activeSection === 'predictions') && (
        <div className="rounded-3xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-md">
          {/* Visible Header with Text Button */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-light-bg/50 dark:bg-dark-bg/40 border-b border-light-border/60 dark:border-dark-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-brand-green" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-light-text dark:text-white">
                    {isDeptMode ? 'Department Competency Gap Predictions' : 'ML Model Competency Gap Predictions'}
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20">
                    3 Priority Gaps
                  </span>
                </div>
                <p className="text-xs text-light-text/70 dark:text-dark-muted mt-0.5">
                  {isDeptMode
                    ? 'Multi-faculty cohort probabilities synthesized by the multi-label Random Forest algorithm.'
                    : 'Cohort probabilities calculated by the multi-label Random Forest algorithm.'}
                </p>
              </div>
            </div>

            {/* Explicit Expand / Collapse Text Button */}
            <button
              type="button"
              onClick={() => setIsPredictionsOpen(!isPredictionsOpen)}
              className="flex items-center gap-2 self-start sm:self-center px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-md transition-all shrink-0 group"
            >
              <span>
                {isPredictionsOpen
                  ? (isDeptMode ? 'Hide Department Deficits' : 'Hide Gap Predictions')
                  : (isDeptMode ? 'Show Department Predictions (3 Gaps)' : 'Show ML Predictions (3 Gaps)')}
              </span>
              {isPredictionsOpen ? (
                <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
              )}
            </button>
          </div>

          {/* Collapsible Content */}
          {isPredictionsOpen && (
            <div className="p-4 sm:p-6 space-y-4 animate-fade-in">
              {/* Informational Guidance Banner */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 text-xs text-light-text dark:text-white">
                <Info className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <p>
                    <strong>How to read these scores:</strong> Each percentage represents the{' '}
                    <strong className="text-brand-gold">
                      {isDeptMode ? 'Department Deficit Probability' : 'Deficit Probability'}
                    </strong>{' '}
                    —{' '}
                    {isDeptMode
                      ? 'the collective likelihood that faculty members across the department have an urgent need for upskilling in that domain based on multi-faculty assessment modeling.'
                      : 'the likelihood that a faculty member with your academic rank, department, tenure, and survey inputs has an urgent need for upskilling in that domain.'}
                  </p>
                  <p className="text-[11px] text-light-text/70 dark:text-dark-muted">
                    {isDeptMode
                      ? 'Higher percentages indicate primary targets for departmental faculty development planning and budget allocation.'
                      : 'Higher percentages signal primary targets for institutional faculty development programs.'}
                  </p>
                </div>
              </div>

              {/* Prediction Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {predictions.map((pred) => {
                  const color = rankColor(pred.rank);
                  const desc = CATEGORY_DESCRIPTIONS[pred.training_category] ||
                    'Specialized competencies identified through institutional survey modeling.';
                  const urgency =
                    pred.probability >= 0.75
                      ? { text: 'High Deficit Risk', pill: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' }
                      : pred.probability >= 0.50
                      ? { text: 'Target Growth Area', pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
                      : { text: 'Emerging Need', pill: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };

                  return (
                    <div
                      key={pred.training_category}
                      className="p-4 rounded-2xl border border-light-border dark:border-dark-border bg-light-bg/40 dark:bg-dark-bg/40 space-y-3.5 flex flex-col justify-between hover:border-brand-green/40 transition-all shadow-xs"
                    >
                      <div>
                        {/* Top Rank & Urgency Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span
                            className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md"
                            style={{
                              color,
                              backgroundColor: `${color}18`,
                              border: `1px solid ${color}35`,
                            }}
                          >
                            Rank #{pred.rank} Deficit
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${urgency.pill}`}>
                            {urgency.text}
                          </span>
                        </div>

                        {/* Header with Donut & Title */}
                        <div className="flex items-center gap-3">
                          <DonutChart probability={pred.probability} color={color} size={54} />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-extrabold text-light-text dark:text-white leading-snug">
                              {pred.training_category}
                            </h4>
                            <span className="text-[10.5px] font-mono text-light-text/70 dark:text-dark-muted block mt-0.5">
                              {formatPercent(pred.probability)} {isDeptMode ? 'Collective Deficit' : 'Deficit Prob.'}
                            </span>
                          </div>
                        </div>

                        {/* Useful Context Description */}
                        <p className="text-[11px] text-light-text/80 dark:text-dark-muted leading-relaxed mt-2.5">
                          {desc}
                        </p>
                      </div>

                      {/* Footer Metric Chips */}
                      <div className="pt-2.5 border-t border-light-border/60 dark:border-dark-border/60 flex items-center justify-between text-[10.5px] font-mono text-light-text/70 dark:text-dark-muted">
                        <span>Score: {pred.probability.toFixed(3)}</span>
                        {pred.coverage !== null && (
                          <span className="font-semibold text-brand-green">
                            {Math.round(pred.coverage * 100)}% {isDeptMode ? 'faculty demand' : 'cohort demand'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Section 2: Recommended Training Programs (Matched Programs) ──── */}
      {(activeSection === 'all' || activeSection === 'recommendations') && (
        <div className="space-y-4">
          {/* Section header with guidance */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-brand-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-light-text dark:text-white tracking-tight">
                    {isDeptMode ? 'Department Recommended Training Programs' : 'Recommended Training Programs'}
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold-dark border border-brand-gold/20">
                    Top 3 Curated
                  </span>
                </div>
                <p className="text-xs text-light-text/70 dark:text-dark-muted">
                  {isDeptMode
                    ? 'Institutional programs synthesized from collective faculty assessments and calibrated by departmental priority.'
                    : 'Institutional programs matched to your predicted gaps and calibrated by priority.'}
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-light-text/60 dark:text-dark-muted self-start sm:self-auto">
              Ranked by Calibrated Match Score
            </div>
          </div>

          {/* Tip banner */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 shadow-xs">
            <Info className="w-4 h-4 text-brand-gold shrink-0" />
            <p className="text-xs text-brand-gold-dark font-medium leading-relaxed">
              {isDeptMode ? (
                <>
                  Programs are ranked by <strong>Priority Level</strong> (urgency based on aggregated department competency gaps) and collective faculty profile. Prioritize High Priority courses in department development plans.
                </>
              ) : (
                <>
                  Programs are ranked by <strong>Priority Level</strong> (urgency based on your ML competency gaps) and your profile match. Begin with High Priority courses first.
                </>
              )}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-light-border dark:border-dark-border rounded-3xl bg-white dark:bg-dark-card">
              <p className="text-light-text dark:text-dark-muted text-sm">
                No catalog programs matched for these competency categories yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, idx) => {
                const priority = getPriorityStyle(item.priority_tier, idx + 1);
                const PriorityIcon = priority.icon;
                const isTop = idx === 0;

                return (
                  <div
                    key={item.training_id}
                    className={`relative overflow-hidden rounded-3xl border ${
                      isTop
                        ? 'border-brand-gold/50 bg-gradient-to-br from-white via-white to-brand-gold/5 dark:from-dark-card dark:via-dark-card dark:to-brand-gold/5 shadow-xl'
                        : 'border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-md'
                    } p-5 sm:p-6 transition-all hover:shadow-xl group border-l-4 ${priority.borderAccent}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                      {/* Left Info Column */}
                      <div className="flex-1 space-y-3">
                        {/* Badge Tags Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* ID */}
                          <span className="text-xs font-mono font-bold text-light-text dark:text-white bg-light-bg dark:bg-dark-bg px-2.5 py-0.5 rounded-lg border border-light-border dark:border-dark-border">
                            {item.training_id}
                          </span>

                          {/* Priority Level Badge */}
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-xs flex items-center gap-1.5 ${priority.badgeClass}`}>
                            <PriorityIcon className={`w-3.5 h-3.5 ${priority.iconColor}`} />
                            <span>{item.priority_label || priority.label}</span>
                          </span>

                          {/* Category */}
                          <span className="text-xs font-semibold text-brand-gold-dark bg-brand-gold/10 px-2.5 py-0.5 rounded-lg border border-brand-gold/20">
                            {item.category}
                          </span>

                          {isTop && (
                            <span className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20 flex items-center gap-1">
                              <span>★ Top Program Match</span>
                            </span>
                          )}
                        </div>

                        {/* Course Title */}
                        <h4 className="text-base sm:text-lg font-black text-light-text dark:text-white group-hover:text-brand-gold-dark transition-colors leading-snug">
                          {item.title}
                        </h4>

                        {/* Description */}
                        {item.description && (
                          <p className="text-xs text-light-text/80 dark:text-dark-muted leading-relaxed max-w-3xl">
                            {item.description}
                          </p>
                        )}

                        {/* Reason Box */}
                        <div className={`flex items-start gap-2.5 text-xs text-light-text dark:text-white rounded-xl p-3 border ${priority.highlightBox}`}>
                          <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${priority.iconColor}`} />
                          <div className="space-y-0.5">
                            <span className="font-bold text-[11px] uppercase tracking-wider block">
                              {isDeptMode ? 'Department Recommendation Justification:' : 'Recommendation Justification:'}
                            </span>
                            <span className="leading-relaxed opacity-95">{item.reason}</span>
                          </div>
                        </div>

                        {/* Delivery Formats & Schedules (if available) */}
                        {((item.modalities && item.modalities.length > 0) ||
                          (item.durations && item.durations.length > 0) ||
                          (item.schedules && item.schedules.length > 0)) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-light-text/70 dark:text-dark-muted">
                            {item.modalities && item.modalities.length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
                                Format: <strong>{item.modalities.slice(0, 2).join(', ')}</strong>
                              </span>
                            )}
                            {item.durations && item.durations.length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
                                Duration: <strong>{item.durations[0]}</strong>
                              </span>
                            )}
                            {item.schedules && item.schedules.length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
                                Schedule: <strong>{item.schedules.slice(0, 2).join(', ')}</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Match Score Gauge */}
                      <div className="flex lg:flex-col items-center justify-between lg:justify-center p-3.5 sm:p-4 rounded-2xl bg-light-bg/70 dark:bg-dark-bg/60 border border-light-border dark:border-dark-border shrink-0 min-w-[130px] gap-3">
                        <DonutChart
                          probability={item.match_score}
                          color={item.match_score >= 0.75 ? '#10b981' : item.match_score >= 0.5 ? '#f59e0b' : '#3b82f6'}
                          size={64}
                        />
                        <div className="text-right lg:text-center">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-light-text/60 dark:text-dark-muted block">
                            Calibrated Match
                          </span>
                          <span className="text-xs font-black text-light-text dark:text-white font-mono">
                            {item.match_score.toFixed(3)} Score
                          </span>
                          <span className="text-[10px] text-brand-green font-bold block mt-0.5">
                            {idx === 0
                              ? (isDeptMode ? 'Rank #1 Dept Priority' : 'Rank #1 Choice')
                              : idx === 1
                              ? (isDeptMode ? 'Rank #2 Dept Priority' : 'Rank #2 Choice')
                              : (isDeptMode ? 'Rank #3 Dept Priority' : 'Rank #3 Choice')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
