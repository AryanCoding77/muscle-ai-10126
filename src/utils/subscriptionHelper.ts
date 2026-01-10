/**
 * Subscription Helper - Client-side subscription state management
 * Uses react-native-iap v14 getAvailablePurchases() to check active subscriptions
 */

import { getAvailablePurchases, Purchase } from 'react-native-iap';
import { Platform } from 'react-native';
import { PlanName } from '../constants/subscriptionPlans';

// Subscription SKUs - must match Google Play Console product IDs
export const SUBSCRIPTION_SKUS = {
  BASIC: 'muscleai.basic.monthly',
  PRO: 'muscleai.pro.monthly',
  VIP: 'muscleai.vip.monthly',
} as const;

export interface NormalizedPurchase {
  productId: string;
  purchaseToken: string;
  transactionDate: number; // milliseconds
  platform: 'android' | 'ios';
}

export interface ActiveSubscription {
  productId: string;
  planName: PlanName;
  purchaseToken: string;
  transactionDate: number;
}

/**
 * Fetch all active purchases/subscriptions from Google Play or App Store
 * 
 * API USED: getAvailablePurchases() from react-native-iap v14
 * Documentation: https://react-native-iap.dooboolab.com/docs/api-reference/functions/getAvailablePurchases
 * 
 * This is the CORRECT and RECOMMENDED method for react-native-iap v14:
 * - For Android: Returns all active subscriptions (auto-renewing and not yet expired)
 * - For iOS: Returns all non-consumed purchases and active subscriptions
 * - Returns Purchase[] with fields: productId, transactionId, transactionDate, transactionReceipt, purchaseToken
 * 
 * Alternative methods NOT used:
 * - getPurchaseHistory(): Returns ALL purchases (including expired/cancelled) - not suitable for active status
 * - getSubscriptions(): Deprecated in v14, use getAvailablePurchases() instead
 * 
 * This is the single source of truth for subscription status.
 * Google Play handles all renewals and billing dates automatically.
 * 
 * @throws Error if billing is not initialized or network/store error occurs
 * @returns Promise<NormalizedPurchase[]> - Array of active purchases, empty if none found
 */
export async function fetchActiveSubscriptions(): Promise<NormalizedPurchase[]> {
  try {
    console.log('🔍 [fetchActiveSubscriptions] Fetching active purchases from store...');
    
    // getAvailablePurchases() is the recommended method for checking subscription status in v14
    // It returns purchases that are:
    // - Active (not expired)
    // - Acknowledged (for Android)
    // - Not refunded
    // - Not cancelled (or still in grace period)
    const purchases = await getAvailablePurchases();
    
    console.log(`✅ [fetchActiveSubscriptions] Found ${purchases.length} active purchase(s)`);
    
    if (purchases.length === 0) {
      console.log('ℹ️ [fetchActiveSubscriptions] No active purchases found - user is not subscribed');
      return [];
    }
    
    // Normalize the purchases to a consistent format
    const normalized: NormalizedPurchase[] = purchases.map((purchase: Purchase) => {
      // transactionDate is in milliseconds (number) or ISO string depending on platform
      const transactionDate = purchase.transactionDate 
        ? (typeof purchase.transactionDate === 'number' 
            ? purchase.transactionDate 
            : new Date(purchase.transactionDate).getTime())
        : Date.now();
      
      return {
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken || '',
        transactionDate,
        platform: Platform.OS as 'android' | 'ios',
      };
    });
    
    // Log each purchase for debugging (once per app start)
    console.log('📊 [fetchActiveSubscriptions] Active purchases details:');
    normalized.forEach((purchase, index) => {
      console.log(`  📦 Purchase ${index + 1}:`, {
        productId: purchase.productId,
        transactionDate: new Date(purchase.transactionDate).toISOString(),
        platform: purchase.platform,
        hasToken: !!purchase.purchaseToken,
      });
    });
    
    return normalized;
  } catch (error: any) {
    console.error('❌ [fetchActiveSubscriptions] Error fetching active subscriptions:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    
    // Re-throw the error so the caller can handle it (e.g., use cached state)
    // Don't silently return empty array - let the hook decide what to do
    throw error;
  }
}

/**
 * Map product ID to plan name
 */
export function getProductIdToPlanName(productId: string): PlanName | null {
  switch (productId) {
    case SUBSCRIPTION_SKUS.BASIC:
      return 'Basic';
    case SUBSCRIPTION_SKUS.PRO:
      return 'Pro';
    case SUBSCRIPTION_SKUS.VIP:
      return 'VIP';
    default:
      return null;
  }
}

/**
 * Get the active subscription for the user
 * 
 * This function:
 * 1. Filters only our subscription SKUs (Basic/Pro/VIP)
 * 2. If multiple subscriptions exist, picks the "best" one (latest transaction date)
 * 3. Returns the active subscription or null if none found
 * 
 * This is a pure function with no side effects.
 */
export function getActiveSubscriptionForUser(
  subscriptions: NormalizedPurchase[]
): ActiveSubscription | null {
  console.log(`🔍 [getActiveSubscriptionForUser] Checking ${subscriptions.length} purchase(s) for valid subscriptions...`);
  
  // Filter only our subscription SKUs
  const validSubscriptions = subscriptions.filter(sub => {
    const planName = getProductIdToPlanName(sub.productId);
    const isValid = planName !== null;
    
    if (!isValid) {
      console.log(`   ⏭️ Skipping non-subscription product: ${sub.productId}`);
    }
    
    return isValid;
  });
  
  if (validSubscriptions.length === 0) {
    console.log('ℹ️ [getActiveSubscriptionForUser] No valid subscription SKUs found');
    return null;
  }
  
  console.log(`✅ [getActiveSubscriptionForUser] Found ${validSubscriptions.length} valid subscription(s)`);
  
  // If multiple subscriptions exist, pick the one with the latest transaction date
  // This handles edge cases where a user might have multiple active subscriptions
  // (e.g., during upgrade/downgrade transitions)
  const latestSubscription = validSubscriptions.reduce((latest, current) => {
    return current.transactionDate > latest.transactionDate ? current : latest;
  });
  
  const planName = getProductIdToPlanName(latestSubscription.productId);
  
  if (!planName) {
    console.warn('⚠️ [getActiveSubscriptionForUser] Could not map product ID to plan name:', latestSubscription.productId);
    return null;
  }
  
  const activeSubscription: ActiveSubscription = {
    productId: latestSubscription.productId,
    planName,
    purchaseToken: latestSubscription.purchaseToken,
    transactionDate: latestSubscription.transactionDate,
  };
  
  console.log('✅ [getActiveSubscriptionForUser] Active subscription determined:', {
    planName: activeSubscription.planName,
    productId: activeSubscription.productId,
    transactionDate: new Date(activeSubscription.transactionDate).toISOString(),
    purchaseToken: activeSubscription.purchaseToken.substring(0, 20) + '...',
  });
  
  if (validSubscriptions.length > 1) {
    console.log(`ℹ️ [getActiveSubscriptionForUser] Multiple subscriptions found, selected latest: ${planName}`);
  }
  
  return activeSubscription;
}

/**
 * Priority ranking for plans (higher is better)
 */
const PLAN_PRIORITY: Record<PlanName, number> = {
  'VIP': 3,
  'Pro': 2,
  'Basic': 1,
};

/**
 * Compare two plan names to determine which is "better"
 * Returns true if plan1 is better than or equal to plan2
 */
export function isPlanBetterOrEqual(plan1: PlanName, plan2: PlanName): boolean {
  return PLAN_PRIORITY[plan1] >= PLAN_PRIORITY[plan2];
}
