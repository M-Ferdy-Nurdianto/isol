import nodemailer from 'nodemailer';

// Konfigurasi transporter untuk Nodemailer.
// Secara default akan mengarah ke port Inbucket Supabase Local (54325) yang baru saja kita uncomment,
// atau jika ingin menggunakan layanan lokal lain seperti Ethereal Email, ganti kredensial di sini.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '127.0.0.1',
  port: process.env.SMTP_PORT || 54325,
  secure: process.env.SMTP_SECURE === 'true', // true untuk port 465, false untuk 587/lainnya
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

/**
 * Fungsi untuk mengirim email sederhana
 * @param {string} to - Alamat email tujuan
 * @param {string} subject - Judul email
 * @param {string} html - Konten email dalam format HTML
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: '"Kohi Sekai" <noreply@kohisekai.com>', // Alamat pengirim
      to,
      subject,
      html,
    });
    console.log('[Email] Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return { success: false, error };
  }
};
