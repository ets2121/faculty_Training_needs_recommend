'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { UserListItem } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  X,
  User,
  Key,
  Shield,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Building,
  GraduationCap,
  Calendar,
  Clock,
  Lock,
} from 'lucide-react';

const ACADEMIC_RANKS = [
  'Instructor I',
  'Instructor II',
  'Instructor III',
  'Assistant Professor I',
  'Assistant Professor II',
  'Assistant Professor III',
  'Assistant Professor IV',
  'Associate Professor I',
  'Associate Professor II',
  'Associate Professor III',
  'Associate Professor IV',
  'Associate Professor V',
  'Professor I',
  'Professor II',
  'Professor III',
  'Professor IV',
  'Professor V',
  'University Professor',
];

const HIGHEST_DEGREES = [
  "Bachelor's Degree",
  "Master's Units",
  "Master's Degree",
  "Doctoral Units",
  "Doctoral Degree (Ph.D. / Ed.D.)",
  "Post-Doctorate",
];

// ─── View & Edit User Modal ───────────────────────────────────────────────────
export function ViewEditUserModal({
  user,
  currentUserRole,
  onClose,
  onUpdated,
}: {
  user: UserListItem;
  currentUserRole: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'password'>('details');
  const { showToast } = useToast();

  // Edit fields state
  const [fullName, setFullName] = useState(user.full_name || '');
  const [email, setEmail] = useState(user.email || '');
  const [status, setStatus] = useState(user.account_status || 'active');
  const [academicRank, setAcademicRank] = useState(user.academic_rank || 'Instructor I');
  const [highestDegree, setHighestDegree] = useState(user.highest_degree || "Master's Degree");
  const [specialization, setSpecialization] = useState(user.specialization || '');
  const [facultyCode, setFacultyCode] = useState(user.faculty_code || '');

  // Reset password state
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<{ email?: string; general?: string }>({});

  const isFaculty = user.role === 'faculty';
  const isSysAdmin = currentUserRole === 'system_admin';

  // Save profile updates
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEditErrors({});
    try {
      await api.patch(`/users/${user.id}`, {
        full_name: fullName.trim() || undefined,
        email: email.trim() || undefined,
        status: isSysAdmin ? status : undefined,
        academic_rank: isFaculty ? academicRank : undefined,
        highest_degree: isFaculty ? highestDegree : undefined,
        specialization: isFaculty ? specialization.trim() : undefined,
        faculty_code: isFaculty ? facultyCode.trim() : undefined,
      });

      showToast('success', 'User Updated', `Details for '${user.username}' have been updated.`);
      onUpdated();
      onClose();
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.detail || 'Failed to update user.';
      if (status === 409) {
        setEditErrors({ email: msg });
        showToast('error', 'Email Taken', msg);
      } else {
        showToast('error', 'Update Failed', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle emergency password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('error', 'Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/users/${user.id}/reset-password`, {
        new_password: newPassword,
      });

      showToast('success', 'Password Reset', `Emergency password for '${user.username}' successfully changed.`);
      setNewPassword('');
      onClose();
    } catch (err: any) {
      showToast('error', 'Reset Failed', err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green font-bold text-sm">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">{user.full_name || user.username}</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-white dark:bg-dark-bg text-light-text dark:text-dark-text border-light-border dark:border-dark-border">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
                @{user.username} {user.department_code ? `· ${user.department_code}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white dark:bg-dark-bg hover:bg-light-bg dark:hover:bg-dark-card text-light-text dark:text-dark-muted hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-light-border dark:border-dark-border/80">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 pb-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'details'
                ? 'text-brand-green border-emerald-400'
                : 'text-light-text dark:text-dark-muted border-transparent hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Account Details</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 pb-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'password'
                ? 'text-brand-gold border-brand-gold'
                : 'text-light-text dark:text-dark-muted border-transparent hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Emergency Password Reset</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {activeTab === 'details' ? (
            <form id="edit-user-form" onSubmit={handleSaveDetails} className="space-y-4">
              {/* Account Metadata strip */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-[11px]">
                <div className="flex items-center gap-2 text-light-text dark:text-dark-muted">
                  <Calendar className="w-3.5 h-3.5 text-light-text dark:text-dark-muted" />
                  <span>Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-light-text dark:text-dark-muted">
                  <Clock className="w-3.5 h-3.5 text-light-text dark:text-dark-muted" />
                  <span>Last Login: {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</span>
                </div>
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-light-text dark:text-dark-text">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Maria Santos"
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-slate-500 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-light-text dark:text-dark-text">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (editErrors.email) setEditErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="e.g. santos@qsu.edu.ph"
                    className={`w-full bg-light-bg dark:bg-dark-bg border ${
                      editErrors.email ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-light-border dark:border-dark-border hover:border-slate-500 focus:border-emerald-500'
                    } rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-colors`}
                  />
                  {editErrors.email && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <span>⚠️</span> {editErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Status (Sys Admin only) */}
              {isSysAdmin && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-light-text dark:text-dark-text">Account Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-slate-500 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-colors"
                  >
                    <option value="active">Active (Access allowed)</option>
                    <option value="inactive">Inactive (Account locked)</option>
                  </select>
                </div>
              )}

              {/* Faculty-specific details */}
              {isFaculty && (
                <div className="space-y-4 pt-2 border-t border-light-border dark:border-dark-border">
                  <h4 className="text-xs font-bold text-light-text dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> Faculty Academic Info
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-light-text dark:text-dark-text">Faculty ID / Code</label>
                      <input
                        type="text"
                        value={facultyCode}
                        onChange={(e) => setFacultyCode(e.target.value)}
                        placeholder="e.g. BSIT-001"
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-slate-500 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-light-text dark:text-dark-text">Academic Rank</label>
                      <select
                        value={academicRank}
                        onChange={(e) => setAcademicRank(e.target.value)}
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-slate-500 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-colors"
                      >
                        {ACADEMIC_RANKS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-light-text dark:text-dark-text">Highest Educational Attainment</label>
                      <select
                        value={highestDegree}
                        onChange={(e) => setHighestDegree(e.target.value)}
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-slate-500 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-colors"
                      >
                        {HIGHEST_DEGREES.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-light-text dark:text-dark-text">Field of Specialization</label>
                      <input
                        type="text"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g. Computer Science, Mathematics"
                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-slate-500 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form id="reset-password-form" onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-brand-gold/20 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                <div className="text-xs text-brand-gold-dark leading-relaxed">
                  <strong>Emergency Password Override:</strong> This feature immediately sets a new password for <span className="font-mono text-white font-bold">{user.username}</span> without requiring their old password.
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-light-text dark:text-dark-text">New Temporary Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-slate-500 focus:border-amber-500 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-light-text dark:text-dark-muted hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-light-text dark:text-dark-muted">Instruct the user to change their password upon logging in.</p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-light-border dark:border-dark-border bg-light-bg/60 dark:bg-dark-bg/60 rounded-b-3xl flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white dark:bg-dark-bg hover:bg-light-bg dark:hover:bg-dark-card text-light-text dark:text-dark-text text-xs font-semibold transition-all"
          >
            Cancel
          </button>

          {activeTab === 'details' ? (
            <button
              type="submit"
              form="edit-user-form"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-green hover:bg-brand-green-dark disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all"
            >
              {saving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><Check className="w-3.5 h-3.5" /> Save Changes</>}
            </button>
          ) : (
            <button
              type="submit"
              form="reset-password-form"
              disabled={saving || newPassword.length < 6}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all"
            >
              {saving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Resetting...</> : <><Key className="w-3.5 h-3.5" /> Set New Password</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Delete User Confirmation Modal ──────────────────────────────────────────
export function DeleteUserModal({
  user,
  onClose,
  onDeleted,
}: {
  user: UserListItem;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/users/${user.id}`);
      showToast('success', 'User Deleted', `Account '${user.username}' has been removed.`);
      onDeleted();
      onClose();
    } catch (err: any) {
      showToast('error', 'Deletion Failed', err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-dark-card border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-600 dark:text-rose-400" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Delete User Account</h3>
          <p className="text-xs text-light-text dark:text-dark-muted mt-1 leading-relaxed">
            Are you sure you want to delete <strong className="text-light-text dark:text-dark-text">{user.full_name || user.username}</strong> (<span className="font-mono text-light-text dark:text-white">@{user.username}</span>)?
          </p>
          <p className="text-[11px] text-rose-600 dark:text-rose-600 dark:text-rose-400/90 mt-2 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
            ⚠️ This will permanently remove their survey submissions, questionnaire data, and recommendation records.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-dark-bg hover:bg-light-bg dark:hover:bg-dark-card text-light-text dark:text-dark-text text-xs font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {deleting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting...</> : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
}
