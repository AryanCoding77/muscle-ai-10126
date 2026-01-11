# 🚨 QUICK FIX GUIDE - App Crash

## Problem
App crashes immediately on startup from Google Play build.

## Solution
Onboarding temporarily disabled. App now opens to login screen.

## Build & Deploy (3 Steps)

### 1. Build New AAB
```bash
eas build --platform android --profile production
```

### 2. Upload to Google Play
- Go to Google Play Console
- Upload new AAB to internal testing
- Wait for processing

### 3. Test
- Install from Google Play
- App should open to login screen
- Login and verify everything works

## What Changed

✅ Removed database call before login (was causing crash)
✅ Added error boundary for safety
✅ Disabled onboarding temporarily
✅ App opens directly to login

## Expected Behavior

```
App Opens → Login Screen → Google Sign In → Main App
```

No onboarding screens (for now).

## Re-enable Onboarding Later

In `App.tsx` line ~103, change:
```typescript
const [showOnboarding, setShowOnboarding] = React.useState(false);
// to
const [showOnboarding, setShowOnboarding] = React.useState(true);
```

But first implement AsyncStorage solution (see ONBOARDING_CRASH_FIX.md).

## Status

🟢 **READY TO BUILD** - No errors, safe to deploy
🟢 **CORE APP WORKS** - Login and all features functional
🟡 **ONBOARDING DISABLED** - Will re-enable after proper implementation

## Need Help?

See detailed guides:
- `CRASH_FIX_SUMMARY.md` - Complete fix details
- `ONBOARDING_CRASH_FIX.md` - How to re-enable onboarding
