'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  UserPlus,
  GraduationCap,
  User,
  Info,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

  const facultyNav = [
    { href: '/faculty-dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { href: '/questionnaire', label: 'Needs Assessment', icon: ClipboardList },
    { href: '/my-recommendation', label: 'My Recommendations', icon: Sparkles },
  ];

  const deptAdminNav = [
    { href: '/dept-dashboard', label: 'Dept Overview', icon: LayoutDashboard },
    { href: '/register-faculty', label: 'Add Faculty Account', icon: UserPlus },
  ];

  const sysAdminNav = [
    { href: '/admin-dashboard', label: 'System Overview', icon: LayoutDashboard },
    { href: '/register-admin', label: 'Add Dept Admin', icon: UserPlus },
  ];

  const currentNav =
    role === 'system_admin'
      ? sysAdminNav
      : role === 'department_admin'
      ? deptAdminNav
      : facultyNav;

  const generalNav = [
    { href: '/profile', label: 'My Profile', icon: User },
    { href: '/about', label: 'About System', icon: Info },
  ];

  const roleLabel =
    role === 'system_admin'
      ? 'System Administration'
      : role === 'department_admin'
      ? `${user.department?.code || 'Dept'} Admin Panel`
      : 'Faculty Portal';

  return (
    <>
      {/*
        Desktop sidebar:
        - flex-shrink-0 so it never collapses
        - overflow-y-auto so it can scroll its OWN content if nav items exceed height
        - The parent layout constrains its height via overflow-hidden on the row container
      */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 overflow-y-auto bg-slate-950/70 border-r border-slate-800/80 backdrop-blur-md">

        {/* Role section label */}
        <div className="px-4 pt-5 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            {roleLabel}
          </span>
        </div>

        {/* Primary Role Nav links */}
        <nav className="flex flex-col gap-1 px-3">
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* General / System section label */}
        <div className="px-4 pt-6 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            General
          </span>
        </div>

        {/* General Nav links */}
        <nav className="flex flex-col gap-1 px-3 pb-6">
          {generalNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom info strip */}
        <div className="mt-auto px-4 py-4 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-300 leading-none">QSU Recommender</p>
              <p className="text-[9px] text-slate-500 mt-0.5">v2.0 · Production</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile: horizontal scrollable strip */}
      <nav className="md:hidden w-full shrink-0 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md px-3 py-2 flex items-center gap-2 overflow-x-auto">
        {[...currentNav, ...generalNav].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
