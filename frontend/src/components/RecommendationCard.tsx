import React from 'react';
import { RecommendationResult, CatalogRecommendationItem } from '@/types';
import { Award, BookOpen, Check, Sparkles, Target } from 'lucide-react';
import { formatPercent } from '@/lib/utils';

interface RecommendationCardProps {
  result: RecommendationResult;
  facultyName?: string;
}

export default function RecommendationCard({ result, facultyName }: RecommendationCardProps) {
  const predictions = result.prediction?.top_predictions || [];
  const items: CatalogRecommendationItem[] = result.recommendations || [];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-gold-950/40 p-6 border border-emerald-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>AI Recommendation Engine Active</span>
            <span className="opacity-40">|</span>
            <span className="font-mono">v{result.model?.version}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {facultyName ? `Training Recommendations for ${facultyName}` : 'Personalized Training Needs & Catalog Matches'}
          </h2>
          <p className="text-sm text-slate-300 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Based on multi-label Random Forest predictions and your survey responses, here are your top competency gaps and matched training programs.
          </p>
        </div>
      </div>

      {/* 2. Top Model Predictions Section */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-white">Predicted Training Needs (ML Model Output)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictions.map((pred) => {
            const probPct = Math.round(pred.probability * 100);
            return (
              <div
                key={pred.training_category}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">
                      Rank #{pred.rank}
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {formatPercent(pred.probability)} Score
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-100 text-sm leading-snug">
                    {pred.training_category}
                  </h4>
                </div>

                {/* Score Bar */}
                <div className="mt-3">
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${probPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Matched Training Catalog Programs */}
      <div className="bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gold-400" />
            <h3 className="text-base font-semibold text-white">Recommended Training Programs</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {items.length} Programs Matched
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
            <p className="text-slate-400 text-sm">No training catalog matches found for these categories.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.training_id}
                className="p-5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-gold-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                      {item.training_id}
                    </span>
                    <span className="text-xs font-semibold text-gold-300 bg-gold-500/10 px-2.5 py-0.5 rounded border border-gold-500/20">
                      {item.category}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-100 group-hover:text-gold-300 transition-colors">
                    {item.title}
                  </h4>

                  {item.description && (
                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                      {item.description}
                    </p>
                  )}

                  {/* Recommendation Reason Tag */}
                  <div className="flex items-start gap-1.5 text-xs text-emerald-400/90 pt-1">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item.reason}</span>
                  </div>
                </div>

                {/* Match Score Gauge */}
                <div className="flex md:flex-col items-center justify-between md:justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0 min-w-[120px]">
                  <span className="text-[11px] text-slate-400 font-medium">Match Fit</span>
                  <span className="text-lg font-bold font-mono text-gold-400">
                    {formatPercent(item.match_score)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
