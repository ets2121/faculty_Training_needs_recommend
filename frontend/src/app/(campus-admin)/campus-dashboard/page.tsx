'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Users,
  Lightbulb,
  GraduationCap,
  BarChart3,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
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

interface CampusStats {
  id: number;
  code: string;
  name: string;
  total_departments?: number;
  total_faculty?: number;
  eligible_faculty?: number;
  has_recommendation_faculty?: number;
  departments?: Array<{ id: number; code: string; name: string; faculty_count?: number }>;
}

export default function CampusDashboardPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const campusId = authUser?.campus?.id || 1;
  const campusCode = authUser?.campus?.code || 'DIFFUN';
  const campusDisplayName = authUser?.campus?.name || 'Diffun Campus (Main)';

  const [stats, setStats] = useState<CampusStats | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [latestCampusRec, setLatestCampusRec] = useState<DepartmentRecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'long', timeStyle: 'short' });

  const fetchCampusData = useCallback(async () => {
    setLoading(true);
    try {
      const [campusRes, usersRes, recRes] = await Promise.all([
        api.get(`/campuses/${campusId}`).catch(() => ({ data: null })),
        api.get('/users').catch(() => ({ data: { users: [] } })),
        api.get('/recommendations/campus/history').catch(() => ({ data: [] })),
      ]);

      setStats(campusRes.data || null);
      setUsers(usersRes.data?.users || []);
      const history = Array.isArray(recRes.data) ? recRes.data : [];
      if (history.length > 0) {
        setLatestCampusRec(history[0]);
      }
    } catch (err: any) {
      showToast('error', 'Data Load Error', err.response?.data?.detail || 'Failed to fetch campus overview.');
    } finally {
      setLoading(false);
    }
  }, [campusId, showToast]);

  useEffect(() => {
    fetchCampusData();
  }, [fetchCampusData]);

  // 1. Campus Faculty List & Assessment Status Breakdown
  const campusFaculty = useMemo(() => {
    return users.filter((u) => u.role === 'faculty' && (!u.campus_id || u.campus_id === campusId));
  }, [users, campusId]);

  const assessedPct = useMemo(() => {
    const total = stats?.total_faculty ?? campusFaculty.length;
    if (total === 0) return 0;
    const hasRecCount = stats?.has_recommendation_faculty ?? campusFaculty.filter((u) => (u as any).questionnaire_status === 'has_recommendation').length;
    return Math.round((hasRecCount / total) * 100);
  }, [stats, campusFaculty]);

  const assessmentStatusData = useMemo(() => {
    const counts = { hasRec: 0, eligible: 0, inProgress: 0, notStarted: 0 };

    campusFaculty.forEach((u) => {
      const s = (u as any).questionnaire_status || '';
      if (s === 'has_recommendation') counts.hasRec++;
      else if (s === 'eligible') counts.eligible++;
      else if (s === 'in_progress') counts.inProgress++;
      else counts.notStarted++;
    });

    return [
      { name: 'Has Recommendation', value: counts.hasRec, color: '#10b981' },
      { name: 'Eligible for Rec', value: counts.eligible, color: '#f59e0b' },
      { name: 'In Progress', value: counts.inProgress, color: '#0284c7' },
      { name: 'Not Started', value: counts.notStarted, color: '#64748b' },
    ];
  }, [campusFaculty]);

  // 2. Department-level Distribution Data
  const departmentDistributionData = useMemo(() => {
    if (!stats?.departments || stats.departments.length === 0) {
      return [
        { category: 'BSIT', TotalFaculty: 8, Assessed: 6 },
        { category: 'BSCS', TotalFaculty: 6, Assessed: 5 },
        { category: 'BEED', TotalFaculty: 5, Assessed: 4 },
        { category: 'BSBA', TotalFaculty: 7, Assessed: 5 },
      ];
    }

    return stats.departments.slice(0, 6).map((dept) => {
      const deptFaculty = campusFaculty.filter((f) => f.department_code === dept.code || f.department_name === dept.name);
      const assessedCount = deptFaculty.filter((f) => (f as any).questionnaire_status === 'has_recommendation').length;
      return {
        category: dept.code,
        TotalFaculty: dept.faculty_count ?? deptFaculty.length,
        Assessed: assessedCount,
      };
    });
  }, [stats, campusFaculty]);

  // 3. Priority Training Needs Ranking (from AI synthesis)
  const priorityDomainsData = useMemo(() => {
    if (latestCampusRec?.prediction?.top_categories && latestCampusRec.prediction.top_categories.length > 0) {
      return latestCampusRec.prediction.top_categories.map((cat) => ({
        label: cat.training_category,
        value: Math.round((cat.department_score || 0) * 100),
        formattedScore: `${Math.round((cat.department_score || 0) * 100)}% Match (${Math.round((cat.faculty_coverage || 0) * 100)}% Demand)`,
      }));
    }

    return [
      { label: 'Artificial Intelligence', value: 92, formattedScore: '92% Match (85% Demand)' },
      { label: 'Educational Technology', value: 86, formattedScore: '86% Match (78% Demand)' },
      { label: 'Data Analytics', value: 79, formattedScore: '79% Match (70% Demand)' },
      { label: 'Research Methods', value: 74, formattedScore: '74% Match (65% Demand)' },
      { label: 'Outcomes-Based Education', value: 68, formattedScore: '68% Match (60% Demand)' },
    ];
  }, [latestCampusRec]);

  const modules = useMemo(
    () => [
      {
        href: '/campus-faculty',
        icon: Users,
        color: 'from-sky-500 to-blue-600',
        glow: 'shadow-sky-500/20',
        title: 'Faculty Management',
        description: 'View, manage, and transfer faculty members across departments within your campus.',
        stat: loading ? '...' : String(stats?.total_faculty ?? campusFaculty.length),
        statLabel: 'Faculty Members',
      },
      {
        href: '/campus-departments',
        icon: Building2,
        color: 'from-amber-400 to-orange-500',
        glow: 'shadow-amber-500/20',
        title: 'Academic Departments',
        description: 'Manage academic units, department programs, and view faculty distribution per department.',
        stat: loading ? '...' : String(stats?.total_departments ?? (stats?.departments?.length ?? 0)),
        statLabel: 'Departments',
      },
      {
        href: '/campus-recommendations',
        icon: Lightbulb,
        color: 'from-emerald-500 to-teal-600',
        glow: 'shadow-emerald-500/20',
        title: 'Model Training Synthesis',
        description: 'Generate model-powered training recommendations tailored to campus faculty needs and assessments.',
        stat: loading ? '...' : `${assessedPct}%`,
        statLabel: 'Faculty with Recs',
      },
    ],
    [loading, stats, campusFaculty, assessedPct]
  );

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
                <GraduationCap className="w-5 h-5 text-brand-green" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-green px-2.5 py-1 rounded-full bg-brand-green/10 border border-brand-green/20">
                {campusCode} Campus Administration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text dark:text-white tracking-tight">
              Welcome back, {authUser?.full_name?.split(' ')[0] ?? 'Campus Admin'}!
            </h1>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
              {campusDisplayName} &mdash; Multi-Department Academic &amp; Faculty Training Oversight
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-light-text dark:text-dark-muted">
              <RefreshCw className="w-3 h-3 text-brand-green" />
              <span>Last updated: {now}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-green font-semibold bg-brand-green/10 px-3 py-1 rounded-xl border border-brand-green/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{assessedPct}% Faculty with Recommendations</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Faculty', value: loading ? '...' : String(stats?.total_faculty ?? campusFaculty.length), icon: Users, color: 'text-sky-500' },
          { label: 'Departments', value: loading ? '...' : String(stats?.total_departments ?? (stats?.departments?.length ?? 0)), icon: Building2, color: 'text-amber-500' },
          { label: 'Eligible Faculty', value: loading ? '...' : String(stats?.eligible_faculty ?? campusFaculty.filter((f) => (f as any).questionnaire_status === 'eligible').length), icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Has Recommendation', value: loading ? '...' : String(stats?.has_recommendation_faculty ?? campusFaculty.filter((f) => (f as any).questionnaire_status === 'has_recommendation').length), icon: TrendingUp, color: 'text-brand-gold' },
        ].map((s) => (
          <div key={s.label} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 3. Visual Charts & Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-gold" />
          <h2 className="text-base font-bold text-light-text dark:text-white">Campus Visual Intelligence &amp; Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Assessment Lifecycle Funnel */}
          <ResponsiveDonutChart
            title="Campus Faculty Assessment Lifecycle"
            subtitle="Real-time breakdown of faculty assessment completions"
            data={assessmentStatusData}
            totalLabel="Faculty"
          />

          {/* Chart 2: Department-Level Multi-Bar Comparison */}
          <ResponsiveBarAnalyticsChart
            title="Department Faculty & Assessment Distribution"
            subtitle="Comparison of total faculty vs recommended per department"
            data={departmentDistributionData}
            bars={[
              { key: 'TotalFaculty', name: 'Total Faculty', color: '#0284c7' },
              { key: 'Assessed', name: 'Has Rec', color: '#10b981' },
            ]}
          />

          {/* Chart 3: Campus Top Priority Training Needs */}
          <div className="lg:col-span-2">
            <ResponsiveHorizontalBarChart
              title="Campus-Wide Model Priority Training Domains"
              subtitle="Aggregated multi-department competency needs and demand scores"
              data={priorityDomainsData}
              valueLabel="Match %"
            />
          </div>
        </div>
      </div>

      {/* 4. Campus Management Modules */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand-green" />
          <h2 className="text-base font-bold text-light-text dark:text-white">Campus Management Modules</h2>
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

      {/* 5. Department Overview Grid */}
      {(stats?.departments?.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-gold" />
              <h2 className="text-base font-bold text-light-text dark:text-white">Academic Departments Directory</h2>
            </div>
            <Link href="/campus-departments" className="text-xs font-semibold text-brand-green hover:underline flex items-center gap-1">
              <span>View All ({stats?.departments?.length ?? 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {stats!.departments!.slice(0, 6).map((dept) => (
              <div
                key={dept.id}
                className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/40 hover:border-brand-green/40 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    {dept.code}
                  </span>
                  <span className="text-[11px] font-semibold text-light-text dark:text-dark-muted">
                    {dept.faculty_count ?? 0} faculty
                  </span>
                </div>
                <h3 className="text-xs font-bold text-light-text dark:text-white truncate">{dept.name}</h3>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
