import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../lib/api'

// In-memory cache for search queries with 60-second TTL
const searchCache = new Map()
const CACHE_TTL_MS = 60 * 1000

/**
 * Sanitize search input before sending to backend / filtering
 */
export const sanitizeQuery = (str) => {
  if (typeof str !== 'string') return ''
  return str.replace(/[\\%_,()\/]/g, '').trim()
}

/**
 * Custom hook for ultra-fast, debounced, cached fan account search
 */
export const useAccountSearch = (initialAccount = null) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(initialAccount)

  const abortControllerRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // Clear or reset search state
  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setLoading(false)
    setError(null)
    setHasSearched(false)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  // Select an account and clear the search dropdown
  const selectAccount = useCallback((account) => {
    setSelectedAccount(account)
    setQuery('')
    setResults([])
    setHasSearched(false)
    setLoading(false)
    setError(null)
  }, [])

  // Remove the currently selected account
  const clearSelectedAccount = useCallback(() => {
    setSelectedAccount(null)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    const sanitized = sanitizeQuery(trimmed)

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Edge case: empty or less than 2 characters
    if (sanitized.length < 2) {
      setResults([])
      setLoading(false)
      setError(null)
      setHasSearched(false)
      return
    }

    const cacheKey = sanitized.toLowerCase()
    const now = Date.now()

    // 1. Check in-memory cache first (TTL 60s)
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey)
      if (now - cached.timestamp < CACHE_TTL_MS) {
        setResults(cached.data)
        setLoading(false)
        setError(null)
        setHasSearched(true)
        return
      } else {
        searchCache.delete(cacheKey)
      }
    }

    // 2. Debounce query by 280ms
    setLoading(true)
    setError(null)

    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const response = await api.get('/users/search', {
          params: { q: sanitized },
          signal: controller.signal
        })

        const data = response?.data?.data || []
        
        // Save to in-memory cache
        searchCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })

        // Limit cache size to prevent unbounded memory growth
        if (searchCache.size > 200) {
          const oldestKey = searchCache.keys().next().value
          searchCache.delete(oldestKey)
        }

        setResults(data)
        setHasSearched(true)
        setError(null)
      } catch (err) {
        // Ignore aborted requests
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || err.message === 'canceled') {
          return
        }
        console.error('[useAccountSearch] Search error:', err)
        setError('Gagal memuat akun. Silakan coba lagi.')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [query])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    hasSearched,
    selectedAccount,
    selectAccount,
    clearSelectedAccount,
    clearSearch
  }
}

export default useAccountSearch
