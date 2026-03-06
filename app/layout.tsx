import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME ?? 'Construction Manager'

export const metadata: Metadata = {
  title: {
    default: businessName,
    template: `%s — ${businessName}`,
  },
  description: 'Quotes, invoices, and payments for your construction business.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a2332',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} bg-background antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
