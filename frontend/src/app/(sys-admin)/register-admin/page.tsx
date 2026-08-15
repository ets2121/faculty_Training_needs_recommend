'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { UserPlus, ArrowLeft, Shield } from 'lucide-react';

export default function RegisterAdminPage() {
  const { showToast } = useToast();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [deptCode, setDeptCode] = useState('BSIT');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/register', {
        username,
        password,
        email,
        full_name: fullName,
        role: 'department_admin',
        department_code: deptCode,
      });

      showToast('success', 'Dept Admin Created', `Account for '${username}' was created for department ${deptCode}.`);
      router.push('/admin-dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create department admin account.';
      showToast('error', 'Registration Error', msg);
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
        <span>Back to System Administration Console</span>
      </button>

      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="QSU Recommender"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-brand-green">Register Department Admin Account</h1>
            <p className="text-xs text-light-text dark:text-dark-muted mt-1">
              Create an administrative account for a department chair or head.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">Department *</label>
              <select
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                className="w-full bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-dark-text focus:border-brand-green focus:outline-none"
              >
                {['BSIT', 'BSED', 'BSCE', 'BEED', 'BSBA', 'BSCS', 'BAELS', 'BSMATH', 'BSHM', 'BSMidwifery'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. dept_bsit"
                className="w-full bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-dark-text placeholder:text-light-text dark:placeholder:text-dark-muted focus:border-brand-green focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Temporary password"
                className="w-full bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-dark-text placeholder:text-light-text dark:placeholder:text-dark-muted focus:border-brand-green focus:outline-none"
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
                className="w-full bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-dark-text placeholder:text-light-text dark:placeholder:text-dark-muted focus:border-brand-green focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="clara@qsu.edu.ph"
              className="w-full bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-dark-text placeholder:text-light-text dark:placeholder:text-dark-muted focus:border-brand-green focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? (
                <span>Creating Admin Account...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register Department Admin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
