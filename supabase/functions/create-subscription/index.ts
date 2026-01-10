// Supabase Edge Function: Create Subscription with Google Play Billing

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  plan_id: string;
  user_id: string;
  google_play_purchase_token?: string;
  google_play_product_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { plan_id, user_id, google_play_purchase_token, google_play_product_id }: CreateSubscriptionRequest = await req.json();

    if (!plan_id || !user_id) {
      throw new Error('Missing required fields: plan_id and user_id');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      throw new Error('Invalid plan ID');
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('subscription_status', 'active')
      .single();

    if (existingSubscription) {
      console.log('🔄 Cancelling existing subscription to allow plan change');
      
      await supabase
        .from('user_subscriptions')
        .update({
          subscription_status: 'cancelled',
          auto_renewal_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id);
    }

    // Calculate billing cycle dates
    const now = new Date();
    const cycleStart = now;
    const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Create subscription record
    const { data: newSubscription, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id,
        plan_id,
        subscription_status: google_play_purchase_token ? 'active' : 'pending',
        google_play_purchase_token: google_play_purchase_token || null,
        google_play_product_id: google_play_product_id || null,
        current_billing_cycle_start: cycleStart.toISOString(),
        current_billing_cycle_end: cycleEnd.toISOString(),
        analyses_used_this_month: 0,
        auto_renewal_enabled: true,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create subscription: ${insertError.message}`);
    }

    console.log('✅ Subscription created:', newSubscription.id);

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: newSubscription.id,
        status: newSubscription.subscription_status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
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
