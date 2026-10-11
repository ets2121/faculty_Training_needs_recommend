'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogIn, User, Lock, ShieldCheck } from 'lucide-react';
import DataPrivacyModal from '@/components/DataPrivacyModal';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptedPrivacy) {
      setError('Please read and accept the Philippine Data Privacy Policy (R.A. No. 10173) to proceed.');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Login card with subtle logo watermark */}
      <div className="relative">
        <div className="absolute -right-8 -top-8 opacity-[0.08] pointer-events-none select-none dark:opacity-[0.10]">
          <img
            src="/images/logo.png"
            alt="QSU Recommender"
            className="w-56 h-56 object-contain"
          />
        </div>
        <div className="max-w-md mx-auto">
          {/* Login Form */}
          <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="QSU Recommender"
                className="w-10 h-10 object-contain"
              />
              <h2 className="text-2xl font-extrabold text-light-text dark:text-white tracking-tight">Sign In to QSU Portal</h2>
            </div>
            <p className="text-xs text-light-text dark:text-dark-muted mt-1">
              Enter your credentials to access your faculty dashboard or administrative panel.
            </p>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-light-text dark:text-dark-muted absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-light-text dark:text-dark-text placeholder:text-light-text dark:placeholder:text-dark-muted focus:border-brand-green focus:ring-1 focus:ring-brand-green/30 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-light-text dark:text-dark-muted absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-light-text dark:text-dark-text placeholder:text-light-text dark:placeholder:text-dark-muted focus:border-brand-green focus:ring-1 focus:ring-brand-green/30 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Philippine Data Privacy Act (RA 10173) Agreement Checkbox */}
              <div className="pt-1">
                <div className="flex items-start gap-2.5 p-3 rounded-xl border border-light-border dark:border-dark-border bg-light-bg/60 dark:bg-dark-bg/50">
                  <input
                    type="checkbox"
                    id="dataPrivacyConsent"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-light-border dark:border-dark-border text-brand-green focus:ring-brand-green/30 cursor-pointer accent-brand-green shrink-0"
                  />
                  <label htmlFor="dataPrivacyConsent" className="text-xs text-light-text dark:text-dark-text leading-snug cursor-pointer select-none">
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-brand-green dark:text-emerald-400 hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 inline shrink-0" />
                      Philippine Data Privacy Policy (R.A. 10173)
                    </button>
                    {' '}and consent to the processing of my faculty competency and training records.
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm shadow-xl transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Philippine Data Privacy Act (RA 10173) Modal */}
      <DataPrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onAccept={() => setAcceptedPrivacy(true)}
      />
    </div>
  );
}
