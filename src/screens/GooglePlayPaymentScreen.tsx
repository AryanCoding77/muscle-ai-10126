// Google Play Billing Payment Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../config/constants';
import { SubscriptionPlan } from '../types/subscription';
import { supabase } from '../lib/supabase';
import { useBilling } from '../hooks/useBilling';
import { useSubscription } from '../hooks/useSubscription';
import { getProductIdForPlan, getProductDisplayPrice } from '../utils/subscriptionPriceHelper';

interface GooglePlayPaymentScreenProps {
  navigation: any;
  route: {
    params: {
      plan: SubscriptionPlan;
    };
  };
}

export const GooglePlayPaymentScreen: React.FC<GooglePlayPaymentScreenProps> = ({ navigation, route }) => {
  const { plan } = route.params;
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [iapAvailable, setIapAvailable] = useState(false);

  // Use centralized billing hook so we always rely on the same ProductDetails + offerToken logic
  const { products, isReady, subscriptionsSupported, diagnostics, purchase, setPendingPurchaseContext, setOnPurchaseComplete } = useBilling();
  
  // Use subscription hook to refresh after purchase
  const { refreshSubscription } = useSubscription();

  // Mirror the existing diagnostics: billing is available when the shared BillingService is ready
  useEffect(() => {
    const available = isReady && subscriptionsSupported && diagnostics.productsCount > 0;
    setIapAvailable(available);
    console.log('📊 GooglePlayPaymentScreen billing availability:', {
      isReady,
      subscriptionsSupported,
      productsCount: diagnostics.productsCount,
      iapAvailable: available,
    });
    console.log('📊 GooglePlayPaymentScreen installer diagnostics:', {
      installerPackage: diagnostics.installerPackage,
      installerIsPlayStore: diagnostics.installerIsPlayStore,
    });
    if (Platform.OS === 'android' && diagnostics.installerIsPlayStore === false) {
      console.warn('⚠ App not installed from Google Play. This build is intended for Play Store distribution only.');
    }
  }, [isReady, subscriptionsSupported, diagnostics.productsCount]);
  
  // Set up purchase complete callback to refresh subscription
  useEffect(() => {
    setOnPurchaseComplete(() => {
      console.log('🔄 Purchase complete, refreshing subscription state...');
      refreshSubscription();
    });
  }, [setOnPurchaseComplete, refreshSubscription]);

  const handlePayment = async () => {
    if (!iapAvailable) {
      Alert.alert(
        'Billing Not Available',
        'Google Play Billing could not be initialized. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);
      setProcessingPayment(true);

      console.log('🛒 Starting purchase flow via BillingService...');
      console.log('Plan:', plan.plan_name);

      // Map plan names to Google Play product IDs used by BillingService
      const productId = getProductId(plan.plan_name);
      console.log('Product ID:', productId);

      // Let the billing hook know which subscription plan this purchase should activate
      setPendingPurchaseContext({ planId: plan.id, productId });

      // Find the loaded ProductDetails so we can log basePlanId/offerToken before delegating
      const product = products.find(p => p.id === productId);

      if (!product) {
        console.error('❌ Product not found in loaded billing products for:', productId);
        Alert.alert(
          'Product Not Available',
          'Product not found. Please go back, reload plans, and try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      let basePlanId: string | undefined;
      let offerToken: string | undefined;

      if ('subscriptionOfferDetailsAndroid' in product && product.subscriptionOfferDetailsAndroid) {
        const offer = product.subscriptionOfferDetailsAndroid[0];
        basePlanId = offer?.basePlanId;
        offerToken = offer?.offerToken;
      }

      console.log('📝 Purchase diagnostics before calling BillingService.purchase:', {
        productId,
        basePlanId,
        offerToken,
      });

      const result = await purchase(productId);

      if (result.success) {
        Alert.alert(
          'Purchase Initiated',
          'Please complete the purchase in Google Play.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        const code = result.code || 'UNKNOWN';
        const numericCode =
          typeof result.responseCode === 'number' ? result.responseCode : undefined;

        let message = result.message || 'Failed to initiate purchase. Please try again.';

        // If the service has already prefixed the message with [CODE ...] or another
        // bracketed prefix, respect it and avoid double-prefixing.
        const alreadyPrefixed = typeof message === 'string' && message.startsWith('[');

        if (!alreadyPrefixed) {
          if (typeof numericCode === 'number') {
            message = `[CODE ${numericCode}] ${message}`;
          } else {
            message = `[${code}] ${message}`;
          }
        }

        Alert.alert('Purchase Error', message, [{ text: 'OK' }]);
      }

    } catch (error: any) {
      console.error('❌ Unexpected error in GooglePlayPaymentScreen.handlePayment:', JSON.stringify(error, null, 2));
      const errorCode = error?.code || error?.responseCode || 'UNKNOWN';
      let errorMessage = error?.message || 'Failed to initiate purchase. Please try again.';

      // Keep a consistent prefix so we never show a bare "UNKNOWN" again
      errorMessage = `[${errorCode}] ${errorMessage}`;

      Alert.alert('Purchase Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  const getProductId = (planName: string): string => {
    return getProductIdForPlan(planName);
  };

  const renderPlanSummary = () => {
    // Get price from Google Play ProductDetails
    const productId = getProductIdForPlan(plan.plan_name);
    const priceInfo = getProductDisplayPrice(products, productId);
    
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Plan Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Plan:</Text>
          <Text style={styles.summaryValue}>{plan.plan_name}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Monthly Analyses:</Text>
          <Text style={styles.summaryValue}>{plan.monthly_analyses_limit}</Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        {/* Price from Google Play - NEVER hard-coded */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Amount:</Text>
          {priceInfo ? (
            <View style={styles.summaryPriceContainer}>
              <Text style={styles.summaryPrice}>{priceInfo.priceText}</Text>
              <Text style={styles.summaryPeriod}>{priceInfo.periodText}</Text>
            </View>
          ) : (
            <Text style={styles.summaryPriceLoading}>Loading...</Text>
          )}
        </View>
      </View>
    );
  };

  const renderFeatures = () => (
    <View style={styles.featuresCard}>
      <Text style={styles.featuresTitle}>What's Included</Text>
      {plan.features.map((feature, index) => (
        <View key={index} style={styles.featureRow}>
          <Text style={styles.featureCheck}>✓</Text>
          <Text style={styles.featureText}>{feature}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#1a1a1a', '#0a0a0a']}
          style={styles.content}
        >
          {renderPlanSummary()}
          {renderFeatures()}

          <View style={styles.securityNote}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Secure payment powered by Google Play Billing. Your payment information is encrypted and secure.
            </Text>
          </View>

          {diagnostics.installerIsPlayStore === false && (
            <View style={styles.installerWarning}>
              <Text style={styles.installerWarningText}>
                ⚠ To use Google Play Billing, install this app from the Google Play Store.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.payButton, (loading || processingPayment || !iapAvailable) && styles.payButtonDisabled]}
            onPress={handlePayment}
            // Disable Pay until billing is ready, subscriptions are supported, and products are loaded
            disabled={
              loading ||
              processingPayment ||
              !iapAvailable ||
              !isReady ||
              !subscriptionsSupported ||
              diagnostics.productsCount === 0
            }
          >
            {loading || processingPayment ? (
              <View style={styles.payButtonContent}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.payButtonText}>
                  {loading ? 'Preparing...' : 'Processing Payment...'}
                </Text>
              </View>
            ) : (
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payButtonGradient}
              >
                {(() => {
                  const productId = getProductIdForPlan(plan.plan_name);
                  const priceInfo = getProductDisplayPrice(products, productId);
                  return (
                    <Text style={styles.payButtonText}>
                      {priceInfo ? `Pay ${priceInfo.priceText}` : 'Continue to Payment'}
                    </Text>
                  );
                })()}
              </LinearGradient>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Your subscription will auto-renew monthly unless cancelled.
          </Text>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 15,
  },
  summaryPriceContainer: {
    alignItems: 'flex-end',
  },
  summaryPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  summaryPeriod: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summaryPriceLoading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  featuresCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureCheck: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 10,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  securityIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: COLORS.primary,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  installerWarning: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  installerWarningText: {
    fontSize: 12,
    color: '#E74C3C',
    textAlign: 'center',
  },
});
