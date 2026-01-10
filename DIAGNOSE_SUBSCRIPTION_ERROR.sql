-- ========================================
-- DIAGNOSTIC SCRIPT FOR SUBSCRIPTION ERROR
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Check if google_play columns exist in user_subscriptions
SELECT 
  'user_subscriptions columns' as check_name,
  COUNT(*) as column_count,
  STRING_AGG(column_name, ', ') as columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_subscriptions'
  AND column_name IN ('google_play_purchase_token', 'google_play_product_id');

-- Expected: column_count = 2

-- 2. Check all columns in user_subscriptions table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- 3. Check RLS policies on user_subscriptions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_subscriptions';

-- 4. Check if subscription_plans exist
SELECT id, plan_name, is_active, google_play_product_id
FROM subscription_plans
ORDER BY plan_name;

-- Expected: 3 rows (Basic, Pro, VIP)

-- 5. Check if there are any existing subscriptions
SELECT 
  id,
  user_id,
  plan_id,
  subscription_status,
  google_play_product_id,
  created_at
FROM user_subscriptions
ORDER BY created_at DESC
LIMIT 5;

-- 6. Test if we can insert a subscription manually
-- (This will help identify the exact error)
DO $$
DECLARE
  test_user_id UUID;
  test_plan_id UUID;
  test_subscription_id UUID;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  -- Get a test plan
  SELECT id INTO test_plan_id FROM subscription_plans WHERE plan_name = 'Basic' LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'ERROR: No users found in auth.users table';
    RETURN;
  END IF;
  
  IF test_plan_id IS NULL THEN
    RAISE NOTICE 'ERROR: No Basic plan found in subscription_plans table';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Test user ID: %', test_user_id;
  RAISE NOTICE 'Test plan ID: %', test_plan_id;
  
  -- Try to insert a test subscription
  BEGIN
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
      NULL,
      NOW(),
      NOW() + INTERVAL '30 days',
      0,
      true
    )
    RETURNING id INTO test_subscription_id;
    
    RAISE NOTICE 'SUCCESS: Test subscription created with ID: %', test_subscription_id;
    
    -- Clean up test subscription
    DELETE FROM user_subscriptions WHERE id = test_subscription_id;
    RAISE NOTICE 'Test subscription cleaned up';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Failed to insert test subscription';
    RAISE NOTICE 'Error message: %', SQLERRM;
    RAISE NOTICE 'Error detail: %', SQLSTATE;
  END;
END $$;

-- 7. Check if service_role can bypass RLS
-- (Edge Functions use service_role which should bypass RLS)
SELECT 
  'RLS Status' as check_name,
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'user_subscriptions';

-- ========================================
-- INTERPRETATION OF RESULTS
-- ========================================

/*
EXPECTED RESULTS:

1. column_count = 2 (both google_play columns exist)
2. All columns listed (should include google_play_purchase_token and google_play_product_id)
3. RLS policies shown (should allow service_role to insert)
4. 3 plans (Basic, Pro, VIP) with google_play_product_id set
5. Any existing subscriptions (may be empty)
6. "SUCCESS: Test subscription created" message
7. rls_enabled = true

IF ANY OF THESE FAIL:
- Missing columns → Run add-google-play-columns.sql
- No plans → Insert plans into subscription_plans
- Test insert fails → Check error message for specific issue
- RLS blocking → Check policies allow service_role
*/
