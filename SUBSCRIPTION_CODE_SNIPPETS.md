# Subscription System - Code Snippets

## Common Use Cases with Copy-Paste Code

---

## 1. Basic Subscription Check

```typescript
import { useSubscription } from '../hooks/useSubscription';

const MyComponent = () => {
  const { state } = useSubscription();
  
  if (state.loading) {
    return <ActivityIndicator />;
  }
  
  return (
    <View>
      {state.isSubscribed ? (
        <Text>Welcome, {state.activePlan} member! 🎉</Text>
      ) : (
        <Text>You're on the free plan</Text>
      )}
    </View>
  );
};
```

---

## 2. Show Upgrade Banner for Free Users

```typescript
import { useSubscription } from '../hooks/useSubscription';

const UpgradeBanner = ({ navigation }) => {
  const { state } = useSubscription();
  
  if (state.isSubscribed) {
    return null; // Don't show banner for subscribed users
  }
  
  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={() => navigation.navigate('SubscriptionPlans')}
    >
      <Text style={styles.bannerTitle}>Upgrade to Premium</Text>
      <Text style={styles.bannerSubtitle}>Unlock unlimited analyses</Text>
    </TouchableOpacity>
  );
};
```

---

## 3. Show Active Plan Badge

```typescript
import { useSubscription } from '../hooks/useSubscription';

const PlanBadge = () => {
  const { state } = useSubscription();
  
  if (!state.isSubscribed || !state.activePlan) {
    return null;
  }
  
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {state.activePlan.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
```

---

## 4. Gate Premium Feature

```typescript
import { useSubscription } from '../hooks/useSubscription';
import { Alert } from 'react-native';

const PremiumFeatureScreen = () => {
  const { state } = useSubscription();
  
  const handlePremiumAction = () => {
    if (!state.isSubscribed) {
      Alert.alert(
        'Premium Feature',
        'This feature is only available for premium members. Upgrade now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => navigation.navigate('SubscriptionPlans') 
          },
        ]
      );
      return;
    }
    
    // Perform premium action
    performPremiumAction();
  };
  
  return (
    <TouchableOpacity onPress={handlePremiumAction}>
      <Text>Use Premium Feature</Text>
    </TouchableOpacity>
  );
};
```

---

## 5. Show Different UI Based on Plan

```typescript
import { useSubscription } from '../hooks/useSubscription';

const AnalysisLimitDisplay = () => {
  const { state } = useSubscription();
  
  if (state.loading) {
    return <ActivityIndicator />;
  }
  
  if (state.isSubscribed) {
    return (
      <View style={styles.limitContainer}>
        <Text style={styles.limitText}>Unlimited Analyses</Text>
        <Text style={styles.planText}>{state.activePlan} Plan</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.limitContainer}>
      <Text style={styles.limitText}>5 Analyses Remaining</Text>
      <TouchableOpacity onPress={() => navigation.navigate('SubscriptionPlans')}>
        <Text style={styles.upgradeLink}>Upgrade for unlimited</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## 6. Disable Current Plan in Plans List

```typescript
import { useSubscription } from '../hooks/useSubscription';

const PlanCard = ({ plan, onSelect }) => {
  const { state } = useSubscription();
  
  const isCurrentPlan = state.activePlan === plan.plan_name;
  
  return (
    <View style={styles.planCard}>
      {isCurrentPlan && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
        </View>
      )}
      
      <Text style={styles.planName}>{plan.plan_name}</Text>
      <Text style={styles.planPrice}>{plan.price}</Text>
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          isCurrentPlan && styles.selectButtonDisabled
        ]}
        onPress={() => onSelect(plan)}
        disabled={isCurrentPlan}
      >
        <Text style={styles.selectButtonText}>
          {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## 7. Refresh Subscription After Purchase

```typescript
import { useSubscription } from '../hooks/useSubscription';
import { useBilling } from '../hooks/useBilling';

const PaymentScreen = () => {
  const { refreshSubscription } = useSubscription();
  const { setOnPurchaseComplete } = useBilling();
  
  // Set up callback to refresh subscription after purchase
  useEffect(() => {
    setOnPurchaseComplete(() => {
      console.log('Purchase complete, refreshing subscription...');
      refreshSubscription();
    });
  }, [setOnPurchaseComplete, refreshSubscription]);
  
  return (
    <View>
      {/* Payment UI */}
    </View>
  );
};
```

---

## 8. Show Loading State During Check

```typescript
import { useSubscription } from '../hooks/useSubscription';

const SubscriptionStatus = () => {
  const { state } = useSubscription();
  
  if (state.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Checking subscription...</Text>
      </View>
    );
  }
  
  return (
    <View>
      <Text>Status: {state.isSubscribed ? 'Active' : 'Inactive'}</Text>
      {state.activePlan && <Text>Plan: {state.activePlan}</Text>}
    </View>
  );
};
```

---

## 9. Manual Refresh Button

```typescript
import { useSubscription } from '../hooks/useSubscription';

const RefreshButton = () => {
  const { state, refreshSubscription } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSubscription();
    setRefreshing(false);
  };
  
  return (
    <TouchableOpacity
      style={styles.refreshButton}
      onPress={handleRefresh}
      disabled={state.loading || refreshing}
    >
      {refreshing ? (
        <ActivityIndicator size="small" color="#FFF" />
      ) : (
        <Text style={styles.refreshText}>Refresh Subscription</Text>
      )}
    </TouchableOpacity>
  );
};
```

---

## 10. Conditional Navigation Based on Subscription

```typescript
import { useSubscription } from '../hooks/useSubscription';

const NavigationHandler = ({ navigation }) => {
  const { state } = useSubscription();
  
  const navigateToPremiumFeature = () => {
    if (!state.isSubscribed) {
      // Redirect to subscription plans
      navigation.navigate('SubscriptionPlans');
      return;
    }
    
    // Navigate to premium feature
    navigation.navigate('PremiumFeature');
  };
  
  return (
    <TouchableOpacity onPress={navigateToPremiumFeature}>
      <Text>Access Premium Feature</Text>
    </TouchableOpacity>
  );
};
```

---

## 11. Show Subscription Expiry Warning (Future Enhancement)

```typescript
import { useSubscription } from '../hooks/useSubscription';

const ExpiryWarning = () => {
  const { state } = useSubscription();
  
  // Note: This is a future enhancement
  // Currently, Google Play handles all expiry notifications
  // This is just an example of how you might implement it
  
  if (!state.isSubscribed) {
    return null;
  }
  
  // Calculate days until expiry (would need additional data)
  const daysUntilExpiry = 3; // Example
  
  if (daysUntilExpiry <= 7) {
    return (
      <View style={styles.warningBanner}>
        <Text style={styles.warningText}>
          Your subscription expires in {daysUntilExpiry} days
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('ManageSubscription')}>
          <Text style={styles.warningLink}>Manage</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return null;
};
```

---

## 12. Analytics Tracking

```typescript
import { useSubscription } from '../hooks/useSubscription';
import { useEffect } from 'react';

const AnalyticsTracker = () => {
  const { state } = useSubscription();
  
  useEffect(() => {
    if (!state.loading) {
      // Track subscription status in analytics
      analytics.setUserProperty('is_subscribed', state.isSubscribed);
      
      if (state.isSubscribed && state.activePlan) {
        analytics.setUserProperty('subscription_plan', state.activePlan);
      }
    }
  }, [state.loading, state.isSubscribed, state.activePlan]);
  
  return null;
};
```

---

## 13. Feature Flag Based on Plan

```typescript
import { useSubscription } from '../hooks/useSubscription';

const useFeatureAccess = () => {
  const { state } = useSubscription();
  
  const hasFeature = (featureName: string): boolean => {
    if (!state.isSubscribed) {
      return false; // Free tier has no premium features
    }
    
    // Define feature access per plan
    const featureAccess = {
      'unlimited_analyses': ['Basic', 'Pro', 'VIP'],
      'advanced_metrics': ['Pro', 'VIP'],
      'export_data': ['Pro', 'VIP'],
      'priority_support': ['VIP'],
    };
    
    const allowedPlans = featureAccess[featureName] || [];
    return state.activePlan ? allowedPlans.includes(state.activePlan) : false;
  };
  
  return { hasFeature };
};

// Usage
const MyComponent = () => {
  const { hasFeature } = useFeatureAccess();
  
  if (hasFeature('advanced_metrics')) {
    return <AdvancedMetricsView />;
  }
  
  return <BasicMetricsView />;
};
```

---

## 14. Subscription Status Card

```typescript
import { useSubscription } from '../hooks/useSubscription';

const SubscriptionStatusCard = ({ navigation }) => {
  const { state } = useSubscription();
  
  if (state.loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator />
      </View>
    );
  }
  
  if (state.isSubscribed) {
    return (
      <View style={[styles.card, styles.activeCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Active Subscription</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{state.activePlan}</Text>
          </View>
        </View>
        <Text style={styles.cardDescription}>
          Unlimited AI-powered analyses
        </Text>
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => navigation.navigate('ManageSubscription')}
        >
          <Text style={styles.manageButtonText}>Manage Subscription</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={[styles.card, styles.inactiveCard]}>
      <Text style={styles.cardTitle}>Free Plan</Text>
      <Text style={styles.cardDescription}>
        5 analyses per month
      </Text>
      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={() => navigation.navigate('SubscriptionPlans')}
      >
        <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## 15. Debug Panel (Development Only)

```typescript
import { useSubscription } from '../hooks/useSubscription';
import { useBilling } from '../hooks/useBilling';

const DebugPanel = () => {
  const { state, refreshSubscription } = useSubscription();
  const { diagnostics } = useBilling();
  
  if (__DEV__) {
    return (
      <View style={styles.debugPanel}>
        <Text style={styles.debugTitle}>🔍 Debug Info</Text>
        
        <Text style={styles.debugLabel}>Subscription State:</Text>
        <Text style={styles.debugValue}>
          {JSON.stringify(state, null, 2)}
        </Text>
        
        <Text style={styles.debugLabel}>Billing Diagnostics:</Text>
        <Text style={styles.debugValue}>
          {JSON.stringify(diagnostics, null, 2)}
        </Text>
        
        <TouchableOpacity
          style={styles.debugButton}
          onPress={refreshSubscription}
        >
          <Text style={styles.debugButtonText}>Force Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return null;
};
```

---

## Common Styles

```typescript
const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  
  // Badges
  badge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Buttons
  upgradeButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Cards
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: '#2ECC71',
  },
  inactiveCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});
```

---

## TypeScript Types

```typescript
// Import types
import { SubscriptionState, UseSubscriptionReturn } from '../hooks/useSubscription';
import { PlanName, ActiveSubscription } from '../utils/subscriptionHelper';

// Use in components
const MyComponent: React.FC = () => {
  const { state }: UseSubscriptionReturn = useSubscription();
  
  const planName: PlanName | null = state.activePlan;
  const isSubscribed: boolean = state.isSubscribed;
  
  // ...
};
```

---

## Testing Helpers

```typescript
// Mock subscription state for testing
const mockSubscriptionState = {
  loading: false,
  isSubscribed: true,
  activePlan: 'Pro' as PlanName,
  productId: 'muscleai.pro.monthly',
  purchaseToken: 'mock-token',
  lastCheckedAt: Date.now(),
};

// Mock hook for tests
jest.mock('../hooks/useSubscription', () => ({
  useSubscription: () => ({
    state: mockSubscriptionState,
    refreshSubscription: jest.fn(),
  }),
}));
```

---

## Quick Tips

1. **Always check `state.loading`** before showing subscription-dependent UI
2. **Use `state.isSubscribed`** for boolean checks (not `state.activePlan`)
3. **Call `refreshSubscription()`** after purchases or when needed
4. **Don't store subscription state** in local storage (always fetch fresh)
5. **Handle errors gracefully** - fail-safe to free tier
6. **Log important events** for debugging
7. **Test with Google Play sandbox** accounts

---

## Need More Help?

- Full implementation: `SUBSCRIPTION_CLIENT_SIDE_IMPLEMENTATION.md`
- Testing checklist: `SUBSCRIPTION_CLIENT_SIDE_TESTING_CHECKLIST.md`
- Quick reference: `SUBSCRIPTION_QUICK_REFERENCE.md`
