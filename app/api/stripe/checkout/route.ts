import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SUPABASE_URL))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'MX Tracker Premium',
              description: 'Unlimited features, advanced analytics, and priority support.',
            },
            unit_amount: 999,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', 'vercel.app') || 'http://localhost:3000'}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', 'vercel.app') || 'http://localhost:3000'}/settings`,
    })

    return NextResponse.redirect(session.url!)
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
