'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { UserListItem, CampusOverviewItem } from '@/types';
import { useToast } from '@/context/ToastContext';
import { ArrowRightLeft, Building, MapPin, AlertCircle, RefreshCw, X } from 'lucide-react';

interface TransferFacultyModalProps {
  user: UserListItem;
  onClose: () => void;
  onTransferred: () => void;
}

export default function TransferFacultyModal({ user, onClose, onTransferred }: TransferFacultyModalProps) {
  const [campuses, setCampuses] = useState<CampusOverviewItem[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(user.campus_id || null);
  const [availableDepts, setAvailableDepts] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(user.department_id || null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingDepts, setFetchingDepts] = useState(false);

  const { showToast } = useToast();

  // 1. Fetch available campuses on mount
  useEffect(() => {
    async function loadCampuses() {
      try {
        const res = await api.get('/campuses');
        setCampuses(res.data.campuses || []);
        if (!selectedCampusId && res.data.campuses?.length > 0) {
          setSelectedCampusId(res.data.campuses[0].id);
        }
      } catch (err: any) {
        showToast('error', 'Error', 'Failed to load campuses list.');
      }
    }
    loadCampuses();
  }, []);

  // 2. Fetch departments when selectedCampusId changes
  useEffect(() => {
    if (!selectedCampusId) return;
    async function loadDepts() {
      setFetchingDepts(true);
      try {
        const res = await api.get(`/campuses/${selectedCampusId}/departments`);
        setAvailableDepts(res.data.departments || []);
        if (res.data.departments?.length > 0) {
          // If the faculty is in this campus, preserve selection if matches, else first
          const match = res.data.departments.find((d: any) => d.id === user.department_id);
          setSelectedDeptId(match ? match.id : res.data.departments[0].id);
        } else {
          setSelectedDeptId(null);
        }
      } catch (err: any) {
        showToast('error', 'Error', 'Failed to load departments for selected campus.');
      } finally {
        setFetchingDepts(false);
      }
    }
    loadDepts();
  }, [selectedCampusId]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) {
      showToast('error', 'Selection Required', 'Please select a target department.');
      return;
    }

    // Check if it's the exact same department & campus
    if (selectedCampusId === user.campus_id && selectedDeptId === user.department_id) {
      showToast('info', 'No Changes', 'The faculty member is already assigned to this department and campus.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/users/${user.id}/transfer`, {
        target_department_id: selectedDeptId,
        target_campus_id: selectedCampusId,
        reason: reason.trim() || undefined,
      });

      showToast('success', 'Faculty Transferred!', res.data.message || 'Faculty successfully reassigned.');
      onTransferred();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to transfer faculty member.';
      showToast('error', 'Transfer Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const targetCampus = campuses.find((c) => c.id === selectedCampusId);
  const targetDept = availableDepts.find((d) => d.id === selectedDeptId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-light-text dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-6 h-6 text-sky-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-light-text dark:text-dark-text">Transfer / Reassign Faculty</h3>
            <p className="text-xs text-light-text dark:text-dark-muted">
              Move <strong className="text-light-text dark:text-dark-text">{user.full_name || user.username}</strong> to another campus or department.
            </p>
          </div>
        </div>

        {/* Current Assignment Badge */}
        <div className="p-3.5 rounded-2xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border flex items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-light-text dark:text-dark-muted font-bold">Current Assignment</span>
            <p className="font-semibold text-light-text dark:text-dark-text">
              {user.campus_name || 'No Campus'} • {user.department_name || user.department_code || 'No Dept'}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/20">
            Active
          </span>
        </div>

        {/* Transfer Form */}
        <form onSubmit={handleTransfer} className="space-y-4">
          {/* Target Campus */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-light-text dark:text-dark-text flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
              <span>Target Campus</span>
            </label>
            <select
              value={selectedCampusId || ''}
              onChange={(e) => setSelectedCampusId(Number(e.target.value))}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all outline-none"
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Target Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-light-text dark:text-dark-text flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-brand-gold" />
              <span>Target Department in {targetCampus?.name || 'Selected Campus'}</span>
            </label>
            {fetchingDepts ? (
              <div className="flex items-center gap-2 py-2.5 text-xs text-light-text dark:text-dark-muted">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
                <span>Loading available departments...</span>
              </div>
            ) : availableDepts.length === 0 ? (
              <p className="text-xs text-amber-500 py-1">No active departments found in this campus.</p>
            ) : (
              <select
                value={selectedDeptId || ''}
                onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs focus:ring-2 focus:ring-brand-gold/40 focus:border-brand-gold transition-all outline-none"
              >
                {availableDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Optional Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-light-text dark:text-dark-text">
              Transfer Reason / Reference Notes (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Faculty relocation, institutional reshuffling..."
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text text-xs focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all outline-none"
            />
          </div>

          {/* Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-600 dark:text-sky-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
            <p className="leading-relaxed">
              Upon transfer, the faculty member&apos;s questionnaire responses and history will be preserved and automatically associated with the new department and campus.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text text-xs font-semibold hover:border-light-border transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedDeptId}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Transferring...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Confirm Transfer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}