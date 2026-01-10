# 🚀 Quick Reference - Google Play Billing

## ⚡ Quick Commands

```bash
# Install dependencies
npm install

# Clear cache and start
npx expo start --clear

# Build production AAB
eas build --platform android --profile production

# Check build status
eas build:list

# View specific build
eas build:view [build-id]
```

---

## 📦 Product IDs (Use in Play Console)

| Plan | Product ID | Price |
|------|-----------|-------|
| Basic | `basic_monthly` | $4.99/month |
| Pro | `pro_monthly` | $9.99/month |
| VIP | `vip_monthly` | $19.99/month |

---

## 🔧 Required Code Changes

### 1. Update Navigation (REQUIRED)

```typescript
// Replace this import
import { PaymentScreen } from './src/screens/PaymentScreen';

// With this
import { GooglePlayPaymentScreen } from './src/screens/GooglePlayPaymentScreen';

// Update Stack.Screen
<Stack.Screen 
  name="Payment" 
  component={GooglePlayPaymentScreen} 
/>
```

### 2. Initialize IAP (REQUIRED)

Add to `App.tsx`:

```typescript
import * as RNIap from 'react-native-iap';

useEffect(() => {
  RNIap.initConnection();
  
  const purchaseUpdate = RNIap.purchaseUpdatedListener(async (purchase) => {
    // Verify with backend
    await supabase.functions.invoke('verify-google-play-purchase', {
      body: {
        purchase_token: purchase.purchaseToken,
        product_id: purchase.productId,
        user_id: currentUserId,
      },
    });
    await RNIap.finishTransaction(purchase);
  });

  return () => {
    purchaseUpdate.remove();
    RNIap.endConnection();
  };
}, []);
```

---

## 🎮 Play Console Setup

### 1. Create Subscriptions
```
Monetization → Subscriptions → Create subscription
- Add product ID (basic_monthly, pro_monthly, vip_monthly)
- Set price
- Set billing period (1 month)
- Activate
```

### 2. Add Test Accounts
```
Setup → License testing
- Add Gmail accounts
- Save
```

### 3. Publish to Testing
```
Release → Internal Testing → Create release
- Upload AAB
- Add release notes
- Review and roll out
```

---

## ✅ Verification

### Check Razorpay Removed
```bash
# Should return nothing
grep -r "razorpay" src/
grep -r "Razorpay" src/

# Should show "not found"
npm list react-native-razorpay
```

### Check Google Play Added
```bash
# Should show version 14.4.46
npm list react-native-iap

# Should exist
dir src\screens\GooglePlayPaymentScreen.tsx
```

---

## 🧪 Testing Flow

1. **Install** from Internal Testing track
2. **Sign in** with test account
3. **Navigate** to subscription plans
4. **Select** a plan
5. **Complete** purchase (free for test accounts)
6. **Verify** subscription activates
7. **Check** features unlock

---

## 🆘 Common Issues

### IAP not initializing
- Check BILLING permission in manifest
- Install from Play Store (not sideload)
- Verify Billing Library 6.2.1

### Products not loading
- Verify product IDs match Play Console
- Ensure products are active
- App must be published to testing track

### Purchase fails
- Add test account in Play Console
- Install from Internal Testing
- Check internet connection

---

## 📁 Key Files

### Created
- `src/screens/GooglePlayPaymentScreen.tsx`
- `supabase/functions/create-subscription/index.ts`
- `supabase/functions/verify-google-play-purchase/index.ts`

### Modified
- `package.json` (added react-native-iap)
- `.env` (removed Razorpay)
- `src/screens/SubscriptionPlansScreen.tsx`
- `src/services/subscriptionService.ts`

### Deleted
- `src/screens/PaymentScreen.tsx`
- `supabase/functions/webhook-razorpay/`
- `supabase/functions/verify-payment/`
- `supabase/functions/payment-callback/`

---

## 📚 Documentation

- **MIGRATION_COMPLETE_SUMMARY.md** - What was done
- **RAZORPAY_TO_GOOGLE_PLAY_MIGRATION.md** - Detailed guide
- **GOOGLE_PLAY_BILLING_COMPLETE_GUIDE.md** - Setup guide

---

## 🎯 Next Steps

1. ✅ Razorpay removed
2. ✅ Google Play Billing added
3. ⏳ Update navigation
4. ⏳ Add IAP initialization
5. ⏳ Build with EAS
6. ⏳ Configure Play Console
7. ⏳ Test
8. ⏳ Launch!

---

**Status**: Ready to build! 🚀
