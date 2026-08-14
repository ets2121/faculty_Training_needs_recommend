'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { LogOut, GraduationCap, Building, Info, AlertTriangle } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'system_admin':
        return { text: 'System Admin', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'department_admin':
        return { text: 'Department Admin', bg: 'bg-gold-500/10 text-gold-400 border-gold-500/20' };
      case 'faculty':
      default:
        return { text: 'Faculty', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    }
  };

  const roleStyle = getRoleLabel(user?.role);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 dark:border-slate-800/80 bg-slate-950/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-gold-500 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                <span>QSU Recommender</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.0
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Faculty Training Needs & Recommendation System
              </p>
            </div>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* About link */}
            <Link
              href="/about"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <Info className="w-3.5 h-3.5 text-gold-400" />
              <span className="hidden sm:inline">About</span>
            </Link>

            <ThemeToggle />

            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                {/* User Profile Summary (Clickable to /profile) */}
                <Link
                  href="/profile"
                  className="hidden md:flex flex-col items-end text-right p-1.5 rounded-xl hover:bg-slate-800/40 transition-colors group"
                  title="View your profile"
                >
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 leading-tight transition-colors">
                    {user.full_name || user.username}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleStyle.bg}`}>
                      {roleStyle.text}
                    </span>
                    {user.department && (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-500" />
                        {user.department.code}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Logout Button (Opens Confirmation Modal) */}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-rose-950/40 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 text-xs font-medium transition-all"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <LogOut className="w-6 h-6 text-rose-400" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Sign Out Confirmation</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to sign out? You will need your username and password to log in again.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/40"
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
