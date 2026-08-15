'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserListItem, DepartmentRecommendationResult } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import SearchInput from '@/components/SearchInput';
import { TableSkeleton, RecommendationSkeleton } from '@/components/Skeletons';
import { ViewEditUserModal, DeleteUserModal } from '@/components/UserModals';
import {
  Users,
  Building,
  UserPlus,
  Sparkles,
  RefreshCw,
  BookOpen,
  Target,
  Info,
  Check,
  Pencil,
  Key,
  Trash2,
  Clock,
  ArrowRight,
  Brain,
} from 'lucide-react';
import { formatPercent } from '@/lib/utils';

// ─── Mini SVG Donut Chart ────────────────────────────────────────────────────
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
  if (rank === 1) return '#10b981'; // emerald
  if (rank === 2) return '#f59e0b'; // gold
  return '#64748b';                 // slate
}

export default function DeptDashboardPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptResult, setDeptResult] = useState<DepartmentRecommendationResult | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingInitialDeptRec, setLoadingInitialDeptRec] = useState(true);
  const [runningDeptRec, setRunningDeptRec] = useState(false);

  // Modals state
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserListItem | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserListItem | null>(null);

  const { showToast } = useToast();

  const loadFaculty = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err: any) {
      showToast('error', 'Error Loading Faculty', err.response?.data?.detail || 'Failed to fetch department faculty.');
    } finally {
      setLoadingUsers(false);
    }
  }, [showToast]);

  const loadLatestDeptRec = useCallback(async () => {
    setLoadingInitialDeptRec(true);
    try {
      const res = await api.get('/recommendations/department/last');
      if (res.data?.has_recommendation) {
        setDeptResult(res.data);
      }
    } catch {
      // Recommendation not yet generated
    } finally {
      setLoadingInitialDeptRec(false);
    }
  }, []);

  useEffect(() => {
    loadFaculty();
    loadLatestDeptRec();
  }, [loadFaculty, loadLatestDeptRec]);

  const handleRunDeptRecommendation = async () => {
    // Clear stale result immediately so the skeleton shows cleanly
    setDeptResult(null);
    setRunningDeptRec(true);
    showToast('info', 'Department Aggregation Active', 'Aggregating faculty needs across department...');
    try {
      const res = await api.post('/recommendations/department');
      // Always use the fresh generated_at from the API response
      const freshResult = {
        ...res.data,
        generated_at: res.data.generated_at || new Date().toISOString(),
      };
      setDeptResult(freshResult);
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
  const eligibleFacultyCount = useMemo(
    () => users.filter((u) => u.status === 'eligible' || u.status === 'has_recommendation').length,
    [users]
  );

  // Filtered faculty list based on debounced search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.faculty_code && u.faculty_code.toLowerCase().includes(q)) ||
        (u.academic_rank && u.academic_rank.toLowerCase().includes(q)) ||
        (u.specialization && u.specialization.toLowerCase().includes(q)) ||
        (u.status && u.status.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  const deptTimestamp = deptResult?.generated_at || deptResult?.last_recommendation_at;
  const formattedDeptTime = deptTimestamp
    ? new Date(deptTimestamp).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-green/10 text-brand-green border border-brand-green/20">
            <Building className="w-3.5 h-3.5 text-brand-green" />
            <span>Department Admin Overview</span>
          </div>

          <h1 className="text-2xl font-extrabold text-light-text dark:text-white tracking-tight">
            {deptCode} Department Recommendations & Monitoring
          </h1>
          <p className="text-xs text-light-text dark:text-dark-muted">
            Monitor faculty questionnaire completion, manage department accounts, and generate group training priorities.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/register-faculty"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border text-brand-green hover:border-brand-green text-xs font-semibold transition-all"
          >
            <UserPlus className="w-4 h-4 text-brand-green" />
            <span>Add Faculty Account</span>
          </Link>

          <button
            onClick={handleRunDeptRecommendation}
            disabled={runningDeptRec}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-white font-extrabold text-xs shadow-lg transition-all disabled:opacity-50"
          >
            {runningDeptRec ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Aggregating Faculty...</span>
              </>
            ) : (
              <>
                <span>{deptResult ? 'Re-run Recommendation' : 'Run Department Recommendation'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Skeleton while running OR Department Aggregated Recommendation Results */}
      {runningDeptRec || loadingInitialDeptRec ? (
        <RecommendationSkeleton message="Analyzing Department Training Gaps & Aggregating Recommendations..." />
      ) : deptResult ? (
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-5 sm:p-6 shadow-xl">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Sparkles className="w-40 h-40 text-brand-green" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-brand-green" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-light-text dark:text-white">Department Recommendation Output</span>
                    <span className="text-[10px] font-mono text-light-text dark:text-dark-muted">v{deptResult.model?.version}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    Aggregated Training Priorities — {deptResult.department} Department
                  </h2>
                </div>
              </div>

              {/* Timestamp Badge */}
              {formattedDeptTime && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-green/10 border border-brand-green/20 text-brand-green text-xs font-mono shrink-0">
                  <Clock className="w-3.5 h-3.5 text-brand-green" />
                  <span>Result as of: <strong className="text-light-text dark:text-white font-semibold">{formattedDeptTime}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Model Predictions (compact, secondary) */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 px-1">
              <Target className="w-4 h-4 text-light-text dark:text-dark-muted mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-light-text dark:text-dark-text">Department Priority Training Categories</h3>
                <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed mt-0.5">
                  These are the aggregated competency priority areas calculated for your department. The priority score represents a weighted average of individual faculty needs, combined with faculty coverage percentage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {deptResult.prediction?.top_categories?.map((cat) => {
                const color = rankColor(cat.rank);
                return (
                  <div
                    key={cat.training_category}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-light-border dark:border-dark-border/80 bg-white dark:bg-dark-card/40 hover:border-light-border dark:border-dark-border transition-all"
                  >
                    <DonutChart probability={cat.department_score} color={color} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                          style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
                        >
                          Priority #{cat.rank}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-light-text dark:text-dark-text leading-snug">{cat.training_category}</p>
                      <p className="text-[11px] font-mono text-light-text dark:text-dark-muted mt-0.5">
                        Coverage: {formatPercent(cat.faculty_coverage)} · {(cat.department_score).toFixed(3)} raw
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Recommended Training Programs (prominent, primary) */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 px-1">
              <BookOpen className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
              <div>
                <h3 className="text-base font-extrabold text-white">Recommended Department Training Programs</h3>
                <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed mt-0.5">
                  These matched catalog items represent specific programs that address the aggregated gaps of your department&apos;s faculty. Plan department-wide webinars, workshops, or training courses around these high-scoring catalog matches.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-brand-gold/8 border border-brand-gold/20">
              <Info className="w-4 h-4 text-brand-gold shrink-0" />
              <p className="text-xs text-brand-gold-dark">
                Programs are sorted by match fit. Use these as primary action items for department faculty development.
              </p>
            </div>

            {deptResult.recommendations?.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-light-border dark:border-dark-border rounded-2xl">
                <p className="text-light-text dark:text-dark-muted text-sm">No department catalog matches found for these categories.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deptResult.recommendations?.map((item, idx) => (
                  <div
                    key={item.training_id}
                    className="relative p-5 rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card/60 hover:border-brand-gold/40 hover:bg-white dark:bg-dark-card/80 transition-all group shadow-lg"
                  >
                    <div
                      className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                      style={{ backgroundColor: idx === 0 ? '#f59e0b' : idx === 1 ? '#10b981' : '#334155' }}
                    />
                    <div className="pl-3 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-light-text dark:text-white bg-brand-green/10 px-2.5 py-0.5 rounded border border-brand-green/20">
                            {item.training_id}
                          </span>
                          <span className="text-xs font-semibold text-brand-gold-dark bg-brand-gold/10 px-2.5 py-0.5 rounded border border-brand-gold/20">
                            {item.category}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20">
                              ★ Top Department Match
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-light-text dark:text-dark-text group-hover:text-brand-gold-dark transition-colors leading-snug">
                          {item.title}
                        </h4>

                        {item.description && (
                          <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed max-w-2xl">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-start gap-2 text-xs text-brand-green/90 bg-brand-green/5 border border-brand-green/15 rounded-lg px-3 py-2">
                          <Check className="w-3.5 h-3.5 text-brand-green shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item.reason}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center shrink-0 sm:min-w-[90px]">
                        <DonutChart
                          probability={item.match_score}
                          color={item.match_score >= 0.7 ? '#10b981' : item.match_score >= 0.4 ? '#f59e0b' : '#64748b'}
                        />
                        <span className="text-[10px] text-light-text dark:text-dark-muted text-center mt-1 leading-tight">
                          Match<br />Score
                        </span>
                        <span className="text-[10px] font-mono text-light-text dark:text-dark-muted mt-0.5">
                          {(item.match_score).toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State / Trigger Card for Department Recommendations */
        <div className="relative overflow-hidden rounded-3xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card/60 p-8 text-center shadow-xl backdrop-blur-md space-y-6">
          <div className="flex justify-center">
            <img
              src="/images/logo.png"
              alt="QSU Recommender"
              className="w-16 h-16 object-contain"
            />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white">
              Generate {deptCode} Department Training Recommendations
            </h3>
            <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
              Aggregate individual survey responses across all active faculty members in {deptCode} to synthesize department-wide priority training areas and match high-impact catalog courses.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-light-text dark:text-dark-text">
            <div className="px-3.5 py-1.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-green" />
              <span>
                <strong>{eligibleFacultyCount}</strong> of <strong>{users.length}</strong> Faculty Eligible
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border flex items-center gap-2">
              <img src="/images/logo.png" alt="QSU Recommender" className="w-3.5 h-3.5 object-contain" />
              <span>Multi-Label AI Prioritization</span>
            </div>
          </div>

          <button
            onClick={handleRunDeptRecommendation}
            disabled={runningDeptRec || eligibleFacultyCount === 0}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-gold hover:bg-brand-gold-dark text-white font-extrabold text-sm shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Generate Department Recommendations</span>
            <ArrowRight className="w-4 h-4 text-white ml-1" />
          </button>

          {eligibleFacultyCount === 0 && users.length > 0 && (
            <p className="text-[11px] text-brand-gold font-medium">
              Note: Faculty members must complete the required questionnaire parts (status &quot;eligible&quot; or &quot;has_recommendation&quot;) before department aggregation can run.
            </p>
          )}
        </div>
      )}

      {/* 3. Department Faculty Users Table */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-green" />
              <h2 className="text-lg font-bold text-light-text dark:text-white">Department Faculty Roster</h2>
            </div>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
              {users.length} Faculty Members registered in {deptCode}
            </p>
          </div>

          {/* Search with Debounce */}
          <div className="w-full sm:w-72">
            <SearchInput
              placeholder="Search faculty by name, code, rank..."
              onChange={(debounced) => setSearchQuery(debounced)}
            />
          </div>
        </div>

        {loadingUsers ? (
          <TableSkeleton rows={5} cols={5} />
        ) : users.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-light-border dark:border-dark-border rounded-2xl text-xs text-light-text dark:text-dark-muted">
            No faculty members registered in this department yet.
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-light-border dark:border-dark-border rounded-2xl text-xs text-light-text dark:text-dark-muted space-y-1">
            <p className="text-light-text dark:text-dark-text font-semibold">No faculty found matching &quot;{searchQuery}&quot;</p>
            <p className="text-light-text dark:text-dark-muted">Try clearing the search or searching for a different keyword.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-light-text dark:text-dark-text">
              <thead className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-muted font-semibold border-b border-light-border dark:border-dark-border uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Faculty Name & ID</th>
                  <th className="p-3.5">Academic Rank & Field</th>
                  <th className="p-3.5">Contact Email</th>
                  <th className="p-3.5">Questionnaire Status</th>
                  <th className="p-3.5 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-light-bg dark:hover:bg-dark-bg/60 transition-colors group">
                    <td className="p-3.5">
                      <div className="font-bold text-light-text dark:text-dark-text">{u.full_name || u.username}</div>
                      <div className="text-[11px] text-light-text dark:text-dark-muted font-mono">
                        @{u.username} {u.faculty_code ? `· [${u.faculty_code}]` : ''}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-light-text dark:text-dark-text">{u.academic_rank || 'Instructor I'}</div>
                      <div className="text-[11px] text-light-text dark:text-dark-muted">{u.specialization || u.highest_degree || 'General'}</div>
                    </td>
                    <td className="p-3.5 text-light-text dark:text-dark-muted">{u.email || '—'}</td>
                    <td className="p-3.5">
                      <StatusBadge status={u.status || 'not_started'} />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUserForEdit(u)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-dark-bg hover:bg-brand-green/10 text-brand-green dark:text-dark-text hover:text-brand-green border border-light-border dark:border-dark-border text-[11px] font-medium transition-all"
                          title="View / Edit Profile Details"
                        >
                          <Pencil className="w-3 h-3" />
                          <span className="hidden md:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => setSelectedUserForEdit(u)}
                          className="p-1.5 rounded-lg bg-white dark:bg-dark-bg hover:bg-brand-gold/10 text-brand-gold border border-light-border dark:border-dark-border transition-all"
                          title="Emergency Password Reset"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedUserForDelete(u)}
                          className="p-1.5 rounded-lg bg-white dark:bg-dark-bg hover:bg-rose-600/30 text-rose-600 dark:text-rose-400 border border-light-border dark:border-dark-border transition-all"
                          title="Delete Faculty Account"
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
        )}
      </div>

      {/* ── Modals ── */}
      {selectedUserForEdit && (
        <ViewEditUserModal
          user={selectedUserForEdit}
          currentUserRole="department_admin"
          onClose={() => setSelectedUserForEdit(null)}
          onUpdated={loadFaculty}
        />
      )}

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
