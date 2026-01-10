/**
 * Google Play Billing Service
 * Handles all Google Play Billing operations for subscriptions
 */

import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  acknowledgePurchaseAndroid,
  isFeatureSupported,
  Product,
  Purchase,
  PurchaseError,
} from 'react-native-iap';
import { Platform } from 'react-native';
import { checkInstaller, STRICT_INSTALLER_CHECK } from '../../utils/installerCheck';

// Google Play subscription product IDs
export const SUBSCRIPTION_SKUS = [
  'muscleai.basic.monthly',
  'muscleai.pro.monthly',
  'muscleai.vip.monthly',
];

export interface BillingResult {
  success: boolean;
  code?: string;
  message?: string;
  /** Numeric Google Play Billing responseCode when available (Android only) */
  responseCode?: number;
  /** Low-level debug message from BillingClient when available */
  debugMessage?: string;
  data?: any;
}

export interface SubscriptionOffer {
  offerToken: string;
  basePlanId: string;
  pricingPhases: Array<{
    priceAmountMicros: string;
    priceCurrencyCode: string;
    formattedPrice: string;
  }>;
}

// Extended product type with subscription details
export type ProductDetails = Product & {
  subscriptionOfferDetailsAndroid?: SubscriptionOffer[];
}

class BillingServiceClass {
  private isInitialized = false;
  private isConnecting = false;
  private products: Product[] = [];
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private connectionRetries = 0;
  private readonly MAX_RETRIES = 3;
  private billingClientVersion: string = 'unknown';
  private installerPackage: string | null = null;
  private installerIsPlayStore: boolean = true;
  private subscriptionsSupported: boolean = false;

  /**
   * Map Google Play Billing responseCode to a human-readable label
   * Based on: https://developer.android.com/google/play/billing/errors
   */
  private getAndroidResponseCodeLabel(responseCode?: number): string {
    switch (responseCode) {
      case 0:
        return 'OK';
      case 1:
        return 'USER_CANCELED';
      case 2:
        return 'SERVICE_UNAVAILABLE';
      case 3:
        return 'BILLING_UNAVAILABLE';
      case 4:
        return 'ITEM_UNAVAILABLE';
      case 5:
        return 'DEVELOPER_ERROR';
      case 6:
        return 'ERROR';
      case 7:
        return 'ITEM_ALREADY_OWNED';
      case 8:
        return 'ITEM_NOT_OWNED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Initialize billing connection with retry logic for SERVICE_DISCONNECTED
   */
  async init(): Promise<BillingResult> {
    if (this.isInitialized) {
      console.log('✅ Billing already initialized');
      return { success: true, message: 'Already initialized' };
    }

    if (this.isConnecting) {
      console.log('⏳ Billing connection in progress...');
      return { success: false, message: 'Connection in progress' };
    }

    try {
      this.isConnecting = true;
      console.log('🔄 Initializing Google Play Billing...');
      
      // Log installer package (should be com.android.vending for Play Store)
      await this.logInstallerPackage();

      // Initialize connection with retry logic
      const connected = await this.initConnectionWithRetry();
      console.log('✅ Billing connection result:', connected);
      console.log('📊 Connection response code:', typeof connected === 'boolean' ? 'OK' : connected);

      // Check if subscriptions are supported (CRITICAL CHECK)
      console.log('🔍 Checking subscription feature support...');
      try {
        this.subscriptionsSupported = await isFeatureSupported('subscriptions');
        console.log('✅ Subscriptions supported:', this.subscriptionsSupported);
        
        if (!this.subscriptionsSupported) {
          this.isConnecting = false;
          console.error('❌ SUBSCRIPTIONS NOT SUPPORTED on this device/build');
          return {
            success: false,
            code: 'FEATURE_NOT_SUPPORTED',
            message: 'Subscriptions are not supported. Ensure app is installed from Play Store.',
          };
        }
      } catch (featureError: any) {
        console.error('❌ Error checking feature support:', featureError);
        // Continue anyway, but log the issue
        this.subscriptionsSupported = true; // Assume supported if check fails
      }

      // Log billing client version
      this.logBillingClientVersion();

      // Set up purchase listeners
      this.setupPurchaseListeners();

      this.isInitialized = true;
      this.isConnecting = false;
      this.connectionRetries = 0; // Reset retry counter

      console.log('✅ Google Play Billing initialized successfully');
      console.log('📊 Billing diagnostics:', {
        initialized: this.isInitialized,
        subscriptionsSupported: this.subscriptionsSupported,
        installerPackage: this.installerPackage,
        billingClientVersion: this.billingClientVersion,
      });
      
      return { success: true, message: 'Billing initialized' };
    } catch (error: any) {
      this.isConnecting = false;
      console.error('❌ Failed to initialize billing:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error responseCode:', error.responseCode);
      
      // Check if it's SERVICE_DISCONNECTED and we should retry
      if (this.shouldRetryConnection(error)) {
        console.log(`🔄 Retrying connection (attempt ${this.connectionRetries + 1}/${this.MAX_RETRIES})...`);
        this.connectionRetries++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return this.init(); // Recursive retry
      }
      
      this.connectionRetries = 0; // Reset counter
      return {
        success: false,
        code: error.code || error.responseCode || 'INIT_ERROR',
        message: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Initialize connection with retry logic
   */
  private async initConnectionWithRetry(): Promise<boolean> {
    try {
      return await initConnection();
    } catch (error: any) {
      console.error('❌ Connection error:', error);
      
      // If SERVICE_DISCONNECTED and retries available, throw to trigger retry
      if (this.shouldRetryConnection(error)) {
        throw error;
      }
      
      // Otherwise, rethrow
      throw error;
    }
  }

  /**
   * Check if we should retry connection based on error
   */
  private shouldRetryConnection(error: any): boolean {
    const isServiceDisconnected = 
      error.code === 'E_SERVICE_DISCONNECTED' ||
      error.code === 'SERVICE_DISCONNECTED' ||
      error.responseCode === 1 || // BILLING_RESPONSE_RESULT_SERVICE_DISCONNECTED
      error.message?.includes('SERVICE_DISCONNECTED');
    
    return isServiceDisconnected && this.connectionRetries < this.MAX_RETRIES;
  }

  /**
   * Log installer package to verify Play Store installation
   */
  private async logInstallerPackage(): Promise<void> {
    try {
      const result = await checkInstaller();
      const installer = typeof result.installer === 'string' ? result.installer : null;

      this.installerPackage = installer;
      this.installerIsPlayStore = !!result.ok;

      console.log('Installer package:', installer);
      console.log('Installer isPlayStore:', this.installerIsPlayStore);

      if (Platform.OS === 'android' && !this.installerIsPlayStore) {
        console.warn('⚠ App not installed from Google Play. This build is intended for Play Store distribution only.');
      }
    } catch (error) {
      console.error('❌ Error checking installer package:', error);
      this.installerPackage = null;
      this.installerIsPlayStore = true;
    }
  }

  /**
   * Log billing client version
   */
  private logBillingClientVersion(): void {
    try {
      // The billing client version is embedded in the native library
      // We can't directly access it from JS, but we know it from our config
      this.billingClientVersion = '6.2.1 (configured)';
      console.log('📊 Billing Client Version:', this.billingClientVersion);
      console.log('📊 react-native-iap Version: 14.4.46');
    } catch (error) {
      console.error('❌ Error logging billing version:', error);
    }
  }

  /**
   * Set up purchase update and error listeners with detailed logging
   */
  private setupPurchaseListeners() {
    // Remove existing listeners
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
    }

    // Purchase update listener with detailed logging
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: Purchase) => {
        console.log('🎉 Purchase updated - Full details:', JSON.stringify(purchase, null, 2));
        console.log('📊 Purchase state:', purchase.purchaseStateAndroid);
        console.log('📊 Transaction ID:', purchase.transactionId);
        console.log('📊 Product ID:', purchase.productId);
        console.log('📊 Purchase token:', purchase.purchaseToken);
        console.log('📊 Is acknowledged:', 'isAcknowledgedAndroid' in purchase ? purchase.isAcknowledgedAndroid : 'N/A');
        
        const transactionId = purchase.transactionId;
        if (transactionId) {
          try {
            // Acknowledge the purchase on Android (with duplicate guard)
            if (Platform.OS === 'android' && 'isAcknowledgedAndroid' in purchase) {
              if (!purchase.isAcknowledgedAndroid) {
                console.log('📝 Acknowledging purchase (not yet acknowledged)...');
                if (purchase.purchaseToken) {
                  await acknowledgePurchaseAndroid(purchase.purchaseToken);
                  console.log('✅ Purchase acknowledged successfully');
                } else {
                  console.error('❌ No purchase token available for acknowledgement');
                }
              } else {
                console.log('✅ Purchase already acknowledged, skipping');
              }
            }

            // Finish the transaction
            console.log('🏁 Finishing transaction...');
            await finishTransaction({ purchase, isConsumable: false });
            console.log('✅ Transaction finished successfully');

            // Notify app about successful purchase
            this.onPurchaseSuccess(purchase);
          } catch (error: any) {
            console.error('❌ Error processing purchase:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error responseCode:', error.responseCode);
            console.error('❌ Error debugMessage:', error.debugMessage);
            this.onPurchaseError(error);
          }
        } else {
          console.warn('⚠️ Purchase update received but no transaction ID');
        }
      }
    );

    // Purchase error listener with detailed logging
    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        // react-native-iap v14 normalizes errors and may not expose numeric responseCode directly
        console.error('❌ Purchase error - Normalized details:', JSON.stringify(error, null, 2));
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);

        // Forward a richer error object with best-effort numeric mapping to listeners
        const enrichedError: any = {
          ...error,
        };

        // If underlying native error included a numeric responseCode/debugMessage, the original
        // error was already logged in the requestPurchase catch below. Here we only log the
        // high-level code/message and let UI show them.

        this.onPurchaseError(enrichedError);
      }
    );

    console.log('✅ Purchase listeners set up with detailed logging');
  }

  /**
   * Callbacks for purchase events (to be overridden by app)
   */
  onPurchaseSuccess: (purchase: Purchase) => void = () => {};
  onPurchaseError: (error: any) => void = () => {};

  /**
   * Get available subscription products with detailed logging
   */
  async getProducts(): Promise<BillingResult> {
    if (!this.isInitialized) {
      const initResult = await this.init();
      if (!initResult.success) {
        return initResult;
      }
    }

    // Check if subscriptions are supported before fetching
    if (!this.subscriptionsSupported) {
      console.error('❌ Cannot fetch products: Subscriptions not supported');
      return {
        success: false,
        code: 'FEATURE_NOT_SUPPORTED',
        message: 'Subscriptions are not supported on this device. Install from Play Store.',
        data: [],
      };
    }

    try {
      console.log('🔍 Fetching subscription products:', SUBSCRIPTION_SKUS);
      console.log('📊 Requested product IDs:', SUBSCRIPTION_SKUS.join(', '));

      // Fetch products using the correct v14 API
      const result = await fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' });
      
      console.log('📊 Fetch products response code: OK');
      console.log('📊 Result length:', result ? result.length : 0);
      
      if (!result || result.length === 0) {
        console.error('❌ ZERO products returned from Play Console');
        console.warn('⚠️ Possible reasons:');
        console.warn('  1. Products not created in Play Console');
        console.warn('  2. Products are in DRAFT status (must be ACTIVE)');
        console.warn('  3. Base plans missing or inactive');
        console.warn('  4. No prices set for tester\'s region/country');
        console.warn('  5. App not installed from Play Store');
        console.warn('  6. Play Console changes not yet propagated (wait 1-2 hours)');
        
        return {
          success: false,
          code: 'ITEM_UNAVAILABLE',
          message: 'Products not available in your region. Ensure:\n• Products are ACTIVE in Play Console\n• Base plans have prices for your country\n• App installed from Play Store',
          data: [],
        };
      }

      const products = result as Product[];
      console.log('✅ Products fetched successfully:', products.length);

      // Log each product details with full diagnostics
      products.forEach((product, index: number) => {
        console.log(`\n📦 Product ${index + 1} - Full Details:`);
        console.log(`  Product ID: ${product.id}`);
        console.log(`  Title: ${product.title}`);
        console.log(`  Description: ${product.description}`);
        console.log(`  Price: ${product.displayPrice}`);
        console.log(`  Currency: ${product.currency}`);
        console.log(`  Type: ${product.type}`);

        // Check for offer token (Android only) - CRITICAL for purchase
        if ('subscriptionOfferDetailsAndroid' in product && product.subscriptionOfferDetailsAndroid) {
          const offers = product.subscriptionOfferDetailsAndroid;
          console.log(`  ✅ Number of offers: ${offers.length}`);
          
          offers.forEach((offer, offerIndex) => {
            console.log(`  📋 Offer ${offerIndex + 1}:`);
            console.log(`    Offer Token: ${offer.offerToken}`);
            console.log(`    Base Plan ID: ${offer.basePlanId}`);
            console.log(`    Pricing Phases: ${offer.pricingPhases?.length || 0}`);
            
            if (offer.pricingPhases && offer.pricingPhases.length > 0) {
              offer.pricingPhases.forEach((phase, phaseIndex) => {
                console.log(`    Phase ${phaseIndex + 1}: ${phase.formattedPrice} (${phase.priceCurrencyCode})`);
              });
            }
          });
        } else {
          console.error(`  ❌ NO OFFER DETAILS for ${product.id} - Purchase will fail!`);
          console.error(`  ❌ Check Play Console: Base plan must be ACTIVE with valid offer`);
        }
      });

      this.products = products;

      return {
        success: true,
        message: `Found ${products.length} products`,
        data: products,
      };
    } catch (error: any) {
      console.error('❌ Error fetching products:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error responseCode:', error.responseCode);
      
      return {
        success: false,
        code: error.code || error.responseCode || 'FETCH_ERROR',
        message: this.getErrorMessage(error),
        data: [],
      };
    }
  }

  /**
   * Purchase a subscription
   */
  async purchase(productId: string): Promise<BillingResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        code: 'NOT_INITIALIZED',
        message: 'Billing not initialized',
      };
    }

    // Check if subscriptions are supported (CRITICAL)
    if (!this.subscriptionsSupported) {
      console.error('❌ Cannot purchase: Subscriptions not supported');
      return {
        success: false,
        code: 'FEATURE_NOT_SUPPORTED',
        message: 'Subscriptions not supported. Install from Play Store.',
      };
    }

    // Soft runtime guard for non-Play Store installs
    if (Platform.OS === 'android' && !this.installerIsPlayStore) {
      console.warn('⚠ App not installed from Google Play. This build is intended for Play Store distribution only.');

      if (STRICT_INSTALLER_CHECK) {
        return {
          success: false,
          code: 'INSTALL_SOURCE_NOT_PLAY',
          message: 'To use Google Play Billing, install this app from the Google Play Store.',
        };
      }
    }

    try {
      console.log('💳 Initiating purchase for:', productId);

      // Find the product details that were returned by fetchProducts
      const product = this.products.find(p => p.id === productId);
      
      if (!product) {
        console.error('❌ Product not found in cached products:', productId);
        console.error('❌ Available products:', this.products.map(p => p.id).join(', '));
        return {
          success: false,
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found. Please refresh and try again.',
        };
      }

      console.log('✅ Product found for purchase:', {
        id: product.id,
        title: product.title,
        type: product.type,
        platform: product.platform,
      });

      // For Android subscriptions, we MUST use an active base plan offerToken
      if (Platform.OS === 'android' && 'subscriptionOfferDetailsAndroid' in product) {
        const offerDetails = (product as any).subscriptionOfferDetailsAndroid as any[] | null | undefined;
        
        if (!offerDetails || offerDetails.length === 0) {
          console.error('❌ NO subscription offer details for:', productId);
          console.error('❌ This usually means the base plan/offer is not ACTIVE or not available in this region');
          return {
            success: false,
            code: 'NO_OFFER_TOKEN',
            message: 'Base plan/offer not active or not available in this region. Check Play Console base plan configuration.',
          };
        }

        // In a more advanced UI you might let the user pick an offer; for now take the first ACTIVE one
        const offer = offerDetails[0];
        const offerToken = offer?.offerToken;
        const basePlanId = offer?.basePlanId;

        console.log('📝 Selected Android subscription offer:', {
          productId,
          basePlanId,
          offerToken,
        });

        // Defensive checks for offerToken
        if (!offerToken) {
          console.error('❌ Offer token is null/undefined for product:', productId);
          return {
            success: false,
            code: 'INVALID_OFFER_TOKEN',
            message: 'Offer token missing. Ensure the base plan is ACTIVE and has a valid offerToken in Play Console.',
          };
        }

        // Build v14 subscription purchase params using ProductDetails + offerToken
        const purchaseParams = {
          type: 'subs' as const,
          request: {
            android: {
              skus: [productId],
              subscriptionOffers: [
                {
                  sku: productId,
                  offerToken,
                },
              ],
            },
          },
        };

        console.log('🚀 Launching Android billing flow with params:');
        console.log('  Product ID:', productId);
        console.log('  Base Plan ID:', basePlanId);
        console.log('  Offer Token:', offerToken);
        console.log('📊 Raw purchase params:', JSON.stringify(purchaseParams, null, 2));

        const result = await requestPurchase(purchaseParams as any);
        console.log('📊 requestPurchase result (event-based API):', result);
        console.log('✅ Purchase flow initiated successfully. Waiting for purchaseUpdatedListener...');

      } else if (Platform.OS === 'ios') {
        // iOS subscription purchase – still productId-based, but we log clearly
        console.log('🚀 Launching iOS billing flow for product:', productId);
        const purchaseParams = {
          type: 'subs' as const,
          request: {
            ios: {
              sku: productId,
            },
          },
        };

        console.log('📊 iOS purchase params:', JSON.stringify(purchaseParams, null, 2));
        const result = await requestPurchase(purchaseParams as any);
        console.log('📊 requestPurchase result (event-based API):', result);
        console.log('✅ iOS purchase flow initiated successfully. Waiting for purchaseUpdatedListener...');

      } else {
        console.error('❌ Unsupported platform or missing offer details for product:', productId);
        return {
          success: false,
          code: 'PLATFORM_ERROR',
          message: 'Purchase not supported on this platform configuration.',
        };
      }

      return {
        success: true,
        message: 'Purchase flow initiated',
      };
    } catch (error: any) {
      console.error('❌ Purchase error - Full details:', JSON.stringify(error, null, 2));
      const code = error?.code ?? 'PURCHASE_ERROR';
      const responseCode: number | undefined = typeof error?.responseCode === 'number' ? error.responseCode : undefined;
      const debugMessage: string | undefined = error?.debugMessage;

      console.error('❌ Error code:', code);
      console.error('❌ Error responseCode (numeric):', responseCode);
      console.error('❌ Error debugMessage:', debugMessage);

      const responseLabel = this.getAndroidResponseCodeLabel(responseCode);
      let friendlyMessage = this.getErrorMessage(error);

      // If we have a numeric response code, prepend a clear prefix for the UI/diagnostics
      if (typeof responseCode === 'number') {
        friendlyMessage = `[CODE ${responseCode} ${responseLabel}] ${friendlyMessage}`;
      } else {
        friendlyMessage = `[${code}] ${friendlyMessage}`;
      }

      return {
        success: false,
        code: code,
        message: friendlyMessage,
        responseCode,
        debugMessage,
      };
    }
  }

  /**
   * Get cached products
   */
  getCachedProducts(): Product[] {
    return this.products;
  }

  /**
   * Check if billing is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if subscriptions are supported
   */
  areSubscriptionsSupported(): boolean {
    return this.subscriptionsSupported;
  }

  /**
   * Get billing diagnostics for debugging
   */
  getDiagnostics(): {
    initialized: boolean;
    subscriptionsSupported: boolean;
    installerPackage: string | null;
    installerIsPlayStore: boolean;
    billingClientVersion: string;
    productsCount: number;
  } {
    return {
      initialized: this.isInitialized,
      subscriptionsSupported: this.subscriptionsSupported,
      installerPackage: this.installerPackage,
      installerIsPlayStore: this.installerIsPlayStore,
      billingClientVersion: this.billingClientVersion,
      productsCount: this.products.length,
    };
  }

  /**
   * Disconnect billing
   */
  async disconnect(): Promise<void> {
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

      await endConnection();
      this.isInitialized = false;
      console.log('✅ Billing disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting billing:', error);
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    const code = error.code || '';
    const message = error.message || '';

    // Map error codes to user-friendly messages
    const errorMap: { [key: string]: string } = {
      'E_USER_CANCELLED': 'Purchase was cancelled',
      'E_ITEM_UNAVAILABLE': 'This subscription is not available. Ensure:\n• App is installed from Play Store\n• Products are active in Play Console\n• Base plans have prices for your region',
      'E_NETWORK_ERROR': 'Network error. Please check your internet connection',
      'E_SERVICE_ERROR': 'Google Play services error. Ensure:\n• App is installed from Play Store\n• Google Play services is updated\n• You have a valid Google account',
      'E_ALREADY_OWNED': 'You already own this subscription',
      'E_DEVELOPER_ERROR': 'Configuration error. Contact support',
      'E_BILLING_UNAVAILABLE': 'Google Play Billing is unavailable. App must be installed from Play Store',
      'E_FEATURE_NOT_SUPPORTED': 'Subscriptions not supported on this device',
    };

    if (errorMap[code]) {
      return errorMap[code];
    }

    // Check message for specific errors
    if (message.includes('BILLING_UNAVAILABLE')) {
      return 'Google Play Billing unavailable. Install from Play Store';
    }
    if (message.includes('ITEM_UNAVAILABLE')) {
      return 'Product not available. Check Play Console configuration';
    }
    if (message.includes('SERVICE_DISCONNECTED')) {
      return 'Billing service disconnected. Please try again';
    }

    return message || 'An error occurred. Please try again';
  }
}

// Export singleton instance
export const BillingService = new BillingServiceClass();
