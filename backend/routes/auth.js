import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import { sendEmail } from '../utils/email.js'

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'kohi_sekai_fan_secret_2026'

// In-memory OTP store for Registration
const otpStore = new Map()

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
        const token = jwt.sign(
          { id: 'guest-demo-user', username: 'GS123', role: 'admin' },
          JWT_SECRET,
          { expiresIn: '1d' }
        )
        return res.json({
          success: true,
          token,
          user: {
            id: 'guest-demo-user',
            username: 'GS123',
            full_name: 'Guest Tester (Demo)',
            role: 'admin'
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
          nama: fanUser.nama,
          email: fanUser.email,
          whatsapp: fanUser.whatsapp,
          instagram: fanUser.instagram,
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
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Format email tidak valid' })
    }

    const cleanWhatsapp = (whatsapp || '').replace(/[^0-9+]/g, '')
    if (!cleanWhatsapp || cleanWhatsapp.length < 8) {
      return res.status(400).json({ error: 'Nomor WhatsApp tidak valid (minimal 8 digit)' })
    }

    const cleanEmail = email.trim().toLowerCase()
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
          whatsapp: cleanWhatsapp,
          instagram: cleanInstagram,
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
          whatsapp: cleanWhatsapp,
          instagram: cleanInstagram,
          role: 'fan'
        })
        .select()
        .single()

      if (insertErr) throw insertErr
      savedUser = inserted
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
      message: 'Registrasi berhasil',
      user: {
        id: savedUser.id,
        fan_id: savedUser.fan_id,
        nama: savedUser.nama,
        email: savedUser.email,
        whatsapp: savedUser.whatsapp,
        instagram: savedUser.instagram,
        role: savedUser.role || 'fan'
      }
    })
  } catch (error) {
    console.error('Error during register:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// 3. FAN QUICK LOGIN / REGISTER (Compatible with existing FanAuthModal)
// ============================================================================
router.post('/fan/login', async (req, res) => {
  try {
    const { nama, email, whatsapp, instagram } = req.body

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
        nama: fanRecord.nama,
        email: fanRecord.email,
        whatsapp: fanRecord.whatsapp,
        instagram: fanRecord.instagram,
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

    const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA'

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
      return res.json({ success: true, message: 'Email berhasil dikirim, silakan cek Inbucket (http://127.0.0.1:54324)', messageId: result.messageId })
    } else {
      throw result.error
    }
  } catch (error) {
    console.error('Error in test-email:', error)
    res.status(500).json({ error: error.message || 'Gagal mengirim email' })
  }
})

// ============================================================================
// 8. POST /api/auth/send-otp (Generate & Send OTP for Fan Registration)
// ============================================================================
router.post('/send-otp', async (req, res) => {
  try {
    const { email, nama } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email wajib diisi' })
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const cleanEmail = email.trim().toLowerCase()
    
    // Log OTP to console for easy testing with temp mails
    console.log(`\n==========================================`)
    console.log(`🔑 REGISTER OTP REQUEST`)
    console.log(`📧 Email: ${cleanEmail}`)
    console.log(`🔑 KODE OTP: ${otp}`)
    console.log(`💡 (Atau gunakan Magic OTP: 000000 untuk testing)`)
    console.log(`==========================================\n`)

    // Valid for 10 minutes
    otpStore.set(cleanEmail, { otp, expiresAt: Date.now() + 10 * 60 * 1000 })

    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #E8D9C5; border-radius: 12px; background: #FFF9F2;">
        <h2 style="color: #2B2420; margin-top: 0;">Halo ${nama || 'Fan'}!</h2>
        <p style="color: #6B5D4F;">Ini adalah kode OTP untuk menyelesaikan pendaftaran akun Kohi Sekai Anda:</p>
        <div style="background: #F0A868; color: #FFF; font-size: 32px; font-weight: 900; letter-spacing: 6px; text-align: center; padding: 20px; border-radius: 8px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #6B5D4F; font-size: 13px;">Kode ini hanya berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.</p>
      </div>
    `

    const result = await sendEmail(cleanEmail, 'Kode Verifikasi Registrasi - Kohi Sekai', html)
    if (result.success) {
      return res.json({ success: true, message: 'OTP telah dikirim ke email Anda' })
    } else {
      throw result.error
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

    if (decoded.role === 'admin') {
      return res.status(403).json({ error: 'Endpoint ini khusus untuk fan' })
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
      .eq('email', decoded.email)
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

