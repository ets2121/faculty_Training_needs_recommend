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
    <div className="w-full bg-white dark:bg-dark-card dark:bg-white dark:bg-dark-card/80 border border-light-border dark:border-dark-border rounded-2xl p-5 shadow-lg backdrop-blur-md">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-light-text dark:text-dark-text dark:text-light-text dark:text-dark-text flex items-center gap-2">
            <span>Questionnaire Progress</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-brand-green/10 text-brand-green border border-brand-green/20 font-mono">
              {completedCount} of {totalCount} Parts Done ({percent}%)
            </span>
          </h3>
          <p className="text-xs text-light-text dark:text-dark-muted dark:text-light-text dark:text-dark-muted mt-1">
            Complete Parts 1, 2, 3, 5, and 6 to unlock your personalized training recommendations.
          </p>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="relative w-full h-2.5 bg-white dark:bg-dark-bg rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-brand-green to-brand-gold transition-all duration-500 ease-out rounded-full"
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
                  ? 'bg-brand-green/20 border-brand-green text-brand-green ring-2 ring-brand-green/30'
                  : isComplete
                  ? 'bg-white dark:bg-dark-bg/80 border-brand-green/30 text-light-text dark:text-dark-text hover:border-brand-green/60'
                  : isLocked
                  ? 'bg-white dark:bg-dark-card/30 border-light-border dark:border-dark-border/60 text-light-text dark:text-dark-muted cursor-not-allowed opacity-60'
                  : 'bg-white dark:bg-dark-card border-light-border/60 dark:border-dark-border/60 text-light-text dark:text-dark-text hover:border-brand-green'
              }`}
            >
              {isRequired && (
                <span className="absolute top-1 right-1 text-[10px] text-brand-gold font-bold" title="Required for ML Recommendation">
                  *
                </span>
              )}

              <div className="mb-1.5">
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-brand-green" />
                ) : isLocked ? (
                  <Lock className="w-4 h-4 text-light-text dark:text-dark-muted" />
                ) : (
                  <Circle className={`w-4 h-4 ${isCurrent ? 'text-brand-green' : 'text-light-text dark:text-dark-muted'}`} />
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
