# 🔄 Subscription Renewal Flow - Visual Guide

## Complete Renewal Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION LIFECYCLE                        │
└─────────────────────────────────────────────────────────────────┘

1. PURCHASE
   ┌──────────┐
   │   User   │
   └────┬─────┘
        │ Taps "Subscribe"
        ▼
   ┌──────────────────┐
   │  Google Play     │ ← Handles payment
   │  Billing Dialog  │
   └────┬─────────────┘
        │ Payment Success
        ▼
   ┌──────────────────┐
   │  App receives    │
   │  purchase token  │
   └────┬─────────────┘
        │
        ▼
   ┌──────────────────┐
   │ create-subscription │ ← Stores token + product ID
   │  Edge Function    │    Sets billing cycle
   └────┬─────────────┘    analyses_used = 0
        │
        ▼
   ┌──────────────────┐
   │   Database       │
   │ ✅ Active        │
   │ 📊 Quota: 0/50   │
   │ 📅 Cycle: 30d    │
   └──────────────────┘


2. USAGE PERIOD (Days 1-30)
   ┌──────────┐
   │   User   │
   └────┬─────┘
        │ Uses app
        ▼
   ┌──────────────────┐
   │  Performs        │
   │  analyses        │
   └────┬─────────────┘
        │
        ▼
   ┌──────────────────┐
   │   Database       │
   │ ✅ Active        │
   │ 📊 Quota: 15/50  │ ← Increments with each use
   │ 📅 Cycle: 20d    │
   └──────────────────┘


3. RENEWAL (Day 30)
   
   WITHOUT RTDN (Current):
   ┌──────────────────┐
   │  Google Play     │
   │  Auto-renews     │ ← Charges card
   └────┬─────────────┘
        │ (No notification)
        ▼
   ┌──────────────────┐
   │   Database       │
   │ ✅ Active        │
   │ 📊 Quota: 15/50  │ ← Still shows old usage
   │ 📅 Cycle: -1d    │    Cycle expired!
   └────┬─────────────┘
        │
        │ User opens app (hours/days later)
        ▼
   ┌──────────────────┐
   │ useSubscription  │
   │ checkQuota()     │ ← Detects expired cycle
   └────┬─────────────┘
        │
        ▼
   ┌──────────────────┐
   │   Database       │
   │ ✅ Active        │
   │ 📊 Quota: 0/50   │ ← Reset!
   │ 📅 Cycle: 30d    │    New cycle!
   └──────────────────┘


   WITH RTDN (After Setup):
   ┌──────────────────┐
   │  Google Play     │
   │  Auto-renews     │ ← Charges card
   └────┬─────────────┘
        │ Sends RTDN notification
        ▼
   ┌──────────────────┐
   │  google-play-    │
   │  rtdn function   │ ← Receives notification
   └────┬─────────────┘
        │ SUBSCRIPTION_RENEWED
        ▼
   ┌──────────────────┐
   │   Database       │
   │ ✅ Active        │
   │ 📊 Quota: 0/50   │ ← Reset immediately!
   │ 📅 Cycle: 30d    │    New cycle!
   └────┬─────────────┘
        │
        │ User opens app (anytime)
        ▼
   ┌──────────────────┐
   │ useSubscription  │
   │ Fresh quota!     │ ← Already reset
   └──────────────────┘


4. CANCELLATION
   ┌──────────┐
   │   User   │
   └────┬─────┘
        │ Cancels in Play Store
        ▼
   ┌──────────────────┐
   │  Google Play     │
   │  Cancels         │
   └────┬─────────────┘
        │ Sends RTDN notification
        ▼
   ┌──────────────────┐
   │  google-play-    │
   │  rtdn function   │
   └────┬─────────────┘
        │ SUBSCRIPTION_CANCELED
        ▼
   ┌──────────────────┐
   │   Database       │
   │ ✅ Active        │ ← Still active!
   │ 🚫 No renewal    │    Until period ends
   │ 📅 Cycle: 15d    │
   └────┬─────────────┘
        │
        │ Period ends (Day 30)
        ▼
   ┌──────────────────┐
   │  Google Play     │
   │  Expires         │
   └────┬─────────────┘
        │ Sends RTDN notification
        ▼
   ┌──────────────────┐
   │  google-play-    │
   │  rtdn function   │
   └────┬─────────────┘
        │ SUBSCRIPTION_EXPIRED
        ▼
   ┌──────────────────┐
   │   Database       │
   │ ❌ Expired       │
   │ 🚫 No access     │
   └──────────────────┘


5. GRACE PERIOD (Payment Failed)
   ┌──────────────────┐
   │  Google Play     │
   │  Payment fails   │ ← Card declined
   └────┬─────────────┘
        │ Sends RTDN notification
        ▼
   ┌──────────────────┐
   │  google-play-    │
   │  rtdn function   │
   └────┬─────────────┘
        │ SUBSCRIPTION_IN_GRACE_PERIOD
        ▼
   ┌──────────────────┐
   │   Database       │
   │ ✅ Active        │ ← Still active!
   │ ⏳ Grace period  │    Google retrying
   │ 📅 Cycle: 3d     │
   └────┬─────────────┘
        │
        │ Payment succeeds
        ▼
   ┌──────────────────┐
   │  google-play-    │
   │  rtdn function   │
   └────┬─────────────┘
        │ SUBSCRIPTION_RECOVERED
        ▼
   ┌──────────────────┐
   │   Database       │
   │ ✅ Active        │
   │ 📊 Quota: 0/50   │ ← Reset!
   │ 📅 Cycle: 30d    │
   └──────────────────┘
```

---

## RTDN Notification Types

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION TYPES                            │
└─────────────────────────────────────────────────────────────────┘

Type 1: SUBSCRIPTION_RECOVERED
   ├─ When: Payment succeeded after grace period
   ├─ Action: Reactivate subscription
   └─ User: Full access restored

Type 2: SUBSCRIPTION_RENEWED ⭐ (Most Important)
   ├─ When: Subscription successfully renewed
   ├─ Action: Reset quota, update billing cycle
   └─ User: Fresh quota available

Type 3: SUBSCRIPTION_CANCELED
   ├─ When: User cancels subscription
   ├─ Action: Mark as cancelled, keep active
   └─ User: Access until period ends

Type 4: SUBSCRIPTION_PURCHASED
   ├─ When: New subscription purchased
   ├─ Action: Log event (handled by app)
   └─ User: Immediate access

Type 5: SUBSCRIPTION_ON_HOLD
   ├─ When: Payment failed, grace period ended
   ├─ Action: Set to past_due
   └─ User: May restrict access

Type 6: SUBSCRIPTION_IN_GRACE_PERIOD
   ├─ When: Payment failed, Google retrying
   ├─ Action: Keep active
   └─ User: Access continues

Type 13: SUBSCRIPTION_EXPIRED
   ├─ When: Subscription period ended
   ├─ Action: Set to expired
   └─ User: Access removed
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIAGRAM                             │
└─────────────────────────────────────────────────────────────────┘

PURCHASE FLOW:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   App    │───▶│  Google  │───▶│  Edge    │───▶│ Database │
│          │    │   Play   │    │ Function │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
  Request         Process         Store           Save
  purchase        payment         token           subscription


RENEWAL FLOW (WITH RTDN):
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Google  │───▶│   RTDN   │───▶│  Edge    │───▶│ Database │
│   Play   │    │ Webhook  │    │ Function │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
  Auto-renew      Notify          Reset           Update
  subscription    webhook         quota           cycle


APP CHECK FLOW:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   App    │───▶│  Google  │───▶│  useQuota│───▶│ Database │
│  Opens   │    │   Play   │    │   Hook   │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
  Launch          Check           Verify          Read
                  purchases       cycle           subscription
```

---

## Timeline Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│              WITHOUT RTDN vs WITH RTDN                           │
└─────────────────────────────────────────────────────────────────┘

WITHOUT RTDN:
Day 0  ────▶ Purchase (Quota: 0/50)
Day 15 ────▶ Usage (Quota: 25/50)
Day 30 ────▶ Google renews (Quota: 25/50) ← Still old!
Day 31 ────▶ User opens app (Quota: 0/50) ← Reset now
           ⚠️ 1 day delay in quota reset


WITH RTDN:
Day 0  ────▶ Purchase (Quota: 0/50)
Day 15 ────▶ Usage (Quota: 25/50)
Day 30 ────▶ Google renews (Quota: 0/50) ← Reset immediately!
Day 31 ────▶ User opens app (Quota: 0/50) ← Already fresh
           ✅ Instant quota reset
```

---

## Database State Changes

```
┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE STATE CHANGES                          │
└─────────────────────────────────────────────────────────────────┘

PURCHASE:
{
  subscription_status: 'active',
  analyses_used_this_month: 0,
  current_billing_cycle_start: '2026-01-10',
  current_billing_cycle_end: '2026-02-10',
  google_play_purchase_token: 'abc123...',
  google_play_product_id: 'muscleai.pro.monthly'
}

USAGE (Day 15):
{
  subscription_status: 'active',
  analyses_used_this_month: 25, ← Incremented
  current_billing_cycle_start: '2026-01-10',
  current_billing_cycle_end: '2026-02-10',
  ...
}

RENEWAL (Day 30 - RTDN):
{
  subscription_status: 'active',
  analyses_used_this_month: 0, ← Reset!
  current_billing_cycle_start: '2026-02-10', ← New cycle
  current_billing_cycle_end: '2026-03-10', ← New end
  ...
}

CANCELLATION:
{
  subscription_status: 'active', ← Still active!
  auto_renewal_enabled: false, ← Won't renew
  cancelled_at: '2026-01-20',
  current_billing_cycle_end: '2026-02-10', ← Access until here
  ...
}

EXPIRATION:
{
  subscription_status: 'expired', ← No access
  subscription_end_date: '2026-02-10',
  ...
}
```

---

## Key Differences

| Aspect | Without RTDN | With RTDN |
|--------|-------------|-----------|
| **Quota Reset** | When user opens app | Immediately at renewal |
| **Delay** | Hours to days | Seconds |
| **Accuracy** | Depends on app usage | Always accurate |
| **User Experience** | May see old quota | Always fresh quota |
| **Server Load** | None | Minimal (1 call/month) |
| **Complexity** | Simple | Slightly more complex |
| **Recommended** | Testing only | Production |

---

## Summary

### Current System (Client-Side)
✅ Simple and reliable  
✅ No server infrastructure needed  
⚠️ Quota resets only when app opens  
⚠️ Potential delay after renewal  

### With RTDN (Recommended)
✅ Real-time quota reset  
✅ Better user experience  
✅ Accurate billing cycle tracking  
✅ Handles all subscription events  
⚠️ Requires webhook setup  
⚠️ Slightly more complex  

---

**Recommendation:** Implement RTDN for production apps. The setup is simple and provides a much better user experience.

**Setup Time:** ~10 minutes  
**Maintenance:** None (fully automated)  
**Cost:** Free (within Supabase limits)
