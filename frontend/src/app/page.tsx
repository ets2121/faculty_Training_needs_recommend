'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, ArrowRight, ShieldCheck, Database, Award } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'faculty') router.push('/faculty-dashboard');
        else if (user.role === 'department_admin') router.push('/dept-dashboard');
        else if (user.role === 'system_admin') router.push('/admin-dashboard');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      {/* Hero Header */}
      <div className="relative -mx-6 sm:-mx-8 lg:-mx-10 overflow-hidden border-y border-slate-800 shadow-2xl">
        <div className="absolute inset-0">
          <img
            src="/images/hero.png"
            alt="QSU Recommender"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-slate-900/60" />
        </div>

        <div className="relative px-6 py-16 sm:py-20 lg:px-10 lg:py-24 text-center space-y-6 max-w-5xl mx-auto">
          <div className="flex justify-center">
            <img
              src="/images/logo.png"
              alt="QSU Recommender"
              className="h-14 w-auto object-contain drop-shadow-xl"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span>QSU Faculty Training Needs Recommender System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            AI-Driven Faculty Development & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-gold-400 bg-clip-text text-transparent">
              Training Program Recommendations
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A research-backed system matching faculty competency assessments and emerging training needs to institutional catalog programs using machine learning.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 transition-all hover:scale-105"
            >
              <span>Sign In to Access Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white">Multi-Label ML Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Predicts underlying competency training categories with score confidence and transparent reasoning.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-gold-400" />
          </div>
          <h3 className="text-base font-bold text-white">Strict RBAC & Audit</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Isolated access control for Faculty, Department Chairs, and System Administrators with full audit logging.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-sky-400" />
          </div>
          <h3 className="text-base font-bold text-white">8-Part Form Persistence</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Save questionnaire progress step-by-step with automatic status tracking from onboarding to final results.
          </p>
        </div>
      </div>
    </div>
  );
}
