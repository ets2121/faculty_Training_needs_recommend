'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserListItem } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import SearchInput from '@/components/SearchInput';
import { TableSkeleton } from '@/components/Skeletons';
import { ViewEditUserModal, DeleteUserModal } from '@/components/UserModals';
import Pagination from '@/components/Pagination';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Building,
  MapPin,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';

export default function CampusAdminsPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<UserListItem | null>(null);
  const [selectedAdminForDelete, setSelectedAdminForDelete] = useState<UserListItem | null>(null);

  const campusId = authUser?.campus?.id || 1;
  const campusName = authUser?.campus?.name || 'Diffun Campus (Main)';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/users'),
        api.get(`/campuses/${campusId}/departments`).catch(() => ({ data: { departments: [] } })),
      ]);
      setUsers(usersRes.data.users || []);
      setDepartments(deptsRes.data.departments || []);
    } catch (err: any) {
      showToast('error', 'API Error', err.response?.data?.detail || err.message || 'Failed to fetch department administrators.');
    } finally {
      setLoading(false);
    }
  }, [campusId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter only department_admin users for this campus
  const deptAdmins = useMemo(() => {
    return users.filter((u) => u.role === 'department_admin');
  }, [users]);

  // Apply search and filter
  const filteredAdmins = useMemo(() => {
    return deptAdmins.filter((u) => {
      // Department filter
      if (selectedDeptFilter !== 'all' && u.department_code !== selectedDeptFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'all') {
        const accStatus = (u.account_status || u.user_status || 'active').toLowerCase();
        if (accStatus !== selectedStatusFilter.toLowerCase()) {
          return false;
        }
      }
      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        u.username.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.department_code && u.department_code.toLowerCase().includes(q)) ||
        (u.department_name && u.department_name.toLowerCase().includes(q))
      );
    });
  }, [deptAdmins, selectedDeptFilter, selectedStatusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAdmins.length / pageSize) || 1;
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAdmins.slice(start, start + pageSize);
  }, [filteredAdmins, currentPage, pageSize]);

  // Statistics
  const activeCount = useMemo(() => {
    return deptAdmins.filter((u) => (u.account_status || u.user_status) !== 'inactive').length;
  }, [deptAdmins]);

  const coveredDeptCodes = useMemo(() => {
    const set = new Set<string>();
    deptAdmins.forEach((u) => {
      if (u.department_code) set.add(u.department_code);
    });
    return set;
  }, [deptAdmins]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* ── 1. Header Banner ────────────────────────────────────────────── */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-green/10 text-brand-green border border-brand-green/20">
            <MapPin className="w-3.5 h-3.5 text-brand-green" />
            <span>{campusName}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text dark:text-white tracking-tight">
            Department Administrators Management
          </h1>
          <p className="text-xs text-light-text dark:text-dark-muted max-w-2xl leading-relaxed">
            Supervise, register, edit, and manage department chairperson and administrator accounts assigned to academic units in {campusName}.
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href="/register-admin"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 text-brand-gold" />
            <span>Add Dept Admin</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Summary Metrics ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-light-text dark:text-dark-muted">Total Dept Admins</p>
            <p className="text-3xl font-extrabold text-brand-green mt-1">
              {loading ? '...' : deptAdmins.length}
            </p>
            <p className="text-[11px] text-light-text/60 dark:text-dark-muted mt-0.5">Assigned to this campus</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-light-text dark:text-dark-muted">Active Accounts</p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {loading ? '...' : activeCount}
            </p>
            <p className="text-[11px] text-light-text/60 dark:text-dark-muted mt-0.5">
              {deptAdmins.length - activeCount} inactive account(s)
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-light-text dark:text-dark-muted">Departments Covered</p>
            <p className="text-3xl font-extrabold text-brand-gold mt-1">
              {loading ? '...' : `${coveredDeptCodes.size} / ${departments.length || '—'}`}
            </p>
            <p className="text-[11px] text-light-text/60 dark:text-dark-muted mt-0.5">Academic units with leadership</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold">
            <Building className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── 3. Table & Management Section ──────────────────────────────── */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
        {/* Controls Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-green" />
              <h2 className="text-lg font-bold text-light-text dark:text-white">Department Administrator Accounts</h2>
            </div>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
              Showing {filteredAdmins.length} of {deptAdmins.length} registered department admins.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="w-full sm:w-64">
              <SearchInput
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val);
                  setCurrentPage(1);
                }}
                placeholder="Search admin, username, email..."
              />
            </div>

            <select
              value={selectedDeptFilter}
              onChange={(e) => {
                setSelectedDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3 py-2 text-xs text-light-text dark:text-dark-text outline-none focus:border-brand-green"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.code}>
                  {dept.code} - {dept.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3 py-2 text-xs text-light-text dark:text-dark-text outline-none focus:border-brand-green"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : filteredAdmins.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3 bg-light-muted-surface/40 dark:bg-dark-card rounded-2xl border border-dashed border-light-border dark:border-dark-border">
            <ShieldCheck className="w-10 h-10 text-light-text/30 dark:text-dark-muted mx-auto" />
            <p className="text-sm font-semibold text-light-text dark:text-white">No Department Administrators Found</p>
            <p className="text-xs text-light-text dark:text-dark-muted max-w-sm mx-auto">
              {searchQuery || selectedDeptFilter !== 'all' || selectedStatusFilter !== 'all'
                ? 'No admin accounts match your active search or department filter.'
                : 'No department administrator accounts have been registered for this campus yet.'}
            </p>
            <div className="pt-2">
              <Link
                href="/register-admin"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-md transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register New Admin</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-light-border dark:border-slate-800 text-light-text dark:text-dark-muted font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Administrator</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Contact Email</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Registered</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border/60 dark:divide-slate-800/60">
                {paginatedAdmins.map((admin) => {
                  const isActive = (admin.account_status || admin.user_status) !== 'inactive';
                  const isCurrentAuthUser = admin.id === authUser?.id;

                  return (
                    <tr
                      key={admin.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Administrator Info */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center font-bold text-brand-green shrink-0">
                            {admin.full_name ? admin.full_name.charAt(0).toUpperCase() : admin.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-light-text dark:text-white">
                              {admin.full_name || admin.username}
                              {isCurrentAuthUser && (
                                <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-green/10 text-brand-green border border-brand-green/20">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] font-mono text-light-text/70 dark:text-dark-muted">
                              @{admin.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            {admin.department_code || 'UNASSIGNED'}
                          </span>
                          <p className="text-[11px] text-light-text/70 dark:text-dark-muted truncate max-w-[200px]" title={admin.department_name || ''}>
                            {admin.department_name || 'No department assigned'}
                          </p>
                        </div>
                      </td>

                      {/* Contact Email */}
                      <td className="p-3.5">
                        <span className="text-light-text dark:text-dark-muted font-mono text-[11px]">
                          {admin.email || '—'}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="p-3.5 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="p-3.5">
                        <div className="text-[11px] text-light-text/70 dark:text-dark-muted">
                          {admin.created_at ? new Date(admin.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAdminForEdit(admin)}
                            className="p-1.5 rounded-lg border border-light-border dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-green hover:text-brand-green text-light-text dark:text-dark-text transition-all"
                            title="Edit Admin Details & Password"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedAdminForDelete(admin)}
                            disabled={isCurrentAuthUser}
                            className="p-1.5 rounded-lg border border-light-border dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-rose-500 hover:text-rose-500 text-light-text dark:text-dark-text transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isCurrentAuthUser ? 'Cannot delete your own account' : 'Delete Administrator Account'}
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

        {/* Pagination */}
        {filteredAdmins.length > pageSize && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAdmins.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {/* ── 4. Modals ─────────────────────────────────────────────────── */}
      {selectedAdminForEdit && (
        <ViewEditUserModal
          user={selectedAdminForEdit}
          currentUserRole="campus_admin"
          onClose={() => setSelectedAdminForEdit(null)}
          onUpdated={loadData}
        />
      )}

      {selectedAdminForDelete && (
        <DeleteUserModal
          user={selectedAdminForDelete}
          onClose={() => setSelectedAdminForDelete(null)}
          onDeleted={loadData}
        />
      )}
    </div>
  );
}
