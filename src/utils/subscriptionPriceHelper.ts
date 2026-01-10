/**
 * Subscription Price Helper
 * 
 * Extracts localized prices from Google Play ProductDetails.
 * NEVER constructs price strings manually - always uses Google Play's formattedPrice.
 * 
 * Complies with Google Play's "Subscriptions policy – Currency differences with prominent display price"
 */

import { Product } from 'react-native-iap';

export interface SubscriptionDisplayPrice {
  priceText: string;        // e.g., "₹999.00", "$4.99" - already localized by Google Play
  periodText: string;       // e.g., "per month", "per year"
  billingPeriod: string;    // ISO 8601: "P1M", "P1Y", etc.
  currencyCode: string;     // e.g., "INR", "USD"
}

/**
 * Maps ISO 8601 billing period to human-readable text
 */
function mapBillingPeriodToText(billingPeriod: string): string {
  const periodMap: { [key: string]: string } = {
    'P1W': 'week',
    'P1M': 'month',
    'P3M': '3 months',
    'P6M': '6 months',
    'P1Y': 'year',
  };

  return periodMap[billingPeriod] || 'period';
}

/**
 * Extracts display price from a Google Play ProductDetails
 * 
 * @param product - ProductDetails from react-native-iap
 * @returns SubscriptionDisplayPrice or null if pricing info is missing
 */
export function getSubscriptionDisplayPrice(product: Product): SubscriptionDisplayPrice | null {
  try {
    // Get product ID - handle both Android and iOS product types
    const productId = 'productId' in product ? product.productId : (product as any).id;
    
    // For Android subscriptions, check subscriptionOfferDetailsAndroid
    if ('subscriptionOfferDetailsAndroid' in product && product.subscriptionOfferDetailsAndroid) {
      const offers = product.subscriptionOfferDetailsAndroid;

      if (!offers || offers.length === 0) {
        console.warn(`⚠️ No subscription offers for productId: ${productId} – check Play Console base plan`);
        return null;
      }

      const firstOffer = offers[0];
      const pricingPhases = firstOffer?.pricingPhases;

      if (!pricingPhases || !pricingPhases.pricingPhaseList || pricingPhases.pricingPhaseList.length === 0) {
        console.warn(`⚠️ No pricing phases for productId: ${productId} – check Play Console base plan`);
        return null;
      }

      const phase = pricingPhases.pricingPhaseList[0];

      if (!phase.formattedPrice || !phase.billingPeriod) {
        console.warn(`⚠️ Missing formattedPrice or billingPeriod for productId: ${productId}`);
        return null;
      }

      return {
        priceText: phase.formattedPrice,
        periodText: `per ${mapBillingPeriodToText(phase.billingPeriod)}`,
        billingPeriod: phase.billingPeriod,
        currencyCode: phase.priceCurrencyCode || 'USD',
      };
    }

    // Fallback for non-subscription products or iOS (not used in this app, but safe)
    console.warn(`⚠️ Product ${productId} is not a subscription or missing Android offer details`);
    return null;
  } catch (error) {
    const productId = 'productId' in product ? product.productId : (product as any).id;
    console.error(`❌ Error extracting price for productId: ${productId}`, error);
    return null;
  }
}

/**
 * Maps plan names to Google Play product IDs
 */
export function getProductIdForPlan(planName: string): string {
  const productMap: { [key: string]: string } = {
    'Basic': 'muscleai.basic.monthly',
    'Pro': 'muscleai.pro.monthly',
    'VIP': 'muscleai.vip.monthly',
  };

  return productMap[planName] || 'muscleai.basic.monthly';
}

/**
 * Finds a product by plan name and extracts its display price
 * 
 * @param products - Array of ProductDetails from Google Play
 * @param planName - Plan name (e.g., "Basic", "Pro", "VIP")
 * @returns SubscriptionDisplayPrice or null
 */
export function getProductDisplayPriceByPlanName(
  products: Product[],
  planName: string
): SubscriptionDisplayPrice | null {
  const productId = getProductIdForPlan(planName);
  return getProductDisplayPrice(products, productId);
}

/**
 * Finds a product by product ID and extracts its display price
 * 
 * @param products - Array of ProductDetails from Google Play
 * @param productId - Google Play product ID (e.g., "muscleai.basic.monthly")
 * @returns SubscriptionDisplayPrice or null
 */
export function getProductDisplayPrice(
  products: Product[],
  productId: string
): SubscriptionDisplayPrice | null {
  const product = products.find(p => {
    const pid = 'productId' in p ? p.productId : (p as any).id;
    return pid === productId;
  });

  if (!product) {
    console.warn(`⚠️ Product not found: ${productId}`);
    return null;
  }

  return getSubscriptionDisplayPrice(product);
}

/**
 * Logs extracted prices for verification (call once when products are loaded)
 * 
 * This helps verify that prices match the Google Play purchase sheet
 */
export function logExtractedPrices(products: Product[]): void {
  console.log('📊 === EXTRACTED GOOGLE PLAY PRICES ===');

  products.forEach(product => {
    const productId = 'productId' in product ? product.productId : (product as any).id;
    const priceInfo = getSubscriptionDisplayPrice(product);

    if (priceInfo) {
      console.log(`✅ ${productId}:`);
      console.log(`   Price: ${priceInfo.priceText}`);
      console.log(`   Period: ${priceInfo.periodText}`);
      console.log(`   Billing Period: ${priceInfo.billingPeriod}`);
      console.log(`   Currency: ${priceInfo.currencyCode}`);
    } else {
      console.log(`❌ ${productId}: No pricing info available`);
    }
  });

  console.log('📊 === END EXTRACTED PRICES ===');
}
