from pathlib import Path
parts = []
parts.append("""'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { CatalogItem } from '@/types';
import { useToast } from '@/context/ToastContext';
import SearchInput from '@/components/SearchInput';
import { CardGridSkeleton } from '@/components/Skeletons';
import Pagination from '@/components/Pagination';
import {
  BookOpen,
  PlusCircle,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Tag,
  Clock,
  Layers,
} from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Artificial Intelligence',
  'Machine Learning',
  'Data Analytics',
  'Educational Technology',
  'Research Methods',
  'Outcomes-Based Education',
  'Student Development & Welfare',
  'Instructional Design',
  'Leadership & Administration',
];

export default function CatalogManagementPage() {
  const { showToast } = useToast();

  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(true);

  // Filter & Search state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All Categories');

  // Pagination state
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(10);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Artificial Intelligence');
  const [formStatus, setFormStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal target
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/catalog?include_inactive=${showInactive}`);
      setCatalogItems(res.data.items || []);
    } catch (err: any) {
      showToast('error', 'API Error', err.response?.data?.detail || err.message || 'Failed to fetch catalog.');
    } finally {
      setLoading(false);
    }
  }, [showInactive, showToast]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormId('');
    setFormTitle('');
    setFormDesc('');
    setFormCategory('Artificial Intelligence');
    setFormStatus('active');
    setShowModal(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setModalMode('edit');
    setEditingId(item.training_id);
    setFormId(item.training_id);
    setFormTitle(item.title);
    setFormDesc(item.description || '');
    setFormCategory(item.categories?.[0] || 'Artificial Intelligence');
    setFormStatus(item.status || 'active');
    setShowModal(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('error', 'Validation Error', 'Program Title is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const payload = {
          training_id: formId.trim() || undefined,
          title: formTitle.trim(),
          description: formDesc.trim() || undefined,
          categories: [formCategory],
          target_competencies: ['Computer Literacy & Digital Technologies'],
          modalities: ['Webinar'],
          durations: ['Two days'],
          schedules: ['Saturdays'],
          status: formStatus,
        };
        await api.post('/catalog', payload);
        showToast('success', 'Program Created', `Training program '${formTitle}' added to institutional catalog.`);
      } else {
        const payload = {
          title: formTitle.trim(),
          description: formDesc.trim() || undefined,
          categories: [formCategory],
          status: formStatus,
        };
        await api.put(`/catalog/${editingId}`, payload);
        showToast('success', 'Program Updated', `Training program '${formTitle}' was updated successfully.`);
      }

      setShowModal(false);
      await loadCatalog();
    } catch (err: any) {
      showToast('error', 'Action Error', err.response?.data?.detail || err.message || 'Failed to save catalog program.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: CatalogItem) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/catalog/${item.training_id}/status`, { status: newStatus });
      showToast('success', `Status Changed to ${newStatus.toUpperCase()}`, `'${item.title}' is now ${newStatus}.`);
      await loadCatalog();
    } catch (err: any) {
      showToast('error', 'Status Error', err.response?.data?.detail || err.message || 'Failed to toggle status.');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/catalog/${deleteTarget.id}`);
      showToast('success', 'Program Deleted', `'${deleteTarget.title}' was permanently removed from catalog.`);
      setDeleteTarget(null);
      await loadCatalog();
    } catch (err: any) {
      showToast('error', 'Delete Error', err.response?.data?.detail || err.message || 'Failed to delete program.');
    }
  };

  const filteredCatalog = useMemo(() => {
    return catalogItems.filter((c) => {
      if (selectedCategoryFilter !== 'All Categories' && !c.categories?.includes(selectedCategoryFilter)) {
        return false;
      }
      if (!catalogSearch.trim()) return true;
      const q = catalogSearch.toLowerCase().trim();
      return (
        c.training_id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        c.categories?.some((cat) => cat.toLowerCase().includes(q))
      );
    });
  }, [catalogItems, selectedCategoryFilter, catalogSearch]);

  const totalPages = Math.ceil(filteredCatalog.length / catalogPageSize) || 1;
  const paginatedCatalog = useMemo(() => {
    const start = (catalogPage - 1) * catalogPageSize;
    return filteredCatalog.slice(start, start + catalogPageSize);
  }, [filteredCatalog, catalogPage, catalogPageSize]);

  const activeCount = useMemo(() => catalogItems.filter((c) => c.status === 'active').length, [catalogItems]);
""")
parts.append("""
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Institutional Catalog CRUD Module</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text dark:text-white tracking-tight">
            Training Catalog Management
          </h1>
          <p className="text-xs text-light-text dark:text-dark-muted max-w-2xl leading-relaxed">
            Create, update, and manage institutional training catalog offerings matched to faculty competency gaps by the AI engine.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-slate-950 font-bold text-xs shadow-lg transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Training Program</span>
        </button>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Total Catalog Offerings</span>
            <BookOpen className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{catalogItems.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Available programs in system</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Active Programs</span>
            <Tag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Matched in active AI recommendations</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Inactive / Hidden</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{catalogItems.length - activeCount}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Hidden from recommender matching</p>
        </div>
      </div>

      {/* 3. Catalog Grid View & Controls */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-light-text dark:text-white">Program Offerings Directory</h2>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
              Showing {filteredCatalog.length} of {catalogItems.length} programs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setCatalogPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-light-border dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-light-text dark:text-slate-200 outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="w-full sm:w-64">
              <SearchInput
                placeholder="Search programs..."
                onChange={(val) => {
                  setCatalogSearch(val);
                  setCatalogPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <CardGridSkeleton count={4} />
        ) : filteredCatalog.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-light-border dark:border-slate-800 rounded-2xl text-xs text-light-text dark:text-dark-muted">
            No catalog items found matching search filters.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedCatalog.map((item) => (
                <div
                  key={item.training_id}
                  className="p-5 rounded-2xl border border-light-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
                        {item.training_id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        item.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        title={item.status === 'active' ? 'Deactivate Program' : 'Activate Program'}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-light-text dark:text-slate-300 hover:text-sky-600 transition-all border border-light-border dark:border-slate-700"
                      >
                        {item.status === 'active' ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => openEditModal(item)}
                        title="Edit Program Details"
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-600/30 text-light-text dark:text-slate-300 hover:text-emerald-600 transition-all border border-light-border dark:border-slate-700"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget({ id: item.training_id, title: item.title })}
                        title="Delete Program"
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-600/30 text-light-text dark:text-slate-300 hover:text-rose-600 transition-all border border-light-border dark:border-slate-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-light-text dark:text-white leading-snug">{item.title}</h4>
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
              totalPages={totalPages}
              totalItems={filteredCatalog.length}
              pageSize={catalogPageSize}
              onPageChange={(p) => setCatalogPage(p)}
              onPageSizeChange={(s) => setCatalogPageSize(s)}
            />
          </>
        )}
      </div>

      {/* Modal: Create / Edit Program */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-light-text dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-base font-bold text-light-text dark:text-dark-text">
                  {modalMode === 'create' ? 'Add New Training Program' : `Edit Program (${editingId})`}
                </h3>
                <p className="text-xs text-light-text dark:text-dark-muted">Save program to institutional catalog</p>
              </div>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {modalMode === 'create' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-light-text dark:text-dark-text">Training ID (Optional, e.g. TRN-099)</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.toUpperCase())}
                    placeholder="Auto-generated if left blank"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text font-mono text-xs outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Program Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Advanced AI Integration in Classroom Teaching"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Target Training Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none"
                >
                  {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Program Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Comprehensive workshop covering prompt engineering, generative AI tools, and ethics..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none"
                >
                  <option value="active">Active (Visible to Recommender)</option>
                  <option value="inactive">Inactive (Hidden from Recommender)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-slate-950 text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Program' : 'Update Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-dark-card border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-light-text dark:text-dark-text">Delete Program</h3>
              <p className="text-xs text-light-text dark:text-dark-muted mt-1">
                Permanently delete <strong className="text-light-text dark:text-white">{deleteTarget.title}</strong> ({deleteTarget.id})? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
""")

path = Path("frontend/src/app/(sys-admin)/catalog-management/page.tsx")
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text("".join(parts), encoding="utf-8")
print("Catalog management module created successfully.")
