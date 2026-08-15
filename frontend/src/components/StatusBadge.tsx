import React from 'react';
import { getStatusBadgeConfig } from '@/lib/utils';
import { QuestionnaireStatus } from '@/types';

interface StatusBadgeProps {
  status: QuestionnaireStatus | string;
  className?: string;
  showDescription?: boolean;
}

export default function StatusBadge({ status, className = '', showDescription = false }: StatusBadgeProps) {
  const config = getStatusBadgeConfig(status);

  return (
    <div className="inline-flex flex-col gap-1">
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all ${config.bg} ${className}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotBg}`} />
        {config.label}
      </span>
      {showDescription && (
        <p className="text-xs text-light-text dark:text-dark-muted dark:text-light-text dark:text-dark-muted mt-1 max-w-sm leading-relaxed">
          {config.description}
        </p>
      )}
    </div>
  );
}
