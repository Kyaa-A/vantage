"use client";

import { Target } from "lucide-react";

interface TreeHeaderProps {
  completedIndicators: number;
  totalIndicators: number;
}

export function TreeHeader({
  completedIndicators,
  totalIndicators,
}: TreeHeaderProps) {
  const percentage =
    totalIndicators > 0
      ? Math.round((completedIndicators / totalIndicators) * 100)
      : 0;

  return (
    <div className="sticky top-0 z-10 bg-[var(--card)] border-b border-[var(--border)] p-4 space-y-3">
      {/* Header Title */}
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-[var(--cityscape-yellow)]" />
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Assessment Progress
        </h2>
      </div>

      {/* Progress Circle and Stats */}
      <div className="flex items-center justify-between">
        {/* Progress Circle */}
        <div className="relative h-16 w-16">
          <svg className="transform -rotate-90" viewBox="0 0 64 64">
            {/* Background circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-[var(--border)]"
            />
            {/* Progress circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${percentage * 1.759} ${(100 - percentage) * 1.759}`}
              strokeLinecap="round"
              className="text-[var(--cityscape-yellow)] transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-[var(--foreground)]">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 ml-4 space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[var(--foreground)]">
              {completedIndicators}
            </span>
            <span className="text-sm text-[var(--text-secondary)]">
              of {totalIndicators}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            indicators completed
          </p>
        </div>
      </div>
    </div>
  );
}
