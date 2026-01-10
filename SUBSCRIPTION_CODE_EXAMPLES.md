# Subscription System - Code Examples

## Complete Examples for Common Scenarios

### 1. Basic Subscription Check

```typescript
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';

export function MyScreen() {
  const { state } = useSubscription();
  
  if (state.loading) {
    return <Text>Checking subscription...</Text>;
  }
  
  return (
    <View>
      <Text>
        Status: {state.isSubscribed ? 'Subscribed' : 'Not Subscribed'}
      </Text>
      {state.isSubscribed && (
        <Text>Plan: {state.activePlan}</Text>
      )}
    </View>
  );
}
```

### 2. Premium Feature Gate

```typescript
import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';

export function AnalyzeScreen({ navigation }) {
  const { state } = useSubscription();
  
  const handleAnalyze = () => {
    if (!state.isSubscribed) {
      Alert.alert(
        'Premium Feature',
        'Upgrade to a premium plan for unlimited analyses',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => navigation.navigate('SubscriptionPlans')
          }
        ]
      );
      return;
    }
    
    // Proceed with analysis
    performAnalysis();
  };
  
  return (
    <View>
      <Button 
        title="Analyze Photo" 
        onPress={handleAnalyze}
      />
      {!state.isSubscribed && (
        <Text style={{ color: 'gray', marginTop: 10 }}>
          Free users: 3 analyses remaining this month
        </Text>
      )}
    </View>
  );
}
```

### 3. Subscription Status Banner

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';
import { LinearGradient } from 'expo-linear-gradient';

export function SubscriptionBanner({ navigation }) {
  const { state } = useSubscription();
  
  if (state.loading) {
    return null; // Or show skeleton
  }
  
  if (state.isSubscribed) {
    // Active subscription banner
    return (
      <TouchableOpacity 
        style={styles.banner}
        onPress={() => navigation.navigate('ManageSubscription')}
      >
        <LinearGradient
          colors={['#3498DB', '#2980B9']}
          style={styles.gradient}
        >
          <Text style={styles.title}>
            {state.activePlan} Plan Active
          </Text>
          <Text style={styles.subtitle}>
            Unlimited AI-powered analyses
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  
  // Upgrade prompt banner
  return (
    <TouchableOpacity 
      style={styles.banner}
      onPress={() => navigation.navigate('SubscriptionPlans')}
    >
      <LinearGradient
        colors={['#F39C12', '#E67E22']}
        style={styles.gradient}
      >
        <Text style={styles.title}>
          Upgrade to Premium
        </Text>
        <Text style={styles.subtitle}>
          Unlock unlimited AI analyses
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
```

### 4. Plan-Specific Features

```typescript
import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';

export function FeaturesList() {
  const { state } = useSubscription();
  
  const getFeatures = () => {
    if (!state.isSubscribed) {
      return [
        { id: '1', text: '3 analyses per month', available: true },
        { id: '2', text: 'Basic insights', available: true },
        { id: '3', text: 'Advanced analytics', available: false },
        { id: '4', text: 'Progress tracking', available: false },
      ];
    }
    
    const allFeatures = [
      { id: '1', text: 'Unlimited analyses', available: true },
      { id: '2', text: 'Basic insights', available: true },
      { id: '3', text: 'Advanced analytics', available: true },
      { id: '4', text: 'Progress tracking', available: true },
    ];
    
    // VIP-only features
    if (state.activePlan === 'VIP') {
      allFeatures.push(
        { id: '5', text: 'Priority support', available: true },
        { id: '6', text: 'Custom workout plans', available: true }
      );
    }
    
    return allFeatures;
  };
  
  const features = getFeatures();
  
  return (
    <FlatList
      data={features}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ 
          flexDirection: 'row', 
          padding: 10,
          opacity: item.available ? 1 : 0.5 
        }}>
          <Text style={{ marginRight: 10 }}>
            {item.available ? '✓' : '✗'}
          </Text>
          <Text>{item.text}</Text>
        </View>
      )}
    />
  );
}
```

### 5. Usage Limit Display

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';

export function UsageLimitCard({ analysesUsed }: { analysesUsed: number }) {
  const { state } = useSubscription();
  
  if (state.isSubscribed) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Unlimited Access</Text>
        <Text style={styles.subtitle}>
          {state.activePlan} Plan • No limits
        </Text>
      </View>
    );
  }
  
  const limit = 3;
  const remaining = Math.max(0, limit - analysesUsed);
  const percentage = (remaining / limit) * 100;
  
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {remaining} of {limit} analyses remaining
      </Text>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${percentage}%` }
          ]} 
        />
      </View>
      <Text style={styles.subtitle}>
        Upgrade for unlimited analyses
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
});
```

### 6. Conditional Navigation

```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSubscription } from '../hooks/useSubscription';

const Stack = createStackNavigator();

export function AppNavigator() {
  const { state } = useSubscription();
  
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Analyze" component={AnalyzeScreen} />
      
      {/* VIP-only screens */}
      {state.activePlan === 'VIP' && (
        <>
          <Stack.Screen name="CustomWorkouts" component={CustomWorkoutsScreen} />
          <Stack.Screen name="PrioritySupport" component={PrioritySupportScreen} />
        </>
      )}
      
      {/* Show upgrade screen for non-subscribers */}
      {!state.isSubscribed && (
        <Stack.Screen name="Upgrade" component={UpgradeScreen} />
      )}
    </Stack.Navigator>
  );
}
```

### 7. Pull to Refresh Subscription

```typescript
import React, { useState } from 'react';
import { ScrollView, RefreshControl, View, Text } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';

export function ProfileScreen() {
  const { state, refreshSubscription } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSubscription();
    setRefreshing(false);
  };
  
  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <View>
        <Text>Subscription Status: {state.isSubscribed ? 'Active' : 'Inactive'}</Text>
        {state.isSubscribed && (
          <Text>Plan: {state.activePlan}</Text>
        )}
      </View>
    </ScrollView>
  );
}
```

### 8. Subscription Badge Component

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';

export function SubscriptionBadge() {
  const { state } = useSubscription();
  
  if (!state.isSubscribed) {
    return null;
  }
  
  const getBadgeColor = () => {
    switch (state.activePlan) {
      case 'VIP':
        return '#FFD700'; // Gold
      case 'Pro':
        return '#9B59B6'; // Purple
      case 'Basic':
        return '#3498DB'; // Blue
      default:
        return '#95A5A6'; // Gray
    }
  };
  
  return (
    <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
      <Text style={styles.badgeText}>
        {state.activePlan?.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
```

### 9. Settings Screen Integration

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';

export function SettingsScreen({ navigation }) {
  const { state } = useSubscription();
  
  return (
    <View style={styles.container}>
      {/* Subscription Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        
        {state.isSubscribed ? (
          <>
            <TouchableOpacity 
              style={styles.row}
              onPress={() => navigation.navigate('ManageSubscription')}
            >
              <Text style={styles.rowLabel}>Current Plan</Text>
              <Text style={styles.rowValue}>{state.activePlan}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.row}
              onPress={() => navigation.navigate('SubscriptionPlans')}
            >
              <Text style={styles.rowLabel}>Change Plan</Text>
              <Text style={styles.rowValue}>→</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <Text style={styles.upgradeButtonText}>
              Upgrade to Premium
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Other settings... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  rowLabel: {
    fontSize: 16,
    color: '#FFF',
  },
  rowValue: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  upgradeButton: {
    backgroundColor: '#F39C12',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
```

### 10. Analytics Integration

```typescript
import { useEffect } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import Analytics from '@react-native-firebase/analytics'; // or your analytics library

export function useSubscriptionAnalytics() {
  const { state } = useSubscription();
  
  useEffect(() => {
    if (!state.loading) {
      // Track subscription status
      Analytics().setUserProperty('subscription_status', 
        state.isSubscribed ? 'subscribed' : 'free'
      );
      
      if (state.isSubscribed && state.activePlan) {
        Analytics().setUserProperty('subscription_plan', state.activePlan);
      }
      
      // Log event
      Analytics().logEvent('subscription_check', {
        is_subscribed: state.isSubscribed,
        plan: state.activePlan || 'none',
      });
    }
  }, [state.isSubscribed, state.activePlan, state.loading]);
}

// Usage in App.tsx or root component
export function App() {
  useSubscriptionAnalytics();
  
  return <AppNavigator />;
}
```

### 11. Custom Hook for Feature Access

```typescript
import { useSubscription } from '../hooks/useSubscription';

export function useFeatureAccess() {
  const { state } = useSubscription();
  
  return {
    canAnalyze: state.isSubscribed || state.loading, // Allow during loading
    canExport: state.isSubscribed,
    canCompare: state.isSubscribed,
    canAccessAdvancedStats: state.activePlan === 'Pro' || state.activePlan === 'VIP',
    canAccessCustomWorkouts: state.activePlan === 'VIP',
    canAccessPrioritySupport: state.activePlan === 'VIP',
    analysisLimit: state.isSubscribed ? Infinity : 3,
    planName: state.activePlan || 'Free',
  };
}

// Usage
export function FeatureScreen() {
  const features = useFeatureAccess();
  
  return (
    <View>
      {features.canExport ? (
        <Button title="Export Data" onPress={exportData} />
      ) : (
        <Button title="Upgrade to Export" onPress={showUpgrade} />
      )}
    </View>
  );
}
```

### 12. Subscription Loading Skeleton

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';

export function SubscriptionCard() {
  const { state } = useSubscription();
  
  if (state.loading) {
    return (
      <View style={styles.skeleton}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '60%' }]} />
      </View>
    );
  }
  
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {state.isSubscribed ? `${state.activePlan} Plan` : 'Free Plan'}
      </Text>
      <Text style={styles.subtitle}>
        {state.isSubscribed ? 'Unlimited access' : 'Limited features'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  card: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
});
```

## Testing Examples

### Mock Subscription State for Testing

```typescript
// For unit tests
import { renderHook } from '@testing-library/react-hooks';
import { useSubscription } from '../hooks/useSubscription';

jest.mock('../hooks/useSubscription');

describe('MyComponent', () => {
  it('shows premium features for subscribed users', () => {
    (useSubscription as jest.Mock).mockReturnValue({
      state: {
        loading: false,
        isSubscribed: true,
        activePlan: 'Pro',
        productId: 'muscleai.pro.monthly',
        purchaseToken: 'test-token',
        lastCheckedAt: Date.now(),
      },
      refreshSubscription: jest.fn(),
    });
    
    // Your test assertions...
  });
});
```

### Debug Component

```typescript
// Add this to your app during development
export function SubscriptionDebug() {
  const { state, refreshSubscription } = useSubscription();
  
  if (__DEV__) {
    return (
      <View style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
      }}>
        <Text style={{ color: '#FFF', fontSize: 10 }}>
          Subscription Debug:
        </Text>
        <Text style={{ color: '#FFF', fontSize: 10 }}>
          Loading: {state.loading ? 'Yes' : 'No'}
        </Text>
        <Text style={{ color: '#FFF', fontSize: 10 }}>
          Subscribed: {state.isSubscribed ? 'Yes' : 'No'}
        </Text>
        <Text style={{ color: '#FFF', fontSize: 10 }}>
          Plan: {state.activePlan || 'None'}
        </Text>
        <TouchableOpacity 
          onPress={refreshSubscription}
          style={{ marginTop: 5, padding: 5, backgroundColor: '#007AFF' }}
        >
          <Text style={{ color: '#FFF', fontSize: 10 }}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return null;
}
```

## Summary

These examples cover the most common use cases for the subscription system. The key pattern is:

1. Import `useSubscription` hook
2. Destructure `state` and optionally `refreshSubscription`
3. Check `state.loading` first
4. Check `state.isSubscribed` for access control
5. Use `state.activePlan` for plan-specific features

All screens and components should use this single source of truth for consistency.
