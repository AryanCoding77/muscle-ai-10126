-- Quick check to verify product IDs in database match Google Play Console

-- Check if google_play_product_id column exists
SELECT 
  '1. Column Check' as step,
  COUNT(*) as column_exists
FROM information_schema.columns 
WHERE table_name = 'subscription_plans'
  AND column_name = 'google_play_product_id';

-- Expected: column_exists = 1

-- Check product IDs in subscription_plans
SELECT 
  '2. Product IDs' as step,
  plan_name,
  google_play_product_id,
  CASE 
    WHEN google_play_product_id = 'muscleai.basic.monthly' AND plan_name = 'Basic' THEN '✅ CORRECT'
    WHEN google_play_product_id = 'muscleai.pro.monthly' AND plan_name = 'Pro' THEN '✅ CORRECT'
    WHEN google_play_product_id = 'muscleai.vip.monthly' AND plan_name = 'VIP' THEN '✅ CORRECT'
    WHEN google_play_product_id LIKE 'musicleai%' THEN '❌ WRONG - Has typo (musicleai instead of muscleai)'
    WHEN google_play_product_id IS NULL THEN '❌ MISSING - Run migration script'
    ELSE '❌ INCORRECT'
  END as status
FROM subscription_plans
ORDER BY plan_name;

-- Expected output:
-- Basic  | muscleai.basic.monthly  | ✅ CORRECT
-- Pro    | muscleai.pro.monthly    | ✅ CORRECT
-- VIP    | muscleai.vip.monthly    | ✅ CORRECT

-- If you see ❌ WRONG or ❌ MISSING, run this fix:
/*
UPDATE public.subscription_plans
SET google_play_product_id = 'muscleai.basic.monthly'
WHERE plan_name = 'Basic';

UPDATE public.subscription_plans
SET google_play_product_id = 'muscleai.pro.monthly'
WHERE plan_name = 'Pro';

UPDATE public.subscription_plans
SET google_play_product_id = 'muscleai.vip.monthly'
WHERE plan_name = 'VIP';
*/
