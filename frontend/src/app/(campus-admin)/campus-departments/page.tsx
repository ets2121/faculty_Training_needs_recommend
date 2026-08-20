'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, Plus, Search, Users, Pencil, Trash2, X, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Pagination from '@/components/Pagination';

interface Department {
  id: number;
  code: string;
  name: string;
  campus?: string;
  faculty_count?: number;
  dept_admin_name?: string | null;
  dept_admin?: { full_name?: string; username?: string } | null;
}

interface ConfirmDeleteModalProps {
  dept: Department;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function ConfirmDeleteModal({ dept, onClose, onConfirm, loading }: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-light-text dark:text-dark-text">Delete Department</h3>
            <p className="text-xs text-light-text dark:text-dark-muted">This action will deactivate the unit</p>
          </div>
        </div>
        <p className="text-sm text-light-text dark:text-dark-muted">
          Delete <strong className="text-light-text dark:text-dark-text">{dept.name} ({dept.code})</strong>?
          {(dept.faculty_count ?? 0) > 0 && (
            <span className="block mt-1 text-rose-500 font-semibold">
              Warning: {dept.faculty_count} faculty member(s) in this department.
            </span>
          )}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-sm font-semibold">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold disabled:opacity-50 transition-all shadow-md"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeptFormModalProps {
  campusId: number;
  campusCode: string;
  campusName: string;
  dept?: Department | null;
  onClose: () => void;
  onSaved: () => void;
}

function DeptFormModal({ campusId, campusCode, campusName, dept, onClose, onSaved }: DeptFormModalProps) {
  const isEdit = !!dept;
  const [code, setCode] = useState(dept?.code ?? '');
  const [name, setName] = useState(dept?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await api.put(`/campuses/${campusId}/departments/${dept!.id}`, { code: code.toUpperCase(), name });
      } else {
        await api.post(`/campuses/${campusId}/departments`, { code: code.toUpperCase(), name });
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to save department.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-xl text-light-text dark:text-dark-muted hover:text-rose-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h3 className="text-base font-bold text-light-text dark:text-dark-text">
              {isEdit ? 'Edit Department' : `Add Department - ${campusName}`}
            </h3>
            <p className="text-xs text-light-text dark:text-dark-muted">
              {isEdit ? `Editing ${dept!.code}` : `New academic unit for ${campusCode}`}
            </p>
          </div>
        </div>
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-light-text dark:text-dark-text">Department Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. BSIT, BSED"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-sm focus:ring-2 focus:ring-brand-gold/40 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-light-text dark:text-dark-text">Full Department Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bachelor of Science in Information Technology"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-sm focus:ring-2 focus:ring-brand-gold/40 outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-slate-950 text-sm font-bold disabled:opacity-50 shadow-md transition-all">
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CampusDepartmentsPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const campusId = authUser?.campus?.id || 1;
  const campusCode = authUser?.campus?.code || 'DIFFUN';
  const campusName = authUser?.campus?.name || 'Diffun Campus (Main)';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/campuses/${campusId}`);
      setDepartments(res.data?.departments || []);
    } catch (err: any) {
      showToast('error', 'API Error', err.response?.data?.detail || err.message || 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }, [campusId, showToast]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleDelete = async () => {
    if (!deletingDept) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/campuses/${campusId}/departments/${deletingDept.id}`);
      showToast('success', 'Department Deactivated', `Department "${deletingDept.code}" was deactivated successfully.`);
      setDeletingDept(null);
      loadDepartments();
    } catch (err: any) {
      showToast('error', 'Action Failed', err.response?.data?.detail || 'Failed to delete department.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return departments.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [departments, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalFaculty = useMemo(() => {
    return departments.reduce((s, d) => s + (d.faculty_count ?? 0), 0);
  }, [departments]);

  return (
    <div className="space-y-6 pb-10 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-brand-gold" />
            <h1 className="text-2xl font-extrabold text-light-text dark:text-white">Academic Departments</h1>
          </div>
          <p className="text-sm text-light-text dark:text-dark-muted">{campusName} - Manage academic units and programs</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-gold hover:bg-brand-gold-dark text-slate-950 text-sm font-bold shadow-lg shadow-brand-gold/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Departments', value: departments.length, color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/20' },
          { label: 'Total Faculty', value: totalFaculty, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Active Campus', value: campusCode, color: 'text-brand-gold', bg: 'bg-brand-gold/10 border-brand-gold/20' },
        ].map((c) => (
          <div key={c.label} className={`p-5 rounded-2xl border ${c.bg} bg-white/60 dark:bg-dark-card/60 shadow-sm`}>
            <p className="text-xs font-semibold text-light-text dark:text-dark-muted mb-1">{c.label}</p>
            <p className={`text-2xl font-extrabold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-light-text dark:text-dark-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search departments by name or code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-sm outline-none focus:ring-2 focus:ring-brand-gold/40"
          />
        </div>
        <button
          onClick={loadDepartments}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-sm font-semibold text-light-text dark:text-dark-muted hover:border-brand-gold hover:text-brand-gold transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-dark-card/70 border border-light-border dark:border-dark-border rounded-3xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-light-text dark:text-dark-muted text-sm">
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Loading departments...
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="w-12 h-12 text-light-text dark:text-dark-muted mb-3 opacity-40" />
            <p className="text-sm font-semibold text-light-text dark:text-dark-muted">No departments found</p>
            <p className="text-xs text-light-text dark:text-dark-muted mt-1">
              {search ? 'Try a different search.' : 'Click "Add Department" to create the first one.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border bg-slate-50/80 dark:bg-slate-900/60">
                  {['Code', 'Department Name', 'Faculty Count', 'Department Chair', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-light-text dark:text-dark-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {paginated.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">{dept.code}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-light-text dark:text-dark-text">{dept.name}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-light-text dark:text-dark-muted" />
                        <span className="font-bold text-light-text dark:text-dark-text">{dept.faculty_count ?? 0}</span>
                        <span className="text-xs text-light-text dark:text-dark-muted">faculty</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-light-text dark:text-dark-muted">
                      {dept.dept_admin?.full_name ?? dept.dept_admin_name ?? 'Unassigned'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingDept(dept)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-600/20 text-light-text dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-light-border dark:border-slate-700 transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingDept(dept)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-600/20 text-light-text dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-light-border dark:border-slate-700 transition-all"
                          title="Delete"
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

      {/* Modals */}
      {showAddModal && (
        <DeptFormModal
          campusId={campusId}
          campusCode={campusCode}
          campusName={campusName}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            showToast('success', 'Department Created', 'New department was added successfully.');
            loadDepartments();
          }}
        />
      )}
      {editingDept && (
        <DeptFormModal
          campusId={campusId}
          campusCode={campusCode}
          campusName={campusName}
          dept={editingDept}
          onClose={() => setEditingDept(null)}
          onSaved={() => {
            setEditingDept(null);
            showToast('success', 'Department Updated', 'Department information updated successfully.');
            loadDepartments();
          }}
        />
      )}
      {deletingDept && (
        <ConfirmDeleteModal
          dept={deletingDept}
          onClose={() => setDeletingDept(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
