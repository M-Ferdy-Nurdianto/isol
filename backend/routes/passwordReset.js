import express from 'express'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

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
    const redirectTo = `${frontendBaseUrl}/reset-password`

    // Send reset email via Supabase Auth
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo
    })

    if (resetErr) {
      console.error('[Reset Password] Supabase reset error:', resetErr)
      return res.status(500).json({ error: resetErr.message || 'Gagal mengirim email reset password.' })
    }

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

export default router
