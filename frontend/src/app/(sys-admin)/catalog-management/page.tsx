'use client';

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
  Calendar,
  Monitor,
  Target,
  RefreshCw,
  Check,
  CheckCircle2,
} from 'lucide-react';

// ─── CANONICAL LISTS EXTRACTED FROM CANONICAL CATALOG JSON ──────────────────────

const CANONICAL_CATEGORIES = [
  'Artificial Intelligence',
  'Cloud Computing',
  'Critical Thinking and Problem Solving',
  'Cybersecurity',
  'Data Analytics',
  'Educational Technology',
  'Effective Teaching and Classroom Management',
  'Emerging Training Needs',
  'Functional Competency',
  'Innovative Instructional Material Development',
  'Leadership Competencies',
  'Leadership and Strategic Management',
  'Learning Management Systems',
  'Machine Learning',
  'Outcomes-Based Education',
  'Quality Assurance Management',
  'Research Methods',
  'Research and Publication Writing',
  'Statistical Software',
  'Technology Transfer and Innovation',
];

const CANONICAL_COMPETENCIES = [
  'Computer Literacy and Digital Technologies',
  'Consultancy and Advising',
  'Critical Thinking and Problem Solving',
  'Delivering Service Excellence',
  'Effective Teaching and Classroom Management',
  'Innovative Instructional Material Development',
  'Leading Change',
  'Managing Performance',
  'Outcomes-Based Education',
  'Professionalism',
  'Publication Writing',
  'Quality Assurance Management',
  'Research Competency',
  'Strategic Thinking',
  'Technology Transfer and Innovation',
];

const CANONICAL_MODALITIES = [
  'Webinar',
  'Blended Learning',
  'Face-to-Face Seminar',
  'Mentoring',
  'Coaching',
  'Benchmarking',
];

const CANONICAL_DURATIONS = [
  'Half day',
  'One day',
  'Two days',
  'Three days',
  'One week',
];

const CANONICAL_SCHEDULES = [
  'Fridays',
  'Saturdays',
  'Semester break',
  'Summer',
  'Anytime',
];

// ─── CHIP MULTI-SELECT COMPONENT ────────────────────────────────────────────────

interface MultiSelectProps {
  label: string;
  selected: string[];
  options: string[];
  onChange: (selected: string[]) => void;
  accentColor?: string;
  placeholder?: string;
}

function MultiSelectPills({
  label,
  selected,
  options,
  onChange,
  accentColor = 'brand-gold',
  placeholder = 'Add custom...',
}: MultiSelectProps) {
  const [customInput, setCustomInput] = useState('');

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleAddCustom = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customInput.trim()) {
      e.preventDefault();
      const val = customInput.trim();
      if (!selected.includes(val)) {
        onChange([...selected, val]);
      }
      setCustomInput('');
    }
  };

  const removeChip = (val: string) => {
    onChange(selected.filter((item) => item !== val));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-light-text dark:text-dark-text">
          {label} <span className="text-[11px] font-normal text-light-text/60 dark:text-dark-muted">({selected.length} selected)</span>
        </label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] text-rose-500 hover:underline font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Selected chips row */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-light-border dark:border-dark-border bg-slate-50 dark:bg-slate-900/40 min-h-[36px]">
          {selected.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-brand-gold/15 text-brand-gold-dark dark:text-gold-300 border border-brand-gold/30"
            >
              <span>{val}</span>
              <button
                type="button"
                onClick={() => removeChip(val)}
                className="hover:text-rose-500 transition-colors"
                title={`Remove ${val}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Available options toggle grid */}
      <div className="p-2.5 rounded-xl border border-light-border dark:border-slate-800 bg-white dark:bg-dark-bg space-y-2">
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(opt)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all text-left flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-brand-gold text-slate-950 border-brand-gold font-bold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-light-text dark:text-slate-300 border-transparent'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Input */}
        <div className="pt-1.5 border-t border-light-border dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleAddCustom}
            placeholder={placeholder}
            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-light-border dark:border-slate-700 bg-transparent text-light-text dark:text-dark-text outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (customInput.trim()) {
                if (!selected.includes(customInput.trim())) {
                  onChange([...selected, customInput.trim()]);
                }
                setCustomInput('');
              }
            }}
            disabled={!customInput.trim()}
            className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-[11px] font-semibold text-light-text dark:text-slate-200 hover:bg-brand-gold hover:text-slate-950 transition-colors disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN CATALOG MANAGEMENT PAGE ──────────────────────────────────────────────

export default function CatalogManagementPage() {
  const { showToast } = useToast();

  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(true);
  const [syncing, setSyncing] = useState(false);

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

  // Form State (supporting all canonical fields with multi-select)
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategories, setFormCategories] = useState<string[]>(['Artificial Intelligence']);
  const [formCompetencies, setFormCompetencies] = useState<string[]>(['Computer Literacy and Digital Technologies']);
  const [formModalities, setFormModalities] = useState<string[]>(['Webinar']);
  const [formDurations, setFormDurations] = useState<string[]>(['One day']);
  const [formSchedules, setFormSchedules] = useState<string[]>(['Saturdays']);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
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

  const handleSyncWithCanonical = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/catalog/sync');
      showToast('success', 'Catalog Synchronized', res.data.message || 'Canonical catalog synced to database.');
      await loadCatalog();
    } catch (err: any) {
      showToast('error', 'Sync Failed', err.response?.data?.detail || 'Failed to sync catalog.');
    } finally {
      setSyncing(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormId('');
    setFormTitle('');
    setFormDesc('');
    setFormCategories(['Artificial Intelligence']);
    setFormCompetencies(['Computer Literacy and Digital Technologies']);
    setFormModalities(['Webinar', 'Blended Learning']);
    setFormDurations(['Two days']);
    setFormSchedules(['Saturdays']);
    setFormStatus('active');
    setShowModal(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setModalMode('edit');
    setEditingId(item.training_id);
    setFormId(item.training_id);
    setFormTitle(item.title);
    setFormDesc(item.description || '');
    setFormCategories(item.categories || []);
    setFormCompetencies(item.target_competencies || []);
    setFormModalities(item.modalities || []);
    setFormDurations(item.durations || []);
    setFormSchedules(item.schedules || []);
    setFormStatus((item.status as 'active' | 'inactive') || 'active');
    setShowModal(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('error', 'Validation Error', 'Program Title is required.');
      return;
    }
    if (formCategories.length === 0) {
      showToast('error', 'Validation Error', 'Please select at least one training category.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        training_id: formId.trim() || undefined,
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        categories: formCategories,
        target_competencies: formCompetencies,
        modalities: formModalities,
        durations: formDurations,
        schedules: formSchedules,
        status: formStatus,
      };

      if (modalMode === 'create') {
        await api.post('/catalog', payload);
        showToast('success', 'Program Created', `Training program '${formTitle}' added to database catalog.`);
      } else {
        await api.put(`/catalog/${editingId}`, payload);
        showToast('success', 'Program Updated', `Training program '${formTitle}' updated successfully.`);
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
      showToast('success', 'Program Deleted', `'${deleteTarget.title}' was permanently removed from database.`);
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
        c.categories?.some((cat) => cat.toLowerCase().includes(q)) ||
        c.target_competencies?.some((comp) => comp.toLowerCase().includes(q)) ||
        c.modalities?.some((m) => m.toLowerCase().includes(q))
      );
    });
  }, [catalogItems, selectedCategoryFilter, catalogSearch]);

  const totalPages = Math.ceil(filteredCatalog.length / catalogPageSize) || 1;
  const paginatedCatalog = useMemo(() => {
    const start = (catalogPage - 1) * catalogPageSize;
    return filteredCatalog.slice(start, start + catalogPageSize);
  }, [filteredCatalog, catalogPage, catalogPageSize]);

  const activeCount = useMemo(() => catalogItems.filter((c) => c.status === 'active').length, [catalogItems]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Database Training Catalog & Scoring Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text dark:text-white tracking-tight">
            Institutional Training Catalog
          </h1>
          <p className="text-xs text-light-text dark:text-dark-muted max-w-2xl leading-relaxed">
            Manage canonical programs stored in MySQL used to score and match faculty competency gaps. All fields support multi-select tags aligned with the original assessment instrument.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleSyncWithCanonical}
            disabled={syncing}
            title="Reset/sync database with canonical 17 items from training_catalog.json"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-light-border dark:border-slate-700 bg-white/70 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-light-text dark:text-slate-200 font-semibold text-xs transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-500 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Canonical 17'}</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-slate-950 font-bold text-xs shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Training Program</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Total Catalog Programs</span>
            <BookOpen className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{catalogItems.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Stored in MySQL training_catalog table</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Active Programs</span>
            <Tag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Available for AI recommendation matching</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Inactive / Hidden</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{catalogItems.length - activeCount}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Excluded from recommendation outputs</p>
        </div>
      </div>

      {/* 3. Catalog Grid View & Controls */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-light-text dark:text-white">Institutional Offerings Directory</h2>
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
              <option value="All Categories">All Categories</option>
              {CANONICAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="w-full sm:w-64">
              <SearchInput
                placeholder="Search programs, tags, modalities..."
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
            No catalog items found matching your filter criteria.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedCatalog.map((item) => (
                <div
                  key={item.training_id}
                  className="p-5 rounded-2xl border border-light-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm space-y-3.5 relative group flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: ID + Status + Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
                          {item.training_id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            item.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
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
                          {item.status === 'active' ? (
                            <ToggleRight className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
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

                    {/* Program Title */}
                    <h4 className="font-bold text-sm text-light-text dark:text-white leading-snug">
                      {item.title}
                    </h4>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-light-text dark:text-dark-muted line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Categories Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.categories?.map((cat) => (
                        <span
                          key={cat}
                          className="text-[10px] font-mono bg-brand-gold/10 text-brand-gold-dark dark:text-gold-300 px-2 py-0.5 rounded border border-brand-gold/20"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>

                    {/* Target Competencies */}
                    {item.target_competencies && item.target_competencies.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-light-text/60 dark:text-dark-muted flex items-center gap-1">
                          <Target className="w-3 h-3 text-sky-500" />
                          <span>Gaps:</span>
                        </span>
                        {item.target_competencies.map((comp) => (
                          <span
                            key={comp}
                            className="text-[10px] bg-sky-500/10 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded border border-sky-500/20"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Info: Modalities, Durations & Schedules */}
                  <div className="pt-2 border-t border-light-border dark:border-slate-800 flex flex-wrap items-center gap-3 text-[11px] text-light-text/70 dark:text-dark-muted">
                    {item.modalities && item.modalities.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Monitor className="w-3 h-3 text-amber-500" />
                        <span>{item.modalities.join(', ')}</span>
                      </div>
                    )}

                    {item.durations && item.durations.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span>{item.durations.join(', ')}</span>
                      </div>
                    )}

                    {item.schedules && item.schedules.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-500" />
                        <span>{item.schedules.join(', ')}</span>
                      </div>
                    )}
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

      {/* 4. Modal: Create / Edit Program with Multi-Select Form Fields */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-light-text dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-base font-bold text-light-text dark:text-dark-text">
                  {modalMode === 'create' ? 'Add New Training Program' : `Edit Program (${editingId})`}
                </h3>
                <p className="text-xs text-light-text dark:text-dark-muted">
                  Configure training catalog details stored directly in MySQL and synchronized with AI scoring.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Program ID & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-light-text dark:text-dark-text">
                    Training ID {modalMode === 'create' && '(Optional, e.g. T018)'}
                  </label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.toUpperCase())}
                    placeholder="Auto-generated if blank"
                    disabled={modalMode === 'edit'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text font-mono text-xs outline-none disabled:opacity-60"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-light-text dark:text-dark-text">Program Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Applied Artificial Intelligence and Prompt Engineering"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Program Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Detailed objectives, pedagogical methods, and faculty learning outcomes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none resize-none"
                />
              </div>

              {/* Multi-Select: Categories */}
              <MultiSelectPills
                label="Training Categories (Aligned with ML Topics)"
                selected={formCategories}
                options={CANONICAL_CATEGORIES}
                onChange={setFormCategories}
                placeholder="Add other category..."
              />

              {/* Multi-Select: Target Competencies */}
              <MultiSelectPills
                label="Target Competencies (Addressed Needs)"
                selected={formCompetencies}
                options={CANONICAL_COMPETENCIES}
                onChange={setFormCompetencies}
                placeholder="Add other competency..."
              />

              {/* Multi-Select: Modalities */}
              <MultiSelectPills
                label="Delivery Modalities"
                selected={formModalities}
                options={CANONICAL_MODALITIES}
                onChange={setFormModalities}
                placeholder="Add other modality..."
              />

              {/* Multi-Select: Durations & Schedules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MultiSelectPills
                  label="Durations"
                  selected={formDurations}
                  options={CANONICAL_DURATIONS}
                  onChange={setFormDurations}
                  placeholder="Add duration..."
                />
                <MultiSelectPills
                  label="Schedules"
                  selected={formSchedules}
                  options={CANONICAL_SCHEDULES}
                  onChange={setFormSchedules}
                  placeholder="Add schedule..."
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none"
                >
                  <option value="active">Active (Eligible for AI Recommender Matching)</option>
                  <option value="inactive">Inactive (Hidden from Recommendation Results)</option>
                </select>
              </div>

              {/* Submit Buttons */}
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
