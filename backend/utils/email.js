import 'dotenv/config'
import nodemailer from 'nodemailer'

/**
 * Transporter Nodemailer untuk pengiriman via SMTP (Lokal / Development)
 * Mendukung Gmail SMTP (port 465 SSL) atau Inbucket lokal Supabase (port 54325).
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '127.0.0.1',
  port: Number(process.env.SMTP_PORT) || 54325,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
})

/**
 * Kirim email via Resend REST API (HTTPS - Sangat andal untuk Online / Vercel Serverless)
 */
const sendWithResend = async ({ to, subject, html, from }) => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not defined in environment variables')
  }

  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || `Resend error code: ${response.status}`)
  }

  return { success: true, messageId: data.id, provider: 'resend' }
}

/**
 * Kirim email via Nodemailer (SMTP - Cocok untuk Lokal / Development)
 */
const sendWithNodemailer = async ({ to, subject, html, from }) => {
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
  })
  return { success: true, messageId: info.messageId, provider: 'nodemailer' }
}

/**
 * Pengiriman email universal:
 * - Online / Production: Otomatis menggunakan Resend jika RESEND_API_KEY tersedia
 * - Lokal / Development: Menggunakan Nodemailer SMTP (Gmail / Inbucket)
 * 
 * Mendukung 2 format pemanggilan:
 * 1. sendEmail(to, subject, html)
 * 2. sendEmail({ to, subject, html })
 */
export const sendEmail = async (toOrPayload, maybeSubject, maybeHtml) => {
  let to, subject, html

  if (typeof toOrPayload === 'object' && toOrPayload !== null) {
    to = toOrPayload.to
    subject = toOrPayload.subject
    html = toOrPayload.html
  } else {
    to = toOrPayload
    subject = maybeSubject
    html = maybeHtml
  }

  const fromName = process.env.EMAIL_FROM_NAME || 'Kohi Sekai'
  const isOnlineResend = Boolean(
    process.env.RESEND_API_KEY && (
      process.env.EMAIL_PROVIDER !== 'smtp' &&
      process.env.EMAIL_PROVIDER !== 'nodemailer'
    )
  )

  // Default sender address:
  // Gunakan RESEND_FROM atau EMAIL_FROM jika valid, default ke domain verified: noreply@kohiprototype.ferdy.web.id
  let fromAddress = process.env.RESEND_FROM
  if (!fromAddress) {
    if (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes('@gmail.com') && !process.env.EMAIL_FROM.includes('@yahoo.com')) {
      fromAddress = process.env.EMAIL_FROM
    } else {
      fromAddress = 'noreply@kohiprototype.ferdy.web.id'
    }
  }
  const from = `"${fromName}" <${fromAddress}>`

  try {
    if (isOnlineResend) {
      const result = await sendWithResend({ to, subject, html, from })
      console.log('[Email:Resend] Email sent successfully to %s | ID: %s', to, result.messageId)
      return result
    } else {
      const result = await sendWithNodemailer({ to, subject, html, from })
      console.log('[Email:Nodemailer] Email sent successfully to %s | ID: %s', to, result.messageId)
      return result
    }
  } catch (error) {
    console.error(`[Email Error] Failed sending via ${isOnlineResend ? 'Resend' : 'Nodemailer'}:`, error.message)
    return { success: false, error: error.message || error }
  }
}
