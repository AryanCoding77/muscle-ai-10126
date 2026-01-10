# Client-Side Subscription Testing Checklist

## Overview
This document provides a comprehensive testing checklist for the new client-side subscription system using `react-native-iap` v14's `getAvailablePurchases()` API.

## Architecture Summary

### Key Components
1. **subscriptionHelper.ts** - Pure functions for fetching and normalizing purchases
2. **useSubscription hook** - Single source of truth for subscription state
3. **Updated screens** - Profile, SubscriptionPlans, GooglePlayPayment now use the hook
4. **Auto-refresh** - Checks subscription on app start, foreground, and after purchase

### How It Works
- Google Play handles all renewals and billing dates automatically
- App checks "does this user have an active subscription?" via `getAvailablePurchases()`
- No RTDN, Play Developer API, or cron jobs needed
- Backend sync is optional (for analytics only)

## Testing Checklist

### 1. Initial Setup
- [ ] Clear app data on test device
- [ ] Install app from Internal Testing track on Google Play
- [ ] Ensure test account is added to License Testing in Play Console
- [ ] Verify all 3 subscription SKUs are ACTIVE in Play Console with base plans

### 2. First Launch (No Subscription)
- [ ] Open app and navigate to Profile screen
- [ ] Verify "Upgrade to Premium" banner is shown
- [ ] Check console logs show: `ℹ️ No active subscription found`
- [ ] Verify `useSubscription` state shows:
  - `isSubscribed: false`
  - `activePlan: null`
  - `loading: false`

### 3. Purchase Basic Plan
- [ ] Navigate to Subscription Plans screen
- [ ] Select "Basic" plan
- [ ] Tap "Choose Plan" button
- [ ] Complete purchase in Google Play dialog (use test card)
- [ ] After Play sheet closes, verify console shows:
  - `🔄 Refreshing subscription state...`
  - `✅ Active subscription found: Basic`
- [ ] Verify Profile screen now shows:
  - "BASIC" badge next to username
  - "Basic Plan Active" banner (instead of "Upgrade to Premium")
- [ ] Verify Subscription Plans screen shows:
  - "CURRENT PLAN" badge on Basic card
  - "Your Current Plan: Basic" status banner

### 4. App Restart (Persistence Check)
- [ ] Force close the app completely
- [ ] Reopen the app
- [ ] Navigate to Profile screen
- [ ] Verify subscription state persists:
  - "BASIC" badge still shown
  - "Basic Plan Active" banner still shown
- [ ] Check console logs show:
  - `🔍 Fetching active purchases from store...`
  - `✅ Found 1 active purchase(s)`
  - `✅ Active subscription found: Basic`

### 5. App Foreground (Auto-Refresh)
- [ ] With app open, press Home button (send app to background)
- [ ] Wait 5 seconds
- [ ] Reopen app (bring to foreground)
- [ ] Check console logs show:
  - `📱 App came to foreground, refreshing subscription...`
  - `🔍 Fetching active purchases from store...`
- [ ] Verify subscription state remains correct

### 6. Upgrade to Pro Plan
- [ ] Navigate to Subscription Plans screen
- [ ] Select "Pro" plan
- [ ] Tap "Choose Plan" button
- [ ] Confirm plan change dialog
- [ ] Complete purchase in Google Play
- [ ] After purchase, verify:
  - Console shows: `✅ Active subscription found: Pro`
  - Profile shows "PRO" badge
  - Plans screen shows "CURRENT PLAN" on Pro card

### 7. Multiple Subscriptions (Edge Case)
If user somehow has multiple active subscriptions:
- [ ] The hook should pick the one with latest transaction date
- [ ] Console should log which subscription was selected
- [ ] UI should show only one active plan

### 8. Subscription Cancellation
- [ ] Open Google Play Store app
- [ ] Go to Subscriptions
- [ ] Cancel the active subscription
- [ ] **Important**: In sandbox, cancellation is immediate
- [ ] Return to your app
- [ ] Pull down to refresh or restart app
- [ ] Verify:
  - Console shows: `ℹ️ No active subscription found`
  - Profile shows "Upgrade to Premium" banner again
  - PRO/BASIC badge is removed
  - Plans screen shows no "CURRENT PLAN" badge

### 9. Re-subscribe After Cancellation
- [ ] After cancellation, purchase a plan again
- [ ] Verify subscription is detected immediately
- [ ] Verify all UI updates correctly

### 10. Network Offline Test
- [ ] Enable airplane mode
- [ ] Open app
- [ ] Verify app handles gracefully:
  - Shows last known subscription state
  - Or shows "not subscribed" if no cached state
- [ ] Re-enable network
- [ ] Verify subscription refreshes automatically

### 11. Console Logging Verification
Check that logs are clear and helpful:
- [ ] `🔍 Fetching active purchases from store...`
- [ ] `✅ Found X active purchase(s)`
- [ ] `📦 Purchase 1: { productId, transactionDate, platform }`
- [ ] `✅ Active subscription found: { planName, productId }`
- [ ] `🔄 Refreshing subscription state...`
- [ ] `📱 App came to foreground, refreshing subscription...`

### 12. Error Handling
- [ ] Test with invalid product IDs (should handle gracefully)
- [ ] Test with billing service unavailable (should show not subscribed)
- [ ] Test with Play Store not installed (should handle gracefully)

### 13. UI State Consistency
Verify all screens show consistent state:
- [ ] Profile screen subscription banner
- [ ] Profile screen PRO/BASIC/VIP badge
- [ ] Subscription Plans screen current plan indicator
- [ ] Subscription Plans screen status banner
- [ ] Any paywall/gating logic respects `isSubscribed` state

### 14. Performance Check
- [ ] Subscription check should complete in < 2 seconds
- [ ] No UI blocking during refresh
- [ ] Loading states shown appropriately
- [ ] No excessive API calls (should only refresh on mount/foreground/purchase)

## Expected Console Output Examples

### No Subscription
```
🔍 Fetching active purchases from store...
✅ Found 0 active purchase(s)
ℹ️ No active subscription found
```

### Active Subscription
```
🔍 Fetching active purchases from store...
✅ Found 1 active purchase(s)
📦 Purchase 1: {
  productId: 'muscleai.pro.monthly',
  transactionDate: '2024-12-05T10:30:00.000Z',
  platform: 'android'
}
✅ Active subscription found: {
  planName: 'Pro',
  productId: 'muscleai.pro.monthly'
}
```

### After Purchase
```
🔔 Notifying purchase complete callback...
🔄 Purchase complete, refreshing subscription state...
🔍 Fetching active purchases from store...
✅ Found 1 active purchase(s)
✅ Active subscription found: Pro
```

## Troubleshooting

### Subscription Not Detected After Purchase
1. Check console for errors in `getAvailablePurchases()`
2. Verify purchase was acknowledged (check BillingService logs)
3. Verify product ID matches exactly (case-sensitive)
4. Try force-closing and reopening app
5. Check Google Play Console for purchase status

### Subscription Shows After Cancellation
1. In sandbox, cancellation should be immediate
2. Try clearing app data and reinstalling
3. Check if multiple test accounts are being used
4. Verify correct test account is signed into Play Store

### Multiple Plans Showing as Active
1. This is expected if user purchased multiple plans
2. Hook will pick the latest one by transaction date
3. Check console logs to see which was selected

## Production Considerations

### Before Going Live
- [ ] Remove or reduce verbose console logging
- [ ] Implement backend sync endpoint (optional)
- [ ] Add analytics tracking for subscription events
- [ ] Test with real payment methods (not just test cards)
- [ ] Verify subscription renewal works after 1 month
- [ ] Test grace period and account hold scenarios

### Monitoring
- Track these metrics:
  - Subscription check success rate
  - Time to detect new subscriptions
  - Subscription state consistency
  - Purchase completion rate

## Notes

- **No server-side verification needed** for basic functionality
- Google Play handles all renewal logic automatically
- `getAvailablePurchases()` is the official recommended API for v14
- Backend sync is optional and should only be used as a mirror
- The app trusts Google Play as the source of truth
- Subscription state is checked on every app start and foreground

## Support

If issues persist:
1. Check react-native-iap documentation: https://react-native-iap.dooboolab.com/
2. Verify Google Play Console configuration
3. Check Play Store app is updated on test device
4. Ensure test account has proper license testing access
