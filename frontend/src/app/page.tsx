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
      <div className="relative -mx-6 sm:-mx-8 lg:-mx-10 overflow-hidden border-b border-dark-border dark:border-dark-border shadow-2xl">
        <div className="absolute inset-0">
          <img
            src="/images/hero.png"
            alt="QSU Recommender"
            className="w-full h-full object-cover opacity-60 dark:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/60 to-white/40 dark:from-dark-bg dark:via-dark-bg/90 dark:to-dark-bg/70" />
        </div>

        <div className="relative px-6 py-16 sm:py-20 lg:px-10 lg:py-24 text-center space-y-6 max-w-5xl mx-auto">
          <div className="flex justify-center">
            <img
              src="/images/logo.png"
              alt="QSU Recommender"
              className="h-16 w-auto object-contain drop-shadow-md"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-brand-green/10 text-brand-green border border-brand-green/25 backdrop-blur-sm">
            <span>QSU Faculty Training Needs Recommender System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-light-text dark:text-white tracking-tight leading-tight">
            Model-Driven Faculty Development & <br className="hidden sm:inline" />
            <span className="text-brand-gold">
              Training Program Recommendations
            </span>
          </h1>

          <p className="text-sm sm:text-base text-light-text dark:text-dark-muted max-w-2xl mx-auto leading-relaxed">
            A research-backed system matching faculty competency assessments and emerging training needs to institutional catalog programs using machine learning.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm shadow-xl shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Sign In to Access Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-xl backdrop-blur-md space-y-3 hover:border-brand-green/50 transition-all group">
          <div className="w-11 h-11 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-brand-green" />
          </div>
          <h3 className="text-base font-bold text-light-text dark:text-white">Multi-Label ML Engine</h3>
          <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
            Predicts underlying competency training categories with score confidence and transparent reasoning.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-xl backdrop-blur-md space-y-3 hover:border-brand-gold/50 transition-all group">
          <div className="w-11 h-11 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-brand-gold" />
          </div>
          <h3 className="text-base font-bold text-light-text dark:text-white">Strict RBAC & Audit</h3>
          <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
            Isolated access control for Faculty, Department Chairs, and System Administrators with full audit logging.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-xl backdrop-blur-md space-y-3 hover:border-brand-green/50 transition-all group">
          <div className="w-11 h-11 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green group-hover:scale-105 transition-transform">
            <Database className="w-5 h-5 text-brand-green" />
          </div>
          <h3 className="text-base font-bold text-light-text dark:text-white">8-Part Form Persistence</h3>
          <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
            Save questionnaire progress step-by-step with automatic status tracking from onboarding to final results.
          </p>
        </div>
      </div>
    </div>
  );
}
