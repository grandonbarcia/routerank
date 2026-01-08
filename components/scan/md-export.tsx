'use client';

import { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MDExportProps {
  scanId: string;
}

export function MDExport({ scanId }: MDExportProps) {
  const [loading, setLoading] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const downloadMd = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scans/${scanId}/export?format=md`);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || 'Failed to export Markdown');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-report-${scanId}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('Markdown downloaded successfully!');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate Markdown';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={downloadMd}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
    >
      {loading ? (
        <>
          <Loader className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export .md
        </>
      )}
    </button>
  );
}
