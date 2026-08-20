'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { LogOut, Building, Info, AlertTriangle, MapPin } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'system_admin':
        return { text: 'System Admin', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
      case 'campus_admin':
        return { text: 'Campus Admin', bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' };
      case 'department_admin':
        return { text: 'Dept Admin', bg: 'bg-brand-gold/10 text-brand-gold-dark border-brand-gold/20' };
      case 'faculty':
      default:
        return { text: 'Faculty', bg: 'bg-brand-green/10 text-brand-green border-brand-green/20' };
    }
  };

  const roleStyle = getRoleLabel(user?.role);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-light-border dark:border-dark-border bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto pl-14 pr-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <img
              src="/images/logo.png"
              alt="QSU Recommender"
              className="h-9 w-auto object-contain"
            />
            <div>
              <h1 className="text-sm font-bold text-light-text dark:text-white tracking-tight flex items-center gap-2">
                <span>QSU Recommender</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-brand-gold/10 text-brand-gold-dark border border-brand-gold/20">
                  v2.0
                </span>
              </h1>
              <p className="text-[11px] text-light-text dark:text-dark-text opacity-80 hidden sm:block">
                Multi-Campus Training Needs Recommender
              </p>
            </div>
          </Link>

          {/* Right Section - Desktop Only */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-light-border dark:border-dark-border">
                <Link
                  href="/profile"
                  className="flex flex-col items-end text-right p-1.5 rounded-xl hover:bg-light-bg dark:hover:bg-dark-card transition-colors group"
                  title="View your profile"
                >
                  <span className="text-xs font-semibold text-light-text dark:text-dark-text group-hover:text-brand-green leading-tight transition-colors">
                    {user.full_name || user.username}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleStyle.bg}`}>
                      {roleStyle.text}
                    </span>
                    {user.campus && (
                      <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                        {user.campus.code}
                      </span>
                    )}
                    {user.department && (
                      <span className="text-[10px] font-mono text-light-text dark:text-dark-muted">
                        {user.department.code}
                      </span>
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-brand-green text-light-text dark:text-dark-text hover:text-rose-600 text-xs font-medium transition-all"
                  title="Sign out"
                >
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <LogOut className="w-6 h-6 text-rose-500" />
            </div>

            <div>
              <h3 className="text-base font-bold text-light-text dark:text-dark-text">Sign Out Confirmation</h3>
              <p className="text-xs text-light-text dark:text-dark-muted mt-1 leading-relaxed">
                Are you sure you want to sign out? You will need your username and password to log in again.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text text-xs font-semibold transition-all hover:border-brand-green"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold transition-all shadow-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}