# RouteRank

A **Next.js–native SEO & Performance Audit Tool** built specifically for the App Router era.

> Generic SEO tools treat Next.js like static HTML. **RouteRank** understands routes, layouts, metadata, images, fonts, and client/server boundaries.

---

## 🚀 Overview

**RouteRank** helps developers, startups, and agencies confidently ship high-quality Next.js sites by providing:

- Actionable SEO audits
- Performance insights based on Lighthouse
- Deep App Router–specific best practice checks
- Clear code-level fix suggestions

This project is designed as a focused, monetizable SaaS and a strong real-world portfolio piece.

---

## 🎯 Target Audience

- Indie developers using **Next.js**
- Startups building marketing sites with Next.js
- Agencies delivering Next.js projects
- Junior–mid frontend developers seeking SEO confidence

---

## ✨ Key Features (MVP)

### SEO Audits (Next.js-aware)

- Title & meta description validation
- Metadata API vs `<Head>` usage
- Duplicate titles across routes
- Canonical tags
- OpenGraph & Twitter metadata
- Robots meta tags

### Routing & Structure

- Route depth analysis
- Dynamic route indexing
- Trailing slash consistency
- Custom 404 detection
- `sitemap.xml` and `robots.txt` checks

### Performance

- Lighthouse metrics (LCP, CLS, INP)
- `next/image` usage detection
- Oversized image warnings
- Font loading (`next/font` vs external)
- Script loading strategies
- Client component overuse

### App Router Best Practices

- Per-route metadata presence
- Layout nesting depth
- Excessive `"use client"` usage
- Missing `loading.tsx` / `error.tsx`
- Suspense boundary checks

---

## 📊 Scoring System

Each scan produces three scores:

- **SEO Score (0–100)**
- **Performance Score (0–100)**
- **Next.js Best Practices Score (0–100)**

Issues are weighted by severity and impact.

```ts
type AuditIssue = {
  id: string;
  severity: 'info' | 'warning' | 'error';
  impact: 'seo' | 'performance' | 'nextjs';
  message: string;
  fix: string;
};
```

---

## 🔍 How a Scan Works (URL → Audit → Score)

At a high level, RouteRank turns a URL into:

- A **scan record** (`scans` table) with status + scores
- A list of **issues** (`audit_issues` table) with fix suggestions
- A computed **overall score + letter grade** derived from category scores

### 1) User submits a URL

- The Scan page renders the form: `app/(dashboard)/scan/page.tsx`
- The form submits to the API: `POST /api/scan` (`app/api/scan/route.ts`)

The API immediately returns `202 Accepted` so the UI doesn’t block while the audit runs.

### 2) The server creates a scan and runs the audit

`POST /api/scan`:

- Validates the request + checks auth
- Creates a `scans` row with `status='pending'`
- Kicks off a background-style audit function (`runAuditInBackground`)

When the audit starts, the scan is marked `running`. When it finishes, it is marked `completed` (or `failed` if something breaks).

### 3) Fetch HTML safely

The audit engine fetches the target page’s HTML using SSRF protections and limits:

- `lib/audit/fetcher.ts`

This step normalizes URLs, blocks private/internal IP ranges, enforces timeouts/size limits, and returns the HTML string used by the analyzers.

### 4) Analyze SEO, Performance, and Next.js best practices

The core orchestrator is:

- `lib/audit/execute.ts`

It runs three analyzers and combines their findings:

- **SEO checks (HTML-based)**: `lib/audit/seo.ts`
  - Title/meta description/canonical/viewport
  - OpenGraph/Twitter tags
  - Heading structure (H1)
  - Image alt text checks

- **Next.js best-practices checks (HTML heuristics)**: `lib/audit/nextjs.ts`
  - next/image usage detection
  - Font loading hints (next/font vs external)
  - Blocking scripts / third-party scripts
  - Produces simple “checks” booleans used in the UI

- **Performance checks (PageSpeed Insights / Lighthouse data)**: `lib/audit/performance.ts`
  - Core metrics like LCP/CLS/TTFB/Speed Index when configured
  - Falls back to placeholders if `PAGESPEED_INSIGHTS_API_KEY` is not set (see `.env.example` / `.env.local.example`)

Each analyzer returns:

- A category score (0–100)
- A set of issues with severity + suggested fixes
- Some metadata (e.g., SEO meta values, performance metrics, Next.js checks)

### 5) Score + grade

Scoring is computed in:

- `lib/audit/scoring.ts`

RouteRank generates:

- **SEO score** (0–100)
- **Performance score** (0–100)
- **Next.js score** (0–100)
- **Overall score** as a weighted average (SEO 40%, Performance 40%, Next.js 20%)
- **Letter grade** (A–F)

Issues are prioritized so the UI can show the highest-impact fixes first.

### 6) Persist results (Supabase)

When the audit completes, the background process updates the database:

- Updates the scan row with scores + metadata (`lighthouse_data`) and marks it `completed`
- Inserts issues into `audit_issues` (with DB-safe severities: `error|warning|info`)

Table definitions live in:

- `supabase/migrations/20260102_initial_schema.sql`

### 7) Show results in the UI

The results page is:

- `app/(dashboard)/scan/[id]/page.tsx`

It calls:

- `GET /api/scans/[id]` (`app/api/scans/[id]/route.ts`)

While a scan is `pending`/`running`, the page polls for updates. When the scan reaches `completed`/`failed`, polling stops and the final results are rendered:

- Scores + breakdown
- Detailed metrics (Core Web Vitals + metadata)
- Actionable “How to get a higher score” recommendations

---

## 🖥️ UI Pages

- **Landing Page** – value prop, sample report, pricing
- **Scan Page** – URL input, progress indicator
- **Results Dashboard** – scores, collapsible sections, code fixes

Example fix output:

```tsx
export const metadata: Metadata = {
  title: 'Pricing | MyApp',
  description: 'Simple pricing for MyApp',
};
```

---

## 🛠 Tech Stack

**Frontend**

- Next.js (App Router)
- Tailwind CSS
- Recharts

**Backend**

- Server Actions
- API routes for scans
- Supabase (Auth, Database, Storage)

**Tooling**

- Lighthouse (headless Chrome)
- Cheerio (HTML parsing)

---

## 💳 Monetization

### Free

- 1 scan/day
- Score summary only

### Pro – $19/month

- Unlimited scans
- Full audit breakdown
- Code fix suggestions
- PDF export
- Scan history

### Agency – $49/month

- Multiple sites
- White-labeled PDF reports
- Shareable client links

Payments handled via **Stripe subscriptions**.

---

## 🗺 Roadmap

### Phase 1 – Foundation

- [ ] Project setup (Next.js App Router)
- [ ] Landing page
- [ ] URL scan input
- [ ] HTML fetch & parsing
- [ ] Basic SEO checks

### Phase 2 – Performance

- [ ] Lighthouse integration
- [ ] Core Web Vitals scoring
- [ ] Performance report UI

### Phase 3 – Next.js Intelligence

- [ ] App Router–specific checks
- [ ] Client/server component analysis
- [ ] Metadata best practice detection
- [ ] Code fix suggestions

### Phase 4 – Productization

- [ ] Authentication
- [ ] Stripe subscriptions
- [ ] PDF export
- [ ] Scan history

### Phase 5 – Launch & Growth

- [ ] Public launch
- [ ] Free scan sharing
- [ ] “Powered by RouteRank” badge

---

## 🤖 GitHub Copilot Usage

Copilot is leveraged for:

- Audit boilerplate logic
- Lighthouse configuration
- Parsing utilities
- Scoring helpers
- Repetitive UI components

This allows focus on **audit quality and UX**, not plumbing.

---

## 📈 Future Ideas

- GitHub CI action
- VS Code extension
- Chrome DevTools extension
- Regression tracking & alerts

---

## ✅ Project Goals

- Ship a focused MVP quickly
- Validate demand with real users
- Build a sustainable, Next.js-focused SaaS
- Serve as a strong portfolio and interview project

---

**Status:** Planning / MVP build

---

## 📋 Implementation Plan

For a detailed step-by-step guide on how this project is being built, see [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).
