# GitHub OAuth Setup Guide

## ✅ OAuth Implementation Complete

The GitHub OAuth buttons are now fully functional in both login and signup pages. Follow this guide to enable them in Supabase.

---

## 📋 Step-by-Step Setup

### 1. Create GitHub OAuth Application

1. Go to **GitHub Settings** → **Developer settings** → **OAuth Apps**

   - URL: https://github.com/settings/developers

2. Click **New OAuth App** and fill in:

   - **Application name:** RouteRank
   - **Homepage URL:** `https://yourdomain.com` (or `http://localhost:3000` for local development)
   - **Authorization callback URL:** `https://yourdomain.com/auth/callback` (important!)

3. Copy your:
   - **Client ID**
   - **Client Secret** (keep this private!)

---

### 2. Configure Supabase OAuth

1. Go to **Supabase Dashboard** → Your Project → **Authentication** → **Providers**

2. Find **GitHub** and click to expand

3. Enable GitHub by toggling the switch

4. Paste your credentials:

   - **Client ID:** (from GitHub)
   - **Client Secret:** (from GitHub)

5. Click **Save**

---

### 3. Add Redirect URL (Important!)

In Supabase:

1. Go to **Authentication** → **URL Configuration**

2. Add your callback URL to **Allowed redirect URLs:**

   ```
   http://localhost:3000/auth/callback
   https://yourdomain.com/auth/callback
   ```

3. Save

---

## 🔍 How It Works

### Login Flow

1. User clicks "Sign in with GitHub"
2. `handleGitHubSignIn()` is called
3. Redirects to GitHub authorization page
4. User approves access
5. GitHub redirects back to `/auth/callback` with `code`
6. Callback route exchanges code for session
7. User is logged in and redirected to `/dashboard`

### Signup Flow

- Same as login flow
- If user doesn't exist, Supabase creates a new account
- User profile is automatically created

---

## 🧪 Testing Locally

### Prerequisites

```bash
npm install @supabase/supabase-js
npm install @supabase/ssr
```

### Local Testing Steps

1. **Create GitHub OAuth App** (as above)

   - Set redirect URL to: `http://localhost:3000/auth/callback`

2. **Update Supabase:**

   - Add `http://localhost:3000/auth/callback` to allowed redirects

3. **Run locally:**

   ```bash
   npm run dev
   # Visit http://localhost:3000/login
   ```

4. **Test GitHub OAuth:**
   - Click "Sign in with GitHub"
   - You should be redirected to GitHub
   - After approval, redirected back to dashboard

---

## 📦 Environment Variables (Optional)

The OAuth setup is done through Supabase dashboard, but if needed, you can reference these in code:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yskqtifbxbuycwexkgzm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

These are already configured in `.env.local`

---

## 🔗 Key Files

- `app/(auth)/login/page.tsx` - Login page with GitHub button
- `app/(auth)/signup/page.tsx` - Signup page with GitHub button
- `app/auth/callback/route.ts` - OAuth callback handler
- `lib/supabase/client.ts` - Supabase client instance

---

## ✨ Features Implemented

✅ **GitHub OAuth Login** - Existing users sign in with GitHub
✅ **GitHub OAuth Signup** - New users can create account with GitHub
✅ **Auto Profile Creation** - Profile created on first GitHub login
✅ **Session Management** - Sessions handled by Supabase
✅ **Error Handling** - User-friendly error messages
✅ **Loading States** - Button shows "Connecting..." while processing
✅ **Redirect After Login** - Redirects to `/dashboard` on success
✅ **Dark Mode Support** - OAuth buttons work in light and dark mode

---

## 🆘 Troubleshooting

### Issue: "Invalid redirect URI"

**Solution:** Make sure your redirect URL in GitHub matches exactly:

- For local: `http://localhost:3000/auth/callback`
- For production: `https://yourdomain.com/auth/callback`

### Issue: "OAuth provider disabled"

**Solution:** Make sure GitHub is enabled in Supabase dashboard under Providers

### Issue: "User cancelled login"

**Solution:** This is normal - user clicked "Cancel" on GitHub. Try again.

### Issue: Button doesn't respond

**Solution:**

1. Check browser console for errors
2. Verify Supabase credentials in `.env.local`
3. Restart dev server: `npm run dev`

---

## 🎯 Next Steps

1. **Create GitHub OAuth App** (GitHub Settings)
2. **Enable GitHub in Supabase** (Supabase Dashboard)
3. **Add Callback URL** to Supabase allowed redirects
4. **Test Locally** (http://localhost:3000)
5. **Deploy to Production** (Vercel)
6. **Update Production URLs** (GitHub and Supabase)

---

## 📚 Additional Resources

- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [GitHub OAuth Docs](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Supabase Client Docs](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)

---

**GitHub OAuth is now fully integrated! Follow the setup steps above to enable it.** ✅
