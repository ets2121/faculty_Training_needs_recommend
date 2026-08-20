'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, Users, Lightbulb, GraduationCap, BarChart3,
  ArrowRight, RefreshCw, TrendingUp, BookOpen, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

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
  const [loading, setLoading] = useState(true);
  const now = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'long', timeStyle: 'short' });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/campuses/${campusId}`);
      setStats(res.data);
    } catch (err: any) {
      showToast('error', 'Data Load Error', err.response?.data?.detail || 'Failed to fetch campus overview.');
    } finally {
      setLoading(false);
    }
  }, [campusId, showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const assessedPct = useMemo(() => {
    if (!stats?.total_faculty || stats.total_faculty === 0) return 0;
    return Math.round(((stats.has_recommendation_faculty ?? 0) / stats.total_faculty) * 100);
  }, [stats]);

  const modules = useMemo(() => [
    {
      href: '/campus-faculty',
      icon: Users,
      color: 'from-sky-500 to-blue-600',
      glow: 'shadow-sky-500/20',
      title: 'Faculty Roster',
      description: 'View, manage, and transfer faculty members across departments within your campus.',
      stat: loading ? '...' : String(stats?.total_faculty ?? 0),
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
      color: 'from-violet-500 to-purple-600',
      glow: 'shadow-violet-500/20',
      title: 'AI Training Synthesis',
      description: 'Generate AI-powered training recommendations tailored to campus faculty needs and assessments.',
      stat: loading ? '...' : `${assessedPct}%`,
      statLabel: 'Faculty with Recs',
    },
  ], [loading, stats, assessedPct]);

  return (
    <div className="space-y-8 pb-10 animate-fadeIn">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-gold/20 via-amber-500/10 to-transparent border border-brand-gold/20 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-brand-gold" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold px-2.5 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20">
                Campus Admin
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-light-text dark:text-white mb-1">
              Welcome back, {authUser?.full_name?.split(' ')[0] ?? 'Admin'}!
            </h1>
            <p className="text-sm text-light-text dark:text-dark-muted">{campusDisplayName} Administration Dashboard</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <div className="flex items-center gap-1.5 text-xs text-light-text dark:text-dark-muted">
              <RefreshCw className="w-3 h-3" />
              <span>Last updated: {now} PHT</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-gold font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{assessedPct}% Faculty with Recommendations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Faculty', value: loading ? '...' : String(stats?.total_faculty ?? 0), icon: Users, color: 'text-sky-500' },
          { label: 'Departments', value: loading ? '...' : String(stats?.total_departments ?? (stats?.departments?.length ?? 0)), icon: Building2, color: 'text-amber-500' },
          { label: 'Eligible Faculty', value: loading ? '...' : String(stats?.eligible_faculty ?? 0), icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Has Recommendation', value: loading ? '...' : String(stats?.has_recommendation_faculty ?? 0), icon: TrendingUp, color: 'text-violet-500' },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl bg-white/80 dark:bg-dark-card/70 border border-light-border dark:border-dark-border shadow-sm">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-brand-gold" />
          <h2 className="text-lg font-bold text-light-text dark:text-white">Campus Management Modules</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {modules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className={`group relative overflow-hidden rounded-3xl border border-light-border dark:border-dark-border bg-white/80 dark:bg-dark-card/70 p-6 shadow-lg ${mod.glow} hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${mod.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className="relative z-10 space-y-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg ${mod.glow}`}>
                  <mod.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-light-text dark:text-white mb-1">{mod.title}</h3>
                  <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">{mod.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-light-border dark:border-dark-border">
                  <div>
                    <p className="text-xl font-extrabold text-light-text dark:text-white">{mod.stat}</p>
                    <p className="text-[10px] font-semibold text-light-text dark:text-dark-muted">{mod.statLabel}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-light-text dark:text-dark-muted group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Department Overview Grid */}
      {(stats?.departments?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-gold" />
              <h2 className="text-lg font-bold text-light-text dark:text-white">Department Overview</h2>
            </div>
            <Link href="/campus-departments" className="text-xs font-semibold text-brand-gold hover:underline flex items-center gap-1">
              Manage All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats!.departments!.slice(0, 6).map((dept) => (
              <div
                key={dept.id}
                className="p-5 rounded-2xl border border-light-border dark:border-dark-border bg-white/80 dark:bg-dark-card/70 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    {dept.code}
                  </span>
                  <span className="text-xs font-semibold text-light-text dark:text-dark-muted">
                    {dept.faculty_count ?? 0} faculty
                  </span>
                </div>
                <h3 className="text-sm font-bold text-light-text dark:text-slate-100 line-clamp-2">{dept.name}</h3>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
