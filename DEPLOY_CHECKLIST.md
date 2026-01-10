# ✅ DEPLOYMENT CHECKLIST

## 🎯 COMPLETE THIS BEFORE TESTING

---

## 1️⃣ DATABASE MIGRATION

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Run `add-google-play-columns.sql`
- [ ] Verify output shows 3 plans with product IDs
- [ ] Check columns added to `user_subscriptions` table

**Verification Query:**
```sql
SELECT plan_name, google_play_product_id 
FROM subscription_plans;
```

**Expected Output:**
```
Basic  | musicleai.basic.monthly
Pro    | musicleai.pro.monthly
VIP    | musicleai.vip.monthly
```

---

## 2️⃣ EDGE FUNCTIONS DEPLOYMENT

- [ ] Login to Supabase CLI: `supabase login`
- [ ] Link project: `supabase link --project-ref YOUR_PROJECT_REF`
- [ ] Deploy functions: `supabase functions deploy`

**Or deploy individually:**
```bash
supabase functions deploy create-subscription
supabase functions deploy verify-google-play-purchase
supabase functions deploy change-subscription-plan
supabase functions deploy cancel-subscription
```

**Verify in Dashboard:**
- [ ] Go to Edge Functions section
- [ ] See all 4 functions listed
- [ ] Each shows "Active" status

---

## 3️⃣ ENVIRONMENT VARIABLES

- [ ] Open Supabase Dashboard
- [ ] Go to Edge Functions → Settings
- [ ] Add these variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find:**
- Dashboard → Settings → API → Project URL
- Dashboard → Settings → API → service_role (secret key)

---

## 4️⃣ TEST EDGE FUNCTIONS

Test each function in Supabase Dashboard:

### Test create-subscription:
```json
{
  "plan_id": "paste-uuid-from-subscription_plans",
  "user_id": "paste-uuid-from-auth-users"
}
```

- [ ] Returns `success: true`
- [ ] Returns `subscription_id`
- [ ] No errors in logs

### Test verify-google-play-purchase:
```json
{
  "purchase_token": "test-token",
  "product_id": "musicleai.basic.monthly",
  "user_id": "paste-uuid",
  "subscription_id": "paste-uuid"
}
```

- [ ] Returns `verified: true`
- [ ] No errors in logs

---

## 5️⃣ APP CODE VERIFICATION

- [ ] Product IDs in code match Play Console:
  - `musicleai.basic.monthly` ✅
  - `musicleai.pro.monthly` ✅
  - `musicleai.vip.monthly` ✅

- [ ] Files updated:
  - `src/services/billing/BillingService.ts` ✅
  - `src/screens/GooglePlayPaymentScreen.tsx` ✅
  - `src/screens/SubscriptionPlansScreen.tsx` ✅

---

## 6️⃣ GOOGLE PLAY CONSOLE

- [ ] Products created with exact IDs:
  - `musicleai.basic.monthly`
  - `musicleai.pro.monthly`
  - `musicleai.vip.monthly`

- [ ] Base plans are ACTIVE:
  - `basic-monthly` → Active
  - `pro-monthly` → Active
  - `vip-monthly` → Active

- [ ] Prices set for your region
- [ ] Billing period: 1 month

---

## 7️⃣ BUILD & DEPLOY APP

- [ ] Rebuild app: `eas build --platform android --profile production`
- [ ] Upload to Play Console (Internal Testing)
- [ ] Install from Play Store (NOT sideload)

---

## 8️⃣ TEST IN APP

- [ ] Open app installed from Play Store
- [ ] Navigate to Subscription Plans
- [ ] **Check info icon appears** (top-right corner)
- [ ] Tap info icon → See diagnostics
- [ ] Verify diagnostics show:
  - Initialized: ✅ Yes
  - Subscriptions Supported: ✅ Yes
  - Products Loaded: 3

- [ ] Select a plan
- [ ] Complete Google Play purchase
- [ ] Verify subscription activates

---

## 🚨 TROUBLESHOOTING

### Info Icon Not Showing?
1. Restart app completely
2. Check if `MaterialCommunityIcons` is imported
3. Clear cache: `npm start -- --reset-cache`

### Edge Function Errors?
1. Check environment variables are set
2. View function logs in Dashboard
3. Verify functions are deployed
4. Test functions in Dashboard first

### Products Not Loading?
1. Verify product IDs match exactly
2. Check Play Console products are ACTIVE
3. Ensure app installed from Play Store
4. Check billing diagnostics (tap info icon)

---

## ✅ FINAL VERIFICATION

Before considering deployment complete:

- [ ] Database has Google Play columns
- [ ] All 4 Edge Functions deployed
- [ ] Environment variables set
- [ ] Edge Functions tested successfully
- [ ] Product IDs match everywhere
- [ ] Google Play products are ACTIVE
- [ ] App rebuilt and uploaded
- [ ] Info icon visible in app
- [ ] Diagnostics show all green
- [ ] Test purchase completes successfully

---

## 📊 SUCCESS CRITERIA

You'll know everything is working when:

1. ✅ Info icon appears in Subscription Plans screen
2. ✅ Diagnostics show "Initialized: Yes"
3. ✅ Diagnostics show "Subscriptions Supported: Yes"
4. ✅ Diagnostics show "Products Loaded: 3"
5. ✅ All 3 plans display with correct prices
6. ✅ Purchase flow completes without errors
7. ✅ Subscription activates in database

---

## 🎯 CURRENT STATUS

Based on your issue:

- ❌ Edge Functions may not be deployed
- ❌ Environment variables may not be set
- ❌ Info icon not showing (FIXED in code)

**Next Steps:**
1. Deploy Edge Functions
2. Set environment variables
3. Restart app to see info icon
4. Test purchase flow

---

**See `TROUBLESHOOTING_EDGE_FUNCTIONS.md` for detailed help!**
