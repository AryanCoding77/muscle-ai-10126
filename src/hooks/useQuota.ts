/**
 * useQuota Hook - Manages quota reset logic
 * 
 * Handles automatic quota reset when:
 * - Subscription is active
 * - New billing period has started (based on current_billing_cycle_end)
 * 
 * Uses centralized PLAN_LIMITS for correct per-plan quotas.
 */

import { supabase } from '../lib/supabase';
import { PLAN_LIMITS, PlanName, getBillingPeriodMs } from '../constants/subscriptionPlans';

export interface QuotaInfo {
  analysesUsed: number;
  analysesLimit: number;
  analysesRemaining: number;
  needsReset: boolean;
}

/**
 * Get current quota for user
 */
export async function getUserQuota(userId: string): Promise<QuotaInfo | null> {
  try {
    console.log('🔍 [Quota] Fetching quota for user:', userId);

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('plan_name, monthly_analyses_limit, analyses_used_this_month, current_billing_cycle_start, current_billing_cycle_end')
      .eq('user_id', userId)
      .eq('subscription_status', 'active')
      .single();

    if (error) {
      console.error('❌ [Quota] Error fetching quota:', error);
      return null;
    }

    if (!data) {
      console.log('ℹ️ [Quota] No active subscription found');
      return null;
    }

    const planName = data.plan_name as PlanName;
    const analysesUsed = data.analyses_used_this_month || 0;
    // Use stored limit, fallback to PLAN_LIMITS if not set
    const analysesLimit = data.monthly_analyses_limit || PLAN_LIMITS[planName] || 0;
    const analysesRemaining = Math.max(0, analysesLimit - analysesUsed);
    
    // Check if we're past the billing cycle end
    const now = new Date();
    const cycleEnd = data.current_billing_cycle_end ? new Date(data.current_billing_cycle_end) : null;
    const needsReset = cycleEnd ? now > cycleEnd : false;

    console.log('📊 [Quota] Current quota:', {
      planName,
      analysesUsed,
      analysesLimit,
      analysesRemaining,
      cycleEnd: cycleEnd?.toISOString(),
      needsReset,
    });

    return {
      analysesUsed,
      analysesLimit,
      analysesRemaining,
      needsReset,
    };
  } catch (error) {
    console.error('❌ [Quota] Exception in getUserQuota:', error);
    return null;
  }
}

/**
 * Check and reset quota if needed
 * 
 * NEW LOGIC:
 * 1. Checks if user has active subscription
 * 2. Checks if current_billing_cycle_end has passed (new billing period)
 * 3. If new period, resets quota to 0 and updates billing cycle dates
 * 4. Returns remaining analyses based on correct plan limit
 * 
 * Called on:
 * - App start
 * - App foreground
 * - After purchase
 */
export async function checkAndResetQuotaIfNeeded(
  userId: string,
  activePlan: PlanName
): Promise<number> {
  try {
    console.log('🔄 [Quota] Checking quota for reset...', {
      userId,
      activePlan,
    });

    // Fetch subscription with billing cycle info
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('plan_name, monthly_analyses_limit, analyses_used_this_month, current_billing_cycle_start, current_billing_cycle_end')
      .eq('user_id', userId)
      .eq('subscription_status', 'active')
      .single();

    if (error || !subscription) {
      console.log('ℹ️ [Quota] No active subscription record for user', userId);
      return 0;
    }

    const planName = subscription.plan_name as PlanName;
    const limit = subscription.monthly_analyses_limit ?? PLAN_LIMITS[activePlan];
    const now = new Date();
    const cycleEnd = subscription.current_billing_cycle_end 
      ? new Date(subscription.current_billing_cycle_end) 
      : null;

    console.log('📊 [Quota] Subscription details:', {
      planName,
      limit,
      used: subscription.analyses_used_this_month,
      cycleEnd: cycleEnd?.toISOString(),
      now: now.toISOString(),
    });

    // First-time fix: if cycleEnd missing, initialize it
    if (!cycleEnd) {
      console.log('🔧 [Quota] Billing cycle not set, initializing...');
      
      const periodMs = getBillingPeriodMs();
      const start = new Date();
      const end = new Date(start.getTime() + periodMs);

      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          current_billing_cycle_start: start.toISOString(),
          current_billing_cycle_end: end.toISOString(),
          monthly_analyses_limit: limit,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ [Quota] Error initializing billing cycle:', updateError);
      } else {
        console.log('✅ [Quota] Billing cycle initialized:', {
          start: start.toISOString(),
          end: end.toISOString(),
          limit,
        });
      }

      return limit - (subscription.analyses_used_this_month ?? 0);
    }

    // NEW: Reset when we're in a new billing period, regardless of how many were used
    if (now > cycleEnd) {
      console.log('🔄 [Quota] New billing period detected, resetting quota for', planName);

      const periodMs = getBillingPeriodMs();
      const newStart = cycleEnd; // Start from where last period ended
      const newEnd = new Date(cycleEnd.getTime() + periodMs);

      const { error: resetError } = await supabase
        .from('user_subscriptions')
        .update({
          analyses_used_this_month: 0,
          current_billing_cycle_start: newStart.toISOString(),
          current_billing_cycle_end: newEnd.toISOString(),
          monthly_analyses_limit: limit,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (resetError) {
        console.error('❌ [Quota] Error resetting quota:', resetError);
        return Math.max(limit - (subscription.analyses_used_this_month ?? 0), 0);
      }

      console.log('✅ [Quota] Quota reset successfully:', {
        from: `${subscription.analyses_used_this_month}/${limit}`,
        to: `0/${limit}`,
        plan: planName,
        newCycleStart: newStart.toISOString(),
        newCycleEnd: newEnd.toISOString(),
      });

      return limit; // Full quota available
    }

    // Still in same period: return remaining based on correct plan limit
    const used = subscription.analyses_used_this_month ?? 0;
    const remaining = Math.max(limit - used, 0);

    console.log('✅ [Quota] Still in current billing period:', {
      used: `${used}/${limit}`,
      remaining,
      cycleEndsIn: Math.round((cycleEnd.getTime() - now.getTime()) / 1000 / 60) + ' minutes',
    });

    return remaining;
  } catch (error) {
    console.error('❌ [Quota] Exception in checkAndResetQuotaIfNeeded:', error);
    return 0;
  }
}

/**
 * Force reset quota (for testing or manual reset)
 */
export async function forceResetQuota(userId: string): Promise<boolean> {
  try {
    console.log('🔄 [Quota] Force resetting quota for user:', userId);

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        analyses_used_this_month: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('subscription_status', 'active');

    if (error) {
      console.error('❌ [Quota] Error force resetting quota:', error);
      return false;
    }

    console.log('✅ [Quota] Quota force reset successfully');
    return true;
  } catch (error) {
    console.error('❌ [Quota] Exception in forceResetQuota:', error);
    return false;
  }
}
