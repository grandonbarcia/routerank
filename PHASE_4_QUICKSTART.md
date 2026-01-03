# Phase 4 Quick Start Guide 🚀

## Prerequisites

- Node.js 18+ installed
- npm installed
- Supabase account (free tier available)
- Stripe account (optional for testing)

## Setup (5 minutes)

### 1. Get Supabase Keys

1. Go to https://supabase.com/dashboard
2. Create new project or select existing
3. Go to Settings → API
4. Copy: `Project URL` and `anon key`
5. Go to Settings → Database → Connection pooling
6. Copy the `service_role_key`

### 2. Update .env.local

```bash
# Edit .env.local in project root
NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Setup Supabase Database

```bash
# Run migrations to create tables
npm run db:migrate
# Or manually run: supabase/migrations/20260102_initial_schema.sql
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing the Scan Flow

### 1. Create Account

- Navigate to http://localhost:3000/signup
- Create test account
- Verify email (check Supabase Auth logs)

### 2. Try a Scan

- Click "Dashboard" → "New Audit"
- Enter a URL: `https://nextjs.org`
- Click "Start Audit"
- Watch progress page auto-refresh
- View results when complete (2-3 minutes)

### 3. View History

- Click "View History"
- See all your past scans
- Click a scan to view results

### 4. Check Dashboard

- Navigate to /dashboard
- See stats and recent scans

## API Testing (with curl)

### Create Scan

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"url": "https://example.com", "fullAudit": true}'
```

### List Scans

```bash
curl http://localhost:3000/api/scans \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Single Scan

```bash
curl http://localhost:3000/api/scans/SCAN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Debugging

### View Logs

```bash
# Terminal running npm run dev shows real-time logs
# Check for [Audit], [API], [Background Job] prefixes
```

### Common Issues

**"Unauthorized" error**

- Make sure you're logged in
- Check token in browser cookies

**"Scan limit reached"**

- Free tier: 1 scan per day
- Limit resets at midnight

**"Failed to fetch URL"**

- Check if URL is publicly accessible
- Some sites block automated requests
- Check Supabase logs for details

**"No issues found"**

- This is normal! Some sites are well-optimized
- Try a site with known issues

## File Structure

```
app/
├── (dashboard)/
│   ├── dashboard/page.tsx    # Stats & recent scans
│   ├── scan/page.tsx         # Scan input form
│   ├── scan/[id]/page.tsx    # Results dashboard
│   └── history/page.tsx      # Scan history
├── api/
│   ├── scan/route.ts         # POST /api/scan
│   ├── scans/route.ts        # GET /api/scans
│   └── scans/[id]/route.ts   # GET /api/scans/[id]
lib/
├── audit/
│   ├── fetcher.ts    # HTML fetching
│   ├── seo.ts        # SEO checks
│   ├── nextjs.ts     # Next.js checks
│   ├── performance.ts # Performance checks
│   ├── scoring.ts    # Scoring algorithm
│   └── execute.ts    # Orchestrator
└── supabase/
    ├── client.ts     # Browser client
    ├── server.ts     # Server client
    └── middleware.ts # Session refresh
```

## Performance Notes

### Audit Duration

- **Quick Audit:** ~15 seconds (SEO, Next.js only)
- **Full Audit:** ~2-3 minutes (includes PageSpeed)

### Database

- Scans: Stored in `scans` table
- Issues: Stored in `audit_issues` table
- Profiles: Stored in `profiles` table

## Next Steps

1. **Configure Stripe** (Phase 5)

   - Get API keys from dashboard
   - Create products and prices
   - Add to .env.local

2. **Add More Checks**

   - Extend `lib/audit/seo.ts`
   - Add custom audit rules
   - Adjust scoring weights

3. **Customize Styling**

   - Modify Tailwind colors in `globals.css`
   - Update logo/branding
   - Add custom fonts

4. **Deploy**
   - Push to GitHub
   - Connect to Vercel
   - Add Supabase to Vercel env vars

## Support

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Tailwind Docs: https://tailwindcss.com/docs

Happy auditing! 🎉
