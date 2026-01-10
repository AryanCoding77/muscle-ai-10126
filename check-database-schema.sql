-- Check if Google Play columns exist in user_subscriptions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_subscriptions'
  AND column_name IN ('google_play_purchase_token', 'google_play_product_id')
ORDER BY column_name;

-- If the above returns 0 rows, the columns are missing!
-- Run add-google-play-columns.sql to fix it

-- Also check subscription_plans table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'subscription_plans'
  AND column_name = 'google_play_product_id';

-- Check payment_transactions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'payment_transactions'
  AND column_name IN ('google_play_purchase_token', 'google_play_product_id')
ORDER BY column_name;
