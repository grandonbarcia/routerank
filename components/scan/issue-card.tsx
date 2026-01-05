'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CodeFix } from './code-fix';

export interface IssueData {
  id: string;
  category: 'seo' | 'performance' | 'nextjs';
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule_id: string;
  title: string;
  message: string;
  fix_suggestion?: string;
  fix_code?: string;
  metadata?: Record<string, unknown>;
}

interface IssueCardProps {
  issue: IssueData;
  onCopyCode?: (code: string) => void;
}

export function IssueCard({ issue, onCopyCode }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'info':
      default:
        return '🔵';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <div
        className="flex items-start gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Severity Badge */}
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${getSeverityColor(
            issue.severity
          )}`}
        >
          {getSeverityIcon(issue.severity)} {issue.severity.toUpperCase()}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white wrap-break-word">
            {issue.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {issue.message}
          </p>
        </div>

        {/* Expand Button */}
        <button
          className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition mt-1"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          {issue.fix_suggestion && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-4">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wide">
                How to Fix
              </p>
              <p className="mt-2 text-sm text-blue-800 dark:text-blue-300">
                {issue.fix_suggestion}
              </p>
            </div>
          )}

          {issue.fix_code && (
            <CodeFix
              code={issue.fix_code}
              language={
                issue.category === 'nextjs' ? 'typescript' : 'javascript'
              }
              onCopy={onCopyCode}
            />
          )}

          {issue.metadata && Object.keys(issue.metadata).length > 0 && (
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-4">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wide">
                Details
              </p>
              <div className="mt-2 space-y-1">
                {Object.entries(issue.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {key}:
                    </span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">
                      {typeof value === 'string'
                        ? value
                        : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
