'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  Users,
  UserPlus,
  BookOpen,
  History,
  ShieldAlert,
  Sliders,
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

  return (
    <aside className="w-full md:w-64 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800/80 p-4 shrink-0 backdrop-blur-md">
      <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
        <div className="hidden md:block px-3 py-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          {role === 'system_admin'
            ? 'System Administration'
            : role === 'department_admin'
            ? `${user.department?.code || 'Department'} Admin`
            : 'Faculty Portal'}
        </div>

        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
