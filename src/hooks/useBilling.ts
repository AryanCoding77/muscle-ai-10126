/**
 * React Hook for Google Play Billing
 * Provides easy access to billing functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BillingService, BillingResult } from '../services/billing/BillingService';
import { Purchase, Product, getAvailablePurchases } from 'react-native-iap';
import { createSubscription, verifyGooglePlayPurchase } from '../services/subscriptionService';
import { logExtractedPrices } from '../utils/subscriptionPriceHelper';

export interface UseBillingReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  isReady: boolean;
  subscriptionsSupported: boolean;
  diagnostics: {
    initialized: boolean;
    subscriptionsSupported: boolean;
    installerPackage: string | null;
    installerIsPlayStore: boolean;
    billingClientVersion: string;
    productsCount: number;
  };
  purchase: (productId: string) => Promise<BillingResult>;
  refreshProducts: () => Promise<void>;
  setPendingPurchaseContext: (context: { planId: string; productId: string }) => void;
  setOnPurchaseComplete: (callback: () => void) => void;
}

export function useBilling(): UseBillingReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [subscriptionsSupported, setSubscriptionsSupported] = useState(false);
  const [diagnostics, setDiagnostics] = useState({
    initialized: false,
    subscriptionsSupported: false,
    installerPackage: null as string | null,
    installerIsPlayStore: true,
    billingClientVersion: 'unknown',
    productsCount: 0,
  });

  // Keep track of the plan associated with the next Google Play purchase
  const pendingPurchaseContextRef = useRef<{ planId?: string; productId?: string } | null>(null);
  
  // Callback to notify when purchase is complete (for subscription refresh)
  const onPurchaseCompleteRef = useRef<(() => void) | null>(null);

  // Initialize billing on mount
  useEffect(() => {
    let mounted = true;

    const initBilling = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize billing service
        const initResult = await BillingService.init();
        
        if (!mounted) return;

        if (!initResult.success) {
          setError(initResult.message || 'Failed to initialize billing');
          setLoading(false);
          return;
        }

        setIsReady(true);
        setSubscriptionsSupported(BillingService.areSubscriptionsSupported());

        // Get diagnostics
        const diag = BillingService.getDiagnostics();
        setDiagnostics(diag);
        console.log('📊 Billing diagnostics in hook:', diag);

        // Fetch products
        const productsResult = await BillingService.getProducts();
        
        if (!mounted) return;

        if (productsResult.success) {
          const fetchedProducts = productsResult.data || [];
          setProducts(fetchedProducts);
          
          // Log extracted prices for verification (once per load)
          if (fetchedProducts.length > 0) {
            logExtractedPrices(fetchedProducts);
          }
          
          // Update diagnostics with product count
          setDiagnostics(BillingService.getDiagnostics());
        } else {
          setError(productsResult.message || 'Failed to fetch products');
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'An error occurred');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initBilling();

    // Cleanup
    return () => {
      mounted = false;
    };
  }, []);

  // Set up purchase callbacks
  useEffect(() => {
    BillingService.onPurchaseSuccess = async (purchase: Purchase) => {
      console.log('✅ Purchase successful in hook:', purchase);

      const context = pendingPurchaseContextRef.current;
      if (!context?.planId) {
        console.warn('⚠️ No pending purchase context when handling purchase success');
        return;
      }

      try {
        const purchaseToken = (purchase as any).purchaseToken;
        const productId = purchase.productId || context.productId;

        if (!purchaseToken || !productId) {
          console.error('❌ Missing purchaseToken or productId when syncing purchase:', {
            hasToken: !!purchaseToken,
            productId,
          });
          return;
        }

        console.log('🔄 Syncing Google Play purchase with backend:', {
          planId: context.planId,
          productId,
        });

        // 1) Create or update subscription in Supabase using the Edge Function
        const createResult = await createSubscription(context.planId, {
          googlePlayPurchaseToken: purchaseToken,
          googlePlayProductId: productId,
        });

        if (!createResult.success || !createResult.subscription_id) {
          console.error('❌ Failed to create subscription from Google Play purchase:', createResult.error);
          setError(createResult.error || 'Failed to activate subscription. Please contact support.');
          return;
        }

        // 2) Verify/record the Google Play purchase (payment transaction)
        const verifyResult = await verifyGooglePlayPurchase(
          purchaseToken,
          productId,
          createResult.subscription_id,
        );

        if (!verifyResult.success || !verifyResult.verified) {
          console.error('❌ Failed to verify Google Play purchase with backend:', verifyResult.error);
          // Keep subscription active but inform logs; UI already considers the user subscribed.
        } else {
          console.log('✅ Google Play purchase verified in backend');
        }

        // After a successful sync, clear the pending context
        pendingPurchaseContextRef.current = null;
        
        // Notify that purchase is complete (triggers subscription refresh)
        if (onPurchaseCompleteRef.current) {
          console.log('🔔 Notifying purchase complete callback...');
          onPurchaseCompleteRef.current();
        }
      } catch (syncError: any) {
        console.error('❌ Error syncing Google Play purchase with backend:', syncError);
        setError('Purchase completed, but failed to sync subscription. Please refresh your subscription or contact support.');
      }
    };

    BillingService.onPurchaseError = async (error: any) => {
      console.error('❌ Purchase error in hook:', error);

      const code = error?.code || '';
      const message = error?.message || '';

      const isAlreadyOwned =
        code === 'already-owned' ||
        code === 'E_ALREADY_OWNED' ||
        code === 'E_ALREADY_OWNED' ||
        message.toLowerCase().includes('already own') ||
        message.toLowerCase().includes('already subscribed');

      if (isAlreadyOwned) {
        console.log('ℹ️ Item already owned. Attempting to restore subscription from Google Play purchases.');

        try {
          const context = pendingPurchaseContextRef.current;
          if (!context?.planId || !context?.productId) {
            console.warn('⚠️ No pending purchase context available for restore; cannot sync subscription.');
            setError(error.message || 'You already own this subscription in Google Play, but we could not restore it.');
            return;
          }

          const purchases = await getAvailablePurchases({});
          const matchingPurchase = purchases.find(p => p.productId === context.productId);

          if (!matchingPurchase) {
            console.warn('⚠️ No matching purchase found during restore for productId:', context.productId);
            setError(error.message || 'You already own this subscription in Google Play, but we could not restore it.');
            return;
          }

          console.log('🔄 Restoring subscription from existing Google Play purchase:', matchingPurchase);

          const purchaseToken = (matchingPurchase as any).purchaseToken;
          const productId = matchingPurchase.productId || context.productId;

          if (!purchaseToken || !productId) {
            console.error('❌ Missing purchaseToken or productId when restoring:', {
              hasToken: !!purchaseToken,
              productId,
            });
            setError('You already own this subscription, but we could not restore it.');
            return;
          }

          const createResult = await createSubscription(context.planId, {
            googlePlayPurchaseToken: purchaseToken,
            googlePlayProductId: productId,
          });

          if (!createResult.success || !createResult.subscription_id) {
            console.error('❌ Failed to create subscription while restoring:', createResult.error);
            setError(createResult.error || 'Failed to restore subscription. Please contact support.');
            return;
          }

          const verifyResult = await verifyGooglePlayPurchase(
            purchaseToken,
            productId,
            createResult.subscription_id,
          );

          if (!verifyResult.success || !verifyResult.verified) {
            console.error('❌ Failed to verify restored Google Play purchase with backend:', verifyResult.error);
          } else {
            console.log('✅ Restored Google Play subscription verified in backend');
          }

          // Clear pending context after a successful restore
          pendingPurchaseContextRef.current = null;

          // Clear error since we treated this as a successful restore
          setError(null);
          
          // Notify that purchase is complete (triggers subscription refresh)
          if (onPurchaseCompleteRef.current) {
            console.log('🔔 Notifying purchase complete callback (restore)...');
            onPurchaseCompleteRef.current();
          }
        } catch (restoreError: any) {
          console.error('❌ Error while trying to restore subscription after already-owned:', restoreError);
          setError(error.message || 'You already own this subscription in Google Play, but we could not restore it.');
        }
      } else {
        setError(error.message || 'Purchase failed');
      }
    };

    return () => {
      BillingService.onPurchaseSuccess = () => {};
      BillingService.onPurchaseError = () => {};
    };
  }, []);

  // Purchase function
  const purchase = useCallback(async (productId: string): Promise<BillingResult> => {
    setError(null);
    return await BillingService.purchase(productId);
  }, []);

  // Allow UI to set the plan/product context for the next purchase
  const setPendingPurchaseContext = useCallback((context: { planId: string; productId: string }) => {
    pendingPurchaseContextRef.current = context;
  }, []);
  
  // Allow UI to set a callback for when purchase completes
  const setOnPurchaseComplete = useCallback((callback: () => void) => {
    onPurchaseCompleteRef.current = callback;
  }, []);

  // Refresh products
  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await BillingService.getProducts();
    
    if (result.success) {
      setProducts(result.data || []);
    } else {
      setError(result.message || 'Failed to refresh products');
    }

    setLoading(false);
  }, []);

  return {
    products,
    loading,
    error,
    isReady,
    subscriptionsSupported,
    diagnostics,
    purchase,
    refreshProducts,
    setPendingPurchaseContext,
    setOnPurchaseComplete,
  };
}
