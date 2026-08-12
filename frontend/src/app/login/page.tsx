'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogIn, KeyRound, User, Lock, Sparkles, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Login Form */}
        <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Sign In to QSU Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access your faculty dashboard or administrative panel.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 transition-all disabled:opacity-50 mt-2"
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

        {/* Right: Quick-Fill Test Accounts Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-gold-400" />
            <h2 className="text-base font-bold text-white">Quick-Fill Test Accounts</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Click any seeded test account below to auto-fill credentials for testing:
          </p>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => autofill('admin', 'admin123')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-rose-500/40 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-rose-400 transition-colors">admin</span>
                <span className="text-[11px] text-slate-400 block">System Administrator</span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                system_admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => autofill('dept_bsit', 'dept123')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-gold-500/40 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-gold-400 transition-colors">dept_bsit</span>
                <span className="text-[11px] text-slate-400 block">BSIT Dept Chair</span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold-500/20">
                department_admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => autofill('prof_santos', 'faculty123')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">prof_santos</span>
                <span className="text-[11px] text-slate-400 block">Faculty (Active Recommendation)</span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                has_recommendation
              </span>
            </button>

            <button
              type="button"
              onClick={() => autofill('prof_reyes', 'faculty123')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">prof_reyes</span>
                <span className="text-[11px] text-slate-400 block">Faculty (Ready for Request)</span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold-500/20">
                eligible
              </span>
            </button>

            <button
              type="button"
              onClick={() => autofill('prof_cruz', 'faculty123')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-sky-500/40 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-sky-400 transition-colors">prof_cruz</span>
                <span className="text-[11px] text-slate-400 block">Faculty (Part 3 Resume Flow)</span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                in_progress
              </span>
            </button>

            <button
              type="button"
              onClick={() => autofill('prof_garcia', 'faculty123')}
              className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-600 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-slate-100 transition-colors">prof_garcia</span>
                <span className="text-[11px] text-slate-400 block">Faculty (Fresh Onboarding)</span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
                not_started
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
