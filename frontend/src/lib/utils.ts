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
        bg: 'bg-brand-green/15 text-brand-green border-brand-green/30',
        dotBg: 'bg-brand-green',
        description: 'Complete questionnaire and active training recommendations generated.',
      };
    case 'eligible':
      return {
        label: 'Eligible for Recommendation',
        bg: 'bg-brand-gold/15 text-brand-gold-dark border-brand-gold/30',
        dotBg: 'bg-brand-gold animate-ping',
        description: 'Minimum required questionnaire parts complete. Click to request recommendation.',
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        bg: 'bg-brand-green/10 text-brand-green border-brand-green/25',
        dotBg: 'bg-brand-green',
        description: 'Questionnaire started but missing required parts (1, 2, 3, 5, or 6).',
      };
    case 'not_started':
    default:
      return {
        label: 'Not Started',
        bg: 'bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-muted border-light-border dark:border-dark-border',
        dotBg: 'bg-gray-400 dark:bg-gray-500',
        description: 'No questionnaire forms submitted yet.',
      };
  }
}

// ─── Asia/Manila timestamp formatter ────────────────────────────────────────
// Always displays timestamps in Philippine Standard Time (UTC+8) regardless
// of the browser's local timezone setting.
export function formatManila(ts: string | null | undefined): string | null {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return ts;
  }
}

