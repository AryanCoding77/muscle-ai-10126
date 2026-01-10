# Google Authentication Fix Guide

## Error: "Error 400: redirect_uri_mismatch"

### Problem
Your Google Cloud Console OAuth client doesn't have the correct redirect URIs configured.

---

## Quick Fix Checklist

### ✅ Step 1: Google Cloud Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID: **"web muscleai client"**
3. In **"Authorized redirect URIs"**, add ALL of these:
   ```
   https://imevywptvoyfyjevyknu.supabase.co/auth/v1/callback
   muscleai://auth/callback
   com.muscleai.app://auth/callback
   ```
4. Click **Save**
5. **Wait 5-10 minutes** for changes to propagate

### ✅ Step 2: Supabase Dashboard
1. Go to: https://app.supabase.com/project/imevywptvoyfyjevyknu/auth/providers
2. Click on **Google** provider
3. Verify **Client ID**: `348406762838-es77agunmatdf9ku3vr5t3k53ksn002g.apps.googleusercontent.com`
4. In **"Redirect URLs"**, make sure you have:
   ```
   muscleai://auth/callback
   com.muscleai.app://auth/callback
   ```
5. Click **Save**

### ✅ Step 3: Clear App Cache
**Option A - Reinstall:**
```bash
adb uninstall com.muscleai.app
adb install your-app.apk
```

**Option B - Manual:**
- Settings → Apps → Muscle AI
- Clear Storage & Cache
- Force Stop
- Reopen app

### ✅ Step 4: Test
1. Open app
2. Tap "Sign in with Google"
3. Should work now!

---

## Understanding the Issue

### What Happened:
When you deleted and recreated your Google OAuth client, the **redirect URIs** were not configured.

### Why It Matters:
Google OAuth requires **exact matches** for redirect URIs. Your app sends:
- `muscleai://auth/callback` (mobile deep link)

But Google only knew about:
- `https://imevywptvoyfyjevyknu.supabase.co/auth/v1/callback` (Supabase callback)

### The Fix:
Add **both** URIs to Google Cloud Console so it accepts redirects from:
1. Supabase (web OAuth flow)
2. Your mobile app (deep link)

---

## Troubleshooting

### Still Getting Error 400?
1. **Wait longer** - Google can take up to 10 minutes to update
2. **Check for typos** - URIs must match exactly (no trailing slashes, no spaces)
3. **Clear browser cache** - Old OAuth sessions might be cached
4. **Try incognito mode** - Test in a private browser window

### Getting Different Error?
**Error: "Access blocked: This app's request is invalid"**
- Make sure OAuth consent screen is configured
- Add test users if app is in "Testing" mode

**Error: "Invalid client"**
- Client ID in Supabase doesn't match Google Cloud Console
- Copy the correct Client ID from Google Cloud Console

**Error: "Redirect URI mismatch" (different URI shown)**
- The URI shown in error is what your app is sending
- Add that exact URI to Google Cloud Console

---

## Current Configuration

### Your Supabase Project:
- **URL:** `https://imevywptvoyfyjevyknu.supabase.co`
- **Project ID:** `imevywptvoyfyjevyknu`

### Your Google OAuth Client:
- **Client ID:** `348406762838-es77agunmatdf9ku3vr5t3k53ksn002g.apps.googleusercontent.com`
- **Type:** Web application
- **Name:** web muscleai client

### Required Redirect URIs:
```
https://imevywptvoyfyjevyknu.supabase.co/auth/v1/callback
muscleai://auth/callback
com.muscleai.app://auth/callback
```

### App Deep Link Schemes:
- Primary: `muscleai://`
- Package: `com.muscleai.app://`

---

## Prevention

### When Creating New OAuth Client:
1. Always add **all redirect URIs** immediately
2. Include both Supabase callback and mobile deep links
3. Save and wait before testing
4. Keep a backup of Client ID and Secret

### Best Practices:
- Document your OAuth configuration
- Keep screenshots of Google Cloud Console settings
- Test in both development and production
- Use environment variables for Client IDs

---

## Additional Resources

- [Supabase Google Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Expo AuthSession Docs](https://docs.expo.dev/versions/latest/sdk/auth-session/)

---

**Last Updated:** December 5, 2025  
**Status:** Ready to fix
