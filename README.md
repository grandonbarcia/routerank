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
- shadcn/ui
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
