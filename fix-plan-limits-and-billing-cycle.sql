-- Fix Plan Limits and Billing Cycle
-- Run this in your Supabase SQL Editor

-- ========================================
-- Step 1: Ensure all required columns exist
-- ========================================

-- Add plan_name if it doesn't exist
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS plan_name TEXT;

-- Add monthly_analyses_limit if it doesn't exist
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS monthly_analyses_limit INTEGER DEFAULT 5;

-- Add billing cycle columns if they don't exist
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS current_billing_cycle_start TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS current_billing_cycle_end TIMESTAMP WITH TIME ZONE;

-- ========================================
-- Step 2: Update existing subscriptions with correct limits
-- ========================================

-- Update Basic plan subscriptions
UPDATE public.user_subscriptions
SET monthly_analyses_limit = 5,
    plan_name = 'Basic'
WHERE plan_id IN (
  SELECT id FROM public.subscription_plans WHERE plan_name = 'Basic'
)
AND subscription_status = 'active';

-- Update Pro plan subscriptions
UPDATE public.user_subscriptions
SET monthly_analyses_limit = 20,
    plan_name = 'Pro'
WHERE plan_id IN (
  SELECT id FROM public.subscription_plans WHERE plan_name = 'Pro'
)
AND subscription_status = 'active';

-- Update VIP plan subscriptions
UPDATE public.user_subscriptions
SET monthly_analyses_limit = 50,
    plan_name = 'VIP'
WHERE plan_id IN (
  SELECT id FROM public.subscription_plans WHERE plan_name = 'VIP'
)
AND subscription_status = 'active';

-- ========================================
-- Step 3: Initialize billing cycles for existing subscriptions
-- ========================================

-- For subscriptions without billing cycle dates, set them to now + 5 minutes (sandbox)
-- or now + 30 days (production)
UPDATE public.user_subscriptions
SET current_billing_cycle_start = NOW(),
    current_billing_cycle_end = NOW() + INTERVAL '5 minutes' -- Change to '30 days' for production
WHERE subscription_status = 'active'
  AND current_billing_cycle_end IS NULL;

-- ========================================
-- Step 4: Create or replace RPC function for quota check
-- ========================================

CREATE OR REPLACE FUNCTION public.can_user_analyze()
RETURNS TABLE (
  can_analyze BOOLEAN,
  analyses_remaining INTEGER,
  subscription_status TEXT,
  plan_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_subscription RECORD;
  v_plan RECORD;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM public.user_subscriptions us
  WHERE us.user_id = v_user_id 
    AND us.subscription_status = 'active'
  LIMIT 1;
  
  -- If no active subscription, return false
  IF v_subscription IS NULL THEN
    RETURN QUERY SELECT 
      false,
      0,
      'none'::TEXT,
      'none'::TEXT;
    RETURN;
  END IF;
  
  -- Get plan details
  SELECT * INTO v_plan
  FROM public.subscription_plans sp
  WHERE sp.id = v_subscription.plan_id;
  
  -- Check if user has remaining analyses based on their plan limit
  IF v_subscription.analyses_used_this_month < v_subscription.monthly_analyses_limit THEN
    RETURN QUERY SELECT 
      true,
      v_subscription.monthly_analyses_limit - v_subscription.analyses_used_this_month,
      v_subscription.subscription_status,
      v_subscription.plan_name;
  ELSE
    RETURN QUERY SELECT 
      false,
      0,
      v_subscription.subscription_status,
      v_subscription.plan_name;
  END IF;
END;
$$;

-- ========================================
-- Step 5: Create or replace RPC function for incrementing usage
-- ========================================

CREATE OR REPLACE FUNCTION public.increment_usage_counter(
  p_analysis_result_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_subscription RECORD;
  v_plan RECORD;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM public.user_subscriptions us
  WHERE us.user_id = v_user_id 
    AND us.subscription_status = 'active'
  LIMIT 1;
  
  -- If no active subscription, return error
  IF v_subscription IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active subscription found'
    );
  END IF;
  
  -- Get plan details
  SELECT * INTO v_plan
  FROM public.subscription_plans sp
  WHERE sp.id = v_subscription.plan_id;
  
  -- Check if user has exceeded their plan limit
  IF v_subscription.analyses_used_this_month >= v_subscription.monthly_analyses_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Monthly analysis limit reached for ' || v_subscription.plan_name || ' plan',
      'analyses_used', v_subscription.analyses_used_this_month,
      'analyses_limit', v_subscription.monthly_analyses_limit
    );
  END IF;
  
  -- Increment counter
  UPDATE public.user_subscriptions
  SET analyses_used_this_month = analyses_used_this_month + 1,
      updated_at = NOW()
  WHERE id = v_subscription.id;
  
  -- Insert usage tracking record
  INSERT INTO public.usage_tracking (
    user_id,
    subscription_id,
    analysis_date,
    analysis_type,
    analysis_result_id
  ) VALUES (
    v_user_id,
    v_subscription.id,
    NOW(),
    'muscle_analysis',
    p_analysis_result_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'analyses_used', v_subscription.analyses_used_this_month + 1,
    'analyses_limit', v_subscription.monthly_analyses_limit,
    'analyses_remaining', v_subscription.monthly_analyses_limit - (v_subscription.analyses_used_this_month + 1)
  );
END;
$$;

-- ========================================
-- Step 6: Verify the changes
-- ========================================

-- Check active subscriptions with their limits
SELECT 
  user_id,
  plan_name,
  monthly_analyses_limit,
  analyses_used_this_month,
  (monthly_analyses_limit - analyses_used_this_month) as analyses_remaining,
  current_billing_cycle_start,
  current_billing_cycle_end,
  subscription_status
FROM public.user_subscriptions
WHERE subscription_status = 'active'
ORDER BY created_at DESC;

-- ========================================
-- Expected Results:
-- - Basic plans should have monthly_analyses_limit = 5
-- - Pro plans should have monthly_analyses_limit = 20
-- - VIP plans should have monthly_analyses_limit = 50
-- - All active subscriptions should have billing cycle dates set
-- ========================================
