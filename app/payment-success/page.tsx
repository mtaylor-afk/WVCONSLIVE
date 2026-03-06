import { CheckCircle } from 'lucide-react'

export default function PaymentSuccessPage() {
  const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME ?? 'Your Contractor'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3 text-balance">Payment Received</h1>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Thank you! Your payment has been successfully processed.
          {' '}{businessName} will be notified and you will receive a confirmation.
        </p>
        <p className="text-sm text-muted-foreground/70">You may safely close this page.</p>
      </div>
    </div>
  )
}
