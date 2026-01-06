# Phase 8: Deployment & Launch Guide

## 🚀 Pre-Deployment Checklist

### Environment & Secrets

- [ ] All `.env.local` values replaced with production secrets
- [ ] Stripe API keys (test → production)
- [ ] Supabase credentials configured
- [ ] Database migrations applied on production
- [ ] NEXT_PUBLIC_APP_URL set to production domain

### Code Quality

- [ ] Run `npm run lint` - all errors fixed
- [ ] Run `npm run build` - builds successfully
- [ ] All TypeScript errors resolved
- [ ] No console warnings in production

### Database

- [ ] Run all migrations: `npx prisma migrate deploy` (or Supabase equivalent)
- [ ] RLS policies enabled and tested
- [ ] Backup created before deployment

### Testing

- [ ] Test scan flow end-to-end (form → audit → results)
- [ ] Test auth (signup, login, logout)
- [ ] Test Stripe checkout (test mode)
- [ ] Test payment webhooks
- [ ] Test usage limits
- [ ] Test share/export features
- [ ] Mobile responsiveness verified
- [ ] Dark mode tested

## 📋 Vercel Deployment Steps

### 1. Connect Repository

```bash
# Push code to GitHub
git push origin main

# In Vercel dashboard:
# 1. Click "Add New Project"
# 2. Select your GitHub repository
# 3. Select "Next.js" framework
```

### 2. Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_value
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
SUPABASE_SERVICE_ROLE_KEY=your_value
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_AGENCY_PRICE_ID=price_xxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional (enables real PageSpeed/Lighthouse metrics instead of placeholders)
PAGESPEED_INSIGHTS_API_KEY=your_value
```

### 3. Configure Build Settings

- Framework: Next.js
- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `npm ci`

### 4. Deploy

- Click "Deploy" button
- Vercel will build and deploy automatically
- Get production URL

## 🗄️ Database Setup (Supabase)

### 1. Create Production Database

```bash
# In Supabase dashboard, create new project:
# - Select region closest to users
# - Create strong password for postgres role
```

### 2. Run Migrations

```bash
# Using Supabase CLI:
supabase link --project-ref your_project_ref
supabase db push

# Or manually run migrations in SQL editor:
# Copy contents of supabase/migrations/*.sql
```

### 3. Enable RLS (Row Level Security)

```sql
-- Run in Supabase SQL editor:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_issues ENABLE ROW LEVEL SECURITY;

-- Verify policies are created
SELECT * FROM pg_policies;
```

### 4. Test Authentication

- Sign up with email
- Verify email confirmation works
- Check profile is created
- Verify user can access dashboard

## 💳 Stripe Setup

### 1. Create Products

- Go to Stripe Dashboard → Products
- Create "RouteRank Pro" product
  - Price: $19/month
  - Copy Price ID: `price_xxx`
- Create "RouteRank Agency" product
  - Price: $49/month
  - Copy Price ID: `price_xxx`

### 2. Configure Webhook

```
Stripe Dashboard → Webhooks → Add endpoint

Endpoint: https://yourdomain.com/api/webhook/stripe

Events to subscribe to:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed

Copy Signing Secret: whsec_xxx
```

### 3. Test Checkout

- Use Stripe test cards:
  - Success: 4242 4242 4242 4242
  - Decline: 4000 0000 0000 0002
  - Requires auth: 4000 2500 0000 3155

## 🔒 Security Checklist

- [ ] All secrets in environment variables (never in code)
- [ ] CORS configured for API routes
- [ ] Rate limiting implemented on API endpoints
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] CSP headers configured
- [ ] No sensitive data in error messages
- [ ] Audit logs for important actions
- [ ] Passwords hashed (handled by Supabase Auth)
- [ ] API keys rotated regularly

## 📊 Monitoring & Analytics

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

Setup Sentry in `next.config.ts`:

```typescript
import { withSentryConfig } from '@sentry/nextjs';

export default withSentryConfig(
  {
    // your Next.js config
  },
  {
    org: 'your-org',
    project: 'routerank',
    authToken: process.env.SENTRY_AUTH_TOKEN,
  }
);
```

### Analytics (Vercel Web Analytics)

- Automatically enabled in Vercel
- View in Vercel Dashboard → Analytics

### Performance Monitoring

- Use Vercel Analytics Dashboard
- Monitor Core Web Vitals
- Check deployment performance

## 📧 Email Setup (Optional but Recommended)

### Confirmation Emails

- Handled by Supabase Auth (Supabase email sender)
- Or use SendGrid/Resend for custom templates

### Transactional Emails

For scan completion, payment receipts:

```bash
npm install resend
# or
npm install nodemailer
```

Create email templates and send on:

- Scan completed
- Subscription successful
- Payment failed

## 🚨 Post-Launch Monitoring

### First 24 Hours

- [ ] Monitor error logs in Sentry/Vercel
- [ ] Check database performance
- [ ] Monitor API response times
- [ ] Verify Stripe webhooks firing
- [ ] Check user sign-ups
- [ ] Monitor infrastructure costs

### Daily (First Week)

- [ ] Review error reports
- [ ] Check uptime
- [ ] Monitor scan queue depth
- [ ] Verify backups running

### Weekly

- [ ] Performance review
- [ ] Cost analysis
- [ ] User feedback review
- [ ] Security updates check

## 📈 Scaling Considerations

### As Traffic Grows

1. **Database**

   - Monitor connection pool
   - Add read replicas if needed
   - Scale PostgreSQL tier

2. **Background Jobs**

   - Implement job queue (Bull, RQ, etc.)
   - Don't run audits in serverless (timeouts)
   - Consider dedicated worker server

3. **Caching**

   - Add Redis for cache (Vercel KV)
   - Cache audit results
   - Cache user profiles

4. **CDN**

   - Static assets via CDN (Vercel handles)
   - Cache HTML pages if applicable

5. **API Rate Limiting**
   - Implement rate limiting middleware
   - Whitelist trusted clients
   - Monitor rate limit breaches

## 📝 Documentation

- [ ] Create user docs (Help Center)
- [ ] Document API endpoints
- [ ] Create troubleshooting guide
- [ ] Document payment flows
- [ ] Create admin panel docs

## 🎉 Launch Announcement

### Before Launch

- [ ] Website live and tested
- [ ] Email list ready
- [ ] Social media posts scheduled
- [ ] Product Hunt submission prepared
- [ ] Press release written

### Launch Day

- [ ] Post on Product Hunt
- [ ] Announce on Twitter/LinkedIn
- [ ] Send email to waitlist
- [ ] Monitor system closely
- [ ] Respond to user feedback

## 📋 Post-Launch Tasks

- [ ] Collect user feedback
- [ ] Monitor feature requests
- [ ] Iterate on pricing if needed
- [ ] Improve onboarding based on dropoff
- [ ] Add more audit checks
- [ ] Expand to more platforms/frameworks
- [ ] Build team workspace features
- [ ] Create premium reporting features

---

## 🆘 Troubleshooting

### Deployment Issues

**Build fails:**

```bash
# Clear build cache and redeploy
npm run build
# Check for TypeScript errors
npx tsc --noEmit
```

**Environment variables not loading:**

- Verify in Vercel dashboard
- Restart deployment
- Check variable names match code

### Database Issues

**Connection timeout:**

- Check IP whitelist in Supabase
- Verify SUPABASE_URL and keys
- Check database size limits

**Migration fails:**

- Review error message
- Check migration file syntax
- Backup before running migrations

### Stripe Issues

**Webhook not firing:**

- Verify endpoint URL
- Check signing secret
- Review Stripe logs
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook/stripe`

**Charges not processing:**

- Check Stripe keys (test vs. live)
- Verify price IDs match
- Check webhook logs

---

**Estimated Time: 2-4 hours for initial deployment**

Good luck with your launch! 🚀
