# User Authentication Display - Visual Reference

## Component Structure

```
Header (components/layout/header.tsx)
├── Logo & Navigation Links (always visible)
├── Dark Mode Toggle (always visible)
└── Right Side (responsive)
    ├── Desktop View (md and up)
    │   ├── If Logged In
    │   │   ├── User Avatar (8x8, gradient background)
    │   │   ├── User Name/Email (truncated first name)
    │   │   └── Dropdown Menu (on click)
    │   │       ├── Header (full name + tier)
    │   │       ├── Dashboard Link
    │   │       ├── Settings Link
    │   │       └── Logout Button (red, with icon)
    │   └── If Logged Out
    │       ├── Login Link
    │       └── Get Started Button (blue)
    └── Mobile View (< md)
        ├── Dark Mode Toggle
        ├── If Logged In
        │   └── User Avatar Button (8x8)
        └── Hamburger Menu
            └── Mobile Menu
                ├── All Nav Links
                ├── If Logged In
                │   └── Logout Button (full width)
                └── If Logged Out
                    ├── Login Link
                    └── Get Started Button

Dashboard Page (app/(dashboard)/dashboard/page.tsx)
├── User Profile Card (full width, gradient bg)
│   ├── Top Row (flex, space-between)
│   │   ├── Left (flex)
│   │   │   ├── Avatar (16x16, gradient, rounded)
│   │   │   └── User Info
│   │   │       ├── Welcome Message (h1, large)
│   │   │       ├── Description (secondary text)
│   │   │       └── Status Row
│   │   │           ├── Active Account Indicator (green dot)
│   │   │           └── Creation Date
│   │   └── Right
│   │       └── Edit Profile Button
│   └── Subscription Info Grid (2-4 columns)
│       ├── Current Plan
│       ├── Email
│       ├── Auth Method
│       └── Account Status
├── Dashboard Overview (heading)
├── Stats Grid (3 columns)
├── Quick Actions
├── Recent Audits
└── Upgrade Prompt (conditional)
```

## Navbar User Menu Flow

### Desktop

```
User Avatar Button
    ↓
Click
    ↓
Dropdown Menu Opens
├── User Profile Section
│   ├── Full Name/Email (bold, larger)
│   └── Subscription Tier (secondary)
├── Divider
├── Dashboard Link (hover: bg-gray-100/700)
├── Settings Link (hover: bg-gray-100/700)
├── Divider
└── Logout Button (red text, icon, hover: bg-gray-100/700)

Click Outside → Menu Closes
```

### Mobile

```
Hamburger Menu (default navigation)
    ↓ (with user avatar button on right)
    ├── All standard nav items
    ├── User Avatar Button (shows in navbar right)
    └── In Mobile Menu
        └── Logout Button (full width, red)

OR

User Avatar Button
    ↓
Click
    ↓
Mobile Menu Opens (includes logout)
```

## Avatar Display Options

### Header Avatar

```
[■] ← 8x8px, gradient blue, white text
 A   User initial (A)
```

### Dashboard Avatar

```
[■■] ← 16x16px, gradient blue, white text, shadow
 A    User initial (A)
```

### Avatar Logic

```
User has full_name?
├─ YES → Use first letter of full_name
│   Example: "John Doe" → "J"
└─ NO → Use first letter of email
    Example: "john@example.com" → "j" (becomes "J")
```

## Subscription Info Grid Layout

### Desktop (4 Columns)

```
┌─────────────────────────────────────────────────────┐
│ Current Plan      │ Email             │ Auth Method  │ Account Status │
│ Free/Pro/Agency   │ user@example.com  │ GitHub OAuth │ Verified       │
└─────────────────────────────────────────────────────┘
```

### Mobile (2 Columns)

```
┌──────────────────────┬──────────────────────┐
│ Current Plan         │ Email                │
│ Free/Pro/Agency      │ user@example.com     │
├──────────────────────┼──────────────────────┤
│ Auth Method          │ Account Status       │
│ GitHub OAuth         │ Verified             │
└──────────────────────┴──────────────────────┘
```

## Authentication Method Display

### Email & Password Login

```
Auth Method: Email & Password
```

### GitHub OAuth Login

```
Auth Method: GitHub OAuth
```

### Detection Logic

```
user.app_metadata?.provider
├─ 'github' → Display "GitHub OAuth"
└─ null/other → Display "Email & Password"
```

## Color Scheme

### Light Mode

```
Avatar Background: Gradient from-blue-600 to-blue-700
Avatar Text: White (text-white)
User Name: text-gray-700
Subscription: text-gray-500
Profile Card: from-blue-50 to-indigo-50
Status Indicator: bg-green-500
```

### Dark Mode

```
Avatar Background: Same (gradient from-blue-600 to-blue-700)
Avatar Text: White (text-white)
User Name: text-gray-300
Subscription: text-gray-400
Profile Card: from-gray-800 to-gray-900
Status Indicator: bg-green-500 (same)
Logout Text: text-red-400
```

## Interactive States

### User Avatar Button (Desktop)

```
Default:
  [Avatar] Username
  ↓ Hover:
  [Avatar] Username (bg-gray-100 dark:bg-gray-800)

After Click:
  Dropdown Menu opens below
```

### Dropdown Menu Items

```
Link Items (Dashboard, Settings):
  Default: text-gray-700 dark:text-gray-300
  Hover:   bg-gray-100 dark:bg-gray-700 + text darker

Logout Button:
  Default: text-red-600 dark:text-red-400
  Hover:   bg-gray-100 dark:bg-gray-700
  Icon:    LogOut icon, 4x4px
```

### Edit Profile Button

```
Default:
  Border: border-gray-200 dark:border-gray-700
  BG:     white dark:bg-gray-800
  Text:   text-gray-700 dark:text-gray-300

Hover:
  BG:     gray-50 dark:bg-gray-700
  Icon:   User icon, 4x4px
```

## Responsive Behavior

### 320px - 640px (Mobile)

```
Navbar:
  ├── Logo (responsive)
  ├── Dark Toggle
  ├── User Avatar (if logged in)
  └── Hamburger Menu

Dashboard:
  ├── Profile Card
  │   ├── Avatar: 16x16
  │   ├── Text stacked vertically
  │   └── Edit Profile button below
  └── Grid: 2 columns for subscription info

Menu:
  └── Dropdown not used (mobile menu instead)
```

### 641px - 1024px (Tablet)

```
Navbar:
  ├── Logo
  ├── Nav Links (hidden on small tablets)
  ├── Dark Toggle
  ├── User Menu (dropdown appears)
  └── Hamburger Menu

Dashboard:
  ├── Profile Card
  │   ├── Avatar: 16x16
  │   ├── Text side-by-side
  │   └── Edit Profile on right
  └── Grid: 2-3 columns

Menu:
  └── Dropdown works (user avatar)
```

### 1025px+ (Desktop)

```
Navbar:
  ├── Logo
  ├── Full Nav Links
  ├── Dark Toggle
  ├── User Avatar Button (if logged in)
  │   └── Dropdown Menu
  └── No Hamburger Menu

Dashboard:
  ├── Profile Card (full width)
  │   ├── Avatar + Info on left
  │   ├── Edit Profile on right
  │   └── Grid: 4 columns
  └── Everything expanded

Menu:
  └── Dropdown menu works perfectly
```

## Accessibility Features

### Keyboard Navigation

```
Tab → cycles through interactive elements
Enter/Space → activates buttons
Escape → closes dropdown menu
```

### Screen Readers

```
Avatar Button:
  ├─ Button role
  ├─ "User menu" or similar label
  └─ aria-expanded (true/false)

Logout Button:
  ├─ Clear text "Logout"
  ├─ Icon is decorative (aria-hidden)
  └─ Clear red color for visibility

Links:
  ├─ Proper link elements
  ├─ Clear link text
  └─ Obvious destinations
```

### Color Contrast

```
Text on Light BG:
  gray-700 on white ✅ (sufficient contrast)
  gray-500 on white ✅ (sufficient contrast)

Text on Dark BG:
  gray-300 on gray-800 ✅ (sufficient contrast)
  gray-400 on gray-800 ✅ (sufficient contrast)

Red on Light/Dark:
  text-red-600 on white ✅ (sufficient)
  text-red-400 on dark ✅ (sufficient)

Blue Avatar:
  white text on gradient-blue ✅ (sufficient)
```

## Example User States

### User: John Doe (Email & Password, Free Plan)

```
Navbar:
  [J] John

Dashboard Profile:
  [J]
  Welcome back, John Doe!
  Track your website's SEO, performance, and Next.js optimization
  🟢 Active account  Mar 15, 2024

  Current Plan: Free          Auth Method: Email & Password
  Email: john@example.com     Account Status: Verified
```

### User: jane@example.com (GitHub OAuth, Pro Plan)

```
Navbar:
  [J] jane

Dashboard Profile:
  [J]
  Welcome back, jane@example.com!
  Track your website's SEO, performance, and Next.js optimization
  🟢 Active account  Mar 20, 2024

  Current Plan: Pro           Auth Method: GitHub OAuth
  Email: jane@example.com     Account Status: Verified
```

### Logged Out

```
Navbar (Right):
  Login  |  Get Started (blue button)
```

## Hover & Active States

### User Avatar Button Hover

```
Before:
  [J] John

After (hover):
  [J] John
  └─ Background: light-gray/dark-gray
  └─ Opacity: slightly increased
```

### Menu Item Hover

```
Before:
  Dashboard

After (hover):
  Dashboard
  └─ Background: light-gray/dark-gray
  └─ Transition: smooth 150ms
```

### Logout Button Hover

```
Before:
  🚪 Logout (red text)

After (hover):
  🚪 Logout (red text)
  └─ Background: light-gray/dark-gray
  └─ Text: slightly brighter red
```

---

This visual reference shows the exact layout, colors, and responsive behavior of the authenticated user display throughout the application.
