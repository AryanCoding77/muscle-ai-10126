# 🚀 Next Steps: Test Google Play Billing

**Current Status**: APK works for UI, but billing requires Play Store  
**Solution**: Upload to Play Console Internal Testing  
**Time Required**: 1-2 hours (first time)

---

## ⚡ Quick Action Plan

### Step 1: Build AAB (15-20 min)
```bash
eas build --platform android --profile production
```

Wait for build to complete, then download AAB file.

---

### Step 2: Upload to Play Console (10 min)

1. Go to: https://play.google.com/console
2. Click your app (or create new app)
3. Navigate to: **Release → Internal Testing**
4. Click **Create new release**
5. Upload AAB file
6. Add release notes: "Testing Google Play Billing integration"
7. Click **Review release**
8. Click **Start rollout to Internal testing**

---

### Step 3: Create Subscription Products (15 min)

Go to: **Monetization → Subscriptions**

#### Create Product 1: Basic
```
Product ID: basic_monthly
Name: Basic Plan
Description: 10 AI body analyses per month
Price: $4.99
Billing period: 1 month (recurring)
Free trial: None (or 7 days if you want)
Status: Active
```

#### Create Product 2: Pro
```
Product ID: pro_monthly
Name: Pro Plan
Description: 50 AI body analyses per month
Price: $9.99
Billing period: 1 month (recurring)
Free trial: None (or 7 days if you want)
Status: Active
```

#### Create Product 3: VIP
```
Product ID: vip_monthly
Name: VIP Plan
Description: Unlimited AI body analyses
Price: $19.99
Billing period: 1 month (recurring)
Free trial: None (or 7 days if you want)
Status: Active
```

**IMPORTANT**: Product IDs must match EXACTLY (case-sensitive)

---

### Step 4: Add Test Account (2 min)

1. Go to: **Setup → License testing**
2. Add your Gmail account:
```
your-email@gmail.com
```
3. Click **Save changes**

**Note**: Test purchases are FREE for license testing accounts!

---

### Step 5: Get Testing Link (1 min)

1. Go to: **Release → Internal Testing**
2. Find **"How testers join your test"** section
3. Copy the testing link (looks like: https://play.google.com/apps/internaltest/...)
4. Send link to your test email

---

### Step 6: Install from Play Store (5 min)

On your Android device:
1. Open the testing link
2. Sign in with test account
3. Click **"Accept invitation"**
4. Click **"Download it on Google Play"**
5. Install app from Play Store
6. Open app

---

### Step 7: Test Purchases (5 min)

In the app:
1. Navigate to subscription plans
2. Select **Basic** plan
3. Tap **"Choose Plan"**
4. Tap **"Pay $4.99"**
5. Google Play payment dialog should open
6. Complete purchase (FREE for test account)
7. Verify subscription activates
8. Check features unlock

**Expected Result**: Purchase completes successfully! 🎉

---

## 🔍 Troubleshooting

### Issue: Products not loading
**Solution**: 
- Wait 5-10 minutes after creating products
- Ensure products are **Active** (not draft)
- Reinstall app from Play Store

### Issue: "Item unavailable" error
**Solution**:
- Check product IDs match exactly
- Ensure app is installed from Play Store (not sideloaded)
- Verify products are activated

### Issue: Payment dialog doesn't open
**Solution**:
- Check device has Google Play Store
- Ensure device is signed into test account
- Check internet connection
- Try restarting device

### Issue: Purchase doesn't activate subscription
**Solution**:
- Check Supabase Edge Functions are deployed
- Check purchase listener in App.tsx
- Check console logs for errors
- Verify backend verification logic

---

## 📊 What You'll See

### In APK (Current - Sideloaded)
```
❌ "Google Play Billing is unavailable"
❌ "This app must be installed from Play Store"
❌ Purchase button disabled
```

### In Play Store Install (After Setup)
```
✅ "Secure payment powered by Google Play Billing"
✅ Purchase button enabled
✅ Google Play payment dialog opens
✅ Purchase completes (FREE for test)
✅ Subscription activates
✅ Features unlock
```

---

## ⏱️ Time Breakdown

| Step | Time | Can Skip? |
|------|------|-----------|
| Build AAB | 15-20 min | No |
| Upload to Play Console | 10 min | No |
| Create Products | 15 min | No (first time only) |
| Add Test Account | 2 min | No (first time only) |
| Get Testing Link | 1 min | No (first time only) |
| Install from Play Store | 5 min | No |
| Test Purchases | 5 min | No |
| **Total (First Time)** | **1-2 hours** | - |
| **Total (Subsequent)** | **30 min** | - |

---

## 🎯 Success Criteria

### You'll Know It Works When:
- ✅ App installs from Play Store (not sideloaded)
- ✅ Subscription plans screen shows all 3 plans
- ✅ Payment screen shows "Secure payment powered by Google Play Billing"
- ✅ Pay button is enabled (not grayed out)
- ✅ Tapping Pay button opens Google Play payment dialog
- ✅ Completing purchase shows success message
- ✅ Subscription status shows "Active"
- ✅ Features unlock immediately
- ✅ Usage counter works

---

## 📝 Quick Commands

### Build AAB
```bash
eas build --platform android --profile production
```

### Check Build Status
```bash
eas build:list
```

### View Build Details
```bash
eas build:view [build-id]
```

### Deploy Edge Functions (if needed)
```bash
supabase functions deploy create-subscription
supabase functions deploy verify-google-play-purchase
supabase functions deploy cancel-subscription
```

---

## 🔗 Important Links

### Play Console
- **Dashboard**: https://play.google.com/console
- **Internal Testing**: https://play.google.com/console/internal-testing
- **Subscriptions**: https://play.google.com/console/monetization/subscriptions
- **License Testing**: https://play.google.com/console/setup/license-testing

### EAS
- **Dashboard**: https://expo.dev/accounts/aryan_coding/projects/muscle-ai
- **Builds**: https://expo.dev/accounts/aryan_coding/projects/muscle-ai/builds

### Documentation
- **Google Play Billing**: https://developer.android.com/google/play/billing
- **Testing Guide**: https://developer.android.com/google/play/billing/test
- **react-native-iap**: https://github.com/dooboolab-community/react-native-iap

---

## ✅ Summary

### What's Wrong Now
- ❌ APK is sideloaded (not from Play Store)
- ❌ Google Play Billing requires Play Store installation
- ❌ This is BY DESIGN, not a bug in your code

### What I Fixed
- ✅ Better error messages
- ✅ Product availability check
- ✅ Visual indicators
- ✅ Detailed logging
- ✅ Clear instructions

### What You Need to Do
1. Build AAB (not APK)
2. Upload to Play Console
3. Create subscription products
4. Add test account
5. Install from Play Store
6. Test purchases

### Expected Result
✅ **Purchases will work perfectly!**

---

**Next Command**:
```bash
eas build --platform android --profile production
```

**Then**: Follow steps 2-7 above

**Time**: 1-2 hours total (first time)

**Result**: Working Google Play Billing! 🎉
