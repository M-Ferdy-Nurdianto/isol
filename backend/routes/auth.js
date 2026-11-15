import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import { sendEmail } from '../utils/email.js'
import { JWT_SECRET, signToken, verifyToken } from '../config/jwt.js'

const router = express.Router()

// In-memory OTP store for Registration
const otpStore = new Map()

// ============================================================================
// RATE LIMITER OTP REGISTRASI (Anti-Spam & Hemat Kuota Resend)
// 1. Pelacakan berbasis IP pengirim (dan fallback email)
// 2. 3x pengiriman pertama: jeda minimal 30 detik antar pengiriman
// 3. Setelah 3x pengiriman: jeda wajib 10 menit (600 detik)
// ============================================================================
const otpRateLimitStore = new Map()

// Cleanup berkala setiap 30 menit
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of otpRateLimitStore.entries()) {
    if (now - data.lastSentAt > 2 * 60 * 60 * 1000 && (!data.blockedUntil || now > data.blockedUntil)) {
      otpRateLimitStore.delete(key)
    }
  }
}, 30 * 60 * 1000)

const getOtpClientIp = (req) => {
  const cfIp = req.headers['cf-connecting-ip']
  if (typeof cfIp === 'string' && cfIp.trim().length > 0) return cfIp.trim()
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) return forwarded.split(',')[0].trim()
  return req.ip || req.socket?.remoteAddress || 'unknown-ip'
}

const checkOtpRateLimit = (req) => {
  const now = Date.now()
  const ip = getOtpClientIp(req)
  const key = `ip:${ip}`

  let record = otpRateLimitStore.get(key)
  if (!record) {
    record = { count: 0, lastSentAt: 0, blockedUntil: 0 }
    otpRateLimitStore.set(key, record)
  }

  // 1. Cek apakah masih dalam masa blokir 10 menit
  if (record.blockedUntil && now < record.blockedUntil) {
    const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000)
    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60
    const timeFormatted = minutes > 0 ? `${minutes} menit ${seconds} detik` : `${seconds} detik`
    return {
      allowed: false,
      statusCode: 429,
      error: `Batas pengiriman kode tercapai (3x). Silakan tunggu ${timeFormatted} sebelum meminta kode baru.`,
      retryAfter: remainingSeconds,
      isBlocked: true,
      attempts: record.count,
      blockedUntil: record.blockedUntil
    }
  }

  // Jika masa blokir sudah berakhir, reset siklus ke awal
  if (record.blockedUntil && now >= record.blockedUntil) {
    record.count = 0
    record.blockedUntil = 0
  }

  // 2. Cek jika sudah 3x kirim dan belum lewat 10 menit
  if (record.count >= 3) {
    const tenMinutes = 10 * 60 * 1000
    if (now - record.lastSentAt < tenMinutes) {
      record.blockedUntil = record.lastSentAt + tenMinutes
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000)
      const minutes = Math.floor(remainingSeconds / 60)
      const seconds = remainingSeconds % 60
      const timeFormatted = minutes > 0 ? `${minutes} menit ${seconds} detik` : `${seconds} detik`
      return {
        allowed: false,
        statusCode: 429,
        error: `Batas pengiriman kode tercapai (3x). Silakan tunggu ${timeFormatted} sebelum meminta kode baru.`,
        retryAfter: remainingSeconds,
        isBlocked: true,
        attempts: record.count,
        blockedUntil: record.blockedUntil
      }
    } else {
      record.count = 0
      record.blockedUntil = 0
    }
  }

  // 3. Cek jeda antar pengiriman 30 detik untuk pengiriman 1-3
  if (record.count > 0) {
    const thirtySeconds = 30 * 1000
    const elapsed = now - record.lastSentAt
    if (elapsed < thirtySeconds) {
      const remainingSeconds = Math.ceil((thirtySeconds - elapsed) / 1000)
      return {
        allowed: false,
        statusCode: 429,
        error: `Harap tunggu ${remainingSeconds} detik sebelum meminta kode baru.`,
        retryAfter: remainingSeconds,
        isBlocked: false,
        attempts: record.count
      }
    }
  }

  return { allowed: true, record, ip }
}

const recordOtpSent = (req) => {
  const now = Date.now()
  const ip = getOtpClientIp(req)
  const key = `ip:${ip}`

  let record = otpRateLimitStore.get(key)
  if (!record) {
    record = { count: 0, lastSentAt: 0, blockedUntil: 0 }
    otpRateLimitStore.set(key, record)
  }

  record.count += 1
  record.lastSentAt = now

  if (record.count >= 3) {
    record.blockedUntil = now + 10 * 60 * 1000
    return {
      cooldown: 600, // 10 menit
      attempts: record.count,
      maxAttempts: 3,
      isBlocked: true,
      blockedUntil: record.blockedUntil
    }
  }

  return {
    cooldown: 30, // 30 detik
    attempts: record.count,
    maxAttempts: 3,
    isBlocked: false,
    blockedUntil: null
  }
}

// ============================================================================
// 1. UNIFIED LOGIN (Admin by username/password OR Fan by email)
// ============================================================================
router.post('/login', async (req, res) => {
  try {
    const { username, password, email } = req.body

    // Case A: Admin Login via username & password
    if (username) {
      if (!password) {
        return res.status(400).json({ error: 'Password wajib diisi' })
      }

      // Guest sandbox credentials
      if (username.trim() === 'GS123' && password === 'GS321') {
        const token = signToken(
          { id: 'guest-demo-user', username: 'GS123', role: 'guest' },
          { expiresIn: '1d' }
        )
        return res.json({
          success: true,
          token,
          user: {
            id: 'guest-demo-user',
            username: 'GS123',
            full_name: 'Guest Tester (Demo)',
            role: 'guest'
          }
        })
      }

      // Fetch admin user
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .single()

      if (error || !admin) {
        return res.status(401).json({ error: 'Username atau password salah' })
      }

      const isValid = await bcrypt.compare(password, admin.password_hash)
      if (!isValid) {
        return res.status(401).json({ error: 'Username atau password salah' })
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '1d' }
      )

      return res.json({
        success: true,
        token,
        user: {
          id: admin.id,
          username: admin.username,
          full_name: admin.full_name,
          role: 'admin'
        }
      })
    }

    // Case B: Fan Login via email
    if (email) {
      const cleanEmail = email.trim().toLowerCase()
      const { data: fanUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (error || !fanUser) {
        return res.status(404).json({
          error: 'Email belum terdaftar. Silakan registrasi terlebih dahulu.'
        })
      }

      // Jika password disertakan, verifikasi dengan Supabase Auth
      if (password) {
        try {
          const { error: authErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: String(password)
          })
          if (authErr) {
            const msg = (authErr.message || '').toLowerCase()
            if (msg.includes('invalid') || msg.includes('credential') || authErr.status === 400) {
              return res.status(401).json({ error: 'Password yang Anda masukkan salah' })
            }
          }
        } catch (authCatchErr) {
          console.warn('[Fan Login] Password verification fallback:', authCatchErr.message)
        }
      }

      const token = jwt.sign(
        {
          id: fanUser.id,
          email: fanUser.email,
          nama: fanUser.nama,
          role: fanUser.role || 'fan'
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      )

      return res.json({
        success: true,
        token,
        user: {
          id: fanUser.id,
          fan_id: fanUser.fan_id,
          nama: fanUser.nama,
          email: fanUser.email,
          whatsapp: fanUser.whatsapp,
          instagram: fanUser.instagram,
          image_url: fanUser.image_url || null,
          banner_url: fanUser.banner_url || null,
          role: fanUser.role || 'fan'
        }
      })
    }

    return res.status(400).json({ error: 'Masukkan email untuk fan atau username untuk admin' })
  } catch (error) {
    console.error('Error during login:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// 2. UNIFIED REGISTER (Fan registration OR Admin setup)
// ============================================================================
router.post('/register', async (req, res) => {
  try {
    const { username, password, full_name, secret, nama, email, whatsapp, instagram } = req.body

    // Case A: Admin setup registration
    if (secret && secret === 'KOHI_SEKAI_SETUP_2026') {
      if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi' })
      }

      const password_hash = await bcrypt.hash(password, 10)
      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          username,
          password_hash,
          full_name: full_name || username
        })
        .select()
        .single()

      if (error) throw error

      return res.json({ success: true, message: 'Admin user created', user: { username, full_name } })
    }

    // Case B: Fan Registration (nama, email, whatsapp, instagram)
    const fanNama = nama || full_name
    if (!fanNama || fanNama.trim().length < 2) {
      return res.status(400).json({ error: 'Nama lengkap wajib diisi (minimal 2 karakter)' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isOts = req.body.source === 'ots' || req.body.ots === true

    // Email: WAJIB untuk OTS agar fan menerima Magic Link 30 hari & Password Acak
    if (!email || !emailRegex.test(email.trim())) {
      if (isOts) {
        return res.status(400).json({ error: 'Email aktif fan wajib diisi agar sistem dapat mengirimkan link login 1-klik dan password.' })
      }
      return res.status(400).json({ error: 'Format email tidak valid' })
    }
    const cleanEmail = email.trim().toLowerCase()

    const cleanWhatsapp = (whatsapp || '').replace(/[^0-9+]/g, '')
    if (cleanWhatsapp && cleanWhatsapp.length > 0 && cleanWhatsapp.length < 8) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid (minimal 8 digit)' })
    }

    const cleanNama = fanNama.trim()
    const cleanInstagram = instagram ? `@${instagram.trim().replace(/^@/, '')}` : null

    // Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle()

    let savedUser = null

    if (existingUser) {
      const { data: updated, error: updateErr } = await supabase
        .from('users')
        .update({
          nama: cleanNama,
          whatsapp: cleanWhatsapp || existingUser.whatsapp,
          instagram: cleanInstagram || existingUser.instagram,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateErr) throw updateErr
      savedUser = updated
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('users')
        .insert({
          nama: cleanNama,
          email: cleanEmail,
          whatsapp: cleanWhatsapp || null,
          instagram: cleanInstagram,
          role: 'fan'
        })
        .select()
        .single()

      if (insertErr) throw insertErr
      savedUser = inserted
    }

    // ── Generate 6-Character Random Password (e.g. FKS82A, FKS9B4) ──
    const generateOtsPassword = () => {
      const pool = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
      let code = 'FKS'
      for (let i = 0; i < 3; i++) {
        code += pool.charAt(Math.floor(Math.random() * pool.length))
      }
      return code
    }
    const randomPassword = isOts ? generateOtsPassword() : null

    // Sinkronkan ke Supabase Auth dengan email terverifikasi langsung (tanpa butuh kode OTP di venue)
    if (isOts && randomPassword && savedUser) {
      try {
        const { data: authUserRes } = await supabase.auth.admin.getUserById(savedUser.id)
        if (authUserRes?.user) {
          await supabase.auth.admin.updateUserById(savedUser.id, {
            password: randomPassword,
            email_confirm: true
          })
        } else {
          await supabase.auth.admin.createUser({
            id: savedUser.id,
            email: cleanEmail,
            password: randomPassword,
            email_confirm: true,
            user_metadata: { nama: cleanNama }
          })
        }
      } catch (authErr) {
        console.warn('[OTS Register] Supabase auth admin warning:', authErr.message)
      }
    }

    // ── Generate Magic Login Token (Aktif 30 Hari) ──
    let magicLink = null
    if (isOts && savedUser) {
      try {
        const magicToken = jwt.sign(
          { id: savedUser.id, email: savedUser.email, purpose: 'magic_login' },
          JWT_SECRET,
          { expiresIn: '30d' }
        )
        const frontendBaseUrl = req.headers.origin || process.env.FRONTEND_URL || 'https://kohiprototype.ferdy.web.id'
        magicLink = `${frontendBaseUrl.replace(/\/$/, '')}/magic-login?token=${magicToken}`

        // Kirim Email Aktivasi Resmi Kohi Sekai (Deep Coffee - Clean, Formal, No Emojis)
        const fanCodeFormatted = String(savedUser.fan_id || '').padStart(4, '0')
        const emailHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aktivasi Akun Fan Kohi Sekai</title>
</head>
<body style="margin:0;padding:0;background-color:#1A1512;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#F5E6D3;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#1A1512;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#241E19;border:1px solid #3A2E24;border-radius:12px;overflow:hidden;">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color:#1A1512;padding:24px 28px;border-bottom:1px solid #3A2E24;text-align:center;">
              <span style="font-size:10px;letter-spacing:3px;color:#E8944A;font-weight:700;text-transform:uppercase;display:block;margin-bottom:4px;">Official Fan Space</span>
              <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:1.5px;color:#F5E6D3;">KOHI SEKAI</h1>
              <span style="font-size:11px;color:#B0A599;">Dunia Kopi · Yogyakarta</span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:28px 28px 24px;">
              <p style="font-size:15px;line-height:1.6;margin:0 0 14px 0;color:#F5E6D3;">
                Halo <strong>${cleanNama}</strong>,
              </p>
              <p style="font-size:13px;line-height:1.6;margin:0 0 22px 0;color:#B0A599;">
                Akun Fan Kohi Sekai Anda telah berhasil didaftarkan melalui layanan On-the-Spot (OTS) venue. Berikut adalah rincian keanggotaan resmi Anda:
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#1A1512;border:1px solid #3A2E24;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:4px 0;font-size:12px;color:#B0A599;width:140px;">Nomor Fan ID</td>
                        <td style="padding:4px 0;font-size:13px;font-weight:700;color:#E8944A;font-family:monospace;">#${fanCodeFormatted}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:12px;color:#B0A599;">Alamat Email</td>
                        <td style="padding:4px 0;font-size:13px;font-weight:600;color:#F5E6D3;">${cleanEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:12px;color:#B0A599;">Password Sementara</td>
                        <td style="padding:4px 0;font-size:13px;font-weight:700;color:#E8944A;font-family:monospace;letter-spacing:1px;">${randomPassword}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Primary CTA Button -->
              <div style="text-align:center;margin:24px 0 20px 0;">
                <a href="${magicLink}" style="display:inline-block;background-color:#E8944A;color:#1A1512;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.5px;padding:13px 32px;border-radius:8px;text-transform:uppercase;">
                  Masuk ke Akun Saya
                </a>
              </div>

              <p style="font-size:11px;line-height:1.5;color:#B0A599;text-align:center;margin:0 0 20px 0;">
                Tombol masuk di atas aktif selama <strong>30 hari</strong>. Anda dapat mengkliknya langsung untuk mengakses profil tanpa perlu memasukkan password.
              </p>

              <div style="background-color:#1A1512;border:1px solid #3A2E24;border-radius:8px;padding:12px 16px;">
                <p style="font-size:11px;line-height:1.5;color:#B0A599;margin:0;">
                  Demi keamanan akun, Anda dapat memperbarui password sementara kapan saja melalui menu Pengaturan Profil setelah masuk.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1A1512;padding:18px 28px;border-top:1px solid #3A2E24;text-align:center;">
              <p style="font-size:11px;color:#736253;margin:0 0 4px 0;">
                Kohi Sekai (コーヒーの世界) · Indonesian Japanese-Style Idol Group
              </p>
              <p style="font-size:10px;color:#55483D;margin:0;">
                Email ini dikirimkan secara otomatis oleh sistem. Harap tidak membalas email ini.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

        // Kirim email async tanpa memblokir respon registrasi
        sendEmail(
          cleanEmail,
          `Aktivasi Akun Fan Kohi Sekai - #${fanCodeFormatted}`,
          emailHtml
        ).catch(err => console.error('[OTS Welcome Email] Gagal kirim email:', err))

      } catch (tokenErr) {
        console.error('[OTS Magic Token] Error generating magic link:', tokenErr)
      }
    }

    const token = jwt.sign(
      {
        id: savedUser.id,
        email: savedUser.email,
        nama: savedUser.nama,
        role: savedUser.role || 'fan'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(201).json({
      success: true,
      token,
      message: isOts 
        ? 'Akun fan berhasil dibuat! Email aktivasi telah dikirim ke fan.' 
        : 'Registrasi berhasil',
      tempPassword: randomPassword || undefined,
      user: {
        id: savedUser.id,
        fan_id: savedUser.fan_id,
        fan_code: String(savedUser.fan_id || '').padStart(4, '0'),
        nama: savedUser.nama,
        email: savedUser.email,
        whatsapp: savedUser.whatsapp,
        instagram: savedUser.instagram,
        image_url: savedUser.image_url || null,
        banner_url: savedUser.banner_url || null,
        role: savedUser.role || 'fan'
      }
    })
  } catch (error) {
    console.error('Error during register:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// 2B. 1-CLICK MAGIC LOGIN (Masa Aktif 30 Hari via Email OTS)
// ============================================================================
router.post('/magic-login', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ error: 'Token login tidak disertakan' })
    }

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Link login sudah kadaluarsa (lebih dari 30 hari). Silakan login manual dengan email dan password Anda.' })
      }
      return res.status(401).json({ error: 'Link login tidak valid atau sudah rusak' })
    }

    if (decoded.purpose !== 'magic_login') {
      return res.status(400).json({ error: 'Tipe token login tidak valid' })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .maybeSingle()

    if (error || !user) {
      return res.status(404).json({ error: 'Akun fan tidak ditemukan' })
    }

    // Generate normal session token (30 hari)
    const sessionToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nama: user.nama,
        role: user.role || 'fan'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    return res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        fan_id: user.fan_id,
        fan_code: String(user.fan_id || '').padStart(4, '0'),
        nama: user.nama,
        email: user.email,
        whatsapp: user.whatsapp,
        instagram: user.instagram,
        image_url: user.image_url || null,
        banner_url: user.banner_url || null,
        role: user.role || 'fan'
      }
    })
  } catch (error) {
    console.error('[Magic Login Error]:', error)
    res.status(500).json({ error: 'Terjadi kesalahan server saat memproses login.' })
  }
})

// ============================================================================
// 3. FAN QUICK LOGIN / REGISTER (Compatible with existing FanAuthModal)
// ============================================================================
router.post('/fan/login', async (req, res) => {
  try {
    const { nama, email, whatsapp, instagram, password } = req.body

    if (!nama || nama.trim().length < 2) {
      return res.status(400).json({ error: 'Nama lengkap wajib diisi (minimal 2 karakter)' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Format email tidak valid' })
    }

    const cleanWhatsapp = (whatsapp || '').replace(/[^0-9+]/g, '')
    if (!cleanWhatsapp || cleanWhatsapp.length < 8) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid (minimal 8 digit)' })
    }

    const cleanInstagram = (instagram || '').trim().replace(/^@/, '')
    const cleanEmail = email.trim().toLowerCase()
    const cleanNama = nama.trim()

    let fanRecord = null

    // Try upserting to Supabase users table
    try {
      const { data: existingFan } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (existingFan) {
        const { data: updated } = await supabase
          .from('users')
          .update({
            nama: cleanNama,
            whatsapp: cleanWhatsapp,
            instagram: cleanInstagram ? `@${cleanInstagram}` : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFan.id)
          .select()
          .single()

        fanRecord = updated || existingFan
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('users')
          .insert({
            nama: cleanNama,
            email: cleanEmail,
            whatsapp: cleanWhatsapp,
            instagram: cleanInstagram ? `@${cleanInstagram}` : null,
            role: 'fan'
          })
          .select()
          .single()

        if (!insertError && inserted) {
          fanRecord = inserted
        }
      }

      // Sinkronkan password ke Supabase Auth jika fan menyertakan password
      if (password && fanRecord && fanRecord.id) {
        try {
          const { data: authUserRes } = await supabase.auth.admin.getUserById(fanRecord.id)
          if (authUserRes?.user) {
            await supabase.auth.admin.updateUserById(fanRecord.id, {
              password: String(password)
            })
          } else {
            await supabase.auth.admin.createUser({
              id: fanRecord.id,
              email: cleanEmail,
              password: String(password),
              email_confirm: true,
              user_metadata: { nama: cleanNama }
            })
          }
        } catch (authSyncErr) {
          console.warn('[Fan Register] Supabase auth password sync warning:', authSyncErr.message)
        }
      }
    } catch (dbErr) {
      console.warn('[FanAuth] DB users error, fallback to session:', dbErr.message)
    }

    // Fallback if needed
    if (!fanRecord) {
      fanRecord = {
        id: `fan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        nama: cleanNama,
        email: cleanEmail,
        whatsapp: cleanWhatsapp,
        instagram: cleanInstagram ? `@${cleanInstagram}` : null,
        role: 'fan',
        created_at: new Date().toISOString()
      }
    }

    // Generate JWT token (30 days validity)
    const token = jwt.sign(
      {
        id: fanRecord.id,
        email: fanRecord.email,
        nama: fanRecord.nama,
        role: fanRecord.role || 'fan'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      success: true,
      token,
      user: {
        id: fanRecord.id,
        fan_id: fanRecord.fan_id,
        nama: fanRecord.nama,
        email: fanRecord.email,
        whatsapp: fanRecord.whatsapp,
        instagram: fanRecord.instagram,
        image_url: fanRecord.image_url || null,
        banner_url: fanRecord.banner_url || null,
        role: fanRecord.role || 'fan'
      }
    })
  } catch (error) {
    console.error('Error in fan login:', error)
    res.status(500).json({ error: error.message || 'Gagal memproses login fan' })
  }
})

// ============================================================================
// 4. GET /api/auth/me (Verify session token & get user profile)
// ============================================================================
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    if (decoded.role === 'admin') {
      const { data: admin } = await supabase
        .from('admin_users')
        .select('id, username, full_name')
        .eq('id', decoded.id)
        .maybeSingle()

      return res.json({
        success: true,
        user: {
          id: decoded.id,
          username: admin?.username || decoded.username,
          full_name: admin?.full_name || 'Admin',
          role: 'admin'
        }
      })
    }

    // Fan user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .maybeSingle()

    if (error || !user) {
      // If found by email
      const { data: userByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', decoded.email)
        .maybeSingle()

      if (userByEmail) {
        return res.json({ success: true, user: userByEmail })
      }

      return res.json({
        success: true,
        user: {
          id: decoded.id,
          nama: decoded.nama,
          email: decoded.email,
          role: 'fan'
        }
      })
    }

    res.json({ success: true, user })
  } catch (error) {
    res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa' })
  }
})

// ============================================================================
// 5. GET /api/auth/fan/orders (Histori pesanan fan by email)
// ============================================================================
router.get('/fan/orders', async (req, res) => {
  try {
    const { email, user_id } = req.query

    if (!email && !user_id) {
      return res.status(400).json({ error: 'Email atau User ID diperlukan untuk mengambil histori' })
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        events (
          id,
          nama,
          tanggal,
          bulan,
          tahun,
          lokasi,
          theme_color
        ),
        members (
          id,
          nama_panggung,
          image_url
        ),
        order_items (
          id,
          item_name,
          price,
          quantity,
          member_id
        )
      `)

    if (email && user_id) {
      query = query.or(`email.ilike.${email.trim()},user_id.eq.${user_id}`)
    } else if (email) {
      query = query.ilike('email', email.trim())
    } else if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    res.json({ success: true, data: orders || [] })
  } catch (error) {
    console.error('Error fetching fan orders:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// 6. POST /api/auth/verify-turnstile (Cloudflare Turnstile Verification API)
// ============================================================================
router.post('/verify-turnstile', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token Turnstile tidak ditemukan' })
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAAF_c-nTm2Qg7hufzNDMX2-1TKkc'

    // Call Cloudflare siteverify endpoint
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: req.ip || '',
      }),
    })

    const outcome = await response.json()

    // For testing/dummy keys or valid response
    if (outcome.success || token.startsWith('turnstile-') || secretKey.startsWith('1x0000000000000000000000000000000AA')) {
      return res.json({ success: true, message: 'Verifikasi Cloudflare Turnstile berhasil' })
    }

    return res.status(400).json({
      success: false,
      error: 'Verifikasi Cloudflare Turnstile gagal. Silakan coba lagi.',
      details: outcome['error-codes'] || [],
    })
  } catch (err) {
    console.error('Error verifying Turnstile token:', err)
    // Fallback gracefully for local dev testing
    return res.json({ success: true, message: 'Verifikasi Turnstile berhasil (dev fallback)' })
  }
})

// ============================================================================
// 7. POST /api/auth/test-email (Test Nodemailer & Supabase Inbucket)
// ============================================================================
router.post('/test-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body
    if (!to || !subject) {
      return res.status(400).json({ error: 'Email tujuan (to) dan subject wajib diisi' })
    }

    const result = await sendEmail(to, subject, html || '<h1>Halo dari Kohi Sekai!</h1><p>Ini adalah email percobaan.</p>')
    
    if (result.success) {
      return res.json({
        success: true,
        message: 'Email berhasil dikirim via Resend',
        from: result.from,
        messageId: result.messageId
      })
    } else {
      throw result.error
    }
  } catch (error) {
    console.error('Error in test-email:', error)
    res.status(500).json({
      error: typeof error === 'string' ? error : (error?.message || JSON.stringify(error)),
      hasResendKey: Boolean(process.env.RESEND_API_KEY)
    })
  }
})

// ============================================================================
// 8. GET /api/auth/otp-status (Check Resend Cooldown Status for Client)
// ============================================================================
router.get('/otp-status', (req, res) => {
  const check = checkOtpRateLimit(req)
  if (!check.allowed) {
    return res.json({
      canResend: false,
      retryAfter: check.retryAfter,
      isBlocked: check.isBlocked,
      attempts: check.attempts,
      error: check.error,
      blockedUntil: check.blockedUntil
    })
  }

  const ip = getOtpClientIp(req)
  const record = otpRateLimitStore.get(`ip:${ip}`) || { count: 0, lastSentAt: 0 }
  const now = Date.now()
  let retryAfter = 0
  if (record.count > 0 && record.count < 3) {
    const elapsed = now - record.lastSentAt
    if (elapsed < 30000) {
      retryAfter = Math.ceil((30000 - elapsed) / 1000)
    }
  }

  return res.json({
    canResend: retryAfter === 0,
    retryAfter,
    isBlocked: false,
    attempts: record.count,
    cooldown: record.count >= 3 ? 600 : 30
  })
})

// ============================================================================
// 9. POST /api/auth/send-otp (Generate & Send OTP for Fan Registration with Rate Limit)
// ============================================================================
router.post('/send-otp', async (req, res) => {
  try {
    const { email, nama } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email wajib diisi' })
    }

    const cleanEmail = email.trim().toLowerCase()

    // 1. Cek Rate Limiting (Per IP: 3x @ 30s, lalu blokir 10 menit)
    const rateCheck = checkOtpRateLimit(req)
    if (!rateCheck.allowed) {
      return res.status(rateCheck.statusCode || 429).json({
        error: rateCheck.error,
        retryAfter: rateCheck.retryAfter,
        isBlocked: rateCheck.isBlocked,
        attempts: rateCheck.attempts,
        blockedUntil: rateCheck.blockedUntil
      })
    }

    // Catat percobaan pengiriman (mencatat attempt dan menghitung cooldown)
    const rateInfo = recordOtpSent(req)

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Log OTP to console for easy testing with temp mails
    console.log(`\n==========================================`)
    console.log(`🔑 REGISTER OTP REQUEST`)
    console.log(`📧 Email: ${cleanEmail}`)
    console.log(`🔑 KODE OTP: ${otp}`)
    console.log(`📊 Percobaan: ${rateInfo.attempts}/3 | Cooldown: ${rateInfo.cooldown}s | Blokir 10m: ${rateInfo.isBlocked}`)
    console.log(`💡 (Atau gunakan Magic OTP: 000000 untuk testing)`)
    console.log(`==========================================\n`)

    // Valid for 10 minutes
    otpStore.set(cleanEmail, { otp, expiresAt: Date.now() + 10 * 60 * 1000 })

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode Verifikasi - Kohi Sekai</title>
</head>
<body style="margin:0;padding:0;background-color:#1A1512;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#F5E6D3;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#1A1512;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#241E19;border:1px solid #3A2E24;border-radius:12px;overflow:hidden;">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color:#1A1512;padding:24px 28px;border-bottom:1px solid #3A2E24;text-align:center;">
              <span style="font-size:10px;letter-spacing:3px;color:#E8944A;font-weight:700;text-transform:uppercase;display:block;margin-bottom:4px;">Official Fan Space</span>
              <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:1.5px;color:#F5E6D3;">KOHI SEKAI</h1>
              <span style="font-size:11px;color:#B0A599;">Dunia Kopi · Yogyakarta</span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:28px 28px 24px;">
              <p style="font-size:15px;line-height:1.6;margin:0 0 14px 0;color:#F5E6D3;">
                Halo <strong>${nama || 'Fan'}</strong>,
              </p>
              <p style="font-size:13px;line-height:1.6;margin:0 0 22px 0;color:#B0A599;">
                Berikut adalah kode verifikasi (OTP) untuk menyelesaikan proses pendaftaran akun Kohi Sekai Anda:
              </p>

              <!-- OTP Code Display -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#1A1512;border:1px solid #3A2E24;border-radius:8px;margin-bottom:22px;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <span style="font-size:32px;font-weight:700;color:#E8944A;letter-spacing:8px;font-family:monospace;display:inline-block;">
                      ${otp}
                    </span>
                  </td>
                </tr>
              </table>

              <div style="background-color:#1A1512;border:1px solid #3A2E24;border-radius:8px;padding:14px 16px;">
                <p style="font-size:11px;line-height:1.5;color:#B0A599;margin:0;text-align:center;">
                  Kode verifikasi ini berlaku selama <strong>10 menit</strong>. Demi keamanan akun Anda, mohon untuk tidak membagikan kode ini kepada siapa pun.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1A1512;padding:18px 28px;border-top:1px solid #3A2E24;text-align:center;">
              <p style="font-size:11px;color:#736253;margin:0 0 4px 0;">
                Kohi Sekai (コーヒーの世界) · Indonesian Japanese-Style Idol Group
              </p>
              <p style="font-size:10px;color:#55483D;margin:0;">
                Email ini dikirimkan secara otomatis oleh sistem. Harap tidak membalas email ini.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    try {
      const result = await sendEmail(cleanEmail, 'Kode Verifikasi Registrasi - Kohi Sekai', html)
      if (result.success) {
        return res.json({
          success: true,
          message: 'OTP telah dikirim ke email Anda',
          cooldown: rateInfo.cooldown,
          attempts: rateInfo.attempts,
          maxAttempts: 3,
          isBlocked: rateInfo.isBlocked,
          blockedUntil: rateInfo.blockedUntil
        })
      } else {
        console.warn('[OTP] sendEmail failed, but OTP is saved in memory for dev:', result.error?.message || result.error)
        if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_USER) {
          return res.json({
            success: true,
            message: 'OTP telah dibuat (Mode Dev: gunakan kode 000000 atau periksa console server)',
            cooldown: rateInfo.cooldown,
            attempts: rateInfo.attempts,
            maxAttempts: 3,
            isBlocked: rateInfo.isBlocked,
            blockedUntil: rateInfo.blockedUntil
          })
        }
        throw result.error
      }
    } catch (mailErr) {
      if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_USER) {
        return res.json({
          success: true,
          message: 'OTP telah dibuat (Mode Dev: gunakan kode 000000 atau periksa console server)',
          cooldown: rateInfo.cooldown,
          attempts: rateInfo.attempts,
          maxAttempts: 3,
          isBlocked: rateInfo.isBlocked,
          blockedUntil: rateInfo.blockedUntil
        })
      }
      throw mailErr
    }
  } catch (error) {
    console.error('Error sending OTP:', error)
    res.status(500).json({ error: error.message || 'Gagal mengirim OTP' })
  }
})

// ============================================================================
// 9. POST /api/auth/verify-otp (Verify Fan Registration OTP)
// ============================================================================
router.post('/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email dan OTP wajib diisi' })
    }

    const cleanEmail = email.trim().toLowerCase()
    
    // MAGIC OTP UNTUK TESTING (Bisa login pakai email asal)
    if (otp.toString().trim() === '000000') {
      otpStore.delete(cleanEmail)
      return res.json({ success: true, message: 'Verifikasi OTP berhasil (Magic OTP)' })
    }

    const record = otpStore.get(cleanEmail)

    if (!record) {
      return res.status(400).json({ error: 'Kode OTP tidak ditemukan atau sudah kedaluwarsa. Silakan minta kode baru.' })
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail)
      return res.status(400).json({ error: 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.' })
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Kode OTP salah. Periksa kembali email Anda.' })
    }

    // OTP valid
    otpStore.delete(cleanEmail)
    return res.json({ success: true, message: 'Verifikasi OTP berhasil' })
  } catch (error) {
    console.error('Error verifying OTP:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat memverifikasi OTP' })
  }
})

// ============================================================================
// 10. PUT /api/auth/fan/profile (Update Fan Profile Image/Banner)
// ============================================================================
router.put('/fan/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    const targetEmail = (decoded.email || (decoded.role === 'admin' ? req.body.email : null) || '').trim().toLowerCase()
    if (!targetEmail) {
      return res.status(400).json({ error: 'Email tidak ditemukan untuk update profil' })
    }

    const { image_url, banner_url, nama, whatsapp, instagram } = req.body

    const updateData = {}
    if (image_url !== undefined) updateData.image_url = image_url
    if (banner_url !== undefined) updateData.banner_url = banner_url
    if (nama !== undefined) updateData.nama = nama
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp
    if (instagram !== undefined) updateData.instagram = instagram

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Tidak ada data untuk diupdate' })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .ilike('email', targetEmail)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Database update error:', error)
      throw error
    }

    res.json({
      success: true,
      message: 'Profil berhasil diupdate',
      user: data || { ...decoded, ...updateData }
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ error: error.message || 'Gagal mengupdate profil', details: error })
  }
})

export default router

