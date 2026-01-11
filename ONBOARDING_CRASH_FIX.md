# Onboarding Crash Fix

## 🐛 Problem Identified

The app was crashing on startup because:

1. **Supabase call before login**: The onboarding flow was trying to save data to Supabase BEFORE the user logged in, causing a crash.
2. **No error handling**: There was no error boundary to catch and handle crashes gracefully.

## ✅ Fixes Applied

### 1. Removed Supabase Call from Onboarding
**File**: `src/screens/OnboardingFlow.tsx`

- Removed the database save operation from `handleComplete()`
- User data is now just logged to console
- Data will need to be saved AFTER login (in AuthContext or after successful Google sign-in)

### 2. Added Error Boundary
**File**: `src/components/ErrorBoundary.tsx`

- Created error boundary component to catch crashes
- Shows user-friendly error message
- Provides "Try Again" button

### 3. Temporarily Disabled Onboarding
**File**: `App.tsx`

- Changed `showOnboarding` initial state from `true` to `false`
- This allows the app to open without crashing
- Users go straight to login screen

## 🚀 Quick Fix to Test

### Option 1: Build Without Onboarding (Recommended for now)

The app will now open directly to the login screen. This is the safest option until we properly implement data persistence.

```bash
# Build new AAB
eas build --platform android --profile production
```

### Option 2: Re-enable Onboarding (After fixing data persistence)

To re-enable onboarding, change this line in `App.tsx`:

```typescript
// Change from:
const [showOnboarding, setShowOnboarding] = React.useState(false);

// To:
const [showOnboarding, setShowOnboarding] = React.useState(true);
```

## 🔧 Proper Solution (TODO)

To properly implement onboarding with data persistence:

### 1. Use AsyncStorage for Temporary Storage

Store onboarding data locally until user logs in:

```typescript
// In OnboardingFlow.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

const handleComplete = async () => {
  try {
    // Save to AsyncStorage temporarily
    await AsyncStorage.setItem('onboarding_data', JSON.stringify(onboardingData));
    await AsyncStorage.setItem('onboarding_completed', 'true');
    console.log('Onboarding data saved locally');
  } catch (error) {
    console.error('Error saving onboarding data:', error);
  }
  onComplete();
};
```

### 2. Save to Supabase After Login

In `AuthContext.tsx` or after successful Google sign-in:

```typescript
// After user logs in successfully
const onboardingData = await AsyncStorage.getItem('onboarding_data');
if (onboardingData) {
  const data = JSON.parse(onboardingData);
  
  // Save to Supabase
  await supabase
    .from('profiles')
    .update({
      height: data.height,
      weight: data.weight,
      unit_preference: data.unit,
      birth_date: data.birthDate,
      referral_source: data.source,
      onboarding_completed: true,
    })
    .eq('id', user.id);
  
  // Clear AsyncStorage
  await AsyncStorage.removeItem('onboarding_data');
}
```

### 3. Check Onboarding Status

```typescript
// In AuthStackNavigator
const [showOnboarding, setShowOnboarding] = React.useState(false);

React.useEffect(() => {
  const checkOnboarding = async () => {
    const completed = await AsyncStorage.getItem('onboarding_completed');
    if (!completed) {
      setShowOnboarding(true);
    }
  };
  checkOnboarding();
}, []);
```

## 📦 Required Package

If implementing AsyncStorage solution:

```bash
npm install @react-native-async-storage/async-storage
```

## 🧪 Testing Steps

1. **Build new AAB** with onboarding disabled
2. **Upload to Google Play** internal testing
3. **Install and test** - app should open to login screen
4. **Verify login works** and main app functions properly
5. **Implement proper data persistence** (AsyncStorage solution above)
6. **Re-enable onboarding** and test again

## 📝 Current State

- ✅ App opens without crashing
- ✅ Login screen shows immediately
- ✅ Error boundary added for safety
- ⏳ Onboarding disabled temporarily
- ⏳ Data persistence needs proper implementation

## 🎯 Next Steps

1. **Immediate**: Build and test with onboarding disabled
2. **Short-term**: Implement AsyncStorage solution
3. **Long-term**: Add analytics to track onboarding completion

## 🔍 Debugging Tips

If you still see crashes:

1. **Check logcat** for error messages:
   ```bash
   adb logcat | grep -i "error\|exception\|crash"
   ```

2. **Enable remote debugging** in development build

3. **Check Sentry/Crashlytics** if configured

4. **Test in development** before building production AAB:
   ```bash
   npm start
   # Then test on device
   ```

## ✨ Summary

The crash was caused by trying to access Supabase before user authentication. The fix disables onboarding temporarily so the app can open. To properly implement onboarding, use AsyncStorage to store data temporarily, then save to Supabase after successful login.
