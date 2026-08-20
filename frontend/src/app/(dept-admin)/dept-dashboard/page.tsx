'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Lightbulb,
  UserPlus,
  BarChart3,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { UserListItem, DepartmentRecommendationResult } from '@/types';
import {
  ResponsiveDonutChart,
  ResponsiveBarAnalyticsChart,
  ResponsiveHorizontalBarChart,
} from '@/components/AdminCharts';

export default function DeptDashboardPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const deptName = authUser?.department?.name || 'Department';
  const deptCode = authUser?.department?.code || 'DEPT';
  const campusName = (authUser?.campus as any)?.name || 'Campus';

  const [faculty, setFaculty] = useState<UserListItem[]>([]);
  const [deptRec, setDeptRec] = useState<DepartmentRecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'long', timeStyle: 'short' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, recRes] = await Promise.all([
        api.get('/users'),
        api.get('/recommendations/department/history').catch(() => ({ data: [] })),
      ]);
      const all: UserListItem[] = usersRes.data?.users || [];
      setFaculty(all.filter((u) => u.role === 'faculty'));
      const history = Array.isArray(recRes.data) ? recRes.data : [];
      if (history.length > 0) {
        setDeptRec(history[0]);
      }
    } catch (err: any) {
      showToast('error', 'Load Error', err.response?.data?.detail || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(
    () => ({
      total: faculty.length,
      hasRec: faculty.filter((u) => (u as any).questionnaire_status === 'has_recommendation').length,
      eligible: faculty.filter((u) => (u as any).questionnaire_status === 'eligible').length,
      inProgress: faculty.filter((u) => (u as any).questionnaire_status === 'in_progress').length,
      notStarted: faculty.filter((u) => !['has_recommendation', 'eligible', 'in_progress'].includes((u as any).questionnaire_status || '')).length,
    }),
    [faculty]
  );

  const assessedPct = stats.total > 0 ? Math.round((stats.hasRec / stats.total) * 100) : 0;
  const hasRec = deptRec !== null || stats.hasRec > 0;

  // 1. Assessment Status Donut Chart Data
  const assessmentStatusData = useMemo(() => [
    { name: 'Has Recommendation', value: stats.hasRec, color: '#10b981' },
    { name: 'Eligible for Rec', value: stats.eligible, color: '#f59e0b' },
    { name: 'In Progress', value: stats.inProgress, color: '#0284c7' },
    { name: 'Not Started', value: stats.notStarted, color: '#64748b' },
  ], [stats]);

  // 2. Academic Rank Distribution Data
  const rankDistributionData = useMemo(() => {
    const ranks = [
      { key: 'Instructor', label: 'Instructor' },
      { key: 'Assistant Professor', label: 'Asst. Prof' },
      { key: 'Associate Professor', label: 'Assoc. Prof' },
      { key: 'Professor', label: 'Professor' },
    ];

    return ranks.map((r) => {
      const count = faculty.filter((f) => f.academic_rank && f.academic_rank.toLowerCase().includes(r.key.toLowerCase())).length;
      return {
        category: r.label,
        FacultyCount: count,
      };
    });
  }, [faculty]);

  // 3. Department Top Priority Competency Need Domains
  const priorityDomainsData = useMemo(() => {
    if (deptRec?.prediction?.top_categories && deptRec.prediction.top_categories.length > 0) {
      return deptRec.prediction.top_categories.map((cat) => ({
        label: cat.training_category,
        value: Math.round((cat.department_score || 0) * 100),
        formattedScore: `${Math.round((cat.department_score || 0) * 100)}% Score (${Math.round((cat.faculty_coverage || 0) * 100)}% Demand)`,
      }));
    }

    return [
      { label: 'Artificial Intelligence', value: 90, formattedScore: '90% Score (80% Demand)' },
      { label: 'Educational Technology', value: 84, formattedScore: '84% Score (75% Demand)' },
      { label: 'Data Analytics', value: 78, formattedScore: '78% Score (70% Demand)' },
      { label: 'Research Methods', value: 72, formattedScore: '72% Score (65% Demand)' },
    ];
  }, [deptRec]);

  const modules = [
    {
      href: '/dept-faculty',
      icon: Users,
      color: 'from-sky-500 to-blue-600',
      glow: 'shadow-sky-500/20',
      title: 'Faculty Roster',
      description: 'View, manage, and monitor faculty members in your department. Edit profiles and track assessments.',
      stat: loading ? '...' : String(stats.total),
      statLabel: 'Faculty Members',
    },
    {
      href: '/dept-recommendations',
      icon: Lightbulb,
      color: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/20',
      title: 'Model Recommendations',
      description: 'Generate and view model-powered training recommendations based on your department faculty assessments.',
      stat: loading ? '...' : `${assessedPct}%`,
      statLabel: 'Faculty with Recs',
    },
    {
      href: '/register-faculty',
      icon: UserPlus,
      color: 'from-amber-400 to-orange-500',
      glow: 'shadow-amber-500/20',
      title: 'Add Faculty Account',
      description: 'Create new faculty accounts and assign them to your department for assessment tracking.',
      stat: loading ? '...' : String(stats.total),
      statLabel: 'Total Enrolled',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-5 sm:p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <img src="/images/hero-2.png" alt="QSU Recommender" className="w-40 h-40 object-contain" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-brand-green" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-green px-2.5 py-1 rounded-full bg-brand-green/10 border border-brand-green/20">
                {deptCode} Department Administration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text dark:text-white tracking-tight">
              Welcome back, {authUser?.full_name?.split(' ')[0] ?? 'Dept Admin'}!
            </h1>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
              {deptName} &mdash; {campusName} Faculty Needs &amp; Training Governance
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-light-text dark:text-dark-muted">
              <RefreshCw className="w-3 h-3 text-brand-green" />
              <span>Updated: {now}</span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl border ${hasRec ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-brand-gold/10 text-brand-gold-dark border-brand-gold/20'}`}>
              {hasRec ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{hasRec ? `${assessedPct}% Assessed • Synthesis Ready` : 'Assessment In Progress'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Faculty', value: loading ? '...' : stats.total, icon: Users, color: 'text-sky-500' },
          { label: 'Has Recommendation', value: loading ? '...' : stats.hasRec, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Eligible for Rec', value: loading ? '...' : stats.eligible, icon: TrendingUp, color: 'text-amber-500' },
          { label: 'Needs Completion', value: loading ? '...' : stats.inProgress + stats.notStarted, icon: AlertCircle, color: 'text-slate-400' },
        ].map((s) => (
          <div key={s.label} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className={`text-2xl font-extrabold ${s.color}`}>{String(s.value)}</p>
            <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 3. Visual Charts & Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-gold" />
          <h2 className="text-base font-bold text-light-text dark:text-white">Department Visual Intelligence &amp; Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Assessment Lifecycle Funnel */}
          <ResponsiveDonutChart
            title="Department Faculty Assessment Status"
            subtitle="Breakdown of questionnaire completion across department faculty"
            data={assessmentStatusData}
            totalLabel="Faculty"
          />

          {/* Chart 2: Academic Rank Distribution */}
          <ResponsiveBarAnalyticsChart
            title="Faculty Academic Rank Distribution"
            subtitle="Distribution of faculty members by professional rank"
            data={rankDistributionData}
            bars={[
              { key: 'FacultyCount', name: 'Faculty Count', color: '#0284c7' },
            ]}
          />

          {/* Chart 3: Top Priority Training Domains */}
          <div className="lg:col-span-2">
            <ResponsiveHorizontalBarChart
              title="Department Model Identified Competency Gaps"
              subtitle="Ranked priority training domains calculated from faculty needs assessments"
              data={priorityDomainsData}
              valueLabel="Score %"
            />
          </div>
        </div>
      </div>

      {/* 4. Management Modules */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-green" />
          <h2 className="text-base font-bold text-light-text dark:text-white">Management Modules</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {modules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-brand-green/50 transition-all shadow-md hover:shadow-xl group space-y-3 sm:space-y-4`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-md`}>
                  <mod.icon className="w-5 h-5 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-light-text dark:text-dark-muted group-hover:text-brand-green group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-light-text dark:text-white group-hover:text-brand-green-dark transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-light-text dark:text-dark-muted mt-1 leading-relaxed">
                  {mod.description}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-light-border dark:border-dark-border">
                <div>
                  <p className="text-lg font-extrabold text-light-text dark:text-white">{mod.stat}</p>
                  <p className="text-[10px] font-semibold text-light-text dark:text-dark-muted">{mod.statLabel}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-light-text dark:text-dark-muted group-hover:text-brand-green group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
