import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { QuestionnaireStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(val: number): string {
  return `${Math.round(val * 100)}%`;
}

export function getStatusBadgeConfig(status: QuestionnaireStatus | string) {
  switch (status) {
    case 'has_recommendation':
      return {
        label: 'Recommendation Ready',
        bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        dotBg: 'bg-emerald-400',
        description: 'Complete questionnaire and active training recommendations generated.',
      };
    case 'eligible':
      return {
        label: 'Eligible for Recommendation',
        bg: 'bg-gold-500/15 text-gold-400 border-gold-500/30',
        dotBg: 'bg-gold-400 animate-ping',
        description: 'Minimum required questionnaire parts complete. Click to request recommendation.',
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        dotBg: 'bg-sky-400',
        description: 'Questionnaire started but missing required parts (1, 2, 3, 5, or 6).',
      };
    case 'not_started':
    default:
      return {
        label: 'Not Started',
        bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        dotBg: 'bg-slate-400',
        description: 'No questionnaire forms submitted yet.',
      };
  }
}
