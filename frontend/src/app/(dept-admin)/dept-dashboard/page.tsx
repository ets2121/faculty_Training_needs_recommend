'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserListItem, DepartmentRecommendationResult } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import {
  Users,
  Building,
  UserPlus,
  Sparkles,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { formatPercent } from '@/lib/utils';

export default function DeptDashboardPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [deptResult, setDeptResult] = useState<DepartmentRecommendationResult | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [runningDeptRec, setRunningDeptRec] = useState(false);
  const { showToast } = useToast();

  const loadFaculty = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err: any) {
      showToast('error', 'Error Loading Faculty', err.response?.data?.detail || 'Failed to fetch department faculty.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, []);

  const handleRunDeptRecommendation = async () => {
    setRunningDeptRec(true);
    try {
      const res = await api.post('/recommendations/department');
      setDeptResult(res.data);
      showToast('success', 'Department Recommendation Ready!', `Analyzed ${res.data.eligible_faculty_count} eligible faculty members.`);
      await loadFaculty();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to run department recommendation.';
      showToast('error', 'Execution Failed', msg);
    } finally {
      setRunningDeptRec(false);
    }
  };

  const deptCode = users[0]?.department_code || 'BSIT';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/20">
            <Building className="w-3.5 h-3.5 text-gold-400" />
            <span>Department Admin Overview</span>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {deptCode} Department Recommendations & Monitoring
          </h1>
          <p className="text-xs text-slate-400">
            Monitor faculty questionnaire completion and run department-wide training priorities.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/register-faculty"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Add Faculty Account</span>
          </Link>

          <button
            onClick={handleRunDeptRecommendation}
            disabled={runningDeptRec}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-gold-950/40 transition-all disabled:opacity-50"
          >
            {runningDeptRec ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Aggregating Faculty...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Run Department Recommendation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Department Aggregated Recommendation Results (if generated) */}
      {deptResult && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-gold-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  {deptResult.department} Department Priorities
                </span>
                <h2 className="text-xl font-extrabold text-white mt-1">Aggregated Priority Training Categories</h2>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                <span className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  Total Faculty: <strong className="text-white">{deptResult.total_faculty_in_dept}</strong>
                </span>
                <span className="bg-emerald-950/60 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  Eligible Analyzed: <strong className="text-emerald-400">{deptResult.eligible_faculty_count}</strong>
                </span>
              </div>
            </div>

            {/* Top Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {deptResult.prediction?.top_categories?.map((cat) => (
                <div key={cat.training_category} className="p-4 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">
                      Priority #{cat.rank}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {formatPercent(cat.department_score)} Score
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">{cat.training_category}</h4>
                  <p className="text-[11px] text-slate-400">
                    Faculty Coverage: <strong className="text-slate-200 font-mono">{formatPercent(cat.faculty_coverage)}</strong>
                  </p>
                </div>
              ))}
            </div>

            {/* Department Recommended Catalog Items */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold-400" />
                <span>Matched Department Training Programs</span>
              </h3>

              <div className="space-y-3">
                {deptResult.recommendations?.map((item) => (
                  <div key={item.training_id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-emerald-400">{item.training_id}</span>
                        <span className="text-xs font-semibold text-gold-300 bg-gold-500/10 px-2 py-0.5 rounded">{item.category}</span>
                      </div>
                      <h4 className="font-bold text-slate-100 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{item.reason}</p>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center shrink-0">
                      <span className="text-[10px] text-slate-400 block">Fit Score</span>
                      <span className="text-sm font-bold text-gold-400 font-mono">{formatPercent(item.match_score)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Department Faculty Users Table */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Department Faculty Roster</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {users.length} Faculty Registered
          </span>
        </div>

        {loadingUsers ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono">Loading department faculty...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl text-xs text-slate-400">
            No faculty members registered in this department yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Faculty Name</th>
                  <th className="p-3.5">Username</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Questionnaire Status</th>
                  <th className="p-3.5 rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-100">{u.full_name || u.username}</td>
                    <td className="p-3.5 font-mono text-slate-400">{u.username}</td>
                    <td className="p-3.5 text-slate-400">{u.email || '—'}</td>
                    <td className="p-3.5">
                      <StatusBadge status={u.status || 'not_started'} />
                    </td>
                    <td className="p-3.5">
                      <span className="text-[11px] text-emerald-400 font-semibold">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
