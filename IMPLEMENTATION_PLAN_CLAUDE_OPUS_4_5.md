# RouteRank Implementation Plan (Claude Opus 4.5)

A comprehensive, step-by-step guide to building RouteRank from zero to production.

---

## 📦 Complete Tech Stack

### Core Stack

| Category      | Technology              | Purpose                         |
| ------------- | ----------------------- | ------------------------------- |
| Framework     | Next.js 15 (App Router) | Full-stack React framework      |
| Styling       | Tailwind CSS 4          | Utility-first CSS               |
| Language      | TypeScript 5            | Type safety                     |
| Database      | Supabase (PostgreSQL)   | Auth, DB, Realtime, Storage     |
| UI Components | shadcn/ui               | Accessible component primitives |

### Recommended Additional Libraries

| Library                      | Purpose             | Why                                                          |
| ---------------------------- | ------------------- | ------------------------------------------------------------ |
| **zod**                      | Schema validation   | Type-safe validation for API inputs, env vars, and form data |
| **react-hook-form**          | Form handling       | Performant forms with easy validation integration            |
| **@tanstack/react-query**    | Server state        | Caching, background refetching, optimistic updates           |
| **framer-motion**            | Animations          | Smooth scan progress animations and page transitions         |
| **recharts**                 | Data visualization  | Score gauges and audit trend charts                          |
| **cheerio**                  | HTML parsing        | Server-side DOM parsing for SEO audits                       |
| **puppeteer**                | Headless browser    | Run Lighthouse and capture full page renders                 |
| **lighthouse**               | Performance audits  | Official Google performance scoring                          |
| **@react-pdf/renderer**      | PDF generation      | Export audit reports to PDF                                  |
| **stripe**                   | Payments            | Subscription billing                                         |
| **@supabase/ssr**            | Auth helpers        | Server-side auth for App Router                              |
| **lucide-react**             | Icons               | Consistent icon set (ships with shadcn)                      |
| **sonner**                   | Toast notifications | User feedback for scan status                                |
| **date-fns**                 | Date formatting     | Human-readable timestamps                                    |
| **react-syntax-highlighter** | Code display        | Show code fix suggestions with syntax highlighting           |
| **nuqs**                     | URL state           | Sync filters/tabs with URL for shareable links               |

---

## 🗄️ Database Schema

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'agency')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  scans_today INTEGER DEFAULT 0,
  last_scan_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scans table
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  nextjs_score INTEGER CHECK (nextjs_score >= 0 AND nextjs_score <= 100),
  overall_score INTEGER GENERATED ALWAYS AS ((seo_score + performance_score + nextjs_score) / 3) STORED,
  lighthouse_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Audit issues table
CREATE TABLE public.audit_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('seo', 'performance', 'nextjs')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  rule_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  fix_suggestion TEXT,
  fix_code TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites table (for Agency tier)
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own scans" ON public.scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own issues" ON public.audit_issues FOR SELECT
  USING (scan_id IN (SELECT id FROM public.scans WHERE user_id = auth.uid()));
```

---

## 📁 Project Structure

```
routerank/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── scan/[id]/page.tsx
│   │   ├── history/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── (marketing)/
│   │   ├── page.tsx              # Landing page
│   │   ├── pricing/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── scan/route.ts         # Initiate scan
│   │   ├── scan/[id]/route.ts    # Get scan status
│   │   ├── webhook/stripe/route.ts
│   │   └── cron/reset-limits/route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn components
│   ├── scan/
│   │   ├── scan-form.tsx
│   │   ├── scan-progress.tsx
│   │   └── scan-results.tsx
│   ├── dashboard/
│   │   ├── score-card.tsx
│   │   ├── issue-list.tsx
│   │   └── fix-preview.tsx
│   ├── marketing/
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   └── pricing-cards.tsx
│   └── layout/
│       ├── header.tsx
│       ├── footer.tsx
│       └── sidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── audit/
│   │   ├── engine.ts             # Main audit orchestrator
│   │   ├── seo-checks.ts
│   │   ├── performance-checks.ts
│   │   ├── nextjs-checks.ts
│   │   └── scoring.ts
│   ├── lighthouse/
│   │   ├── runner.ts
│   │   └── config.ts
│   ├── stripe/
│   │   ├── client.ts
│   │   └── webhooks.ts
│   ├── utils.ts
│   └── constants.ts
├── types/
│   ├── audit.ts
│   ├── database.ts
│   └── api.ts
├── hooks/
│   ├── use-scan.ts
│   ├── use-user.ts
│   └── use-subscription.ts
└── middleware.ts
```

---

## 🚀 Phase 1: Project Foundation (Days 1-3)

### Step 1.1: Environment Setup

```bash
# Already initialized - verify dependencies
npm install

# Install additional dependencies
npm install zod react-hook-form @tanstack/react-query framer-motion recharts
npm install cheerio puppeteer lighthouse
npm install @supabase/ssr @supabase/supabase-js
npm install stripe @stripe/stripe-js
npm install lucide-react sonner date-fns
npm install react-syntax-highlighter @react-pdf/renderer nuqs

# Dev dependencies
npm install -D @types/react-syntax-highlighter
```

### Step 1.2: Configure Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_AGENCY_PRICE_ID=price_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 1.3: Supabase Client Setup

- [ ] Create `lib/supabase/client.ts` - Browser client
- [ ] Create `lib/supabase/server.ts` - Server client with cookies
- [ ] Create `lib/supabase/middleware.ts` - Auth refresh middleware
- [ ] Update `middleware.ts` to protect routes

### Step 1.4: Initialize shadcn/ui

```bash
npx shadcn@latest init
npx shadcn@latest add button input card progress tabs accordion alert badge skeleton toast dialog dropdown-menu avatar separator
```

### Step 1.5: Create Base Layout

- [ ] Create shared `Header` with logo, nav, and auth state
- [ ] Create `Footer` with links
- [ ] Setup marketing layout (centered, max-width)
- [ ] Setup dashboard layout (sidebar + main content)

---

## 🎨 Phase 2: Landing Page & Marketing (Days 4-6)

### Step 2.1: Hero Section

- [ ] Headline: "SEO Audits Built for Next.js"
- [ ] Subheadline explaining the value prop
- [ ] CTA button: "Scan Your Site Free"
- [ ] Animated demo/preview of a sample report

### Step 2.2: Features Section

- [ ] Three columns: SEO, Performance, Next.js Best Practices
- [ ] Icon + title + description for each feature
- [ ] Use `lucide-react` icons

### Step 2.3: Sample Report Preview

- [ ] Static/interactive preview of what a report looks like
- [ ] Score gauges using Recharts
- [ ] Sample issues with severity badges

### Step 2.4: Pricing Section

- [ ] Three tier cards: Free, Pro ($19/mo), Agency ($49/mo)
- [ ] Feature comparison list
- [ ] CTA buttons (Free: "Start Scanning", Paid: "Subscribe")

### Step 2.5: Footer & Trust Elements

- [ ] Simple footer with links
- [ ] "Built with Next.js" badge
- [ ] Social proof if available

---

## 🔐 Phase 3: Authentication (Days 7-9)

### Step 3.1: Supabase Auth Setup

- [ ] Enable Email/Password auth in Supabase dashboard
- [ ] Enable OAuth providers (GitHub, Google)
- [ ] Configure redirect URLs

### Step 3.2: Auth Pages

- [ ] `/login` - Email/password + OAuth buttons
- [ ] `/signup` - Registration form
- [ ] Password reset flow
- [ ] Email verification handling

### Step 3.3: Auth Middleware

- [ ] Protect `/dashboard/*` routes
- [ ] Redirect authenticated users from `/login` to `/dashboard`
- [ ] Handle session refresh

### Step 3.4: Profile Sync

- [ ] Database trigger to create profile on user signup
- [ ] Fetch and display user info in header

---

## 🔍 Phase 4: Audit Engine Core (Days 10-16)

### Step 4.1: HTML Fetcher

```typescript
// lib/audit/fetcher.ts
- [ ] Fetch URL with proper headers (User-Agent, Accept)
- [ ] Handle redirects and track final URL
- [ ] Timeout handling (10s default)
- [ ] Error handling (network, 4xx, 5xx)
```

### Step 4.2: SEO Checks Implementation

```typescript
// lib/audit/seo-checks.ts
- [ ] checkTitle(): Title exists, length 30-60 chars
- [ ] checkMetaDescription(): Exists, length 120-160 chars
- [ ] checkCanonical(): Present and valid URL
- [ ] checkOpenGraph(): og:title, og:description, og:image
- [ ] checkTwitterCard(): twitter:card, twitter:title
- [ ] checkRobotsMeta(): noindex/nofollow detection
- [ ] checkHeadingStructure(): H1 presence, hierarchy
- [ ] checkImageAlts(): All images have alt text
- [ ] checkLinks(): Broken link detection
```

### Step 4.3: Lighthouse Integration

```typescript
// lib/lighthouse/runner.ts
- [ ] Setup Puppeteer with proper Chrome flags
- [ ] Run Lighthouse programmatically
- [ ] Extract Core Web Vitals (LCP, CLS, INP)
- [ ] Extract performance score
- [ ] Handle errors and timeouts
```

### Step 4.4: Next.js-Specific Checks

```typescript
// lib/audit/nextjs-checks.ts
- [ ] checkMetadataAPI(): Detect Metadata API vs <Head>
- [ ] checkNextImage(): Detect next/image usage
- [ ] checkNextFont(): Detect next/font usage
- [ ] checkScriptLoading(): next/script with strategy
- [ ] detectClientComponents(): "use client" markers in HTML hints
- [ ] checkSitemap(): /sitemap.xml exists and valid
- [ ] checkRobotsTxt(): /robots.txt exists and valid
```

### Step 4.5: Scoring Algorithm

```typescript
// lib/audit/scoring.ts
const WEIGHTS = {
  seo: { error: 15, warning: 5, info: 1 },
  performance: { error: 20, warning: 8, info: 2 },
  nextjs: { error: 10, warning: 4, info: 1 }
};

- [ ] Calculate category scores (100 - weighted deductions)
- [ ] Clamp scores to 0-100
- [ ] Generate overall grade (A-F)
```

### Step 4.6: Audit Engine Orchestrator

```typescript
// lib/audit/engine.ts
- [ ] Coordinate all checks
- [ ] Run HTML-based checks in parallel
- [ ] Run Lighthouse separately (resource intensive)
- [ ] Aggregate results
- [ ] Save to database
```

---

## 📊 Phase 5: Scan Flow & Results UI (Days 17-22)

### Step 5.1: Scan Input Form

- [ ] URL input with validation (zod + react-hook-form)
- [ ] "Scan" button with loading state
- [ ] Usage limit check before scan
- [ ] Error display for invalid URLs

### Step 5.2: Scan API Route

```typescript
// app/api/scan/route.ts
- [ ] Validate input URL
- [ ] Check user's scan quota
- [ ] Create scan record (status: pending)
- [ ] Trigger audit engine (async)
- [ ] Return scan ID for polling
```

### Step 5.3: Scan Progress UI

- [ ] Polling for scan status updates
- [ ] Progress bar with stages: "Fetching → Analyzing → Scoring"
- [ ] Animated transitions with Framer Motion
- [ ] Real-time updates via Supabase Realtime (optional enhancement)

### Step 5.4: Results Dashboard

- [ ] Three score gauges (Recharts RadialBarChart)
- [ ] Overall grade badge (A-F)
- [ ] Tabbed interface: SEO | Performance | Next.js
- [ ] Issue cards with severity indicators
- [ ] Expand/collapse for details

### Step 5.5: Code Fix Suggestions

- [ ] Display suggested code with `react-syntax-highlighter`
- [ ] Copy-to-clipboard button
- [ ] Before/after comparison where applicable

### Step 5.6: Share & Export

- [ ] Generate shareable link (public scan view)
- [ ] PDF export button (Pro+ only)

---

## 💳 Phase 6: Monetization (Days 23-28)

### Step 6.1: Stripe Setup

- [ ] Create products in Stripe dashboard (Pro, Agency)
- [ ] Create monthly prices
- [ ] Configure customer portal

### Step 6.2: Checkout Flow

```typescript
// app/api/checkout/route.ts
- [ ] Create Stripe Checkout Session
- [ ] Redirect to Stripe
- [ ] Handle success/cancel redirects
```

### Step 6.3: Webhook Handler

```typescript
// app/api/webhook/stripe/route.ts
- [ ] Verify webhook signature
- [ ] Handle checkout.session.completed
- [ ] Handle customer.subscription.updated
- [ ] Handle customer.subscription.deleted
- [ ] Update user's subscription_tier in database
```

### Step 6.4: Usage Limiting

```typescript
// lib/usage.ts
- [ ] Check scans_today against tier limits
- [ ] Reset counts daily (cron job or on-demand)
- [ ] Display remaining scans in UI
- [ ] Upgrade prompt when limit reached
```

### Step 6.5: Settings Page

- [ ] Current plan display
- [ ] Manage subscription button (Stripe Portal)
- [ ] Usage statistics
- [ ] Account settings

---

## 📄 Phase 7: PDF Export & History (Days 29-32)

### Step 7.1: PDF Report Generation

```typescript
// lib/pdf/generator.tsx
- [ ] Use @react-pdf/renderer
- [ ] Design report template
- [ ] Include scores, issues, fixes
- [ ] Add branding (logo, colors)
- [ ] White-label option for Agency tier
```

### Step 7.2: Scan History Page

- [ ] List all past scans
- [ ] Filter by domain, date, score
- [ ] Sort options
- [ ] Quick actions: View, Re-scan, Delete, Export

### Step 7.3: Scan Comparison (Future)

- [ ] Compare two scans side by side
- [ ] Show score deltas
- [ ] Highlight fixed/new issues

---

## 🚢 Phase 8: Deployment & Launch (Days 33-35)

### Step 8.1: Vercel Deployment

- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Setup preview deployments

### Step 8.2: Database & Edge Functions

- [ ] Run migrations on production Supabase
- [ ] Test auth flows in production
- [ ] Configure RLS policies

### Step 8.3: Monitoring

- [ ] Setup error tracking (Sentry)
- [ ] Add analytics (Vercel Analytics, Plausible, or PostHog)
- [ ] Monitor Lighthouse runner performance

### Step 8.4: Launch Checklist

- [ ] Test all payment flows
- [ ] Verify email deliverability
- [ ] Check mobile responsiveness
- [ ] Run accessibility audit
- [ ] Setup status page

---

## 🧪 Testing Strategy

### Unit Tests

- [ ] Audit check functions
- [ ] Scoring algorithm
- [ ] URL validation

### Integration Tests

- [ ] Full scan flow
- [ ] Auth flows
- [ ] Stripe webhooks

### E2E Tests (Playwright)

- [ ] Landing → Signup → Scan → View Results
- [ ] Subscription upgrade flow
- [ ] PDF export

---

## 📈 Success Metrics

| Metric          | Target (Month 1) |
| --------------- | ---------------- |
| Signups         | 100              |
| Scans completed | 500              |
| Pro conversions | 5                |
| Uptime          | 99.5%            |
| Avg. scan time  | < 30s            |

---

## 🔮 Post-MVP Enhancements

1. **Scheduled Scans** - Weekly automated audits with email reports
2. **Regression Alerts** - Notify when scores drop
3. **GitHub Action** - Run audits in CI/CD
4. **Chrome Extension** - Quick audit from browser
5. **Team Workspaces** - Collaborate on agency accounts
6. **Custom Audit Rules** - User-defined checks
7. **Competitor Comparison** - Side-by-side analysis

---

## 📅 Timeline Summary

| Phase               | Duration   | Deliverables                       |
| ------------------- | ---------- | ---------------------------------- |
| 1. Foundation       | Days 1-3   | Project setup, Supabase, shadcn    |
| 2. Marketing        | Days 4-6   | Landing page, pricing              |
| 3. Auth             | Days 7-9   | Login, signup, protected routes    |
| 4. Audit Engine     | Days 10-16 | SEO checks, Lighthouse, scoring    |
| 5. Scan UI          | Days 17-22 | Input, progress, results dashboard |
| 6. Monetization     | Days 23-28 | Stripe, subscriptions, limits      |
| 7. Export & History | Days 29-32 | PDF export, scan history           |
| 8. Launch           | Days 33-35 | Deployment, monitoring, go-live    |

**Total: ~5 weeks to MVP**

---

_This plan prioritizes shipping a functional product quickly while maintaining code quality and user experience._
