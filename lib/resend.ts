import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export const FROM = process.env.EMAIL_FROM ?? 'noreply@example.com'
export const OWNER_EMAIL = process.env.EMAIL_OWNER ?? ''
export const BUSINESS_NAME = process.env.NEXT_PUBLIC_BUSINESS_NAME ?? 'Your Business'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
