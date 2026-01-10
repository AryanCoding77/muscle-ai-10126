# Client-Side Subscription Testing Checklist

## Overview
This checklist ensures that the client-side subscription system using `getAvailablePurchases()` works correctly. Google Play handles all renewals and billing dates automatically - the app just checks "does this user currently have an active subscription?"

## Prerequisites
- App installed from Google Play Internal Testing track
- Test account added to Google Play Console license testers
- Device with Google Play Services installed
- Clear app data before starting tests

---

## Test 1: Fresh Install - No Subscription

### Steps:
1. Clear app data on test device
2. Uninstall app if installed
3. Install from Internal Testing track
4. Open app and sign in

### Expected Results:
- ✅ Console logs show: `NO ACTIVE SUBSCRIPTION`
- ✅ Console logs show: `Found 0 active purchase(s)`
- ✅ Profile screen shows "Upgrade to Premium" banner
- ✅ Subscription Plans screen shows all plans as available
- ✅ No "PRO/VIP/BASIC" badge on profile
- ✅ `subscriptionState.isSubscribed = false`
- ✅ `subscriptionState.activePlan = null`

### Console Logs to Verify:
```
🔍 [fetchActiveSubscriptions] Fetching active purchases from store...
✅ [fetchActiveSubscriptions] Found 0 active purchase(s)
ℹ️ [fetchActiveSubscriptions] No active purchases found - user is not subscribed
🔍 [getActiveSubscriptionForUser] Checking 0 purchase(s) for valid subscriptions...
ℹ️ [getActiveSubscriptionForUser] No valid subscription SKUs found
ℹ️ [useSubscription] NO ACTIVE SUBSCRIPTION
```

---

## Test 2: Purchase Basic Plan

### Steps:
1. Navigate to Subscription Plans screen
2. Select "Basic" plan
3. Tap "Choose Plan"
4. Complete Google Play purchase flow
5. Wait for purchase sheet to close

### Expected Results:
- ✅ Google Play purchase dialog appears
- ✅ After purchase, console logs show: `SUBSCRIPTION ACTIVE`
- ✅ Console logs show: `Plan: Basic`
- ✅ `refreshSubscription()` is called automatically after purchase
- ✅ Profile screen updates to show "Basic Plan Active" banner
- ✅ "BASIC" badge appears on profile
- ✅ `subscriptionState.isSubscribed = true`
- ✅ `subscriptionState.activePlan = "Basic"`
- ✅ Subscription Plans screen shows Basic as "Current Plan"

### Console Logs to Verify:
```
✅ Purchase successful in hook
🔄 Syncing Google Play purchase with backend
✅ Google Play purchase verified in backend
🔔 Notifying purchase complete callback...
🔄 [useSubscription] Starting subscription state refresh...
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
📦 Purchase 1: { productId: 'muscleai.basic.monthly', ... }
✅ [getActiveSubscriptionForUser] Found 1 valid subscription(s)
✅ [getActiveSubscriptionForUser] Active subscription determined: { planName: 'Basic', ... }
✅ [useSubscription] SUBSCRIPTION ACTIVE
✅ [useSubscription] Plan: Basic
```

---

## Test 3: App Restart - Subscription Persists

### Steps:
1. With Basic plan active, close app completely
2. Reopen app
3. Wait for app to load

### Expected Results:
- ✅ Console logs show: `SUBSCRIPTION ACTIVE`
- ✅ Console logs show: `Plan: Basic`
- ✅ Profile screen shows "Basic Plan Active" banner
- ✅ "BASIC" badge appears on profile
- ✅ `subscriptionState.isSubscribed = true`
- ✅ `subscriptionState.activePlan = "Basic"`
- ✅ No purchase flow triggered
- ✅ Subscription state restored from Google Play

### Console Logs to Verify:
```
🔄 [useSubscription] Starting subscription state refresh...
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
📦 Purchase 1: { productId: 'muscleai.basic.monthly', ... }
✅ [useSubscription] SUBSCRIPTION ACTIVE
✅ [useSubscription] Plan: Basic
```

---

## Test 4: App Foreground - Subscription Refresh

### Steps:
1. With app open and Basic plan active
2. Press home button (app goes to background)
3. Wait 5 seconds
4. Reopen app (bring to foreground)

### Expected Results:
- ✅ Console logs show: `App came to foreground, refreshing subscription...`
- ✅ `refreshSubscription()` is called automatically
- ✅ Subscription state is re-verified with Google Play
- ✅ UI remains consistent (Basic plan still active)

### Console Logs to Verify:
```
📱 App came to foreground, refreshing subscription...
🔄 [useSubscription] Starting subscription state refresh...
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
✅ [useSubscription] SUBSCRIPTION ACTIVE
✅ [useSubscription] Plan: Basic
```

---

## Test 5: Upgrade from Basic to Pro

### Steps:
1. With Basic plan active, navigate to Subscription Plans
2. Select "Pro" plan
3. Tap "Choose Plan"
4. Confirm plan change in dialog
5. Complete Google Play purchase flow

### Expected Results:
- ✅ Google Play shows upgrade flow
- ✅ After purchase, console logs show: `Plan: Pro`
- ✅ Profile screen updates to show "Pro Plan Active" banner
- ✅ "PRO" badge appears on profile (replaces "BASIC")
- ✅ `subscriptionState.activePlan = "Pro"`
- ✅ Subscription Plans screen shows Pro as "Current Plan"

### Console Logs to Verify:
```
✅ Purchase successful in hook
🔄 [useSubscription] Starting subscription state refresh...
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
📦 Purchase 1: { productId: 'muscleai.pro.monthly', ... }
✅ [useSubscription] SUBSCRIPTION ACTIVE
✅ [useSubscription] Plan: Pro
```

---

## Test 6: Multiple Subscriptions (Edge Case)

### Steps:
1. If user somehow has multiple active subscriptions (rare edge case during upgrade)
2. Open app

### Expected Results:
- ✅ Console logs show: `Found X valid subscription(s)`
- ✅ Console logs show: `Multiple subscriptions found, selected latest: [PlanName]`
- ✅ App picks the subscription with the latest transaction date
- ✅ UI shows only one active plan (the latest)

### Console Logs to Verify:
```
✅ [fetchActiveSubscriptions] Found 2 active purchase(s)
✅ [getActiveSubscriptionForUser] Found 2 valid subscription(s)
ℹ️ [getActiveSubscriptionForUser] Multiple subscriptions found, selected latest: Pro
✅ [useSubscription] Plan: Pro
```

---

## Test 7: Cancel Subscription (Sandbox)

### Steps:
1. With active subscription, go to Google Play Subscriptions
2. Cancel the subscription
3. Wait until the end of the sandbox billing period (usually 5 minutes for testing)
4. Open app after subscription expires

### Expected Results:
- ✅ During grace period: subscription still shows as active
- ✅ After expiration: console logs show `NO ACTIVE SUBSCRIPTION`
- ✅ Profile screen shows "Upgrade to Premium" banner again
- ✅ Plan badge removed from profile
- ✅ `subscriptionState.isSubscribed = false`
- ✅ `subscriptionState.activePlan = null`

### Console Logs to Verify (After Expiration):
```
✅ [fetchActiveSubscriptions] Found 0 active purchase(s)
ℹ️ [fetchActiveSubscriptions] No active purchases found - user is not subscribed
ℹ️ [useSubscription] NO ACTIVE SUBSCRIPTION
```

---

## Test 8: Already Owned Error Handling

### Steps:
1. With active subscription, try to purchase the same plan again
2. Google Play should return "already owned" error

### Expected Results:
- ✅ Console logs show: `Item already owned. Attempting to restore subscription...`
- ✅ App automatically restores subscription from existing purchase
- ✅ No error shown to user (handled gracefully)
- ✅ Subscription state remains active

### Console Logs to Verify:
```
ℹ️ Item already owned. Attempting to restore subscription from Google Play purchases.
🔄 Restoring subscription from existing Google Play purchase
✅ Restored Google Play subscription verified in backend
🔔 Notifying purchase complete callback (restore)...
```

---

## Test 9: Network Error Handling

### Steps:
1. Turn off WiFi and mobile data
2. Open app
3. Wait for subscription check to complete

### Expected Results:
- ✅ Console logs show error fetching subscriptions
- ✅ App treats user as not subscribed (fail-safe)
- ✅ No crash or infinite loading
- ✅ User can still use app (with free tier limits)

### Console Logs to Verify:
```
❌ [fetchActiveSubscriptions] Error fetching active subscriptions
❌ [useSubscription] Error refreshing subscription
ℹ️ [useSubscription] NO ACTIVE SUBSCRIPTION
```

---

## Test 10: Billing Not Available (Non-Play Store Install)

### Steps:
1. Install app via APK (not from Play Store)
2. Open app
3. Try to view subscription plans

### Expected Results:
- ✅ Diagnostics show: `Installer Package: unknown (NOT Play Store)`
- ✅ Diagnostics show: `Subscriptions Supported: ❌ No`
- ✅ Warning message: "App not installed from Google Play"
- ✅ Purchase buttons disabled
- ✅ User cannot initiate purchase

---

## Test 11: Price Display from Google Play

### Steps:
1. Open Subscription Plans screen
2. Observe prices for all plans

### Expected Results:
- ✅ Prices are loaded from Google Play ProductDetails
- ✅ Prices show correct currency and formatting
- ✅ Prices show "per month" period text
- ✅ No hard-coded prices anywhere in UI
- ✅ If prices not loaded: shows "Loading price..." or "Price on Google Play"

### Console Logs to Verify:
```
📊 Billing diagnostics in hook: { productsCount: 3, ... }
📊 Extracted prices from Google Play ProductDetails:
  Basic: ₹99.00 per month
  Pro: ₹199.00 per month
  VIP: ₹299.00 per month
```

---

## Test 12: Backend Sync (Optional Mirror)

### Steps:
1. Purchase a subscription
2. Check console logs for backend sync

### Expected Results:
- ✅ Console logs show: `Syncing subscription state to backend...`
- ✅ Sync data includes: `user_id`, `is_subscribed`, `product_id`, `plan_name`
- ✅ If sync fails: app continues to work (sync is optional)
- ✅ Backend sync does NOT affect UI state (client is source of truth)

### Console Logs to Verify:
```
🔄 [syncSubscriptionToBackend] Syncing subscription state to backend...
📊 [syncSubscriptionToBackend] Sync data: {
  user_id: '...',
  is_subscribed: true,
  product_id: 'muscleai.pro.monthly',
  plan_name: 'Pro',
  last_checked_at: '2024-12-06T...'
}
✅ [syncSubscriptionToBackend] Backend sync completed
```

---

## Summary Checklist

### Core Functionality
- [ ] Fresh install shows no subscription
- [ ] Purchase flow works and updates UI immediately
- [ ] Subscription persists after app restart
- [ ] Subscription refreshes on app foreground
- [ ] Upgrade/downgrade between plans works
- [ ] Cancelled subscription expires correctly

### Error Handling
- [ ] "Already owned" error handled gracefully
- [ ] Network errors don't crash app
- [ ] Non-Play Store installs show appropriate warnings
- [ ] Multiple subscriptions handled correctly

### UI/UX
- [ ] Profile screen shows correct subscription status
- [ ] Subscription Plans screen shows current plan
- [ ] Plan badges appear/disappear correctly
- [ ] Prices loaded from Google Play (never hard-coded)
- [ ] Loading states work correctly

### Technical
- [ ] Console logs are clear and helpful
- [ ] `getAvailablePurchases()` is the only source of truth
- [ ] Backend sync is optional and doesn't break app
- [ ] No RTDN, Play Developer API, or cron jobs used

---

## Debugging Tips

### If subscription not detected after purchase:
1. Check console logs for `getAvailablePurchases()` results
2. Verify product ID matches exactly: `muscleai.basic.monthly`, `muscleai.pro.monthly`, `muscleai.vip.monthly`
3. Ensure purchase was acknowledged (check backend logs)
4. Try calling `refreshSubscription()` manually

### If prices not showing:
1. Check diagnostics: `productsCount` should be 3
2. Verify billing is initialized: `initialized: true`
3. Check installer package: should be from Play Store
4. Verify product IDs in Google Play Console match code

### If app crashes on purchase:
1. Check for missing `basePlanId` or `offerToken`
2. Verify subscription offers are configured in Play Console
3. Check for null/undefined product in `products` array

---

## Success Criteria

✅ **All tests pass**
✅ **Console logs are clear and informative**
✅ **UI updates immediately after purchase**
✅ **Subscription state persists across app restarts**
✅ **No manual backend checks needed**
✅ **Google Play is the single source of truth**

---

## Notes

- This implementation does NOT use RTDN (Real-Time Developer Notifications)
- This implementation does NOT use Play Developer API
- This implementation does NOT use cron jobs or scheduled checks
- Google Play handles all renewals and billing dates automatically
- The app simply checks "does this user have an active subscription?" via `getAvailablePurchases()`
