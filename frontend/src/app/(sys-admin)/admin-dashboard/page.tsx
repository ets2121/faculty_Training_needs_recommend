'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserListItem, AuditLogItem, CatalogItem } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import SearchInput from '@/components/SearchInput';
import { TableSkeleton, CardGridSkeleton } from '@/components/Skeletons';
import { ViewEditUserModal, DeleteUserModal } from '@/components/UserModals';
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
  ChevronDown,
  Check,
  Eye,
  Hash,
  FileText,
  Layers,
  Monitor,
  Clock,
  CalendarDays,
  Tag,
  AlertCircle,
  ListChecks,
  Key,
} from 'lucide-react';

// ─── Catalog option constants (shared with questionnaire domain) ─────────────
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

const MODALITIES = [
  'Webinar',
  'Face-to-Face',
  'Blended Learning',
  'Online Self-Paced',
  'Workshop',
  'Seminar',
  'Conference',
];

const DURATIONS = [
  'One day',
  'Two days',
  'Three days',
  'One week',
  'Half day',
  'Two weeks',
  'One month',
];

const SCHEDULES = [
  'Saturdays',
  'Sundays',
  'Weekdays',
  'Summer break',
  'Christmas break',
  'Semestral break',
  'Flexible / On-demand',
];

const CATALOG_STATUS_OPTIONS = ['active', 'inactive'];

// ─── Empty catalog form state ────────────────────────────────────────────────
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

// ─── Multi-Select Dropdown Component ─────────────────────────────────────────
function MultiSelect({
  id,
  label,
  hint,
  options,
  selected,
  onChange,
  required,
  error,
}: {
  id: string;
  label: string;
  hint?: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  required?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const removeChip = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== val));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const hasError = !!error;

  return (
    <div ref={containerRef} className="space-y-1">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold text-light-text dark:text-dark-text">
          {label}
          {required && <span className="text-light-text dark:text-white font-bold">*</span>}
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/25 text-[9px] font-bold tracking-wide">
            <ListChecks className="w-2.5 h-2.5" />
            MULTI-SELECT
          </span>
        </label>
        {selected.length > 0 && (
          <span className="text-[10px] font-mono text-light-text dark:text-white bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20">
            {selected.length} selected
          </span>
        )}
      </div>

      {/* Helper hint */}
      {hint && (
        <p className="text-[11px] text-light-text dark:text-dark-muted leading-snug">{hint}</p>
      )}

      {/* Trigger button */}
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full bg-light-bg dark:bg-dark-bg border rounded-xl px-3.5 pt-2 pb-2 text-xs text-left text-light-text dark:text-dark-text focus:outline-none transition-colors min-h-[44px] ${
            hasError
              ? 'border-rose-500/60 focus:border-rose-400'
              : open
              ? 'border-brand-green shadow-[0_0_0_1px_rgba(21,148,71,0.15)]'
              : 'border-light-border dark:border-dark-border hover:border-slate-500'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="flex flex-wrap gap-1.5 flex-1 min-h-[24px]">
              {selected.length === 0 ? (
                <span className="text-light-text dark:text-dark-muted text-xs leading-6">Click to select {label.toLowerCase()}...</span>
              ) : (
                selected.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 bg-brand-green/15 text-light-text dark:text-white border border-brand-green/30 pl-2 pr-1 py-0.5 rounded-md text-[11px] font-medium leading-5"
                  >
                    {v}
                    <button
                      type="button"
                      onClick={(e) => removeChip(e, v)}
                      className="w-3.5 h-3.5 rounded-full hover:bg-brand-green/25 flex items-center justify-center transition-colors"
                      aria-label={`Remove ${v}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))
              )}
            </span>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-light-text dark:text-dark-muted hover:text-light-text dark:text-dark-text p-0.5 rounded transition-colors"
                  title="Clear all selections"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronDown className={`w-4 h-4 text-light-text dark:text-dark-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {/* Dropdown options */}
        {open && (
          <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-dark-card border border-brand-green rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="px-3 py-2 border-b border-light-border dark:border-dark-border flex items-center justify-between">
              <span className="text-[10px] text-light-text dark:text-dark-muted font-mono">
                {selected.length}/{options.length} selected
              </span>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange([]); }}
                  className="text-[10px] text-light-text dark:text-white hover:text-rose-300 font-semibold transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="py-1 max-h-52 overflow-y-auto">
              {options.map((opt) => {
                const isSelected = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(opt)}
                    className={`w-full px-3.5 py-2.5 text-xs text-left flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-brand-green/10 hover:bg-brand-green/15' : 'hover:bg-white dark:bg-dark-bg'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-brand-green border-brand-green'
                          : 'border-brand-green bg-white dark:bg-dark-card'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-light-text dark:text-dark-text" />}
                    </span>
                    <span className={isSelected ? 'text-light-text dark:text-white font-medium' : 'text-light-text dark:text-dark-text'}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p className="flex items-center gap-1 text-[11px] text-light-text dark:text-white">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Catalog Form Modal ───────────────────────────────────────────────────────
function CatalogFormModal({
  mode,
  initialData,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  initialData: Partial<CatalogItem>;
  onClose: () => void;
  onSave: (data: Partial<CatalogItem>) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<CatalogItem>>(initialData);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setField = (key: keyof CatalogItem, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const titleError = touched.title && !form.title?.trim() ? 'Program title is required.' : '';
  const catError = touched.categories && !form.categories?.length ? 'Select at least one category.' : '';
  const canSubmit = !!form.title?.trim() && (form.categories?.length ?? 0) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, categories: true });
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-light-bg dark:bg-dark-bg/85 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/80 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col">

        {/* ── Modal Header ── */}
        <div className="flex items-start justify-between p-6 sm:p-7 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-light-text dark:text-white tracking-tight">
                {mode === 'create' ? 'Add Training Program to Catalog' : `Edit Training Program`}
              </h3>
              {mode === 'edit' && (
                <p className="text-[11px] font-mono text-light-text dark:text-white mt-0.5">{form.training_id}</p>
              )}
              <p className="text-xs text-light-text dark:text-dark-muted mt-0.5 leading-relaxed">
                {mode === 'create'
                  ? 'Programs are matched to faculty recommendations immediately after saving — no ML retraining needed.'
                  : 'All fields are editable. Changes are saved to the database in real time.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-brand-green text-light-text dark:text-dark-muted hover:text-light-text dark:text-dark-text flex items-center justify-center transition-all shrink-0 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-7">
          <form id="catalog-form" onSubmit={handleSubmit} className="space-y-7">

            {/* ── SECTION 1: Identification ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-light-text dark:text-dark-muted uppercase tracking-widest">
                <Hash className="w-3.5 h-3.5" />
                <span>Program Identification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mode === 'create' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-light-text dark:text-dark-text">
                      Training ID
                      <span className="ml-1.5 text-[10px] font-normal text-light-text dark:text-dark-muted">(auto-generated if blank)</span>
                    </label>
                    <input
                      type="text"
                      value={form.training_id || ''}
                      onChange={(e) => setField('training_id', e.target.value)}
                      placeholder="e.g. TRN-015"
                      className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-slate-500 rounded-xl px-3.5 py-2.5 text-xs text-light-text dark:text-dark-text font-mono placeholder:text-light-text dark:placeholder:text-dark-muted focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green/20 transition-colors"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-light-text dark:text-dark-text">
                    Status <span className="text-light-text dark:text-white font-bold">*</span>
                  </label>
                  <p className="text-[11px] text-light-text dark:text-dark-muted">Inactive programs are hidden from faculty recommendations.</p>
                  <select
                    value={form.status || 'active'}
                    onChange={(e) => setField('status', e.target.value)}
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-slate-500 rounded-xl px-3.5 py-2.5 text-xs text-light-text dark:text-dark-text focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                  >
                    <option value="active">✅  Active — visible to recommender</option>
                    <option value="inactive">🔴  Inactive — hidden from recommendations</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Basic Info ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-light-text dark:text-dark-muted uppercase tracking-widest">
                <FileText className="w-3.5 h-3.5" />
                <span>Program Details</span>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-light-text dark:text-dark-text">
                  Program Title <span className="text-light-text dark:text-white font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={form.title || ''}
                  onChange={(e) => setField('title', e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, title: true }))}
                  placeholder="e.g. AI in Higher Education: Tools and Applications"
                  className={`w-full bg-light-bg dark:bg-dark-bg border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-dark-text placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                    titleError
                      ? 'border-rose-500/60 focus:border-rose-400 focus:ring-rose-500/15'
                      : 'border-light-border dark:border-dark-border hover:border-brand-green focus:border-brand-green focus:ring-emerald-500/15'
                  }`}
                />
                {titleError && (
                  <p className="flex items-center gap-1 text-[11px] text-light-text dark:text-white">
                    <AlertCircle className="w-3 h-3" /> {titleError}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-light-text dark:text-dark-text">Description</label>
                <p className="text-[11px] text-light-text dark:text-dark-muted">Explain the program objectives, target audience, and key outcomes.</p>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Describe what participants will learn and how it addresses their training needs..."
                  rows={3}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-slate-500 rounded-xl px-3.5 py-2.5 text-xs text-light-text dark:text-dark-text placeholder:text-light-text dark:placeholder:text-dark-muted focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green/15 transition-colors resize-none"
                />
              </div>
            </div>

            {/* ── SECTION 3: Classification ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-light-text dark:text-dark-muted uppercase tracking-widest">
                <Layers className="w-3.5 h-3.5" />
                <span>Classification & Targeting</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  id="categories"
                  label="Training Categories"
                  hint="These tags drive the ML recommendation matching. At least one is required."
                  required
                  options={TRAINING_CATEGORIES}
                  selected={form.categories || []}
                  onChange={(v) => setField('categories', v)}
                  error={catError}
                />
                <MultiSelect
                  id="target_competencies"
                  label="Target Competencies"
                  hint="The faculty competency gaps this program addresses."
                  options={TARGET_COMPETENCIES}
                  selected={form.target_competencies || []}
                  onChange={(v) => setField('target_competencies', v)}
                />
              </div>
            </div>

            {/* ── SECTION 4: Delivery Info ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-light-text dark:text-dark-muted uppercase tracking-widest">
                <Monitor className="w-3.5 h-3.5" />
                <span>Delivery Options</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  id="modalities"
                  label="Delivery Modalities"
                  hint="How is this program delivered? (e.g. Webinar, Face-to-Face)."
                  options={MODALITIES}
                  selected={form.modalities || []}
                  onChange={(v) => setField('modalities', v)}
                />
                <MultiSelect
                  id="durations"
                  label="Duration Options"
                  hint="Typical time commitment for this program."
                  options={DURATIONS}
                  selected={form.durations || []}
                  onChange={(v) => setField('durations', v)}
                />
              </div>
            </div>

            {/* ── SECTION 5: Schedule ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-light-text dark:text-dark-muted uppercase tracking-widest">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Schedule Availability</span>
              </div>

              <MultiSelect
                id="schedules"
                label="Schedule Options"
                hint="When can faculty attend this program? Select all applicable windows."
                options={SCHEDULES}
                selected={form.schedules || []}
                onChange={(v) => setField('schedules', v)}
              />
            </div>

          </form>
        </div>

        {/* ── Modal Footer ── */}
        <div className="p-5 sm:p-6 border-t border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg/40 rounded-b-3xl flex items-center justify-between gap-4">
          <div className="text-[11px] text-light-text dark:text-dark-muted flex items-center gap-1">
            <span className="text-light-text dark:text-white font-bold">*</span>
            <span>Title and at least one Category are required.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-brand-green text-light-text dark:text-dark-text text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="catalog-form"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed text-light-text dark:text-dark-text font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all"
            >
              {saving ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</>
              ) : (
                <>{mode === 'create' ? <><PlusCircle className="w-3.5 h-3.5" /> Create Program</> : <><Check className="w-3.5 h-3.5" /> Save Changes</>}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Catalog Item Card ────────────────────────────────────────────────────────
function CatalogCard({
  item,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  item: CatalogItem;
  onEdit: (item: CatalogItem) => void;
  onToggleStatus: (id: string, current: string) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const isActive = item.status === 'active';

  return (
    <div
      className={`p-5 rounded-2xl border transition-all group space-y-3 ${
        isActive
          ? 'border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg/80 hover:border-light-border dark:border-dark-border'
          : 'border-light-border dark:border-dark-border/40 bg-light-bg dark:bg-dark-bg/30 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20">
            {item.training_id}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              isActive
                ? 'text-brand-green bg-brand-green/10 border-brand-green/20'
                : 'text-light-text dark:text-dark-muted bg-white dark:bg-dark-bg border-light-border dark:border-dark-border'
            }`}
          >
            {item.status}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(item)}
            title="Edit"
            className="w-7 h-7 rounded-lg bg-white dark:bg-dark-bg hover:bg-brand-gold/30 text-light-text dark:text-dark-muted hover:text-brand-gold flex items-center justify-center transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggleStatus(item.training_id, item.status)}
            title={isActive ? 'Deactivate' : 'Activate'}
            className="w-7 h-7 rounded-lg bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-brand-green text-light-text dark:text-dark-muted hover:text-light-text dark:text-dark-text flex items-center justify-center transition-all"
          >
            {isActive ? <ToggleRight className="w-3.5 h-3.5 text-brand-green" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onDelete(item.training_id, item.title)}
            title="Delete"
            className="w-7 h-7 rounded-lg bg-white dark:bg-dark-bg hover:bg-rose-600/30 text-light-text dark:text-dark-muted hover:text-brand-green flex items-center justify-center transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-bold text-light-text dark:text-dark-text text-sm leading-snug group-hover:text-light-text dark:text-dark-text transition-colors">
        {item.title}
      </h4>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed line-clamp-2">{item.description}</p>
      )}

      {/* Tags row */}
      <div className="space-y-1.5">
        {item.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.categories.map((c) => (
              <span key={c} className="text-[10px] font-mono bg-brand-gold/10 text-brand-gold border border-brand-gold/20 px-1.5 py-0.5 rounded">
                {c}
              </span>
            ))}
          </div>
        )}
        {item.modalities?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.modalities.map((m) => (
              <span key={m} className="text-[10px] font-mono bg-white dark:bg-dark-bg text-light-text dark:text-dark-muted px-1.5 py-0.5 rounded">
                {m}
              </span>
            ))}
          </div>
        )}
        {item.durations?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.durations.map((d) => (
              <span key={d} className="text-[10px] font-mono bg-white dark:bg-dark-bg text-light-text dark:text-dark-muted px-1.5 py-0.5 rounded">
                ⏱ {d}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal for Catalog Items ──────────────────────────────────
function DeleteConfirmModal({
  trainingId,
  title,
  onConfirm,
  onCancel,
}: {
  trainingId: string;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-light-bg dark:bg-dark-bg/85 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-card border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-brand-green" />
        </div>
        <div>
          <h3 className="text-base font-bold text-light-text dark:text-dark-text">Delete Training Program</h3>
          <p className="text-xs text-light-text dark:text-dark-muted mt-1 leading-relaxed">
            This will permanently remove <strong className="text-light-text dark:text-dark-text">{title}</strong> ({trainingId}) from the catalog. This cannot be undone.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-brand-green text-light-text dark:text-dark-text text-xs font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-light-text dark:text-dark-text text-xs font-bold transition-all"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Main Admin Dashboard Page ────────────────────────────────────────────────
export default function SystemAdminDashboardPage() {
  const { user: currentAuthUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'catalog'>('users');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [showInactive, setShowInactive] = useState(false);

  // Search filter states
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  // User modals state
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserListItem | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserListItem | null>(null);

  // Catalog modal state
  const [catalogModal, setCatalogModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data: Partial<CatalogItem>;
  }>({ open: false, mode: 'create', data: emptyCatalogForm() });

  const [deleteCatalogTarget, setDeleteCatalogTarget] = useState<{ id: string; title: string } | null>(null);

  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, aRes, cRes] = await Promise.all([
        api.get('/users'),
        api.get('/audit-logs?limit=50'),
        api.get(`/catalog?include_inactive=${showInactive}`),
      ]);
      setUsers(uRes.data.users || []);
      setAuditLogs(aRes.data.logs || []);
      setCatalogItems(cRes.data.items || []);
    } catch (err: any) {
      showToast('error', 'Admin Load Failed', err.response?.data?.detail || 'Could not load system data.');
    } finally {
      setLoading(false);
    }
  }, [showInactive, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Filtered Data using Debounced Searches ───────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q) ||
        (u.department_code && u.department_code.toLowerCase().includes(q)) ||
        (u.status && u.status.toLowerCase().includes(q))
    );
  }, [users, userSearch]);

  const filteredAuditLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.toLowerCase().trim();
    return auditLogs.filter(
      (l) =>
        (l.username && l.username.toLowerCase().includes(q)) ||
        l.action.toLowerCase().includes(q) ||
        (l.entity_type && l.entity_type.toLowerCase().includes(q)) ||
        (l.entity_id && l.entity_id.toLowerCase().includes(q)) ||
        (l.ip_address && l.ip_address.toLowerCase().includes(q))
    );
  }, [auditLogs, auditSearch]);

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

  // ─── Train Model ─────────────────────────────────────────────────────────
  const handleTrainModel = async () => {
    setTraining(true);
    try {
      const res = await api.post('/training/train', {}, {
        headers: { 'X-Admin-API-Key': 'change-this-in-production' },
      });
      showToast('success', 'Model Retrained!', `Version ${res.data.version} active.`);
      await loadData();
    } catch (err: any) {
      showToast('error', 'Training Failed', err.response?.data?.detail || 'Retraining failed.');
    } finally {
      setTraining(false);
    }
  };

  // ─── Save Catalog Item (create or update) ─────────────────────────────────
  const handleSaveCatalogItem = async (formData: Partial<CatalogItem>) => {
    const isEdit = catalogModal.mode === 'edit';
    const trainingId = formData.training_id;

    const payload = {
      training_id: formData.training_id || undefined,
      title: formData.title,
      description: formData.description || '',
      categories: formData.categories || [],
      target_competencies: formData.target_competencies || [],
      modalities: formData.modalities || [],
      durations: formData.durations || [],
      schedules: formData.schedules || [],
      status: formData.status || 'active',
    };

    try {
      if (isEdit && trainingId) {
        await api.put(`/catalog/${trainingId}`, payload, {
          headers: { 'X-Admin-API-Key': 'change-this-in-production' },
        });
        showToast('success', 'Program Updated', `'${formData.title}' has been updated successfully.`);
      } else {
        await api.post('/catalog', payload, {
          headers: { 'X-Admin-API-Key': 'change-this-in-production' },
        });
        showToast('success', 'Program Added', `'${formData.title}' added to the catalog.`);
      }
      setCatalogModal({ open: false, mode: 'create', data: emptyCatalogForm() });
      await loadData();
    } catch (err: any) {
      showToast('error', isEdit ? 'Update Failed' : 'Add Failed', err.response?.data?.detail || 'Operation failed.');
      throw err;
    }
  };

  // ─── Toggle Status ────────────────────────────────────────────────────────
  const handleToggleCatalogStatus = async (id: string, current: string) => {
    try {
      const res = await api.patch(`/catalog/${id}/status`, {}, {
        headers: { 'X-Admin-API-Key': 'change-this-in-production' },
      });
      showToast('success', 'Status Updated', `Item ${id} is now ${res.data.new_status}.`);
      await loadData();
    } catch (err: any) {
      showToast('error', 'Toggle Failed', err.response?.data?.detail || 'Status toggle failed.');
    }
  };

  // ─── Delete Catalog Item ──────────────────────────────────────────────────
  const handleDeleteCatalogConfirmed = async () => {
    if (!deleteCatalogTarget) return;
    try {
      await api.delete(`/catalog/${deleteCatalogTarget.id}`, {
        headers: { 'X-Admin-API-Key': 'change-this-in-production' },
      });
      showToast('success', 'Deleted', `'${deleteCatalogTarget.title}' removed from catalog.`);
      setDeleteCatalogTarget(null);
      await loadData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.detail || 'Delete operation failed.');
    }
  };

  const openEditCatalogModal = (item: CatalogItem) => {
    setCatalogModal({ open: true, mode: 'edit', data: { ...item } });
  };

  const openCreateCatalogModal = () => {
    setCatalogModal({ open: true, mode: 'create', data: emptyCatalogForm() });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-green/10 text-brand-green border border-brand-green/20">
            <span>System Administrator Portal</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-light-text dark:text-white tracking-tight leading-tight">
            QSU Recommender Management Console
          </h1>
          <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
            System-wide user access control, audit logs, training catalog maintenance, and ML model retraining.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/register-admin"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border text-brand-green hover:border-brand-green text-xs font-semibold transition-all"
          >
            <UserPlus className="w-4 h-4 text-brand-green" />
            <span>Add Dept Admin</span>
          </Link>

          <button
            onClick={handleTrainModel}
            disabled={training}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50"
          >
            {training ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-white" />
                <span className="hidden sm:inline">Training ML Pipeline...</span>
                <span className="sm:hidden">Training...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Trigger ML Retraining</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-light-border dark:border-dark-border pb-2">
        {(
          [
            { key: 'users', icon: <Users className="w-4 h-4 shrink-0" />, label: `Users & RBAC (${users.length})` },
            { key: 'audit', icon: <History className="w-4 h-4 shrink-0" />, label: `Audit Logs (${auditLogs.length})` },
            { key: 'catalog', icon: <BookOpen className="w-4 h-4 shrink-0" />, label: `Training Catalog (${catalogItems.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-brand-green/15 text-brand-green border border-brand-green/30'
                : 'text-light-text dark:text-dark-muted hover:text-light-text dark:text-dark-text'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Tab Contents */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <>
          {/* ── TAB 1: USERS ── */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-light-text dark:text-dark-text">System User Directory</h2>
                  <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">Manage credentials, roles, and profiles across all departments.</p>
                </div>

                {/* Debounced Search */}
                <div className="w-full sm:w-72">
                  <SearchInput
                    placeholder="Search users by name, role, dept..."
                    onChange={(val) => setUserSearch(val)}
                  />
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-light-border dark:border-dark-border rounded-2xl text-xs text-light-text dark:text-dark-muted space-y-1">
                  <p className="text-light-text dark:text-dark-text font-semibold">No users found matching "{userSearch}"</p>
                  <p className="text-light-text dark:text-dark-muted">Try searching for a username, email, or department code.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-light-text dark:text-dark-text">
                    <thead className="bg-light-bg dark:bg-dark-bg/80 text-light-text dark:text-dark-muted font-semibold border-b border-light-border dark:border-dark-border uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5 rounded-l-xl">ID</th>
                        <th className="p-3.5">User</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Department</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right rounded-r-xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border dark:divide-dark-border">
                      {filteredUsers.map((u) => {
                        const isSelf = currentAuthUser?.id === u.id;
                        return (
                          <tr key={u.id} className="hover:bg-light-bg dark:hover:bg-dark-bg/60 transition-colors group">
                            <td className="p-3.5 font-mono text-light-text dark:text-dark-muted">#{u.id}</td>
                            <td className="p-3.5">
                              <div className="font-bold text-light-text dark:text-dark-text flex items-center gap-1.5">
                                <span>{u.full_name || u.username}</span>
                                {isSelf && (
                                  <span className="text-[9px] font-mono bg-brand-green/15 text-brand-green px-1.5 py-0.2 rounded">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-light-text dark:text-dark-muted font-mono">
                                @{u.username} • {u.email || 'No email'}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                u.role === 'system_admin' ? 'bg-rose-500/10 text-light-text dark:text-white border-rose-500/20' :
                                u.role === 'department_admin' ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' :
                                'bg-brand-green/10 text-brand-green border-brand-green/20'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-light-text dark:text-dark-text">{u.department_code || 'System-wide'}</td>
                            <td className="p-3.5">
                              <span className="text-[11px] text-light-text dark:text-white font-semibold">{u.status}</span>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                                <button
                                  onClick={() => setSelectedUserForEdit(u)}
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white dark:bg-dark-bg hover:bg-brand-green/10 text-brand-green dark:text-dark-text hover:text-brand-green border border-light-border dark:border-dark-border text-[11px] font-medium transition-all"
                                  title="View / Edit Profile Details"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span className="hidden lg:inline">Edit</span>
                                </button>

                                <button
                                  onClick={() => setSelectedUserForEdit(u)}
                                  className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-dark-bg hover:bg-brand-gold/10 text-brand-gold border border-light-border dark:border-dark-border transition-all"
                                  title="Emergency Password Reset"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setSelectedUserForDelete(u)}
                                  disabled={isSelf}
                                  className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-dark-bg hover:bg-rose-600/30 text-rose-600 dark:text-rose-400 border border-light-border dark:border-dark-border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                  title={isSelf ? 'Cannot delete your own account' : 'Delete User Account'}
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
            </div>
          )}

          {/* ── TAB 2: AUDIT LOGS ── */}
          {activeTab === 'audit' && (
            <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-light-text dark:text-dark-text">System Audit Log Trail</h2>
                  <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">Immutable record of logins, administrative changes, and catalog updates.</p>
                </div>

                <div className="w-full sm:w-72">
                  <SearchInput
                    placeholder="Search logs by action, user, IP..."
                    onChange={(val) => setAuditSearch(val)}
                  />
                </div>
              </div>

              {filteredAuditLogs.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-light-border dark:border-dark-border rounded-2xl text-xs text-light-text dark:text-dark-muted space-y-1">
                  <p className="text-light-text dark:text-dark-text font-semibold">No audit logs found matching "{auditSearch}"</p>
                  <p className="text-light-text dark:text-dark-muted">Try searching for an action (e.g. login, update_user) or username.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-light-text dark:text-dark-text">
                    <thead className="bg-light-bg dark:bg-dark-bg/80 text-light-text dark:text-dark-muted font-semibold border-b border-light-border dark:border-dark-border uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5 rounded-l-xl">Time</th>
                        <th className="p-3.5">User</th>
                        <th className="p-3.5">Action</th>
                        <th className="p-3.5">Target Entity</th>
                        <th className="p-3.5 rounded-r-xl">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border dark:divide-dark-border font-mono">
                      {filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-light-bg dark:hover:bg-dark-bg/60 transition-colors">
                          <td className="p-3.5 text-light-text dark:text-dark-muted">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="p-3.5 text-light-text dark:text-dark-text">
                            <strong>{log.username || 'System'}</strong> ({log.role_name || '—'})
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-brand-green/10 text-brand-green border border-brand-green/20 font-bold">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3.5 text-light-text dark:text-dark-text">
                            {log.entity_type}:{log.entity_id}
                          </td>
                          <td className="p-3.5 text-light-text dark:text-dark-muted">{log.ip_address || '127.0.0.1'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: CATALOG ── */}
          {activeTab === 'catalog' && (
            <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-5">
              {/* Catalog Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-light-text dark:text-dark-text">Training Catalog Management</h2>
                  <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
                    {catalogItems.length} programs registered · hover a card for Edit / Toggle / Delete actions
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="w-full sm:w-60">
                    <SearchInput
                      placeholder="Search catalog programs..."
                      onChange={(val) => setCatalogSearch(val)}
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-light-text dark:text-dark-muted cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={(e) => setShowInactive(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <Eye className="w-3.5 h-3.5" />
                    Show Inactive
                  </label>

                  <button
                    onClick={openCreateCatalogModal}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-xs transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Program</span>
                  </button>
                </div>
              </div>

              {/* Catalog Grid */}
              {filteredCatalogItems.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-light-border dark:border-dark-border rounded-2xl">
                  <BookOpen className="w-10 h-10 text-light-text dark:text-dark-muted mx-auto mb-3" />
                  <p className="text-light-text dark:text-dark-muted text-sm font-semibold">
                    {catalogSearch ? `No programs found matching "${catalogSearch}"` : 'No catalog programs found.'}
                  </p>
                  <p className="text-xs text-light-text dark:text-dark-muted mt-1">
                    {catalogSearch ? 'Try a different search term or clear the filter.' : 'Click "Add Program" to create the first entry.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCatalogItems.map((item) => (
                    <CatalogCard
                      key={item.training_id}
                      item={item}
                      onEdit={openEditCatalogModal}
                      onToggleStatus={handleToggleCatalogStatus}
                      onDelete={(id, title) => setDeleteCatalogTarget({ id, title })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── User Edit / Password Reset Modal ── */}
      {selectedUserForEdit && (
        <ViewEditUserModal
          user={selectedUserForEdit}
          currentUserRole="system_admin"
          onClose={() => setSelectedUserForEdit(null)}
          onUpdated={loadData}
        />
      )}

      {/* ── User Delete Modal ── */}
      {selectedUserForDelete && (
        <DeleteUserModal
          user={selectedUserForDelete}
          onClose={() => setSelectedUserForDelete(null)}
          onDeleted={loadData}
        />
      )}

      {/* ── Catalog Form Modal ── */}
      {catalogModal.open && (
        <CatalogFormModal
          mode={catalogModal.mode}
          initialData={catalogModal.data}
          onClose={() => setCatalogModal({ open: false, mode: 'create', data: emptyCatalogForm() })}
          onSave={handleSaveCatalogItem}
        />
      )}

      {/* ── Catalog Delete Confirm Modal ── */}
      {deleteCatalogTarget && (
        <DeleteConfirmModal
          trainingId={deleteCatalogTarget.id}
          title={deleteCatalogTarget.title}
          onConfirm={handleDeleteCatalogConfirmed}
          onCancel={() => setDeleteCatalogTarget(null)}
        />
      )}
    </div>
  );
}
