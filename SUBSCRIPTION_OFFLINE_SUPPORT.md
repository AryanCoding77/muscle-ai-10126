# Subscription System - Offline Support & Error Handling

## Overview

The subscription system now includes robust offline support and error handling. When the app is offline or the store is unavailable, it falls back to the last known subscription state cached locally, preventing users from losing access to premium features during temporary network issues.

---

## Key Changes

### 1. ✅ Verified react-native-iap v14 API Usage

**API Used:** `getAvailablePurchases()`

**Location:** `src/utils/subscriptionHelper.ts` - `fetchActiveSubscriptions()`

**Documentation:** https://react-native-iap.dooboolab.com/docs/api-reference/functions/getAvailablePurchases

**Why This API:**
- ✅ **Correct for v14:** This is the recommended method in react-native-iap v14
- ✅ **Returns active subscriptions only:** Filters out expired, cancelled, and refunded purchases
- ✅ **Cross-platform:** Works consistently on both Android and iOS
- ✅ **Acknowledged purchases:** Returns only acknowledged purchases (important for Android)

**Alternative APIs NOT Used:**
- ❌ `getPurchaseHistory()` - Returns ALL purchases including expired/cancelled (not suitable for active status)
- ❌ `getSubscriptions()` - Deprecated in v14, replaced by `getAvailablePurchases()`

**Implementation:**
```typescript
// src/utils/subscriptionHelper.ts
import { getAvailablePurchases, Purchase } from 'react-native-iap';

export async function fetchActiveSubscriptions(): Promise<NormalizedPurchase[]> {
  try {
    // getAvailablePurchases() returns only active purchases
    const purchases = await getAvailablePurchases();
    
    // Normalize and return
    return purchases.map((purchase: Purchase) => ({
      productId: purchase.productId,
      purchaseToken: purchase.purchaseToken || '',
      transactionDate: typeof purchase.transactionDate === 'number' 
        ? purchase.transactionDate 
        : new Date(purchase.transactionDate).getTime(),
      platform: Platform.OS as 'android' | 'ios',
    }));
  } catch (error) {
    // Re-throw error so caller can handle (e.g., use cached state)
    throw error;
  }
}
```

---

### 2. ✅ Implemented Offline Support with Cached State

**Location:** `src/hooks/useSubscription.ts`

**Cache Storage:** AsyncStorage with key `subscription:lastKnownState`

**Cache Structure:**
```typescript
interface CachedSubscription {
  isSubscribed: boolean;
  activePlan: 'Basic' | 'Pro' | 'VIP' | null;
  productId: string | null;
  purchaseToken: string | null;
  lastCheckedAt: number; // timestamp in milliseconds
}
```

---

## How It Works

### Normal Flow (Online)

```
App Start
    ↓
Load cached state (instant UI)
    ↓
Call getAvailablePurchases()
    ↓
Success: Update state + cache
    ↓
UI shows fresh subscription status
```

### Offline Flow (Network Error)

```
App Start
    ↓
Load cached state (instant UI)
    ↓
Call getAvailablePurchases()
    ↓
Error: Network unavailable
    ↓
Fall back to cached state
    ↓
UI shows last known subscription status
    ↓
User keeps premium access
```

### No Cache Flow (First Install)

```
App Start
    ↓
No cached state available
    ↓
Call getAvailablePurchases()
    ↓
Error: Network unavailable
    ↓
Fall back to safe default
    ↓
UI shows "not subscribed"
```

---

## Implementation Details

### Cache Management

#### Save Cache (On Success)
```typescript
// After successful store check
await saveCachedSubscription({
  isSubscribed: true,
  activePlan: 'Pro',
  productId: 'muscleai.pro.monthly',
  purchaseToken: 'abc123...',
  lastCheckedAt: Date.now(),
});
```

#### Load Cache (On Error)
```typescript
// When store check fails
const cached = await loadCachedSubscription();
if (cached) {
  // Use cached state
  setState({
    loading: false,
    isSubscribed: cached.isSubscribed,
    activePlan: cached.activePlan,
    // ...
  });
}
```

#### Staleness Detection
```typescript
// Warn if cache is older than 7 days
const age = Date.now() - cached.lastCheckedAt;
const isStale = age > (7 * 24 * 60 * 60 * 1000);

if (isStale) {
  console.warn(`⚠️ Cached subscription is ${daysOld} days old (stale)`);
}
```

---

## Error Handling Strategy

### 1. Store Check Succeeds
```typescript
✅ Fetch from store
✅ Update React state
✅ Save to cache
✅ Sync to backend (optional)
```

### 2. Store Check Fails (Offline/Error)
```typescript
❌ Store check fails
💾 Load cached state
✅ Use cached state if available
⚠️ Fall back to "not subscribed" if no cache
```

### 3. Cache Never Gets Stuck
```typescript
// Once store check succeeds again:
✅ Overwrite cache with fresh data
✅ Update UI with real store status
✅ Cache is now fresh again
```

---

## Console Logs

### Successful Store Check
```
🔄 [useSubscription] Starting subscription state refresh...
🔍 [fetchActiveSubscriptions] Fetching active purchases from store...
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
📦 Purchase 1: { productId: 'muscleai.pro.monthly', ... }
✅ [useSubscription] SUBSCRIPTION ACTIVE
✅ [useSubscription] Plan: Pro
✅ [saveCachedSubscription] Cached subscription saved
```

### Offline Mode (Using Cache)
```
🔄 [useSubscription] Starting subscription state refresh...
🔍 [fetchActiveSubscriptions] Fetching active purchases from store...
❌ [fetchActiveSubscriptions] Error fetching active subscriptions
❌ [useSubscription] Store check failed, using cached subscription state
💾 [useSubscription] Using cached subscription state (offline mode)
✅ [loadCachedSubscription] Loaded cached subscription: { isSubscribed: true, activePlan: 'Pro', ... }
```

### No Cache Available
```
❌ [useSubscription] Store check failed, using cached subscription state
ℹ️ [loadCachedSubscription] No cached subscription found
⚠️ [useSubscription] No cached state available, falling back to "not subscribed"
```

### Stale Cache Warning
```
✅ [loadCachedSubscription] Loaded cached subscription
⚠️ [loadCachedSubscription] Cached subscription is 10 days old (stale)
```

---

## Testing Guide

### Test 1: Normal Online Flow
**Steps:**
1. Clear app data
2. Install app
3. Purchase subscription
4. Verify subscription shows as active

**Expected:**
- ✅ Store check succeeds
- ✅ State updated
- ✅ Cache saved
- ✅ UI shows "Pro Plan Active"

**Console Logs:**
```
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
✅ [useSubscription] SUBSCRIPTION ACTIVE
✅ [saveCachedSubscription] Cached subscription saved
```

---

### Test 2: Offline Mode (With Cache)
**Steps:**
1. With active subscription, close app
2. Enable airplane mode
3. Reopen app

**Expected:**
- ✅ Cached state loaded instantly
- ❌ Store check fails (offline)
- ✅ Falls back to cached state
- ✅ UI shows "Pro Plan Active" (from cache)
- ✅ User keeps premium access

**Console Logs:**
```
💾 [useSubscription] Initializing with cached state
❌ [useSubscription] Store check failed, using cached subscription state
💾 [useSubscription] Using cached subscription state (offline mode)
```

**Verify:**
- Profile screen shows plan badge
- Premium features remain accessible
- No "Upgrade to Premium" banner

---

### Test 3: Return Online (Cache Refresh)
**Steps:**
1. From Test 2 (offline mode)
2. Disable airplane mode
3. Bring app to foreground

**Expected:**
- ✅ App detects foreground
- ✅ Triggers refresh
- ✅ Store check succeeds
- ✅ Cache updated with fresh data
- ✅ UI remains consistent

**Console Logs:**
```
📱 App came to foreground, refreshing subscription...
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
✅ [useSubscription] SUBSCRIPTION ACTIVE
✅ [saveCachedSubscription] Cached subscription saved
```

---

### Test 4: Offline Mode (No Cache - First Install)
**Steps:**
1. Clear app data
2. Enable airplane mode
3. Install and open app

**Expected:**
- ℹ️ No cached state available
- ❌ Store check fails (offline)
- ⚠️ Falls back to "not subscribed"
- ✅ UI shows "Upgrade to Premium"

**Console Logs:**
```
ℹ️ [loadCachedSubscription] No cached subscription found
❌ [useSubscription] Store check failed, using cached subscription state
⚠️ [useSubscription] No cached state available, falling back to "not subscribed"
```

**Verify:**
- Profile screen shows "Upgrade to Premium" banner
- No plan badge
- Free tier features only

---

### Test 5: Subscription Expires (Online)
**Steps:**
1. With active subscription
2. Cancel subscription in Google Play
3. Wait for expiration (sandbox: 5 minutes)
4. Open app

**Expected:**
- ✅ Store check succeeds
- ✅ Returns empty purchases array
- ✅ State updated to "not subscribed"
- ✅ Cache updated to "not subscribed"
- ✅ UI shows "Upgrade to Premium"

**Console Logs:**
```
✅ [fetchActiveSubscriptions] Found 0 active purchase(s)
ℹ️ [useSubscription] NO ACTIVE SUBSCRIPTION
✅ [saveCachedSubscription] Cached subscription saved: { isSubscribed: false, ... }
```

---

### Test 6: Subscription Expires (Offline)
**Steps:**
1. With active subscription
2. Cancel subscription in Google Play
3. Wait for expiration
4. Enable airplane mode
5. Open app

**Expected:**
- ❌ Store check fails (offline)
- 💾 Falls back to cached state
- ⚠️ Cache shows "subscribed" (stale)
- ✅ User keeps access temporarily
- ⚠️ Will update when online

**Console Logs:**
```
❌ [useSubscription] Store check failed, using cached subscription state
💾 [useSubscription] Using cached subscription state (offline mode)
⚠️ [loadCachedSubscription] Cached subscription is X days old (stale)
```

**Note:** This is intentional behavior. We prefer to keep users subscribed temporarily rather than immediately revoking access during network issues. Once online, the cache will be updated with the real status.

---

### Test 7: Stale Cache Warning
**Steps:**
1. With active subscription
2. Don't open app for 8+ days
3. Open app (online)

**Expected:**
- 💾 Cached state loaded (8 days old)
- ⚠️ Staleness warning logged
- ✅ Store check succeeds
- ✅ Cache refreshed with fresh data

**Console Logs:**
```
💾 [useSubscription] Initializing with cached state
⚠️ [loadCachedSubscription] Cached subscription is 8 days old (stale)
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
✅ [saveCachedSubscription] Cached subscription saved
```

---

## Benefits

### ✅ Better User Experience
- No sudden loss of premium features during network issues
- Instant UI feedback on app start (cached state)
- Graceful degradation when offline

### ✅ Reliability
- Handles network errors gracefully
- Handles billing service unavailability
- Handles temporary Google Play issues

### ✅ Transparency
- Clear console logs for debugging
- Staleness warnings for old cache
- Explicit offline mode indicators

### ✅ Safety
- Cache never overrides fresh store data
- Falls back to "not subscribed" if no cache
- Always updates cache when store check succeeds

---

## Edge Cases Handled

### 1. Network Timeout
```
Store check times out
    ↓
Fall back to cached state
    ↓
User keeps access
```

### 2. Billing Service Unavailable
```
Google Play Billing not available
    ↓
Fall back to cached state
    ↓
User keeps access
```

### 3. App Not Installed from Play Store
```
Billing not supported
    ↓
Fall back to cached state (if available)
    ↓
Or fall back to "not subscribed"
```

### 4. Cache Corrupted
```
JSON.parse() fails
    ↓
Log error
    ↓
Treat as "no cache"
    ↓
Fall back to "not subscribed"
```

### 5. Multiple Rapid Refreshes
```
Refresh already in progress
    ↓
Skip duplicate refresh
    ↓
Prevent race conditions
```

---

## Configuration

### Staleness Threshold
```typescript
// src/hooks/useSubscription.ts
const STALENESS_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days

// To change:
const STALENESS_THRESHOLD = 14 * 24 * 60 * 60 * 1000; // 14 days
```

### Cache Key
```typescript
// src/hooks/useSubscription.ts
const CACHE_KEY = 'subscription:lastKnownState';

// To change:
const CACHE_KEY = 'myapp:subscription:cache';
```

---

## Debugging

### Check Cached State
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Read cache
const cached = await AsyncStorage.getItem('subscription:lastKnownState');
console.log('Cached subscription:', JSON.parse(cached));

// Clear cache (for testing)
await AsyncStorage.removeItem('subscription:lastKnownState');
```

### Force Offline Mode
```bash
# Enable airplane mode on device
adb shell cmd connectivity airplane-mode enable

# Disable airplane mode
adb shell cmd connectivity airplane-mode disable
```

### Simulate Store Error
```typescript
// Temporarily modify fetchActiveSubscriptions to throw error
export async function fetchActiveSubscriptions(): Promise<NormalizedPurchase[]> {
  throw new Error('Simulated store error');
}
```

---

## Migration Notes

### Existing Users
- Existing users will have no cached state initially
- First successful store check will create cache
- No breaking changes to existing functionality

### Clearing Cache
```typescript
// If needed, clear cache for all users
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('subscription:lastKnownState');
```

---

## Summary

### What Changed
1. ✅ Verified `getAvailablePurchases()` is correct API for v14
2. ✅ Added AsyncStorage cache for subscription state
3. ✅ Implemented offline fallback to cached state
4. ✅ Added staleness detection (7 day threshold)
5. ✅ Enhanced error handling and logging
6. ✅ Load cached state on initialization for instant UI

### What Stayed the Same
- ✅ Public API: `{ state, refreshSubscription }`
- ✅ State structure: `SubscriptionState`
- ✅ Refresh triggers: mount, foreground, after purchase
- ✅ Google Play is still source of truth

### Key Principle
**"Prefer keeping users subscribed during temporary issues rather than immediately revoking access."**

When the store is unavailable, we trust the last known state. Once the store is available again, we update with fresh data. This provides a better user experience while maintaining security and accuracy.

---

## Quick Reference

### Check if Using Cached State
```typescript
const { state } = useSubscription();

// If lastCheckedAt is old, might be using cached state
const age = Date.now() - (state.lastCheckedAt || 0);
const isOld = age > 60000; // More than 1 minute old

if (isOld) {
  console.log('Might be using cached state');
}
```

### Force Refresh
```typescript
const { refreshSubscription } = useSubscription();

// Force a fresh store check
await refreshSubscription();
```

### Clear Cache (Testing)
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('subscription:lastKnownState');
```

---

**The subscription system now gracefully handles offline scenarios while maintaining Google Play as the source of truth.** 🎉
