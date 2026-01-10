/**
 * Subscription Debug Panel
 * Shows subscription state for debugging
 * Only visible in development mode
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';
import { useBilling } from '../hooks/useBilling';
import { getUserQuota, QuotaInfo } from '../hooks/useQuota';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../config/constants';

export const SubscriptionDebugPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const { state: subscriptionState, refreshSubscription } = useSubscription();
  const { diagnostics } = useBilling();
  const { user } = useAuth();

  // Load quota info when subscription state changes
  useEffect(() => {
    if (subscriptionState.isSubscribed && user) {
      loadQuotaInfo();
    } else {
      setQuotaInfo(null);
    }
  }, [subscriptionState.isSubscribed, user]);

  const loadQuotaInfo = async () => {
    if (!user) return;
    const quota = await getUserQuota(user.id);
    setQuotaInfo(quota);
  };

  // Only show in development
  if (!__DEV__) {
    return null;
  }

  if (!isExpanded) {
    return (
      <TouchableOpacity
        style={styles.collapsedButton}
        onPress={() => setIsExpanded(true)}
      >
        <Text style={styles.collapsedButtonText}>🔍 Debug</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Subscription Debug</Text>
        <TouchableOpacity onPress={() => setIsExpanded(false)}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Subscription State */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Client State (useSubscription)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Loading:</Text>
            <Text style={[styles.value, subscriptionState.loading ? styles.warning : styles.success]}>
              {subscriptionState.loading ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Is Subscribed:</Text>
            <Text style={[styles.value, subscriptionState.isSubscribed ? styles.success : styles.error]}>
              {subscriptionState.isSubscribed ? '✅ Yes' : '❌ No'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Active Plan:</Text>
            <Text style={styles.value}>{subscriptionState.activePlan || 'None'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Product ID:</Text>
            <Text style={styles.valueSmall}>{subscriptionState.productId || 'None'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Last Checked:</Text>
            <Text style={styles.valueSmall}>
              {subscriptionState.lastCheckedAt
                ? new Date(subscriptionState.lastCheckedAt).toLocaleTimeString()
                : 'Never'}
            </Text>
          </View>
        </View>

        {/* Billing Diagnostics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Billing Diagnostics</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Initialized:</Text>
            <Text style={[styles.value, diagnostics.initialized ? styles.success : styles.error]}>
              {diagnostics.initialized ? '✅ Yes' : '❌ No'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Subscriptions Supported:</Text>
            <Text style={[styles.value, diagnostics.subscriptionsSupported ? styles.success : styles.error]}>
              {diagnostics.subscriptionsSupported ? '✅ Yes' : '❌ No'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Installer:</Text>
            <Text style={styles.valueSmall}>{diagnostics.installerPackage || 'unknown'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Is Play Store:</Text>
            <Text style={[styles.value, diagnostics.installerIsPlayStore ? styles.success : styles.error]}>
              {diagnostics.installerIsPlayStore ? '✅ Yes' : '❌ No'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Products Loaded:</Text>
            <Text style={styles.value}>{diagnostics.productsCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Billing Client:</Text>
            <Text style={styles.valueSmall}>{diagnostics.billingClientVersion}</Text>
          </View>
        </View>

        {/* Quota Information */}
        {subscriptionState.isSubscribed && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Quota Information</Text>
            {quotaInfo ? (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Analyses Used:</Text>
                  <Text style={styles.value}>{quotaInfo.analysesUsed}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Analyses Limit:</Text>
                  <Text style={styles.value}>{quotaInfo.analysesLimit}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Analyses Remaining:</Text>
                  <Text style={[styles.value, quotaInfo.analysesRemaining === 0 ? styles.error : styles.success]}>
                    {quotaInfo.analysesRemaining}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Needs Reset:</Text>
                  <Text style={[styles.value, quotaInfo.needsReset ? styles.warning : styles.success]}>
                    {quotaInfo.needsReset ? '⚠️ Yes' : '✅ No'}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.valueSmall}>Loading quota...</Text>
            )}
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={async () => {
            console.log('🔄 Manual refresh triggered from debug panel');
            await refreshSubscription();
            if (user) {
              await loadQuotaInfo();
            }
          }}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh Subscription & Quota</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  collapsedButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  collapsedButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    maxHeight: '70%',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    fontSize: 24,
    color: '#FFF',
    paddingHorizontal: 10,
  },
  content: {
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
    textAlign: 'right',
  },
  valueSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
    textAlign: 'right',
  },
  success: {
    color: '#2ECC71',
  },
  error: {
    color: '#E74C3C',
  },
  warning: {
    color: '#F39C12',
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
