-- Quick verification query to confirm everything is fixed
-- Run this to see the complete status

-- 1. Check columns exist
SELECT 
  '1. Columns Check' as step,
  COUNT(*) as google_play_columns,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions'
  AND column_name IN ('google_play_purchase_token', 'google_play_product_id');

-- 2. Check product IDs are set
SELECT 
  '2. Product IDs Check' as step,
  plan_name,
  google_play_product_id,
  CASE 
    WHEN google_play_product_id IS NOT NULL THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM subscription_plans
ORDER BY plan_name;

-- 3. Check RLS policy exists
SELECT 
  '3. RLS Policy Check' as step,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM pg_policies
WHERE tablename = 'user_subscriptions'
  AND policyname = 'Service role can manage all subscriptions';

-- 4. Final test - try to insert a subscription
DO $$
DECLARE
  test_user_id UUID;
  test_plan_id UUID;
  test_sub_id UUID;
  test_result TEXT;
BEGIN
  -- Get test data
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  SELECT id INTO test_plan_id FROM subscription_plans WHERE plan_name = 'Basic' LIMIT 1;
  
  IF test_user_id IS NULL OR test_plan_id IS NULL THEN
    RAISE NOTICE '4. Insert Test: ⚠️ SKIP - No user or plan found';
    RETURN;
  END IF;
  
  -- Try insert
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
      'muscleai.basic.monthly',
      NOW(),
      NOW() + INTERVAL '30 days',
      0,
      true
    )
    RETURNING id INTO test_sub_id;
    
    RAISE NOTICE '4. Insert Test: ✅ PASS - Subscription insert works! ID: %', test_sub_id;
    
    -- Clean up
    DELETE FROM user_subscriptions WHERE id = test_sub_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '4. Insert Test: ❌ FAIL - %', SQLERRM;
  END;
END $$;

-- Summary
SELECT 
  '=== SUMMARY ===' as summary,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions'
        AND column_name IN ('google_play_purchase_token', 'google_play_product_id')
    ) = 2
    AND (
      SELECT COUNT(*) FROM subscription_plans 
      WHERE google_play_product_id IS NOT NULL
    ) = 3
    AND (
      SELECT COUNT(*) FROM pg_policies
      WHERE tablename = 'user_subscriptions'
        AND policyname = 'Service role can manage all subscriptions'
    ) > 0
    THEN '✅ ALL CHECKS PASSED - Database is ready!'
    ELSE '❌ SOME CHECKS FAILED - Review results above'
  END as final_status;
