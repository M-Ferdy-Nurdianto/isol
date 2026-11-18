import React from 'react'

const idFormatter = new Intl.NumberFormat('id-ID')

export const formatRupiah = (val) => {
  const num = Number(val) || 0
  return `Rp ${idFormatter.format(num)}`
}

/**
 * Standardized Price component for Kohi Sekai Merch & Ticket flows.
 * Adheres to:
 * - Format: "Rp 45.000" via Intl.NumberFormat('id-ID')
 * - Style: whitespace-nowrap, primary project font (NOT mono), tabular-nums, bold (700), orange (#E8944A)
 * - Sizes:
 *   - 'item' / 'md': 14px (default for item cards)
 *   - 'sm' / 'subtotal': 13px (compact subtotals)
 *   - 'total' / 'lg': 18px (bottom sticky total bar)
 *   - 'xs': 11px (mini captions)
 */
export default function Price({
  value = 0,
  size = 'item',
  className = '',
  as = 'span',
  ...props
}) {
  const Component = as

  const sizeClasses = {
    xs: 'text-[11px]',
    sm: 'text-[13px]',
    subtotal: 'text-[13px]',
    item: 'text-[14px]',
    md: 'text-[14px]',
    lg: 'text-[18px]',
    total: 'text-[18px]',
    xl: 'text-[20px]'
  }[size] || 'text-[14px]'

  return (
    <Component
      className={`text-[#E8944A] font-bold font-sans [font-variant-numeric:tabular-nums] whitespace-nowrap leading-tight ${sizeClasses} ${className}`}
      {...props}
    >
      {formatRupiah(value)}
    </Component>
  )
}
