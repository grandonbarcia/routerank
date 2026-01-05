'use client';

import { useState } from 'react';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareExportProps {
  scanId: string;
  url: string;
}

export function ShareExport({ scanId, url }: ShareExportProps) {
  const [sharing, setSharing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const handleShare = async () => {
    setSharing(true);
    try {
      const response = await fetch(`/api/scans/${scanId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      showSuccess('Share link generated!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Share failed';
      showError(message);
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showSuccess('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/scans/${scanId}/export`);

      if (!response.ok) {
        throw new Error('Failed to export scan');
      }

      const data = await response.json();

      // Create a downloadable JSON file
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-report-${scanId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('Report exported successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      showError(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          disabled={sharing}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
        >
          <Share2 className="h-4 w-4" />
          {sharing ? 'Generating...' : 'Share'}
        </button>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export'}
        </button>
      </div>

      {shareUrl && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 space-y-3">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Share Link
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 rounded bg-white dark:bg-gray-900 border border-blue-300 dark:border-blue-700 text-sm text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
