'use client';

import { useState } from 'react';
import {
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import { CodeFix } from './code-fix';
import { Card } from '@/components/base/card';
import { Badge } from '@/components/base/badge';
import { Button } from '@/components/base/button';
import { cn } from '@/lib/utils';

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

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100/80 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100/80 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100/80 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'low':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-3.5 h-3.5 mr-1" />;
      case 'high':
        return <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
      case 'medium':
        return <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
      case 'low':
      default:
        return <Info className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-sm border-l-4 cursor-pointer',
        issue.severity === 'critical'
          ? 'border-l-red-500'
          : issue.severity === 'high'
            ? 'border-l-orange-500'
            : issue.severity === 'medium'
              ? 'border-l-yellow-500'
              : 'border-l-blue-500',
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start p-6 gap-4">
        {/* Badge */}
        <div className="shrink-0 pt-0.5">
          <Badge
            variant="outline"
            className={cn(
              'capitalize px-2 py-0.5 h-auto',
              getSeverityStyles(issue.severity),
            )}
          >
            {getSeverityIcon(issue.severity)}
            {issue.severity}
          </Badge>
        </div>

        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 md:hidden">
                {/* Mobile category label if needed, or stick to PC layout */}
              </div>
              <h3 className="font-semibold text-base leading-snug">
                {issue.title}
              </h3>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-gray-500 dark:text-gray-400 -mr-2 -mt-2"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  expanded && 'rotate-180',
                )}
              />
              <span className="sr-only">Toggle</span>
            </Button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 w-[90%]">
            {issue.message}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 pt-0 space-y-4 animate-in fade-in slide-in-from-top-1">
          <div className="border-t pt-4"></div>
          {/* Fix Suggestion */}
          {issue.fix_suggestion && (
            <div className="rounded-md bg-blue-50/50 dark:bg-blue-950/20 p-3 border border-blue-100 dark:border-blue-900/50 text-sm">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium mb-1">
                <Lightbulb className="w-4 h-4" />
                How to Fix
              </div>
              <p className="text-blue-900 dark:text-blue-100/90 leading-relaxed pl-6">
                {issue.fix_suggestion}
              </p>
            </div>
          )}

          {/* Code Block */}
          {issue.fix_code && (
            <div className="mt-2 text-sm">
              <CodeFix
                code={issue.fix_code}
                language={
                  issue.category === 'nextjs' ? 'typescript' : 'javascript'
                }
                onCopy={onCopyCode}
              />
            </div>
          )}

          {/* Metadata Table */}
          {issue.metadata && Object.keys(issue.metadata).length > 0 && (
            <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 text-sm">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 font-medium text-xs uppercase text-gray-500 dark:text-gray-400">
                Details
              </div>
              <div className="divide-y border-t-0">
                {Object.entries(issue.metadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-[140px_1fr] gap-4 px-3 py-2"
                  >
                    <span
                      className="text-gray-500 dark:text-gray-400 font-medium truncate"
                      title={key}
                    >
                      {key}
                    </span>
                    <span className="font-mono text-xs break-all">
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
