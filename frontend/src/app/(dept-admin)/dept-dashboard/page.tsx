'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard, Users, Lightbulb, UserPlus, BarChart3,
  ArrowRight, RefreshCw, TrendingUp, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { UserListItem } from '@/types';

export default function DeptDashboardPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const deptName = authUser?.department?.name || 'Department';
  const deptCode = authUser?.department?.code || 'DEPT';

  const [faculty, setFaculty] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRec, setHasRec] = useState(false);
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
      setHasRec(history.length > 0);
    } catch (err: any) {
      showToast('error', 'Load Error', err.response?.data?.detail || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => ({
    total: faculty.length,
    hasRec: faculty.filter((u) => (u as any).questionnaire_status === 'has_recommendation').length,
    eligible: faculty.filter((u) => (u as any).questionnaire_status === 'eligible').length,
    notStarted: faculty.filter((u) => !['has_recommendation', 'eligible', 'in_progress'].includes((u as any).questionnaire_status || '')).length,
  }), [faculty]);

  const assessedPct = stats.total > 0 ? Math.round((stats.hasRec / stats.total) * 100) : 0;

  const modules = [
    {
      href: '/dept-faculty',
      icon: Users,
      color: 'from-sky-500 to-blue-600',
      glow: 'shadow-sky-500/20',
      title: 'Faculty Roster',
      description: 'View, manage, and monitor faculty members in your department. Edit profiles and manage accounts.',
      stat: loading ? '...' : String(stats.total),
      statLabel: 'Faculty Members',
    },
    {
      href: '/dept-recommendations',
      icon: Lightbulb,
      color: 'from-violet-500 to-purple-600',
      glow: 'shadow-violet-500/20',
      title: 'AI Recommendations',
      description: 'Generate and view AI-powered training recommendations based on your department faculty assessments.',
      stat: loading ? '...' : `${assessedPct}%`,
      statLabel: 'Faculty with Recs',
    },
    {
      href: '/register-faculty',
      icon: UserPlus,
      color: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/20',
      title: 'Add Faculty Account',
      description: 'Create new faculty accounts and assign them to your department for assessment tracking.',
      stat: loading ? '...' : String(stats.total),
      statLabel: 'Total Enrolled',
    },
  ];

  return (
    <div className="space-y-8 pb-10 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-gold/20 via-amber-500/10 to-transparent border border-brand-gold/20 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-brand-gold" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold px-2.5 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20">
                Department Admin
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-light-text dark:text-white mb-1">
              Welcome back, {authUser?.full_name?.split(' ')[0] ?? 'Admin'}!
            </h1>
            <p className="text-sm text-light-text dark:text-dark-muted">{deptName} ({deptCode}) Administration Dashboard</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <div className="flex items-center gap-1.5 text-xs text-light-text dark:text-dark-muted">
              <RefreshCw className="w-3 h-3" />
              <span>Updated: {now} PHT</span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${hasRec ? 'text-emerald-500' : 'text-amber-500'}`}>
              {hasRec ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{hasRec ? 'Recommendations Available' : 'No Recommendations Yet'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Faculty', value: loading ? '...' : stats.total, icon: Users, color: 'text-sky-500' },
          { label: 'Has Recommendation', value: loading ? '...' : stats.hasRec, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Eligible', value: loading ? '...' : stats.eligible, icon: TrendingUp, color: 'text-amber-500' },
          { label: 'Not Started', value: loading ? '...' : stats.notStarted, icon: AlertCircle, color: 'text-slate-500' },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl bg-white/80 dark:bg-dark-card/70 border border-light-border dark:border-dark-border shadow-sm">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className={`text-2xl font-extrabold ${s.color}`}>{String(s.value)}</p>
            <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-brand-gold" />
          <h2 className="text-lg font-bold text-light-text dark:text-white">Management Modules</h2>
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
    </div>
  );
}
