from pathlib import Path
parts = []
parts.append("""'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserListItem } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import SearchInput from '@/components/SearchInput';
import { TableSkeleton } from '@/components/Skeletons';
import { ViewEditUserModal, DeleteUserModal } from '@/components/UserModals';
import TransferFacultyModal from '@/components/TransferFacultyModal';
import Pagination from '@/components/Pagination';
import { VisualDonutBreakdown } from '@/components/AdminVisualCharts';
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  MapPin,
  ArrowRightLeft,
  Shield,
  Search,
  Filter,
} from 'lucide-react';

export default function UserManagementPage() {
  const { user: currentAuthUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [userSearch, setUserSearch] = useState('');
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Pagination state
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  // Modals state
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserListItem | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserListItem | null>(null);
  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<UserListItem | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err: any) {
      showToast('error', 'API Error', err.response?.data?.detail || err.message || 'Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
""")
parts.append("""
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            <span>Dedicated Security Module</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text dark:text-white tracking-tight">
            Users & RBAC Management
          </h1>
          <p className="text-xs text-light-text dark:text-dark-muted max-w-2xl leading-relaxed">
            Manage user identity, provision Campus and Department Administrators, assign access roles, and reassign faculty across QSU campuses.
          </p>
        </div>

        <Link
          href="/register-admin"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-950/40 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Administrator</span>
        </Link>
      </div>

      {/* 2. Visual Role Breakdown */}
      <VisualDonutBreakdown
        title="System Role Distribution (RBAC Architecture)"
        total={users.length}
        items={roleBreakdown}
      />

      {/* 3. User Table & Filters */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-light-text dark:text-white">System User Directory</h2>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
              Showing {filteredUsers.length} of {users.length} registered accounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : filteredUsers.length === 0 ? (
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

      {/* Transfer Faculty Modal */}
      {selectedUserForTransfer && (
        <TransferFacultyModal
          user={selectedUserForTransfer}
          onClose={() => setSelectedUserForTransfer(null)}
          onTransferred={loadUsers}
        />
      )}

      {/* View / Edit Profile Modal */}
      {selectedUserForEdit && (
        <ViewEditUserModal
          user={selectedUserForEdit}
          currentUserRole="system_admin"
          onClose={() => setSelectedUserForEdit(null)}
          onUpdated={loadUsers}
        />
      )}

      {/* Delete User Modal */}
      {selectedUserForDelete && (
        <DeleteUserModal
          user={selectedUserForDelete}
          onClose={() => setSelectedUserForDelete(null)}
          onDeleted={loadUsers}
        />
      )}
    </div>
  );
}
""")

path = Path("frontend/src/app/(sys-admin)/user-management/page.tsx")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text("".join(parts), encoding="utf-8")
print("User management module created successfully.")
