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
  Building,
  Layers,
  Cpu,
  BookOpen,
  Users,
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
    { href: '/dept-faculty', label: 'Faculty Roster', icon: Users },
    { href: '/dept-recommendations', label: 'AI Recommendations', icon: Sparkles },
    { href: '/register-faculty', label: 'Add Faculty Account', icon: UserPlus },
  ];

  const campusAdminNav = [
    { href: '/campus-dashboard', label: 'Campus Overview', icon: LayoutDashboard },
    { href: '/campus-faculty', label: 'Campus Faculty Roster', icon: Users },
    { href: '/campus-recommendations', label: 'Campus AI Synthesis', icon: Sparkles },
    { href: '/campus-departments', label: 'Academic Departments', icon: Building },
    { href: '/register-admin', label: 'Add Dept Admin', icon: UserPlus },
  ];

  const sysAdminNav = [
    { href: '/admin-dashboard', label: 'System Overview', icon: LayoutDashboard },
    { href: '/user-management', label: 'Users & RBAC', icon: Users },
    { href: '/catalog-management', label: 'Training Catalog', icon: BookOpen },
    { href: '/ml-pipeline', label: 'ML Pipeline & Retrain', icon: Cpu },
    { href: '/register-admin', label: 'Add Administrator', icon: UserPlus },
  ];

  const currentNav =
    role === 'system_admin'
      ? sysAdminNav
      : role === 'campus_admin'
      ? campusAdminNav
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
      : role === 'campus_admin'
      ? `${user.campus?.code || 'Campus'} Administration`
      : role === 'department_admin'
      ? `${user.department?.code || 'Dept'} Admin Panel`
      : 'Faculty Portal';

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 overflow-y-auto bg-light-bg/80 dark:bg-dark-bg/80 border-r border-light-border dark:border-dark-border backdrop-blur-md">

        {/* Role section label */}
        <div className="px-4 pt-5 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-light-text dark:text-dark-muted uppercase">
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
                    ? 'bg-brand-green/15 text-brand-green border border-brand-green/30 shadow-sm'
                    : 'text-light-text dark:text-dark-text hover:text-brand-green hover:bg-light-bg dark:hover:bg-dark-card border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-light-text dark:text-white' : 'text-light-text dark:text-dark-muted'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* General / System section label */}
        <div className="px-4 pt-6 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-light-text dark:text-dark-muted uppercase">
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
                    ? 'bg-brand-green/15 text-brand-green border border-brand-green/30 shadow-sm'
                    : 'text-light-text dark:text-dark-text hover:text-brand-green hover:bg-light-bg dark:hover:bg-dark-card border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-light-text dark:text-white' : 'text-light-text dark:text-dark-muted'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom info strip */}
        <div className="mt-auto px-4 py-4 border-t border-light-border/60 dark:border-dark-border/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-3.5 h-3.5 text-brand-green" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-light-text dark:text-dark-text leading-none">QSU Recommender</p>
              <p className="text-[9px] text-light-text dark:text-dark-muted mt-0.5">v2.0 • Multi-Campus</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile: horizontal scrollable strip */}
      <nav className="md:hidden w-full shrink-0 bg-light-bg dark:bg-dark-bg/80 border-b border-light-border dark:border-dark-border/80 backdrop-blur-md px-3 py-2 flex items-center gap-2 overflow-x-auto">
        {[...currentNav, ...generalNav].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-brand-green/15 text-brand-green border border-brand-green/30'
                  : 'text-light-text dark:text-dark-text hover:text-brand-green hover:bg-light-bg dark:hover:bg-dark-card border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-light-text dark:text-white' : 'text-light-text dark:text-dark-muted'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}