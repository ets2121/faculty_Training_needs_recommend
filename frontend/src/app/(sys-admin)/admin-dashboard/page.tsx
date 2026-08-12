'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { UserListItem, AuditLogItem, CatalogItem } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/context/ToastContext';
import {
  ShieldAlert,
  Users,
  UserPlus,
  History,
  BookOpen,
  Cpu,
  PlusCircle,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';

export default function SystemAdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'catalog'>('users');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  // New Catalog Item Modal state
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCat, setNewCat] = useState('Artificial Intelligence');
  const [newDesc, setNewDesc] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, aRes, cRes] = await Promise.all([
        api.get('/users'),
        api.get('/audit-logs?limit=50'),
        api.get('/catalog'),
      ]);
      setUsers(uRes.data.users || []);
      setAuditLogs(aRes.data.logs || []);
      setCatalogItems(cRes.data.items || []);
    } catch (err: any) {
      showToast('error', 'Admin Load Failed', err.response?.data?.detail || 'Could not load system data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTrainModel = async () => {
    setTraining(true);
    try {
      const res = await api.post('/training/train', {}, {
        headers: { 'X-Admin-API-Key': 'change-this-in-production' }
      });
      showToast('success', 'Model Retrained!', `Version ${res.data.version} active with ${res.data.metrics?.f1_micro * 100}% micro-F1 accuracy.`);
      await loadData();
    } catch (err: any) {
      showToast('error', 'Training Failed', err.response?.data?.detail || 'Retraining failed. Check dataset.');
    } finally {
      setTraining(false);
    }
  };

  const handleAddCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(
        '/catalog',
        {
          title: newTitle,
          description: newDesc,
          categories: [newCat],
          target_competencies: ['Computer Literacy & Digital Technologies'],
          modalities: ['Webinar'],
          durations: ['One day'],
          schedules: ['Saturdays'],
          status: 'active',
        },
        { headers: { 'X-Admin-API-Key': 'change-this-in-production' } }
      );
      showToast('success', 'Catalog Item Added', `'${newTitle}' added to MySQL catalog without model retraining.`);
      setShowCatalogModal(false);
      setNewTitle('');
      setNewDesc('');
      await loadData();
    } catch (err: any) {
      showToast('error', 'Catalog Addition Failed', err.response?.data?.detail || 'Failed to add item.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. System Header Banner */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>System Administrator Portal</span>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            QSU Recommender Management Console
          </h1>
          <p className="text-xs text-slate-400">
            System-wide user access control, audit logs, training catalog maintenance, and ML model retraining.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/register-admin"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Add Dept Admin</span>
          </Link>

          <button
            onClick={handleTrainModel}
            disabled={training}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
          >
            {training ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Training ML Pipeline...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4 text-gold-300" />
                <span>Trigger ML Retraining</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & RBAC ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'catalog'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Training Catalog ({catalogItems.length})</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 font-mono">Loading system administration data...</div>
      ) : (
        <>
          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-bold text-white">System User Directory</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">ID</th>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono text-slate-500">#{u.id}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-100">{u.full_name || u.username}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.username} • {u.email || 'No email'}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            u.role === 'system_admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            u.role === 'department_admin' ? 'bg-gold-500/10 text-gold-400 border-gold-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">{u.department_code || 'System-wide'}</td>
                        <td className="p-3.5">
                          <span className="text-[11px] text-emerald-400 font-semibold">{u.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
              <h2 className="text-base font-bold text-white">System Audit Log Trail</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">Time</th>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">Target Entity</th>
                      <th className="p-3.5 rounded-r-xl">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-3.5 text-slate-200">
                          <strong>{log.username || 'System'}</strong> ({log.role_name || '—'})
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {log.entity_type}:{log.entity_id}
                        </td>
                        <td className="p-3.5 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CATALOG */}
          {activeTab === 'catalog' && (
            <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-bold text-white">MySQL Training Catalog Programs</h2>

                <button
                  onClick={() => setShowCatalogModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-slate-950 font-bold text-xs transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Catalog Program</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalogItems.map((item) => (
                  <div key={item.training_id} className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400">{item.training_id}</span>
                      <span className="text-[10px] font-bold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded">
                        {item.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-100 text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.categories?.map((c) => (
                        <span key={c} className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Catalog Item Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Training Program to Catalog</h3>
            <p className="text-xs text-slate-400">
              New items persist to MySQL and are immediately available to the recommendation matcher without retraining the ML model.
            </p>

            <form onSubmit={handleAddCatalogItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Program title"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Educational Technology">Educational Technology</option>
                  <option value="Research Methods">Research Methods</option>
                  <option value="Data Analytics">Data Analytics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Program overview..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
