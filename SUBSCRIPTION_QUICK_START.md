# Subscription System - Quick Start Guide

## TL;DR

Your app now has a simple client-side subscription system. Use the `useSubscription` hook anywhere you need to check if a user is subscribed.

```typescript
import { useSubscription } from '../hooks/useSubscription';

function MyComponent() {
  const { state } = useSubscription();
  
  if (state.isSubscribed) {
    // User has active subscription
    console.log(`User has ${state.activePlan} plan`);
  } else {
    // User is not subscribed
    console.log('Show upgrade prompt');
  }
}
```

## How It Works

1. **Google Play is the source of truth** - All renewals handled automatically
2. **App checks subscription status** - Uses `getAvailablePurchases()` from react-native-iap
3. **Auto-refreshes** - On app start, foreground, and after purchase
4. **Single source of truth** - `useSubscription` hook used everywhere

## Common Use Cases

### Check if User is Subscribed

```typescript
const { state } = useSubscription();

if (state.isSubscribed) {
  // Allow premium feature
} else {
  // Show paywall
}
```

### Show Current Plan

```typescript
const { state } = useSubscription();

return (
  <Text>
    {state.isSubscribed 
      ? `You have ${state.activePlan} plan` 
      : 'No active subscription'}
  </Text>
);
```

### Gate Premium Features

```typescript
function PremiumFeature() {
  const { state } = useSubscription();
  
  if (!state.isSubscribed) {
    return <UpgradePrompt />;
  }
  
  return <PremiumContent />;
}
```

### Manual Refresh

```typescript
const { refreshSubscription } = useSubscription();

// After a purchase or user action
await refreshSubscription();
```

### Show Loading State

```typescript
const { state } = useSubscription();

if (state.loading) {
  return <Spinner />;
}

return <Content />;
```

## Subscription State

```typescript
{
  loading: boolean;           // True while checking subscription
  isSubscribed: boolean;       // True if user has active subscription
  activePlan: 'Basic' | 'Pro' | 'VIP' | null;  // Current plan name
  productId: string | null;    // Google Play product ID
  purchaseToken: string | null; // Purchase token
  lastCheckedAt: number | null; // Timestamp of last check
}
```

## Product IDs

```typescript
SUBSCRIPTION_SKUS = {
  BASIC: 'muscleai.basic.monthly',
  PRO: 'muscleai.pro.monthly',
  VIP: 'muscleai.vip.monthly',
}
```

## When Subscription is Checked

1. **App start** - Automatically on mount
2. **Foreground** - When app comes from background
3. **After purchase** - Immediately after successful purchase
4. **Manual** - When you call `refreshSubscription()`

## Testing

### Test Account Setup
1. Add test account to License Testing in Play Console
2. Install app from Internal Testing track
3. Use test account to purchase subscriptions

### Test Scenarios
- ✅ Purchase Basic plan → Should show "BASIC" badge
- ✅ Restart app → Subscription should persist
- ✅ Upgrade to Pro → Should show "PRO" badge
- ✅ Cancel subscription → Should remove badge
- ✅ Re-subscribe → Should detect immediately

### Console Logs
Look for these logs to verify it's working:
```
🔍 Fetching active purchases from store...
✅ Found 1 active purchase(s)
✅ Active subscription found: Pro
```

## Troubleshooting

### Subscription not detected after purchase
1. Check console for errors
2. Verify product IDs match exactly
3. Try force-closing and reopening app
4. Check Google Play Console shows active subscription

### Subscription still shows after cancellation
1. In sandbox, cancellation is immediate
2. Clear app data and reinstall
3. Verify correct test account

### State not updating
1. Check console logs for errors
2. Verify `getAvailablePurchases()` is being called
3. Check billing service is initialized

## Files Modified

- ✅ `src/utils/subscriptionHelper.ts` - Helper functions (NEW)
- ✅ `src/hooks/useSubscription.ts` - Subscription hook (NEW)
- ✅ `src/hooks/useBilling.ts` - Added purchase complete callback
- ✅ `src/screens/ProfileScreen.tsx` - Uses subscription hook
- ✅ `src/screens/SubscriptionPlansScreen.tsx` - Uses subscription hook
- ✅ `src/screens/GooglePlayPaymentScreen.tsx` - Triggers refresh after purchase

## What Changed

### Before
- Subscription state stored in Supabase
- Backend checked subscription status
- Complex renewal logic
- RTDN webhooks needed

### After
- Google Play is source of truth
- Client-side subscription check
- Auto-renewal handled by Google
- No webhooks needed

## Best Practices

### ✅ Do
```typescript
// Use the hook
const { state } = useSubscription();

// Check subscription status
if (state.isSubscribed) { ... }

// Show loading state
if (state.loading) { return <Spinner />; }
```

### ❌ Don't
```typescript
// Don't store in AsyncStorage
AsyncStorage.setItem('isSubscribed', 'true'); // ❌

// Don't check on every render
useEffect(() => {
  refreshSubscription(); // ❌ Too frequent
}, []);

// Don't ignore loading state
if (state.isSubscribed) { ... } // ❌ What if loading?
```

## Advanced Usage

### Plan-Specific Features

```typescript
const { state } = useSubscription();

const analysisLimit = {
  Basic: 10,
  Pro: 50,
  VIP: Infinity,
}[state.activePlan || 'Basic'];
```

### Conditional Rendering

```typescript
const { state } = useSubscription();

return (
  <>
    {state.activePlan === 'VIP' && <VIPFeature />}
    {state.activePlan === 'Pro' && <ProFeature />}
    {!state.isSubscribed && <FreeFeature />}
  </>
);
```

### Custom Refresh Logic

```typescript
const { refreshSubscription } = useSubscription();

// Refresh on pull-to-refresh
const onRefresh = async () => {
  setRefreshing(true);
  await refreshSubscription();
  setRefreshing(false);
};
```

## Need Help?

1. Check console logs for detailed debugging info
2. Review `SUBSCRIPTION_CLIENT_SIDE_TESTING.md` for testing checklist
3. Review `SUBSCRIPTION_CLIENT_SIDE_IMPLEMENTATION.md` for architecture details
4. Check react-native-iap docs: https://react-native-iap.dooboolab.com/

## Summary

You now have a simple, reliable subscription system that:
- ✅ Uses Google Play as source of truth
- ✅ Auto-refreshes on app start and foreground
- ✅ Updates immediately after purchase
- ✅ Provides single source of truth via hook
- ✅ No complex server-side logic needed

Just use `useSubscription()` hook anywhere you need subscription state!
