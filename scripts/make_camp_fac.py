from pathlib import Path
parts = []
parts.append("""'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  MapPin,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Search,
  Building,
} from 'lucide-react';

export default function CampusFacultyPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [campusStats, setCampusStats] = useState<any>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserListItem | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserListItem | null>(null);
  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<UserListItem | null>(null);

  const campusId = authUser?.campus?.id || 1;
  const campusName = authUser?.campus?.name || 'Diffun Campus (Main)';

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
      showToast('error', 'API Error', err.response?.data?.detail || err.message || 'Failed to fetch campus faculty data.');
    } finally {
      setLoadingUsers(false);
    }
  }, [campusId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const facultyUsers = useMemo(() => users.filter((u) => u.role === 'faculty'), [users]);

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

  const totalFacultyPages = Math.ceil(filteredFaculty.length / pageSize) || 1;
  const paginatedFaculty = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFaculty.slice(start, start + pageSize);
  }, [filteredFaculty, currentPage, pageSize]);

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
""")
parts.append("""
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
          <span>{campusName} Faculty Directory</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text dark:text-white tracking-tight">
          Campus Faculty Roster & Reassignment
        </h1>
        <p className="text-xs text-light-text dark:text-dark-muted max-w-2xl leading-relaxed">
          Supervise instructor accounts assigned to {campusName}, track needs assessment progress, and transfer faculty between academic departments.
        </p>
      </div>

      {/* 2. Visual Assessment Readiness */}
      <VisualDonutBreakdown
        title="Campus Assessment Completion Breakdown"
        total={facultyUsers.length}
        items={statusBreakdown}
      />

      {/* 3. Faculty Table & Controls */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-light-text dark:text-white">Registered Instructors</h2>
            </div>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
              Showing {filteredFaculty.length} of {facultyUsers.length} total faculty members.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedDeptFilter}
              onChange={(e) => {
                setSelectedDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
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
                placeholder="Search faculty..."
                onChange={(debounced) => {
                  setSearchQuery(debounced);
                  setCurrentPage(1);
                }}
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
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-light-text dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-light-text dark:text-dark-muted font-semibold border-b border-light-border dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Faculty Name & ID</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Rank & Specialization</th>
                    <th className="p-3.5">Assessment Status</th>
                    <th className="p-3.5 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border/60 dark:divide-slate-800/60">
                  {paginatedFaculty.map((u) => (
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

            <Pagination
              currentPage={currentPage}
              totalPages={totalFacultyPages}
              totalItems={filteredFaculty.length}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => setPageSize(s)}
            />
          </>
        )}
      </div>

      {/* Modals */}
      {selectedUserForTransfer && (
        <TransferFacultyModal
          user={selectedUserForTransfer}
          onClose={() => setSelectedUserForTransfer(null)}
          onTransferred={loadData}
        />
      )}

      {selectedUserForEdit && (
        <ViewEditUserModal
          user={selectedUserForEdit}
          currentUserRole="campus_admin"
          onClose={() => setSelectedUserForEdit(null)}
          onUpdated={loadData}
        />
      )}

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

path = Path("frontend/src/app/(campus-admin)/campus-faculty/page.tsx")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text("".join(parts), encoding="utf-8")
print("Campus faculty page created successfully.")
