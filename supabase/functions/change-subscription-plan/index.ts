// Supabase Edge Function: Change Subscription Plan (Upgrade/Downgrade)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChangePlanRequest {
  subscription_id: string;
  new_plan_id: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { subscription_id, new_plan_id, user_id }: ChangePlanRequest = await req.json();

    if (!subscription_id || !new_plan_id || !user_id) {
      throw new Error('Missing required fields: subscription_id, new_plan_id, user_id');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current subscription
    const { data: currentSubscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('id', subscription_id)
      .eq('user_id', user_id)
      .single();

    if (subError || !currentSubscription) {
      throw new Error('Subscription not found');
    }

    if (currentSubscription.subscription_status !== 'active') {
      throw new Error('Can only change plan for active subscriptions');
    }

    // Get new plan details
    const { data: newPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', new_plan_id)
      .single();

    if (planError || !newPlan) {
      throw new Error('Invalid new plan ID');
    }

    // Check if it's actually a different plan
    if (currentSubscription.plan_id === new_plan_id) {
      throw new Error('New plan is the same as current plan');
    }

    // Determine if upgrade or downgrade
    const isUpgrade = newPlan.plan_price_usd > currentSubscription.subscription_plans.plan_price_usd;
    const changeType = isUpgrade ? 'upgrade' : 'downgrade';

    console.log(`📊 Plan change: ${changeType} from ${currentSubscription.subscription_plans.plan_name} to ${newPlan.plan_name}`);

    // For Google Play, we need to:
    // 1. Cancel the current subscription
    // 2. Create a new subscription with the new plan
    // Note: The actual Google Play subscription change happens on the client side
    // This function just updates our database records

    // Cancel current subscription
    await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        auto_renewal_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription_id);

    // Create new subscription with new plan
    const now = new Date();
    const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: newSubscription, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id,
        plan_id: new_plan_id,
        subscription_status: 'pending', // Will be activated after Google Play purchase
        current_billing_cycle_start: now.toISOString(),
        current_billing_cycle_end: cycleEnd.toISOString(),
        analyses_used_this_month: 0,
        auto_renewal_enabled: true,
        metadata: {
          previous_subscription_id: subscription_id,
          change_type: changeType,
          changed_at: now.toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create new subscription: ${insertError.message}`);
    }

    console.log('✅ Plan change initiated:', newSubscription.id);

    return new Response(
      JSON.stringify({
        success: true,
        new_subscription_id: newSubscription.id,
        change_type: changeType,
        message: `Plan ${changeType} initiated. Complete purchase in Google Play to activate.`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error changing subscription plan:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
