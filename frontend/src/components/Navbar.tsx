'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { LogOut, GraduationCap, User as UserIcon, Shield, Building } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-colors">
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
          <ThemeToggle />

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              {/* User Profile Summary */}
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
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
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
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
  );
}
