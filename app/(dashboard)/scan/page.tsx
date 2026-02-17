'use client';

import { ScanForm } from '@/components/scan/scan-form';
import type { AuditReport } from '@/lib/audit/execute';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/base/alert';
import { ScanResults } from '@/components/scan/scan-results';

export default function ScanPage() {
  const [guestReport, setGuestReport] = useState<{
    report: AuditReport;
    url: string;
  } | null>(null);

  const handleGuestScanComplete = (report: AuditReport, url: string) => {
    setGuestReport({ report, url });
  };

  const handleReset = () => {
    setGuestReport(null);
  };

  if (!guestReport) {
    return (
      <div className="space-y-8">
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300">
            Free Mode
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            No login required to scan public URLs.
          </AlertDescription>
        </Alert>

        <ScanForm onGuestScanComplete={handleGuestScanComplete} />
      </div>
    );
  }

  return (
    <ScanResults
      report={guestReport.report}
      url={guestReport.url}
      onRescan={handleReset}
    />
  );
}
