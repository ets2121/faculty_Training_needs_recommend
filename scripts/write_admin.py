from pathlib import Path
parts = []
parts.append("""'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserListItem, AuditLogItem, CatalogItem } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import SearchInput from '@/components/SearchInput';
import { TableSkeleton } from '@/components/Skeletons';
import { ViewEditUserModal, DeleteUserModal } from '@/components/UserModals';
import TransferFacultyModal from '@/components/TransferFacultyModal';
import Pagination from '@/components/Pagination';
import { VisualBarChart, VisualDonutBreakdown } from '@/components/AdminVisualCharts';
import {
  ShieldAlert,
  Users,
  UserPlus,
  History,
  BookOpen,
  Cpu,
  PlusCircle,
  RefreshCw,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  MapPin,
  ArrowRightLeft,
  Building,
  BarChart3,
  Layers,
  Search,
} from 'lucide-react';

const TRAINING_CATEGORIES = [
  'Artificial Intelligence',
  'Machine Learning',
  'Data Analytics',
  'Educational Technology',
  'Research Methods',
  'Outcomes-Based Education',
  'Student Development & Welfare',
  'Instructional Design',
  'Leadership & Administration',
  'Language & Communication',
  'Guidance & Counseling',
  'Environmental Sustainability',
  'Computer Literacy & Digital Technologies',
];

const TARGET_COMPETENCIES = [
  'Research Competency',
  'Computer Literacy & Digital Technologies',
  'Outcomes-Based Education',
  'Student Development',
  'Instructional Design',
  'Leadership & Decision Making',
  'Community Extension',
  'Environmental Literacy',
];

const MODALITIES = ['Webinar', 'Face-to-Face', 'Blended Learning', 'Online Self-Paced', 'Workshop', 'Seminar', 'Conference'];
const DURATIONS = ['One day', 'Two days', 'Three days', 'One week', 'Half day', 'Two weeks', 'One month'];
const SCHEDULES = ['Saturdays', 'Sundays', 'Weekdays', 'Summer break', 'Christmas break', 'Semestral break', 'Flexible / On-demand'];

function emptyCatalogForm(): Partial<CatalogItem> {
  return {
    training_id: '',
    title: '',
    description: '',
    categories: [],
    target_competencies: [],
    modalities: [],
    durations: [],
    schedules: [],
    status: 'active',
  };
}
""")
parts.append("""
export default function SystemAdminDashboardPage() {
  const { user: currentAuthUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'catalog' | 'audit'>('users');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [showInactive, setShowInactive] = useState(false);

  // Search filter states
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(10);

  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  // Modals state
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserListItem | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserListItem | null>(null);
  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<UserListItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, aRes, cRes] = await Promise.all([
        api.get('/users'),
        api.get('/audit-logs?limit=100'),
        api.get(`/catalog?include_inactive=${showInactive}`),
      ]);
      setUsers(uRes.data.users || []);
      setAuditLogs(aRes.data.logs || []);
      setCatalogItems(cRes.data.items || []);
    } catch (err: any) {
      showToast('error', 'API Connection Error', err.response?.data?.detail || err.message || 'Could not load system data.');
    } finally {
      setLoading(false);
    }
  }, [showInactive, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Train ML Model
  const handleTrainModel = async () => {
    setTraining(true);
    showToast('info', 'ML Retraining Started', 'Re-executing QSU recommendation engine training pipeline...');
    try {
      const res = await api.post('/training/train', {}, {
        headers: { 'X-Admin-API-Key': 'change-this-in-production' },
      });
      showToast('success', 'ML Retraining Complete!', `Successfully updated model. New Accuracy: ${Math.round((res.data.accuracy || 0.85) * 100)}%`);
      await loadData();
    } catch (err: any) {
      showToast('error', 'Training Failed', err.response?.data?.detail || err.message || 'Failed to trigger model retraining.');
    } finally {
      setTraining(false);
    }
  };

  // Filtered Users & Pagination
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedCampusFilter !== 'all' && u.campus_code !== selectedCampusFilter) return false;
      if (selectedRoleFilter !== 'all' && u.role !== selectedRoleFilter) return false;
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase().trim();
      return (
        u.username.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q) ||
        (u.campus_code && u.campus_code.toLowerCase().includes(q)) ||
        (u.department_code && u.department_code.toLowerCase().includes(q))
      );
    });
  }, [users, selectedCampusFilter, selectedRoleFilter, userSearch]);

  const totalUserPages = Math.ceil(filteredUsers.length / userPageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  // Filtered Catalog & Pagination
  const filteredCatalogItems = useMemo(() => {
    if (!catalogSearch.trim()) return catalogItems;
    const q = catalogSearch.toLowerCase().trim();
    return catalogItems.filter(
      (c) =>
        c.training_id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        c.categories?.some((cat) => cat.toLowerCase().includes(q)) ||
        c.status.toLowerCase().includes(q)
    );
  }, [catalogItems, catalogSearch]);

  const totalCatalogPages = Math.ceil(filteredCatalogItems.length / catalogPageSize) || 1;
  const paginatedCatalog = useMemo(() => {
    const start = (catalogPage - 1) * catalogPageSize;
    return filteredCatalogItems.slice(start, start + catalogPageSize);
  }, [filteredCatalogItems, catalogPage, catalogPageSize]);

  // Filtered Audit Logs & Pagination
  const filteredAuditLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.toLowerCase().trim();
    return auditLogs.filter(
      (l) =>
        (l.username && l.username.toLowerCase().includes(q)) ||
        l.action.toLowerCase().includes(q) ||
        (l.entity_type && l.entity_type.toLowerCase().includes(q))
    );
  }, [auditLogs, auditSearch]);

  const totalAuditPages = Math.ceil(filteredAuditLogs.length / auditPageSize) || 1;
  const paginatedAuditLogs = useMemo(() => {
    const start = (auditPage - 1) * auditPageSize;
    return filteredAuditLogs.slice(start, start + auditPageSize);
  }, [filteredAuditLogs, auditPage, auditPageSize]);

  // Analytics Visual Data
  const roleBreakdown = useMemo(() => {
    const counts = { system_admin: 0, campus_admin: 0, department_admin: 0, faculty: 0 };
    users.forEach((u) => {
      const r = u.role as keyof typeof counts;
      if (r in counts) counts[r]++;
    });
    return [
      { label: 'System Admin', count: counts.system_admin, color: '#e11d48' },
      { label: 'Campus Admin', count: counts.campus_admin, color: '#0284c7' },
      { label: 'Dept Chair', count: counts.department_admin, color: '#f59e0b' },
      { label: 'Faculty Member', count: counts.faculty, color: '#10b981' },
    ];
  }, [users]);

  const campusDistribution = useMemo(() => {
    const map: Record<string, number> = { DIFFUN: 0, MADDELA: 0, CABARROGUIS: 0 };
    users.forEach((u) => {
      if (u.campus_code && u.campus_code in map) {
        map[u.campus_code]++;
      }
    });
    return [
      { label: 'Diffun (Main)', value: map.DIFFUN, color: '#0284c7' },
      { label: 'Maddela', value: map.MADDELA, color: '#10b981' },
      { label: 'Cabarroguis', value: map.CABARROGUIS, color: '#f59e0b' },
    ];
  }, [users]);
""")
parts.append("""
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>System Administration Console</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text dark:text-white tracking-tight">
            QSU Recommender Console
          </h1>
          <p className="text-xs text-light-text dark:text-dark-muted max-w-2xl leading-relaxed">
            Manage system users, provision Campus Administrators, maintain institutional training catalog items, and trigger ML model retraining.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/register-admin"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Campus Admin</span>
          </Link>

          <button
            onClick={handleTrainModel}
            disabled={training}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            {training ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Retraining Engine...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Retrain ML Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{users.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">System-wide users</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Training Catalog</span>
            <BookOpen className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{catalogItems.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Active programs</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>QSU Campuses</span>
            <MapPin className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">3</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Diffun, Maddela, Cabarroguis</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Audit Entries</span>
            <History className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{auditLogs.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Logged actions</p>
        </div>
      </div>

      {/* 3. Visual Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VisualDonutBreakdown
          title="System Role Distribution (RBAC)"
          total={users.length}
          items={roleBreakdown}
        />

        <VisualBarChart
          title="User Distribution Across Campuses"
          subtitle={`Total ${users.length} registered accounts across campuses`}
          data={campusDistribution}
        />
      </div>

      {/* 4. Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-light-border dark:border-slate-800 pb-2 overflow-x-auto">
        {(
          [
            { key: 'users', icon: <Users className="w-4 h-4" />, label: `Users & RBAC Management (${users.length})` },
            { key: 'catalog', icon: <BookOpen className="w-4 h-4" />, label: `Catalog & Retraining (${catalogItems.length})` },
            { key: 'audit', icon: <History className="w-4 h-4" />, label: `System Audit Logs (${auditLogs.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setUserPage(1);
              setCatalogPage(1);
              setAuditPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 text-light-text dark:text-dark-muted hover:text-light-text dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 5. Tab Contents */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <>
          {/* TAB 1: USERS & RBAC */}
          {activeTab === 'users' && (
            <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-light-text dark:text-white">System User Directory & RBAC</h2>
                  <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">Manage credentials, access rights, and transfers across all campuses.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Campus Filter Pills */}
                  <select
                    value={selectedCampusFilter}
                    onChange={(e) => {
                      setSelectedCampusFilter(e.target.value);
                      setUserPage(1);
                    }}
                    className="px-3 py-2 rounded-xl border border-light-border dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-light-text dark:text-slate-200 outline-none"
                  >
                    <option value="all">All Campuses</option>
                    <option value="DIFFUN">Diffun Campus</option>
                    <option value="MADDELA">Maddela Campus</option>
                    <option value="CABARROGUIS">Cabarroguis Campus</option>
                  </select>

                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => {
                      setSelectedRoleFilter(e.target.value);
                      setUserPage(1);
                    }}
                    className="px-3 py-2 rounded-xl border border-light-border dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-light-text dark:text-slate-200 outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="system_admin">System Admin</option>
                    <option value="campus_admin">Campus Admin</option>
                    <option value="department_admin">Department Admin</option>
                    <option value="faculty">Faculty</option>
                  </select>

                  <div className="w-full sm:w-64">
                    <SearchInput
                      placeholder="Search users..."
                      onChange={(val) => {
                        setUserSearch(val);
                        setUserPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-light-border dark:border-slate-800 rounded-2xl text-xs text-light-text dark:text-dark-muted">
                  No users found matching search criteria.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-light-text dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-950/80 text-light-text dark:text-dark-muted font-semibold border-b border-light-border dark:border-slate-800 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5 rounded-l-xl">ID</th>
                          <th className="p-3.5">User Details</th>
                          <th className="p-3.5">Role</th>
                          <th className="p-3.5">Campus & Dept</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right rounded-r-xl">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-border/60 dark:divide-slate-800/60">
                        {paginatedUsers.map((u) => {
                          const isSelf = currentAuthUser?.id === u.id;
                          return (
                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                              <td className="p-3.5 font-mono text-light-text dark:text-dark-muted">#{u.id}</td>
                              <td className="p-3.5">
                                <div className="font-bold text-light-text dark:text-white flex items-center gap-1.5">
                                  <span>{u.full_name || u.username}</span>
                                  {isSelf && (
                                    <span className="text-[9px] font-mono bg-rose-500/15 text-rose-600 dark:text-rose-400 px-1.5 py-0.2 rounded font-bold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-light-text dark:text-dark-muted font-mono">
                                  @{u.username} · {u.email || 'No email'}
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  u.role === 'system_admin' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                                  u.role === 'campus_admin' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                                  u.role === 'department_admin' ? 'bg-brand-gold/10 text-brand-gold-dark border-brand-gold/20' :
                                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <div className="flex flex-col gap-0.5">
                                  {u.campus_code && (
                                    <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">
                                      {u.campus_code}
                                    </span>
                                  )}
                                  {u.department_code ? (
                                    <span className="text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-light-border dark:border-slate-700 w-fit">
                                      {u.department_code}
                                    </span>
                                  ) : (
                                    <span className="text-light-text dark:text-dark-muted font-mono text-[11px]">
                                      {u.role === 'system_admin' ? 'System-wide' : u.role === 'campus_admin' ? 'Campus Admin' : '—'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3.5">
                                <StatusBadge status={u.status || 'active'} />
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {u.role === 'faculty' && (
                                    <button
                                      onClick={() => setSelectedUserForTransfer(u)}
                                      title="Transfer Faculty to Campus/Department"
                                      className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 transition-all"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setSelectedUserForEdit(u)}
                                    title="Edit User"
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-600/30 text-light-text dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-light-border dark:border-slate-700 transition-all"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedUserForDelete(u)}
                                    disabled={isSelf}
                                    title="Delete User"
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-600/30 text-light-text dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-light-border dark:border-slate-700 transition-all disabled:opacity-30"
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

                  <Pagination
                    currentPage={userPage}
                    totalPages={totalUserPages}
                    totalItems={filteredUsers.length}
                    pageSize={userPageSize}
                    onPageChange={(p) => setUserPage(p)}
                    onPageSizeChange={(s) => setUserPageSize(s)}
                  />
                </>
              )}
            </div>
          )}

          {/* TAB 2: CATALOG & RETRAINING */}
          {activeTab === 'catalog' && (
            <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-light-text dark:text-white">Training Catalog & Retraining Module</h2>
                  <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">Manage training programs matched by the AI recommender engine.</p>
                </div>

                <div className="w-full sm:w-64">
                  <SearchInput
                    placeholder="Search catalog programs..."
                    onChange={(val) => {
                      setCatalogSearch(val);
                      setCatalogPage(1);
                    }}
                  />
                </div>
              </div>

              {filteredCatalogItems.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-light-border dark:border-slate-800 rounded-2xl text-xs text-light-text dark:text-dark-muted">
                  No catalog items found matching search query.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paginatedCatalog.map((item) => (
                      <div
                        key={item.training_id}
                        className="p-5 rounded-2xl border border-light-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
                            {item.training_id}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {item.status}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-light-text dark:text-white">{item.title}</h4>
                        {item.description && (
                          <p className="text-xs text-light-text dark:text-dark-muted line-clamp-2 leading-relaxed">{item.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.categories?.map((cat) => (
                            <span key={cat} className="text-[10px] font-mono bg-brand-gold/10 text-brand-gold-dark dark:text-gold-300 px-2 py-0.5 rounded border border-brand-gold/20">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Pagination
                    currentPage={catalogPage}
                    totalPages={totalCatalogPages}
                    totalItems={filteredCatalogItems.length}
                    pageSize={catalogPageSize}
                    onPageChange={(p) => setCatalogPage(p)}
                    onPageSizeChange={(s) => setCatalogPageSize(s)}
                  />
                </>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-light-text dark:text-white">System Security Audit Trail</h2>
                  <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">Immutable record of system configuration and user actions.</p>
                </div>

                <div className="w-full sm:w-64">
                  <SearchInput
                    placeholder="Search logs by user, action..."
                    onChange={(val) => {
                      setAuditSearch(val);
                      setAuditPage(1);
                    }}
                  />
                </div>
              </div>

              {filteredAuditLogs.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-light-border dark:border-slate-800 rounded-2xl text-xs text-light-text dark:text-dark-muted">
                  No audit logs found matching search query.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-light-text dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-950/80 text-light-text dark:text-dark-muted font-semibold border-b border-light-border dark:border-slate-800 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5 rounded-l-xl">Timestamp</th>
                          <th className="p-3.5">User</th>
                          <th className="p-3.5">Action</th>
                          <th className="p-3.5">Target Entity</th>
                          <th className="p-3.5 rounded-r-xl">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-border/60 dark:divide-slate-800/60 font-mono text-[11px]">
                        {paginatedAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5 text-light-text dark:text-dark-muted">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="p-3.5 font-bold text-light-text dark:text-white">{log.username || 'System'}</td>
                            <td className="p-3.5 font-bold text-sky-600 dark:text-sky-400">{log.action}</td>
                            <td className="p-3.5 text-light-text dark:text-slate-300">{log.entity_type ? `${log.entity_type} #${log.entity_id || ''}` : '—'}</td>
                            <td className="p-3.5 text-light-text dark:text-dark-muted">{log.ip_address || '127.0.0.1'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={auditPage}
                    totalPages={totalAuditPages}
                    totalItems={filteredAuditLogs.length}
                    pageSize={auditPageSize}
                    onPageChange={(p) => setAuditPage(p)}
                    onPageSizeChange={(s) => setAuditPageSize(s)}
                  />
                </>
              )}
            </div>
          )}
        </>
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
          currentUserRole="system_admin"
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

Path("frontend/src/app/(sys-admin)/admin-dashboard/page.tsx").write_text("".join(parts), encoding="utf-8")
print("Admin dashboard page written successfully via chunk script.")
