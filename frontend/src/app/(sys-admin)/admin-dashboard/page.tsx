'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserListItem, AuditLogItem, CatalogItem } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
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
  options,
  selected,
  onChange,
  required,
}: {
  id: string;
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-300 mb-1">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-left text-white focus:border-emerald-500 focus:outline-none flex items-center justify-between gap-2 min-h-[38px]"
        >
          <span className="flex flex-wrap gap-1 flex-1">
            {selected.length === 0 ? (
              <span className="text-slate-500">Select {label.toLowerCase()}...</span>
            ) : (
              selected.map((v) => (
                <span
                  key={v}
                  className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 px-1.5 py-0.5 rounded text-[10px] font-mono"
                >
                  {v}
                </span>
              ))
            )}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 max-h-48 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="w-full px-3.5 py-2 text-xs text-left flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <span className={selected.includes(opt) ? 'text-emerald-300' : 'text-slate-300'}>
                  {opt}
                </span>
                {selected.includes(opt) && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            ))}
          </div>
        )}
      </div>
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

  const setField = (key: keyof CatalogItem, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    if (!form.categories?.length) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">
              {mode === 'create' ? 'Add Training Program' : `Edit — ${form.training_id}`}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'create'
                ? 'New items are persisted to the database and matched immediately without ML retraining.'
                : 'All fields are updatable. Changes save to the database immediately.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Training ID (optional, shown only on create) + Status */}
          <div className="grid grid-cols-2 gap-4">
            {mode === 'create' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Training ID <span className="text-slate-500 font-normal">(auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  value={form.training_id || ''}
                  onChange={(e) => setField('training_id', e.target.value)}
                  placeholder="e.g. TRN-015"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
            )}
            <div className={mode === 'edit' ? 'col-span-2' : ''}>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status <span className="text-rose-400">*</span>
              </label>
              <select
                value={form.status || 'active'}
                onChange={(e) => setField('status', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {CATALOG_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title || ''}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Full training program title"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Describe the training program content, goals, and target audience..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Categories & Competencies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiSelect
              id="categories"
              label="Categories"
              required
              options={TRAINING_CATEGORIES}
              selected={form.categories || []}
              onChange={(v) => setField('categories', v)}
            />
            <MultiSelect
              id="target_competencies"
              label="Target Competencies"
              options={TARGET_COMPETENCIES}
              selected={form.target_competencies || []}
              onChange={(v) => setField('target_competencies', v)}
            />
          </div>

          {/* Modalities & Durations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiSelect
              id="modalities"
              label="Delivery Modalities"
              options={MODALITIES}
              selected={form.modalities || []}
              onChange={(v) => setField('modalities', v)}
            />
            <MultiSelect
              id="durations"
              label="Duration Options"
              options={DURATIONS}
              selected={form.durations || []}
              onChange={(v) => setField('durations', v)}
            />
          </div>

          {/* Schedules */}
          <MultiSelect
            id="schedules"
            label="Schedule Options"
            options={SCHEDULES}
            selected={form.schedules || []}
            onChange={(v) => setField('schedules', v)}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title?.trim() || !form.categories?.length}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-all"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {mode === 'create' ? 'Create Program' : 'Save Changes'}
            </button>
          </div>
        </form>
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
          ? 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
          : 'border-slate-800/40 bg-slate-950/30 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {item.training_id}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              isActive
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-slate-500 bg-slate-800 border-slate-700'
            }`}
          >
            {item.status}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(item)}
            title="Edit"
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-gold-600/30 text-slate-400 hover:text-gold-400 flex items-center justify-center transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggleStatus(item.training_id, item.status)}
            title={isActive ? 'Deactivate' : 'Activate'}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            {isActive ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onDelete(item.training_id, item.title)}
            title="Delete"
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-bold text-slate-100 text-sm leading-snug group-hover:text-white transition-colors">
        {item.title}
      </h4>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{item.description}</p>
      )}

      {/* Tags row */}
      <div className="space-y-1.5">
        {item.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.categories.map((c) => (
              <span key={c} className="text-[10px] font-mono bg-gold-500/10 text-gold-400 border border-gold-500/20 px-1.5 py-0.5 rounded">
                {c}
              </span>
            ))}
          </div>
        )}
        {item.modalities?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.modalities.map((m) => (
              <span key={m} className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                {m}
              </span>
            ))}
          </div>
        )}
        {item.durations?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.durations.map((d) => (
              <span key={d} className="text-[10px] font-mono bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                ⏱ {d}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Delete Training Program</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            This will permanently remove <strong className="text-slate-200">{title}</strong> ({trainingId}) from the catalog. This cannot be undone.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
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
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'catalog'>('users');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [showInactive, setShowInactive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  // Catalog modal state
  const [catalogModal, setCatalogModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data: Partial<CatalogItem>;
  }>({ open: false, mode: 'create', data: emptyCatalogForm() });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

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
  }, [showInactive]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
  const handleToggleStatus = async (id: string, current: string) => {
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

  // ─── Delete Item ─────────────────────────────────────────────────────────
  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/catalog/${deleteTarget.id}`, {
        headers: { 'X-Admin-API-Key': 'change-this-in-production' },
      });
      showToast('success', 'Deleted', `'${deleteTarget.title}' removed from catalog.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.detail || 'Delete operation failed.');
    }
  };

  const openEditModal = (item: CatalogItem) => {
    setCatalogModal({ open: true, mode: 'edit', data: { ...item } });
  };

  const openCreateModal = () => {
    setCatalogModal({ open: true, mode: 'create', data: emptyCatalogForm() });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. System Header Banner */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>System Administrator Portal</span>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            QSU Recommender Management Console
          </h1>
          <p className="text-xs text-slate-400">
            System-wide user access control, audit logs, training catalog maintenance, and ML model retraining.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/register-admin"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Add Dept Admin</span>
          </Link>

          <button
            onClick={handleTrainModel}
            disabled={training}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
          >
            {training ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Training ML Pipeline...</span>
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
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {(
          [
            { key: 'users', icon: <Users className="w-4 h-4" />, label: `Users & RBAC (${users.length})` },
            { key: 'audit', icon: <History className="w-4 h-4" />, label: `Audit Logs (${auditLogs.length})` },
            { key: 'catalog', icon: <BookOpen className="w-4 h-4" />, label: `Training Catalog (${catalogItems.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Tab Contents */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 font-mono">Loading system administration data...</div>
      ) : (
        <>
          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-bold text-white">System User Directory</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">ID</th>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono text-slate-500">#{u.id}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-100">{u.full_name || u.username}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.username} • {u.email || 'No email'}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            u.role === 'system_admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            u.role === 'department_admin' ? 'bg-gold-500/10 text-gold-400 border-gold-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">{u.department_code || 'System-wide'}</td>
                        <td className="p-3.5">
                          <span className="text-[11px] text-emerald-400 font-semibold">{u.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
              <h2 className="text-base font-bold text-white">System Audit Log Trail</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">Time</th>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">Target Entity</th>
                      <th className="p-3.5 rounded-r-xl">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-3.5 text-slate-200">
                          <strong>{log.username || 'System'}</strong> ({log.role_name || '—'})
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {log.entity_type}:{log.entity_id}
                        </td>
                        <td className="p-3.5 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CATALOG */}
          {activeTab === 'catalog' && (
            <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-5">
              {/* Catalog Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">Training Catalog Management</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All {catalogItems.length} programs · hover a card for Edit / Toggle / Delete actions
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
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
                    onClick={openCreateModal}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-slate-950 font-bold text-xs transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Program</span>
                  </button>
                </div>
              </div>

              {/* Catalog Grid */}
              {catalogItems.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl">
                  <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No catalog programs found.</p>
                  <p className="text-xs text-slate-600 mt-1">Click "Add Program" to create the first entry.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {catalogItems.map((item) => (
                    <CatalogCard
                      key={item.training_id}
                      item={item}
                      onEdit={openEditModal}
                      onToggleStatus={handleToggleStatus}
                      onDelete={(id, title) => setDeleteTarget({ id, title })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Catalog Form Modal */}
      {catalogModal.open && (
        <CatalogFormModal
          mode={catalogModal.mode}
          initialData={catalogModal.data}
          onClose={() => setCatalogModal({ open: false, mode: 'create', data: emptyCatalogForm() })}
          onSave={handleSaveCatalogItem}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          trainingId={deleteTarget.id}
          title={deleteTarget.title}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
