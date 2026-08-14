'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { RecommendationResult, QuestionnaireProgress } from '@/types';
import RecommendationCard from '@/components/RecommendationCard';
import { RecommendationSkeleton } from '@/components/Skeletons';
import { useToast } from '@/context/ToastContext';
import { Sparkles, RefreshCw, AlertCircle, ArrowLeft, ClipboardList, Clock } from 'lucide-react';

export default function MyRecommendationPage() {
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [progress, setProgress] = useState<QuestionnaireProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const progRes = await api.get('/questionnaire/progress');
      setProgress(progRes.data);

      try {
        const recRes = await api.get('/profile/last-recommendation');
        if (recRes.data.recommendation) {
          setRecommendation(recRes.data.recommendation);
          setTimestamp(recRes.data.last_recommendation_at || recRes.data.recommendation.generated_at || null);
        }
      } catch (e) {
        console.error('No stored recommendation found:', e);
      }
    } catch (err: any) {
      showToast('error', 'Error', err.response?.data?.detail || 'Could not fetch recommendation status.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequest = async () => {
    // Clear stale result immediately so skeleton shows cleanly
    setRecommendation(null);
    setTimestamp(null);
    setRequesting(true);
    showToast('info', 'AI Recommender Running', 'Analyzing your needs assessment and matching catalog programs...');

    try {
      const res = await api.post('/profile/request-recommendation');
      // Authoritative fresh timestamp always comes from the API
      const freshTimestamp = res.data.generated_at || new Date().toISOString();
      setRecommendation(res.data);
      setTimestamp(freshTimestamp);
      showToast('success', 'Recommendation Generated!', 'Your fresh training needs recommendations are ready.');

      const progRes = await api.get('/questionnaire/progress');
      setProgress(progRes.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to generate recommendation.';
      showToast('error', 'Request Failed', msg);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <RecommendationSkeleton message="Loading Your Training Recommendations..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="QSU Recommender"
            className="w-9 h-9 object-contain"
          />
          <Link
            href="/faculty-dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {progress?.eligible_for_recommendation && (
          <button
            onClick={handleRequest}
            disabled={requesting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
          >
            {requesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Running ML Model...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-gold-300" />
                <span>{recommendation ? 'Re-Run Recommendation' : 'Generate Recommendation'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* When requesting (re-running or generating), hide previous result and show skeleton */}
      {requesting ? (
        <RecommendationSkeleton message="Analyzing Survey Data & Generating Fresh Recommendations..." />
      ) : (
        <>
          {/* Guidance if not eligible */}
          {!progress?.eligible_for_recommendation && !recommendation && (
            <div className="p-8 rounded-3xl border border-gold-500/30 bg-gold-500/10 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-gold-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Needs Assessment Incomplete</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                You must complete Parts 1, 2, 3, 5, and 6 of the Needs Assessment Questionnaire before requesting an AI recommendation.
              </p>
              <div className="pt-2">
                <Link
                  href="/questionnaire"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Complete Questionnaire Now</span>
                </Link>
              </div>
            </div>
          )}

          {/* Render Recommendation Card if available */}
          {recommendation && <RecommendationCard result={recommendation} timestamp={timestamp} />}
        </>
      )}
    </div>
  );
}
