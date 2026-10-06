import nodemailer from 'nodemailer'

// Konfigurasi transporter untuk Nodemailer.
// Mendukung Gmail SMTP (port 465 SSL) atau Inbucket lokal Supabase (port 54325).
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '127.0.0.1',
  port: Number(process.env.SMTP_PORT) || 54325,
  secure: process.env.SMTP_SECURE === 'true', // true untuk port 465 (SSL), false untuk 587 (STARTTLS)
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
})

const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM || 'noreply@kohisekai.com'
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Kohi Sekai'

/**
 * Fungsi untuk mengirim email sederhana
 * @param {string} to - Alamat email tujuan
 * @param {string} subject - Judul email
 * @param {string} html - Konten email dalam format HTML
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    })
    console.log('[Email] Message sent: %s', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('[Email] Error sending email:', error)
    return { success: false, error }
  }
}

