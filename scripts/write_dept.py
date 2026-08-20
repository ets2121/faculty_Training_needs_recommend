from pathlib import Path
parts = []
parts.append("""'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserListItem, DepartmentRecommendationResult } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import SearchInput from '@/components/SearchInput';
import { TableSkeleton, RecommendationSkeleton } from '@/components/Skeletons';
import { ViewEditUserModal, DeleteUserModal } from '@/components/UserModals';
import Pagination from '@/components/Pagination';
import { VisualBarChart, VisualDonutBreakdown } from '@/components/AdminVisualCharts';
import {
  Users,
  Building,
  UserPlus,
  Sparkles,
  RefreshCw,
  BookOpen,
  Target,
  Check,
  Pencil,
  Trash2,
  Clock,
  MapPin,
} from 'lucide-react';
import { formatPercent } from '@/lib/utils';

function DonutChart({ probability, color = '#10b981' }: { probability: number; color?: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const filled = probability * circ;
  const gap = circ - filled;

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#1e293b" strokeWidth="7" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeDasharray={`${filled} ${gap}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
      <text
        x="26"
        y="30"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fontFamily="monospace"
        fill={color}
      >
        {Math.round(probability * 100)}%
      </text>
    </svg>
  );
}

function rankColor(rank: number): string {
  if (rank === 1) return '#10b981';
  if (rank === 2) return '#f59e0b';
  return '#64748b';
}

export default function DeptDashboardPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptResult, setDeptResult] = useState<DepartmentRecommendationResult | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [runningDeptRec, setRunningDeptRec] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserListItem | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserListItem | null>(null);

  const loadFaculty = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err: any) {
      showToast('error', 'Error Loading Faculty', err.response?.data?.detail || err.message || 'Failed to fetch department faculty.');
    } finally {
      setLoadingUsers(false);
    }
  }, [showToast]);

  const loadLatestDeptRec = useCallback(async () => {
    try {
      const res = await api.get('/recommendations/department/history');
      if (res.data && res.data.length > 0) {
        setDeptResult(res.data[0]);
      }
    } catch (err) {
      console.warn('No cached department recommendation history.');
    }
  }, []);

  useEffect(() => {
    loadFaculty();
    loadLatestDeptRec();
  }, [loadFaculty, loadLatestDeptRec]);

  const handleRunDeptRecommendation = async () => {
    setDeptResult(null);
    setRunningDeptRec(true);
    showToast('info', 'Department Engine Active', 'Aggregating faculty needs across department...');
    try {
      const res = await api.post('/recommendations/department');
      const freshResult = {
        ...res.data,
        generated_at: res.data.generated_at || new Date().toISOString(),
      };
      setDeptResult(freshResult);
      showToast('success', 'Department Recommendations Ready!', `Analyzed ${res.data.eligible_faculty_count} eligible faculty members.`);
      await loadFaculty();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to run department recommendation.';
      showToast('error', 'Execution Failed', msg);
    } finally {
      setRunningDeptRec(false);
    }
  };

  const deptCode = users[0]?.department_code || authUser?.department?.code || 'BSIT';
  const campusName = authUser?.campus?.name || 'Diffun Campus (Main)';

  const facultyUsers = useMemo(() => users.filter((u) => u.role === 'faculty'), [users]);

  const eligibleFacultyCount = useMemo(
    () => facultyUsers.filter((u) => u.status === 'eligible' || u.status === 'has_recommendation').length,
    [facultyUsers]
  );

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return facultyUsers;
    const q = searchQuery.toLowerCase().trim();
    return facultyUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.faculty_code && u.faculty_code.toLowerCase().includes(q)) ||
        (u.academic_rank && u.academic_rank.toLowerCase().includes(q)) ||
        (u.specialization && u.specialization.toLowerCase().includes(q))
    );
  }, [facultyUsers, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedFaculty = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const statusBreakdown = useMemo(() => {
    const counts = { has_recommendation: 0, eligible: 0, in_progress: 0, not_started: 0 };
    facultyUsers.forEach((f) => {
      const st = f.status as keyof typeof counts;
      if (st in counts) counts[st]++;
      else counts.not_started++;
    });
    return [
      { label: 'Recommendation Ready', count: counts.has_recommendation, color: '#10b981' },
      { label: 'Eligible for AI', count: counts.eligible, color: '#f59e0b' },
      { label: 'In Assessment', count: counts.in_progress, color: '#0284c7' },
      { label: 'Not Started', count: counts.not_started, color: '#64748b' },
    ];
  }, [facultyUsers]);

  const deptTimestamp = deptResult?.generated_at || deptResult?.last_recommendation_at;
  const formattedDeptTime = deptTimestamp
    ? new Date(deptTimestamp).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;
""")
parts.append("""
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
              <span>{campusName}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-green/10 text-brand-green border border-brand-green/20">
              <Building className="w-3.5 h-3.5 text-brand-green" />
              <span>{deptCode} Department</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-light-text dark:text-white tracking-tight leading-tight">
            {deptCode} Department Recommendations & Supervision
          </h1>
          <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed max-w-2xl">
            Monitor department faculty assessment progress, provision department instructor accounts, and aggregate program AI training needs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/register-faculty"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-light-text dark:text-slate-200 border border-light-border dark:border-slate-700 text-xs font-semibold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-brand-green" />
            <span>Add Faculty Member</span>
          </Link>

          <button
            onClick={handleRunDeptRecommendation}
            disabled={runningDeptRec || eligibleFacultyCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
          >
            {runningDeptRec ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Aggregating Department...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Run Dept AI Recommendation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Department Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Department Faculty</span>
            <Users className="w-4 h-4 text-brand-green" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{facultyUsers.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">{deptCode} Program Instructors</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Assessment Readiness</span>
            <Sparkles className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {facultyUsers.length > 0 ? Math.round((eligibleFacultyCount / facultyUsers.length) * 100) : 0}%
          </div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">{eligibleFacultyCount} of {facultyUsers.length} ready</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Campus Unit</span>
            <MapPin className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-sm font-bold text-light-text dark:text-white truncate">{campusName}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Institutional Location</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Recommendation Status</span>
            <BookOpen className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-sm font-bold text-light-text dark:text-white">
            {deptResult ? 'Active Output' : 'Pending Run'}
          </div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">
            {formattedDeptTime ? `Updated ${formattedDeptTime}` : 'Not generated yet'}
          </p>
        </div>
      </div>

      {/* 3. Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VisualDonutBreakdown
          title={`${deptCode} Faculty Assessment Progress`}
          total={facultyUsers.length}
          items={statusBreakdown}
        />

        {deptResult?.prediction?.top_categories ? (
          <VisualBarChart
            title={`${deptCode} Department Priority Training Areas`}
            subtitle="Aggregated competency gap analysis across program faculty"
            data={deptResult.prediction.top_categories.map((c) => ({
              label: c.training_category,
              value: Math.round(c.department_score * 100),
              color: rankColor(c.rank),
            }))}
          />
        ) : (
          <div className="bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2">
            <Sparkles className="w-8 h-8 text-brand-gold" />
            <h4 className="text-sm font-bold text-light-text dark:text-white">No Department AI Model Output Yet</h4>
            <p className="text-xs text-light-text dark:text-dark-muted max-w-sm">
              Click "Run Dept AI Recommendation" above to aggregate faculty assessment data and synthesize priorities.
            </p>
          </div>
        )}
      </div>

      {/* 4. Faculty Table with Pagination */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-light-text dark:text-white">{deptCode} Department Faculty Roster</h2>
            </div>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
              Supervise instructor accounts and monitor assessment completion status.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Search faculty by name, code..."
              onChange={(debounced) => {
                setSearchQuery(debounced);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {loadingUsers ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-light-border dark:border-slate-800 rounded-2xl text-xs text-light-text dark:text-dark-muted">
            No faculty members found in this department.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-light-text dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-light-text dark:text-dark-muted font-semibold border-b border-light-border dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Faculty Name & ID</th>
                    <th className="p-3.5">Academic Rank</th>
                    <th className="p-3.5">Specialization</th>
                    <th className="p-3.5">Assessment Status</th>
                    <th className="p-3.5 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border/60 dark:divide-slate-800/60">
                  {paginatedFaculty.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-light-text dark:text-white">{u.full_name || u.username}</div>
                        <div className="text-[11px] text-light-text dark:text-dark-muted font-mono">
                          @{u.username} {u.faculty_code ? `· [${u.faculty_code}]` : ''}
                        </div>
                      </td>
                      <td className="p-3.5 text-light-text dark:text-slate-200">{u.academic_rank || 'Instructor I'}</td>
                      <td className="p-3.5 text-light-text dark:text-dark-muted">{u.specialization || u.highest_degree || 'General'}</td>
                      <td className="p-3.5">
                        <StatusBadge status={u.status || 'not_started'} />
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUserForEdit(u)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-600/30 text-light-text dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-light-border dark:border-slate-700 transition-all"
                            title="Edit Profile"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedUserForDelete(u)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-600/30 text-light-text dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-light-border dark:border-slate-700 transition-all"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => setPageSize(s)}
            />
          </>
        )}
      </div>

      {/* Edit User Modal */}
      {selectedUserForEdit && (
        <ViewEditUserModal
          user={selectedUserForEdit}
          currentUserRole="department_admin"
          onClose={() => setSelectedUserForEdit(null)}
          onUpdated={loadFaculty}
        />
      )}

      {/* Delete User Modal */}
      {selectedUserForDelete && (
        <DeleteUserModal
          user={selectedUserForDelete}
          onClose={() => setSelectedUserForDelete(null)}
          onDeleted={loadFaculty}
        />
      )}
    </div>
  );
}
""")

Path("frontend/src/app/(dept-admin)/dept-dashboard/page.tsx").write_text("".join(parts), encoding="utf-8")
print("Dept Dashboard page v2 updated successfully.")
