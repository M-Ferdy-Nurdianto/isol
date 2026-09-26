import { supabase } from '../config/supabase.js'
import bcrypt from 'bcrypt'

const resetAdmin = async () => {
    console.log('[Admin Reset] Starting admin user reset...')

    const username = 'admin'
    const password = 'staff123'
    const fullName = 'Staff Kohi Sekai'

    try {
        // 1. Generate hash
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)
        console.log('[Admin Reset] Password hash generated.')

        // 2. Upsert user
        const { data, error } = await supabase
            .from('admin_users')
            .upsert({
                username,
                password_hash: passwordHash,
                full_name: fullName
            }, { onConflict: 'username' })
            .select()
            .single()

        if (error) {
            throw error
        }

        console.log('[Admin Reset] Admin user reset successfully!')
        console.log('Create/Update details:', {
            id: data.id,
            username: data.username,
            full_name: data.full_name
        })

    } catch (err) {
        console.error('[Admin Reset] Error resetting admin user:', err.message)
        process.exit(1)
    }
}

resetAdmin()
