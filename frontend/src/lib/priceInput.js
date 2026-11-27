/**
 * Parse flexible Indonesian price input strings such as:
 * - "20k", "20K", "20rb" -> "20000"
 * - "2.5k", "2,5k" -> "2500"
 * - "1.5jt", "1,5jt" -> "1500000"
 * - "Rp 20.000", "20.000", "20000" -> "20000"
 */
export const parsePriceInput = (raw) => {
  if (raw === undefined || raw === null) return ''
  const cleaned = String(raw).trim().toLowerCase().replace(/^rp\.?\s*/i, '').replace(/\s+/g, '')
  if (!cleaned) return ''

  const suffixMatch = cleaned.match(/^([\d.,]+)(k|rb|jt)$/i)
  if (suffixMatch) {
    const numStr = suffixMatch[1].replace(',', '.')
    const numVal = parseFloat(numStr)
    if (!Number.isFinite(numVal)) return ''
    const multiplier = suffixMatch[2].toLowerCase() === 'jt' ? 1000000 : 1000
    const result = Math.round(numVal * multiplier)
    return result > 0 ? String(result) : '0'
  }

  // Strip thousand separators / non-digits
  const digits = cleaned.replace(/\D/g, '')
  return digits
}

/**
 * Format numeric price string with Indonesian dot thousand separators (e.g. "20000" -> "20.000").
 */
export const formatPriceDisplay = (val) => {
  if (val === undefined || val === null || val === '') return ''
  const digits = String(val).replace(/\D/g, '')
  return digits ? Number(digits).toLocaleString('id-ID') : ''
}
