'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Sparkles,
  Cpu,
  Brain,
  Layers,
  Target,
  Users,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  GitBranch,
  Database,
  Lock,
  Compass,
  FileSpreadsheet,
  Award,
  Zap,
} from 'lucide-react';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'ml' | 'matching' | 'rbac'>('pipeline');

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      {/* ── 1. Hero Section ── */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-8 sm:p-12 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none dark:opacity-[0.10]">
          <img
            src="/images/hero-2.png"
            alt="QSU Recommender"
            className="w-72 h-72 object-contain"
          />
        </div>

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-green/10 text-brand-green border border-brand-green/20">
            <img src="/images/logo.png" alt="QSU Recommender" className="w-4 h-4 object-contain" />
            <span>AI-Driven Institutional Decision Support System</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-light-text dark:text-white tracking-tight leading-tight">
            How the QSU Training Recommender System Works
          </h1>

          <p className="text-sm sm:text-base text-light-text dark:text-dark-muted leading-relaxed">
            The Quirino State University (QSU) Faculty Training Needs Recommender bridges the gap between individual faculty professional growth and institutional development goals. By analyzing self-assessment survey responses using advanced multi-label machine learning models, the system predicts precise competency needs and matches them to curated training catalog programs.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs shadow-lg transition-all"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/questionnaire"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border text-brand-green hover:border-brand-green font-semibold text-xs transition-all"
            >
              <Compass className="w-4 h-4 text-brand-gold" />
              <span>View Needs Assessment</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Interactive Section Switcher ── */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
          {[
            { id: 'pipeline', label: 'End-to-End Pipeline', icon: GitBranch },
            { id: 'ml', label: 'Machine Learning Model', icon: Brain },
            { id: 'matching', label: 'Recommendation & Aggregation', icon: Target },
            { id: 'rbac', label: 'Governance & Security', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-green/15 text-brand-green border border-brand-green/30 shadow-sm'
                    : 'text-light-text dark:text-dark-muted hover:text-brand-green hover:bg-white dark:bg-dark-bg/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: END-TO-END PIPELINE ── */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border space-y-3 relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green font-extrabold text-sm">
                  1
                </div>
                <h3 className="text-sm font-bold text-light-text dark:text-dark-text">8-Part Needs Assessment</h3>
                <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
                  Faculty complete a comprehensive assessment capturing demographics, academic rank, self-rated competency proficiencies, and emerging technological interests.
                </p>
                <span className="inline-block text-[10px] font-mono text-light-text dark:text-white bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20">
                  Parts 1, 2, 3, 5, 6 Required
                </span>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border space-y-3 relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold font-extrabold text-sm">
                  2
                </div>
                <h3 className="text-sm font-bold text-light-text dark:text-dark-text">Multi-Label ML Inference</h3>
                <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
                  The feature matrix is evaluated by a MultiOutput Random Forest Classifier that outputs continuous probability distributions across 13 priority training categories.
                </p>
                <span className="inline-block text-[10px] font-mono text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20">
                  Probability Estimation
                </span>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border space-y-3 relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-extrabold text-sm">
                  3
                </div>
                <h3 className="text-sm font-bold text-light-text dark:text-dark-text">Catalog Program Matching</h3>
                <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
                  The recommender engine ranks catalog programs using a multi-criteria scoring algorithm factoring in predicted probabilities, delivery modality, duration, and schedule fit.
                </p>
                <span className="inline-block text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Multi-Criteria Fit Score
                </span>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border space-y-3 relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-600 dark:text-rose-400 font-extrabold text-sm">
                  4
                </div>
                <h3 className="text-sm font-bold text-light-text dark:text-dark-text">Department Strategic Plan</h3>
                <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
                  Department Admins aggregate individual faculty needs across departments, identifying high-coverage priority areas to guide training procurement and resource allocation.
                </p>
                <span className="inline-block text-[10px] font-mono text-rose-600 dark:text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  Department Aggregation
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: MACHINE LEARNING MODEL ── */}
        {activeTab === 'ml' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-light-text dark:text-dark-text">Model Architecture</h3>
                    <p className="text-xs text-light-text dark:text-dark-muted">MultiOutput Random Forest Classifier</p>
                  </div>
                </div>

                <p className="text-xs text-light-text dark:text-dark-text leading-relaxed">
                  The core engine uses an ensemble of Decision Trees wrapped in a <code className="text-light-text dark:text-white font-mono text-[11px] bg-brand-green/10 px-1 py-0.5 rounded">MultiOutputClassifier</code>. Unlike single-class classifiers, this enables predicting multiple concurrent training needs per faculty member, reflecting real-world academic multi-disciplinary requirements.
                </p>

                <div className="p-3.5 rounded-2xl bg-light-bg dark:bg-dark-bg/80 border border-light-border dark:border-dark-border space-y-2">
                  <div className="text-[11px] font-bold text-light-text dark:text-dark-text">Model Specifications:</div>
                  <ul className="text-[11px] text-light-text dark:text-dark-muted space-y-1 list-disc list-inside">
                    <li><strong className="text-light-text dark:text-dark-text">Estimator:</strong> Random Forest with 100 Trees (<code className="text-brand-gold font-mono">n_estimators=100</code>)</li>
                    <li><strong className="text-light-text dark:text-dark-text">Outputs:</strong> 13 Multi-Label Target Categories</li>
                    <li><strong className="text-light-text dark:text-dark-text">Evaluation Metrics:</strong> Micro-F1, Macro-F1, Hamming Loss, Jaccard Similarity</li>
                    <li><strong className="text-light-text dark:text-dark-text">Dynamic Registry:</strong> Zero-downtime model retraining and versioning</li>
                  </ul>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-light-text dark:text-dark-text">Feature Engineering</h3>
                    <p className="text-xs text-light-text dark:text-dark-muted">40+ Structured Survey Input Signals</p>
                  </div>
                </div>

                <p className="text-xs text-light-text dark:text-dark-text leading-relaxed">
                  Survey inputs are preprocessed through a scikit-learn pipeline transforming heterogeneous questionnaire responses into a normalized numerical feature vector.
                </p>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border flex items-center justify-between text-xs">
                    <span className="text-light-text dark:text-dark-text font-medium">Demographics & Academic Rank</span>
                    <span className="text-[10px] font-mono text-light-text dark:text-dark-muted">One-Hot Encoded</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border flex items-center justify-between text-xs">
                    <span className="text-light-text dark:text-dark-text font-medium">Proficiency & Importance Ratings</span>
                    <span className="text-[10px] font-mono text-light-text dark:text-white">1–5 Likert Normalized</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border flex items-center justify-between text-xs">
                    <span className="text-light-text dark:text-dark-text font-medium">Emerging Technology Needs</span>
                    <span className="text-[10px] font-mono text-brand-gold">Continuous Weights</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: RECOMMENDATION MATCHING ── */}
        {activeTab === 'matching' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Individual Matching */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-light-text dark:text-dark-text">Individual Fit Scoring Formula</h3>
                    <p className="text-xs text-light-text dark:text-dark-muted">Multi-Criteria Program Match Score</p>
                  </div>
                </div>

                <p className="text-xs text-light-text dark:text-dark-text leading-relaxed">
                  Rather than recommending random programs, every catalog item is evaluated with a weighted multi-factor scoring function:
                </p>

                <div className="p-4 rounded-2xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border font-mono text-xs text-light-text dark:text-white leading-relaxed space-y-1">
                  <div>Score = 0.55 × P(Category)</div>
                  <div className="text-light-text dark:text-dark-muted pl-4">+ 0.20 × ModalityFit</div>
                  <div className="text-light-text dark:text-dark-muted pl-4">+ 0.15 × ScheduleFit</div>
                  <div className="text-light-text dark:text-dark-muted pl-4">+ 0.10 × DurationFit</div>
                </div>

                <p className="text-[11px] text-light-text dark:text-dark-muted leading-relaxed">
                  Every recommendation card shows the calculated probability, fit score, and an explicit explanation (e.g. <em>"Matches predicted Artificial Intelligence need. Aligns with preferred modality (Webinar)."</em>).
                </p>
              </div>

              {/* Department Aggregation */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-light-text dark:text-dark-text">Department Need Aggregation</h3>
                    <p className="text-xs text-light-text dark:text-dark-muted">Strategic Group Planning</p>
                  </div>
                </div>

                <p className="text-xs text-light-text dark:text-dark-text leading-relaxed">
                  Department Admins can run batch analyses aggregating predictions across all eligible department faculty:
                </p>

                <div className="p-4 rounded-2xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border font-mono text-xs text-brand-gold leading-relaxed space-y-1">
                  <div>DeptScore = (1/N) × ∑ P(i) × CoverageWeight</div>
                  <div className="text-light-text dark:text-dark-muted text-[11px] mt-1">Coverage = (Faculty with Category &gt; 0.40) / N</div>
                </div>

                <p className="text-[11px] text-light-text dark:text-dark-muted leading-relaxed">
                  This highlights high-impact group programs that benefit the largest portion of department faculty, optimizing training budgets.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: GOVERNANCE & SECURITY ── */}
        {activeTab === 'rbac' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Role 1 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card/60 border border-rose-500/20 space-y-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  System Admin
                </span>
                <h3 className="text-sm font-bold text-light-text dark:text-dark-text">Institutional Oversight</h3>
                <ul className="text-xs text-light-text dark:text-dark-muted space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>Train & hot-reload ML model versions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>Full CRUD on Training Catalog</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>System-wide user & role administration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>Immutable Audit Log Trail</span>
                  </li>
                </ul>
              </div>

              {/* Role 2 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card/60 border border-brand-gold/20 space-y-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                  Department Admin
                </span>
                <h3 className="text-sm font-bold text-light-text dark:text-dark-text">Department Leadership</h3>
                <ul className="text-xs text-light-text dark:text-dark-muted space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>Monitor department faculty questionnaire completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>Run department-wide aggregated recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>Register & manage department faculty accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>Emergency faculty password resets</span>
                  </li>
                </ul>
              </div>

              {/* Role 3 */}
              <div className="p-6 rounded-3xl bg-white dark:bg-dark-card/60 border border-brand-green/20 space-y-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-green/10 text-brand-green border border-brand-green/20">
                  Faculty Member
                </span>
                <h3 className="text-sm font-bold text-light-text dark:text-dark-text">Professional Growth</h3>
                <ul className="text-xs text-light-text dark:text-dark-muted space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>Multi-part self-paced needs assessment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>Personalized AI training recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>Recommendation history tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                    <span>Profile & password self-management</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Institutional Context / Footer Banner ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card/40 border border-light-border dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-brand-green" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-light-text dark:text-dark-text">Quirino State University</h4>
            <p className="text-xs text-light-text dark:text-dark-muted">
              Empowering faculty excellence through predictive analytics and data-driven professional development.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border text-brand-green hover:border-brand-green text-xs font-bold transition-all shrink-0"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
