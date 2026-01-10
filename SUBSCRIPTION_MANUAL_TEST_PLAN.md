# Subscription System - Manual Test Plan

## Overview

This document provides step-by-step manual testing procedures for the subscription system, focusing on online/offline behavior and cache fallback mechanisms.

---

## Prerequisites

### Test Environment Setup
- [ ] Device with Google Play Services
- [ ] App installed from Google Play Internal Testing
- [ ] Test account added to license testers
- [ ] Ability to toggle airplane mode
- [ ] Access to device logs (adb logcat or React Native debugger)

### Test Data
- **Product IDs:**
  - Basic: `muscleai.basic.monthly`
  - Pro: `muscleai.pro.monthly`
  - VIP: `muscleai.vip.monthly`

---

## Test Suite

### Test 1: Online - Fresh Install & Purchase

**Objective:** Verify normal subscription flow when online

**Prerequisites:**
- Device online
- App not installed or data cleared

**Steps:**
1. Clear app data: `adb shell pm clear com.yourapp`
2. Install app from Internal Testing
3. Open app and sign in
4. Navigate to Profile screen
5. Observe "Upgrade to Premium" banner
6. Tap "Upgrade to Premium"
7. Select "Pro" plan
8. Tap "Choose Plan"
9. Complete Google Play purchase
10. Wait for purchase to complete
11. Observe Profile screen

**Expected Results:**
- ✅ Step 5: "Upgrade to Premium" banner visible
- ✅ Step 5: No plan badge on profile
- ✅ Step 9: Google Play purchase dialog appears
- ✅ Step 10: Purchase completes successfully
- ✅ Step 11: "Pro Plan Active" banner appears
- ✅ Step 11: "PRO" badge appears on profile
- ✅ Step 11: Subscription Plans screen shows Pro as "Current Plan"

**Console Logs to Verify:**
```
🔄 [useSubscription] Starting subscription state refresh...
🔍 [fetchActiveSubscriptions] Fetching active purchases from store...
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
📦 Purchase 1: { productId: 'muscleai.pro.monthly', ... }
✅ [getActiveSubscriptionForUser] Active subscription determined
✅ [useSubscription] SUBSCRIPTION ACTIVE
✅ [useSubscription] Plan: Pro
✅ [saveCachedSubscription] Cached subscription saved
```

**Pass Criteria:**
- [ ] Purchase completes successfully
- [ ] UI updates immediately after purchase
- [ ] Console logs show "SUBSCRIPTION ACTIVE"
- [ ] Cache is saved
- [ ] No errors in console

---

### Test 2: Online - App Restart with Active Subscription

**Objective:** Verify subscription persists across app restarts

**Prerequisites:**
- Device online
- Active Pro subscription from Test 1

**Steps:**
1. Close app completely (swipe away from recent apps)
2. Wait 5 seconds
3. Reopen app
4. Observe Profile screen

**Expected Results:**
- ✅ Step 4: "Pro Plan Active" banner visible immediately
- ✅ Step 4: "PRO" badge visible immediately
- ✅ Step 4: No loading delay or flicker

**Console Logs to Verify:**
```
💾 [useSubscription] Initializing with cached state
✅ [loadCachedSubscription] Loaded cached subscription
🔄 [useSubscription] Starting subscription state refresh...
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
✅ [useSubscription] SUBSCRIPTION ACTIVE
✅ [useSubscription] Plan: Pro
```

**Pass Criteria:**
- [ ] Subscription status shows immediately (from cache)
- [ ] Fresh data fetched in background
- [ ] UI remains consistent
- [ ] No errors in console

---

### Test 3: Offline - Cache Fallback

**Objective:** Verify app uses cached state when offline

**Prerequisites:**
- Device online
- Active Pro subscription

**Steps:**
1. With app open, note current subscription status
2. Close app completely
3. Enable airplane mode (device offline)
4. Wait 5 seconds
5. Reopen app
6. Observe Profile screen
7. Navigate to Subscription Plans screen
8. Observe plan status

**Expected Results:**
- ✅ Step 6: "Pro Plan Active" banner visible (from cache)
- ✅ Step 6: "PRO" badge visible (from cache)
- ✅ Step 6: No "Upgrade to Premium" flash
- ✅ Step 8: Pro plan shows as "Current Plan"
- ✅ No crash or blank screen

**Console Logs to Verify:**
```
💾 [useSubscription] Initializing with cached state
✅ [loadCachedSubscription] Loaded cached subscription: { isSubscribed: true, activePlan: 'Pro' }
🔄 [useSubscription] Starting subscription state refresh...
🔍 [fetchActiveSubscriptions] Fetching active purchases from store...
❌ [fetchActiveSubscriptions] Error fetching active subscriptions
   Error code: E_NETWORK_ERROR
❌ [useSubscription] Store check failed, using cached subscription state
💾 [useSubscription] Using cached subscription state (offline mode)
```

**Pass Criteria:**
- [ ] App opens successfully offline
- [ ] Subscription status preserved from cache
- [ ] No "not subscribed" state shown
- [ ] Console shows "using cached subscription state"
- [ ] No crash or error dialog

---

### Test 4: Offline → Online - Cache Refresh

**Objective:** Verify fresh data replaces cache when going online

**Prerequisites:**
- App open in offline mode (from Test 3)
- Active Pro subscription

**Steps:**
1. With app open showing cached state
2. Disable airplane mode (device online)
3. Wait 5 seconds for network to connect
4. Bring app to foreground (or press home and reopen)
5. Observe console logs
6. Observe Profile screen

**Expected Results:**
- ✅ Step 5: Console shows "App came to foreground, refreshing subscription..."
- ✅ Step 5: Store check succeeds
- ✅ Step 5: Cache is updated with fresh data
- ✅ Step 6: UI remains consistent (still shows Pro)
- ✅ Step 6: No flicker or state change

**Console Logs to Verify:**
```
📱 App came to foreground, refreshing subscription...
🔄 [useSubscription] Starting subscription state refresh...
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
✅ [useSubscription] SUBSCRIPTION ACTIVE
✅ [useSubscription] Plan: Pro
✅ [saveCachedSubscription] Cached subscription saved: { lastCheckedAt: '2025-12-06T...' }
```

**Pass Criteria:**
- [ ] Store check succeeds when online
- [ ] Cache is updated with fresh timestamp
- [ ] UI remains consistent
- [ ] No errors in console

---

### Test 5: Fresh Install Offline - No Cache

**Objective:** Verify safe default when no cache exists and offline

**Prerequisites:**
- Device offline (airplane mode)
- App not installed or data cleared

**Steps:**
1. Enable airplane mode
2. Clear app data: `adb shell pm clear com.yourapp`
3. Open app
4. Observe Profile screen
5. Observe console logs

**Expected Results:**
- ✅ Step 3: App opens successfully
- ✅ Step 4: "Upgrade to Premium" banner visible
- ✅ Step 4: No plan badge
- ✅ Step 4: No crash or error
- ✅ Step 5: Console shows "No cached subscription found"
- ✅ Step 5: Console shows "falling back to 'not subscribed'"

**Console Logs to Verify:**
```
🔄 [useSubscription] Starting subscription state refresh...
❌ [fetchActiveSubscriptions] Error fetching active subscriptions
❌ [useSubscription] Store check failed, using cached subscription state
ℹ️ [loadCachedSubscription] No cached subscription found
⚠️ [useSubscription] No cached state available, falling back to "not subscribed"
```

**Pass Criteria:**
- [ ] App doesn't crash offline with no cache
- [ ] Shows safe default (not subscribed)
- [ ] Console logs explain the fallback
- [ ] No error dialog shown to user

---

### Test 6: Stale Cache Warning

**Objective:** Verify staleness detection for old cached data

**Prerequisites:**
- Active Pro subscription
- Device offline

**Steps:**
1. With app closed, change device date to 8 days in the future
2. Enable airplane mode
3. Open app
4. Observe console logs
5. Observe Profile screen

**Expected Results:**
- ✅ Step 4: Console shows "Cached subscription is 8 days old (stale)"
- ✅ Step 5: UI still shows "Pro Plan Active" (cache is used despite staleness)
- ✅ Step 5: No error or warning shown to user

**Console Logs to Verify:**
```
✅ [loadCachedSubscription] Loaded cached subscription
⚠️ [loadCachedSubscription] Cached subscription is 8 days old (stale)
💾 [useSubscription] Using cached subscription state (offline mode)
```

**Pass Criteria:**
- [ ] Stale cache warning logged
- [ ] Cache is still used (doesn't block functionality)
- [ ] UI shows subscription as active
- [ ] No user-facing error

**Cleanup:**
- [ ] Reset device date to current date

---

### Test 7: Cancel Subscription (Online)

**Objective:** Verify cache updates when subscription is cancelled

**Prerequisites:**
- Device online
- Active Pro subscription

**Steps:**
1. Go to Google Play Store
2. Navigate to Subscriptions
3. Cancel the Pro subscription
4. Wait for sandbox expiration (5 minutes for test accounts)
5. Close and reopen app
6. Observe Profile screen
7. Observe console logs

**Expected Results:**
- ✅ Step 6: "Upgrade to Premium" banner visible
- ✅ Step 6: No plan badge
- ✅ Step 7: Console shows "NO ACTIVE SUBSCRIPTION"
- ✅ Step 7: Console shows cache saved with `isSubscribed: false`

**Console Logs to Verify:**
```
🔄 [useSubscription] Starting subscription state refresh...
✅ [fetchActiveSubscriptions] Found 0 active purchase(s)
ℹ️ [fetchActiveSubscriptions] No active purchases found - user is not subscribed
ℹ️ [useSubscription] NO ACTIVE SUBSCRIPTION
✅ [saveCachedSubscription] Cached subscription saved: { isSubscribed: false }
```

**Pass Criteria:**
- [ ] Store check detects no active subscription
- [ ] Cache is updated to reflect cancellation
- [ ] UI updates to show "not subscribed"
- [ ] No errors in console

---

### Test 8: Upgrade Plan (Online)

**Objective:** Verify cache updates when upgrading subscription

**Prerequisites:**
- Device online
- Active Basic subscription

**Steps:**
1. Navigate to Subscription Plans screen
2. Select "Pro" plan
3. Tap "Choose Plan"
4. Confirm upgrade in Google Play dialog
5. Wait for purchase to complete
6. Observe Profile screen
7. Observe console logs

**Expected Results:**
- ✅ Step 5: Purchase completes successfully
- ✅ Step 6: "Pro Plan Active" banner visible (updated from Basic)
- ✅ Step 6: "PRO" badge visible (updated from BASIC)
- ✅ Step 7: Console shows "Plan: Pro"
- ✅ Step 7: Cache saved with new plan

**Console Logs to Verify:**
```
✅ Purchase successful in hook
🔔 Notifying purchase complete callback...
🔄 [useSubscription] Starting subscription state refresh...
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
📦 Purchase 1: { productId: 'muscleai.pro.monthly', ... }
✅ [useSubscription] SUBSCRIPTION ACTIVE
✅ [useSubscription] Plan: Pro
✅ [saveCachedSubscription] Cached subscription saved: { activePlan: 'Pro' }
```

**Pass Criteria:**
- [ ] Upgrade completes successfully
- [ ] UI updates to show new plan
- [ ] Cache reflects new plan
- [ ] No errors in console

---

### Test 9: App Foreground Refresh

**Objective:** Verify subscription refreshes when app comes to foreground

**Prerequisites:**
- Device online
- Active Pro subscription

**Steps:**
1. Open app
2. Press home button (app goes to background)
3. Wait 5 seconds
4. Reopen app (bring to foreground)
5. Observe console logs

**Expected Results:**
- ✅ Step 5: Console shows "App came to foreground, refreshing subscription..."
- ✅ Step 5: Store check is performed
- ✅ Step 5: Subscription status is re-verified

**Console Logs to Verify:**
```
📱 App came to foreground, refreshing subscription...
🔄 [useSubscription] Starting subscription state refresh...
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
✅ [useSubscription] SUBSCRIPTION ACTIVE
```

**Pass Criteria:**
- [ ] Foreground event triggers refresh
- [ ] Store check is performed
- [ ] No errors in console

---

### Test 10: Multiple Subscriptions (Edge Case)

**Objective:** Verify handling of multiple active subscriptions

**Prerequisites:**
- Device online
- Ability to have multiple active subscriptions (rare edge case)

**Steps:**
1. Purchase Basic plan
2. Immediately purchase Pro plan (before Basic expires)
3. Open app
4. Observe console logs
5. Observe Profile screen

**Expected Results:**
- ✅ Step 4: Console shows "Found 2 valid subscription(s)"
- ✅ Step 4: Console shows "Multiple subscriptions found, selected latest: Pro"
- ✅ Step 5: UI shows "Pro Plan Active" (latest transaction)
- ✅ Step 5: "PRO" badge visible

**Console Logs to Verify:**
```
✅ [fetchActiveSubscriptions] Found 2 active purchase(s)
✅ [getActiveSubscriptionForUser] Found 2 valid subscription(s)
ℹ️ [getActiveSubscriptionForUser] Multiple subscriptions found, selected latest: Pro
✅ [useSubscription] Plan: Pro
```

**Pass Criteria:**
- [ ] App handles multiple subscriptions
- [ ] Picks latest transaction date
- [ ] UI shows correct plan
- [ ] No errors in console

---

## Test Results Summary

### Test Execution Checklist

| Test # | Test Name | Status | Date | Notes |
|--------|-----------|--------|------|-------|
| 1 | Online - Fresh Install & Purchase | ⬜ | | |
| 2 | Online - App Restart | ⬜ | | |
| 3 | Offline - Cache Fallback | ⬜ | | |
| 4 | Offline → Online - Cache Refresh | ⬜ | | |
| 5 | Fresh Install Offline - No Cache | ⬜ | | |
| 6 | Stale Cache Warning | ⬜ | | |
| 7 | Cancel Subscription | ⬜ | | |
| 8 | Upgrade Plan | ⬜ | | |
| 9 | App Foreground Refresh | ⬜ | | |
| 10 | Multiple Subscriptions | ⬜ | | |

**Legend:**
- ⬜ Not tested
- ✅ Passed
- ❌ Failed
- ⚠️ Passed with issues

---

## Common Issues & Troubleshooting

### Issue: Subscription not detected after purchase

**Symptoms:**
- Purchase completes but UI doesn't update
- Console shows "Found 0 active purchase(s)"

**Possible Causes:**
1. Purchase not acknowledged
2. Product ID mismatch
3. Billing not initialized

**Debugging Steps:**
1. Check console for purchase acknowledgement logs
2. Verify product IDs match Google Play Console
3. Call `refreshSubscription()` manually
4. Check `diagnostics.subscriptionsSupported`

---

### Issue: Cache not loading

**Symptoms:**
- Offline mode shows "not subscribed" despite previous subscription
- Console shows "No cached subscription found"

**Possible Causes:**
1. Cache was never saved
2. AsyncStorage error
3. App data was cleared

**Debugging Steps:**
1. Check console for "Cached subscription saved" logs
2. Verify AsyncStorage permissions
3. Check for AsyncStorage errors in console

---

### Issue: Stale cache not updating

**Symptoms:**
- Cache shows old subscription status
- Fresh data not replacing cache

**Possible Causes:**
1. Store check failing silently
2. Cache save failing
3. Network issues

**Debugging Steps:**
1. Check console for store check success/failure
2. Verify device is online
3. Check for cache save errors
4. Force refresh with `refreshSubscription()`

---

## Performance Benchmarks

### Expected Timings

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Cache load | < 50ms | AsyncStorage read |
| Store check (online) | 50-200ms | Network + Google Play API |
| Cache save | < 50ms | AsyncStorage write |
| Full refresh (online) | 100-300ms | Load cache + store check + save |
| Full refresh (offline) | 50-100ms | Load cache + failed store check |

---

## Test Environment Details

### Device Information
- **Device Model:** _________________
- **Android Version:** _________________
- **Google Play Services Version:** _________________
- **App Version:** _________________
- **Build Type:** Internal Testing / Production

### Test Account
- **Email:** _________________
- **License Tester:** Yes / No
- **Region:** _________________

### Network Conditions
- **Connection Type:** WiFi / Mobile Data / Offline
- **Speed:** Fast / Slow / None

---

## Sign-Off

### Tester Information
- **Name:** _________________
- **Date:** _________________
- **Signature:** _________________

### Test Results
- **Total Tests:** 10
- **Passed:** ___ / 10
- **Failed:** ___ / 10
- **Overall Status:** ✅ PASS / ❌ FAIL

### Notes
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Appendix: Console Log Filtering

### Useful adb logcat Filters

**View all subscription logs:**
```bash
adb logcat | grep -E "\[useSubscription\]|\[fetchActiveSubscriptions\]|\[getActiveSubscriptionForUser\]|\[saveCachedSubscription\]|\[loadCachedSubscription\]"
```

**View only errors:**
```bash
adb logcat | grep -E "❌.*\[useSubscription\]|❌.*\[fetchActiveSubscriptions\]"
```

**View only cache operations:**
```bash
adb logcat | grep -E "\[saveCachedSubscription\]|\[loadCachedSubscription\]"
```

**View subscription state changes:**
```bash
adb logcat | grep -E "SUBSCRIPTION ACTIVE|NO ACTIVE SUBSCRIPTION"
```

---

**Document Version:** 1.0  
**Last Updated:** December 6, 2025  
**Status:** Ready for Testing
