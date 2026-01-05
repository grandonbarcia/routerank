import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = await createClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // Find user by Stripe customer metadata
        const customer = await stripe.customers.retrieve(customerId);
        if ('deleted' in customer && customer.deleted) break;

        const supabaseId = customer.metadata?.supabase_uid;

        if (supabaseId) {
          // Determine subscription tier based on price ID
          let subscriptionTier = 'free';
          const priceId = subscription.items.data[0].price.id;

          if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
            subscriptionTier = 'pro';
          } else if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) {
            subscriptionTier = 'agency';
          }

          // Update user's subscription in database
          await supabase
            .from('profiles')
            .update({
              subscription_tier: subscriptionTier,
              stripe_subscription_id: subscription.id,
            })
            .eq('id', supabaseId);

          console.log(
            `[Webhook] Updated user ${supabaseId} to ${subscriptionTier}`
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get customer metadata
        const customer = await stripe.customers.retrieve(customerId);
        if ('deleted' in customer && customer.deleted) break;
        const supabaseId = customer.metadata?.supabase_uid;

        if (supabaseId) {
          // Determine new tier
          let subscriptionTier = 'free';
          const priceId = subscription.items.data[0].price.id;

          if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
            subscriptionTier = 'pro';
          } else if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) {
            subscriptionTier = 'agency';
          }

          // Update subscription
          await supabase
            .from('profiles')
            .update({
              subscription_tier: subscriptionTier,
            })
            .eq('id', supabaseId);

          console.log(
            `[Webhook] Updated user ${supabaseId} subscription to ${subscriptionTier}`
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get customer metadata
        const customer = await stripe.customers.retrieve(customerId);
        if ('deleted' in customer && customer.deleted) break;
        const supabaseId = customer.metadata?.supabase_uid;

        if (supabaseId) {
          // Downgrade to free tier
          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'free',
              stripe_subscription_id: null,
            })
            .eq('id', supabaseId);

          console.log(`[Webhook] Downgraded user ${supabaseId} to free`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(
          `[Webhook] Payment failed for customer ${invoice.customer}`
        );
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
