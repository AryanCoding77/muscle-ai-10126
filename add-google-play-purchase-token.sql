-- Add Google Play purchase token column to user_subscriptions table
-- This is needed for RTDN (Real-Time Developer Notifications) to identify subscriptions

-- Add the column if it doesn't exist
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT;

-- Add the column if it doesn't exist
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

-- Create index for faster lookups by purchase token
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_google_play_token 
ON public.user_subscriptions(google_play_purchase_token);

-- Create index for product ID
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_google_play_product_id 
ON public.user_subscriptions(google_play_product_id);

-- Update existing subscriptions to add product_id if missing
-- (This is a one-time migration for existing data)
UPDATE public.user_subscriptions
SET google_play_product_id = CASE 
  WHEN plan_name = 'Basic' THEN 'muscleai.basic.monthly'
  WHEN plan_name = 'Pro' THEN 'muscleai.pro.monthly'
  WHEN plan_name = 'VIP' THEN 'muscleai.vip.monthly'
  ELSE NULL
END
WHERE google_play_product_id IS NULL;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_subscriptions' 
  AND column_name IN ('google_play_purchase_token', 'google_play_product_id');
