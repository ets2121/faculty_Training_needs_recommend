import React from 'react';
import { PartStatus } from '@/types';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

interface ProgressBarProps {
  parts: PartStatus[];
  currentPart: number;
  onSelectPart?: (partNumber: number) => void;
}

export default function ProgressBar({ parts, currentPart, onSelectPart }: ProgressBarProps) {
  const completedCount = parts.filter((p) => p.status === 'complete').length;
  const totalCount = parts.length || 8;
  const percent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="w-full bg-slate-900/60 dark:bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 dark:text-slate-100 flex items-center gap-2">
            <span>Questionnaire Progress</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              {completedCount} of {totalCount} Parts Done ({percent}%)
            </span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">
            Complete Parts 1, 2, 3, 5, and 6 to unlock your personalized training recommendations.
          </p>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-gold-400 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {parts.map((p) => {
          const isCurrent = p.part_number === currentPart;
          const isComplete = p.status === 'complete';
          const isRequired = p.required_for_recommendation;

          // Sequential Lock check: Previous part must be complete unless it's part 1
          const prevPart = parts.find((pt) => pt.part_number === p.part_number - 1);
          const isLocked = p.part_number > 1 && (!prevPart || prevPart.status !== 'complete');

          return (
            <button
              key={p.part_number}
              type="button"
              disabled={isLocked}
              onClick={() => onSelectPart && !isLocked && onSelectPart(p.part_number)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all text-xs relative ${
                isCurrent
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                  : isComplete
                  ? 'bg-slate-800/80 border-emerald-500/30 text-slate-200 hover:border-emerald-500/60'
                  : isLocked
                  ? 'bg-slate-900/30 border-slate-800/60 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
              }`}
            >
              {isRequired && (
                <span className="absolute top-1 right-1 text-[10px] text-gold-400 font-bold" title="Required for ML Recommendation">
                  *
                </span>
              )}

              <div className="mb-1.5">
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isLocked ? (
                  <Lock className="w-4 h-4 text-slate-500" />
                ) : (
                  <Circle className={`w-4 h-4 ${isCurrent ? 'text-emerald-400' : 'text-slate-400'}`} />
                )}
              </div>

              <span className="font-semibold text-[11px]">Part {p.part_number}</span>
              <span className="text-[10px] opacity-75 truncate max-w-full block mt-0.5">
                {p.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
