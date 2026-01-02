// Scan limits by tier
export const SCAN_LIMITS = {
  free: 1,
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

// Stripe pricing
export const PRICING = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '1 scan per day',
      'SEO audit',
      'Performance metrics',
      'Basic reporting',
    ],
  },
  pro: {
    name: 'Pro',
    price: 19,
    features: [
      'Unlimited scans',
      'Full audit breakdown',
      'Code fix suggestions',
      'PDF export',
      'Scan history',
    ],
  },
  agency: {
    name: 'Agency',
    price: 49,
    features: [
      'Everything in Pro',
      'Multiple sites',
      'White-labeled PDFs',
      'Shareable client links',
      'Team management',
    ],
  },
} as const;
