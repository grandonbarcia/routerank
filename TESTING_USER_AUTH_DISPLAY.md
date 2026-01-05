# Testing Guide: User Authentication Display

## Test Environment Setup

Before testing, ensure:

1. Your development server is running (`npm run dev`)
2. Supabase is configured with email/password and GitHub OAuth
3. You have a test account created, or can create one

## Quick Test Scenarios

### Scenario 1: Email/Password Login

**Steps:**

1. Navigate to `http://localhost:3000`
2. Click "Get Started" button
3. Click "Create Account" link
4. Enter test email and password
5. Click "Sign Up"

**Expected Results:**

- ✅ Redirect to `/dashboard`
- ✅ Navbar shows user avatar with email initial
- ✅ Navbar shows first part of email (before @) or name
- ✅ Dashboard shows full user profile card with:
  - User avatar
  - Welcome message with user name
  - Account created date
  - "Active account" status indicator
  - "Edit Profile" button
  - Current Plan: Free
  - Email address
  - Auth Method: "Email & Password"
  - Account Status: Verified

### Scenario 2: GitHub OAuth Login

**Steps:**

1. Navigate to `http://localhost:3000`
2. Click "Get Started" button
3. Click "Or continue with GitHub" button
4. Authorize the application in GitHub
5. Auto-redirected back to app

**Expected Results:**

- ✅ Redirect to `/dashboard`
- ✅ Navbar shows user avatar with GitHub initial
- ✅ Dashboard shows user info with:
  - GitHub username or email
  - Auth Method: "GitHub OAuth"
  - All other fields same as email login
- ✅ Profile object fetched from database

### Scenario 3: User Menu Dropdown (Desktop)

**Steps:**

1. Login with any method
2. Look at navbar (right side)
3. Click on user avatar/name button

**Expected Results:**

- ✅ Dropdown menu appears
- ✅ Shows full name/email at top
- ✅ Shows subscription tier (Free/Pro/Agency)
- ✅ "Dashboard" link shown
- ✅ "Settings" link shown
- ✅ "Logout" button shown with icon

### Scenario 4: User Menu Dropdown (Mobile)

**Steps:**

1. Login with any method
2. Open dev tools and enable mobile view
3. Look at navbar right side
4. Click hamburger menu icon or user avatar

**Expected Results:**

- ✅ Navigation menu appears
- ✅ All menu items visible
- ✅ Logout button appears in mobile menu
- ✅ Can click logout and return to home

### Scenario 5: Logout Functionality

**Steps:**

1. Login with any method
2. Click user avatar/name in navbar
3. Click "Logout" button

**Expected Results:**

- ✅ Dropdown closes
- ✅ Redirect to homepage (`/`)
- ✅ Navbar changes to show "Login" and "Get Started"
- ✅ If refresh page, still logged out
- ✅ Cannot access protected pages (redirect to login)

### Scenario 6: Dark Mode with User Menu

**Steps:**

1. Login with any method
2. Click moon/sun icon in navbar
3. Toggle dark mode on and off
4. Click user avatar to open menu

**Expected Results:**

- ✅ Avatar background is gradient in both modes
- ✅ Avatar text is white in both modes
- ✅ Dropdown background changes with dark mode
- ✅ Text colors adapt properly
- ✅ No color contrast issues

### Scenario 7: Dashboard Profile Card

**Steps:**

1. Login with any method
2. Navigate to `/dashboard`
3. Scroll to top

**Expected Results:**

- ✅ Profile card visible at top
- ✅ Large avatar with user initial
- ✅ Welcome message with name/email
- ✅ Active account indicator (green dot)
- ✅ Account creation date displayed
- ✅ "Edit Profile" button visible
- ✅ Subscription info grid shows 4 items:
  - Current Plan
  - Email
  - Auth Method
  - Account Status

### Scenario 8: Edit Profile Navigation

**Steps:**

1. Login with any method
2. Go to dashboard
3. Click "Edit Profile" button in profile card
4. OR click "Edit Profile" button in navbar dropdown
5. OR click "Settings" link

**Expected Results:**

- ✅ Navigate to `/settings` page
- ✅ Settings page shows current user info
- ✅ Can see billing/subscription info

### Scenario 9: Session Persistence

**Steps:**

1. Login with any method
2. Close the browser tab
3. Open new tab and go to `http://localhost:3000/dashboard`

**Expected Results:**

- ✅ Still logged in (session persisted)
- ✅ User menu shows immediately
- ✅ No need to login again

### Scenario 10: Multiple Logins

**Steps:**

1. Login with email/password
2. Logout
3. Login with GitHub OAuth
4. Check navbar

**Expected Results:**

- ✅ Both login methods work
- ✅ User info updates correctly
- ✅ Auth method displays correctly (different each time)
- ✅ No data from previous login persists

## Visual Checklist

### Navbar (Logged In)

- [ ] User avatar is circular with gradient background
- [ ] Avatar has user initial in white text
- [ ] User name/email shows next to avatar
- [ ] Avatar is ~8px by 8px (appropriate size)
- [ ] Dropdown appears on click
- [ ] Dropdown positioned correctly (right-aligned)
- [ ] Dropdown has proper spacing and borders
- [ ] Logout button has red text and LogOut icon
- [ ] Theme toggle still works
- [ ] All elements responsive on mobile

### Dashboard Profile Card

- [ ] Card has gradient background (blue on light, gray on dark)
- [ ] Avatar is ~16px by 16px
- [ ] Welcome message is clear and friendly
- [ ] Account creation date formatted nicely
- [ ] Active account indicator visible (green dot)
- [ ] Edit Profile button positioned at top right
- [ ] Subscription grid is organized (2 or 4 columns)
- [ ] All labels are visible and readable
- [ ] Values are populated correctly
- [ ] Auth method shows correctly

### Mobile View

- [ ] User avatar button in navbar right side
- [ ] Mobile menu shows logout option
- [ ] All dashboard elements stack properly
- [ ] Subscription grid adapts to 2 columns
- [ ] User menu accessible and usable
- [ ] No horizontal scrolling
- [ ] Text sizes readable on small screens

## Debug Commands

If something isn't working, check these in browser console:

```javascript
// Check if user is logged in
const {
  data: { user },
} = await supabase.auth.getUser();
console.log('Current user:', user);

// Check user profile
const { data: profile } = await supabase.from('profiles').select('*').single();
console.log('User profile:', profile);

// Check auth state
const {
  data: { session },
} = await supabase.auth.getSession();
console.log('Current session:', session);

// Check localStorage
console.log('Local storage:', localStorage);
```

## Common Issues & Solutions

| Issue                                       | Cause                             | Solution                                               |
| ------------------------------------------- | --------------------------------- | ------------------------------------------------------ |
| User menu doesn't show                      | useUser hook returns null         | Check Supabase auth setup, verify session exists       |
| Avatar shows "U"                            | Name/email not available          | Check user object in useUser hook return               |
| Auth method always shows "Email & Password" | GitHub OAuth not setting provider | Check app_metadata in user object                      |
| Profile info blank                          | Profile table empty or RLS issue  | Check Supabase profiles table, verify RLS allows reads |
| Logout doesn't work                         | signOut() failing silently        | Check browser console for errors                       |
| Dark mode breaks colors                     | CSS not loading                   | Clear cache, verify Tailwind config                    |
| Mobile menu cut off                         | z-index or positioning issue      | Check dropdown positioning, verify nav z-index         |

## Performance Checklist

- [ ] Navbar renders without delay
- [ ] User menu dropdown appears instantly
- [ ] Dashboard profile card loads with page
- [ ] No layout shift when profile loads
- [ ] Logout completes in <1 second
- [ ] No console errors on login/logout
- [ ] useUser hook doesn't cause infinite loops
- [ ] Dropdown doesn't cause horizontal scroll
- [ ] Mobile menu responsive on scroll

## Accessibility Checklist

- [ ] User menu keyboard navigable
- [ ] Logout button has proper contrast
- [ ] Avatar has descriptive aria-label
- [ ] Links have underlines in dark mode
- [ ] Dropdown menu properly nested
- [ ] No missing alt text
- [ ] Focus indicators visible
- [ ] Tab order logical
- [ ] Mobile menu accessible via keyboard
