/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    res.status(500).json({ error: 'Stripe not configured' })
    return
  }

  const { amountCents } = req.body as { amountCents: unknown }

  if (typeof amountCents !== 'number' || amountCents < 100) {
    res.status(400).json({ error: 'Amount must be at least 100 cents (S$1.00)' })
    return
  }

  const stripe = new Stripe(secret, { apiVersion: '2026-01-28.clover' as any })

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'sgd',
            product_data: {
              name: 'Buy Manish a coffee ☕',
              description: 'Supporting LongQ Kopi — a free Singapore hawker drink game',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://longqkopi.vercel.app/',
      cancel_url: 'https://longqkopi.vercel.app/',
    })

    res.json({ url: session.url })
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? 'Checkout session failed' })
  }
}
