import express from 'express'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { sendEmail } from '../utils/email.js'

const router = express.Router()

/**
 * Mask an email address for privacy (e.g. kiki@gmail.com -> k***i@gmail.com)
 */
export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '***@***.com'
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }
  const first = local[0]
  const last = local[local.length - 1]
  const stars = '*'.repeat(Math.max(1, Math.min(local.length - 2, 4)))
  return `${first}${stars}${last}@${domain}`
}

/**
 * Helper to record audit log securely
 */
const recordAuditLog = async ({
  adminId = null,
  adminUsername = null,
  targetUserId,
  targetEmail = null,
  action,
  metadata = {},
  req
}) => {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.ip || '-') : '-'
    const userAgent = req ? (req.headers['user-agent'] || '-') : '-'

    await supabase.from('password_reset_audit_logs').insert({
      admin_id: adminId ? String(adminId) : null,
      admin_username: adminUsername || 'system',
      target_user_id: targetUserId,
      target_email: targetEmail,
      action,
      ip_address: typeof ip === 'string' ? ip.split(',')[0].trim() : String(ip),
      user_agent: typeof userAgent === 'string' ? userAgent.substring(0, 255) : '',
      metadata
    })
  } catch (err) {
    console.warn('[Audit Log] Failed to insert audit log:', err.message)
  }
}

// ==============================================================================
// 1. ADMIN: OPSI 1 - KIRIM LINK RESET KE EMAIL
// ==============================================================================
router.post('/admin/email/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params
    const adminUser = req.user

    // Fetch target user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nama, email, fan_id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return res.status(404).json({ error: 'Akun user tidak ditemukan' })
    }

    if (!user.email || user.email.includes('@refreshbreeze.com') || !user.email.includes('@')) {
      return res.status(400).json({
        error: 'User tidak memiliki email valid yang terdaftar untuk menerima link reset.'
      })
    }

    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const jwtSecret = process.env.JWT_SECRET || 'kohisekai_secret_jwt_key_2026'
    
    // Generate token explicitly to bypass Supabase Auth limitations for OTS accounts
    const resetToken = jwt.sign(
      { sub: user.id, email: user.email, purpose: 'password_reset' },
      jwtSecret,
      { expiresIn: '30m' }
    )
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(resetToken)}&type=email_token`

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Kohi Sekai</title>
</head>
<body style="margin:0;padding:0;background:#1A1512;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1512;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#241E19;border:1px solid #3A2E24;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
          <!-- Header Bar Accent -->
          <tr>
            <td style="background:#E8944A;height:4px;"></td>
          </tr>
          <!-- Logo & Title -->
          <tr>
            <td style="padding:36px 36px 24px;text-align:center;">
              <div style="display:inline-block;background:rgba(232,148,74,0.15);border:1px solid rgba(232,148,74,0.4);border-radius:12px;padding:12px 20px;margin-bottom:20px;">
                <span style="color:#E8944A;font-size:18px;font-weight:900;letter-spacing:2px;">KOHI SEKAI</span>
              </div>
              <h1 style="color:#F5E6D3;font-size:22px;font-weight:900;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Reset Password</h1>
              <p style="color:#B0A599;font-size:13px;margin:0;">Halo, <strong style="color:#F5E6D3;">${user.nama || 'Fan'}</strong>!</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 36px 36px;">
              <p style="color:#D5C9BD;font-size:14px;line-height:1.7;margin:0 0 20px;">
                Kami menerima permintaan reset password untuk akun Kohi Sekai yang terhubung dengan email ini dari Administrator. Klik tombol di bawah untuk membuat password baru.
              </p>
              <!-- CTA Button -->
              <div style="text-align:center;margin:28px 0;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:#E8944A;color:#1A1512;text-decoration:none;font-size:13px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;padding:14px 36px;border-radius:12px;box-shadow:0 4px 12px rgba(232,148,74,0.3);">
                  Atur Ulang Password
                </a>
              </div>
              <!-- Warning note -->
              <div style="background:#1A1512;border:1px solid #3A2E24;border-radius:10px;padding:16px;margin-top:12px;">
                <p style="color:#B0A599;font-size:12px;margin:0 0 6px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Perhatian</p>
                <ul style="color:#D5C9BD;font-size:12px;margin:0;padding-left:16px;line-height:1.8;">
                  <li>Link ini <strong style="color:#F5E6D3;">hanya berlaku 30 menit</strong> sejak email ini diterima.</li>
                  <li>Jangan bagikan link ini kepada siapapun.</li>
                </ul>
              </div>
              <!-- Link fallback -->
              <p style="color:#736253;font-size:11px;margin:20px 0 0;word-break:break-all;">
                Jika tombol tidak berfungsi, salin dan buka URL ini di browser:<br>
                <a href="${resetUrl}" style="color:#E8944A;text-decoration:none;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #3A2E24;text-align:center;">
              <p style="color:#736253;font-size:11px;margin:0;">
                Email ini dikirim oleh sistem otomatis Kohi Sekai. Harap tidak membalas email ini.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    // Send custom email
    await sendEmail({
      to: user.email,
      subject: 'Reset Password (Admin) - Kohi Sekai',
      html
    })

    const masked = maskEmail(user.email)

    // Audit log (never log passwords or tokens)
    await recordAuditLog({
      adminId: adminUser.id,
      adminUsername: adminUser.username,
      targetUserId: user.id,
      targetEmail: user.email,
      action: 'email_link_sent',
      metadata: { masked_email: masked },
      req
    })

    return res.json({
      success: true,
      message: `Link reset password telah dikirim ke ${masked}`,
      masked_email: masked
    })
  } catch (err) {
    console.error('[Reset Password Email] Server error:', err)
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server' })
  }
})

// ==============================================================================
// 2. ADMIN: OPSI 2 - GENERATE KODE OTP OLEH ADMIN
// ==============================================================================
router.post('/admin/otp/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params
    const adminUser = req.user

    // Fetch target user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nama, email, fan_id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return res.status(404).json({ error: 'Akun user tidak ditemukan' })
    }

    // Rate Limit: Maksimal 5x generate OTP per user dalam 1 jam
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount, error: countErr } = await supabase
      .from('password_reset_audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('target_user_id', user.id)
      .eq('action', 'otp_generated')
      .gte('created_at', oneHourAgo)

    if (!countErr && typeof recentCount === 'number' && recentCount >= 5) {
      return res.status(429).json({
        error: 'Batas generate kode OTP untuk user ini telah tercapai (maksimal 5 kali per jam). Silakan coba lagi nanti.'
      })
    }

    // Invalidate any previous unconsumed active tokens for this user
    try {
      await supabase
        .from('user_password_resets')
        .update({ used_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('used_at', null)
    } catch (invErr) {
      console.warn('[Reset OTP] Error invalidating old tokens:', invErr.message)
    }

    // Generate secure random 6-digit code using Node crypto
    const rawOtp = String(crypto.randomInt(100000, 999999))

    // Hash the OTP with bcrypt (never store plaintext OTP in DB!)
    const codeHash = await bcrypt.hash(rawOtp, 10)

    // Token expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const { error: insertErr } = await supabase
      .from('user_password_resets')
      .insert({
        user_id: user.id,
        code_hash: codeHash,
        expires_at: expiresAt,
        created_by: adminUser.username || String(adminUser.id),
        attempts: 0
      })

    if (insertErr) {
      console.error('[Reset OTP] DB insert error:', insertErr)
      return res.status(500).json({
        error: 'Gagal menyimpan kode OTP ke database. Pastikan tabel user_password_resets sudah dibuat melalui SQL migration.'
      })
    }

    // Record audit log (never log the plain OTP code!)
    await recordAuditLog({
      adminId: adminUser.id,
      adminUsername: adminUser.username,
      targetUserId: user.id,
      targetEmail: user.email,
      action: 'otp_generated',
      metadata: { expires_at: expiresAt },
      req
    })

    // Return the plaintext OTP code ONLY once in this response to the admin
    return res.json({
      success: true,
      otp_code: rawOtp,
      expires_at: expiresAt,
      message: 'Kode OTP reset berhasil dibuat. Kode ini berlaku selama 15 menit.'
    })
  } catch (err) {
    console.error('[Reset Password OTP] Server error:', err)
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server saat generate OTP' })
  }
})

// ==============================================================================
// 3. ADMIN: RIWAYAT RESET TERAKHIR UNTUK DETAIL USER
// ==============================================================================
router.get('/admin/history/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params

    const { data: logs, error } = await supabase
      .from('password_reset_audit_logs')
      .select('id, admin_username, action, metadata, created_at')
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return res.json({ success: true, data: [] })
    }

    const formatted = (logs || []).map(item => {
      let label = 'Aktivitas Reset'
      let type = 'info'

      switch (item.action) {
        case 'email_link_sent':
          label = 'Kirim Link Email'
          type = 'email'
          break
        case 'otp_generated':
          label = 'Generate Kode OTP'
          type = 'otp'
          break
        case 'otp_reset_success':
          label = 'Password Berhasil Direset'
          type = 'success'
          break
        case 'otp_failed_attempt':
          label = 'Percobaan Kode Gagal'
          type = 'failed'
          break
        case 'otp_burned':
          label = 'Kode Hangus (>5 salah)'
          type = 'warning'
          break
        default:
          label = item.action
      }

      return {
        id: item.id,
        label,
        type,
        action: item.action,
        admin: item.admin_username || 'Admin',
        created_at: item.created_at,
        metadata: item.metadata
      }
    })

    return res.json({ success: true, data: formatted })
  } catch (err) {
    console.error('[Reset History] Error:', err)
    return res.status(500).json({ error: 'Gagal memuat riwayat reset' })
  }
})

// ==============================================================================
// 4. USER-FACING: VERIFIKASI KODE OTP & SET PASSWORD BARU
// ==============================================================================
router.post('/verify-otp', async (req, res) => {
  const genericError = 'Kode reset tidak valid atau sudah kedaluwarsa.'

  try {
    const { identifier, code, new_password } = req.body

    if (!identifier || !code || !new_password) {
      return res.status(400).json({ error: 'Data tidak lengkap. Masukkan email/ID, kode OTP, dan password baru.' })
    }

    if (typeof new_password !== 'string' || new_password.length < 6) {
      return res.status(400).json({ error: 'Password minimal terdiri dari 6 karakter.' })
    }

    const cleanIdentifier = String(identifier).trim()
    const cleanCode = String(code).trim()
    const isNum = /^\d+$/.test(cleanIdentifier)
    const cleanNum = isNum ? parseInt(cleanIdentifier, 10) : null

    // 1. Find user in public.users by Email, Fan ID, or UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isUuid = UUID_REGEX.test(cleanIdentifier)

    let userQuery = supabase
      .from('users')
      .select('id, nama, email, fan_id')

    if (cleanIdentifier.includes('@')) {
      userQuery = userQuery.ilike('email', cleanIdentifier)
    } else if (isNum) {
      userQuery = userQuery.eq('fan_id', cleanNum)
    } else if (isUuid) {
      userQuery = userQuery.eq('id', cleanIdentifier)
    } else {
      userQuery = userQuery.ilike('email', cleanIdentifier)
    }

    const { data: userMatches, error: uErr } = await userQuery.limit(1)
    const targetUser = userMatches && userMatches[0] ? userMatches[0] : null

    if (uErr || !targetUser) {
      // Generic error so user existence is not leaked
      return res.status(400).json({ error: genericError })
    }

    // 2. Fetch the latest active OTP token for this user
    const { data: tokens, error: tErr } = await supabase
      .from('user_password_resets')
      .select('*')
      .eq('user_id', targetUser.id)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)

    const activeToken = tokens && tokens[0] ? tokens[0] : null

    if (tErr || !activeToken) {
      return res.status(400).json({ error: genericError })
    }

    // Check if token has expired (15 mins)
    const isExpired = new Date(activeToken.expires_at) < new Date()
    if (isExpired) {
      await supabase
        .from('user_password_resets')
        .update({ used_at: new Date().toISOString() })
        .eq('id', activeToken.id)

      await recordAuditLog({
        targetUserId: targetUser.id,
        targetEmail: targetUser.email,
        action: 'otp_expired',
        req
      })

      return res.status(400).json({ error: 'Kode reset telah kedaluwarsa. Silakan minta kode baru ke admin.' })
    }

    // Check attempts limit (max 5)
    if (activeToken.attempts >= 5) {
      await supabase
        .from('user_password_resets')
        .update({ used_at: new Date().toISOString() })
        .eq('id', activeToken.id)

      await recordAuditLog({
        targetUserId: targetUser.id,
        targetEmail: targetUser.email,
        action: 'otp_burned',
        req
      })

      return res.status(400).json({
        error: 'Kode reset hangus karena telah mencapai batas maksimal 5 kali percobaan salah. Hubungi admin untuk kode baru.'
      })
    }

    // 3. Verify code hash using bcrypt
    const isMatch = await bcrypt.compare(cleanCode, activeToken.code_hash)

    if (!isMatch) {
      // Increment failed attempts count
      const newAttempts = (activeToken.attempts || 0) + 1
      await supabase
        .from('user_password_resets')
        .update({ attempts: newAttempts })
        .eq('id', activeToken.id)

      await recordAuditLog({
        targetUserId: targetUser.id,
        targetEmail: targetUser.email,
        action: 'otp_failed_attempt',
        metadata: { attempts: newAttempts },
        req
      })

      const remaining = 5 - newAttempts
      if (remaining <= 0) {
        return res.status(400).json({
          error: 'Kode reset hangus karena telah salah 5 kali. Silakan minta kode baru ke admin.'
        })
      }

      return res.status(400).json({
        error: `Kode reset salah. Sisa kesempatan: ${remaining} kali percobaan.`
      })
    }

    // 4. Code is valid! Mark token as used immediately
    await supabase
      .from('user_password_resets')
      .update({ used_at: new Date().toISOString() })
      .eq('id', activeToken.id)

    // 5. Update user password in Supabase Auth (using Service Role Key)
    let authUpdated = false

    try {
      // Check if user exists in Supabase auth by ID
      const { data: authUserRes } = await supabase.auth.admin.getUserById(targetUser.id)
      
      if (authUserRes?.user) {
        const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(targetUser.id, {
          password: new_password
        })
        if (updateAuthErr) throw updateAuthErr
        authUpdated = true
      } else if (targetUser.email) {
        // If not found by ID, try creating or updating by email
        const { data: createdAuth, error: createAuthErr } = await supabase.auth.admin.createUser({
          id: targetUser.id,
          email: targetUser.email,
          password: new_password,
          email_confirm: true,
          user_metadata: { nama: targetUser.nama }
        })
        if (createAuthErr) {
          // If already exists with that email, update password
          const { error: updateByEmailErr } = await supabase.auth.admin.updateUserById(targetUser.id, {
            password: new_password
          })
          if (updateByEmailErr) throw updateByEmailErr
        }
        authUpdated = true
      }
    } catch (authErr) {
      console.error('[Reset Password] Supabase Auth update error:', authErr)
      return res.status(500).json({
        error: 'Gagal memperbarui password di server otentikasi. Silakan hubungi admin.'
      })
    }

    // Note: Supabase Auth updateUserById automatically revokes existing refresh tokens for the user

    // Audit log success
    await recordAuditLog({
      targetUserId: targetUser.id,
      targetEmail: targetUser.email,
      action: 'otp_reset_success',
      req
    })

    return res.json({
      success: true,
      message: 'Password akun Anda berhasil diperbarui! Silakan login dengan password baru Anda.'
    })
  } catch (err) {
    console.error('[Verify OTP] Server error:', err)
    return res.status(500).json({ error: 'Terjadi kesalahan server saat memproses reset password.' })
  }
})


// ==============================================================================
// 5. USER-FACING: REQUEST LINK RESET PASSWORD VIA EMAIL (GMAIL SMTP)
// ==============================================================================
router.post('/request-email', async (req, res) => {
  const GENERIC_OK = 'Jika email terdaftar, link reset password akan dikirim ke inbox Anda dalam beberapa menit.'

  try {
    const { email } = req.body

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Masukkan alamat email yang valid.' })
    }

    const cleanEmail = String(email).trim().toLowerCase()

    // Rate limit: max 3 request per email per 15 menit (cek audit log)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('password_reset_audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('target_email', cleanEmail)
      .eq('action', 'user_email_link_sent')
      .gte('created_at', fifteenMinAgo)

    if (typeof recentCount === 'number' && recentCount >= 3) {
      // Return generic OK so email enumeration tidak bocor, tapi di server kita tahu kenapa
      return res.json({ success: true, message: GENERIC_OK })
    }

    // Cari user di public.users (untuk verifikasi email terdaftar)
    const { data: userMatches } = await supabase
      .from('users')
      .select('id, nama, email')
      .ilike('email', cleanEmail)
      .limit(1)

    const targetUser = userMatches && userMatches[0] ? userMatches[0] : null

    // Selalu return OK agar email enumeration tidak bisa dilakukan
    if (!targetUser || !targetUser.email) {
      return res.json({ success: true, message: GENERIC_OK })
    }

    // Buat signed JWT token (expires 30 menit)
    const jwtSecret = process.env.JWT_SECRET || 'kohisekai_secret_jwt_key_2026'
    const resetToken = jwt.sign(
      { sub: targetUser.id, email: targetUser.email, purpose: 'password_reset' },
      jwtSecret,
      { expiresIn: '30m' }
    )

    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(resetToken)}&type=email_token`

    // Buat HTML email yang menarik sesuai tema Kohi Sekai (Warm Dark Coffee)
    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Kohi Sekai</title>
</head>
<body style="margin:0;padding:0;background:#1A1512;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1512;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#241E19;border:1px solid #3A2E24;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
          <!-- Header Bar Accent -->
          <tr>
            <td style="background:#E8944A;height:4px;"></td>
          </tr>
          <!-- Logo & Title -->
          <tr>
            <td style="padding:36px 36px 24px;text-align:center;">
              <div style="display:inline-block;background:rgba(232,148,74,0.15);border:1px solid rgba(232,148,74,0.4);border-radius:12px;padding:12px 20px;margin-bottom:20px;">
                <span style="color:#E8944A;font-size:18px;font-weight:900;letter-spacing:2px;">KOHI SEKAI</span>
              </div>
              <h1 style="color:#F5E6D3;font-size:22px;font-weight:900;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Reset Password</h1>
              <p style="color:#B0A599;font-size:13px;margin:0;">Halo, <strong style="color:#F5E6D3;">${targetUser.nama || 'Fan'}</strong>!</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 36px 36px;">
              <p style="color:#D5C9BD;font-size:14px;line-height:1.7;margin:0 0 20px;">
                Kami menerima permintaan reset password untuk akun Kohi Sekai yang terhubung dengan email ini. Klik tombol di bawah untuk membuat password baru.
              </p>
              <!-- CTA Button -->
              <div style="text-align:center;margin:28px 0;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:#E8944A;color:#1A1512;text-decoration:none;font-size:13px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;padding:14px 36px;border-radius:12px;box-shadow:0 4px 12px rgba(232,148,74,0.3);">
                  Atur Ulang Password
                </a>
              </div>
              <!-- Warning note -->
              <div style="background:#1A1512;border:1px solid #3A2E24;border-radius:10px;padding:16px;margin-top:12px;">
                <p style="color:#B0A599;font-size:12px;margin:0 0 6px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Perhatian</p>
                <ul style="color:#D5C9BD;font-size:12px;margin:0;padding-left:16px;line-height:1.8;">
                  <li>Link ini <strong style="color:#F5E6D3;">hanya berlaku 30 menit</strong> sejak email ini diterima.</li>
                  <li>Abaikan email ini jika Anda tidak merasa meminta reset password.</li>
                  <li>Jangan bagikan link ini kepada siapapun.</li>
                </ul>
              </div>
              <!-- Link fallback -->
              <p style="color:#736253;font-size:11px;margin:20px 0 0;word-break:break-all;">
                Jika tombol tidak berfungsi, salin dan buka URL ini di browser:<br>
                <a href="${resetUrl}" style="color:#E8944A;text-decoration:none;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #3A2E24;text-align:center;">
              <p style="color:#736253;font-size:11px;margin:0;">
                Email ini dikirim oleh sistem otomatis Kohi Sekai. Harap tidak membalas email ini.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const emailResult = await sendEmail(
      targetUser.email,
      'Reset Password Akun Kohi Sekai',
      html
    )

    if (!emailResult.success) {
      console.error('[Request Email Reset] sendEmail failed:', emailResult.error)
      // Jangan expose error internal, cukup log
    }

    // Audit log
    await recordAuditLog({
      targetUserId: targetUser.id,
      targetEmail: targetUser.email,
      action: 'user_email_link_sent',
      metadata: { masked_email: maskEmail(targetUser.email), email_sent: emailResult.success },
      req
    })

    return res.json({ success: true, message: GENERIC_OK })
  } catch (err) {
    console.error('[Request Email Reset] Server error:', err)
    // Tetap return generic OK agar tidak leak info
    return res.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim ke inbox Anda.' })
  }
})

// ==============================================================================
// 6. USER-FACING: KONFIRMASI TOKEN EMAIL & SET PASSWORD BARU
// ==============================================================================
router.post('/confirm-email', async (req, res) => {
  try {
    const { token, new_password } = req.body

    if (!token || !new_password) {
      return res.status(400).json({ error: 'Data tidak lengkap. Token dan password baru diperlukan.' })
    }

    if (typeof new_password !== 'string' || new_password.length < 6) {
      return res.status(400).json({ error: 'Password minimal terdiri dari 6 karakter.' })
    }

    // Verifikasi JWT token
    const jwtSecret = process.env.JWT_SECRET || 'kohisekai_secret_jwt_key_2026'
    let decoded
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(400).json({ error: 'Link reset password telah kedaluwarsa (berlaku 30 menit). Silakan minta link baru.' })
      }
      return res.status(400).json({ error: 'Link reset password tidak valid atau telah digunakan.' })
    }

    if (decoded.purpose !== 'password_reset' || !decoded.sub) {
      return res.status(400).json({ error: 'Token tidak valid.' })
    }

    const userId = decoded.sub
    const userEmail = decoded.email

    // Cek user masih ada
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nama, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return res.status(400).json({ error: 'Akun tidak ditemukan atau telah dihapus.' })
    }

    // Update password di Supabase Auth
    try {
      const { data: authUserRes } = await supabase.auth.admin.getUserById(userId)

      if (authUserRes?.user) {
        const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(userId, {
          password: new_password
        })
        if (updateAuthErr) throw updateAuthErr
      } else if (user.email) {
        // Fallback for OTS / Admin-created accounts that only exist in public.users
        const { error: createAuthErr } = await supabase.auth.admin.createUser({
          id: user.id,
          email: user.email,
          password: new_password,
          email_confirm: true,
          user_metadata: { nama: user.nama }
        })
        if (createAuthErr) {
          // If already exists with that email but not ID, just update password
          const { error: updateByEmailErr } = await supabase.auth.admin.updateUserById(user.id, {
            password: new_password
          })
          if (updateByEmailErr) throw updateByEmailErr
        }
      } else {
        return res.status(400).json({ error: 'Akun autentikasi tidak ditemukan. Hubungi admin.' })
      }
    } catch (authErr) {
      console.error('[Confirm Email Reset] Auth update error:', authErr)
      return res.status(500).json({ error: 'Gagal memperbarui password. Silakan coba lagi atau hubungi admin.' })
    }

    // Audit log
    await recordAuditLog({
      targetUserId: user.id,
      targetEmail: user.email || userEmail,
      action: 'email_token_reset_success',
      req
    })

    return res.json({
      success: true,
      message: 'Password berhasil diperbarui! Silakan login dengan password baru Anda.'
    })
  } catch (err) {
    console.error('[Confirm Email Reset] Server error:', err)
    return res.status(500).json({ error: 'Terjadi kesalahan server saat memproses reset password.' })
  }
})

export default router
