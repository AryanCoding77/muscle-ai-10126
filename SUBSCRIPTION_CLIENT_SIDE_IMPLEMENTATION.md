# Client-Side Subscription Implementation Guide

## Overview

This document describes the complete client-side subscription implementation using `react-native-iap v14` and `getAvailablePurchases()`. This approach is simple, reliable, and lets Google Play handle all renewals and billing dates automatically.

**Key Principle:** The app just checks "does this user currently have an active subscription?" and updates UI + backend accordingly.

---

## Architecture

### Single Source of Truth
- **Google Play** is the source of truth for subscription status
- `getAvailablePurchases()` returns all active subscriptions
- No RTDN, Play Developer API, or cron jobs needed
- Backend is only a mirror for analytics (optional)

### Flow Diagram
```
App Start / Foreground / After Purchase
    ↓
fetchActiveSubscriptions()
    ↓
getAvailablePurchases() [react-native-iap]
    ↓
getActiveSubscriptionForUser()
    ↓
Update UI State (useSubscription hook)
    ↓
Optional: Sync to Backend (mirror only)
```

---

## Implementation Details

### 1. Helper Functions (`src/utils/subscriptionHelper.ts`)

#### `fetchActiveSubscriptions()`
- **Purpose:** Fetch all active purchases from Google Play
- **API Used:** `getAvailablePurchases()` from react-native-iap v14
- **Returns:** Array of normalized purchases
- **Error Handling:** Returns empty array on error (fail-safe)

```typescript
export async function fetchActiveSubscriptions(): Promise<NormalizedPurchase[]> {
  const purchases = await getAvailablePurchases({});
  // Normalize and return
}
```

**What it does:**
- Calls `getAvailablePurchases()` which returns active subscriptions
- For Android: returns subscriptions that are currently active (not expired)
- Normalizes the data to a consistent format
- Logs each purchase for debugging

#### `getActiveSubscriptionForUser()`
- **Purpose:** Determine which subscription is active
- **Input:** Array of normalized purchases
- **Returns:** Active subscription or null
- **Logic:** 
  1. Filter only our subscription SKUs (Basic/Pro/VIP)
  2. If multiple exist, pick the one with latest transaction date
  3. Map product ID to plan name

```typescript
export function getActiveSubscriptionForUser(
  subscriptions: NormalizedPurchase[]
): ActiveSubscription | null {
  // Filter our SKUs
  // Pick latest if multiple
  // Return active subscription
}
```

**Product ID Mapping:**
- `muscleai.basic.monthly` → "Basic"
- `muscleai.pro.monthly` → "Pro"
- `muscleai.vip.monthly` → "VIP"

---

### 2. useSubscription Hook (`src/hooks/useSubscription.ts`)

#### State Management
```typescript
interface SubscriptionState {
  loading: boolean;
  isSubscribed: boolean;
  activePlan: "Basic" | "Pro" | "VIP" | null;
  productId: string | null;
  purchaseToken: string | null;
  lastCheckedAt: number | null;
}
```

#### Core Function: `refreshSubscription()`
Called on:
- App mount (initial load)
- App foreground (when user returns to app)
- After purchase completion

```typescript
const refreshSubscription = async () => {
  // 1. Fetch active subscriptions
  const subscriptions = await fetchActiveSubscriptions();
  
  // 2. Determine active subscription
  const activeSubscription = getActiveSubscriptionForUser(subscriptions);
  
  // 3. Update state
  if (activeSubscription) {
    setState({
      isSubscribed: true,
      activePlan: activeSubscription.planName,
      // ...
    });
  } else {
    setState({
      isSubscribed: false,
      activePlan: null,
      // ...
    });
  }
  
  // 4. Optional: Sync to backend (mirror only)
  await syncSubscriptionToBackend(activeSubscription);
};
```

#### App State Monitoring
```typescript
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App came to foreground, refreshing subscription...');
      refreshSubscription();
    }
    appState.current = nextAppState;
  });
  
  return () => subscription.remove();
}, []);
```

---

### 3. Purchase Flow Integration (`src/hooks/useBilling.ts`)

#### Purchase Complete Callback
```typescript
// In useBilling.ts
BillingService.onPurchaseSuccess = async (purchase: Purchase) => {
  // 1. Sync purchase with backend
  await createSubscription(planId, {
    googlePlayPurchaseToken: purchaseToken,
    googlePlayProductId: productId,
  });
  
  // 2. Verify purchase
  await verifyGooglePlayPurchase(purchaseToken, productId, subscriptionId);
  
  // 3. Trigger subscription refresh
  if (onPurchaseCompleteRef.current) {
    onPurchaseCompleteRef.current(); // Calls refreshSubscription()
  }
};
```

#### In GooglePlayPaymentScreen
```typescript
// Set up callback to refresh subscription after purchase
useEffect(() => {
  setOnPurchaseComplete(() => {
    console.log('Purchase complete, refreshing subscription state...');
    refreshSubscription();
  });
}, [setOnPurchaseComplete, refreshSubscription]);
```

---

### 4. UI Integration

#### Profile Screen (`src/screens/ProfileScreen.tsx`)

```typescript
const { state: subscriptionState } = useSubscription();

// Show subscription banner
{!subscriptionState.isSubscribed && (
  <TouchableOpacity onPress={() => navigation.navigate('SubscriptionPlans')}>
    <Text>Upgrade to Premium</Text>
  </TouchableOpacity>
)}

// Show active plan
{subscriptionState.isSubscribed && subscriptionState.activePlan && (
  <View>
    <Text>{subscriptionState.activePlan} Plan Active</Text>
  </View>
)}

// Show plan badge
{subscriptionState.isSubscribed && (
  <View style={styles.proBadge}>
    <Text>{subscriptionState.activePlan?.toUpperCase()}</Text>
  </View>
)}
```

#### Subscription Plans Screen (`src/screens/SubscriptionPlansScreen.tsx`)

```typescript
const { state: subscriptionState } = useSubscription();

// Check if plan is current
const isCurrentPlan = subscriptionState.activePlan === plan.plan_name;

// Disable current plan button
<TouchableOpacity
  disabled={isCurrentPlan}
  onPress={() => handleSelectPlan(plan)}
>
  <Text>{isCurrentPlan ? 'Current Plan' : 'Choose Plan'}</Text>
</TouchableOpacity>

// Show current plan badge
{isCurrentPlan && (
  <View style={styles.currentBadge}>
    <Text>CURRENT PLAN</Text>
  </View>
)}
```

#### Paywall / Analysis Gating

```typescript
const { state: subscriptionState } = useSubscription();

// Check if user can perform unlimited analyses
if (subscriptionState.isSubscribed) {
  // Allow unlimited analyses
  performAnalysis();
} else {
  // Check free tier limits
  if (analysesRemaining > 0) {
    performAnalysis();
  } else {
    showPaywall();
  }
}
```

---

## Key Features

### ✅ Automatic Renewal Handling
- Google Play handles all renewals automatically
- App just checks current status via `getAvailablePurchases()`
- No need to track renewal dates or billing cycles

### ✅ Subscription Persistence
- Subscription state persists across app restarts
- No local storage needed
- Always fetched fresh from Google Play

### ✅ Real-Time Updates
- Refreshes on app foreground
- Refreshes after purchase
- Refreshes on app start

### ✅ Error Handling
- Network errors: fail-safe to "not subscribed"
- Already owned: automatically restore subscription
- Multiple subscriptions: pick latest transaction date
- Non-Play Store installs: show appropriate warnings

### ✅ Price Display
- Prices loaded from Google Play ProductDetails
- Never hard-coded
- Correct currency and formatting
- Shows "per month" period text

---

## Backend Sync (Optional)

### Purpose
- Analytics and dashboards
- Safety checks
- NOT the source of truth

### Implementation
```typescript
const syncSubscriptionToBackend = async (subscription: ActiveSubscription | null) => {
  const syncData = {
    user_id: user.id,
    is_subscribed: subscription !== null,
    product_id: subscription?.productId || null,
    plan_name: subscription?.planName || null,
    last_checked_at: new Date().toISOString(),
  };
  
  // Call Supabase Edge Function (optional)
  await supabase.functions.invoke('sync-subscription-local', {
    body: syncData,
  });
};
```

### Important Notes
- Backend sync is optional
- If sync fails, app continues to work
- Backend should NEVER override client state
- Client (Google Play) is always the source of truth

---

## Testing Strategy

### Manual Testing
See `SUBSCRIPTION_CLIENT_SIDE_TESTING_CHECKLIST.md` for complete checklist.

Key tests:
1. Fresh install - no subscription
2. Purchase flow
3. App restart - subscription persists
4. App foreground - subscription refreshes
5. Upgrade/downgrade
6. Cancellation and expiration

### Console Logs
The implementation includes comprehensive logging:
- `[fetchActiveSubscriptions]` - Purchase fetching
- `[getActiveSubscriptionForUser]` - Subscription determination
- `[useSubscription]` - State updates
- `[syncSubscriptionToBackend]` - Backend sync

### Debugging
```typescript
// Check subscription state
console.log('Subscription State:', subscriptionState);

// Manually refresh
refreshSubscription();

// Check diagnostics
console.log('Billing Diagnostics:', diagnostics);
```

---

## Common Issues & Solutions

### Issue: Subscription not detected after purchase
**Solution:**
1. Check console logs for `getAvailablePurchases()` results
2. Verify product ID matches exactly
3. Ensure purchase was acknowledged
4. Call `refreshSubscription()` manually

### Issue: Prices not showing
**Solution:**
1. Check diagnostics: `productsCount` should be 3
2. Verify billing is initialized
3. Check installer package (must be Play Store)
4. Verify product IDs in Play Console

### Issue: App crashes on purchase
**Solution:**
1. Check for missing `basePlanId` or `offerToken`
2. Verify subscription offers in Play Console
3. Check for null/undefined product

### Issue: Subscription shows as expired but still active in Play
**Solution:**
1. Call `refreshSubscription()` manually
2. Check network connection
3. Verify Google Play Services is up to date
4. Check console logs for errors

---

## API Reference

### useSubscription Hook

```typescript
const { state, refreshSubscription } = useSubscription();

// State
state.loading: boolean
state.isSubscribed: boolean
state.activePlan: "Basic" | "Pro" | "VIP" | null
state.productId: string | null
state.purchaseToken: string | null
state.lastCheckedAt: number | null

// Methods
refreshSubscription(): Promise<void>
```

### Helper Functions

```typescript
// Fetch active subscriptions
fetchActiveSubscriptions(): Promise<NormalizedPurchase[]>

// Get active subscription
getActiveSubscriptionForUser(
  subscriptions: NormalizedPurchase[]
): ActiveSubscription | null

// Map product ID to plan name
getProductIdToPlanName(productId: string): PlanName | null

// Compare plans
isPlanBetterOrEqual(plan1: PlanName, plan2: PlanName): boolean
```

---

## Best Practices

### ✅ DO
- Use `useSubscription()` hook as single source of truth
- Call `refreshSubscription()` after purchase
- Handle errors gracefully (fail-safe to free tier)
- Log important events for debugging
- Load prices from Google Play ProductDetails

### ❌ DON'T
- Don't store subscription state in local storage
- Don't hard-code prices
- Don't trust backend as source of truth
- Don't use RTDN for basic subscription checks
- Don't block UI on subscription checks

---

## Migration from Other Systems

### From Razorpay/Stripe
1. Remove server-side subscription checks
2. Remove local storage of subscription state
3. Implement `useSubscription()` hook
4. Update UI to use hook state
5. Test thoroughly with Google Play sandbox

### From Server-Side Verification
1. Keep server verification for security
2. But use client-side state for UI
3. Backend becomes a mirror, not source of truth
4. Remove polling/cron jobs

---

## Performance Considerations

### Optimization
- `getAvailablePurchases()` is fast (< 100ms typically)
- Prevent concurrent refreshes with `isRefreshing` flag
- Only refresh on mount, foreground, and after purchase
- No polling or intervals needed

### Network Usage
- Minimal network usage
- Only calls Google Play APIs (built-in caching)
- Optional backend sync (can be debounced)

---

## Security Considerations

### Client-Side
- Purchase tokens are sensitive - don't log full tokens
- Use HTTPS for all backend communication
- Validate subscription state on critical operations

### Server-Side
- Always verify purchases with Google Play API
- Store purchase tokens securely
- Implement rate limiting on verification endpoints
- Use Supabase RLS policies

---

## Future Enhancements

### Possible Additions
1. **Grace Period Handling:** Show warning before expiration
2. **Proration Display:** Show prorated amounts for upgrades
3. **Subscription History:** Show past subscriptions
4. **Family Sharing:** Support Google Play family sharing
5. **Intro Offers:** Support introductory pricing

### Not Needed (Google Play Handles)
- ❌ Renewal reminders (Google Play sends these)
- ❌ Payment retry logic (Google Play handles this)
- ❌ Billing date tracking (Google Play manages this)
- ❌ Subscription expiration checks (Google Play provides this)

---

## Summary

This implementation provides:
- ✅ Simple, reliable subscription checking
- ✅ Google Play as single source of truth
- ✅ Automatic renewal handling
- ✅ Real-time UI updates
- ✅ Comprehensive error handling
- ✅ Easy testing and debugging
- ✅ No complex backend infrastructure needed

**The app just asks: "Does this user have an active subscription?" and Google Play answers.**
