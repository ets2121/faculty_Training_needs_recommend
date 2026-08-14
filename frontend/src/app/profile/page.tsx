'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ProfileSkeleton } from '@/components/Skeletons';
import StatusBadge from '@/components/StatusBadge';
import {
  User,
  Key,
  Shield,
  GraduationCap,
  Building,
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ClipboardList,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  Lock,
} from 'lucide-react';

const ACADEMIC_RANKS = [
  'Instructor I',
  'Instructor II',
  'Instructor III',
  'Assistant Professor I',
  'Assistant Professor II',
  'Assistant Professor III',
  'Assistant Professor IV',
  'Associate Professor I',
  'Associate Professor II',
  'Associate Professor III',
  'Associate Professor IV',
  'Associate Professor V',
  'Professor I',
  'Professor II',
  'Professor III',
  'Professor IV',
  'Professor V',
  'University Professor',
];

const HIGHEST_DEGREES = [
  "Bachelor's Degree",
  "Master's Units",
  "Master's Degree",
  "Doctoral Units",
  "Doctoral Degree (Ph.D. / Ed.D.)",
  "Post-Doctorate",
];

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [facultyData, setFacultyData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile edit state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [academicRank, setAcademicRank] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [highestDegree, setHighestDegree] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const isFaculty = authUser?.role === 'faculty';

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      if (isFaculty) {
        const res = await api.get('/profile');
        setFacultyData(res.data);
        setFullName(res.data.user?.full_name || '');
        setEmail(res.data.user?.email || '');
        setAcademicRank(res.data.faculty_profile?.academic_rank || 'Instructor I');
        setSpecialization(res.data.faculty_profile?.specialization || '');
        setHighestDegree(res.data.faculty_profile?.highest_degree || "Master's Degree");
      } else {
        const res = await api.get('/auth/me');
        setFullName(res.data.full_name || '');
        setEmail(res.data.email || '');
      }
    } catch (err: any) {
      showToast('error', 'Failed to load profile', err.response?.data?.detail || 'Could not fetch profile.');
    } finally {
      setLoading(false);
    }
  }, [isFaculty, showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      if (isFaculty) {
        await api.patch('/profile', {
          full_name: fullName.trim() || undefined,
          email: email.trim() || undefined,
          academic_rank: academicRank,
          specialization: specialization.trim() || undefined,
          highest_degree: highestDegree,
        });
      } else {
        await api.patch(`/users/${authUser?.id}`, {
          full_name: fullName.trim() || undefined,
          email: email.trim() || undefined,
        });
      }

      showToast('success', 'Profile Updated', 'Your profile information has been saved.');
      await refreshUser();
      await loadProfile();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('error', 'Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords Do Not Match', 'Please ensure new and confirm passwords match.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      showToast('success', 'Password Changed', 'Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('error', 'Password Change Failed', err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Header Banner ── */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src="/images/logo.png"
            alt="QSU Recommender"
            className="w-16 h-16 object-contain shrink-0"
          />

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {fullName || authUser?.username}
              </h1>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                authUser?.role === 'system_admin'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : authUser?.role === 'department_admin'
                  ? 'bg-gold-500/10 text-gold-400 border-gold-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {authUser?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              @{authUser?.username} · {authUser?.email || 'No email set'}
            </p>
            {authUser?.department && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>{authUser.department.name} ({authUser.department.code})</span>
              </p>
            )}
          </div>
        </div>

        {/* Quick Questionnaire Status (for Faculty) */}
        {isFaculty && facultyData?.questionnaire_progress && (
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 shrink-0">
            <div className="text-[10px] font-mono font-semibold text-slate-400">Questionnaire Status</div>
            <StatusBadge status={facultyData.questionnaire_progress.questionnaire_status} />
            <div className="text-[11px] text-slate-400 font-mono">
              Parts: {facultyData.questionnaire_progress.total_parts_completed}
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Information</span>
        </button>

        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'password'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* ── TAB 1: Edit Profile ── */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Institutional & Personal Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Keep your contact and academic profile current to ensure accurate recommendation matching.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Maria Santos"
                  className="w-full bg-slate-950 border border-slate-700 hover:border-slate-500 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. santos@qsu.edu.ph"
                  className="w-full bg-slate-950 border border-slate-700 hover:border-slate-500 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                />
              </div>
            </div>

            {isFaculty && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" /> Academic & Specialization Attributes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-200">Academic Rank</label>
                    <select
                      value={academicRank}
                      onChange={(e) => setAcademicRank(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-slate-500 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                    >
                      {ACADEMIC_RANKS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-200">Highest Educational Attainment</label>
                    <select
                      value={highestDegree}
                      onChange={(e) => setHighestDegree(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-slate-500 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                    >
                      {HIGHEST_DEGREES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-200">Field of Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Information Technology, Machine Learning, Pedagogy"
                    className="w-full bg-slate-950 border border-slate-700 hover:border-slate-500 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all"
              >
                {savingProfile ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: Change Password ── */}
      {activeTab === 'password' && (
        <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Change Account Password</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ensure your account is using a strong password of at least 6 characters.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-200">Current Password *</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-slate-950 border border-slate-700 hover:border-slate-500 focus:border-emerald-500 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-200">New Password *</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 chars)"
                  className="w-full bg-slate-950 border border-slate-700 hover:border-slate-500 focus:border-emerald-500 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-200">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-500 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1 pt-1">
                  <AlertCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword || !currentPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all"
              >
                {savingPassword ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...</>
                ) : (
                  <><Lock className="w-3.5 h-3.5" /> Update Password</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
