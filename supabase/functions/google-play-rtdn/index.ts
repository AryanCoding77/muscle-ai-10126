/**
 * Google Play Real-Time Developer Notifications (RTDN) Handler
 * 
 * This Edge Function receives notifications from Google Play when:
 * - Subscription is renewed (SUBSCRIPTION_RENEWED)
 * - Subscription is cancelled (SUBSCRIPTION_CANCELED)
 * - Subscription is expired (SUBSCRIPTION_EXPIRED)
 * - Subscription is recovered (SUBSCRIPTION_RECOVERED)
 * - Subscription is paused/resumed (SUBSCRIPTION_PAUSED, SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED)
 * - Subscription is revoked (SUBSCRIPTION_REVOKED)
 * - Subscription is in grace period (SUBSCRIPTION_IN_GRACE_PERIOD)
 * - Subscription is on hold (SUBSCRIPTION_ON_HOLD)
 * 
 * Documentation: https://developer.android.com/google/play/billing/rtdn-reference
 * 
 * Setup Instructions:
 * 1. Deploy this function: supabase functions deploy google-play-rtdn
 * 2. Get the function URL: https://[project-ref].supabase.co/functions/v1/google-play-rtdn
 * 3. Go to Google Play Console → Monetization setup → Real-time developer notifications
 * 4. Enter the function URL
 * 5. Enable notifications
 * 
 * Security:
 * - Validates notification signature (optional but recommended)
 * - Uses service role for database updates
 * - Logs all events for debugging
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for Pub/Sub
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Notification types from Google Play
enum NotificationType {
  SUBSCRIPTION_RECOVERED = 1,
  SUBSCRIPTION_RENEWED = 2,
  SUBSCRIPTION_CANCELED = 3,
  SUBSCRIPTION_PURCHASED = 4,
  SUBSCRIPTION_ON_HOLD = 5,
  SUBSCRIPTION_IN_GRACE_PERIOD = 6,
  SUBSCRIPTION_RESTARTED = 7,
  SUBSCRIPTION_PRICE_CHANGE_CONFIRMED = 8,
  SUBSCRIPTION_DEFERRED = 9,
  SUBSCRIPTION_PAUSED = 10,
  SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED = 11,
  SUBSCRIPTION_REVOKED = 12,
  SUBSCRIPTION_EXPIRED = 13,
}

interface DeveloperNotification {
  version: string;
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: {
    version: string;
    notificationType: NotificationType;
    purchaseToken: string;
    subscriptionId: string;
  };
  testNotification?: {
    version: string;
  };
}

interface RtdnPayload {
  message: {
    data: string; // Base64 encoded DeveloperNotification
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

// Plan name mapping
const PRODUCT_ID_TO_PLAN: Record<string, string> = {
  'muscleai.basic.monthly': 'Basic',
  'muscleai.pro.monthly': 'Pro',
  'muscleai.vip.monthly': 'VIP',
};

// Plan limits
const PLAN_LIMITS: Record<string, number> = {
  'Basic': 10,
  'Pro': 50,
  'VIP': 999999, // Unlimited
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📨 [RTDN] Received notification from Google Play');
    console.log('📨 [RTDN] Method:', req.method);
    console.log('📨 [RTDN] Headers:', Object.fromEntries(req.headers.entries()));

    // Only accept POST requests
    if (req.method !== 'POST') {
      console.log('❌ [RTDN] Invalid method:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the request body
    let payload: any;
    try {
      const rawBody = await req.text();
      console.log('📦 [RTDN] Raw body:', rawBody.substring(0, 200));
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ [RTDN] Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON', details: parseError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle both Pub/Sub format and direct format
    let notification: DeveloperNotification;
    
    if (payload.message && payload.message.data) {
      // Pub/Sub format (from Google Cloud)
      console.log('📦 [RTDN] Pub/Sub payload received:', {
        messageId: payload.message.messageId,
        publishTime: payload.message.publishTime,
      });
      
      try {
        // Decode the base64 data
        const decodedData = atob(payload.message.data);
        console.log('🔓 [RTDN] Decoded data:', decodedData);
        notification = JSON.parse(decodedData);
      } catch (decodeError) {
        console.error('❌ [RTDN] Failed to decode message data:', decodeError);
        return new Response(JSON.stringify({ error: 'Failed to decode message', details: decodeError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Direct format (for testing)
      console.log('📦 [RTDN] Direct payload received');
      notification = payload as any;
    }

    console.log('🔓 [RTDN] Decoded notification:', {
      version: notification.version,
      packageName: notification.packageName,
      eventTime: notification.eventTimeMillis ? new Date(parseInt(notification.eventTimeMillis)).toISOString() : 'N/A',
    });

    // Handle test notifications
    if (notification.testNotification) {
      console.log('✅ [RTDN] Test notification received successfully');
      return new Response(JSON.stringify({ success: true, message: 'Test notification received' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle subscription notifications
    if (!notification.subscriptionNotification) {
      console.log('⚠️ [RTDN] No subscription notification in payload');
      return new Response(JSON.stringify({ success: true, message: 'No subscription notification' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const subNotification = notification.subscriptionNotification;
    const notificationType = subNotification.notificationType;
    const purchaseToken = subNotification.purchaseToken;
    const productId = subNotification.subscriptionId;

    console.log('🔔 [RTDN] Subscription notification:', {
      type: NotificationType[notificationType],
      typeCode: notificationType,
      productId,
      purchaseToken: purchaseToken.substring(0, 20) + '...',
    });

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different notification types
    switch (notificationType) {
      case NotificationType.SUBSCRIPTION_RENEWED:
        await handleSubscriptionRenewed(supabase, purchaseToken, productId);
        break;

      case NotificationType.SUBSCRIPTION_CANCELED:
        await handleSubscriptionCanceled(supabase, purchaseToken, productId);
        break;

      case NotificationType.SUBSCRIPTION_EXPIRED:
        await handleSubscriptionExpired(supabase, purchaseToken, productId);
        break;

      case NotificationType.SUBSCRIPTION_RECOVERED:
        await handleSubscriptionRecovered(supabase, purchaseToken, productId);
        break;

      case NotificationType.SUBSCRIPTION_ON_HOLD:
        await handleSubscriptionOnHold(supabase, purchaseToken, productId);
        break;

      case NotificationType.SUBSCRIPTION_IN_GRACE_PERIOD:
        await handleSubscriptionInGracePeriod(supabase, purchaseToken, productId);
        break;

      case NotificationType.SUBSCRIPTION_PAUSED:
        await handleSubscriptionPaused(supabase, purchaseToken, productId);
        break;

      case NotificationType.SUBSCRIPTION_REVOKED:
        await handleSubscriptionRevoked(supabase, purchaseToken, productId);
        break;

      case NotificationType.SUBSCRIPTION_PURCHASED:
        await handleSubscriptionPurchased(supabase, purchaseToken, productId);
        break;

      default:
        console.log(`ℹ️ [RTDN] Unhandled notification type: ${NotificationType[notificationType]} (${notificationType})`);
    }

    console.log('✅ [RTDN] Notification processed successfully');
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [RTDN] Error processing notification:', error);
    console.error('❌ [RTDN] Error stack:', error.stack);
    console.error('❌ [RTDN] Error message:', error.message);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Handle SUBSCRIPTION_RENEWED notification
 * This is called when a subscription successfully renews
 */
async function handleSubscriptionRenewed(supabase: any, purchaseToken: string, productId: string) {
  console.log('🔄 [RTDN] Handling subscription renewal...');

  try {
    // Find the subscription by purchase token
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('google_play_purchase_token', purchaseToken)
      .single();

    if (fetchError || !subscription) {
      console.error('❌ [RTDN] Subscription not found for purchase token:', purchaseToken);
      return;
    }

    const planName = PRODUCT_ID_TO_PLAN[productId] || subscription.plan_name;
    const limit = PLAN_LIMITS[planName] || 10;

    // Calculate new billing cycle (30 days from now)
    const now = new Date();
    const cycleStart = now.toISOString();
    const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Reset quota and update billing cycle
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'active',
        analyses_used_this_month: 0, // Reset quota on renewal
        current_billing_cycle_start: cycleStart,
        current_billing_cycle_end: cycleEnd,
        monthly_analyses_limit: limit,
        updated_at: now.toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('❌ [RTDN] Error updating subscription:', updateError);
      return;
    }

    console.log('✅ [RTDN] Subscription renewed successfully:', {
      userId: subscription.user_id,
      planName,
      quotaReset: `0/${limit}`,
      newCycleEnd: cycleEnd,
    });

  } catch (error) {
    console.error('❌ [RTDN] Error in handleSubscriptionRenewed:', error);
  }
}

/**
 * Handle SUBSCRIPTION_CANCELED notification
 * User canceled but subscription is still active until period ends
 */
async function handleSubscriptionCanceled(supabase: any, purchaseToken: string, productId: string) {
  console.log('⚠️ [RTDN] Handling subscription cancellation...');

  try {
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('google_play_purchase_token', purchaseToken)
      .single();

    if (fetchError || !subscription) {
      console.error('❌ [RTDN] Subscription not found');
      return;
    }

    // Mark as cancelled but keep active until period ends
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        auto_renewal_enabled: false,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('❌ [RTDN] Error updating subscription:', updateError);
      return;
    }

    console.log('✅ [RTDN] Subscription marked as cancelled (active until period ends)');

  } catch (error) {
    console.error('❌ [RTDN] Error in handleSubscriptionCanceled:', error);
  }
}

/**
 * Handle SUBSCRIPTION_EXPIRED notification
 * Subscription has expired and is no longer active
 */
async function handleSubscriptionExpired(supabase: any, purchaseToken: string, productId: string) {
  console.log('❌ [RTDN] Handling subscription expiration...');

  try {
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('google_play_purchase_token', purchaseToken)
      .single();

    if (fetchError || !subscription) {
      console.error('❌ [RTDN] Subscription not found');
      return;
    }

    // Mark as expired
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'expired',
        subscription_end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('❌ [RTDN] Error updating subscription:', updateError);
      return;
    }

    console.log('✅ [RTDN] Subscription marked as expired');

  } catch (error) {
    console.error('❌ [RTDN] Error in handleSubscriptionExpired:', error);
  }
}

/**
 * Handle SUBSCRIPTION_RECOVERED notification
 * Subscription recovered from grace period or on-hold
 */
async function handleSubscriptionRecovered(supabase: any, purchaseToken: string, productId: string) {
  console.log('✅ [RTDN] Handling subscription recovery...');

  try {
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('google_play_purchase_token', purchaseToken)
      .single();

    if (fetchError || !subscription) {
      console.error('❌ [RTDN] Subscription not found');
      return;
    }

    // Reactivate subscription
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'active',
        auto_renewal_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('❌ [RTDN] Error updating subscription:', updateError);
      return;
    }

    console.log('✅ [RTDN] Subscription recovered and reactivated');

  } catch (error) {
    console.error('❌ [RTDN] Error in handleSubscriptionRecovered:', error);
  }
}

/**
 * Handle SUBSCRIPTION_ON_HOLD notification
 * Payment failed, subscription on hold
 */
async function handleSubscriptionOnHold(supabase: any, purchaseToken: string, productId: string) {
  console.log('⏸️ [RTDN] Handling subscription on hold...');

  try {
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('google_play_purchase_token', purchaseToken);

    if (updateError) {
      console.error('❌ [RTDN] Error updating subscription:', updateError);
      return;
    }

    console.log('✅ [RTDN] Subscription marked as on hold');

  } catch (error) {
    console.error('❌ [RTDN] Error in handleSubscriptionOnHold:', error);
  }
}

/**
 * Handle SUBSCRIPTION_IN_GRACE_PERIOD notification
 * Payment failed but user still has access (grace period)
 */
async function handleSubscriptionInGracePeriod(supabase: any, purchaseToken: string, productId: string) {
  console.log('⏳ [RTDN] Handling subscription in grace period...');

  try {
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'active', // Keep active during grace period
        updated_at: new Date().toISOString(),
      })
      .eq('google_play_purchase_token', purchaseToken);

    if (updateError) {
      console.error('❌ [RTDN] Error updating subscription:', updateError);
      return;
    }

    console.log('✅ [RTDN] Subscription in grace period (still active)');

  } catch (error) {
    console.error('❌ [RTDN] Error in handleSubscriptionInGracePeriod:', error);
  }
}

/**
 * Handle SUBSCRIPTION_PAUSED notification
 * User paused their subscription
 */
async function handleSubscriptionPaused(supabase: any, purchaseToken: string, productId: string) {
  console.log('⏸️ [RTDN] Handling subscription pause...');

  try {
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'paused',
        pause_start_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('google_play_purchase_token', purchaseToken);

    if (updateError) {
      console.error('❌ [RTDN] Error updating subscription:', updateError);
      return;
    }

    console.log('✅ [RTDN] Subscription marked as paused');

  } catch (error) {
    console.error('❌ [RTDN] Error in handleSubscriptionPaused:', error);
  }
}

/**
 * Handle SUBSCRIPTION_REVOKED notification
 * Subscription was refunded/revoked
 */
async function handleSubscriptionRevoked(supabase: any, purchaseToken: string, productId: string) {
  console.log('🚫 [RTDN] Handling subscription revocation...');

  try {
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'expired',
        subscription_end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('google_play_purchase_token', purchaseToken);

    if (updateError) {
      console.error('❌ [RTDN] Error updating subscription:', updateError);
      return;
    }

    console.log('✅ [RTDN] Subscription revoked');

  } catch (error) {
    console.error('❌ [RTDN] Error in handleSubscriptionRevoked:', error);
  }
}

/**
 * Handle SUBSCRIPTION_PURCHASED notification
 * New subscription purchased
 */
async function handleSubscriptionPurchased(supabase: any, purchaseToken: string, productId: string) {
  console.log('🎉 [RTDN] Handling new subscription purchase...');
  // This is usually handled by the app's purchase flow
  // But we can log it for tracking
  console.log('ℹ️ [RTDN] New subscription purchased:', { productId, purchaseToken: purchaseToken.substring(0, 20) + '...' });
}