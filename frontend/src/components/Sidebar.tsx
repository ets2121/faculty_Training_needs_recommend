'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  UserPlus,
  GraduationCap,
  User,
  Info,
  Building,
  Cpu,
  BookOpen,
  Users,
  X,
  Menu,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    { href: '/dept-recommendations', label: 'Model Recommendations', icon: Sparkles },
    { href: '/register-faculty', label: 'Add Faculty Account', icon: UserPlus },
  ];

  const campusAdminNav = [
    { href: '/campus-dashboard', label: 'Campus Overview', icon: LayoutDashboard },
    { href: '/campus-faculty', label: 'Campus Faculty Roster', icon: Users },
    { href: '/campus-recommendations', label: 'Campus Model Synthesis', icon: Sparkles },
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

  const allNav = [...currentNav, ...generalNav];

  const NavLinks = ({ onClose }: { onClose?: () => void }) => (
    <>
      <div className="px-4 pt-5 pb-2">
        <span className="text-[10px] font-bold tracking-widest text-light-text dark:text-dark-muted uppercase">
          {roleLabel}
        </span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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

      <div className="px-4 pt-6 pb-2">
        <span className="text-[10px] font-bold tracking-widest text-light-text dark:text-dark-muted uppercase">
          General
        </span>
      </div>
      <nav className="flex flex-col gap-1 px-3 pb-6">
        {generalNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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
    </>
  );

  return (
    <>
      {/* ─── Desktop Sidebar ──────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 overflow-y-auto bg-light-bg/80 dark:bg-dark-bg/80 border-r border-light-border dark:border-dark-border backdrop-blur-md">
        <NavLinks />
      </aside>

      {/* ─── Mobile: Hamburger button (rendered inside Navbar area via portal-style positioning) ─── */}
      {/* Hamburger trigger — injected into the top-left of the screen on mobile */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3.5 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md hover:border-brand-green transition-all"
        aria-label="Open navigation menu"
      >
        <Menu className="w-4.5 h-4.5 text-light-text dark:text-white" />
      </button>

      {/* ─── Mobile Drawer Overlay ─────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative z-10 flex flex-col w-72 max-w-[85vw] h-full bg-light-bg dark:bg-dark-bg border-r border-light-border dark:border-dark-border shadow-2xl animate-slideInLeft">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-light-border dark:border-dark-border shrink-0">
              <div className="flex items-center gap-2">
                <img src="/images/logo.png" alt="QSU" className="h-7 w-auto object-contain" />
                <div>
                  <p className="text-xs font-bold text-light-text dark:text-white leading-none">QSU Recommender</p>
                  <p className="text-[10px] text-light-text dark:text-dark-muted mt-0.5">v2.0 • Multi-Campus</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-light-text dark:text-dark-muted hover:text-brand-green hover:bg-light-bg dark:hover:bg-dark-card transition-all border border-transparent hover:border-light-border dark:hover:border-dark-border"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto">
              <NavLinks onClose={() => setMobileOpen(false)} />
            </div>

            {/* Mobile Footer with Theme Toggle and Logout */}
            <div className="p-4 border-t border-light-border dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/20 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-light-text dark:text-dark-muted">Theme Settings</span>
                <ThemeToggle />
              </div>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                type="button"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:bg-rose-50 dark:hover:bg-rose-950/40 text-light-text dark:text-dark-text hover:text-rose-600 text-xs font-semibold transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}