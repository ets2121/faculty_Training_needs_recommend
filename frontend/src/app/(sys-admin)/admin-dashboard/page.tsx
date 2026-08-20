'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserListItem, AuditLogItem, CatalogItem } from '@/types';
import { useToast } from '@/context/ToastContext';
import SearchInput from '@/components/SearchInput';
import { TableSkeleton } from '@/components/Skeletons';
import Pagination from '@/components/Pagination';
import { VisualBarChart, VisualDonutBreakdown } from '@/components/AdminVisualCharts';
import {
  ShieldAlert,
  Users,
  BookOpen,
  Cpu,
  History,
  MapPin,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function SystemAdminDashboardPage() {
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Audit Logs Pagination
  const [auditSearch, setAuditSearch] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, aRes, cRes] = await Promise.all([
        api.get('/users'),
        api.get('/audit-logs?limit=100'),
        api.get('/catalog?include_inactive=true'),
      ]);
      setUsers(uRes.data.users || []);
      setAuditLogs(aRes.data.logs || []);
      setCatalogItems(cRes.data.items || []);
    } catch (err: any) {
      showToast('error', 'API Error', err.response?.data?.detail || err.message || 'Could not load system data.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Audit Logs & Pagination
  const filteredAuditLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.toLowerCase().trim();
    return auditLogs.filter(
      (l) =>
        (l.username && l.username.toLowerCase().includes(q)) ||
        l.action.toLowerCase().includes(q) ||
        (l.entity_type && l.entity_type.toLowerCase().includes(q))
    );
  }, [auditLogs, auditSearch]);

  const totalAuditPages = Math.ceil(filteredAuditLogs.length / auditPageSize) || 1;
  const paginatedAuditLogs = useMemo(() => {
    const start = (auditPage - 1) * auditPageSize;
    return filteredAuditLogs.slice(start, start + auditPageSize);
  }, [filteredAuditLogs, auditPage, auditPageSize]);

  // Visual Donut & Bar Charts Data
  const roleBreakdown = useMemo(() => {
    const counts = { system_admin: 0, campus_admin: 0, department_admin: 0, faculty: 0 };
    users.forEach((u) => {
      const r = u.role as keyof typeof counts;
      if (r in counts) counts[r]++;
    });
    return [
      { label: 'System Admin', count: counts.system_admin, color: '#e11d48' },
      { label: 'Campus Admin', count: counts.campus_admin, color: '#0284c7' },
      { label: 'Dept Chair', count: counts.department_admin, color: '#f59e0b' },
      { label: 'Faculty Member', count: counts.faculty, color: '#10b981' },
    ];
  }, [users]);

  const campusDistribution = useMemo(() => {
    const map: Record<string, number> = { DIFFUN: 0, MADDELA: 0, CABARROGUIS: 0 };
    users.forEach((u) => {
      if (u.campus_code && u.campus_code in map) {
        map[u.campus_code]++;
      }
    });
    return [
      { label: 'Diffun (Main)', value: map.DIFFUN, color: '#0284c7' },
      { label: 'Maddela', value: map.MADDELA, color: '#10b981' },
      { label: 'Cabarroguis', value: map.CABARROGUIS, color: '#f59e0b' },
    ];
  }, [users]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span>System Administration Overview</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text dark:text-white tracking-tight">
          QSU Recommender Management Console
        </h1>
        <p className="text-xs text-light-text dark:text-dark-muted max-w-2xl leading-relaxed">
          System-wide governance, user access control, institutional training catalog management, and ML pipeline maintenance across QSU campuses.
        </p>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Registered Accounts</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{users.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">System-wide users</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Training Catalog</span>
            <BookOpen className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{catalogItems.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Active offerings</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>QSU Campuses</span>
            <MapPin className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">3</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Diffun, Maddela, Cabarroguis</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-light-border dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span>Audit Logs</span>
            <History className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{auditLogs.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Logged security events</p>
        </div>
      </div>

      {/* 3. Dedicated Page Modules Link Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-light-text dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-rose-500" />
          <span>System Administration Page Modules</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href="/user-management"
            className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 hover:border-rose-500/50 transition-all shadow-lg hover:shadow-xl group space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-rose-500" />
              </div>
              <ChevronRight className="w-5 h-5 text-light-text dark:text-dark-muted group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-light-text dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Users & RBAC Module
              </h3>
              <p className="text-xs text-light-text dark:text-dark-muted mt-1 leading-relaxed">
                Manage user access credentials, provision Campus/Dept Admins, reassign faculty, and filter by campus.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span>Access Module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            href="/catalog-management"
            className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 hover:border-brand-gold/50 transition-all shadow-lg hover:shadow-xl group space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-brand-gold" />
              </div>
              <ChevronRight className="w-5 h-5 text-light-text dark:text-dark-muted group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-light-text dark:text-white group-hover:text-brand-gold-dark dark:group-hover:text-gold-300 transition-colors">
                Training Catalog Module
              </h3>
              <p className="text-xs text-light-text dark:text-dark-muted mt-1 leading-relaxed">
                Complete CRUD management for institutional training program offerings matched by the AI recommender engine.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono font-semibold text-brand-gold-dark dark:text-gold-300 flex items-center gap-1">
              <span>Access Module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            href="/ml-pipeline"
            className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 hover:border-emerald-500/50 transition-all shadow-lg hover:shadow-xl group space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-emerald-500" />
              </div>
              <ChevronRight className="w-5 h-5 text-light-text dark:text-dark-muted group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-light-text dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                ML Retraining Pipeline
              </h3>
              <p className="text-xs text-light-text dark:text-dark-muted mt-1 leading-relaxed">
                Trigger ML model retraining, view execution stdout logs, monitor progress popups, and inspect feature weights.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>Access Module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Visual Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VisualDonutBreakdown
          title="System Role Distribution (RBAC Architecture)"
          total={users.length}
          items={roleBreakdown}
        />

        <VisualBarChart
          title="User Distribution Across Campuses"
          subtitle={`Total ${users.length} registered accounts across campuses`}
          data={campusDistribution}
        />
      </div>

      {/* 5. System Audit Logs Module */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-light-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-rose-500" />
              <h2 className="text-base font-bold text-light-text dark:text-white">System Audit Trail</h2>
            </div>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">Immutable record of security events and system actions.</p>
          </div>

          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Search audit logs..."
              onChange={(val) => {
                setAuditSearch(val);
                setAuditPage(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filteredAuditLogs.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-light-border dark:border-slate-800 rounded-2xl text-xs text-light-text dark:text-dark-muted">
            No audit logs found matching search.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-light-text dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-light-text dark:text-dark-muted font-semibold border-b border-light-border dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Timestamp</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Target Entity</th>
                    <th className="p-3.5 rounded-r-xl">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border/60 dark:divide-slate-800/60 font-mono text-[11px]">
                  {paginatedAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-light-text dark:text-dark-muted">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-light-text dark:text-white">{log.username || 'System'}</td>
                      <td className="p-3.5 font-bold text-sky-600 dark:text-sky-400">{log.action}</td>
                      <td className="p-3.5 text-light-text dark:text-slate-300">{log.entity_type ? `${log.entity_type} #${log.entity_id || ''}` : '—'}</td>
                      <td className="p-3.5 text-light-text dark:text-dark-muted">{log.ip_address || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={auditPage}
              totalPages={totalAuditPages}
              totalItems={filteredAuditLogs.length}
              pageSize={auditPageSize}
              onPageChange={(p) => setAuditPage(p)}
              onPageSizeChange={(s) => setAuditPageSize(s)}
            />
          </>
        )}
      </div>
    </div>
  );
}
