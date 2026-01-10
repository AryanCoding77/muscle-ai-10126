-- ========================================
-- COMPLETE FIX FOR "FAILED TO CREATE SUBSCRIPTION" ERROR
-- Run this entire script in Supabase SQL Editor
-- ========================================

-- Step 1: Add missing Google Play columns
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT,
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT,
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

-- Step 2: Update subscription_plans with Google Play product IDs
UPDATE public.subscription_plans
SET google_play_product_id = 'muscleai.basic.monthly'
WHERE plan_name = 'Basic';

UPDATE public.subscription_plans
SET google_play_product_id = 'muscleai.pro.monthly'
WHERE plan_name = 'Pro';

UPDATE public.subscription_plans
SET google_play_product_id = 'muscleai.vip.monthly'
WHERE plan_name = 'VIP';

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_google_play_token 
ON public.user_subscriptions(google_play_purchase_token);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_google_play_token 
ON public.payment_transactions(google_play_purchase_token);

-- Step 4: Ensure RLS policies allow service_role to insert
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.user_subscriptions;

-- Recreate policy to ensure service_role can insert
CREATE POLICY "Service role can manage all subscriptions" ON public.user_subscriptions
  FOR ALL 
  USING (
    auth.jwt()->>'role' = 'service_role' OR
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.jwt()->>'role' = 'service_role' OR
    auth.uid() = user_id
  );

-- Step 5: Verify the fix
SELECT 
  '✅ Columns Added' as status,
  COUNT(*) as google_play_columns
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions'
  AND column_name IN ('google_play_purchase_token', 'google_play_product_id');

SELECT 
  '✅ Product IDs Set' as status,
  plan_name,
  google_play_product_id
FROM subscription_plans
ORDER BY plan_name;

SELECT 
  '✅ RLS Policy Updated' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_subscriptions'
  AND policyname = 'Service role can manage all subscriptions';

-- Step 6: Test insert (will be rolled back)
DO $$
DECLARE
  test_user_id UUID;
  test_plan_id UUID;
  test_sub_id UUID;
BEGIN
  -- Get test data
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  SELECT id INTO test_plan_id FROM subscription_plans WHERE plan_name = 'Basic' LIMIT 1;
  
  IF test_user_id IS NULL OR test_plan_id IS NULL THEN
    RAISE NOTICE '⚠️ Cannot test: No user or plan found';
    RETURN;
  END IF;
  
  -- Try insert
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    subscription_status,
    google_play_purchase_token,
    google_play_product_id,
    current_billing_cycle_start,
    current_billing_cycle_end,
    analyses_used_this_month,
    auto_renewal_enabled
  ) VALUES (
    test_user_id,
    test_plan_id,
    'pending',
    NULL,
    'muscleai.basic.monthly',
    NOW(),
    NOW() + INTERVAL '30 days',
    0,
    true
  )
  RETURNING id INTO test_sub_id;
  
  RAISE NOTICE '✅ TEST PASSED: Subscription insert works! ID: %', test_sub_id;
  
  -- Clean up
  DELETE FROM user_subscriptions WHERE id = test_sub_id;
  RAISE NOTICE '✅ Test subscription cleaned up';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ TEST FAILED: %', SQLERRM;
END $$;

-- ========================================
-- EXPECTED OUTPUT
-- ========================================
/*
You should see:

1. ✅ Columns Added: google_play_columns = 2
2. ✅ Product IDs Set: 
   - Basic  | muscleai.basic.monthly
   - Pro    | muscleai.pro.monthly
   - VIP    | muscleai.vip.monthly
3. ✅ RLS Policy Updated: Service role can manage all subscriptions
4. ✅ TEST PASSED: Subscription insert works!

If you see "TEST FAILED", the error message will tell you what's wrong.
*/
