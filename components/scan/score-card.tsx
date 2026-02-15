'use client';

import { ReactNode } from 'react';

interface ScoreCardProps {
  label: string;
  score: number | null;
  icon: ReactNode;
}

export function ScoreCard({ label, score, icon }: ScoreCardProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreGrade = (score: number | null) => {
    if (score === null) return 'N/A';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8">
      <div className="flex items-center gap-4">
        <div className="shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {label}
          </p>
          {score !== null ? (
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
                {Math.round(score)}
              </span>
              <span className={`text-xl font-semibold ${getScoreColor(score)}`}>
                {getScoreGrade(score)}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-lg text-gray-400 dark:text-gray-500">
              Pending...
            </p>
          )}
        </div>

        {/* Radial Progress */}
        {score !== null && (
          <div className="shrink-0 relative w-20 h-20">
            <svg
              className="w-20 h-20 transform -rotate-90"
              viewBox="0 0 120 120"
            >
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(score / 100) * 2 * Math.PI * 54} ${
                  2 * Math.PI * 54
                }`}
                className={getScoreColor(score)}
                strokeLinecap="round"
              />
            </svg>
            {/* Center percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                {Math.round(score)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
