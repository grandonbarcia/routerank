# RouteRank Implementation Plan

This document outlines the step-by-step execution strategy for building **RouteRank**, a Next.js-native SEO and Performance audit tool.

## 🛠 Tech Stack Additions

Beyond the core stack (Next.js, Tailwind, TS, Supabase), we will use:

- **Zod**: Schema validation for API inputs and database models.
- **Lucide React**: Icon library (standard with shadcn/ui).
- **Framer Motion**: For smooth transitions and progress animations during scans.
- **React Hook Form**: For handling the scan input and user settings.
- **Puppeteer / Playwright**: To run Lighthouse in a headless browser environment.
- **Resend**: For transactional emails (welcome, scan reports).
- **Stripe SDK**: For subscription management.

---

## 📅 Phase 1: Foundation & Infrastructure

- [ ] **Supabase Setup**
  - Create a new Supabase project.
  - Initialize the database schema (see Schema section below).
  - Configure Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- [ ] **UI Framework**
  - Initialize `shadcn/ui` and install base components (Button, Input, Card, Progress, Tabs, Accordion).
  - Setup a global layout with a navigation bar and footer.
- [ ] **Database Schema**
  - `profiles`: id, email, subscription_tier, scan_count_today.
  - `scans`: id, user_id, url, seo_score, performance_score, nextjs_score, created_at.
  - `audit_issues`: id, scan_id, type (seo/perf/nextjs), severity, message, fix_code.

## 📅 Phase 2: Authentication & User Flow

- [ ] **Supabase Auth Integration**
  - Implement Login, Signup, and OAuth (GitHub/Google) using Supabase Auth Helpers for Next.js.
  - Create a middleware to protect `/dashboard` and `/scan` routes.
- [ ] **User Profile**
  - Sync Supabase Auth users with the `profiles` table via database triggers.

## 📅 Phase 3: The Audit Engine (MVP)

- [ ] **HTML Parser Service**
  - Create a utility using `Cheerio` to fetch and parse target URLs.
  - Implement basic SEO checks: `<title>`, `<meta description>`, OpenGraph tags, Canonical tags.
- [ ] **Lighthouse Integration**
  - Setup a Server Action or API Route that triggers a headless browser (Puppeteer) to run Lighthouse.
  - Extract LCP, CLS, and INP metrics.
- [ ] **Scoring Logic**
  - Implement the weighted scoring algorithm for the three categories.
  - Save scan results and issues to Supabase.

## 📅 Phase 4: Scan Experience & Dashboard

- [ ] **Scan Interface**
  - Build the URL input form with validation.
  - Implement a "Scanning..." state with a progress bar and real-time status updates (using Supabase Realtime or simple polling).
- [ ] **Results Dashboard**
  - Use `Recharts` to visualize scores (Radial charts or Gauges).
  - Create collapsible sections for "Passed Audits" and "Issues Found".
  - Display code snippets for suggested fixes using a syntax highlighter (e.g., `react-syntax-highlighter`).

## 📅 Phase 5: Next.js Intelligence

- [ ] **App Router Specifics**
  - Detect if the site uses the Metadata API vs legacy `<Head>`.
  - Analyze script loading (detect `next/script`).
  - Check for `next/image` optimization.
- [ ] **Advanced Analysis**
  - Route depth and sitemap.xml validation.

## 📅 Phase 6: Monetization & Stripe

- [ ] **Stripe Integration**
  - Setup Stripe products and prices.
  - Implement a checkout flow for "Pro" and "Agency" tiers.
  - Create a Webhook handler to update user subscription status in Supabase.
- [ ] **Usage Limiting**
  - Implement logic to check `scan_count_today` against the user's tier before starting a scan.

## 📅 Phase 7: Polish & Launch

- [ ] **PDF Generation**
  - Use `jspdf` or a server-side solution to export the results dashboard to PDF.
- [ ] **Scan History**
  - Build a "My Scans" page to view and compare past reports.
- [ ] **Deployment**
  - Deploy to Vercel.
  - Configure custom domain and SSL.

---

## 💡 Pro-Tip for Implementation

Start with a **"Local Only"** version of the Audit Engine. Get the HTML parsing and scoring working for a single URL before worrying about the database or auth. This ensures the core value proposition is solid first.
