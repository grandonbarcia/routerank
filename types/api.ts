import type { AuditCategory, AuditSeverity } from './database';

export interface CreateScanRequest {
  url: string;
}

export interface ScanResponse {
  id: string;
  status: string;
  progress?: number;
}

export interface ScanResultsResponse {
  scan: {
    id: string;
    url: string;
    domain: string;
    seo_score: number;
    performance_score: number;
    nextjs_score: number;
    overall_score: number;
    status: string;
    created_at: string;
    completed_at?: string;
  };
  issues: {
    id: string;
    category: AuditCategory;
    severity: AuditSeverity;
    title: string;
    message: string;
    fix_suggestion?: string;
    fix_code?: string;
  }[];
}
