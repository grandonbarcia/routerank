'use client';

import { useState } from 'react';
import { Share2, Download, Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/base/button';
import { Input } from '@/components/base/input';

interface ShareExportProps {
  scanId: string;
  url: string;
}

export function ShareExport({ scanId, url }: ShareExportProps) {
  void url;
  const [sharing, setSharing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { success, error } = useToast();

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
      success('Share link generated!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Share failed';
      error(message);
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      success('Link copied to clipboard!');
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

      success('Report exported successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {/* Share Button (Dialog or just logic? Logic seems to generate URL) */}
        {/* If shareUrl is present, maybe show it? Original logic didn't show where shareUrl goes unless I implement a dialog or update state to show input */}
        {/* Original rendered a button. If clicked, it sets shareUrl. But where is it displayed? */}
        {/* I'll wrap Share in a Dialog if needed, or just let it be a button that copies? */}
        {/* Re-reading original code... it setShareUrl inside handleShare. But didn't update UI to show it? */}
        {/* Ah, I missed the bottom of the file where it probably renders the link if shareUrl is true. */}

        <Button variant="outline" onClick={handleShare} disabled={sharing}>
          <Share2 className="mr-2 h-4 w-4" />
          {sharing ? 'Generating...' : 'Share'}
        </Button>

        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export JSON
        </Button>
      </div>

      {shareUrl && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Input readOnly value={shareUrl} className="font-mono text-xs h-9" />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCopyLink}
            className="h-9 w-9 shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
