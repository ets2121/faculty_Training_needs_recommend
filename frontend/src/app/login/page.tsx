'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogIn, KeyRound, User, Lock, Sparkles, UserCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Environment variable controls whether demo accounts are available by default
  const envShowDemo = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== 'false' && process.env.NEXT_PUBLIC_ENABLE_QUICK_LOGIN !== 'false';
  const [showDemoAccounts, setShowDemoAccounts] = useState<boolean>(envShowDemo);

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const autofill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
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
        <div className={`grid grid-cols-1 ${showDemoAccounts ? 'md:grid-cols-2' : 'max-w-md mx-auto'} gap-8 items-start transition-all`}>
          {/* Left / Center: Login Form */}
          <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="QSU Recommender"
                className="w-10 h-10 object-contain"
              />
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Sign In to QSU Portal</h2>
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
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-light-text dark:text-dark-text placeholder:text-light-text dark:placeholder:text-dark-muted focus:border-emerald-500 focus:outline-none transition-colors"
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
                    className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-light-text dark:text-dark-text placeholder:text-light-text dark:placeholder:text-dark-muted focus:border-emerald-500 focus:outline-none transition-colors"
                  />
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

            {/* Toggle Demo Accounts Button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="inline-flex items-center gap-1.5 text-xs text-light-text dark:text-dark-muted hover:text-brand-green font-medium transition-colors"
              >
                {showDemoAccounts ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide Quick-Fill Test Accounts</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show Quick-Fill Test Accounts</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Quick-Fill Test Accounts Card */}
          {showDemoAccounts && (
            <div className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-brand-gold" />
                  <h2 className="text-base font-bold text-light-text dark:text-dark-text">Quick-Fill Test Accounts</h2>
                </div>
                <span className="text-[10px] font-mono text-brand-green bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20">
                  demo env
                </span>
              </div>
              <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
                Click any seeded test account below to auto-fill credentials for testing:
              </p>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => autofill('admin', 'admin123')}
                  className="w-full text-left p-3 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-rose-500/40 transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-rose-600 transition-colors">admin</span>
                    <span className="text-[11px] text-light-text dark:text-dark-muted block">System Administrator</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-600 dark:text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    system_admin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => autofill('dept_bsit', 'dept123')}
                  className="w-full text-left p-3 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-brand-gold transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-brand-gold-dark transition-colors">dept_bsit</span>
                    <span className="text-[11px] text-light-text dark:text-dark-muted block">BSIT Dept Chair</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold-dark border border-brand-gold/20">
                    department_admin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => autofill('prof_santos', 'faculty123')}
                  className="w-full text-left p-3 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-brand-green transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-brand-green transition-colors">prof_santos</span>
                    <span className="text-[11px] text-light-text dark:text-dark-muted block">Faculty (Active Recommendation)</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-green/10 text-brand-green border border-brand-green/20">
                    has_recommendation
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => autofill('prof_reyes', 'faculty123')}
                  className="w-full text-left p-3 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-brand-gold transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-brand-gold-dark transition-colors">prof_reyes</span>
                    <span className="text-[11px] text-light-text dark:text-dark-muted block">Faculty (Ready for Request)</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold-dark border border-brand-gold/20">
                    eligible
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => autofill('prof_cruz', 'faculty123')}
                  className="w-full text-left p-3 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-sky-500/40 transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-sky-600 transition-colors">prof_cruz</span>
                    <span className="text-[11px] text-light-text dark:text-dark-muted block">Faculty (Part 3 Resume Flow)</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 border border-sky-500/20">
                    in_progress
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => autofill('prof_garcia', 'faculty123')}
                  className="w-full text-left p-3 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-light-border dark:hover:border-dark-border transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-light-text dark:group-hover:text-dark-text transition-colors">prof_garcia</span>
                    <span className="text-[11px] text-light-text dark:text-dark-muted block">Faculty (Fresh Onboarding)</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-muted border border-light-border dark:border-dark-border">
                    not_started
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
