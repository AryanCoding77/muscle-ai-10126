/**
 * useSubscription Hook - Single source of truth for subscription state
 * 
 * This hook manages subscription state using client-side checks via
 * react-native-iap's getAvailablePurchases(). Google Play handles all
 * renewals and billing automatically.
 * 
 * Features:
 * - Automatic refresh on app start, foreground, and after purchase
 * - Offline support: Falls back to cached state when store is unavailable
 * - Staleness detection: Warns if cached state is older than 7 days
 * 
 * Usage:
 *   const { state, refreshSubscription } = useSubscription();
 *   
 *   if (state.loading) return <Spinner />;
 *   if (state.isSubscribed) {
 *     // Show premium features
 *   }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchActiveSubscriptions,
  getActiveSubscriptionForUser,
  ActiveSubscription,
  PlanName,
} from '../utils/subscriptionHelper';
import { checkAndResetQuotaIfNeeded } from './useQuota';
import { supabase } from '../lib/supabase';

export interface SubscriptionState {
  loading: boolean;
  isSubscribed: boolean;
  activePlan: PlanName | null;
  productId: string | null;
  purchaseToken: string | null;
  lastCheckedAt: number | null;
}

export interface UseSubscriptionReturn {
  state: SubscriptionState;
  refreshSubscription: () => Promise<void>;
}

/**
 * Cached subscription state stored in AsyncStorage
 * This is used as a fallback when the store is unavailable (offline, error, etc.)
 */
interface CachedSubscription {
  isSubscribed: boolean;
  activePlan: PlanName | null;
  productId: string | null;
  purchaseToken: string | null;
  lastCheckedAt: number;
}

const INITIAL_STATE: SubscriptionState = {
  loading: true,
  isSubscribed: false,
  activePlan: null,
  productId: null,
  purchaseToken: null,
  lastCheckedAt: null,
};

// AsyncStorage key for cached subscription state
const CACHE_KEY = 'subscription:lastKnownState';

// Staleness threshold: 7 days in milliseconds
const STALENESS_THRESHOLD = 7 * 24 * 60 * 60 * 1000;

/**
 * Load cached subscription state from AsyncStorage
 */
async function loadCachedSubscription(): Promise<CachedSubscription | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) {
      console.log('ℹ️ [loadCachedSubscription] No cached subscription found');
      return null;
    }

    const parsed: CachedSubscription = JSON.parse(cached);
    
    // Check staleness
    const age = Date.now() - parsed.lastCheckedAt;
    const isStale = age > STALENESS_THRESHOLD;
    
    if (isStale) {
      const daysOld = Math.floor(age / (24 * 60 * 60 * 1000));
      console.warn(`⚠️ [loadCachedSubscription] Cached subscription is ${daysOld} days old (stale)`);
    }
    
    console.log('✅ [loadCachedSubscription] Loaded cached subscription:', {
      isSubscribed: parsed.isSubscribed,
      activePlan: parsed.activePlan,
      lastCheckedAt: new Date(parsed.lastCheckedAt).toISOString(),
      isStale,
    });
    
    return parsed;
  } catch (error) {
    console.error('❌ [loadCachedSubscription] Error loading cached subscription:', error);
    return null;
  }
}

/**
 * Save subscription state to AsyncStorage cache
 */
async function saveCachedSubscription(subscription: CachedSubscription): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(subscription));
    console.log('✅ [saveCachedSubscription] Cached subscription saved:', {
      isSubscribed: subscription.isSubscribed,
      activePlan: subscription.activePlan,
      lastCheckedAt: new Date(subscription.lastCheckedAt).toISOString(),
    });
  } catch (error) {
    console.error('❌ [saveCachedSubscription] Error saving cached subscription:', error);
    // Don't throw - caching is optional
  }
}

/**
 * Hook for managing subscription state
 * Automatically checks on mount and when app comes to foreground
 * Falls back to cached state when store is unavailable (offline/error)
 */
export function useSubscription(): UseSubscriptionReturn {
  const [state, setState] = useState<SubscriptionState>(INITIAL_STATE);
  const appState = useRef(AppState.currentState);
  const isRefreshing = useRef(false);

  /**
   * Refresh subscription state from Google Play / App Store
   * 
   * This is the core function that:
   * 1. Calls getAvailablePurchases() via fetchActiveSubscriptions()
   * 2. Determines which subscription is active
   * 3. Updates the UI state
   * 4. Saves to cache for offline fallback
   * 5. Optionally syncs to backend as a mirror
   * 
   * Error Handling:
   * - On success: Updates state and cache with fresh data from store
   * - On error: Falls back to cached state (if available) to handle offline scenarios
   * - If no cache: Falls back to "not subscribed" (safe default)
   * 
   * Called on:
   * - App start (mount)
   * - App foreground
   * - After purchase completion
   */
  const refreshSubscription = useCallback(async () => {
    // Prevent concurrent refreshes
    if (isRefreshing.current) {
      console.log('⏳ [useSubscription] Refresh already in progress, skipping...');
      return;
    }

    try {
      isRefreshing.current = true;
      setState(prev => ({ ...prev, loading: true }));

      console.log('🔄 [useSubscription] ========================================');
      console.log('🔄 [useSubscription] Starting subscription state refresh...');
      console.log('🔄 [useSubscription] ========================================');

      // Step 1: Fetch active purchases from the store
      // This calls getAvailablePurchases() under the hood
      // NOTE: This will throw an error if offline or billing unavailable
      const subscriptions = await fetchActiveSubscriptions();

      // Step 2: Determine the active subscription
      // This filters our SKUs and picks the best one if multiple exist
      const activeSubscription = getActiveSubscriptionForUser(subscriptions);

      const now = Date.now();

      if (activeSubscription) {
        // User has an active subscription
        const newState: SubscriptionState = {
          loading: false,
          isSubscribed: true,
          activePlan: activeSubscription.planName,
          productId: activeSubscription.productId,
          purchaseToken: activeSubscription.purchaseToken,
          lastCheckedAt: now,
        };

        setState(newState);

        console.log('✅ [useSubscription] ========================================');
        console.log('✅ [useSubscription] SUBSCRIPTION ACTIVE');
        console.log('✅ [useSubscription] Plan:', activeSubscription.planName);
        console.log('✅ [useSubscription] Product ID:', activeSubscription.productId);
        console.log('✅ [useSubscription] ========================================');

        // Step 3: Check and reset quota if needed (for renewals)
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            console.log('🔄 [useSubscription] Checking quota for reset...');
            const analysesRemaining = await checkAndResetQuotaIfNeeded(
              user.id,
              activeSubscription.planName
            );
            console.log('✅ [useSubscription] Quota check complete. Remaining:', analysesRemaining);
          }
        } catch (quotaError) {
          console.error('❌ [useSubscription] Error checking quota:', quotaError);
          // Don't fail the whole refresh if quota check fails
        }

        // Step 4: Save to cache for offline fallback
        await saveCachedSubscription({
          isSubscribed: true,
          activePlan: activeSubscription.planName,
          productId: activeSubscription.productId,
          purchaseToken: activeSubscription.purchaseToken,
          lastCheckedAt: now,
        });

        // Step 5: Optionally sync with backend (as a mirror, not source of truth)
        await syncSubscriptionToBackend(activeSubscription);
      } else {
        // No active subscription
        const newState: SubscriptionState = {
          loading: false,
          isSubscribed: false,
          activePlan: null,
          productId: null,
          purchaseToken: null,
          lastCheckedAt: now,
        };

        setState(newState);

        console.log('ℹ️ [useSubscription] ========================================');
        console.log('ℹ️ [useSubscription] NO ACTIVE SUBSCRIPTION');
        console.log('ℹ️ [useSubscription] User is on free tier');
        console.log('ℹ️ [useSubscription] ========================================');

        // Save "not subscribed" state to cache
        await saveCachedSubscription({
          isSubscribed: false,
          activePlan: null,
          productId: null,
          purchaseToken: null,
          lastCheckedAt: now,
        });

        // Sync "not subscribed" state to backend
        await syncSubscriptionToBackend(null);
      }
    } catch (error) {
      console.error('❌ [useSubscription] ========================================');
      console.error('❌ [useSubscription] Store check failed, using cached subscription state');
      console.error('❌ [useSubscription] Error:', error);
      console.error('❌ [useSubscription] ========================================');

      // OFFLINE/ERROR HANDLING: Fall back to cached state
      const cached = await loadCachedSubscription();

      if (cached) {
        // Use cached state - preserve last known subscription status
        console.log('💾 [useSubscription] Using cached subscription state (offline mode)');
        setState({
          loading: false,
          isSubscribed: cached.isSubscribed,
          activePlan: cached.activePlan,
          productId: cached.productId,
          purchaseToken: cached.purchaseToken,
          lastCheckedAt: cached.lastCheckedAt,
        });
      } else {
        // No cache available - fall back to safe default (not subscribed)
        console.warn('⚠️ [useSubscription] No cached state available, falling back to "not subscribed"');
        setState({
          loading: false,
          isSubscribed: false,
          activePlan: null,
          productId: null,
          purchaseToken: null,
          lastCheckedAt: Date.now(),
        });
      }
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  /**
   * Sync subscription state to backend (optional mirror)
   * 
   * This is NOT the source of truth - it's just a mirror for:
   * - Analytics
   * - Dashboard display
   * - Safety checks
   * 
   * The app always trusts getAvailablePurchases() as the primary decision.
   */
  const syncSubscriptionToBackend = async (
    subscription: ActiveSubscription | null
  ): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('ℹ️ [syncSubscriptionToBackend] No authenticated user, skipping backend sync');
        return;
      }

      console.log('🔄 [syncSubscriptionToBackend] Syncing subscription state to backend...');

      const syncData = {
        user_id: user.id,
        is_subscribed: subscription !== null,
        product_id: subscription?.productId || null,
        plan_name: subscription?.planName || null,
        last_checked_at: new Date().toISOString(),
      };

      console.log('📊 [syncSubscriptionToBackend] Sync data:', syncData);

      // TODO: Implement backend sync endpoint if needed
      // Example: Call a Supabase Edge Function
      // const { data, error } = await supabase.functions.invoke('sync-subscription-local', {
      //   body: syncData,
      // });
      // 
      // if (error) {
      //   console.error('❌ [syncSubscriptionToBackend] Backend sync failed:', error);
      // } else {
      //   console.log('✅ [syncSubscriptionToBackend] Backend sync successful');
      // }

      console.log('✅ [syncSubscriptionToBackend] Backend sync completed (currently logging only)');
    } catch (error) {
      console.error('❌ [syncSubscriptionToBackend] Error syncing subscription to backend:', error);
      // Don't throw - backend sync is optional and should never break the app
    }
  };

  /**
   * Handle app state changes (foreground/background)
   */
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      // When app comes to foreground, refresh subscription
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App came to foreground, refreshing subscription...');
        refreshSubscription();
      }

      appState.current = nextAppState;
    },
    [refreshSubscription]
  );

  /**
   * Initialize on mount
   * 1. Load cached state first (for instant UI)
   * 2. Then perform live store check (to get fresh data)
   */
  useEffect(() => {
    const initialize = async () => {
      // Load cached state first for instant UI feedback
      const cached = await loadCachedSubscription();
      if (cached) {
        console.log('💾 [useSubscription] Initializing with cached state');
        setState({
          loading: true, // Keep loading true while we fetch fresh data
          isSubscribed: cached.isSubscribed,
          activePlan: cached.activePlan,
          productId: cached.productId,
          purchaseToken: cached.purchaseToken,
          lastCheckedAt: cached.lastCheckedAt,
        });
      }

      // Then perform live store check to get fresh data
      await refreshSubscription();
    };

    initialize();

    // Set up app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [refreshSubscription, handleAppStateChange]);

  return {
    state,
    refreshSubscription,
  };
}
