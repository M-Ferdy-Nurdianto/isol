import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    const { period, member_id } = req.query

    // Resolve member UUID if member_id is a slug/string or UUID
    let targetMemberUuid = null
    let targetMemberName = null

    if (member_id && member_id !== 'all') {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (UUID_REGEX.test(member_id)) {
        targetMemberUuid = member_id
      } else {
        const { data: memberObj } = await supabase
          .from('members')
          .select('id, nama_panggung')
          .eq('member_id', member_id)
          .maybeSingle()
        if (memberObj) {
          targetMemberUuid = memberObj.id
          targetMemberName = memberObj.nama_panggung
        }
      }
    }

    let query = supabase.from('orders').select(`
      id,
      nama_lengkap,
      created_at,
      order_items!inner (
        quantity,
        price,
        member_id,
        item_name,
        members (
          id,
          member_id,
          nama_panggung,
          image_url
        )
      )
    `).in('status', ['approved', 'checked', 'completed', 'paid'])

    // Filter by member directly if specific member requested
    if (targetMemberUuid) {
      query = query.eq('order_items.member_id', targetMemberUuid)
    }

    // Filter by period
    if (period && period !== 'all') {
      const now = new Date()
      if (period === 'minggu') {
        now.setDate(now.getDate() - 7)
      } else if (period === 'bulan') {
        now.setMonth(now.getMonth() - 1)
      } else if (period === 'tahun') {
        now.setFullYear(now.getFullYear() - 1)
      }
      query = query.gte('created_at', now.toISOString())
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }

    if (!member_id || member_id === 'all') {
      // === ALL MEMBERS MODE ===
      // Hitung total cheki per fan dari semua member (kecuali grup),
      // lalu ambil top 10 fan unik berdasarkan total cheki terbanyak.
      // Juga catat member mana yang paling banyak mereka beli (favorit).
      const fanStats = {} // { fanKey: { name, chekiCount, points, memberCounts } }

      orders?.forEach(order => {
        const fanName = (order.nama_lengkap || 'Fan').trim()
        const fanKey = fanName.toUpperCase()

        order.order_items?.forEach(item => {
          if (!item.member_id || (item.item_name && item.item_name.toLowerCase().includes('group'))) {
            return
          }

          const mId = item.member_id
          const mName = item.members?.nama_panggung || item.item_name || 'Member'
          const qty = item.quantity || 1
          const itemPrice = item.price || 0
          const pts = Math.max(1, Math.floor((itemPrice * qty) / 10000))

          if (!fanStats[fanKey]) {
            fanStats[fanKey] = { name: fanName, chekiCount: 0, points: 0, memberCounts: {} }
          }

          fanStats[fanKey].chekiCount += qty
          fanStats[fanKey].points += pts

          // Track per-member count to determine favorite member
          if (!fanStats[fanKey].memberCounts[mId]) {
            fanStats[fanKey].memberCounts[mId] = { name: mName, count: 0 }
          }
          fanStats[fanKey].memberCounts[mId].count += qty
        })
      })

      // Build leaderboard: top 10 unique fans, with their favorite member
      const leaderboard = Object.values(fanStats)
        .sort((a, b) => b.chekiCount - a.chekiCount)
        .slice(0, 10)
        .map(fan => {
          // Find favorite member (most cheki bought)
          const favMember = Object.values(fan.memberCounts)
            .sort((a, b) => b.count - a.count)[0]
          return {
            name: fan.name,
            chekiCount: fan.chekiCount,
            points: fan.points,
            memberName: favMember?.name || null
          }
        })

      res.json({ success: true, data: leaderboard })
    } else {
      // === SPECIFIC MEMBER MODE ===
      const fanStats = {}

      orders?.forEach(order => {
        const fanName = (order.nama_lengkap || 'Fan').trim()
        const fanKey = fanName.toUpperCase()

        order.order_items?.forEach(item => {
          if (!item.member_id || (item.item_name && item.item_name.toLowerCase().includes('group'))) {
            return
          }
          if (targetMemberUuid && item.member_id !== targetMemberUuid) {
            return
          }

          const qty = item.quantity || 1
          const itemPrice = item.price || 0
          const pts = Math.max(1, Math.floor((itemPrice * qty) / 10000))

          if (!fanStats[fanKey]) {
            fanStats[fanKey] = {
              name: fanName,
              chekiCount: 0,
              points: 0,
              memberName: item.members?.nama_panggung || targetMemberName || 'Member'
            }
          }

          fanStats[fanKey].chekiCount += qty
          fanStats[fanKey].points += pts
        })
      })

      const leaderboard = Object.values(fanStats)
        .sort((a, b) => b.chekiCount - a.chekiCount)
        .slice(0, 10)

      res.json({ success: true, data: leaderboard })
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({ error: error.message })
  }
})


// GET /api/leaderboard/fan-titles?name=...&email=...
router.get('/fan-titles', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    const { name, email } = req.query

    if (!name && !email) {
      return res.json({ success: true, data: [] })
    }

    const targetName = (name || '').trim().toLowerCase()
    const targetEmail = (email || '').trim().toLowerCase()

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        nama_lengkap,
        email,
        created_at,
        order_items!inner (
          quantity,
          price,
          member_id,
          item_name,
          members (
            id,
            member_id,
            nama_panggung,
            image_url
          )
        )
      `)
      .in('status', ['approved', 'checked', 'completed', 'paid'])

    if (error) throw error

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const periods = [
      { key: 'bulanan', label: 'Bulanan', filter: (d) => new Date(d) >= monthAgo },
      { key: 'mingguan', label: 'Mingguan', filter: (d) => new Date(d) >= weekAgo }
    ]

    const userTitles = []

    periods.forEach(p => {
      const memberFans = {}

      orders
        ?.filter(o => p.filter(o.created_at))
        .forEach(order => {
          const fanName = (order.nama_lengkap || '').trim()
          const fanEmail = (order.email || '').trim()
          const fanKey = (fanEmail || fanName).toUpperCase()

          order.order_items?.forEach(item => {
            if (!item.member_id || (item.item_name && item.item_name.toLowerCase().includes('group'))) {
              return
            }

            const mId = item.member_id
            const mName = item.members?.nama_panggung || item.item_name || 'Member'
            const qty = item.quantity || 1

            if (!memberFans[mId]) {
              memberFans[mId] = { memberName: mName, fans: {} }
            }

            if (!memberFans[mId].fans[fanKey]) {
              memberFans[mId].fans[fanKey] = { name: fanName, email: fanEmail, chekiCount: 0 }
            }
            memberFans[mId].fans[fanKey].chekiCount += qty
          })
        })

      Object.values(memberFans).forEach(mStat => {
        const sortedFans = Object.values(mStat.fans).sort((a, b) => b.chekiCount - a.chekiCount)
        const userIndex = sortedFans.findIndex(f => {
          const nameMatch = targetName && f.name.toLowerCase() === targetName
          const emailMatch = targetEmail && f.email.toLowerCase() === targetEmail
          return nameMatch || emailMatch
        })

        if (userIndex !== -1 && userIndex < 3) {
          const rank = userIndex + 1
          userTitles.push({
            rank,
            memberName: mStat.memberName,
            period: p.label,
            chekiCount: sortedFans[userIndex].chekiCount,
            title: `Top ${rank} ${mStat.memberName} ${p.label}`,
            badge: rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'
          })
        }
      })
    })

    // If user has no weekly or monthly ranks, check all-time ranks as fallback
    if (userTitles.length === 0) {
      const allTimeMemberFans = {}
      orders?.forEach(order => {
        const fanName = (order.nama_lengkap || '').trim()
        const fanEmail = (order.email || '').trim()
        const fanKey = (fanEmail || fanName).toUpperCase()

        order.order_items?.forEach(item => {
          if (!item.member_id || (item.item_name && item.item_name.toLowerCase().includes('group'))) return
          const mId = item.member_id
          const mName = item.members?.nama_panggung || item.item_name || 'Member'
          const qty = item.quantity || 1

          if (!allTimeMemberFans[mId]) allTimeMemberFans[mId] = { memberName: mName, fans: {} }
          if (!allTimeMemberFans[mId].fans[fanKey]) allTimeMemberFans[mId].fans[fanKey] = { name: fanName, email: fanEmail, chekiCount: 0 }
          allTimeMemberFans[mId].fans[fanKey].chekiCount += qty
        })
      })

      Object.values(allTimeMemberFans).forEach(mStat => {
        const sortedFans = Object.values(mStat.fans).sort((a, b) => b.chekiCount - a.chekiCount)
        const userIndex = sortedFans.findIndex(f => {
          const nameMatch = targetName && f.name.toLowerCase() === targetName
          const emailMatch = targetEmail && f.email.toLowerCase() === targetEmail
          return nameMatch || emailMatch
        })

        if (userIndex !== -1 && userIndex < 3) {
          const rank = userIndex + 1
          userTitles.push({
            rank,
            memberName: mStat.memberName,
            period: 'All Time',
            chekiCount: sortedFans[userIndex].chekiCount,
            title: `Top ${rank} ${mStat.memberName} All Time`,
            badge: rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'
          })
        }
      })
    }

    res.json({ success: true, data: userTitles })
  } catch (err) {
    console.error('Error fetching fan titles:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
