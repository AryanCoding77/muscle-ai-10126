-- Migration: Add Google Play Billing columns to database
-- Run this in your Supabase SQL Editor

-- Add Google Play columns to user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT,
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

-- Add Google Play columns to payment_transactions table
ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT,
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

-- Add Google Play product ID to subscription_plans table (optional, for reference)
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

-- Update subscription_plans with Google Play product IDs
UPDATE public.subscription_plans
SET google_play_product_id = 'muscleai.basic.monthly'
WHERE plan_name = 'Basic';

UPDATE public.subscription_plans
SET google_play_product_id = 'muscleai.pro.monthly'
WHERE plan_name = 'Pro';

UPDATE public.subscription_plans
SET google_play_product_id = 'muscleai.vip.monthly'
WHERE plan_name = 'VIP';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_google_play_token 
ON public.user_subscriptions(google_play_purchase_token);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_google_play_token 
ON public.payment_transactions(google_play_purchase_token);

-- Verify the changes
SELECT plan_name, google_play_product_id FROM public.subscription_plans;
