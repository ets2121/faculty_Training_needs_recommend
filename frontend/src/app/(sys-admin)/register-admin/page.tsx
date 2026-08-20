'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, ArrowLeft, Building, MapPin, Shield } from 'lucide-react';
import { CampusOverviewItem } from '@/types';

export default function RegisterAdminPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const isSystemAdmin = authUser?.role === 'system_admin';
  const isCampusAdmin = authUser?.role === 'campus_admin';

  const [roleToRegister, setRoleToRegister] = useState<'department_admin' | 'campus_admin'>(
    isSystemAdmin ? 'department_admin' : 'department_admin'
  );

  const [campuses, setCampuses] = useState<CampusOverviewItem[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(authUser?.campus?.id || null);
  const [availableDepts, setAvailableDepts] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ username?: string; email?: string; general?: string }>({});

  useEffect(() => {
    async function loadCampuses() {
      try {
        const res = await api.get('/campuses');
        setCampuses(res.data.campuses || []);
        if (!selectedCampusId && res.data.campuses?.length > 0) {
          const initial = isCampusAdmin ? authUser?.campus?.id || res.data.campuses[0].id : res.data.campuses[0].id;
          setSelectedCampusId(initial);
        }
      } catch (err) {
        console.error('Failed to load campuses:', err);
      }
    }
    loadCampuses();
  }, [authUser, isCampusAdmin]);

  useEffect(() => {
    if (!selectedCampusId) return;
    async function loadDepts() {
      try {
        const res = await api.get(`/campuses/${selectedCampusId}/departments`);
        setAvailableDepts(res.data.departments || []);
        if (res.data.departments?.length > 0) {
          setSelectedDeptId(res.data.departments[0].id);
        } else {
          setSelectedDeptId(null);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    }
    loadDepts();
  }, [selectedCampusId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roleToRegister === 'department_admin' && !selectedDeptId) {
      showToast('error', 'Validation Error', 'Please select a department for the Department Admin.');
      return;
    }
    if (roleToRegister === 'campus_admin' && !selectedCampusId) {
      showToast('error', 'Validation Error', 'Please select a campus for the Campus Admin.');
      return;
    }

    setSubmitting(true);
    setFormErrors({});
    try {
      await api.post('/auth/register', {
        username: username.trim(),
        password: password.trim(),
        email: email.trim() || undefined,
        full_name: fullName.trim() || undefined,
        role: roleToRegister,
        campus_id: selectedCampusId,
        department_id: roleToRegister === 'department_admin' ? selectedDeptId : undefined,
      });

      showToast(
        'success',
        'Administrator Created',
        `Account for '${username}' was created successfully as ${roleToRegister.replace('_', ' ')}.`
      );
      
      if (isCampusAdmin) {
        router.push('/campus-dashboard');
      } else {
        router.push('/admin-dashboard');
      }
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.detail || 'Failed to create administrator account.';
      
      if (status === 409) {
        const lowerMsg = String(msg).toLowerCase();
        if (lowerMsg.includes('username')) {
          setFormErrors((prev) => ({ ...prev, username: msg }));
          showToast('error', 'Username Taken', msg);
        } else if (lowerMsg.includes('email')) {
          setFormErrors((prev) => ({ ...prev, email: msg }));
          showToast('error', 'Email Already Exists', msg);
        } else {
          setFormErrors((prev) => ({ ...prev, general: msg }));
          showToast('error', 'Conflict Error', msg);
        }
      } else {
        showToast('error', 'Registration Error', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        type="button"
        className="inline-flex items-center gap-1.5 text-xs text-light-text dark:text-dark-muted hover:text-brand-green transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Console</span>
      </button>

      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-sky-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-light-text dark:text-white">Provision Administrator Account</h1>
            <p className="text-xs text-light-text dark:text-dark-muted mt-1">
              Create an administrative account for Campus or Department supervision.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin Role Toggle for System Admin */}
          {isSystemAdmin && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text">Administrator Level *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRoleToRegister('department_admin')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                    roleToRegister === 'department_admin'
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold-dark dark:text-gold-300'
                      : 'border-light-border dark:border-dark-border text-light-text dark:text-dark-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-brand-gold" />
                    <span>Department Admin</span>
                  </div>
                  <p className="text-[10px] font-normal text-light-text dark:text-dark-muted mt-1">Supervises a single academic program</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRoleToRegister('campus_admin')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                    roleToRegister === 'campus_admin'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                      : 'border-light-border dark:border-dark-border text-light-text dark:text-dark-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-500" />
                    <span>Campus Admin</span>
                  </div>
                  <p className="text-[10px] font-normal text-light-text dark:text-dark-muted mt-1">Supervises an entire university campus</p>
                </button>
              </div>
            </div>
          )}

          {/* Campus Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-light-text dark:text-dark-text">Assigned Campus *</label>
            <select
              value={selectedCampusId || ''}
              onChange={(e) => setSelectedCampusId(Number(e.target.value))}
              disabled={isCampusAdmin}
              className="w-full bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-light-text dark:text-dark-text focus:border-brand-green focus:outline-none"
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            {isCampusAdmin && (
              <p className="text-[11px] text-light-text dark:text-dark-muted">Locked to your assigned campus ({authUser?.campus?.name}).</p>
            )}
          </div>

          {/* Department Selector (only for department_admin) */}
          {roleToRegister === 'department_admin' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text">Assigned Department Program *</label>
              {availableDepts.length === 0 ? (
                <p className="text-xs text-amber-500">No departments found in this campus. Create one first.</p>
              ) : (
                <select
                  value={selectedDeptId || ''}
                  onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                  required
                  className="w-full bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-light-text dark:text-dark-text focus:border-brand-green focus:outline-none"
                >
                  {availableDepts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (formErrors.username) setFormErrors((prev) => ({ ...prev, username: undefined }));
                }}
                placeholder="e.g. admin_diffun_it"
                className={`w-full bg-white dark:bg-dark-bg border ${
                  formErrors.username ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-light-border dark:border-dark-border'
                } rounded-xl px-3.5 py-2.5 text-xs text-light-text dark:text-dark-text focus:border-brand-green focus:outline-none transition-all`}
              />
              {formErrors.username && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <span>⚠️</span> {formErrors.username}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Temporary password"
                className="w-full bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-light-text dark:text-dark-text focus:border-brand-green focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Maria Clara"
                className="w-full bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-light-text dark:text-dark-text focus:border-brand-green focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="clara@qsu.edu.ph"
                className={`w-full bg-white dark:bg-dark-bg border ${
                  formErrors.email ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-light-border dark:border-dark-border'
                } rounded-xl px-3.5 py-2.5 text-xs text-light-text dark:text-dark-text focus:border-brand-green focus:outline-none transition-all`}
              />
              {formErrors.email && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                  <span>⚠️</span> {formErrors.email}
                </p>
              )}
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? (
                <span>Provisioning Account...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register {roleToRegister === 'campus_admin' ? 'Campus Admin' : 'Department Admin'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
