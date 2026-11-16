'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  BarChart3,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { UserListItem, DepartmentRecommendationResult } from '@/types';
import { systemConfig } from '@/config';
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
      { name: 'Has Recommendation', value: counts.hasRec, color: '#159447' },
      { name: 'Eligible for Rec', value: counts.eligible, color: '#D9A62E' },
      { name: 'In Progress', value: counts.inProgress, color: '#1FA95A' },
      { name: 'Not Started', value: counts.notStarted, color: '#718579' },
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-5 sm:p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <img src={systemConfig.branding.heroPath} alt={systemConfig.branding.logoAlt} className="w-40 h-40 object-contain" />
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

      {/* 2. Interactive Quick Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Total Faculty',
            value: loading ? '...' : String(stats?.total_faculty ?? campusFaculty.length),
            icon: Users,
            color: 'text-brand-green',
            bgColor: 'bg-brand-green/10',
            borderColor: 'border-brand-green/20',
            href: '/campus-faculty',
            actionText: 'Manage Faculty',
          },
          {
            label: 'Departments',
            value: loading ? '...' : String(stats?.total_departments ?? (stats?.departments?.length ?? 0)),
            icon: Building2,
            color: 'text-brand-gold',
            bgColor: 'bg-brand-gold/10',
            borderColor: 'border-brand-gold/20',
            href: '/campus-departments',
            actionText: 'View Departments',
          },
          {
            label: 'Eligible Faculty',
            value: loading ? '...' : String(stats?.eligible_faculty ?? campusFaculty.filter((f) => (f as any).questionnaire_status === 'eligible').length),
            icon: CheckCircle2,
            color: 'text-brand-green',
            bgColor: 'bg-brand-green/10',
            borderColor: 'border-brand-green/20',
            href: '/campus-faculty',
            actionText: 'Review Eligibility',
          },
          {
            label: 'Has Recommendation',
            value: loading ? '...' : String(stats?.has_recommendation_faculty ?? campusFaculty.filter((f) => (f as any).questionnaire_status === 'has_recommendation').length),
            icon: TrendingUp,
            color: 'text-brand-gold',
            bgColor: 'bg-brand-gold/10',
            borderColor: 'border-brand-gold/20',
            href: '/campus-recommendations',
            actionText: 'Campus Synthesis',
          },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-brand-green/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl ${s.bgColor} border ${s.borderColor} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-light-text/30 dark:text-dark-muted/30 group-hover:text-brand-green group-hover:translate-x-1 transition-all" />
              </div>
              <p className={`text-2xl sm:text-3xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] sm:text-xs font-semibold text-light-text dark:text-dark-muted mt-0.5">{s.label}</p>
            </div>
            <div className="pt-3 mt-3 border-t border-light-border/60 dark:border-dark-border/40 flex items-center justify-between text-[11px] font-semibold text-light-text dark:text-dark-muted group-hover:text-brand-green transition-colors">
              <span>{s.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
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
              { key: 'TotalFaculty', name: 'Total Faculty', color: '#D9A62E' },
              { key: 'Assessed', name: 'Has Rec', color: '#159447' },
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

      {/* 4. Department Overview Grid */}
      {(stats?.departments?.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-gold" />
              <h2 className="text-base font-bold text-light-text dark:text-white">Academic Departments Directory</h2>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/campus-admins" className="text-xs font-semibold text-brand-gold hover:underline flex items-center gap-1">
                <span>Manage Dept Admins</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/campus-departments" className="text-xs font-semibold text-brand-green hover:underline flex items-center gap-1">
                <span>View Departments ({stats?.departments?.length ?? 0})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
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
