'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFExportProps {
  scanId: string;
}

export function PDFExport({ scanId }: PDFExportProps) {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const downloadPdf = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scans/${scanId}/export?format=pdf`);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || 'Failed to export PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-report-${scanId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success('Success', 'PDF downloaded successfully!');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate PDF';
      error('Export failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={downloadPdf}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export PDF
        </>
      )}
    </button>
  );
}
