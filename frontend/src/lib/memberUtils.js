// Shared member data for consistent color usage across all pages

export const memberData = {
    'yanyee': {
        color: '#F97316',
        name: 'YanYee'
    },
    'sinta': {
        color: '#10B981',
        name: 'Sinta'
    },
    'cissi': {
        color: '#FBBF24',
        name: 'Cissi'
    },
    'channie': {
        color: '#6D28D9',
        name: 'Channie'
    },
    'acaa': {
        color: '#3B82F6',
        name: 'Acaa'
    },
    'cally': {
        color: '#2DD4BF',
        name: 'Cally'
    },
    'piya': {
        color: '#F472B6',
        name: 'Piya'
    },
    'rara': {
        color: '#9e1527',
        name: 'Rara'
    },
    'group': {
        color: '#E8944A',
        name: 'Group'
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
    if (clean === 'aca') return memberData['acaa']?.color || '#E8944A'
    return memberData[clean]?.color || '#E8944A'
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
