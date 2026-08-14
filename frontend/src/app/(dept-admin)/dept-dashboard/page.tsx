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
            Monitor faculty questionnaire completion, manage department accounts, and generate group training priorities.
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-5 sm:p-6 border border-emerald-500/30 shadow-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Sparkles className="w-40 h-40 text-emerald-400" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-emerald-400">Department Recommendation Output</span>
                    <span className="text-[10px] font-mono text-slate-500">v{deptResult.model?.version}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    Aggregated Training Priorities — {deptResult.department} Department
                  </h2>
                </div>
              </div>

              {/* Timestamp Badge */}
              {formattedDeptTime && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono shrink-0">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Result as of: <strong className="text-white font-semibold">{formattedDeptTime}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Model Predictions (compact, secondary) */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 px-1">
              <Target className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-200">Department Priority Training Categories</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
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
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-slate-700 transition-all"
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
                      <p className="text-xs font-semibold text-slate-200 leading-snug">{cat.training_category}</p>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
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
              <BookOpen className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-base font-extrabold text-white">Recommended Department Training Programs</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                  These matched catalog items represent specific programs that address the aggregated gaps of your department&apos;s faculty. Plan department-wide webinars, workshops, or training courses around these high-scoring catalog matches.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gold-500/8 border border-gold-500/20">
              <Info className="w-4 h-4 text-gold-400 shrink-0" />
              <p className="text-xs text-gold-300">
                Programs are sorted by match fit. Use these as primary action items for department faculty development.
              </p>
            </div>

            {deptResult.recommendations?.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-400 text-sm">No department catalog matches found for these categories.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deptResult.recommendations?.map((item, idx) => (
                  <div
                    key={item.training_id}
                    className="relative p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-gold-500/40 hover:bg-slate-900/80 transition-all group shadow-lg"
                  >
                    <div
                      className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
                      style={{ backgroundColor: idx === 0 ? '#f59e0b' : idx === 1 ? '#10b981' : '#334155' }}
                    />
                    <div className="pl-3 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                            {item.training_id}
                          </span>
                          <span className="text-xs font-semibold text-gold-300 bg-gold-500/10 px-2.5 py-0.5 rounded border border-gold-500/20">
                            {item.category}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-bold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">
                              ★ Top Department Match
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-100 group-hover:text-gold-300 transition-colors leading-snug">
                          {item.title}
                        </h4>

                        {item.description && (
                          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-start gap-2 text-xs text-emerald-400/90 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item.reason}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center min-w-[90px] shrink-0">
                        <DonutChart
                          probability={item.match_score}
                          color={item.match_score >= 0.7 ? '#10b981' : item.match_score >= 0.4 ? '#f59e0b' : '#64748b'}
                        />
                        <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight">
                          Match<br />Score
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 mt-0.5">
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
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-xl backdrop-blur-md space-y-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
            <Brain className="w-8 h-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white">
              Generate {deptCode} Department Training Recommendations
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Aggregate individual survey responses across all active faculty members in {deptCode} to synthesize department-wide priority training areas and match high-impact catalog courses.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-300">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                <strong>{eligibleFacultyCount}</strong> of <strong>{users.length}</strong> Faculty Eligible
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>Multi-Label AI Prioritization</span>
            </div>
          </div>

          <button
            onClick={handleRunDeptRecommendation}
            disabled={runningDeptRec || eligibleFacultyCount === 0}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-gold-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Generate Department Recommendations</span>
            <ArrowRight className="w-4 h-4 text-slate-950 ml-1" />
          </button>

          {eligibleFacultyCount === 0 && users.length > 0 && (
            <p className="text-[11px] text-amber-400 font-medium">
              Note: Faculty members must complete the required questionnaire parts (status &quot;eligible&quot; or &quot;has_recommendation&quot;) before department aggregation can run.
            </p>
          )}
        </div>
      )}

      {/* 3. Department Faculty Users Table */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Department Faculty Roster</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
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
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl text-xs text-slate-400">
            No faculty members registered in this department yet.
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl text-xs text-slate-400 space-y-1">
            <p className="text-slate-300 font-semibold">No faculty found matching &quot;{searchQuery}&quot;</p>
            <p className="text-slate-500">Try clearing the search or searching for a different keyword.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Faculty Name & ID</th>
                  <th className="p-3.5">Academic Rank & Field</th>
                  <th className="p-3.5">Contact Email</th>
                  <th className="p-3.5">Questionnaire Status</th>
                  <th className="p-3.5 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-100">{u.full_name || u.username}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        @{u.username} {u.faculty_code ? `· [${u.faculty_code}]` : ''}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-200">{u.academic_rank || 'Instructor I'}</div>
                      <div className="text-[11px] text-slate-400">{u.specialization || u.highest_degree || 'General'}</div>
                    </td>
                    <td className="p-3.5 text-slate-400">{u.email || '—'}</td>
                    <td className="p-3.5">
                      <StatusBadge status={u.status || 'not_started'} />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUserForEdit(u)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-400 border border-slate-700 text-[11px] font-medium transition-all"
                          title="View / Edit Profile Details"
                        >
                          <Pencil className="w-3 h-3" />
                          <span className="hidden md:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => setSelectedUserForEdit(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/30 text-slate-300 hover:text-amber-400 border border-slate-700 transition-all"
                          title="Emergency Password Reset"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedUserForDelete(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 border border-slate-700 transition-all"
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
