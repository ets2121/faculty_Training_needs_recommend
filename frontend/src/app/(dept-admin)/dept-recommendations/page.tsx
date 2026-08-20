'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { DepartmentRecommendationResult } from '@/types';
import RecommendationCard from '@/components/RecommendationCard';
import GeneratingProgressModal from '@/components/GeneratingProgressModal';
import { RecommendationSkeleton } from '@/components/Skeletons';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Users,
  CheckCircle2,
  BookOpen,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function DeptRecommendationsPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const deptName = authUser?.department?.name || 'Department';
  const deptCode = authUser?.department?.code || 'DEPT';
  const campusName = (authUser?.campus as any)?.name || 'Campus';

  const [deptResult, setDeptResult] = useState<DepartmentRecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningRec, setRunningRec] = useState(false);

  const loadLatestRec = useCallback(async () => {
    try {
      const res = await api.get('/recommendations/department/history');
      const items = Array.isArray(res.data) ? res.data : [];
      if (items.length > 0) {
        setDeptResult(items[0]);
      }
    } catch {
      // ignore empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatestRec();
  }, [loadLatestRec]);

  const handleRunDeptRecommendation = async () => {
    // Clear previous result so skeleton shows cleanly
    setDeptResult(null);
    setRunningRec(true);
    showToast('info', 'AI Synthesis Running', `Synthesizing faculty training assessments for ${deptName}...`);

    try {
      const res = await api.post('/recommendations/department');
      const freshResult = {
        ...res.data,
        generated_at: res.data.generated_at || new Date().toISOString(),
      };
      setDeptResult(freshResult);
      showToast(
        'success',
        'Recommendation Synthesis Complete',
        `AI aggregated needs across ${freshResult.eligible_faculty_count || freshResult.faculty_count || 0} eligible faculty.`
      );
    } catch (err: any) {
      showToast(
        'error',
        'Inference Failed',
        err.response?.data?.detail || 'Ensure department faculty have completed required assessments.'
      );
      // reload history in case of error
      await loadLatestRec();
    } finally {
      setRunningRec(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <GeneratingProgressModal
          isOpen={runningRec}
          title="Synthesizing Department Recommendations"
          scope={`${deptCode} ML Inference`}
        />
        <RecommendationSkeleton message="Loading Department Training Recommendations..." />
      </div>
    );
  }

  const eligibleCount = deptResult?.eligible_faculty_count ?? (deptResult?.faculty_count ?? 0);
  const skippedCount = deptResult?.skipped_faculty?.length ?? 0;

  // Custom Quick Stats Row to match the exact card style
  const statsRow = deptResult ? (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md">
        <Users className="w-5 h-5 text-sky-500 mb-2" />
        <p className="text-2xl font-extrabold text-sky-500">{eligibleCount}</p>
        <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">Faculty Processed</p>
      </div>
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2" />
        <p className="text-2xl font-extrabold text-emerald-500">
          {deptResult.prediction?.top_categories?.length || 0}
        </p>
        <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">Priority Domains</p>
      </div>
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md">
        <BookOpen className="w-5 h-5 text-brand-gold mb-2" />
        <p className="text-2xl font-extrabold text-brand-gold">
          {deptResult.recommendations?.length || 0}
        </p>
        <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">Recommended Programs</p>
      </div>
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md">
        <Clock className="w-5 h-5 text-amber-500 mb-2" />
        <p className="text-2xl font-extrabold text-amber-500">{skippedCount}</p>
        <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">Incomplete Assessments</p>
      </div>
    </div>
  ) : null;

  // Custom Notice Banner for skipped faculty
  const noticeBanner = skippedCount > 0 ? (
    <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 flex items-center gap-3 text-xs text-amber-600 dark:text-amber-300">
      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
      <p>
        <strong>{skippedCount} faculty member(s)</strong> have not completed all required assessment parts (Parts 1, 2, 3, 5, &amp; 6) and were excluded from this synthesis.
      </p>
    </div>
  ) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <GeneratingProgressModal
        isOpen={runningRec}
        title="Synthesizing Department Recommendations"
        scope={`${deptCode} ML Inference`}
      />

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="QSU Recommender"
            className="w-9 h-9 object-contain shrink-0"
          />
          <Link
            href="/dept-dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-light-text dark:text-dark-muted hover:text-brand-green-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <button
          onClick={handleRunDeptRecommendation}
          disabled={runningRec}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50"
        >
          {runningRec ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-white" />
              <span className="hidden sm:inline">Running ML Model...</span>
              <span className="sm:hidden">Running...</span>
            </>
          ) : (
            <span>{deptResult ? 'Re-Run Recommendation' : 'Generate Recommendation'}</span>
          )}
        </button>
      </div>

      {/* When requesting (re-running or generating), hide previous result and show skeleton */}
      {runningRec ? (
        <RecommendationSkeleton message="Synthesizing Faculty Assessments & Generating Department Recommendations..." />
      ) : (
        <>
          {/* Empty State */}
          {!deptResult && (
            <div className="p-8 rounded-3xl border border-gold-500/30 bg-brand-gold/10 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-brand-gold" />
              </div>
              <h2 className="text-lg font-bold text-white">No Recommendations Generated Yet</h2>
              <p className="text-xs text-light-text dark:text-dark-text leading-relaxed">
                Run the AI engine to synthesize the training needs of faculty members in {deptName} who have completed their assessments.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleRunDeptRecommendation}
                  disabled={runningRec}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold transition-all shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Recommendations Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Render Recommendation Card if available */}
          {deptResult && (
            <RecommendationCard
              result={deptResult}
              title={`Department Training Recommendations — ${deptName} (${deptCode})`}
              subtitle={`${campusName} • Multi-Faculty Assessment Synthesis`}
              timestamp={deptResult.generated_at || deptResult.last_recommendation_at}
              scopeLabel="Department AI Synthesis"
              statsRow={statsRow}
              noticeBanner={noticeBanner}
            />
          )}
        </>
      )}
    </div>
  );
}
