# Onboarding System - Quick Start Guide

## 🚀 What's Been Added

A complete 7-screen onboarding flow that appears before the Google login screen, collecting user information and showcasing MuscleAI's value.

## 📋 Onboarding Flow

1. **Welcome** - App introduction with camera preview
2. **Height & Weight** - Physical measurements (skippable)
3. **Age** - Birth date selection (skippable)
4. **Where Did You Hear** - Marketing attribution (skippable)
5. **Comparison** - MuscleAI vs manual tracking (20% vs 2X)
6. **Potential** - Weight transition graph
7. **Thank You** - Privacy message

## ⚡ Quick Setup (3 Steps)

### Step 1: Deploy Database Schema

```bash
deploy-onboarding-schema.bat
```

This adds these fields to your `profiles` table:
- `height`, `weight`, `unit_preference`
- `birth_date`, `referral_source`
- `onboarding_completed`

### Step 2: Install Dependencies (if needed)

```bash
npm install
```

All required packages should already be installed:
- `expo-linear-gradient`
- `react-native-svg`
- `@expo/vector-icons`

### Step 3: Test the Flow

1. **Log out** of the app (if logged in)
2. **Close and reopen** the app
3. You'll see the onboarding screens
4. Complete the flow and login

## 📱 User Experience

### For New Users
- App opens → Onboarding (7 screens) → Google Login → Main App

### For Returning Users
- App opens → Google Login → Main App (onboarding skipped)

### After Logout
- User logs out → Onboarding shows again → Google Login

## 📊 Viewing Collected Data

Onboarding data appears in the **Profile Screen** under "Personal Stats":

```
┌─────────────────────────────────┐
│     Personal Stats              │
├─────────────────────────────────┤
│  📏 Height    ⚖️ Weight  🎂 Age │
│  170 cm      70 kg     25 years │
└─────────────────────────────────┘
```

## 🎨 Design Features

- **Progress Bar**: Shows completion percentage
- **Back Navigation**: Users can go back to previous screens
- **Skip Options**: Data collection screens can be skipped
- **Smooth Animations**: Haptic feedback on interactions
- **Consistent Theme**: Matches your app's brown gradient design

## 🔧 Customization

### Change Referral Sources

Edit `src/screens/onboarding/WhereDidYouHearScreen.tsx`:

```typescript
const sources = [
  { id: 'instagram', name: 'Instagram', icon: 'instagram', color: '#E1306C' },
  { id: 'facebook', name: 'Facebook', icon: 'facebook', color: '#1877F2' },
  // Add more sources here
];
```

### Modify Screen Order

Edit `src/screens/OnboardingFlow.tsx` and update the `renderStep()` function.

### Update Styling

All screens use colors from `src/config/constants.ts`. Update `COLORS` to change the theme.

## 📝 Data Structure

### Saved to Database

```typescript
{
  height: 170,              // cm or inches
  weight: 70,               // kg or lbs
  unit_preference: 'metric', // or 'imperial'
  birth_date: '2000-01-01',
  referral_source: 'instagram',
  onboarding_completed: true
}
```

### Accessing in Code

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

console.log(profile.height); // 170
console.log(profile.weight); // 70
```

## ✅ Verification Checklist

- [ ] Database schema deployed successfully
- [ ] Onboarding screens appear when logged out
- [ ] All 7 screens display correctly
- [ ] Progress bar updates properly
- [ ] Back button works on all screens
- [ ] Skip buttons work on data collection screens
- [ ] Data saves to database after completion
- [ ] Personal Stats show in Profile screen
- [ ] Login screen appears after onboarding
- [ ] Onboarding doesn't show for logged-in users

## 🐛 Troubleshooting

### Onboarding Not Showing
- Make sure you're logged out
- Clear app cache and restart
- Check console for errors

### Data Not Saving
- Verify database schema was deployed
- Check Supabase RLS policies
- Review console logs

### Styling Issues
- Run `npm install` to ensure all dependencies are installed
- Check that `expo-linear-gradient` and `react-native-svg` are working

## 📚 Files Created

```
src/screens/
├── onboarding/
│   ├── WelcomeScreen.tsx
│   ├── HeightWeightScreen.tsx
│   ├── AgeScreen.tsx
│   ├── WhereDidYouHearScreen.tsx
│   ├── ComparisonScreen.tsx
│   ├── PotentialScreen.tsx
│   ├── ThankYouScreen.tsx
│   └── index.ts
├── OnboardingFlow.tsx
└── ProfileScreen.tsx (updated)

Database:
├── add-onboarding-fields.sql
└── deploy-onboarding-schema.bat

Documentation:
├── ONBOARDING_SYSTEM.md
└── ONBOARDING_QUICK_START.md
```

## 🎯 Next Steps

1. **Test thoroughly** on both iOS and Android
2. **Customize** the referral sources for your marketing channels
3. **Add analytics** to track onboarding completion rates
4. **A/B test** different screen orders or messaging
5. **Collect feedback** from users about the flow

## 💡 Tips

- Users can skip data collection but still see motivational screens
- All data is optional - app works without onboarding data
- Personal stats only show if user provided the data
- Onboarding data helps personalize the experience

## 🎉 You're Done!

Your onboarding system is ready to use. Users will now have a smooth introduction to MuscleAI before signing in!
