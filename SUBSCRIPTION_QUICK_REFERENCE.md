# Subscription System - Quick Reference

## TL;DR
Google Play handles renewals. App checks "is user subscribed?" via `getAvailablePurchases()`. That's it.

---

## Usage in Components

### Check Subscription Status
```typescript
import { useSubscription } from '../hooks/useSubscription';

const MyComponent = () => {
  const { state } = useSubscription();
  
  if (state.loading) {
    return <Spinner />;
  }
  
  if (state.isSubscribed) {
    // User has active subscription
    console.log('Active plan:', state.activePlan); // "Basic" | "Pro" | "VIP"
  } else {
    // User is on free tier
  }
};
```

### Refresh After Purchase
```typescript
import { useSubscription } from '../hooks/useSubscription';

const PaymentScreen = () => {
  const { refreshSubscription } = useSubscription();
  
  const handlePurchaseComplete = async () => {
    // After purchase completes
    await refreshSubscription();
  };
};
```

---

## State Properties

```typescript
state.loading: boolean           // Is subscription check in progress?
state.isSubscribed: boolean      // Does user have active subscription?
state.activePlan: string | null  // "Basic" | "Pro" | "VIP" | null
state.productId: string | null   // e.g., "muscleai.pro.monthly"
state.purchaseToken: string | null
state.lastCheckedAt: number | null
```

---

## When Subscription Refreshes

1. **App Start** - Automatic on mount
2. **App Foreground** - When user returns to app
3. **After Purchase** - Via callback in useBilling

---

## Product IDs

```typescript
Basic: "muscleai.basic.monthly"
Pro:   "muscleai.pro.monthly"
VIP:   "muscleai.vip.monthly"
```

---

## Console Logs to Watch

### Successful Subscription Check
```
✅ [fetchActiveSubscriptions] Found 1 active purchase(s)
✅ [getActiveSubscriptionForUser] Active subscription determined
✅ [useSubscription] SUBSCRIPTION ACTIVE
✅ [useSubscription] Plan: Pro
```

### No Subscription
```
✅ [fetchActiveSubscriptions] Found 0 active purchase(s)
ℹ️ [useSubscription] NO ACTIVE SUBSCRIPTION
```

### Error
```
❌ [fetchActiveSubscriptions] Error fetching active subscriptions
❌ [useSubscription] Error refreshing subscription
```

---

## Common Patterns

### Show Paywall for Free Users
```typescript
const { state } = useSubscription();

if (!state.isSubscribed) {
  return <PaywallScreen />;
}

return <PremiumFeature />;
```

### Disable Current Plan
```typescript
const { state } = useSubscription();

const isCurrentPlan = state.activePlan === plan.plan_name;

<Button disabled={isCurrentPlan}>
  {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
</Button>
```

### Show Plan Badge
```typescript
const { state } = useSubscription();

{state.isSubscribed && (
  <Badge>{state.activePlan?.toUpperCase()}</Badge>
)}
```

### Gate Premium Features
```typescript
const { state } = useSubscription();

const canUseFeature = state.isSubscribed;

if (!canUseFeature) {
  Alert.alert('Premium Feature', 'Upgrade to access this feature');
  return;
}

// Use feature
```

---

## Testing Commands

### Check Current State
```typescript
const { state } = useSubscription();
console.log('Current subscription state:', state);
```

### Force Refresh
```typescript
const { refreshSubscription } = useSubscription();
await refreshSubscription();
```

### Check Billing Diagnostics
```typescript
const { diagnostics } = useBilling();
console.log('Billing diagnostics:', diagnostics);
```

---

## Troubleshooting

### Subscription not detected?
1. Check console logs for errors
2. Verify product IDs match Google Play Console
3. Ensure app installed from Play Store
4. Call `refreshSubscription()` manually

### Prices not showing?
1. Check `diagnostics.productsCount` (should be 3)
2. Verify `diagnostics.initialized` is true
3. Check `diagnostics.installerIsPlayStore` is true

### Purchase not working?
1. Check `diagnostics.subscriptionsSupported` is true
2. Verify test account is added to Play Console
3. Check for `basePlanId` and `offerToken` in logs

---

## Files to Know

```
src/hooks/useSubscription.ts          - Main hook
src/utils/subscriptionHelper.ts       - Helper functions
src/hooks/useBilling.ts               - Purchase flow
src/screens/ProfileScreen.tsx         - Example usage
src/screens/SubscriptionPlansScreen.tsx - Example usage
```

---

## Important Notes

- ✅ Google Play is the source of truth
- ✅ No local storage needed
- ✅ No RTDN needed for basic checks
- ✅ Backend is optional mirror only
- ✅ Prices from Google Play (never hard-coded)
- ✅ Auto-refresh on foreground
- ✅ Fail-safe to free tier on errors

---

## Need More Details?

- Full implementation: `SUBSCRIPTION_CLIENT_SIDE_IMPLEMENTATION.md`
- Testing checklist: `SUBSCRIPTION_CLIENT_SIDE_TESTING_CHECKLIST.md`
- System overview: `SUBSCRIPTION_SYSTEM_README.md`
