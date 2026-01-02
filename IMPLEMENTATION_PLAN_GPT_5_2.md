# RouteRank — Implementation Plan (GPT‑5.2)

A concrete, step-by-step plan to build **RouteRank**, a Next.js-native SEO + Performance audit SaaS for the App Router era, using **Next.js + Tailwind + TypeScript + Supabase**.

This plan is optimized for:

- Shipping an MVP quickly (scan → results)
- Keeping scan jobs reliable (Lighthouse is heavy)
- Setting up a clean path to Auth + Billing + History

---

## 0) Decisions (Lock These In First)

1. **Runtime for scanning** (important): Lighthouse + Chromium often exceeds serverless limits.

   - MVP option A (simplest dev): run scans in the Next.js server (Node runtime) locally.
   - Production option B (recommended): run scans in a **separate worker service** (Fly.io/Render/Railway) and have Next.js enqueue jobs in Supabase.
   - Production option C (possible on Vercel): `puppeteer-core` + `@sparticuz/chromium` (works, but more finicky).

2. **Scan execution model**:

   - **Async job**: user submits URL → scan record created → worker processes → UI polls / realtime updates.

3. **What “Next.js-aware” means for MVP**:
   - Start with **HTTP + HTML + Lighthouse JSON + a few Next.js heuristics**.
   - Deeper “App Router intelligence” that requires repo access (parsing source) becomes a paid/future feature.

---

## 1) Recommended Libraries (Additions)

### App/UI

- `shadcn/ui` + `lucide-react`: UI primitives + icons.
- `react-hook-form` + `zod` + `@hookform/resolvers`: forms + validation.
- `sonner`: toasts.
- `recharts`: score charts.
- `react-syntax-highlighter` (or `shiki`): code fix snippets.

### Data / Server

- `@supabase/supabase-js` + `@supabase/ssr`: Supabase + App Router SSR auth.
- `@tanstack/react-query`: client caching + polling.
- `next-safe-action` (optional): type-safe server actions (excellent DX).
- `@t3-oss/env-nextjs` (optional): env var validation.

### Scanning

- `lighthouse` + `puppeteer` (worker) OR `puppeteer-core` + `@sparticuz/chromium` (serverless).
- `cheerio`: parse HTML.
- `robots-parser`: interpret robots.txt (optional but useful).
- `sitemapper` or `fast-xml-parser`: parse sitemap.xml.
- `p-limit`: concurrency control (avoid melting worker).

### Productization

- `stripe` + `@stripe/stripe-js`: billing.
- `@react-pdf/renderer` (or `playwright`-based print): PDF export.
- `sentry` (optional): error tracking.
- `posthog-js` (optional): product analytics.

---

## 2) High-Level Architecture

### Data flow

1. User submits URL on `/scan`.
2. App creates a `scans` row in Supabase: `status='queued'`.
3. Worker claims the job (sets `status='running'`).
4. Worker runs:
   - Fetch HTML → run SEO checks
   - Run Lighthouse → extract performance metrics
   - Run Next.js heuristics (headers, scripts, Next image patterns, etc.)
5. Worker writes:
   - `scans` row scores + raw JSON (optional) + `status='completed'`
   - `audit_issues` rows for findings
6. UI polls `/api/scans/:id` (or uses Supabase realtime) and renders results.

### Why a worker?

Lighthouse jobs can take 15–60s and sometimes require more memory/CPU than serverless functions allow.

---

## 3) Supabase Schema (MVP)

### Tables

- `profiles` (1:1 with `auth.users`)
- `scans` (one per scan request)
- `audit_issues` (many per scan)
- `sites` (optional for Agency)

### Suggested columns

**profiles**

- `id` uuid (PK, references auth.users)
- `email` text
- `plan` text: `free | pro | agency`
- `scans_today` int
- `scans_today_date` date
- `stripe_customer_id` text (nullable)
- `stripe_subscription_id` text (nullable)
- timestamps

**scans**

- `id` uuid (PK)
- `user_id` uuid (FK profiles)
- `url` text
- `final_url` text
- `status` text: `queued | running | completed | failed`
- `seo_score` int
- `performance_score` int
- `nextjs_score` int
- `lighthouse_json` jsonb (optional; consider storing only selected metrics for cost)
- `error_message` text
- timestamps

**audit_issues**

- `id` uuid (PK)
- `scan_id` uuid (FK scans)
- `impact` text: `seo | performance | nextjs`
- `severity` text: `info | warning | error`
- `rule_id` text
- `title` text
- `message` text
- `fix` text
- `fix_code` text (nullable)
- `data` jsonb (nullable)

### RLS policies (minimum)

- Users can read their own `profiles`, `scans`, and `audit_issues`.
- Users can insert `scans` for themselves.
- Worker uses **service role key** to update scans/issues.

---

## 4) Route & UI Map

### Public

- `/` landing
- `/pricing`

### Auth

- `/login`
- `/signup`

### App

- `/scan` create scan
- `/scan/[id]` live progress + results
- `/dashboard` summary
- `/history` scan history
- `/settings` plan management

---

## 5) Step-by-Step Plan (Concrete Execution)

### Milestone A — Project Baseline (Day 1)

1. Ensure core setup is clean:
   - Next.js App Router works
   - Tailwind configured
   - TypeScript strict mode on
2. Add quality tooling:
   - ESLint (already present)
   - Prettier (optional) + format script
3. Create base layouts:
   - Marketing layout
   - App layout (header + container)

Acceptance:

- `npm run dev` boots, `/` renders, global styling OK.

---

### Milestone B — Supabase Integration (Day 2)

1. Create Supabase project.
2. Add env vars to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
3. Implement Supabase clients:
   - Browser client
   - Server client with cookies
4. Create tables + RLS policies.

Acceptance:

- You can sign up a user and read/write a row that is owned by them.

---

### Milestone C — Auth + Protected Pages (Day 3)

1. Implement `/login` and `/signup`.
2. Add route protection for app pages (middleware or server redirect).
3. Add `profiles` auto-create (trigger) OR on-first-login upsert.

Acceptance:

- Unauthed users can’t access `/dashboard`.
- Authed users see their email in header.

---

### Milestone D — Scan MVP (No Lighthouse Yet) (Days 4–6)

Goal: ship “scan → SEO issues → score” using only HTML parsing.

1. Build `/scan` form:
   - URL input
   - zod validation (must be http/https)
2. Create API/Server Action `createScan(url)`:
   - create `scans` row as `queued`
3. Implement scan runner (temporary in-app worker for MVP):
   - fetch HTML with timeout
   - parse with cheerio
   - run checks (below)
   - write issues + score
4. SEO checks (MVP set):
   - Title exists + length
   - Meta description exists + length
   - Canonical tag
   - OpenGraph basics
   - Robots meta `noindex`
   - H1 presence
   - Image alt missing
5. Build `/scan/[id]` results view:
   - show 3 category scores (perf can be “pending” for now)
   - list issues grouped by impact

Acceptance:

- Submitting a URL produces a scan with issues stored in Supabase.

---

### Milestone E — Lighthouse + Performance Score (Days 7–10)

Goal: real Lighthouse metrics (LCP/CLS/INP) + performance scoring.

1. Choose runtime:
   - If you deploy worker: create a `worker/` Node service.
   - If staying in-app: ensure Node runtime route handler and test locally.
2. Implement Lighthouse runner:
   - run Lighthouse against `final_url`
   - extract: performance score, LCP, CLS, INP, TBT
3. Add performance checks:
   - LCP thresholds
   - CLS thresholds
   - INP thresholds
   - oversized images heuristic (from Lighthouse opportunities)
4. Store only what you need:
   - keep derived metrics + relevant audits rather than full JSON (optional).

Acceptance:

- Performance score is non-null and stable for a known site.

---

### Milestone F — Next.js Best Practices Heuristics (Days 11–14)

Goal: “Next.js-aware” checks without needing source code.

1. Add checks based on HTML + headers:
   - detect `x-powered-by` (informational)
   - detect Next.js data scripts (`__NEXT_DATA__` for pages router; App Router is different but still has hints)
   - detect `next/image` patterns (images with `/_next/image`)
   - detect `next/font` patterns (CSS variables, preloads, `/_next/static/media`)
   - detect excessive client-side JS (approx via total JS bytes from Lighthouse)
2. Routing/structure checks:
   - request `/sitemap.xml` and parse
   - request `/robots.txt` and validate
   - custom 404 heuristic: request a random path; see if response looks like a real 404

Acceptance:

- Next.js score is computed; dashboard shows meaningful Next.js issues.

---

### Milestone G — Scoring System + UX Polish (Days 15–17)

1. Formalize `AuditIssue` type and rule IDs.
2. Implement scoring with weights:
   - Deduct based on severity
   - Clamp 0–100
3. UI polish:
   - progress states (queued/running/completed)
   - skeleton loaders
   - toast notifications
   - copy-to-clipboard for fix code

Acceptance:

- Scores feel consistent across repeated scans; UI is clear and fast.

---

### Milestone H — Scan History + Dashboard (Days 18–20)

1. `/history`: list scans with status + timestamp + top-level scores.
2. `/dashboard`: summary cards + last scans.
3. Add delete scan (soft delete optional).

Acceptance:

- Users can view prior scans and re-open results.

---

### Milestone I — Usage Limits (Free Tier) (Days 21–22)

1. Implement daily scan limit:
   - free: 1/day
   - pro: unlimited
   - agency: unlimited + multi-site features
2. Enforce on scan creation:
   - reset `scans_today` when date changes
   - block creation with a friendly upgrade prompt

Acceptance:

- Free users are blocked at limit; paid users are not.

---

### Milestone J — Stripe Subscriptions (Days 23–26)

1. Create Stripe products/prices.
2. Checkout flow:
   - create checkout session
   - redirect
3. Webhooks:
   - update `profiles.plan`
4. Customer portal for cancellations/upgrades.

Acceptance:

- Plan updates automatically after payment.

---

### Milestone K — PDF Export (Pro+) (Days 27–29)

1. Create a PDF template (scores + issues + fixes).
2. Gate export by plan.
3. Store PDFs (optional) in Supabase Storage.

Acceptance:

- Pro users can export a readable PDF report.

---

### Milestone L — Production Hardening (Days 30–35)

1. Background jobs reliability:
   - job claiming (avoid double-processing)
   - retries on failure
   - timeouts
2. Observability:
   - Sentry for errors
   - basic logs for worker
3. Security:
   - strict URL validation (block localhost/private IPs)
   - rate limit scan creation
   - sanitize output

Acceptance:

- Deployed system is stable and safe for public usage.

---

## 6) Implementation Details (Templates)

### A) Scan state machine

- `queued` → `running` → `completed`
- `queued`/`running` → `failed` (with `error_message`)

### B) URL safety (must-have)

Implement SSRF protection:

- Only allow `http`/`https`
- Resolve DNS; block private IP ranges (10.0.0.0/8, 192.168.0.0/16, 127.0.0.1, etc.)
- Block `localhost` and `.local`

### C) Suggested rule IDs

- `seo.title.missing`
- `seo.metaDescription.missing`
- `seo.canonical.missing`
- `perf.lcp.high`
- `next.image.notOptimized`

---

## 7) MVP Definition (Scope You Can Actually Ship)

MVP includes:

- Landing + scan form
- Auth
- One scan/day for free users
- Scan results dashboard with:
  - SEO score
  - Performance score (Lighthouse)
  - Next.js best-practices score (heuristics)
- Scan history

Not MVP (Phase 2+):

- White-labeled PDFs
- Multi-site agency workspace
- Scheduled scans + alerts
- Deep source-level Next.js analysis

---

## 8) Next Best Action (Recommended)

Start with **Milestone B → D** (Supabase + Auth + HTML-only scan) before touching Lighthouse. This ensures the product loop works end-to-end without the hardest infrastructure piece.
