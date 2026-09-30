/**
 * Utility functions for processing and grouping fan leaderboard titles
 */

export const PERIOD_PRIORITY = {
  'tahunan': 1,
  'all time': 2,
  'all-time': 2,
  'bulanan': 3,
  'mingguan': 4
}

/**
 * Groups an array of fan title objects by period.
 * 
 * Each raw title object has:
 * { rank, memberName, period, chekiCount, title, badge }
 * 
 * Returns an array of period-grouped objects sorted by priority:
 * Bulanan before Mingguan, etc.
 * 
 * Example return item:
 * {
 *   periodKey: 'bulanan',
 *   periodName: 'Bulanan',
 *   minRank: 1,
 *   badge: 'gold',
 *   memberNames: ['Vinci', 'Dea Awalia', 'Fatin'],
 *   displayLabel: 'Top 1 Bulanan · Vinci, Dea Awalia, Fatin',
 *   members: [ ... ]
 * }
 */
export function groupTitlesByPeriod(titles) {
  if (!titles || !Array.isArray(titles) || titles.length === 0) return []

  const groupsMap = new Map()

  titles.forEach(t => {
    const rawPeriod = (t.period || 'Lainnya').trim()
    const periodKey = rawPeriod.toLowerCase()

    if (!groupsMap.has(periodKey)) {
      groupsMap.set(periodKey, {
        periodKey,
        periodName: rawPeriod.charAt(0).toUpperCase() + rawPeriod.slice(1),
        minRank: t.rank || 1,
        badge: t.badge || (t.rank === 1 ? 'gold' : t.rank === 2 ? 'silver' : 'bronze'),
        members: []
      })
    }

    const group = groupsMap.get(periodKey)
    if (t.rank && t.rank < group.minRank) {
      group.minRank = t.rank
      group.badge = t.badge || (t.rank === 1 ? 'gold' : t.rank === 2 ? 'silver' : 'bronze')
    }

    group.members.push({
      memberName: t.memberName || 'Member',
      rank: t.rank || 1,
      chekiCount: t.chekiCount || 0,
      badge: t.badge || (t.rank === 1 ? 'gold' : t.rank === 2 ? 'silver' : 'bronze'),
      title: t.title
    })
  })

  // Convert to array and format labels
  const result = Array.from(groupsMap.values()).map(group => {
    // Sort members within group: highest rank first (1, 2, 3), then by cheki count descending
    group.members.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank
      return (b.chekiCount || 0) - (a.chekiCount || 0)
    })

    const uniqueMemberNames = [...new Set(group.members.map(m => m.memberName))]
    group.memberNames = uniqueMemberNames
    group.displayLabel = `Top ${group.minRank} ${group.periodName} · ${uniqueMemberNames.join(', ')}`
    return group
  })

  // Sort groups by priority: Bulanan before Mingguan
  result.sort((a, b) => {
    const orderA = PERIOD_PRIORITY[a.periodKey] || 99
    const orderB = PERIOD_PRIORITY[b.periodKey] || 99
    return orderA - orderB
  })

  return result
}
