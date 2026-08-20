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
  Calendar,
  Layers,
  Target,
  Monitor,
  Check,
  Plus,
  Filter,
} from 'lucide-react';

// ─── Standard System Preset Options ──────────────────────────────────────────
const STANDARD_CATEGORIES = [
  'Artificial Intelligence',
  'Machine Learning',
  'Data Analytics',
  'Educational Technology',
  'Research Methods',
  'Outcomes-Based Education',
  'Research and Publication Writing',
  'Effective Teaching and Classroom Management',
  'Innovative Instructional Material Development',
  'Quality Assurance Management',
  'Technology Transfer and Innovation',
  'Critical Thinking and Problem Solving',
  'Leadership and Strategic Management',
  'Cybersecurity',
  'Cloud Computing',
  'Learning Management Systems',
  'Statistical Software',
  'Student Development & Welfare',
  'Instruction',
  'Research',
  'Extension',
  'Information Technology',
];

const STANDARD_COMPETENCIES = [
  'Computer Literacy & Digital Technologies',
  'Research Competency',
  'Publication Writing',
  'Effective Teaching & Classroom Management',
  'Innovative Instructional Material Development',
  'Outcomes-Based Education (OBE)',
  'Quality Assurance Management',
  'Technology Transfer & Innovation',
  'Critical Thinking & Problem Solving',
  'Strategic Thinking & Leadership',
  'Leading Change',
  'Building Collaborative Relationships',
  'Coaching & Mentoring',
  'Managing Performance',
  'Delivering Service Excellence',
  'Interpersonal Relationships',
  'Professionalism',
  'Consultancy & Advising',
];

const STANDARD_MODALITIES = [
  'Webinar',
  'Face-to-Face Seminar',
  'Blended Learning',
  'Self-Paced Online Course',
  'Workshop / Hands-on Lab',
  'Coaching',
  'Mentoring',
  'Benchmarking',
  'Project Immersion',
  'Formal Schooling',
];

const STANDARD_DURATIONS = [
  'Half-day',
  'One day',
  'Two days',
  'Three days',
  'One week',
  '2-4 weeks',
  '1-3 months',
  'Self-Paced / Ongoing',
];

const STANDARD_SCHEDULES = [
  'Saturdays',
  'Fridays',
  'Weekdays',
  'Semester Break',
  'Summer / Midyear',
  'Anytime / Flexible',
  'Evenings',
];

// ─── Multi-Select Tag Selector Component ─────────────────────────────────────
interface MultiSelectFieldProps {
  label: string;
  description?: string;
  selected: string[];
  presetOptions: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  icon: React.ReactNode;
  activeColorClass: string;
  badgeBorderClass: string;
}

function MultiSelectField({
  label,
  description,
  selected,
  presetOptions,
  onChange,
  placeholder = 'Add custom item...',
  icon,
  activeColorClass,
  badgeBorderClass,
}: MultiSelectFieldProps) {
  const [customInput, setCustomInput] = useState('');

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((item) => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustomInput('');
  };

  return (
    <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-light-border dark:border-dark-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <label className="text-xs font-bold text-light-text dark:text-white">{label}</label>
          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-light-text dark:text-dark-muted">
            {selected.length} selected
          </span>
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] text-light-text dark:text-dark-muted hover:text-rose-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-light-text dark:text-dark-muted">{description}</p>
      )}

      {/* Preset Pill Toggles */}
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
        {presetOptions.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggleOption(opt)}
              className={`text-xs px-2.5 py-1 rounded-xl font-medium transition-all flex items-center gap-1 border ${
                isSelected
                  ? `${activeColorClass} ${badgeBorderClass} shadow-sm font-semibold`
                  : 'bg-white dark:bg-dark-card text-light-text dark:text-dark-muted border-light-border dark:border-dark-border hover:border-brand-gold/40'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 shrink-0" />}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Tag Input */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-white text-xs outline-none focus:border-brand-green"
        />
        <button
          type="button"
          onClick={() => handleAddCustom()}
          disabled={!customInput.trim()}
          className="px-3 py-1.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      </div>

      {/* Selected Custom Items (if not in preset options) */}
      {selected.filter((item) => !presetOptions.includes(item)).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-light-border dark:border-dark-border/60">
          <span className="text-[10px] text-light-text dark:text-dark-muted font-semibold mr-1">Custom:</span>
          {selected
            .filter((item) => !presetOptions.includes(item))
            .map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-brand-gold/15 text-brand-gold-dark border border-brand-gold/30"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => toggleOption(item)}
                  className="hover:text-rose-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Catalog Management Page ───────────────────────────────────────────
export default function CatalogManagementPage() {
  const { showToast } = useToast();

  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(true);

  // Filter & Search state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All Categories');
  const [selectedModalityFilter, setSelectedModalityFilter] = useState('All Modalities');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Pagination state
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(10);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State (All Database Fields)
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [formCompetencies, setFormCompetencies] = useState<string[]>([]);
  const [formModalities, setFormModalities] = useState<string[]>([]);
  const [formDurations, setFormDurations] = useState<string[]>([]);
  const [formSchedules, setFormSchedules] = useState<string[]>([]);
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
    setFormCategories(['Artificial Intelligence']);
    setFormCompetencies(['Computer Literacy & Digital Technologies']);
    setFormModalities(['Webinar']);
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
    setFormStatus(item.status || 'active');
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
        training_id: modalMode === 'create' ? formId.trim() || undefined : editingId,
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
        showToast('success', 'Program Created', `Training program '${formTitle}' added to institutional catalog.`);
      } else {
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

  // Filter items
  const filteredCatalog = useMemo(() => {
    return catalogItems.filter((c) => {
      // Category filter
      if (selectedCategoryFilter !== 'All Categories' && !c.categories?.includes(selectedCategoryFilter)) {
        return false;
      }
      // Modality filter
      if (selectedModalityFilter !== 'All Modalities' && !c.modalities?.includes(selectedModalityFilter)) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }
      // Search query
      if (!catalogSearch.trim()) return true;
      const q = catalogSearch.toLowerCase().trim();
      return (
        c.training_id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        c.categories?.some((cat) => cat.toLowerCase().includes(q)) ||
        c.target_competencies?.some((comp) => comp.toLowerCase().includes(q)) ||
        c.modalities?.some((mod) => mod.toLowerCase().includes(q)) ||
        c.durations?.some((dur) => dur.toLowerCase().includes(q)) ||
        c.schedules?.some((sch) => sch.toLowerCase().includes(q))
      );
    });
  }, [catalogItems, selectedCategoryFilter, selectedModalityFilter, statusFilter, catalogSearch]);

  const totalPages = Math.ceil(filteredCatalog.length / catalogPageSize) || 1;
  const paginatedCatalog = useMemo(() => {
    const start = (catalogPage - 1) * catalogPageSize;
    return filteredCatalog.slice(start, start + catalogPageSize);
  }, [filteredCatalog, catalogPage, catalogPageSize]);

  const activeCount = useMemo(() => catalogItems.filter((c) => c.status === 'active').length, [catalogItems]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-5 sm:p-6 shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <img src="/images/hero-2.png" alt="QSU Recommender" className="w-40 h-40 object-contain" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img src="/images/logo.png" alt="QSU Recommender" className="w-11 h-11 object-contain shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-xs font-mono font-bold text-light-text dark:text-white">
                  Institutional Training Catalog
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20">
                  Active Database Storage
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Training Catalog Management
              </h1>
              <p className="text-xs text-light-text dark:text-dark-muted mt-0.5 max-w-2xl leading-relaxed">
                Create, edit, and configure institutional programs with categories, competencies, modalities, durations, and schedules matched to faculty by the AI recommendation engine.
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-lg transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Training Program</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span className="font-semibold">Total Catalog Offerings</span>
            <BookOpen className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{catalogItems.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Available programs in system</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span className="font-semibold">Active Programs</span>
            <Tag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Matched in active AI recommendations</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span className="font-semibold">Inactive / Hidden</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{catalogItems.length - activeCount}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Hidden from recommender matching</p>
        </div>
      </div>

      {/* 3. Catalog Directory & Filter Controls */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-light-text dark:text-white">Program Offerings Directory</h2>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
              Showing {filteredCatalog.length} of {catalogItems.length} programs across all configured fields.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setCatalogPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-xs font-semibold text-light-text dark:text-white outline-none"
            >
              <option value="All Categories">All Categories</option>
              {STANDARD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Modality Filter */}
            <select
              value={selectedModalityFilter}
              onChange={(e) => {
                setSelectedModalityFilter(e.target.value);
                setCatalogPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-xs font-semibold text-light-text dark:text-white outline-none"
            >
              <option value="All Modalities">All Modalities</option>
              {STANDARD_MODALITIES.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCatalogPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-xs font-semibold text-light-text dark:text-white outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Search Input */}
            <div className="w-full sm:w-64">
              <SearchInput
                placeholder="Search programs, competencies, tags..."
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
          <div className="py-12 text-center border border-dashed border-light-border dark:border-dark-border rounded-2xl text-xs text-light-text dark:text-dark-muted">
            No catalog items found matching selected filters.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedCatalog.map((item) => (
                <div
                  key={item.training_id}
                  className="p-5 rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-sm space-y-3.5 relative group hover:border-brand-green/40 transition-all"
                >
                  {/* Top Bar: ID, Status, Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-light-text dark:text-white bg-brand-green/10 px-2.5 py-0.5 rounded border border-brand-green/20">
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
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-light-text dark:text-slate-300 hover:text-emerald-500 transition-all border border-light-border dark:border-dark-border"
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
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-gold/20 text-light-text dark:text-slate-300 hover:text-brand-gold-dark transition-all border border-light-border dark:border-dark-border"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget({ id: item.training_id, title: item.title })}
                        title="Delete Program"
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-light-text dark:text-slate-300 hover:text-rose-500 transition-all border border-light-border dark:border-dark-border"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="font-extrabold text-sm text-light-text dark:text-white leading-snug">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-light-text dark:text-dark-muted line-clamp-2 leading-relaxed mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Field 1: Categories */}
                  {item.categories && item.categories.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-light-text dark:text-dark-muted flex items-center gap-1">
                        <Tag className="w-3 h-3 text-brand-gold" />
                        <span>Categories</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.categories.map((cat) => (
                          <span
                            key={cat}
                            className="text-[10px] font-semibold bg-brand-gold/10 text-brand-gold-dark px-2 py-0.5 rounded border border-brand-gold/20"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Field 2: Target Competencies */}
                  {item.target_competencies && item.target_competencies.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-light-text dark:text-dark-muted flex items-center gap-1">
                        <Target className="w-3 h-3 text-emerald-500" />
                        <span>Target Competencies</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.target_competencies.map((comp) => (
                          <span
                            key={comp}
                            className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Field 3, 4, 5: Delivery Details (Modalities, Durations, Schedules) */}
                  <div className="pt-2 border-t border-light-border dark:border-dark-border grid grid-cols-3 gap-2 text-[11px]">
                    {/* Modalities */}
                    <div>
                      <span className="text-[10px] font-bold text-light-text dark:text-dark-muted block mb-0.5 flex items-center gap-1">
                        <Monitor className="w-2.5 h-2.5 text-sky-400" />
                        <span>Modality</span>
                      </span>
                      <p className="text-light-text dark:text-slate-200 truncate font-medium">
                        {item.modalities?.join(', ') || 'N/A'}
                      </p>
                    </div>

                    {/* Durations */}
                    <div>
                      <span className="text-[10px] font-bold text-light-text dark:text-dark-muted block mb-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-amber-400" />
                        <span>Duration</span>
                      </span>
                      <p className="text-light-text dark:text-slate-200 truncate font-medium">
                        {item.durations?.join(', ') || 'N/A'}
                      </p>
                    </div>

                    {/* Schedules */}
                    <div>
                      <span className="text-[10px] font-bold text-light-text dark:text-dark-muted block mb-0.5 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-purple-400" />
                        <span>Schedule</span>
                      </span>
                      <p className="text-light-text dark:text-slate-200 truncate font-medium">
                        {item.schedules?.join(', ') || 'N/A'}
                      </p>
                    </div>
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

      {/* Modal: Create / Edit Program with All Fields & Multi-Select */}
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
              <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-base font-bold text-light-text dark:text-dark-text">
                  {modalMode === 'create' ? 'Add New Training Program' : `Edit Program (${editingId})`}
                </h3>
                <p className="text-xs text-light-text dark:text-dark-muted">
                  Configure program offering, target competencies, modalities, and scheduling
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Field: Training ID (Optional on create) */}
              {modalMode === 'create' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-light-text dark:text-dark-text">
                    Training ID (Optional, e.g. TRN-099)
                  </label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.toUpperCase())}
                    placeholder="Auto-generated (e.g. TRN-015) if left blank"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text font-mono text-xs outline-none focus:border-brand-green"
                  />
                </div>
              )}

              {/* Field: Program Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">
                  Program Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Advanced Generative AI in Classroom Pedagogy"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none focus:border-brand-green"
                />
              </div>

              {/* Field: Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">
                  Program Description
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Comprehensive workshop covering practical curriculum integration, ethical considerations, and assessment strategies..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none resize-none focus:border-brand-green"
                />
              </div>

              {/* Field 1: Categories (Multi-Select) */}
              <MultiSelectField
                label="Target Training Categories *"
                description="Select or add all training categories that this program addresses"
                selected={formCategories}
                presetOptions={STANDARD_CATEGORIES}
                onChange={setFormCategories}
                placeholder="Type new category..."
                icon={<Tag className="w-3.5 h-3.5 text-brand-gold" />}
                activeColorClass="bg-brand-gold/15 text-brand-gold-dark"
                badgeBorderClass="border-brand-gold/30"
              />

              {/* Field 2: Target Competencies (Multi-Select) */}
              <MultiSelectField
                label="Target Competencies"
                description="Select or add competencies developed by completing this training"
                selected={formCompetencies}
                presetOptions={STANDARD_COMPETENCIES}
                onChange={setFormCompetencies}
                placeholder="Type new competency..."
                icon={<Target className="w-3.5 h-3.5 text-emerald-500" />}
                activeColorClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                badgeBorderClass="border-emerald-500/30"
              />

              {/* Field 3: Modalities (Multi-Select) */}
              <MultiSelectField
                label="Delivery Modalities"
                description="Select delivery formats supported (e.g. Webinar, Face-to-Face)"
                selected={formModalities}
                presetOptions={STANDARD_MODALITIES}
                onChange={setFormModalities}
                placeholder="Type new modality..."
                icon={<Monitor className="w-3.5 h-3.5 text-sky-400" />}
                activeColorClass="bg-sky-500/15 text-sky-600 dark:text-sky-400"
                badgeBorderClass="border-sky-500/30"
              />

              {/* Field 4: Durations (Multi-Select) */}
              <MultiSelectField
                label="Program Durations"
                description="Select expected durations (e.g. One day, Two days, 1 week)"
                selected={formDurations}
                presetOptions={STANDARD_DURATIONS}
                onChange={setFormDurations}
                placeholder="Type new duration..."
                icon={<Clock className="w-3.5 h-3.5 text-amber-400" />}
                activeColorClass="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                badgeBorderClass="border-amber-500/30"
              />

              {/* Field 5: Schedules (Multi-Select) */}
              <MultiSelectField
                label="Available Schedules"
                description="Select schedule options (e.g. Saturdays, Semester Break, Anytime)"
                selected={formSchedules}
                presetOptions={STANDARD_SCHEDULES}
                onChange={setFormSchedules}
                placeholder="Type new schedule..."
                icon={<Calendar className="w-3.5 h-3.5 text-purple-400" />}
                activeColorClass="bg-purple-500/15 text-purple-600 dark:text-purple-400"
                badgeBorderClass="border-purple-500/30"
              />

              {/* Field: Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs outline-none focus:border-brand-green"
                >
                  <option value="active">Active (Visible to Recommender Engine)</option>
                  <option value="inactive">Inactive (Hidden from Recommender Engine)</option>
                </select>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center gap-3 pt-3 sticky bottom-0 bg-white dark:bg-dark-card py-2 border-t border-light-border dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Saving to Database...' : modalMode === 'create' ? 'Create Program' : 'Update Program'}
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
                Permanently delete <strong className="text-light-text dark:text-white">{deleteTarget.title}</strong> ({deleteTarget.id}) from the institutional database? This action cannot be undone.
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
