'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Cpu, BookOpen, Users, Loader2 } from 'lucide-react';

interface GeneratingProgressModalProps {
  isOpen: boolean;
  title?: string;
  scope?: string;
  onComplete?: () => void;
}

const STEPS = [
  { id: 1, label: 'Validating Faculty Assessment Data', detail: 'Verifying completed questionnaire parts & profiles', icon: Users },
  { id: 2, label: 'Running Recommendation Model Engine', detail: 'Processing feature vectors with multi-target Random Forest model', icon: Cpu },
  { id: 3, label: 'Aligning Training Catalog & Match Scores', detail: 'Computing priority ranking, coverage, and program match scores', icon: BookOpen },
  { id: 4, label: 'Finalizing Recommendations', detail: 'Persisting synthesis history & assembling actionable training outputs', icon: Sparkles },
];

export default function GeneratingProgressModal({
  isOpen,
  title = 'Generating Training Recommendations',
  scope = 'Department Synthesis',
}: GeneratingProgressModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setProgress(15);
      return;
    }

    const t1 = setTimeout(() => { setCurrentStep(2); setProgress(45); }, 500);
    const t2 = setTimeout(() => { setCurrentStep(3); setProgress(75); }, 1200);
    const t3 = setTimeout(() => { setCurrentStep(4); setProgress(95); }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-7 sm:p-8 shadow-2xl space-y-6">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-brand-gold/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                {scope}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-light-text dark:text-white mt-0.5">
              {title}
            </h3>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center justify-between text-xs font-semibold text-light-text dark:text-dark-muted">
            <span>Inference Pipeline Progress</span>
            <span className="font-mono text-violet-500 dark:text-violet-400">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-brand-gold transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pipeline Step List */}
        <div className="space-y-3 relative z-10">
          {STEPS.map((step) => {
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3.5 p-3 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-violet-500/10 border-violet-500/30 dark:bg-violet-500/15 dark:border-violet-500/40 shadow-sm'
                    : isDone
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-transparent border-light-border/40 dark:border-dark-border/40 opacity-50'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[11px] font-bold text-slate-400">
                      {step.id}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-bold ${
                      isCurrent
                        ? 'text-violet-600 dark:text-violet-300'
                        : isDone
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-light-text dark:text-dark-muted'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] text-light-text dark:text-dark-muted truncate mt-0.5">
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-light-text dark:text-dark-muted relative z-10 pt-1">
          Processing eligible faculty assessments through the QSU ML Pipeline...
        </p>
      </div>
    </div>
  );
}
