-- =====================================================
-- FREE TRIAL SYSTEM
-- =====================================================
-- This script adds a free trial system where every user gets 2 free analyses

-- Add free trial column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS free_trial_analyses_remaining INTEGER DEFAULT 0 CHECK (free_trial_analyses_remaining >= 0);

-- Add column to track if user has ever had a subscription
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_had_subscription BOOLEAN DEFAULT false;

-- Add column to track if user has spun the wheel
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_spun_wheel BOOLEAN DEFAULT false;

-- Set free_trial_analyses_remaining to 0 for existing users (they need to spin)
-- New users will also start at 0 and spin to get their amount
UPDATE public.profiles 
SET free_trial_analyses_remaining = 0,
    has_spun_wheel = false
WHERE free_trial_analyses_remaining IS NULL OR free_trial_analyses_remaining = 2;

-- Create function to check if user can analyze (with free trial support)
CREATE OR REPLACE FUNCTION public.can_user_analyze_with_trial()
RETURNS TABLE (
  can_analyze BOOLEAN,
  analyses_remaining INTEGER,
  subscription_status TEXT,
  plan_name TEXT,
  is_free_trial BOOLEAN
) AS $$
DECLARE
  v_user_id UUID;
  v_subscription RECORD;
  v_plan RECORD;
  v_profile RECORD;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user profile for free trial info
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM public.user_subscriptions us
  WHERE us.user_id = v_user_id 
    AND us.subscription_status = 'active'
    AND us.current_billing_cycle_end > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If user has active subscription, use subscription logic
  IF FOUND THEN
    -- Get plan details
    SELECT * INTO v_plan
    FROM public.subscription_plans sp
    WHERE sp.id = v_subscription.plan_id;
    
    -- Check if user has remaining analyses
    IF v_subscription.analyses_used_this_month < v_plan.monthly_analyses_limit THEN
      RETURN QUERY SELECT 
        true,
        v_plan.monthly_analyses_limit - v_subscription.analyses_used_this_month,
        v_subscription.subscription_status,
        v_plan.plan_name,
        false; -- Not using free trial
    ELSE
      RETURN QUERY SELECT 
        false,
        0,
        v_subscription.subscription_status,
        v_plan.plan_name,
        false;
    END IF;
  ELSE
    -- No active subscription, check free trial
    IF v_profile.free_trial_analyses_remaining > 0 THEN
      RETURN QUERY SELECT 
        true,
        v_profile.free_trial_analyses_remaining,
        'free_trial'::TEXT,
        'Free Trial'::TEXT,
        true; -- Using free trial
    ELSE
      RETURN QUERY SELECT 
        false,
        0,
        'none'::TEXT,
        'none'::TEXT,
        false;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrement free trial counter
CREATE OR REPLACE FUNCTION public.use_free_trial_analysis(
  p_analysis_result_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- Check if user has free trial analyses remaining
  IF v_profile.free_trial_analyses_remaining <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No free trial analyses remaining'
    );
  END IF;
  
  -- Decrement free trial counter
  UPDATE public.profiles
  SET free_trial_analyses_remaining = free_trial_analyses_remaining - 1,
      updated_at = NOW()
  WHERE id = v_user_id;
  
  -- Track usage (without subscription_id since it's free trial)
  INSERT INTO public.usage_tracking (
    user_id,
    subscription_id,
    analysis_type,
    analysis_result_id,
    metadata
  ) VALUES (
    v_user_id,
    NULL,
    'body_analysis',
    p_analysis_result_id,
    jsonb_build_object('is_free_trial', true)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'analyses_remaining', v_profile.free_trial_analyses_remaining - 1,
    'is_free_trial', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the increment_usage_counter function to handle both subscription and free trial
CREATE OR REPLACE FUNCTION public.increment_usage_counter(
  p_analysis_result_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_subscription RECORD;
  v_result JSONB;
BEGIN
  v_user_id := auth.uid();
  
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM public.user_subscriptions us
  WHERE us.user_id = v_user_id 
    AND us.subscription_status = 'active'
    AND us.current_billing_cycle_end > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If user has active subscription, increment subscription counter
  IF FOUND THEN
    -- Increment counter
    UPDATE public.user_subscriptions
    SET analyses_used_this_month = analyses_used_this_month + 1,
        updated_at = NOW()
    WHERE id = v_subscription.id;
    
    -- Track usage
    INSERT INTO public.usage_tracking (
      user_id,
      subscription_id,
      analysis_type,
      analysis_result_id
    ) VALUES (
      v_user_id,
      v_subscription.id,
      'body_analysis',
      p_analysis_result_id
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'analyses_used', v_subscription.analyses_used_this_month + 1,
      'is_free_trial', false
    );
  ELSE
    -- No active subscription, use free trial
    RETURN public.use_free_trial_analysis(p_analysis_result_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_free_trial ON public.profiles(free_trial_analyses_remaining);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.can_user_analyze_with_trial() TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_free_trial_analysis(UUID) TO authenticated;

COMMENT ON COLUMN public.profiles.free_trial_analyses_remaining IS 'Number of free trial analyses remaining for users without subscription';
COMMENT ON COLUMN public.profiles.has_had_subscription IS 'Tracks if user has ever purchased a subscription';
COMMENT ON COLUMN public.profiles.has_spun_wheel IS 'Tracks if user has spun the free trial wheel';
COMMENT ON FUNCTION public.can_user_analyze_with_trial() IS 'Checks if user can analyze with subscription or free trial support';
COMMENT ON FUNCTION public.use_free_trial_analysis(UUID) IS 'Decrements free trial counter and tracks usage';
