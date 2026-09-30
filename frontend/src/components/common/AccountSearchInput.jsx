import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { FaSearch, FaUser, FaTimes, FaSpinner, FaExchangeAlt, FaIdBadge, FaCheck } from 'react-icons/fa'
import { useAccountSearch } from '../../hooks/useAccountSearch'

/**
 * Memoized text highlighter for search matches
 */
const HighlightMatch = React.memo(({ text, query }) => {
  if (!query || !text) return <span>{text}</span>
  const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!cleanQ) return <span>{text}</span>

  const regex = new RegExp(`(${cleanQ})`, 'gi')
  const parts = String(text).split(regex)

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === cleanQ.toLowerCase() ? (
          <span key={i} className="text-[#079108] font-black bg-[#079108]/20 px-0.5 rounded">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  )
})

HighlightMatch.displayName = 'HighlightMatch'

/**
 * Memoized individual search result item for performance
 */
const AccountSearchItem = React.memo(({ account, query, isActive, onSelect }) => {
  const fanCode = account.fan_code || String(account.fan_id || '').padStart(4, '0')

  return (
    <div
      role="option"
      aria-selected={isActive}
      onClick={() => onSelect(account)}
      className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer border-b border-white/5 transition-colors select-none ${
        isActive
          ? 'bg-[#079108]/20 border-l-4 border-l-[#079108]'
          : 'hover:bg-white/5 border-l-4 border-l-transparent'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {/* Avatar or fallback */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-white/10 shrink-0 flex items-center justify-center text-zinc-400">
          {account.image_url ? (
            <img
              src={account.image_url}
              alt={account.nama}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <FaUser className="text-xs" />
          )}
        </div>

        {/* Name & contact */}
        <div className="min-w-0 truncate">
          <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
            <HighlightMatch text={account.nama} query={query} />
          </div>
          <div className="text-[11px] text-zinc-400 truncate flex items-center gap-2 mt-0.5">
            {account.email && (
              <span className="truncate">
                <HighlightMatch text={account.email} query={query} />
              </span>
            )}
            {account.whatsapp && account.whatsapp !== '-' && (
              <span className="text-zinc-500 hidden sm:inline">· {account.whatsapp}</span>
            )}
          </div>
        </div>
      </div>

      {/* Fan Code Badge */}
      <div className="shrink-0 flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded bg-[#182032] border border-[#079108]/40 text-[#079108] text-[10px] font-mono font-bold">
          ID #{fanCode}
        </span>
        {isActive && <FaCheck className="text-[#079108] text-xs ml-1" />}
      </div>
    </div>
  )
})

AccountSearchItem.displayName = 'AccountSearchItem'

/**
 * Reusable AccountSearchInput Component
 * Supports keyboard navigation (Up/Down/Enter/Esc), debounced fast RPC search,
 * selected account card, and optional manual name fallback.
 */
const AccountSearchInput = ({
  selectedAccount = null,
  onSelectAccount,
  onClearAccount,
  manualName = '',
  onManualNameChange,
  autoFocus = true,
  placeholder = 'Cari ID fan (misal: 0002) atau Nama...'
}) => {
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    hasSearched,
    clearSearch
  } = useAccountSearch()

  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const listRef = useRef(null)

  // Auto-focus on mount if enabled
  useEffect(() => {
    if (autoFocus && !selectedAccount) {
      inputRef.current?.focus()
    }
  }, [autoFocus, selectedAccount])

  // Reset activeIndex to 0 whenever results change
  useEffect(() => {
    if (results.length > 0) {
      setActiveIndex(0)
      setIsOpen(true)
    } else if (hasSearched && !loading) {
      setActiveIndex(-1)
      setIsOpen(true)
    }
  }, [results, hasSearched, loading])

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' && results.length > 0) {
          setIsOpen(true)
          e.preventDefault()
        }
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (results.length > 0) {
          setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (results.length > 0) {
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
        }
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && activeIndex < results.length) {
          e.preventDefault()
          handleSelect(results[activeIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
      }
    },
    [isOpen, results, activeIndex]
  )

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && activeIndex >= 0) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      if (items[activeIndex]) {
        items[activeIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [activeIndex])

  const handleSelect = (account) => {
    onSelectAccount?.(account)
    clearSearch()
    setIsOpen(false)
  }

  const handleClear = () => {
    onClearAccount?.()
    clearSearch()
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    if (onManualNameChange) {
      onManualNameChange(val)
    }
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  // If account is already selected, render the Selected Account Card
  if (selectedAccount) {
    const fanCode = selectedAccount.fan_code || String(selectedAccount.fan_id || '').padStart(4, '0')

    return (
      <div className="bg-[#182032] border border-[#079108]/50 rounded-xl p-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-[#079108]/40 shrink-0 flex items-center justify-center text-zinc-300">
            {selectedAccount.image_url ? (
              <img
                src={selectedAccount.image_url}
                alt={selectedAccount.nama}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <FaUser className="text-sm" />
            )}
          </div>

          {/* Account Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white truncate">
                {selectedAccount.nama}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#079108]/20 border border-[#079108] text-[#079108] text-[10px] font-mono font-black">
                ID #{fanCode}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate mt-0.5 flex items-center gap-2">
              {selectedAccount.email && <span>{selectedAccount.email}</span>}
              {selectedAccount.whatsapp && selectedAccount.whatsapp !== '-' && (
                <span className="text-zinc-500 hidden sm:inline">· {selectedAccount.whatsapp}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
            title="Ganti akun pencarian"
          >
            <FaExchangeAlt className="text-[10px]" />
            <span className="hidden sm:inline">Ganti</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 flex items-center justify-center text-xs transition"
            title="Lepas akun fan ini"
          >
            <FaTimes />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-zinc-400 pointer-events-none">
          <FaSearch className="text-xs" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query || manualName}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-16 py-2.5 bg-[#182032] border border-white/10 text-white text-xs rounded-xl placeholder-zinc-500 focus:border-[#079108] focus:outline-none transition"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Right Action Icons: Spinner / Clear */}
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {loading && (
            <FaSpinner className="text-[#079108] text-xs animate-spin" />
          )}

          {(query || manualName) && !loading && (
            <button
              type="button"
              onClick={() => {
                clearSearch()
                if (onManualNameChange) onManualNameChange('')
                inputRef.current?.focus()
              }}
              className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition text-[10px]"
              title="Bersihkan input"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Results Menu */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#182032] border border-white/15 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
        >
          {/* Error Message */}
          {error && (
            <div className="p-3 text-center text-xs text-red-400 bg-red-500/10 border-b border-red-500/20">
              {error}
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <div role="listbox" className="divide-y divide-white/5">
              <div className="px-3.5 py-1.5 bg-[#111726] text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex justify-between items-center">
                <span>Hasil Pencarian Akun</span>
                <span className="text-[9px] text-zinc-500 lowercase">Gunakan panah & Enter</span>
              </div>
              {results.map((acc, idx) => (
                <AccountSearchItem
                  key={acc.id || idx}
                  account={acc}
                  query={query}
                  isActive={idx === activeIndex}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          {/* Empty Results State */}
          {!loading && hasSearched && results.length === 0 && !error && (
            <div className="p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-white/5 text-zinc-400 flex items-center justify-center mx-auto mb-2 text-xs">
                <FaUser />
              </div>
              <p className="text-xs font-semibold text-zinc-300">Akun tidak ditemukan</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Tidak ada akun dengan ID atau nama "{query}"
              </p>
              {manualName && (
                <div className="mt-2.5 pt-2 border-t border-white/10">
                  <p className="text-[10px] text-zinc-400 mb-1.5">
                    Tetap lanjut menggunakan nama manual:
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1 rounded bg-[#079108]/20 border border-[#079108]/50 text-[#079108] text-xs font-bold hover:bg-[#079108]/30 transition"
                  >
                    Gunakan "{manualName}" (Non-Akun)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Helper hint when query is 1 char */}
          {query.trim().length === 1 && (
            <div className="p-2.5 text-center text-[11px] text-zinc-400">
              Ketik minimal 2 karakter untuk mencari akun fan
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default React.memo(AccountSearchInput)
