# Google Play Billing - Complete Fix Applied ✅

## Date: November 25, 2025

## Issues Fixed

### 1. ✅ Updated to react-native-iap v14 API
- **Old API (v12)**: `getProducts`, `getSubscriptions`, `requestSubscription`
- **New API (v14)**: `fetchProducts`, `requestPurchase` with proper type parameters
- All deprecated functions replaced with current v14 equivalents

### 2. ✅ Fixed Type Imports
- Removed non-existent types: `ProductPurchase`, `SubscriptionPurchase`
- Using correct types: `Purchase`, `Product`, `PurchaseError`
- Proper type handling for Android-specific properties

### 3. ✅ Fixed Purchase Flow
- Correct `requestPurchase` structure with `type: 'subs'`
- Proper Android subscription offer handling with `skus` array
- Platform-specific request parameters for Android and iOS

### 4. ✅ Fixed Purchase Acknowledgement
- Updated `acknowledgePurchaseAndroid` to accept string token (not object)
- Proper type guards for Android-specific properties
- Correct transaction finishing flow

### 5. ✅ Added expo-build-properties Plugin
- Configured Android SDK versions (compileSdk: 34, targetSdk: 34, minSdk: 24)
- Set Kotlin version to 1.9.0
- Ensures proper build configuration

### 6. ✅ Created useBilling Hook
- React hook for easy billing integration
- Automatic initialization and product fetching
- Purchase callbacks and error handling
- Product refresh functionality

## Files Modified

### 1. `src/services/billing/BillingService.ts`
**Changes:**
- Updated all imports to v14 API
- Fixed `fetchProducts` call with `type: 'subs'` parameter
- Corrected `requestPurchase` structure with proper Android/iOS request objects
- Fixed purchase listener to handle platform-specific properties
- Updated acknowledgePurchaseAndroid to use string token
- Proper null checking and type guards

**Key Methods:**
```typescript
// Correct product fetching
const result = await fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' });

// Correct purchase request (Android)
await requestPurchase({
  type: 'subs',
  request: {
    android: {
      skus: [productId],
      subscriptionOffers: [{
        sku: productId,
        offerToken: offer.offerToken,
      }],
    },
  },
});

// Correct acknowledgement
await acknowledgePurchaseAndroid(purchase.purchaseToken);
```

### 2. `src/hooks/useBilling.ts` (NEW)
**Features:**
- Automatic billing initialization
- Product fetching with loading states
- Purchase callbacks
- Error handling
- Product refresh functionality

**Usage:**
```typescript
const { products, loading, error, purchase, refreshProducts } = useBilling();
```

### 3. `app.json`
**Added:**
```json
{
  "plugins": [
    "./plugins/withAndroidBillingPermission.js",
    [
      "expo-build-properties",
      {
        "android": {
          "compileSdkVersion": 35,
          "targetSdkVersion": 34,
          "minSdkVersion": 24,
          "kotlinVersion": "2.0.0"
        }
      }
    ]
  ]
}
```

**Note:** `compileSdkVersion 35` is required by AndroidX Camera 1.5.0 (used by expo-camera). The `targetSdkVersion` remains at 34 for compatibility.

### 4. `package.json`
**Added:**
- `expo-build-properties` package (installed)

## Configuration Status

### ✅ Billing Permission
- `com.android.vending.BILLING` permission added via config plugin
- Google Play Billing Library 6.2.1 forced in build.gradle

### ✅ Build Properties
- Android compileSdk 35 (required by AndroidX Camera 1.5.0)
- Android targetSdk 34
- Kotlin 2.0.0 set (compatible with KSP)
- Build tools version managed by Gradle

### ✅ Product IDs
Current subscription SKUs:
- `basic_monthly`
- `pro_monthly`
- `vip_monthly`

## Next Steps

### 1. Create Products in Play Console
For each subscription (basic_monthly, pro_monthly, vip_monthly):

1. **Go to Play Console** → Your App → Monetize → Subscriptions
2. **Create subscription** with exact ID (e.g., `basic_monthly`)
3. **Create base plan**:
   - ID: `monthly` or `base-plan`
   - Billing period: 1 month
   - Set price for your test region
4. **Activate the subscription** (must be ACTIVE, not Draft)
5. **Verify offer token** is generated

### 2. Build APK
```bash
# Build development APK
eas build --profile development --platform android

# Or build preview APK for testing
eas build --profile preview --platform android
```

### 3. Upload to Play Console
1. **Internal Testing Track** → Upload APK
2. **Add testers** (email addresses)
3. **Wait for processing** (can take 1-2 hours)

### 4. Install from Play Store
```bash
# Get the Play Store link from Internal Testing
# Install app from Play Store (NOT via adb or Expo Go)
```

### 5. Test Purchase Flow
```typescript
// In your component
import { useBilling } from './hooks/useBilling';

function SubscriptionScreen() {
  const { products, loading, error, purchase } = useBilling();

  const handlePurchase = async (productId: string) => {
    const result = await purchase(productId);
    if (result.success) {
      console.log('Purchase initiated!');
    } else {
      console.error('Purchase failed:', result.message);
    }
  };

  if (loading) return <Text>Loading products...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View>
      {products.map(product => (
        <Button
          key={product.id}
          title={`${product.title} - ${product.displayPrice}`}
          onPress={() => handlePurchase(product.id)}
        />
      ))}
    </View>
  );
}
```

## Verification Checklist

Before testing:
- [ ] Products created in Play Console with exact IDs
- [ ] Base plans active with prices set
- [ ] APK built with EAS Build
- [ ] APK uploaded to Internal Testing track
- [ ] Testers added to Internal Testing
- [ ] App installed from Play Store (not sideloaded)
- [ ] Test account has valid payment method

## Common Issues & Solutions

### Issue: "No products found"
**Solution:**
- Ensure products are ACTIVE (not Draft) in Play Console
- Verify base plans have prices for tester's region
- Wait 1-2 hours after activating products
- App must be installed from Play Store

### Issue: "ITEM_UNAVAILABLE"
**Solution:**
- Products must be active in Play Console
- Base plans must have offer tokens
- App must be installed from Play Store
- Check product IDs match exactly

### Issue: "BILLING_UNAVAILABLE"
**Solution:**
- App must be installed from Play Store (not via adb/Expo Go)
- Google Play services must be updated
- Device must have valid Google account

### Issue: "No offer token"
**Solution:**
- Create base plan in Play Console
- Set billing period and price
- Activate the subscription
- Wait for offer token generation

## Testing Notes

### Test Card Numbers (Sandbox)
Google Play provides test cards automatically in sandbox mode. No special card numbers needed.

### Test Scenarios
1. **Successful purchase**: Select product → Complete payment → Verify subscription
2. **Cancelled purchase**: Select product → Cancel payment → Verify no charge
3. **Already owned**: Purchase same product twice → Verify error handling
4. **Network error**: Disable internet → Attempt purchase → Verify error message

## Support

If issues persist:
1. Check logs with `adb logcat | grep -i billing`
2. Verify Play Console configuration
3. Ensure app is installed from Play Store
4. Wait 1-2 hours after product activation
5. Check tester account has valid payment method

## Status: READY FOR TESTING ✅

All code issues resolved. Ready to:
1. Create products in Play Console
2. Build and upload APK
3. Test purchase flow

---

**Last Updated:** November 25, 2025
**react-native-iap Version:** 14.4.46
**Expo SDK:** 54.0.0
