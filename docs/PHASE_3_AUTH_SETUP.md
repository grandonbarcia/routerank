# Phase 3: Authentication Setup Guide

## Overview

Phase 3 implements complete authentication with email/password sign-up and login, profile management, and email verification.

## Components Implemented

### 1. Database Schema

**File**: `supabase/migrations/20260102_initial_schema.sql`

The schema includes:

- **profiles** table: Extends auth.users with subscription tier, scans count tracking
- **scans** table: Stores SEO/performance audit results
- **audit_issues** table: Specific findings from scans
- **sites** table: For Agency tier multi-site management
- **RLS (Row Level Security)** policies: Ensures users can only access their own data
- **Triggers**: Auto-create profile on signup, update timestamps automatically
- **Indexes**: Performance optimization for common queries

**To deploy to Supabase:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/)
2. Select your project
3. Go to "SQL Editor" (left sidebar)
4. Click "New Query"
5. Copy the entire contents of `supabase/migrations/20260102_initial_schema.sql`
6. Paste into the SQL Editor
7. Click "RUN"

### 2. Authentication Server Actions

**File**: `lib/auth/actions.ts`

Implemented functions:

- `signUp()` - Email/password registration with validation
- `signIn()` - Login with email/password
- `signOut()` - Logout and redirect
- `resetPassword()` - Send password reset email
- `updateProfile()` - Update user's full name

All functions use Zod for type-safe validation.

### 3. useUser Hook

**File**: `hooks/use-user.ts`

Provides:

- Current authenticated user from Supabase Auth
- User profile from database (subscription, scans, etc.)
- Real-time auth state listening
- Proper cleanup on component unmount

Usage:

```tsx
const { user, profile, loading } = useUser();
```

### 4. Auth Pages

#### Login Page: `app/(auth)/login/page.tsx`

- Form connected to `signUp()` server action
- Email/password validation
- Toast notifications for errors
- Redirect to dashboard on success
- Link to signup page

#### Signup Page: `app/(auth)/signup/page.tsx`

- Registration form with full name, email, password confirmation
- Form connected to `signUp()` server action
- Toast notifications
- Success message with email confirmation prompt
- Link to login page

### 5. Auth Callback

**File**: `app/auth/callback/route.ts`

Handles email verification redirects from Supabase:

- Exchanges verification code for session
- Redirects to dashboard after confirmation

### 6. Updated Header

**File**: `components/layout/header.tsx`

Now shows:

- User's full name when logged in
- Dashboard link
- Logout button
- Sign up/Login links when not authenticated

## Configuration Required

### 1. Environment Variables

Ensure `.env.local` contains:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabase Email Configuration

1. Go to Supabase Dashboard → Settings → Email Templates
2. Verify email template includes the callback URL
3. Configure in project settings

## Flow Diagrams

### Sign Up Flow

```
Signup Form
    ↓
signUp() server action
    ↓
Supabase Auth.signUp()
    ↓
Profile auto-created (via trigger)
    ↓
Confirmation email sent
    ↓
User clicks email link
    ↓
Auth callback exchanges code
    ↓
Redirects to /dashboard
```

### Sign In Flow

```
Login Form
    ↓
signIn() server action
    ↓
Supabase Auth.signInWithPassword()
    ↓
Session created
    ↓
Redirects to /dashboard
    ↓
useUser() hook loads profile
```

### Protected Routes

```
Middleware (middleware.ts)
    ↓
Checks session with refreshToken
    ↓
Updates session if needed
    ↓
Allows access to /dashboard/*
    ↓
Or redirects to /login
```

## Testing the Auth Flow

### Test 1: Sign Up

1. Go to `http://localhost:3000/signup`
2. Fill in all fields
3. Click "Create Account"
4. Should see success message
5. Check your email for verification link
6. Click link to verify
7. Should be redirected to dashboard

### Test 2: Sign In

1. After email verification, go to `/login`
2. Enter email and password
3. Should redirect to `/dashboard`
4. Header should show user's name

### Test 3: Protected Routes

1. Logout
2. Try to access `http://localhost:3000/dashboard`
3. Should redirect to `/login`

### Test 4: Logout

1. While logged in, click Logout in header
2. Should redirect to home page
3. Header should show Sign Up/Login buttons again

## Security Features Implemented

1. **Zod Validation**: All inputs validated server-side
2. **RLS Policies**: Users can only access their own data
3. **Session Management**: Automatic refresh with middleware
4. **Email Verification**: Accounts require email confirmation
5. **Password Reset**: Secure token-based password recovery
6. **CSRF Protection**: Built into Supabase + Next.js

## Next Steps (Phase 4)

After confirming authentication works:

1. Implement the audit engine (Cheerio, Puppeteer, Lighthouse)
2. Create scan execution logic
3. Build results display
4. Implement scoring algorithm

## Troubleshooting

### Issue: "Could not connect to database"

- Verify `NEXT_PUBLIC_SUPABASE_URL` and key are correct
- Check Supabase project is active

### Issue: "Email not being received"

- Go to Supabase Dashboard → Email Templates
- Verify sender email is configured
- Check spam folder
- Allow 30 seconds for delivery

### Issue: "Code exchange failed"

- Ensure `NEXT_PUBLIC_APP_URL` matches your domain exactly
- Verify `auth/callback` route exists
- Check redirect URL in email matches configured domain

### Issue: "Cannot read property 'full_name' of null"

- Trigger may not have created profile
- Manually create profile: INSERT INTO profiles (id, full_name) VALUES (user_id, name)
- Check RLS policy allows profile creation

## Files Modified/Created

**Created:**

- `lib/auth/actions.ts` - Server actions for auth
- `hooks/use-user.ts` - useUser hook
- `supabase/migrations/20260102_initial_schema.sql` - Database schema
- `app/auth/callback/route.ts` - Email verification handler

**Modified:**

- `app/(auth)/login/page.tsx` - Connected to signIn action
- `app/(auth)/signup/page.tsx` - Connected to signUp action
- `components/layout/header.tsx` - Updated to show user info
- `app/layout.tsx` - Already has Providers wrapper

## Testing Checklist

- [ ] Database schema deployed to Supabase
- [ ] Environment variables configured
- [ ] Sign up form submits successfully
- [ ] Email verification works
- [ ] Login redirects to dashboard
- [ ] useUser hook loads profile data
- [ ] Header shows user name when logged in
- [ ] Logout clears session and redirects
- [ ] Protected routes redirect to login when not authenticated
