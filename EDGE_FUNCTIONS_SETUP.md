# 🚀 SUPABASE EDGE FUNCTIONS SETUP GUIDE

## 📋 REQUIRED EDGE FUNCTIONS FOR GOOGLE PLAY BILLING

Your project needs **4 Edge Functions** to handle Google Play Billing:

---

## ✅ 1. CREATE-SUBSCRIPTION

**Purpose:** Create a new subscription record when user selects a plan

**File:** `supabase/functions/create-subscription/index.ts`

**Status:** ✅ Already exists

**What it does:**
- Creates a new subscription record in `user_subscriptions` table
- Handles plan changes by cancelling existing active subscriptions
- Sets subscription status to 'pending' until payment is verified
- Calculates billing cycle dates (30 days)

**Called by:** App when user initiates subscription purchase

---

## ✅ 2. VERIFY-GOOGLE-PLAY-PURCHASE

**Purpose:** Verify and activate subscription after Google Play purchase

**File:** `supabase/functions/verify-google-play-purchase/index.ts`

**Status:** ✅ Already exists

**What it does:**
- Receives purchase token and product ID from app
- Updates subscription status to 'active'
- Records payment transaction in `payment_transactions` table
- Sets billing cycle dates

**Called by:** App after successful Google Play purchase

**⚠️ Important:** Currently trusts client. In production, you should verify with Google Play Developer API.

---

## ✅ 3. CHANGE-SUBSCRIPTION-PLAN

**Purpose:** Handle plan upgrades/downgrades

**File:** `supabase/functions/change-subscription-plan/index.ts`

**Status:** ✅ Created (NEW)

**What it does:**
- Cancels current active subscription
- Creates new subscription with new plan
- Determines if it's an upgrade or downgrade
- Stores metadata about the plan change

**Called by:** App when user wants to change their plan

**Flow:**
1. User selects new plan
2. Function cancels old subscription
3. Function creates new pending subscription
4. User completes purchase in Google Play
5. `verify-google-play-purchase` activates new subscription

---

## ✅ 4. CANCEL-SUBSCRIPTION

**Purpose:** Cancel user's subscription

**File:** `supabase/functions/cancel-subscription/index.ts`

**Status:** ✅ Updated for Google Play

**What it does:**
- Updates subscription status to 'cancelled'
- Sets `cancelled_at` timestamp
- Disables auto-renewal in database

**Called by:** App when user cancels subscription

**⚠️ Important:** User must ALSO cancel in Google Play Store to stop billing!

---

## 🗂️ OPTIONAL FUNCTIONS (Currently Empty)

### payment-callback
**Status:** Empty directory (can be deleted)
**Purpose:** Was for Razorpay webhooks (not needed for Google Play)

### verify-payment
**Status:** Empty directory (can be deleted)
**Purpose:** Was for Razorpay payment verification (replaced by verify-google-play-purchase)

---

## 📁 FILE STRUCTURE

```
supabase/
└── functions/
    ├── create-subscription/
    │   └── index.ts                    ✅ Ready
    ├── verify-google-play-purchase/
    │   └── index.ts                    ✅ Ready
    ├── change-subscription-plan/
    │   └── index.ts                    ✅ Created
    ├── cancel-subscription/
    │   └── index.ts                    ✅ Updated
    ├── payment-callback/               ❌ Empty (delete)
    ├── verify-payment/                 ❌ Empty (delete)
    ├── deno.json
    └── import_map.json
```

---

## 🚀 DEPLOYMENT STEPS

### 1. Deploy All Functions

```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy individually
supabase functions deploy create-subscription
supabase functions deploy verify-google-play-purchase
supabase functions deploy change-subscription-plan
supabase functions deploy cancel-subscription
```

### 2. Set Environment Variables

In Supabase Dashboard → Edge Functions → Settings:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Optional (for future Google Play API verification):**
```bash
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=your_service_account_json
```

### 3. Test Functions

Use Supabase Dashboard → Edge Functions → Test to verify each function works.

---

## 🔧 FUNCTION ENDPOINTS

After deployment, your functions will be available at:

```
https://[project-id].supabase.co/functions/v1/create-subscription
https://[project-id].supabase.co/functions/v1/verify-google-play-purchase
https://[project-id].supabase.co/functions/v1/change-subscription-plan
https://[project-id].supabase.co/functions/v1/cancel-subscription
```

---

## 📝 HOW THEY WORK TOGETHER

### Purchase Flow:
```
1. User selects plan
   ↓
2. App calls: create-subscription
   → Creates pending subscription
   ↓
3. App initiates Google Play purchase
   → User completes payment in Google Play
   ↓
4. App receives purchase token
   ↓
5. App calls: verify-google-play-purchase
   → Activates subscription
   → Records payment
```

### Plan Change Flow:
```
1. User selects new plan
   ↓
2. App calls: change-subscription-plan
   → Cancels old subscription
   → Creates new pending subscription
   ↓
3. App initiates Google Play purchase for new plan
   ↓
4. App calls: verify-google-play-purchase
   → Activates new subscription
```

### Cancellation Flow:
```
1. User clicks cancel
   ↓
2. App calls: cancel-subscription
   → Updates database status
   ↓
3. App shows message: "Also cancel in Google Play Store"
   ↓
4. User cancels in Play Store
   → Stops future billing
```

---

## ⚠️ IMPORTANT NOTES

### 1. Google Play Cancellation
- Cancelling in your app only updates the database
- User MUST also cancel in Google Play Store to stop billing
- Consider adding a deep link to Play Store subscription management

### 2. Purchase Verification
- Current implementation trusts the client
- **Production:** Implement Google Play Developer API verification
- Prevents fraudulent purchases

### 3. Webhook Integration (Future)
- Set up Google Play Real-time Developer Notifications
- Automatically handle subscription renewals, cancellations, etc.
- Update database when Google Play events occur

### 4. Error Handling
- All functions return proper error messages
- Check function logs in Supabase Dashboard
- Monitor for failed transactions

---

## 🧪 TESTING CHECKLIST

- [ ] Deploy all 4 functions
- [ ] Set environment variables
- [ ] Test create-subscription with valid plan_id
- [ ] Test verify-google-play-purchase with mock data
- [ ] Test change-subscription-plan with existing subscription
- [ ] Test cancel-subscription with active subscription
- [ ] Verify database records are created/updated correctly
- [ ] Check function logs for errors

---

## 🔍 DEBUGGING

### View Function Logs:
```bash
# In Supabase Dashboard
Edge Functions → [Function Name] → Logs

# Or via CLI
supabase functions logs create-subscription
```

### Common Issues:

**1. "Missing required fields"**
- Check request body has all required parameters
- Verify parameter names match exactly

**2. "Subscription not found"**
- Ensure subscription_id exists in database
- Check user_id matches authenticated user

**3. "Invalid plan ID"**
- Verify plan_id exists in subscription_plans table
- Check plan is active (is_active = true)

**4. CORS errors**
- Functions include CORS headers
- Check OPTIONS request handling

---

## 📞 SUPPORT

If you encounter issues:

1. Check function logs in Supabase Dashboard
2. Verify environment variables are set
3. Test with Supabase function testing tool
4. Check database tables have correct schema
5. Ensure RLS policies allow function access

---

## ✅ SUMMARY

All 4 required Edge Functions are now ready:

1. ✅ **create-subscription** - Creates new subscriptions
2. ✅ **verify-google-play-purchase** - Verifies and activates purchases
3. ✅ **change-subscription-plan** - Handles plan changes
4. ✅ **cancel-subscription** - Cancels subscriptions

**Next Steps:**
1. Deploy functions: `supabase functions deploy`
2. Set environment variables in Supabase Dashboard
3. Test each function
4. Integrate with your app
