import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

/**
 * Create a Stripe Payment Link for a given invoice.
 * Returns the URL customers can use to pay by card.
 */
export async function createPaymentLink({
  quoteId,
  invoiceRef,
  amountGBP,
  customerEmail,
  customerName,
  description,
}: {
  quoteId: string
  invoiceRef: string
  amountGBP: number
  customerEmail: string
  customerName: string
  description: string
}): Promise<string> {
  // Create a one-time price
  const price = await stripe.prices.create({
    unit_amount: Math.round(amountGBP * 100), // pence
    currency: 'gbp',
    product_data: {
      name: `${process.env.NEXT_PUBLIC_BUSINESS_NAME ?? 'Invoice'} — ${invoiceRef}`,
      metadata: { quoteId },
    },
  })

  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    customer_creation: 'if_required',
    after_completion: {
      type: 'redirect',
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?invoice=${quoteId}`,
      },
    },
    metadata: { quoteId, invoiceRef },
    // Pre-fill customer email to make checkout smoother
    ...(customerEmail
      ? {
          custom_fields: [],
        }
      : {}),
  })

  return link.url
}
