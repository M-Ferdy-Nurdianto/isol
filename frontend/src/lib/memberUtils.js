// Shared member data for consistent color usage across all pages

export const memberData = {
    'yanyee': {
        color: '#F97316',
        name: 'YanYee',
        gradient: 'from-orange-400 to-amber-500',
    },
    'sinta': {
        color: '#10B981',
        name: 'Sinta',
        gradient: 'from-green-400 to-emerald-500',
    },
    'cissi': {
        color: '#FBBF24',
        name: 'Cissi',
        gradient: 'from-amber-400 to-yellow-500',
    },
    'channie': {
        color: '#6D28D9',
        name: 'Channie',
        gradient: 'from-purple-600 to-indigo-600',
    },
    'acaa': {
        color: '#3B82F6',
        name: 'Acaa',
        gradient: 'from-blue-500 to-blue-600',
    },
    'cally': {
        color: '#2DD4BF',
        name: 'Cally',
        gradient: 'from-teal-400 to-cyan-500',
    },
    'piya': {
        color: '#F472B6',
        name: 'Piya',
        gradient: 'from-pink-400 to-rose-500',
    },
    'rara': {
        color: '#9e1527',
        name: 'Rara',
        gradient: 'from-red-600 to-rose-800',
    },
    'group': {
        color: '#079108',
        name: 'Group',
        gradient: 'from-green-500 to-emerald-600',
    }
}

// Sanitize name for lookup
export const sanitizeName = (name) => {
    if (!name) return ''
    return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Get member color by member object or name
export const getMemberColor = (memberOrName) => {
    if (typeof memberOrName === 'object' && memberOrName !== null) {
        if (memberOrName.color) return memberOrName.color
        return getMemberColor(memberOrName.nama_panggung)
    }
    const clean = sanitizeName(memberOrName)
    if (clean === 'aca') return memberData['acaa']?.color || '#079108'
    return memberData[clean]?.color || '#079108'
}

// Get member data by name
export const getMemberData = (name) => {
    const clean = sanitizeName(name)
    if (clean === 'aca') return memberData['acaa']
    return memberData[clean] || memberData['group']
}

// Get clean member display name
export const getMemberDisplayName = (name) => {
    const clean = sanitizeName(name)
    if (clean === 'aca') return memberData['acaa']?.name || 'Unknown'
    return memberData[clean]?.name || name
}

// Format member name (tanpa emoji)
export const formatMemberName = (name) => {
    return getMemberDisplayName(name)
}
