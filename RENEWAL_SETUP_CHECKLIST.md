# ✅ Renewal System Setup Checklist

Use this checklist to track your setup progress.

---

## 📋 Pre-Setup Verification

- [ ] App has Google Play Billing implemented
- [ ] Subscriptions are working (can purchase)
- [ ] Supabase project is set up
- [ ] Supabase CLI is installed
- [ ] Have access to Google Play Console

---

## 🗄️ Database Setup

### Step 1: Add Purchase Token Column
- [ ] Open Supabase SQL Editor
- [ ] Run `add-google-play-purchase-token.sql`
- [ ] Verify columns added:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'user_subscriptions' 
    AND column_name IN ('google_play_purchase_token', 'google_play_product_id');
  ```
- [ ] Confirm 2 rows returned

### Step 2: Verify Indexes
- [ ] Check indexes created:
  ```sql
  SELECT indexname FROM pg_indexes
  WHERE tablename = 'user_subscriptions'
    AND indexname LIKE '%google_play%';
  ```
- [ ] Confirm 2 indexes exist

---

## 🚀 Function Deployment

### Step 3: Deploy RTDN Function
- [ ] Open terminal in project root
- [ ] Run: `supabase functions deploy google-play-rtdn`
- [ ] Wait for deployment to complete
- [ ] Note the function URL shown in output

### Step 4: Verify Deployment
- [ ] Run: `supabase functions list`
- [ ] Confirm `google-play-rtdn` is listed
- [ ] Copy function URL for next step

**Your Function URL:**
```
https://_________________________.supabase.co/functions/v1/google-play-rtdn
```

---

## 🎮 Google Play Console Setup

### Step 5: Configure Webhook
- [ ] Go to: https://play.google.com/console
- [ ] Select your app: **com.muscleai.app**
- [ ] Navigate to: **Monetization setup**
- [ ] Click: **Real-time developer notifications**
- [ ] Paste your function URL (from Step 4)
- [ ] Click: **Save**

### Step 6: Test Notification
- [ ] Click: **Send test notification**
- [ ] Wait for confirmation message
- [ ] Check Supabase logs:
  ```bash
  supabase functions logs google-play-rtdn --limit 5
  ```
- [ ] Confirm you see: "✅ Test notification received successfully"

### Step 7: Enable Notifications
- [ ] Toggle: **Enable notifications** to ON
- [ ] Click: **Save changes**
- [ ] Confirm toggle stays ON

---

## 🧪 Testing

### Step 8: Test with Sandbox Subscription

#### Purchase Test Subscription
- [ ] Install app from Internal Testing track
- [ ] Sign in with test account
- [ ] Purchase any subscription plan
- [ ] Confirm purchase completes successfully

#### Wait for Renewal
- [ ] Note current time: _______________
- [ ] Wait 5 minutes (sandbox renewal time)
- [ ] Expected renewal time: _______________

#### Verify Renewal
- [ ] Check RTDN logs:
  ```bash
  supabase functions logs google-play-rtdn --follow
  ```
- [ ] Look for: "🔔 SUBSCRIPTION_RENEWED"
- [ ] Look for: "✅ Subscription renewed successfully"
- [ ] Look for: "quotaReset: 0/[limit]"

#### Verify Database
- [ ] Run query:
  ```sql
  SELECT user_id, plan_name, analyses_used_this_month, 
         current_billing_cycle_end, updated_at
  FROM user_subscriptions
  WHERE subscription_status = 'active'
  ORDER BY updated_at DESC
  LIMIT 5;
  ```
- [ ] Confirm `analyses_used_this_month` = 0
- [ ] Confirm `updated_at` is recent (within last minute)
- [ ] Confirm `current_billing_cycle_end` is ~30 days in future

#### Verify App
- [ ] Open app
- [ ] Check subscription status shows active
- [ ] Check quota shows fresh count (0 used)
- [ ] Perform an analysis
- [ ] Confirm quota increments

---

## 🔄 Test Cancellation Flow

### Step 9: Test Cancellation

#### Cancel Subscription
- [ ] Open Google Play Store app
- [ ] Go to: Subscriptions
- [ ] Find your test subscription
- [ ] Click: Cancel subscription
- [ ] Confirm cancellation

#### Verify RTDN Notification
- [ ] Check logs:
  ```bash
  supabase functions logs google-play-rtdn --follow
  ```
- [ ] Look for: "⚠️ SUBSCRIPTION_CANCELED"
- [ ] Look for: "✅ Subscription marked as cancelled"

#### Verify Database
- [ ] Run query:
  ```sql
  SELECT subscription_status, auto_renewal_enabled, 
         cancelled_at, current_billing_cycle_end
  FROM user_subscriptions
  WHERE user_id = '[your-test-user-id]';
  ```
- [ ] Confirm `subscription_status` = 'active' (still active until period ends)
- [ ] Confirm `auto_renewal_enabled` = false
- [ ] Confirm `cancelled_at` has timestamp

#### Verify App
- [ ] Open app
- [ ] Confirm subscription still shows as active
- [ ] Confirm can still use features
- [ ] Note expiration date shown

---

## ⏰ Test Expiration Flow

### Step 10: Test Expiration

#### Wait for Expiration
- [ ] Note current billing cycle end: _______________
- [ ] Wait for period to end (5 min in sandbox)
- [ ] Expected expiration time: _______________

#### Verify RTDN Notification
- [ ] Check logs:
  ```bash
  supabase functions logs google-play-rtdn --follow
  ```
- [ ] Look for: "❌ SUBSCRIPTION_EXPIRED"
- [ ] Look for: "✅ Subscription marked as expired"

#### Verify Database
- [ ] Run query:
  ```sql
  SELECT subscription_status, subscription_end_date
  FROM user_subscriptions
  WHERE user_id = '[your-test-user-id]';
  ```
- [ ] Confirm `subscription_status` = 'expired'
- [ ] Confirm `subscription_end_date` has timestamp

#### Verify App
- [ ] Open app
- [ ] Confirm subscription shows as inactive
- [ ] Confirm upgrade prompt is shown
- [ ] Confirm premium features are locked

---

## 📊 Monitoring Setup

### Step 11: Set Up Monitoring

#### Create Monitoring Script
- [ ] Save this command for regular checks:
  ```bash
  supabase functions logs google-play-rtdn --limit 20
  ```

#### Set Up Database Queries
- [ ] Bookmark these queries in Supabase SQL Editor:

**Active Subscriptions:**
```sql
SELECT COUNT(*) as total, plan_name
FROM user_subscriptions
WHERE subscription_status = 'active'
GROUP BY plan_name;
```

**Recent Renewals:**
```sql
SELECT user_id, plan_name, updated_at, analyses_used_this_month
FROM user_subscriptions
WHERE updated_at > NOW() - INTERVAL '1 day'
  AND subscription_status = 'active'
ORDER BY updated_at DESC;
```

**Subscriptions Needing Attention:**
```sql
SELECT user_id, plan_name, subscription_status, current_billing_cycle_end
FROM user_subscriptions
WHERE subscription_status IN ('past_due', 'cancelled', 'expired')
ORDER BY current_billing_cycle_end DESC;
```

---

## 🎯 Production Readiness

### Step 12: Final Verification

- [ ] All tests passed successfully
- [ ] RTDN notifications working
- [ ] Quota resets automatically
- [ ] Cancellation flow works
- [ ] Expiration flow works
- [ ] Database updates correctly
- [ ] App displays correct status
- [ ] Monitoring queries work

### Step 13: Documentation Review

- [ ] Read: `RENEWAL_SYSTEM_SETUP.md`
- [ ] Read: `RENEWAL_QUICK_REFERENCE.md`
- [ ] Read: `RENEWAL_FLOW_DIAGRAM.md`
- [ ] Bookmark: `RENEWAL_SYSTEM_COMPLETE.md`

### Step 14: Team Handoff (if applicable)

- [ ] Share documentation with team
- [ ] Explain RTDN webhook URL
- [ ] Show monitoring commands
- [ ] Demonstrate testing flow
- [ ] Review troubleshooting steps

---

## 🚀 Launch Checklist

### Step 15: Pre-Launch

- [ ] All setup steps completed
- [ ] All tests passed
- [ ] Monitoring in place
- [ ] Documentation reviewed
- [ ] Team trained (if applicable)

### Step 16: Launch

- [ ] Deploy app to production
- [ ] Monitor RTDN logs for first 24 hours
- [ ] Check first real renewal (after 30 days)
- [ ] Verify quota resets working
- [ ] Monitor user feedback

### Step 17: Post-Launch

- [ ] Review RTDN logs weekly
- [ ] Check database health monthly
- [ ] Update documentation as needed
- [ ] Optimize logging if needed

---

## 📝 Notes & Issues

Use this section to track any issues or notes during setup:

**Date:** _______________

**Issues Encountered:**
- 
- 
- 

**Solutions Applied:**
- 
- 
- 

**Additional Notes:**
- 
- 
- 

---

## ✅ Completion Status

**Setup Started:** _______________  
**Setup Completed:** _______________  
**Tested By:** _______________  
**Approved By:** _______________  

**Status:** 
- [ ] Not Started
- [ ] In Progress
- [ ] Testing
- [ ] Complete
- [ ] Production

---

## 🆘 Need Help?

### Documentation
- Complete Guide: `RENEWAL_SYSTEM_SETUP.md`
- Quick Reference: `RENEWAL_QUICK_REFERENCE.md`
- Flow Diagrams: `RENEWAL_FLOW_DIAGRAM.md`

### Support Resources
- Google Play RTDN: https://developer.android.com/google/play/billing/rtdn-reference
- Supabase Functions: https://supabase.com/docs/guides/functions
- Supabase Support: https://supabase.com/support

### Common Issues
See "Troubleshooting" section in `RENEWAL_SYSTEM_SETUP.md`

---

**Good luck with your setup! 🚀**
