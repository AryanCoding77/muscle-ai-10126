# 🔄 Renewal System - Quick Reference

## Current Status

✅ **RTDN Function:** `supabase/functions/google-play-rtdn/index.ts` - Complete  
✅ **Quota Reset Logic:** `src/hooks/useQuota.ts` - Implemented  
✅ **Client-Side Check:** `src/hooks/useSubscription.ts` - Working  
⏳ **Database Column:** Needs migration (see below)  
⏳ **Google Play Config:** Needs webhook URL setup  

---

## Quick Setup (3 Steps)

### 1. Database Migration (2 minutes)

```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT;

ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_google_play_token 
ON public.user_subscriptions(google_play_purchase_token);
```

### 2. Deploy Function (1 minute)

```bash
supabase functions deploy google-play-rtdn
```

### 3. Configure Google Play (2 minutes)

1. Go to: https://play.google.com/console
2. Your app → Monetization setup → Real-time developer notifications
3. Add URL: `https://[project-ref].supabase.co/functions/v1/google-play-rtdn`
4. Send test notification
5. Enable notifications

---

## How It Works

### Without RTDN (Current)
```
User opens app → Check Google Play → Reset quota if new period
```
**Issue:** Quota only resets when user opens app

### With RTDN (After Setup)
```
Google renews subscription → RTDN webhook → Reset quota immediately
```
**Benefit:** Quota resets automatically at renewal time

---

## Monitoring Commands

```bash
# Watch RTDN notifications in real-time
supabase functions logs google-play-rtdn --follow

# Check recent notifications
supabase functions logs google-play-rtdn --limit 20

# Test the webhook
curl -X POST https://[project-ref].supabase.co/functions/v1/google-play-rtdn \
  -H "Content-Type: application/json" \
  -d '{"message":{"data":"eyJ0ZXN0Tm90aWZpY2F0aW9uIjp7InZlcnNpb24iOiIxLjAifX0="}}'
```

---

## What Each Notification Does

| Notification | Action | User Impact |
|-------------|--------|-------------|
| **RENEWED** | Reset quota to 0, update cycle | Fresh quota available |
| **CANCELED** | Mark as cancelled, keep active | Access until period ends |
| **EXPIRED** | Set status to expired | Access removed |
| **GRACE_PERIOD** | Keep active | Access during payment retry |
| **ON_HOLD** | Set to past_due | May restrict access |
| **RECOVERED** | Reactivate subscription | Full access restored |
| **REVOKED** | Expire immediately | Access removed |
| **PAUSED** | Set to paused | Access suspended |

---

## Testing Checklist

- [ ] Database migration completed
- [ ] RTDN function deployed
- [ ] Webhook URL added to Play Console
- [ ] Test notification sent successfully
- [ ] Notifications enabled in Play Console
- [ ] Purchased test subscription
- [ ] Waited 5 minutes for renewal (sandbox)
- [ ] Checked logs for SUBSCRIPTION_RENEWED
- [ ] Verified quota reset in database
- [ ] Tested cancellation flow
- [ ] Tested expiration flow

---

## Troubleshooting

### No notifications received
→ Check webhook URL in Play Console  
→ Verify function is deployed: `supabase functions list`  
→ Send test notification from Play Console  

### Quota not resetting
→ Check RTDN logs for errors  
→ Verify purchase token is stored in database  
→ Check billing cycle dates are correct  

### Function errors
→ Check logs: `supabase functions logs google-play-rtdn`  
→ Verify SUPABASE_URL and SERVICE_ROLE_KEY are set  
→ Check database column exists  

---

## Database Queries

```sql
-- Check active subscriptions
SELECT user_id, plan_name, analyses_used_this_month, 
       current_billing_cycle_end, google_play_purchase_token
FROM user_subscriptions
WHERE subscription_status = 'active';

-- Check recent renewals
SELECT user_id, plan_name, updated_at, analyses_used_this_month
FROM user_subscriptions
WHERE updated_at > NOW() - INTERVAL '1 day'
ORDER BY updated_at DESC;

-- Check subscriptions needing attention
SELECT user_id, plan_name, subscription_status, current_billing_cycle_end
FROM user_subscriptions
WHERE subscription_status IN ('past_due', 'cancelled', 'expired')
ORDER BY current_billing_cycle_end DESC;
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/functions/google-play-rtdn/index.ts` | RTDN webhook handler |
| `src/hooks/useQuota.ts` | Quota reset logic |
| `src/hooks/useSubscription.ts` | Subscription state management |
| `add-google-play-purchase-token.sql` | Database migration |
| `RENEWAL_SYSTEM_SETUP.md` | Complete setup guide |
| `deploy-renewal-system.bat` | Deployment script |

---

## Support

- **Full Guide:** `RENEWAL_SYSTEM_SETUP.md`
- **RTDN Docs:** https://developer.android.com/google/play/billing/rtdn-reference
- **Supabase Functions:** https://supabase.com/docs/guides/functions

---

**Ready to deploy? Run:** `deploy-renewal-system.bat`
