// Shared member data for consistent color usage across all pages
// Deep Coffee Metal palette for Kohi Sekai

export const memberData = {
    'dea': {
        color: '#E8944A',
        name: 'Dea'
    },
    'latte': {
        color: '#F0A868',
        name: 'Kohi Latte'
    },
    'macchiato': {
        color: '#E5A93C',
        name: 'Kohi Macchiato'
    },
    'affogato': {
        color: '#C9A97E',
        name: 'Kohi Affogato'
    },
    'group': {
        color: '#E8944A',
        name: 'Kohi Sekai'
    },
    'kohisekai': {
        color: '#E8944A',
        name: 'Kohi Sekai'
    },
    // Compatibility aliases mapped to coffee tones
    'sinta': {
        color: '#C68B59',
        name: 'Sinta'
    },
    'yanyee': {
        color: '#E8944A',
        name: 'YanYee'
    },
    'cissi': {
        color: '#E5A93C',
        name: 'Cissi'
    },
    'channie': {
        color: '#A855F7',
        name: 'Channie'
    },
    'acaa': {
        color: '#D7B48D',
        name: 'Acaa'
    },
    'cally': {
        color: '#78350F',
        name: 'Cally'
    },
    'piya': {
        color: '#B45309',
        name: 'Piya'
    },
    'rara': {
        color: '#9E1527',
        name: 'Rara'
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
