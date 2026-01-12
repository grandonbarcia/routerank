// Scan limits (RouteRank is free for everyone)
export const SCAN_LIMITS = {
  free: Infinity,
  pro: Infinity,
  agency: Infinity,
} as const;

// Scoring thresholds
export const SCORE_THRESHOLDS = {
  A: 90,
  B: 80,
  C: 70,
  D: 60,
  F: 0,
} as const;

// Severity weights for scoring
export const SEVERITY_WEIGHTS = {
  seo: { error: 15, warning: 5, info: 1 },
  performance: { error: 20, warning: 8, info: 2 },
  nextjs: { error: 10, warning: 4, info: 1 },
} as const;

// Common regex patterns
export const PATTERNS = {
  URL: /^https?:\/\/.+/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PRIVATE_IP: /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/,
} as const;
