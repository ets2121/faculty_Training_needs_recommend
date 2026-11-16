'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { FullProfileResponse } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { ProfileSkeleton } from '@/components/Skeletons';
import { useToast } from '@/context/ToastContext';
import {
  Sparkles,
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  GraduationCap,
  Building2,
  UserCheck,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { systemConfig } from '@/config';

const QUESTIONNAIRE_PARTS = [
  { part_number: 1, label: 'Personal Profile', required: true },
  { part_number: 2, label: 'Educational Background', required: true },
  { part_number: 3, label: 'Professional Background', required: true },
  { part_number: 4, label: 'Training History', required: false },
  { part_number: 5, label: 'Competency Assessment', required: true },
  { part_number: 6, label: 'Emerging Training Needs', required: true },
  { part_number: 7, label: 'Learning Preferences', required: false },
  { part_number: 8, label: 'Barriers to Training', required: false },
];

export default function FacultyDashboardPage() {
  const [data, setData] = useState<FullProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get('/profile');
      setData(res.data);
    } catch (err: any) {
      showToast('error', 'Error Loading Profile', err.response?.data?.detail || 'Could not fetch faculty profile.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!data) return null;

  const qProgress = data.questionnaire_progress;
  const faculty = data.faculty_profile;

  // Calculate completed counts and percentage
  const completedPartsCount = QUESTIONNAIRE_PARTS.filter(
    (p) => qProgress.parts_status[p.label] === 'complete'
  ).length;
  const completionPercent = Math.round((completedPartsCount / QUESTIONNAIRE_PARTS.length) * 100);

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return null;
    try {
      return new Date(ts).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ── 1. Welcome Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 sm:p-8 shadow-xl backdrop-blur-md">
        {/* Subtle Watermark Graphic */}
        <div className="absolute top-0 right-0 p-6 opacity-[0.07] pointer-events-none select-none dark:opacity-[0.08]">
          <img
            src={systemConfig.branding.heroPath}
            alt={systemConfig.branding.logoAlt}
            className="w-48 h-48 sm:w-60 sm:h-60 object-contain"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={systemConfig.branding.logoPath}
                alt={systemConfig.branding.logoAlt}
                className="w-10 h-10 object-contain shrink-0 drop-shadow-sm"
              />
              <div>
                <span className="text-[11px] font-semibold tracking-wide uppercase text-brand-green">
                  Faculty Portal
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-light-text dark:text-white tracking-tight">
                  Welcome, {data.user.full_name || data.user.username}!
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-light-text dark:text-dark-muted">
              <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-light-muted-surface dark:bg-dark-card-elevated border border-light-border dark:border-dark-border">
                <Building2 className="w-3.5 h-3.5 text-brand-green" />
                <span>{faculty.department?.name || 'Department of Instruction'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-light-muted-surface dark:bg-dark-card-elevated border border-light-border dark:border-dark-border">
                <GraduationCap className="w-3.5 h-3.5 text-brand-gold" />
                <span>Rank: <strong className="text-light-text dark:text-white">{faculty.academic_rank || 'Instructor'}</strong></span>
              </span>
              <div className="py-0.5">
                <StatusBadge status={qProgress.questionnaire_status} />
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              href="/questionnaire"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text hover:border-brand-green hover:text-brand-green text-xs font-semibold shadow-sm transition-all"
            >
              <ClipboardList className="w-4 h-4 text-brand-green" />
              <span>Needs Assessment</span>
            </Link>

            <Link
              href="/my-recommendation"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-md shadow-brand-green/20 transition-all hover:scale-[1.01]"
            >
              <Sparkles className="w-4 h-4 text-brand-gold" />
              <span>My Recommendations</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Three Overview Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Needs Assessment Progress */}
        <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-brand-green/40 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green">
                <ClipboardList className="w-5 h-5 text-brand-green" />
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20">
                {completionPercent}% Done
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-light-text dark:text-white">
                Needs Assessment
              </h3>
              <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
                {completedPartsCount} of 8 survey parts completed
              </p>
            </div>

            {/* Visual Progress Line */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-2 bg-light-muted-surface dark:bg-dark-bg rounded-full overflow-hidden border border-light-border/40 dark:border-dark-border/40">
                <div
                  className="h-full bg-gradient-to-r from-brand-green to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-light-text dark:text-dark-muted">
                Required Parts: <span className="font-semibold text-light-text dark:text-white">{qProgress.required_parts_completed}</span>
              </p>
            </div>
          </div>

          <Link
            href="/questionnaire"
            className="inline-flex items-center justify-between w-full pt-3 border-t border-light-border dark:border-dark-border/60 text-xs font-bold text-brand-green hover:underline group"
          >
            <span>{completedPartsCount === 8 ? 'Review Questionnaire' : 'Continue Assessment'}</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Card 2: AI Recommendations Overview */}
        <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-brand-gold/40 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold">
                <Sparkles className="w-5 h-5 text-brand-gold" />
              </div>
              {qProgress.has_existing_recommendation ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              ) : qProgress.eligible_for_recommendation ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold-dark border border-brand-gold/20">
                  Eligible
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Pending Survey
                </span>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-light-text dark:text-white">
                Training Recommendations
              </h3>
              <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
                {qProgress.has_existing_recommendation
                  ? `Last generated: ${formatTimestamp(qProgress.last_recommendation_at) || 'Available'}`
                  : qProgress.eligible_for_recommendation
                  ? 'Requirements met — ready for synthesis'
                  : 'Complete required parts to unlock'}
              </p>
            </div>

            <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
              {qProgress.has_existing_recommendation
                ? 'Your personalized training recommendations and competency profiling are generated and ready to view.'
                : qProgress.eligible_for_recommendation
                ? 'Your assessment profile is ready for AI multi-label inference and catalog matching.'
                : 'Parts 1, 2, 3, 5, and 6 are required for machine learning recommendation matching.'}
            </p>
          </div>

          <Link
            href="/my-recommendation"
            className="inline-flex items-center justify-between w-full pt-3 border-t border-light-border dark:border-dark-border/60 text-xs font-bold text-brand-gold hover:underline group"
          >
            <span>{qProgress.has_existing_recommendation ? 'View Recommendations' : 'Open Recommendations'}</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Card 3: Faculty Academic Profile */}
        <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-brand-green/40 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green">
                <UserCheck className="w-5 h-5 text-brand-green" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-light-muted-surface dark:bg-dark-card-elevated border border-light-border dark:border-dark-border text-light-text dark:text-dark-muted">
                {faculty.campus?.name || 'Main Campus'}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-light-text dark:text-white">
                Faculty Profile
              </h3>
              <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
                Academic & institutional details
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-light-border/60 dark:border-dark-border/40">
                <span className="text-light-text dark:text-dark-muted">Highest Degree:</span>
                <span className="font-semibold text-light-text dark:text-white">{faculty.highest_degree || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-light-border/60 dark:border-dark-border/40">
                <span className="text-light-text dark:text-dark-muted">Specialization:</span>
                <span className="font-semibold text-light-text dark:text-white truncate max-w-[150px]" title={faculty.specialization || ''}>
                  {faculty.specialization || 'General'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-light-text dark:text-dark-muted">Account Status:</span>
                <span className="font-semibold text-brand-green capitalize">{data.user.status || 'Active'}</span>
              </div>
            </div>
          </div>

          <Link
            href="/profile"
            className="inline-flex items-center justify-between w-full pt-3 border-t border-light-border dark:border-dark-border/60 text-xs font-bold text-light-text dark:text-dark-muted hover:text-brand-green hover:underline group"
          >
            <span>Manage Profile</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* ── 3. Needs Assessment Status Checklist (Compact, No Extra Load) ── */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-light-text dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-green" />
              <span>Assessment Questionnaire Breakdown</span>
            </h3>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
              Parts marked with <span className="text-brand-gold font-bold">*</span> are required to generate recommendations.
            </p>
          </div>

          <Link
            href="/questionnaire"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline"
          >
            <span>Open Assessment Wizard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUESTIONNAIRE_PARTS.map((part) => {
            const isComplete = qProgress.parts_status[part.label] === 'complete';
            return (
              <div
                key={part.part_number}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                  isComplete
                    ? 'bg-brand-green/5 border-brand-green/30 dark:bg-brand-green/10'
                    : 'bg-light-muted-surface/50 dark:bg-dark-card-elevated border-light-border dark:border-dark-border/60'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-light-text dark:text-dark-muted">
                    <span>Part {part.part_number}</span>
                    {part.required && (
                      <span className="text-brand-gold font-bold" title="Required for Recommendations">*</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-light-text dark:text-white truncate" title={part.label}>
                    {part.label}
                  </p>
                </div>

                <div className="shrink-0">
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Done</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-light-text/60 dark:text-dark-muted bg-light-border/40 dark:bg-dark-border/40 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      <span>Pending</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Guidance Prompt */}
        {!qProgress.eligible_for_recommendation ? (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Complete Remaining Required Parts</p>
              <p className="leading-relaxed">
                To unlock AI recommendations, please complete Parts 1, 2, 3, 5, and 6. Once submitted, your profile will be immediately eligible for model evaluation.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-brand-green/30 bg-brand-green/10 flex items-start justify-between gap-3 text-xs text-brand-green-dark dark:text-emerald-300">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 shrink-0 text-brand-gold mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-light-text dark:text-white">
                  {qProgress.has_existing_recommendation
                    ? 'Personalized Recommendations Active'
                    : 'Eligibility Requirements Met'}
                </p>
                <p className="leading-relaxed text-light-text dark:text-dark-muted">
                  {qProgress.has_existing_recommendation
                    ? 'You can view, review, and explore your recommended training programs anytime in My Recommendations.'
                    : 'Your survey profile meets all criteria. Head over to My Recommendations to run the AI engine.'}
                </p>
              </div>
            </div>

            <Link
              href="/my-recommendation"
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-md transition-all"
            >
              <span>{qProgress.has_existing_recommendation ? 'View Now' : 'Generate'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
