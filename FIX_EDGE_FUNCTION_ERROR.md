# 🔧 FIX EDGE FUNCTION ERROR - STEP BY STEP

## ❌ YOUR ERROR

You're seeing the Edge Function source code displayed as an error. This means the Edge Function is **failing to execute** and returning an error response.

---

## 🎯 ROOT CAUSE

The most likely cause is: **Missing database columns**

Your Edge Function tries to insert `google_play_product_id` and `google_play_purchase_token` into the database, but these columns don't exist yet!

---

## ✅ SOLUTION (Follow in Order)

### Step 1: Check if Columns Exist

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Run this query:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions'
  AND column_name IN ('google_play_purchase_token', 'google_play_product_id');
```

**If it returns 0 rows** → Columns are missing! Continue to Step 2.

**If it returns 2 rows** → Columns exist! Skip to Step 3.

---

### Step 2: Add Missing Columns (CRITICAL!)

Run the migration file `add-google-play-columns.sql`:

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste this:

```sql
-- Add Google Play columns to user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT,
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

-- Add Google Play columns to payment_transactions table
ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT,
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

-- Add Google Play product ID to subscription_plans table
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

-- Update subscription_plans with Google Play product IDs
UPDATE public.subscription_plans
SET google_play_product_id = 'musicleai.basic.monthly'
WHERE plan_name = 'Basic';

UPDATE public.subscription_plans
SET google_play_product_id = 'musicleai.pro.monthly'
WHERE plan_name = 'Pro';

UPDATE public.subscription_plans
SET google_play_product_id = 'musicleai.vip.monthly'
WHERE plan_name = 'VIP';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_google_play_token 
ON public.user_subscriptions(google_play_purchase_token);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_google_play_token 
ON public.payment_transactions(google_play_purchase_token);

-- Verify
SELECT plan_name, google_play_product_id FROM public.subscription_plans;
```

3. Click **Run**
4. Verify output shows:
   ```
   Basic  | musicleai.basic.monthly
   Pro    | musicleai.pro.monthly
   VIP    | musicleai.vip.monthly
   ```

---

### Step 3: Verify Edge Function Environment Variables

1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings**
2. Verify these variables are set:

```
SUPABASE_URL=https://imevywptvoyfyjevyknu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZXZ5d3B0dm95ZnlqZXZ5a251Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzMDMxOCwiZXhwIjoyMDcyMTA2MzE4fQ.a8cOWflBb9NGBuD-KXMQTFs57Kb-oCgjjVpVeIlDjoA
```

**If not set:**
- Click **"Add secret"**
- Name: `SUPABASE_URL`
- Value: `https://imevywptvoyfyjevyknu.supabase.co`
- Click **"Add secret"** again
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: (paste the service_role key from above)

---

### Step 4: Test Edge Function in Dashboard

1. Go to **Edge Functions** → **create-subscription**
2. Click **"Invoke function"**
3. Get test data first - run in SQL Editor:

```sql
-- Get a plan ID
SELECT id, plan_name FROM subscription_plans WHERE plan_name = 'Basic';

-- Get your user ID
SELECT id, email FROM auth.users LIMIT 1;
```

4. Use the IDs in test payload:

```json
{
  "plan_id": "paste-plan-id-here",
  "user_id": "paste-user-id-here"
}
```

5. Click **"Run"**

**Expected Response:**
```json
{
  "success": true,
  "subscription_id": "some-uuid",
  "status": "pending"
}
```

**If you get an error:**
- Check the **Logs** tab
- Look for the specific error message
- Fix the issue and try again

---

### Step 5: Redeploy Edge Functions (If Needed)

If environment variables were just added, redeploy:

```bash
supabase functions deploy create-subscription
```

---

### Step 6: Test from Your App

1. Restart your app completely
2. Navigate to Subscription Plans
3. Select a plan
4. Check console logs for any errors

---

## 🔍 DEBUGGING CHECKLIST

If still not working, check:

- [ ] Database columns exist (Step 1)
- [ ] Migration ran successfully (Step 2)
- [ ] Environment variables set (Step 3)
- [ ] Edge Function test passes (Step 4)
- [ ] Function logs show no errors
- [ ] App is using correct Supabase URL
- [ ] User is authenticated in app

---

## 📊 VERIFY EVERYTHING IS WORKING

Run these queries to verify:

```sql
-- 1. Check columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions'
  AND column_name LIKE '%google_play%';

-- Should return 2 rows

-- 2. Check product IDs are set
SELECT plan_name, google_play_product_id 
FROM subscription_plans;

-- Should return 3 rows with product IDs

-- 3. Check if any subscriptions were created
SELECT id, user_id, plan_id, subscription_status, google_play_product_id
FROM user_subscriptions
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🎯 MOST COMMON FIX

**90% of the time, the issue is missing database columns.**

**Quick Fix:**
1. Run `add-google-play-columns.sql` in SQL Editor
2. Verify columns added
3. Test Edge Function in Dashboard
4. Try from app again

---

## 📞 STILL NOT WORKING?

Check Edge Function logs:

1. Dashboard → Edge Functions → create-subscription
2. Click **"Logs"** tab
3. Look for the error message
4. Share the error message for specific help

Common errors:
- `column "google_play_product_id" does not exist` → Run migration
- `Missing required fields` → Check request body
- `Invalid plan ID` → Use correct plan_id from database
- `User not authenticated` → Make sure user is logged in

---

## ✅ SUCCESS INDICATORS

You'll know it's working when:

1. ✅ Edge Function test in Dashboard returns `success: true`
2. ✅ No errors in function logs
3. ✅ App can select plans without errors
4. ✅ Info icon shows in app (tap to see diagnostics)
5. ✅ Subscription record created in database

---

**Start with Step 1 and work through each step in order!**
