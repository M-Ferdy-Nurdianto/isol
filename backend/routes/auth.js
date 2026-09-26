import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// POST: Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    // Direct guest sandbox credentials
    if (username.trim() === 'GS123' && password === 'GS321') {
      return res.json({
        success: true,
        token: 'demo_guest_token_ks_2026',
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
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password_hash)

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT (1 day validity)
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name
      }
    })
  } catch (error) {
    console.error('Error during login:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create admin user (protected - only for initial setup)
router.post('/register', async (req, res) => {
  try {
    const { username, password, full_name, secret } = req.body

    // Simple protection - change this secret in production
    if (secret !== 'KOHI_SEKAI_SETUP_2026') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username,
        password_hash,
        full_name
      })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, message: 'Admin user created', user: { username, full_name } })
  } catch (error) {
    console.error('Error creating admin:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
