// Supabase Edge Function: Verify Google Play Purchase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const GOOGLE_PLAY_SERVICE_ACCOUNT_KEY = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPurchaseRequest {
  purchase_token: string;
  product_id: string;
  user_id: string;
  subscription_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { purchase_token, product_id, user_id, subscription_id }: VerifyPurchaseRequest = await req.json();

    if (!purchase_token || !product_id || !user_id) {
      throw new Error('Missing required fields');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // TODO: Verify purchase with Google Play Developer API
    // For now, we'll trust the client and activate the subscription
    // In production, you MUST verify with Google's API

    const now = new Date();
    const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Update or create subscription
    if (subscription_id) {
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          subscription_status: 'active',
          google_play_purchase_token: purchase_token,
          google_play_product_id: product_id,
          current_billing_cycle_start: now.toISOString(),
          current_billing_cycle_end: cycleEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', subscription_id);

      if (updateError) {
        throw new Error(`Failed to update subscription: ${updateError.message}`);
      }
    }

    // Record payment transaction
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', user_id)
      .eq('subscription_status', 'active')
      .single();

    if (subscription) {
      await supabase
        .from('payment_transactions')
        .insert({
          user_id,
          subscription_id: subscription.id,
          google_play_purchase_token: purchase_token,
          google_play_product_id: product_id,
          amount_paid_usd: subscription.subscription_plans.plan_price_usd,
          currency: 'USD',
          payment_status: 'captured',
          payment_method: 'google_play',
          transaction_date: now.toISOString(),
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        subscription: subscription ? {
          id: subscription.id,
          plan_name: subscription.subscription_plans.plan_name,
          status: 'active',
        } : null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error verifying purchase:', error);
    return new Response(
      JSON.stringify({
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
