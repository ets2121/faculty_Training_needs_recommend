'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Search, RefreshCw, Pencil, Trash2, KeyRound,
  GraduationCap, CheckCircle2, Clock, AlertCircle, UserPlus, Filter
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { UserListItem } from '@/types';
import { ViewEditUserModal, DeleteUserModal } from '@/components/UserModals';
import Pagination from '@/components/Pagination';

function getQuestionnaireStatus(u: UserListItem): string {
  return u.questionnaire_status || u.status || 'not_started';
}

function statusIcon(status: string) {
  if (status === 'has_recommendation') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
  if (status === 'eligible') return <Clock className="w-3.5 h-3.5 text-amber-400" />;
  if (status === 'in_progress') return <RefreshCw className="w-3.5 h-3.5 text-sky-400" />;
  return <AlertCircle className="w-3.5 h-3.5 text-slate-400" />;
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    has_recommendation: 'Has Recommendation',
    eligible: 'Eligible for Rec',
    in_progress: 'In Progress',
    not_started: 'Not Started',
  };
  return map[status] ?? status;
}

function statusBg(status: string) {
  if (status === 'has_recommendation') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (status === 'eligible') return 'bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-400/20';
  if (status === 'in_progress') return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
  return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
}

export default function DeptFacultyPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const deptName = authUser?.department?.name || 'Department';
  const deptCode = authUser?.department?.code || 'DEPT';

  const [faculty, setFaculty] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserListItem | null>(null);
  const [resetPwLoading, setResetPwLoading] = useState(false);
  const [newPw, setNewPw] = useState('');

  const loadFaculty = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      const all: UserListItem[] = res.data?.users || [];
      setFaculty(all.filter((u) => u.role === 'faculty'));
    } catch (err: any) {
      showToast('error', 'Load Error', err.response?.data?.detail || 'Failed to load faculty.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadFaculty();
  }, [loadFaculty]);

  const filtered = useMemo(() => {
    return faculty.filter((u) => {
      const qStatus = getQuestionnaireStatus(u);
      const matchSearch =
        (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.specialization || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.academic_rank || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || qStatus === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [faculty, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filtered, currentPage, pageSize]);

  const stats = useMemo(() => {
    let hasRec = 0;
    let eligible = 0;
    let inProgress = 0;
    let notStarted = 0;

    faculty.forEach((u) => {
      const st = getQuestionnaireStatus(u);
      if (st === 'has_recommendation') hasRec++;
      else if (st === 'eligible') eligible++;
      else if (st === 'in_progress') inProgress++;
      else notStarted++;
    });

    return { total: faculty.length, hasRec, eligible, inProgress, notStarted };
  }, [faculty]);

  const handleResetPw = async () => {
    if (!resettingUser || !newPw.trim()) return;
    setResetPwLoading(true);
    try {
      await api.post(`/users/${resettingUser.id}/reset-password`, { new_password: newPw });
      showToast('success', 'Password Reset', `Password for @${resettingUser.username} has been reset successfully.`);
      setResettingUser(null);
      setNewPw('');
    } catch (err: any) {
      showToast('error', 'Reset Failed', err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setResetPwLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-10 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-6 h-6 text-brand-gold" />
            <h1 className="text-2xl font-extrabold text-light-text dark:text-white">Faculty Management</h1>
          </div>
          <p className="text-sm text-light-text dark:text-dark-muted">
            {deptName} ({deptCode}) &mdash; Manage and track department faculty members
          </p>
        </div>
        <Link
          href="/register-faculty"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-gold hover:bg-brand-gold-dark text-slate-950 text-sm font-bold shadow-lg shadow-brand-gold/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add Faculty Account
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Faculty', value: stats.total, color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/20', icon: Users },
          { label: 'Has Recommendation', value: stats.hasRec, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
          { label: 'Eligible for Rec', value: stats.eligible, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
          { label: 'In Progress / Not Started', value: stats.inProgress + stats.notStarted, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', icon: AlertCircle },
        ].map((s) => (
          <div key={s.label} className={`p-5 rounded-2xl border ${s.bg} bg-white/60 dark:bg-dark-card/60 shadow-sm`}>
            <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] font-semibold text-light-text dark:text-dark-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text dark:text-dark-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search faculty by name, username, rank, or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-sm outline-none focus:ring-2 focus:ring-brand-gold/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-sm outline-none focus:ring-2 focus:ring-brand-gold/40 cursor-pointer font-medium"
            >
              <option value="all">All Assessment Statuses ({faculty.length})</option>
              <option value="has_recommendation">Has Recommendation ({stats.hasRec})</option>
              <option value="eligible">Eligible for Recommendation ({stats.eligible})</option>
              <option value="in_progress">In Progress ({stats.inProgress})</option>
              <option value="not_started">Not Started ({stats.notStarted})</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-light-text dark:text-dark-muted pointer-events-none" />
          </div>

          <button
            onClick={loadFaculty}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-sm font-semibold text-light-text dark:text-dark-muted hover:border-brand-gold hover:text-brand-gold transition-all shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-dark-card/70 border border-light-border dark:border-dark-border rounded-3xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-light-text dark:text-dark-muted text-sm">
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Loading faculty list...
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <GraduationCap className="w-12 h-12 text-light-text dark:text-dark-muted mb-3 opacity-40" />
            <p className="text-sm font-semibold text-light-text dark:text-dark-muted">No faculty matching criteria</p>
            <p className="text-xs text-light-text dark:text-dark-muted mt-1">
              {search || filterStatus !== 'all' ? 'Try changing your search or filter.' : 'Add faculty using the button above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border bg-slate-50/80 dark:bg-slate-900/60">
                  {['Faculty Member', 'Username', 'Academic Rank', 'Specialization', 'Assessment Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-light-text dark:text-dark-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {paginated.map((u) => {
                  const qStatus = getQuestionnaireStatus(u);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold font-bold text-xs">
                            {(u.full_name || u.username || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-light-text dark:text-dark-text text-sm">{u.full_name || '—'}</p>
                            <p className="text-xs text-light-text dark:text-dark-muted">{u.email || 'No email registered'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-light-text dark:text-slate-300">@{u.username}</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-light-text dark:text-dark-muted">
                        {u.academic_rank || '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-light-text dark:text-dark-muted">
                        {u.specialization || 'General Faculty'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${statusBg(qStatus)}`}>
                          {statusIcon(qStatus)}
                          {statusLabel(qStatus)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-600/20 text-light-text dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-light-border dark:border-slate-700 transition-all"
                            title="Edit Profile"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setResettingUser(u); setNewPw(''); }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-600/20 text-light-text dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-light-border dark:border-slate-700 transition-all"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-600/20 text-light-text dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-light-border dark:border-slate-700 transition-all"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
        />
      )}

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-light-text dark:text-dark-text">Reset Password</h3>
                <p className="text-xs text-light-text dark:text-dark-muted">For @{resettingUser.username}</p>
              </div>
            </div>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-sm outline-none focus:ring-2 focus:ring-brand-gold/40"
            />
            <div className="flex gap-3">
              <button onClick={() => setResettingUser(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-sm font-semibold">Cancel</button>
              <button
                onClick={handleResetPw}
                disabled={resetPwLoading || !newPw.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold disabled:opacity-50 transition-all"
              >
                {resetPwLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <ViewEditUserModal
          user={editingUser}
          currentUserRole={authUser?.role ?? 'department_admin'}
          onClose={() => setEditingUser(null)}
          onUpdated={() => {
            setEditingUser(null);
            showToast('success', 'Profile Updated', 'Faculty information has been updated.');
            loadFaculty();
          }}
        />
      )}
      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onDeleted={() => {
            setDeletingUser(null);
            showToast('success', 'Account Deleted', 'Faculty member removed successfully.');
            loadFaculty();
          }}
        />
      )}
    </div>
  );
}
