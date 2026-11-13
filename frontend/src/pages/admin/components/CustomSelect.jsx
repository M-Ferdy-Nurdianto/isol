import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { FaChevronDown } from 'react-icons/fa'

const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  variant = 'filter' // 'filter' or 'status'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const containerRef = useRef(null)
  const menuRef = useRef(null)
  const [fixedCoords, setFixedCoords] = useState({ top: 0, left: 0, width: 0 })

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        (!menuRef.current || !menuRef.current.contains(e.target))
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // For table cell portal ('status'): calculate viewport-relative fixed coordinates
  useLayoutEffect(() => {
    if (isOpen && variant === 'status' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const menuHeight = 180
      const shouldOpenUp = spaceBelow < menuHeight
      setOpenUp(shouldOpenUp)

      setFixedCoords({
        top: shouldOpenUp ? rect.top - 4 : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 160)
      })
    }
  }, [isOpen, variant])

  const handleToggle = () => {
    if (!isOpen && variant === 'status' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const menuHeight = 180
      const shouldOpenUp = spaceBelow < menuHeight
      setOpenUp(shouldOpenUp)
      setFixedCoords({
        top: shouldOpenUp ? rect.top - 4 : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 160)
      })
    }
    setIsOpen(prev => !prev)
  }

  const handleSelect = (val) => {
    if (onChange) {
      onChange({ target: { value: val } })
    }
    setIsOpen(false)
  }

  const selectedOption = options.find(opt => String(opt.value) === String(value))

  // Status badge styling
  const getStatusStyle = (statusVal) => {
    switch (statusVal) {
      case 'pending':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
      case 'checked':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
      default:
        return 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--primary)]/15'
    }
  }

  return (
    <div className={`relative inline-block w-full custom-dropdown-container ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border outline-none ${variant === 'filter'
            ? 'bg-[var(--background)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/40 min-w-[140px]'
            : `cursor-pointer ${getStatusStyle(value)}`
          }`}
      >
        <span className={`truncate ${!value && value !== 0 ? 'text-[var(--text-secondary)] font-normal' : ''}`}>
          {selectedOption?.label || (value ? value : placeholder)}
        </span>
        <FaChevronDown className={`text-[10px] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* RENDER IN-PLACE FOR FORMS & FILTERS (Rock solid, 100% reliable positioning) */}
      {isOpen && variant !== 'status' && (
        <div
          ref={menuRef}
          className="absolute left-0 right-0 top-full mt-1.5 bg-[var(--background)] rounded-xl shadow-2xl border border-[var(--border)] py-1.5 z-[100] max-h-60 overflow-y-auto custom-scrollbar"
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${isSelected
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-bold border-l-2 border-[var(--primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'
                  }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      {/* RENDER PORTAL FIXED FOR TABLE CELLS TO ESCAPE OVERFLOW */}
      {isOpen && variant === 'status' && createPortal(
        <div
          ref={menuRef}
          className="fixed bg-[var(--background)] rounded-xl shadow-2xl border border-[var(--border)] py-1.5 z-[9999] custom-scrollbar max-h-60 overflow-y-auto"
          style={{
            top: `${fixedCoords.top}px`,
            left: `${fixedCoords.left}px`,
            width: `${fixedCoords.width}px`,
            transform: openUp ? 'translateY(-100%)' : 'none',
          }}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${isSelected
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-bold border-l-2 border-[var(--primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'
                  }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}

export default CustomSelect
