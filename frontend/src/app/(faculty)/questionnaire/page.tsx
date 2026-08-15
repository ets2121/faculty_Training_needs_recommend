'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { QuestionnaireProgress, PartStatus } from '@/types';
import ProgressBar from '@/components/ProgressBar';
import QuestionnairePartForm from '@/components/QuestionnairePartForm';
import { useToast } from '@/context/ToastContext';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function QuestionnairePage() {
  const [progress, setProgress] = useState<QuestionnaireProgress | null>(null);
  const [activePart, setActivePart] = useState<number>(1);
  const [partData, setPartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPart, setLoadingPart] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const loadProgress = async () => {
    try {
      const res = await api.get('/questionnaire/progress');
      setProgress(res.data);
    } catch (err: any) {
      showToast('error', 'Error', err.response?.data?.detail || 'Could not load questionnaire progress.');
    } finally {
      setLoading(false);
    }
  };

  const loadPartData = async (partNum: number) => {
    setLoadingPart(true);
    try {
      const res = await api.get(`/questionnaire/parts/${partNum}`);
      setPartData(res.data.data);
    } catch (err: any) {
      setPartData(null);
    } finally {
      setLoadingPart(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    loadPartData(activePart);
  }, [activePart]);

  const handleSavePart = async (partNum: number, data: any) => {
    await api.put(`/questionnaire/parts/${partNum}`, data);
    await loadProgress();
  };

  const handleNextPart = () => {
    if (activePart < 8) {
      setActivePart(activePart + 1);
    } else {
      showToast('success', 'Questionnaire Complete!', 'All 8 parts submitted. Redirecting to recommendations...');
      router.push('/my-recommendation');
    }
  };

  const handlePrevPart = () => {
    if (activePart > 1) {
      setActivePart(activePart - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-8 h-8 border-4 border-brand-green/30 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs text-light-text dark:text-dark-muted font-mono">Loading Needs Assessment Questionnaire...</p>
      </div>
    );
  }

  if (!progress) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-center pt-1">
        <img src="/images/logo.png" alt="QSU Recommender" className="w-12 h-12 object-contain" />
      </div>
      {/* Step Progress Component */}
      <ProgressBar
        parts={progress.parts}
        currentPart={activePart}
        onSelectPart={(partNum) => setActivePart(partNum)}
      />

      {/* Dynamic Form Step */}
      {loadingPart ? (
        <div className="bg-white dark:bg-dark-card/60 border border-light-border dark:border-dark-border rounded-2xl p-12 text-center">
          <div className="w-6 h-6 border-2 border-brand-green/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-light-text dark:text-dark-muted font-mono">Loading Part {activePart} data...</p>
        </div>
      ) : (
        <QuestionnairePartForm
          partNumber={activePart}
          label={progress.parts.find((p) => p.part_number === activePart)?.label || `Part ${activePart}`}
          initialData={partData}
          onSavePart={handleSavePart}
          onNextPart={handleNextPart}
          onPrevPart={handlePrevPart}
        />
      )}

      {/* Completion Shortcut Header when Eligible */}
      {progress.eligible_for_recommendation && (
        <div className="p-4 rounded-xl border border-brand-green/30 bg-brand-green/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-light-text dark:text-white font-semibold">
            All required parts complete! You can request your recommendation now or complete remaining optional parts.
          </span>
          <button
            onClick={() => router.push('/my-recommendation')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold shrink-0 transition-all shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-gold-dark" />
            <span>Generate Recommendation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
