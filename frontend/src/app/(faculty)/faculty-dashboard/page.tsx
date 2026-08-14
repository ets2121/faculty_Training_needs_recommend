'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { FullProfileResponse, RecommendationResult } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import RecommendationCard from '@/components/RecommendationCard';
import { RecommendationSkeleton, ProfileSkeleton } from '@/components/Skeletons';
import { useToast } from '@/context/ToastContext';
import { Sparkles, ArrowRight, ClipboardList, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';

export default function FacultyDashboardPage() {
  const [data, setData] = useState<FullProfileResponse | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get('/profile');
      setData(res.data);

      if (res.data.questionnaire_progress?.has_existing_recommendation) {
        try {
          const recRes = await api.get('/profile/last-recommendation');
          if (recRes.data.recommendation) {
            setRecommendation(recRes.data.recommendation);
            setTimestamp(recRes.data.last_recommendation_at || recRes.data.recommendation.generated_at || null);
          }
        } catch (e) {
          console.error('Failed to load last recommendation:', e);
        }
      }
    } catch (err: any) {
      showToast('error', 'Error Loading Profile', err.response?.data?.detail || 'Could not fetch faculty profile.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRequestRecommendation = async () => {
    // Clear stale result so skeleton shows cleanly and re-run is clearly fresh
    setRecommendation(null);
    setTimestamp(null);
    setRequesting(true);
    showToast('info', 'AI Recommender Running', 'Analyzing your needs assessment and generating recommendations...');

    try {
      const res = await api.post('/profile/request-recommendation');
      // Always use generated_at from API for the authoritative fresh timestamp
      const freshTimestamp = res.data.generated_at || new Date().toISOString();
      setRecommendation(res.data);
      setTimestamp(freshTimestamp);
      showToast('success', 'Recommendation Ready!', 'Your fresh training recommendation has been generated and saved.');
      await loadProfile();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to generate recommendation.';
      showToast('error', 'Request Failed', msg);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!data) return null;

  const qProgress = data.questionnaire_progress;
  const faculty = data.faculty_profile;

  // Build part status list for ProgressBar
  const partsList = [
    { part_number: 1, label: 'Personal Profile', required_for_recommendation: true, status: qProgress.parts_status['Personal Profile'] === 'complete' ? 'complete' as const : 'not_started' as const, updated_at: null },
    { part_number: 2, label: 'Educational Background', required_for_recommendation: true, status: qProgress.parts_status['Educational Background'] === 'complete' ? 'complete' as const : 'not_started' as const, updated_at: null },
    { part_number: 3, label: 'Professional Background', required_for_recommendation: true, status: qProgress.parts_status['Professional Background'] === 'complete' ? 'complete' as const : 'not_started' as const, updated_at: null },
    { part_number: 4, label: 'Training History', required_for_recommendation: false, status: qProgress.parts_status['Training History'] === 'complete' ? 'complete' as const : 'not_started' as const, updated_at: null },
    { part_number: 5, label: 'Competency Assessment', required_for_recommendation: true, status: qProgress.parts_status['Competency Assessment'] === 'complete' ? 'complete' as const : 'not_started' as const, updated_at: null },
    { part_number: 6, label: 'Emerging Training Needs', required_for_recommendation: true, status: qProgress.parts_status['Emerging Training Needs'] === 'complete' ? 'complete' as const : 'not_started' as const, updated_at: null },
    { part_number: 7, label: 'Learning Preferences', required_for_recommendation: false, status: qProgress.parts_status['Learning Preferences'] === 'complete' ? 'complete' as const : 'not_started' as const, updated_at: null },
    { part_number: 8, label: 'Barriers to Training', required_for_recommendation: false, status: qProgress.parts_status['Barriers to Training'] === 'complete' ? 'complete' as const : 'not_started' as const, updated_at: null },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="QSU Recommender"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Welcome, {data.user.full_name || data.user.username}
            </h1>
            <StatusBadge status={qProgress.questionnaire_status} />
          </div>

          <p className="text-xs text-slate-400">
            {faculty.department?.name || 'Faculty Member'} • Rank: <span className="text-slate-200">{faculty.academic_rank || 'N/A'}</span> • Degree: <span className="text-slate-200">{faculty.highest_degree || 'N/A'}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/questionnaire"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <ClipboardList className="w-4 h-4 text-emerald-400" />
            <span>Fill Assessment</span>
          </Link>

          {qProgress.eligible_for_recommendation && (
            <button
              onClick={handleRequestRecommendation}
              disabled={requesting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
            >
              {requesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Processing ML Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-gold-300" />
                  <span>{qProgress.has_existing_recommendation ? 'Re-Run Recommendation' : 'Request Recommendation'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. Questionnaire Progress Component */}
      <ProgressBar parts={partsList} currentPart={1} />

      {/* 3. Status Action Guidance Card */}
      {!qProgress.eligible_for_recommendation && (
        <div className="p-6 rounded-2xl border border-gold-500/30 bg-gold-500/10 backdrop-blur-md flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-gold-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gold-300">Minimum Requirements Needed</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To generate ML-backed recommendations, please complete Parts 1, 2, 3, 5, and 6 of the Needs Assessment Questionnaire.
            </p>
            <div className="pt-2">
              <Link
                href="/questionnaire"
                className="inline-flex items-center gap-2 text-xs font-bold text-gold-400 hover:underline"
              >
                <span>Complete Needs Assessment Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Recommendation Preview (or Skeleton when generating) */}
      {requesting ? (
        <RecommendationSkeleton message="Analyzing Survey Responses & Generating Recommendations..." />
      ) : (
        recommendation && (
          <RecommendationCard
            result={recommendation}
            facultyName={data.user.full_name || data.user.username}
            timestamp={timestamp}
          />
        )
      )}
    </div>
  );
}
