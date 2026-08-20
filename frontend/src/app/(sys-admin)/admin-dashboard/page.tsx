'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserListItem, AuditLogItem, CatalogItem } from '@/types';
import { useToast } from '@/context/ToastContext';
import SearchInput from '@/components/SearchInput';
import { TableSkeleton } from '@/components/Skeletons';
import Pagination from '@/components/Pagination';
import {
  ResponsiveDonutChart,
  ResponsiveBarAnalyticsChart,
  ResponsiveHorizontalBarChart,
} from '@/components/AdminCharts';
import {
  ShieldAlert,
  Users,
  BookOpen,
  Cpu,
  History,
  MapPin,
  ArrowRight,
  ChevronRight,
  Layers,
  BarChart3,
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

  // 1. Role Distribution Data
  const roleBreakdown = useMemo(() => {
    const counts = { system_admin: 0, campus_admin: 0, department_admin: 0, faculty: 0 };
    users.forEach((u) => {
      const r = u.role as keyof typeof counts;
      if (r in counts) counts[r]++;
    });
    return [
      { name: 'System Admin', value: counts.system_admin, color: '#159447' },
      { name: 'Campus Admin', value: counts.campus_admin, color: '#D9A62E' },
      { name: 'Dept Chair', value: counts.department_admin, color: '#b8891f' },
      { name: 'Faculty Member', value: counts.faculty, color: '#1FA95A' },
    ];
  }, [users]);

  // 2. Cross-Campus Multi-Bar Distribution
  const campusBarData = useMemo(() => {
    const campuses = [
      { code: 'DIFFUN', name: 'Diffun (Main)' },
      { code: 'MADDELA', name: 'Maddela' },
      { code: 'CABARROGUIS', name: 'Cabarroguis' },
    ];

    return campuses.map((c) => {
      const campusUsers = users.filter((u) => u.campus_code === c.code);
      const facultyCount = campusUsers.filter((u) => u.role === 'faculty').length;
      return {
        category: c.name,
        TotalAccounts: campusUsers.length,
        FacultyMembers: facultyCount,
      };
    });
  }, [users]);

  // 3. Catalog Category Coverage
  const catalogCoverageData = useMemo(() => {
    const map: Record<string, number> = {};
    catalogItems.forEach((item) => {
      if (item.categories && Array.isArray(item.categories)) {
        item.categories.forEach((cat) => {
          map[cat] = (map[cat] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return sorted.length > 0
      ? sorted
      : [
          { label: 'Artificial Intelligence', value: 3 },
          { label: 'Educational Technology', value: 2 },
          { label: 'Data Analytics', value: 2 },
          { label: 'Research Methods', value: 2 },
        ];
  }, [catalogItems]);

  // 4. Faculty Assessment Status Breakdown
  const assessmentStatusData = useMemo(() => {
    const facultyList = users.filter((u) => u.role === 'faculty');
    const counts = { hasRec: 0, eligible: 0, inProgress: 0, notStarted: 0 };

    facultyList.forEach((u) => {
      const s = (u as any).questionnaire_status || '';
      if (s === 'has_recommendation') counts.hasRec++;
      else if (s === 'eligible') counts.eligible++;
      else if (s === 'in_progress') counts.inProgress++;
      else counts.notStarted++;
    });

    return [
      { name: 'Has Recommendation', value: counts.hasRec, color: '#159447' },
      { name: 'Eligible for Rec', value: counts.eligible, color: '#D9A62E' },
      { name: 'In Progress', value: counts.inProgress, color: '#1FA95A' },
      { name: 'Not Started', value: counts.notStarted, color: '#718579' },
    ];
  }, [users]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-5 sm:p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <img src="/images/hero-2.png" alt="QSU Recommender" className="w-40 h-40 object-contain" />
        </div>
        <div className="relative z-10 space-y-2">
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
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span className="font-semibold">Registered Accounts</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{users.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">System-wide users</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span className="font-semibold">Training Catalog</span>
            <BookOpen className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{catalogItems.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Active offerings</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span className="font-semibold">QSU Campuses</span>
            <MapPin className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">3</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Diffun, Maddela, Cabarroguis</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-sm">
          <div className="flex items-center justify-between text-xs text-light-text dark:text-dark-muted mb-2">
            <span className="font-semibold">Audit Logs</span>
            <History className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-light-text dark:text-white">{auditLogs.length}</div>
          <p className="text-[11px] text-light-text dark:text-dark-muted mt-1">Logged security events</p>
        </div>
      </div>

      {/* 3. Visual Charts & Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-gold" />
          <h2 className="text-base font-bold text-light-text dark:text-white">System Analytics &amp; Visual Intelligence</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Role Distribution */}
          <ResponsiveDonutChart
            title="System Role Distribution (RBAC)"
            subtitle="Breakdown of registered accounts by access role"
            data={roleBreakdown}
            totalLabel="Users"
          />

          {/* Chart 2: Campus Distribution Comparison */}
          <ResponsiveBarAnalyticsChart
            title="Cross-Campus User & Faculty Distribution"
            subtitle="Comparison of total registered accounts vs faculty members"
            data={campusBarData}
            bars={[
              { key: 'TotalAccounts', name: 'Total Accounts', color: '#D9A62E' },
              { key: 'FacultyMembers', name: 'Faculty Members', color: '#159447' },
            ]}
          />

          {/* Chart 3: Catalog Domain Coverage */}
          <ResponsiveHorizontalBarChart
            title="Catalog Offerings by Training Domain"
            subtitle="Top competency categories by count of active catalog programs"
            data={catalogCoverageData}
            valueLabel="Programs"
          />

          {/* Chart 4: Faculty Assessment Status */}
          <ResponsiveDonutChart
            title="Faculty Assessment & Recommendation Funnel"
            subtitle="Real-time questionnaire lifecycle progress across all faculty"
            data={assessmentStatusData}
            totalLabel="Faculty"
          />
        </div>
      </div>

      {/* 4. Dedicated Page Modules Link Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-light-text dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-gold" />
          <span>System Administration Page Modules</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          <Link
            href="/user-management"
            className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-rose-500/50 transition-all shadow-md hover:shadow-xl group space-y-3 sm:space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-rose-500" />
              </div>
              <ChevronRight className="w-5 h-5 text-light-text dark:text-dark-muted group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-light-text dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Users &amp; RBAC Module
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
            className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-brand-gold/50 transition-all shadow-md hover:shadow-xl group space-y-3 sm:space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-gold" />
              </div>
              <ChevronRight className="w-5 h-5 text-light-text dark:text-dark-muted group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-light-text dark:text-white group-hover:text-brand-gold-dark transition-colors">
                Training Catalog Module
              </h3>
              <p className="text-xs text-light-text dark:text-dark-muted mt-1 leading-relaxed">
                Complete CRUD management for institutional training program offerings matched by the model recommendation engine.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono font-semibold text-brand-gold-dark flex items-center gap-1">
              <span>Access Module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            href="/ml-pipeline"
            className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-emerald-500/50 transition-all shadow-md hover:shadow-xl group space-y-3 sm:space-y-4 sm:col-span-2 md:col-span-1"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-emerald-500" />
              </div>
              <ChevronRight className="w-5 h-5 text-light-text dark:text-dark-muted group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-light-text dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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

      {/* 5. System Audit Logs Module */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-light-text dark:text-white">Security &amp; System Audit Log</h2>
            <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">
              Showing {filteredAuditLogs.length} immutable activity log records.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Search audit actions, users..."
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
          <div className="py-12 text-center border border-dashed border-light-border dark:border-dark-border rounded-2xl text-xs text-light-text dark:text-dark-muted">
            No audit logs match current search filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-light-border dark:border-dark-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-light-text dark:text-dark-muted border-b border-light-border dark:border-dark-border uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity Type</th>
                    <th className="px-4 py-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                  {paginatedAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-light-text dark:text-dark-muted font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-light-text dark:text-white">
                        {log.username || 'System Engine'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-light-text dark:text-dark-muted">
                        {log.entity_type || 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-mono text-light-text dark:text-dark-muted">
                        {log.ip_address || 'Internal'}
                      </td>
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
