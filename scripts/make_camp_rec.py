from pathlib import Path
parts = []
parts.append("""'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { DepartmentRecommendationResult } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { RecommendationSkeleton } from '@/components/Skeletons';
import { VisualBarChart } from '@/components/AdminVisualCharts';
import {
  Sparkles,
  RefreshCw,
  BookOpen,
  Target,
  Clock,
  MapPin,
  Check,
  Building,
  Users,
} from 'lucide-react';
import { formatPercent, formatManila } from '@/lib/utils';

function DonutChart({ probability, color = '#10b981' }: { probability: number; color?: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const filled = probability * circ;
  const gap = circ - filled;

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#1e293b" strokeWidth="7" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeDasharray={`${filled} ${gap}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
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

function rankColor(rank: number): string {
  if (rank === 1) return '#10b981';
  if (rank === 2) return '#f59e0b';
  return '#64748b';
}

export default function CampusRecommendationsPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const [campusResult, setCampusResult] = useState<DepartmentRecommendationResult | null>(null);
  const [campusStats, setCampusStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Retraining / Progress Modal state
  const [runningCampusRec, setRunningCampusRec] = useState(false);
  const [recProgress, setRecProgress] = useState(0);
  const [recStep, setRecStep] = useState('');

  const campusId = authUser?.campus?.id || 1;
  const campusName = authUser?.campus?.name || 'Diffun Campus (Main)';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [campusRes, recRes] = await Promise.all([
        api.get(`/campuses/${campusId}`),
        api.get('/recommendations/department/history').catch(() => ({ data: [] })),
      ]);
      setCampusStats(campusRes.data || null);
      if (recRes.data && recRes.data.length > 0) {
        setCampusResult(recRes.data[0]);
      }
    } catch (err: any) {
      showToast('error', 'API Error', err.response?.data?.detail || err.message || 'Failed to fetch campus data.');
    } finally {
      setLoading(false);
    }
  }, [campusId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunCampusRecommendation = async () => {
    setCampusResult(null);
    setRunningCampusRec(true);
    setRecProgress(10);
    setRecStep('Step 1/4: Aggregating faculty competency gaps across departments...');

    showToast('info', 'Campus AI Synthesis Started', 'Synthesizing campus training priorities across departments...');

    const t1 = setTimeout(() => {
      setRecProgress(35);
      setRecStep('Step 2/4: Computing deficiency coverage ratios & weights...');
    }, 1000);

    const t2 = setTimeout(() => {
      setRecProgress(70);
      setRecStep('Step 3/4: Matching campus institutional catalog offerings...');
    }, 2200);

    try {
      const res = await api.post('/recommendations/campus');
      clearTimeout(t1);
      clearTimeout(t2);

      setRecProgress(100);
      setRecStep('Step 4/4: Campus AI synthesis complete!');

      setCampusResult(res.data);
      showToast('success', 'Campus Recommendations Ready!', `Synthesized recommendations for ${res.data.eligible_faculty_count} faculty.`);
      await loadData();
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      showToast('error', 'Execution Failed', err.response?.data?.detail || err.message || 'Failed to run campus recommendation.');
    } finally {
      setTimeout(() => {
        setRunningCampusRec(false);
      }, 1200);
    }
  };

  const formattedCampusTime = formatManila(campusResult?.generated_at);
""")
parts.append("""
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>Campus AI Recommender Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text dark:text-white tracking-tight">
            {campusName} Priority Synthesis
          </h1>
          <p className="text-xs text-light-text dark:text-dark-muted max-w-2xl leading-relaxed">
            Synthesize faculty training needs across all academic units in {campusName} to drive institutional webinar and workshop planning.
          </p>
        </div>

        <button
          onClick={handleRunCampusRecommendation}
          disabled={runningCampusRec}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-extrabold text-xs shadow-lg shadow-sky-950/40 transition-all disabled:opacity-50 shrink-0"
        >
          {runningCampusRec ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Synthesizing Campus...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>Run Campus AI Recommendation</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Output & Visuals */}
      {campusResult ? (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 p-5 sm:p-6 border border-sky-500/30 shadow-2xl text-white">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono font-bold text-sky-400">Campus-Wide Training Output</span>
                    <span className="text-[10px] font-mono text-slate-400">v{campusResult.model?.version}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-white">
                    Aggregated Priorities — {campusName}
                  </h2>
                </div>
              </div>

              {formattedCampusTime && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-mono shrink-0">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Result as of: <strong className="text-white font-semibold">{formattedCampusTime}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5 px-1">
              <Target className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-light-text dark:text-slate-200">Campus Priority Training Needs</h3>
                <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
                  Synthesized across {campusResult.total_departments || campusStats?.departments?.length || 0} academic departments in {campusName}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {campusResult.prediction?.top_categories?.map((cat) => {
                const color = rankColor(cat.rank);
                return (
                  <div
                    key={cat.training_category}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-light-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 shadow-sm"
                  >
                    <DonutChart probability={cat.department_score} color={color} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                          style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
                        >
                          Priority #{cat.rank}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-light-text dark:text-slate-200 leading-snug">{cat.training_category}</p>
                      <p className="text-[11px] font-mono text-light-text dark:text-dark-muted mt-0.5">
                        Coverage: {formatPercent(cat.faculty_coverage)} · {(cat.department_score).toFixed(3)} raw
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-2.5 px-1">
              <BookOpen className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
              <div>
                <h3 className="text-base font-extrabold text-light-text dark:text-white">Matched Campus Training Programs</h3>
                <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
                  High-priority institutional catalog programs recommended for campus-wide webinars and faculty development workshops.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {campusResult.recommendations?.map((item) => (
                <div
                  key={item.training_id}
                  className="relative p-5 rounded-2xl border border-light-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hover:border-sky-500/40 transition-all shadow-md flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
                        {item.training_id}
                      </span>
                      <span className="text-xs font-semibold text-brand-gold-dark dark:text-gold-300 bg-brand-gold/10 px-2.5 py-0.5 rounded border border-brand-gold/20">
                        {item.category}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-light-text dark:text-slate-100">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-light-border dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/40 space-y-3">
          <Sparkles className="w-10 h-10 text-sky-500 mx-auto" />
          <h3 className="text-base font-bold text-light-text dark:text-white">No Campus AI Recommendation Output Yet</h3>
          <p className="text-xs text-light-text dark:text-dark-muted max-w-sm mx-auto">
            Click "Run Campus AI Recommendation" above to aggregate faculty assessment responses across all departments in {campusName}.
          </p>
        </div>
      )}

      {/* Progress Loading Popup / Modal */}
      {runningCampusRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
              <Sparkles className="w-8 h-8 text-sky-500" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-light-text dark:text-white">Aggregating Campus AI Engine</h3>
              <p className="text-xs text-light-text dark:text-dark-muted mt-1 font-mono">{recStep}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-sky-600 dark:text-sky-400">Synthesis Progress</span>
                <span className="text-light-text dark:text-white">{recProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-400 transition-all duration-500 ease-out"
                  style={{ width: `${recProgress}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-light-text dark:text-dark-muted leading-relaxed">
              Synthesizing faculty Likert responses across {campusName} departments...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
""")

path = Path("frontend/src/app/(campus-admin)/campus-recommendations/page.tsx")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text("".join(parts), encoding="utf-8")
print("Campus recommendations page created successfully.")
