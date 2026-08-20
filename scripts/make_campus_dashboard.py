from pathlib import Path

code_parts = []
code_parts.append("""'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserListItem, DepartmentRecommendationResult, CampusOverviewItem } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import SearchInput from '@/components/SearchInput';
import { TableSkeleton, RecommendationSkeleton } from '@/components/Skeletons';
import { ViewEditUserModal, DeleteUserModal } from '@/components/UserModals';
import TransferFacultyModal from '@/components/TransferFacultyModal';
import {
  Users,
  Building,
  MapPin,
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
  ArrowRightLeft,
  PlusCircle,
  X,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { formatPercent, formatManila } from '@/lib/utils';
""")
code_parts.append("""
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
""")
code_parts.append("""
export default function CampusDashboardPage() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [campusStats, setCampusStats] = useState<any>(null);
  const [campusResult, setCampusResult] = useState<DepartmentRecommendationResult | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [runningCampusRec, setRunningCampusRec] = useState(false);

  // Modals
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserListItem | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserListItem | null>(null);
  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<UserListItem | null>(null);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddDeptAdminModal, setShowAddDeptAdminModal] = useState(false);

  // Add Dept form state
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [creatingDept, setCreatingDept] = useState(false);

  // Add Dept Admin form state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminDeptId, setAdminDeptId] = useState<number | null>(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const { showToast } = useToast();

  const campusId = authUser?.campus?.id || 1;
  const campusName = authUser?.campus?.name || 'Diffun Campus (Main)';
  const campusCode = authUser?.campus?.code || 'DIFFUN';

  const loadData = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const [usersRes, campusRes] = await Promise.all([
        api.get('/users'),
        api.get(`/campuses/${campusId}`),
      ]);
      setUsers(usersRes.data.users || []);
      setCampusStats(campusRes.data || null);
    } catch (err: any) {
      showToast('error', 'Error Loading Campus Data', err.response?.data?.detail || 'Failed to fetch data.');
    } finally {
      setLoadingUsers(false);
    }
  }, [campusId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunCampusRecommendation = async () => {
    setCampusResult(null);
    setRunningCampusRec(true);
    showToast('info', 'Campus AI Engine Active', 'Aggregating faculty competency gaps across all campus departments...');
    try {
      const res = await api.post('/recommendations/campus');
      setCampusResult(res.data);
      showToast('success', 'Campus Recommendations Ready!', `Analyzed ${res.data.eligible_faculty_count} faculty across ${res.data.total_departments} departments.`);
      await loadData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to run campus recommendation.';
      showToast('error', 'Execution Failed', msg);
    } finally {
      setRunningCampusRec(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptCode.trim() || !newDeptName.trim()) {
      showToast('error', 'Validation Error', 'Department Code and Name are required.');
      return;
    }

    setCreatingDept(true);
    try {
      await api.post(`/campuses/${campusId}/departments`, {
        code: newDeptCode.trim(),
        name: newDeptName.trim(),
      });
      showToast('success', 'Department Created', `Department '${newDeptCode.toUpperCase()}' added to ${campusName}.`);
      setNewDeptCode('');
      setNewDeptName('');
      setShowAddDeptModal(false);
      await loadData();
    } catch (err: any) {
      showToast('error', 'Error', err.response?.data?.detail || 'Failed to create department.');
    } finally {
      setCreatingDept(false);
    }
  };

  const handleCreateDeptAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim() || !adminDeptId) {
      showToast('error', 'Validation Error', 'Username, password, and department selection are required.');
      return;
    }

    setCreatingAdmin(true);
    try {
      await api.post('/auth/register', {
        username: adminUsername.trim(),
        password: adminPassword.trim(),
        full_name: adminFullName.trim() || undefined,
        email: adminEmail.trim() || undefined,
        role: 'department_admin',
        department_id: adminDeptId,
      });
      showToast('success', 'Dept Admin Created', `Account for '${adminUsername}' created successfully.`);
      setAdminUsername('');
      setAdminPassword('');
      setAdminFullName('');
      setAdminEmail('');
      setShowAddDeptAdminModal(false);
      await loadData();
    } catch (err: any) {
      showToast('error', 'Error', err.response?.data?.detail || 'Failed to create Department Admin.');
    } finally {
      setCreatingAdmin(false);
    }
  };
""")
code_parts.append("""
  const facultyUsers = useMemo(() => users.filter((u) => u.role === 'faculty'), [users]);
  const deptAdminUsers = useMemo(() => users.filter((u) => u.role === 'department_admin'), [users]);

  const filteredFaculty = useMemo(() => {
    return facultyUsers.filter((u) => {
      if (selectedDeptFilter !== 'all' && u.department_code !== selectedDeptFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        u.username.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.faculty_code && u.faculty_code.toLowerCase().includes(q)) ||
        (u.department_code && u.department_code.toLowerCase().includes(q)) ||
        (u.academic_rank && u.academic_rank.toLowerCase().includes(q)) ||
        (u.specialization && u.specialization.toLowerCase().includes(q))
      );
    });
  }, [facultyUsers, selectedDeptFilter, searchQuery]);

  const eligibleCount = useMemo(
    () => facultyUsers.filter((u) => u.status === 'eligible' || u.status === 'has_recommendation').length,
    [facultyUsers]
  );

  const formattedCampusTime = formatManila(campusResult?.generated_at);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <MapPin className="w-3.5 h-3.5 text-sky-500" />
            <span>Campus Administration</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text dark:text-white tracking-tight">
            {campusName}
          </h1>
          <p className="text-xs text-light-text dark:text-dark-muted max-w-2xl leading-relaxed">
            Manage campus departments, supervise department chairs, transfer faculty across campuses, and aggregate campus-wide AI training priorities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddDeptModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-light-text dark:text-slate-200 border border-light-border dark:border-slate-700 text-xs font-semibold transition-all shadow-sm"
          >
            <Building className="w-4 h-4 text-brand-gold" />
            <span>Add Department</span>
          </button>

          <button
            onClick={() => setShowAddDeptAdminModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-light-text dark:text-slate-200 border border-light-border dark:border-slate-700 text-xs font-semibold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-emerald-500" />
            <span>Add Dept Admin</span>
          </button>

          <button
            onClick={handleRunCampusRecommendation}
            disabled={runningCampusRec || eligibleCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-extrabold text-xs shadow-lg shadow-sky-950/40 transition-all disabled:opacity-50"
          >
            {runningCampusRec ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Aggregating Campus...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Run Campus Recommendations</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Campus Departments</span>
            <Building className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">
            {campusStats?.total_departments ?? campusStats?.departments?.length ?? 0}
          </div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Active academic units</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Department Chairs</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">
            {deptAdminUsers.length}
          </div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Department Administrators</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Total Campus Faculty</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">
            {facultyUsers.length}
          </div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Registered instructors</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Assessment Readiness</span>
            <Sparkles className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {facultyUsers.length > 0 ? Math.round((eligibleCount / facultyUsers.length) * 100) : 0}%
          </div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">
            {eligibleCount} of {facultyUsers.length} eligible
          </p>
        </div>
      </div>
""")
code_parts.append("""
      {/* 3. Campus Recommendation Results View */}
      {runningCampusRec ? (
        <RecommendationSkeleton message={`Aggregating ${campusName} Faculty Needs & Synthesizing Recommendations...`} />
      ) : campusResult ? (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 p-5 sm:p-6 border border-sky-500/30 shadow-2xl text-white">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono font-bold text-sky-400">Campus-Wide Training Output</span>
                    <span className="text-[10px] font-mono text-slate-400">v{campusResult.model?.version}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-white">
                    Aggregated Priorities — {campusName}
                  </h2>
                </div>
              </div>

              {formattedCampusTime && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-mono shrink-0">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Result as of: <strong className="text-white font-semibold">{formattedCampusTime}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5 px-1">
              <Target className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-light-text dark:text-slate-200">Campus Priority Training Needs</h3>
                <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
                  Synthesized across {campusResult.total_departments || campusStats?.departments?.length || 0} academic departments in {campusName}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {campusResult.prediction?.top_categories?.map((cat) => {
                const color = rankColor(cat.rank);
                return (
                  <div
                    key={cat.training_category}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-light-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 shadow-sm"
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
                      <p className="text-xs font-semibold text-light-text dark:text-slate-200 leading-snug">{cat.training_category}</p>
                      <p className="text-[11px] font-mono text-light-text dark:text-dark-muted mt-0.5">
                        Coverage: {formatPercent(cat.faculty_coverage)} · {(cat.department_score).toFixed(3)} raw
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-2.5 px-1">
              <BookOpen className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
              <div>
                <h3 className="text-base font-extrabold text-light-text dark:text-white">Matched Campus Training Programs</h3>
                <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
                  High-priority institutional catalog programs recommended for campus-wide faculty development webinars and workshops.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {campusResult.recommendations?.map((item, idx) => (
                <div
                  key={item.training_id}
                  className="relative p-5 rounded-2xl border border-light-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hover:border-sky-500/40 transition-all shadow-md flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
                        {item.training_id}
                      </span>
                      <span className="text-xs font-semibold text-brand-gold-dark dark:text-gold-300 bg-brand-gold/10 px-2.5 py-0.5 rounded border border-brand-gold/20">
                        {item.category}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold text-brand-gold-dark bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20">
                          ★ Top Campus Match
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-light-text dark:text-slate-100">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item.reason}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center min-w-[90px] shrink-0">
                    <DonutChart
                      probability={item.match_score}
                      color={item.match_score >= 0.7 ? '#10b981' : item.match_score >= 0.4 ? '#f59e0b' : '#64748b'}
                    />
                    <span className="text-[10px] text-light-text dark:text-dark-muted text-center mt-1">Match Score</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. Campus Departments Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-brand-gold" />
            <h2 className="text-lg font-bold text-light-text dark:text-white">Academic Departments ({campusStats?.departments?.length || 0})</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campusStats?.departments?.map((dept: any) => {
            const isSelected = selectedDeptFilter === dept.code;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptFilter(isSelected ? 'all' : dept.code)}
                className={`p-5 rounded-2xl border text-left transition-all shadow-sm group ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-950/30'
                    : 'border-light-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hover:border-sky-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    {dept.code}
                  </span>
                  <span className="text-xs font-semibold text-light-text dark:text-dark-muted">
                    {dept.faculty_count} Faculty
                  </span>
                </div>
                <h3 className="text-sm font-bold text-light-text dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {dept.name}
                </h3>
                <p className="text-[11px] text-light-text dark:text-dark-muted mt-2 flex items-center justify-between">
                  <span>Chair: {dept.dept_admin?.full_name || dept.dept_admin_name || 'Unassigned'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </button>
            );
          })}
        </div>
      </div>
""")
code_parts.append("""
      {/* 5. Campus Faculty Roster */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-light-text dark:text-white">Campus Faculty Roster</h2>
            </div>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
              {facultyUsers.length} total faculty members in {campusName} {selectedDeptFilter !== 'all' ? `(Filtered by ${selectedDeptFilter})` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-light-border dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-light-text dark:text-slate-200 outline-none"
            >
              <option value="all">All Departments</option>
              {campusStats?.departments?.map((d: any) => (
                <option key={d.code} value={d.code}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>

            <div className="w-full sm:w-64">
              <SearchInput
                placeholder="Search faculty by name, code..."
                onChange={(debounced) => setSearchQuery(debounced)}
              />
            </div>
          </div>
        </div>

        {loadingUsers ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filteredFaculty.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-light-border dark:border-slate-800 rounded-2xl text-xs text-light-text dark:text-dark-muted">
            No faculty found matching the search or department filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-light-text dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-light-text dark:text-dark-muted font-semibold border-b border-light-border dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Faculty Name & ID</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Rank & Field</th>
                  <th className="p-3.5">Needs Assessment</th>
                  <th className="p-3.5 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border/60 dark:divide-slate-800/60">
                {filteredFaculty.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="p-3.5">
                      <div className="font-bold text-light-text dark:text-white">{u.full_name || u.username}</div>
                      <div className="text-[11px] text-light-text dark:text-dark-muted font-mono">
                        @{u.username} {u.faculty_code ? `· [${u.faculty_code}]` : ''}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono font-bold border border-sky-500/20 text-[11px]">
                        {u.department_code || '—'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="text-light-text dark:text-slate-200">{u.academic_rank || 'Instructor I'}</div>
                      <div className="text-[11px] text-light-text dark:text-dark-muted">{u.specialization || u.highest_degree || 'General'}</div>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={u.status || 'not_started'} />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUserForTransfer(u)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 text-[11px] font-semibold transition-all"
                          title="Transfer Faculty to another Campus/Department"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Transfer</span>
                        </button>

                        <button
                          onClick={() => setSelectedUserForEdit(u)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-600/30 text-light-text dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-light-border dark:border-slate-700 transition-all"
                          title="View / Edit Profile"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedUserForEdit(u)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-600/30 text-light-text dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-light-border dark:border-slate-700 transition-all"
                          title="Emergency Password Reset"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedUserForDelete(u)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-600/30 text-light-text dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-light-border dark:border-slate-700 transition-all"
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

      {/* Modal: Add Department */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowAddDeptModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-light-text dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                <Building className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-base font-bold text-light-text dark:text-dark-text">Add Department to {campusCode}</h3>
                <p className="text-xs text-light-text dark:text-dark-muted">Create a new academic unit in {campusName}</p>
              </div>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Department Code (e.g. BSIT, BSED)</label>
                <input
                  type="text"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                  placeholder="BSIT"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs focus:ring-2 focus:ring-brand-gold/40 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Full Department Program Name</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Bachelor of Science in Information Technology"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs focus:ring-2 focus:ring-brand-gold/40 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDept}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-slate-950 text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {creatingDept ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Dept Admin */}
      {showAddDeptAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowAddDeptAdminModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-light-text dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-light-text dark:text-dark-text">Add Department Admin</h3>
                <p className="text-xs text-light-text dark:text-dark-muted">Provision a Department Chair account for {campusName}</p>
              </div>
            </div>

            <form onSubmit={handleCreateDeptAdmin} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Select Department in {campusCode}</label>
                <select
                  value={adminDeptId || ''}
                  onChange={(e) => setAdminDeptId(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none"
                >
                  <option value="">-- Choose Department --</option>
                  {campusStats?.departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Full Name</label>
                <input
                  type="text"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  placeholder="e.g. Dr. Maria Santos"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Username</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="dept_chair_username"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Email (Optional)</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="chair@qsu.edu.ph"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDeptAdminModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {creatingAdmin ? 'Creating...' : 'Register Dept Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Faculty Modal */}
      {selectedUserForTransfer && (
        <TransferFacultyModal
          user={selectedUserForTransfer}
          onClose={() => setSelectedUserForTransfer(null)}
          onTransferred={loadData}
        />
      )}

      {/* View / Edit Profile Modal */}
      {selectedUserForEdit && (
        <ViewEditUserModal
          user={selectedUserForEdit}
          currentUserRole="campus_admin"
          onClose={() => setSelectedUserForEdit(null)}
          onUpdated={loadData}
        />
      )}

      {/* Delete User Modal */}
      {selectedUserForDelete && (
        <DeleteUserModal
          user={selectedUserForDelete}
          onClose={() => setSelectedUserForDelete(null)}
          onDeleted={loadData}
        />
      )}
    </div>
  );
}
""")

path = Path("frontend/src/app/(campus-admin)/campus-dashboard/page.tsx")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text("".join(code_parts), encoding="utf-8")
print("Campus dashboard file created successfully!")
