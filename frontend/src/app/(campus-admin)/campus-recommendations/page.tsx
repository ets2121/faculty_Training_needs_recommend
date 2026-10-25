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
  Building,
  Users,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export default function CampusRecommendationsPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const [campusResult, setCampusResult] = useState<DepartmentRecommendationResult | null>(null);
  const [campusStats, setCampusStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningCampusRec, setRunningCampusRec] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const campusId = authUser?.campus?.id || 1;
  const campusCode = authUser?.campus?.code || 'DIFFUN';
  const campusName = authUser?.campus?.name || 'Diffun Campus (Main)';

  const loadData = useCallback(async () => {
    try {
      const [campusRes, recRes] = await Promise.all([
        api.get(`/campuses/${campusId}`).catch(() => ({ data: null })),
        api.get('/recommendations/campus/history').catch(() => ({ data: [] })),
      ]);
      setCampusStats(campusRes.data || null);
      const history = Array.isArray(recRes.data) ? recRes.data : [];
      if (history.length > 0) {
        setCampusResult(history[0]);
      }
    } catch (err: any) {
      showToast('error', 'Load Error', err.response?.data?.detail || 'Failed to load recommendation data.');
    } finally {
      setLoading(false);
    }
  }, [campusId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunCampusRecommendation = async () => {
    // Clear previous result and error so skeleton shows cleanly
    setCampusResult(null);
    setRunError(null);
    setRunningCampusRec(true);
    showToast('info', 'Model Synthesis Running', `Synthesizing campus-wide faculty training assessments for ${campusName}...`);

    try {
      const res = await api.post('/recommendations/campus');
      const freshResult = {
        ...res.data,
        generated_at: res.data.generated_at || new Date().toISOString(),
      };
      setCampusResult(freshResult);
      setRunError(null);
      showToast(
        'success',
        'Campus Synthesis Complete',
        `Model aggregated needs across ${freshResult.total_departments || campusStats?.departments?.length || 0} academic departments in ${campusName}.`
      );
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        'Unable to synthesize campus recommendations. Please ensure faculty have completed assessments and active AI model is available.';
      setRunError(errorMsg);
      showToast('error', 'Inference Failed', errorMsg);
      // reload history in case of error
      await loadData();
    } finally {
      setRunningCampusRec(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <GeneratingProgressModal
          isOpen={runningCampusRec}
          title="Synthesizing Campus-Wide Recommendations"
          scope={`${campusCode} Model Synthesis`}
        />
        <RecommendationSkeleton message="Loading Campus Training Recommendations..." />
      </div>
    );
  }

  const eligibleFaculty = campusResult?.eligible_faculty_count ?? (campusStats?.eligible_faculty ?? 0);
  const totalDepts = campusResult?.total_departments ?? (campusStats?.total_departments ?? (campusStats?.departments?.length ?? 0));

  // Custom Quick Stats Row to match the exact card style
  const statsRow = campusResult ? (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md">
        <Building className="w-5 h-5 text-amber-500 mb-2" />
        <p className="text-2xl font-extrabold text-amber-500">{totalDepts}</p>
        <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">Academic Departments</p>
      </div>
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md">
        <Users className="w-5 h-5 text-sky-500 mb-2" />
        <p className="text-2xl font-extrabold text-sky-500">{eligibleFaculty}</p>
        <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">Faculty Assessed</p>
      </div>
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2" />
        <p className="text-2xl font-extrabold text-emerald-500">
          {campusResult.prediction?.top_categories?.length || 0}
        </p>
        <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">Priority Domains</p>
      </div>
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md">
        <BookOpen className="w-5 h-5 text-brand-gold mb-2" />
        <p className="text-2xl font-extrabold text-brand-gold">
          {campusResult.recommendations?.length || 0}
        </p>
        <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">Recommended Programs</p>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <GeneratingProgressModal
        isOpen={runningCampusRec}
        title="Synthesizing Campus-Wide Recommendations"
        scope={`${campusCode} AI Synthesis`}
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
            href="/campus-dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-light-text dark:text-dark-muted hover:text-brand-green-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <button
          onClick={handleRunCampusRecommendation}
          disabled={runningCampusRec}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50"
        >
          {runningCampusRec ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-white" />
              <span className="hidden sm:inline">Running ML Model...</span>
              <span className="sm:hidden">Running...</span>
            </>
          ) : (
            <span>{campusResult ? 'Re-Run Recommendation' : 'Generate Recommendation'}</span>
          )}
        </button>
      </div>

      {/* Friendly Error Banner */}
      {runError && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-start justify-between gap-3 text-xs text-rose-700 dark:text-rose-300 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-rose-800 dark:text-rose-200">
                Campus Recommendation Notice
              </p>
              <p className="leading-relaxed">{runError}</p>
            </div>
          </div>
          <button
            onClick={() => setRunError(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 p-1 rounded-lg"
          >
            <span className="text-sm font-bold">×</span>
          </button>
        </div>
      )}

      {/* When requesting (re-running or generating), hide previous result and show skeleton */}
      {runningCampusRec ? (
        <RecommendationSkeleton message="Synthesizing Multi-Department Assessments & Generating Campus Recommendations..." />
      ) : (
        <>
          {/* Empty State */}
          {!campusResult && (
            <div className="p-8 rounded-3xl border border-gold-500/30 bg-brand-gold/10 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-brand-gold" />
              </div>
              <h2 className="text-lg font-bold text-white">No Campus Recommendations Yet</h2>
              <p className="text-xs text-light-text dark:text-dark-text leading-relaxed">
                Run the campus-wide synthesis to aggregate faculty assessment data across all academic departments in {campusName}.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleRunCampusRecommendation}
                  disabled={runningCampusRec}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold transition-all shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Campus Synthesis Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Render Recommendation Card if available */}
          {campusResult && (
            <RecommendationCard
              result={campusResult}
              title={`Campus Training Recommendations — ${campusName}`}
              subtitle="Multi-Department Training Needs Analysis & Priority Synthesis"
              timestamp={campusResult.generated_at || campusResult.last_recommendation_at}
              scopeLabel="Campus Model Synthesis"
              statsRow={statsRow}
            />
          )}
        </>
      )}
    </div>
  );
}
