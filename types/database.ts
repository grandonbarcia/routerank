export type AuditCategory = 'seo' | 'performance' | 'nextjs';
export type AuditSeverity = 'info' | 'warning' | 'error';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AuditIssue {
  id: string;
  scan_id: string;
  category: AuditCategory;
  severity: AuditSeverity;
  rule_id: string;
  title: string;
  message: string;
  fix_suggestion?: string;
  fix_code?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  url: string;
  domain: string;
  seo_score?: number;
  performance_score?: number;
  nextjs_score?: number;
  overall_score?: number;
  lighthouse_data?: Record<string, unknown>;
  status: ScanStatus;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'agency';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  scans_today: number;
  last_scan_date?: string;
  created_at: string;
  updated_at: string;
}
