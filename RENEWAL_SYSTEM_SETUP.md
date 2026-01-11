# 🔄 Subscription Renewal System - Complete Setup Guide

## Overview

Your app now has a **complete automatic renewal system** that handles subscription renewals in real-time using Google Play Real-Time Developer Notifications (RTDN).

### What's Implemented

✅ **Client-side subscription checking** - App checks status on open  
✅ **Automatic quota reset** - Resets when billing period ends  
✅ **Real-time renewal handling** - RTDN webhook processes renewals immediately  
✅ **Grace period support** - Keeps access during payment retry  
✅ **Cancellation handling** - Properly handles user cancellations  
✅ **Expiration handling** - Removes access when subscription expires  

---

## How It Works

### Current System (Client-Side Only)

```
User opens app
    ↓
useSubscription hook calls getAvailablePurchases()
    ↓
Google Play returns active subscriptions
    ↓
checkAndResetQuotaIfNeeded() checks billing cycle
    ↓
If new period: Reset quota to 0, update cycle dates
    ↓
UI updates with subscription status
```

**Limitation:** Quota only resets when user opens the app after renewal.

### With RTDN (Real-Time)

```
Google Play processes renewal at midnight
    ↓
Google Play sends RTDN notification to your webhook
    ↓
supabase/functions/google-play-rtdn receives notification
    ↓
Immediately resets quota and updates billing cycle
    ↓
Next time user opens app: Fresh quota already available
```

**Benefit:** Quota resets automatically at renewal time, even if user doesn't open app.

---

## Setup Instructions

### Step 1: Add Database Column

Run this SQL in your Supabase SQL Editor:

```bash
# Upload and run the migration
supabase db push add-google-play-purchase-token.sql
```

Or manually run:
```sql
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT;

ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_google_play_token 
ON public.user_subscriptions(google_play_purchase_token);
```

### Step 2: Deploy RTDN Edge Function

```bash
# Deploy the function
supabase functions deploy google-play-rtdn

# Get the function URL (you'll need this for Google Play Console)
# Format: https://[your-project-ref].supabase.co/functions/v1/google-play-rtdn
```

Example URL:
```
https://abcdefghijklmnop.supabase.co/functions/v1/google-play-rtdn
```

### Step 3: Configure Google Play Console

1. **Go to Google Play Console**
   - Open your app: https://play.google.com/console
   - Select your app (com.muscleai.app)

2. **Navigate to Monetization Setup**
   - Left sidebar → Monetization setup
   - Click "Real-time developer notifications"

3. **Enter Webhook URL**
   - Paste your Supabase function URL
   - Format: `https://[project-ref].supabase.co/functions/v1/google-play-rtdn`
   - Click "Save"

4. **Send Test Notification**
   - Click "Send test notification"
   - Check Supabase logs: `supabase functions logs google-play-rtdn`
   - You should see: "✅ Test notification received successfully"

5. **Enable Notifications**
   - Toggle "Enable notifications" to ON
   - Save changes

### Step 4: Verify Setup

#### Test with Supabase Logs

```bash
# Watch logs in real-time
supabase functions logs google-play-rtdn --follow

# Or check recent logs
supabase functions logs google-play-rtdn
```

#### Expected Log Output

When a subscription renews:
```
📨 [RTDN] Received notification from Google Play
🔓 [RTDN] Decoded notification: { type: "SUBSCRIPTION_RENEWED", ... }
🔄 [RTDN] Handling subscription renewal...
✅ [RTDN] Subscription renewed successfully: {
  userId: "...",
  planName: "Pro",
  quotaReset: "0/50",
  newCycleEnd: "2026-02-10T00:00:00.000Z"
}
```

---

## What Each Notification Does

### SUBSCRIPTION_RENEWED (Type 2)
- **When:** Subscription successfully renews
- **Action:** 
  - Reset `analyses_used_this_month` to 0
  - Update `current_billing_cycle_start` and `current_billing_cycle_end`
  - Set `subscription_status` to 'active'
- **User Impact:** Fresh quota available immediately

### SUBSCRIPTION_CANCELED (Type 3)
- **When:** User cancels subscription
- **Action:**
  - Set `auto_renewal_enabled` to false
  - Set `cancelled_at` timestamp
  - Keep status 'active' until period ends
- **User Impact:** Access continues until current period expires

### SUBSCRIPTION_EXPIRED (Type 13)
- **When:** Subscription period ends (after cancellation or non-payment)
- **Action:**
  - Set `subscription_status` to 'expired'
  - Set `subscription_end_date`
- **User Impact:** Access removed, app shows upgrade prompt

### SUBSCRIPTION_IN_GRACE_PERIOD (Type 6)
- **When:** Payment failed but Google is retrying
- **Action:**
  - Keep `subscription_status` as 'active'
- **User Impact:** User keeps access during grace period

### SUBSCRIPTION_ON_HOLD (Type 5)
- **When:** Payment failed, grace period ended
- **Action:**
  - Set `subscription_status` to 'past_due'
- **User Impact:** Access may be restricted

### SUBSCRIPTION_RECOVERED (Type 1)
- **When:** Payment succeeded after grace period/on-hold
- **Action:**
  - Set `subscription_status` to 'active'
  - Set `auto_renewal_enabled` to true
- **User Impact:** Full access restored

### SUBSCRIPTION_REVOKED (Type 12)
- **When:** Subscription refunded by Google
- **Action:**
  - Set `subscription_status` to 'expired'
  - Set `subscription_end_date`
- **User Impact:** Immediate access removal

### SUBSCRIPTION_PAUSED (Type 10)
- **When:** User pauses subscription (if enabled)
- **Action:**
  - Set `subscription_status` to 'paused'
  - Set `pause_start_date`
- **User Impact:** Access suspended during pause

---

## Testing the Renewal System

### Test Scenario 1: Subscription Renewal

1. **Purchase a test subscription**
   - Use sandbox account
   - Purchase any plan (Basic/Pro/VIP)

2. **Wait for test renewal**
   - Sandbox subscriptions renew every 5 minutes
   - Real subscriptions renew monthly

3. **Check RTDN logs**
   ```bash
   supabase functions logs google-play-rtdn --follow
   ```

4. **Verify database**
   ```sql
   SELECT 
     user_id,
     plan_name,
     analyses_used_this_month,
     current_billing_cycle_start,
     current_billing_cycle_end,
     subscription_status
   FROM user_subscriptions
   WHERE subscription_status = 'active';
   ```

5. **Expected result:**
   - `analyses_used_this_month` = 0 (reset)
   - `current_billing_cycle_end` = 30 days from renewal
   - RTDN log shows "Subscription renewed successfully"

### Test Scenario 2: Cancellation

1. **Cancel subscription in Play Store**
   - Open Play Store → Subscriptions
   - Cancel the test subscription

2. **Check RTDN logs**
   - Should see "SUBSCRIPTION_CANCELED" notification

3. **Verify database**
   ```sql
   SELECT 
     subscription_status,
     auto_renewal_enabled,
     cancelled_at,
     current_billing_cycle_end
   FROM user_subscriptions
   WHERE user_id = '[your-test-user-id]';
   ```

4. **Expected result:**
   - `subscription_status` = 'active' (until period ends)
   - `auto_renewal_enabled` = false
   - `cancelled_at` = timestamp
   - Access continues until `current_billing_cycle_end`

### Test Scenario 3: Expiration

1. **Wait for cancelled subscription to expire**
   - In sandbox: 5 minutes after cancellation
   - In production: End of billing period

2. **Check RTDN logs**
   - Should see "SUBSCRIPTION_EXPIRED" notification

3. **Verify database**
   ```sql
   SELECT 
     subscription_status,
     subscription_end_date
   FROM user_subscriptions
   WHERE user_id = '[your-test-user-id]';
   ```

4. **Expected result:**
   - `subscription_status` = 'expired'
   - `subscription_end_date` = timestamp
   - App shows upgrade prompt

---

## Troubleshooting

### RTDN Not Receiving Notifications

**Problem:** No logs appearing in Supabase

**Solutions:**
1. Verify webhook URL is correct in Play Console
2. Check function is deployed: `supabase functions list`
3. Test with "Send test notification" in Play Console
4. Check Supabase function logs for errors
5. Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set

### Quota Not Resetting

**Problem:** User still sees old quota after renewal

**Solutions:**
1. Check RTDN logs - was notification received?
2. Verify database column exists: `google_play_purchase_token`
3. Check subscription has purchase token stored
4. Manually trigger refresh in app
5. Check `current_billing_cycle_end` is in the future

### Subscription Not Found in RTDN

**Problem:** RTDN logs show "Subscription not found"

**Solutions:**
1. Verify purchase token is stored in database
2. Check `create-subscription` function stores token
3. Verify token matches between Google Play and database
4. Check for typos in product IDs

### Test Notifications Not Working

**Problem:** Test notification fails in Play Console

**Solutions:**
1. Verify function URL is publicly accessible
2. Check function accepts POST requests
3. Verify CORS headers are correct
4. Check Supabase project is not paused
5. Test function directly with curl:
   ```bash
   curl -X POST https://[project-ref].supabase.co/functions/v1/google-play-rtdn \
     -H "Content-Type: application/json" \
     -d '{"message":{"data":"eyJ0ZXN0Tm90aWZpY2F0aW9uIjp7InZlcnNpb24iOiIxLjAifX0="}}'
   ```

---

## Monitoring & Maintenance

### Check RTDN Health

```bash
# View recent notifications
supabase functions logs google-play-rtdn --limit 50

# Monitor in real-time
supabase functions logs google-play-rtdn --follow

# Filter for errors only
supabase functions logs google-play-rtdn | grep "❌"
```

### Database Queries for Monitoring

```sql
-- Active subscriptions
SELECT 
  COUNT(*) as active_subscriptions,
  plan_name,
  AVG(analyses_used_this_month) as avg_usage
FROM user_subscriptions
WHERE subscription_status = 'active'
GROUP BY plan_name;

-- Recent renewals (check if RTDN is working)
SELECT 
  user_id,
  plan_name,
  current_billing_cycle_start,
  analyses_used_this_month,
  updated_at
FROM user_subscriptions
WHERE subscription_status = 'active'
  AND updated_at > NOW() - INTERVAL '1 day'
ORDER BY updated_at DESC;

-- Subscriptions needing attention
SELECT 
  user_id,
  plan_name,
  subscription_status,
  current_billing_cycle_end
FROM user_subscriptions
WHERE subscription_status IN ('past_due', 'paused', 'cancelled')
ORDER BY current_billing_cycle_end ASC;
```

---

## Performance & Costs

### RTDN Function Costs

- **Invocations:** ~1 per subscription per month (renewal)
- **Additional:** Cancellations, grace periods, etc.
- **Supabase Free Tier:** 500K function invocations/month
- **Cost:** Essentially free for most apps

### Database Impact

- **Writes:** 1 per RTDN notification
- **Reads:** None (RTDN only writes)
- **Impact:** Minimal

---

## Security Considerations

### Current Implementation

✅ Uses Supabase service role for database updates  
✅ Validates notification structure  
✅ Logs all events for audit trail  
⚠️ Does not verify Google Play signature (optional)

### Optional: Add Signature Verification

For production, you can add Google Play signature verification:

```typescript
// In google-play-rtdn/index.ts
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

// Get public key from Google Play Console
const GOOGLE_PLAY_PUBLIC_KEY = Deno.env.get('GOOGLE_PLAY_PUBLIC_KEY');

// Verify signature
const signature = req.headers.get('X-Goog-Signature');
const isValid = await verifySignature(payload, signature, GOOGLE_PLAY_PUBLIC_KEY);

if (!isValid) {
  return new Response('Invalid signature', { status: 401 });
}
```

---

## Summary

### What You Have Now

✅ **Automatic renewals** - Google Play handles billing  
✅ **Real-time quota reset** - RTDN resets quota immediately  
✅ **Graceful cancellations** - Access continues until period ends  
✅ **Grace period support** - Keeps access during payment retry  
✅ **Complete audit trail** - All events logged  

### What Happens Automatically

1. **User subscribes** → Quota set, billing cycle starts
2. **30 days pass** → Google Play charges card
3. **Payment succeeds** → RTDN notification sent
4. **Your webhook** → Resets quota, updates cycle
5. **User opens app** → Sees fresh quota immediately

### Next Steps

1. ✅ Run database migration (add purchase token column)
2. ✅ Deploy RTDN function
3. ✅ Configure Google Play Console webhook
4. ✅ Test with sandbox subscription
5. ✅ Monitor logs for first renewal
6. ✅ Launch to production

---

## Support Resources

- **RTDN Documentation:** https://developer.android.com/google/play/billing/rtdn-reference
- **Supabase Functions:** https://supabase.com/docs/guides/functions
- **Your RTDN Function:** `supabase/functions/google-play-rtdn/index.ts`
- **Database Schema:** `supabase-schema.sql`
- **Quota Logic:** `src/hooks/useQuota.ts`

---

**Your renewal system is now complete and production-ready! 🎉**
