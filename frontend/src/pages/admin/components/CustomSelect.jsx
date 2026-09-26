import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { FaChevronDown } from 'react-icons/fa'

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select...', 
  className = '',
  variant = 'filter' // 'filter' or 'status'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const containerRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target) &&
        !e.target.closest('.custom-dropdown-portal-menu')
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close the dropdown on window/container scroll to prevent floating effect, but ignore scrolls inside dropdown menu
  useEffect(() => {
    if (!isOpen) return
    const handleScroll = (e) => {
      if (e.target && (e.target.closest?.('.custom-dropdown-portal-menu') || e.target.classList?.contains('custom-dropdown-portal-menu'))) {
        return
      }
      setIsOpen(false)
    }
    window.addEventListener('scroll', handleScroll, { capture: true })
    
    // Also listen to horizontal scroll on the table container if present
    const tableContainers = document.querySelectorAll('.overflow-x-auto')
    tableContainers.forEach(container => {
      container.addEventListener('scroll', handleScroll)
    })

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true })
      tableContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll)
      })
    }
  }, [isOpen])

  // Calculate coordinates synchronously before painting to prevent flickering
  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const menuHeight = 160 // Estimated max height
      const shouldOpenUp = spaceBelow < menuHeight
      setOpenUp(shouldOpenUp)

      setCoords({
        top: shouldOpenUp 
          ? rect.top + window.scrollY 
          : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isOpen])

  const handleOpen = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const menuHeight = 160 // Estimated max height
      const shouldOpenUp = spaceBelow < menuHeight
      setOpenUp(shouldOpenUp)

      setCoords({
        top: shouldOpenUp 
          ? rect.top + window.scrollY 
          : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
    setIsOpen(!isOpen)
  }

  const handleSelect = (val) => {
    onChange({ target: { value: val } })
    setIsOpen(false)
  }

  const selectedOption = options.find(opt => opt.value === value)

  // Helper for status styling in dark mode
  const getStatusStyle = (statusVal) => {
    switch (statusVal) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
      case 'checked':
        return 'bg-[#00e5e5]/10 text-[#00e5e5] border-[#00e5e5]/30 hover:bg-[#00e5e5]/20'
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
      default:
        return 'bg-white/10 text-zinc-300 border-white/10 hover:bg-white/15'
    }
  }

  return (
    <div className="relative inline-block w-full custom-dropdown-container" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border outline-none ${
          variant === 'filter' 
            ? 'bg-[#182032] text-white border-white/10 hover:bg-white/10 hover:border-white/20 min-w-[140px]' 
            : `cursor-pointer ${getStatusStyle(value)} ${className}`
        }`}
      >
        <span className={`truncate ${!value ? 'text-zinc-400' : ''}`}>
          {selectedOption?.label || (value ? value : placeholder)}
        </span>
        <FaChevronDown className={`text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div 
          className={`absolute bg-[#161f33] rounded-xl shadow-2xl border border-white/15 py-1.5 z-[9999] custom-dropdown-portal-menu animate-in fade-in slide-in-from-${openUp ? 'bottom' : 'top'}-2 duration-200 backdrop-blur-xl`}
          style={{
            position: 'absolute',
            top: `${openUp ? coords.top - 4 : coords.top + 4}px`,
            left: `${coords.left}px`,
            width: `${Math.max(coords.width, 160)}px`,
            transform: openUp ? 'translateY(-100%)' : 'none',
          }}
        >
          <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                  opt.value === value 
                    ? 'bg-[#079108]/20 text-[#079108] font-bold border-l-2 border-[#079108]' 
                    : 'text-zinc-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default CustomSelect
