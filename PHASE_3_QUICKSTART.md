# Phase 3 Quick Start Guide

## Deploy to Supabase (5 minutes)

1. Open [Supabase Dashboard](https://supabase.com/dashboard/)
2. Select your project
3. Go to "SQL Editor" → "New Query"
4. Copy entire contents of: `supabase/migrations/20260102_initial_schema.sql`
5. Paste into editor
6. Click "RUN"
7. ✅ Schema deployed!

## Environment Setup

Add to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Start Dev Server

```bash
npm run dev
```

## Test Authentication

### 1. Sign Up

- Go to `http://localhost:3000/signup`
- Fill in: Full Name, Email, Password
- Click "Create Account"
- See confirmation message
- Check email for verification link

### 2. Verify Email

- Click link in verification email
- Should redirect to `/dashboard`
- Should show "Welcome back" (if auto-signin configured)

### 3. Sign In

- Go to `http://localhost:3000/login`
- Enter email and password
- Should redirect to `/dashboard`
- Header shows your name

### 4. Sign Out

- Click "Logout" in header
- Redirects to home page
- Header shows Sign In/Sign Up buttons again

## Authentication Flow Diagram

```
Signup → Email Verification → Email Confirmation → Dashboard
          (check email)        (click link)         (logged in)

Login → Credentials → Dashboard (logged in)

Logout → Homepage (logged out)
```

## Key Files Location

| What             | Where                                             |
| ---------------- | ------------------------------------------------- |
| Auth actions     | `lib/auth/actions.ts`                             |
| User hook        | `hooks/use-user.ts`                               |
| DB schema        | `supabase/migrations/20260102_initial_schema.sql` |
| Signup page      | `app/(auth)/signup/page.tsx`                      |
| Login page       | `app/(auth)/login/page.tsx`                       |
| Email callback   | `app/auth/callback/route.ts`                      |
| Header component | `components/layout/header.tsx`                    |

## What's Working

✅ User registration with email verification  
✅ User login with session management  
✅ Logout functionality  
✅ Protected `/dashboard` route (returns to login if not auth)  
✅ useUser hook for getting current user + profile  
✅ Toast notifications for all actions  
✅ Database with RLS policies  
✅ Real-time auth state listening

## What's Next (Phase 4)

- Implement audit engine (Cheerio, Puppeteer, Lighthouse)
- Create scan execution logic
- Build results display pages
- Implement scoring algorithm

## Common Issues

**"Email not sent"**
→ Check Supabase Email Templates are configured

**"Cannot read full_name"**
→ The database trigger auto-creates profiles. If it fails, manually insert:

```sql
INSERT INTO profiles (id, full_name) VALUES (user_id, 'name')
```

**"Redirect loop on login"**
→ Ensure middleware.ts exists and session refresh is working

**"Cannot sign in after verification"**
→ Wait 30 seconds for email to be sent and verified

---

**You're ready to start Phase 4!** 🚀
