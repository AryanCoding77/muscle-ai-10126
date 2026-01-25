# Firebase Analytics Setup Guide

## ✅ What You've Done So Far
- Created Firebase project
- Registered Android app with package name: `com.muscleai.app`
- Downloaded `google-services.json`
- Placed it in `android/app/` directory

## 🚀 Next Steps (Expo Way)

### Step 1: Move google-services.json
**IMPORTANT:** For Expo, the file needs to be in the project ROOT, not in `android/app/`

```bash
# Copy the file from android/app/ to project root
copy android\app\google-services.json google-services.json
```

Your file structure should look like:
```
muscle-ai/
├── android/
│   └── app/
│       └── google-services.json  (keep this)
├── google-services.json          (ADD THIS - copy here)
├── app.json
├── package.json
└── ...
```

### Step 2: Install Firebase Packages

```bash
npm install @react-native-firebase/app @react-native-firebase/analytics
```

### Step 3: Update app.json (Already Done ✅)
I've already updated your `app.json` with:
- Firebase plugin added
- `googleServicesFile` path configured

### Step 4: Rebuild Your App
Since you're adding native modules, you need to rebuild:

```bash
npx expo prebuild --clean
npx expo run:android
```

OR use EAS Build:
```bash
eas build --platform android --profile development
```

### Step 5: Initialize Firebase in Your App

Create a new file `src/services/firebase.ts`:

```typescript
import analytics from '@react-native-firebase/analytics';

export const logEvent = async (eventName: string, params?: object) => {
  try {
    await analytics().logEvent(eventName, params);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

export const logScreenView = async (screenName: string) => {
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

export const setUserId = async (userId: string) => {
  try {
    await analytics().setUserId(userId);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

export const setUserProperty = async (name: string, value: string) => {
  try {
    await analytics().setUserProperty(name, value);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};
```

### Step 6: Use Analytics in Your App

Example usage in any screen:

```typescript
import { logEvent, logScreenView } from '../services/firebase';

// Log screen view
useEffect(() => {
  logScreenView('HomeScreen');
}, []);

// Log custom events
const handleAnalyze = async () => {
  await logEvent('analyze_image', {
    user_id: userId,
    has_subscription: hasSubscription,
  });
  // ... rest of your code
};
```

## 📊 Common Events to Track

```typescript
// User actions
logEvent('sign_up', { method: 'google' });
logEvent('login', { method: 'google' });
logEvent('logout');

// Onboarding
logEvent('onboarding_start');
logEvent('onboarding_complete', { 
  height: 170, 
  weight: 70,
  referral_source: 'instagram' 
});

// Free trial
logEvent('free_trial_start');
logEvent('free_trial_spin', { result: 2 });
logEvent('free_trial_ended');

// Subscriptions
logEvent('subscription_view_plans');
logEvent('subscription_purchase', { 
  plan: 'Pro', 
  price: 499 
});
logEvent('subscription_cancel');

// Analysis
logEvent('image_analyze_start');
logEvent('image_analyze_success');
logEvent('image_analyze_error', { error: 'quota_exceeded' });

// Profile
logEvent('profile_view');
logEvent('profile_edit');
```

## 🧪 Testing

### Verify Installation
After rebuilding, check if Firebase is working:

```typescript
import analytics from '@react-native-firebase/analytics';

// In your App.tsx or any component
useEffect(() => {
  analytics().logEvent('app_open')
    .then(() => console.log('✅ Firebase Analytics working!'))
    .catch(err => console.error('❌ Firebase error:', err));
}, []);
```

### Check Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select your project
3. Go to Analytics → Events
4. Wait 24 hours for data to appear (or use DebugView for real-time)

### Enable Debug Mode (Optional)
For real-time testing:

```bash
# Enable debug mode
adb shell setprop debug.firebase.analytics.app com.muscleai.app

# Disable debug mode
adb shell setprop debug.firebase.analytics.app .none.
```

Then check Firebase Console → Analytics → DebugView

## ⚠️ Important Notes

1. **Expo Managed Workflow:** If you're using Expo Go, Firebase won't work. You need a custom development build.

2. **Rebuild Required:** Every time you change `app.json` or add native modules, rebuild:
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

3. **Data Delay:** Analytics data takes 24 hours to appear in Firebase Console. Use DebugView for real-time testing.

4. **Privacy:** Make sure to update your privacy policy to mention Google Analytics usage.

## 🎯 Quick Start Commands

```bash
# 1. Copy google-services.json to root
copy android\app\google-services.json google-services.json

# 2. Install packages
npm install @react-native-firebase/app @react-native-firebase/analytics

# 3. Rebuild app
npx expo prebuild --clean
npx expo run:android

# 4. Test
# Open app and check console for "✅ Firebase Analytics working!"
```

## 📚 Resources

- [React Native Firebase Docs](https://rnfirebase.io/)
- [Firebase Analytics Events](https://firebase.google.com/docs/analytics/events)
- [Expo Firebase Guide](https://docs.expo.dev/guides/using-firebase/)

## ✅ Checklist

- [ ] Copied `google-services.json` to project root
- [ ] Installed Firebase packages
- [ ] Updated `app.json` (already done)
- [ ] Created `src/services/firebase.ts`
- [ ] Rebuilt the app
- [ ] Tested analytics with `app_open` event
- [ ] Verified in Firebase Console (after 24h or DebugView)

---

**You're all set! Just follow the steps above and Firebase Analytics will be working in your app.** 🎉
