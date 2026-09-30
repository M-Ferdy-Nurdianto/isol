import { useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'

/**
 * Cloudflare Turnstile Widget Component
 * Uses window.turnstile explicitly and supports auto theme adaptation
 */
const TurnstileWidget = ({ 
  siteKey, 
  onSuccess, 
  onError, 
  onExpire, 
  className = '' 
}) => {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const { theme } = useTheme()
  const activeSiteKey = siteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!activeSiteKey) {
      console.warn('[TurnstileWidget] Site Key is missing')
      return
    }

    let isMounted = true

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return

      // Clean up existing widget if rendered previously
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (_) {}
        widgetIdRef.current = null
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: activeSiteKey,
          theme: theme === 'dark' ? 'dark' : 'light',
          size: 'flexible',
          callback: (token) => {
            if (isMounted && onSuccess) onSuccess(token)
          },
          'error-callback': (code) => {
            console.error('[TurnstileWidget] Verification error code:', code)
            if (isMounted && onError) onError(code)
          },
          'expired-callback': () => {
            if (isMounted && onExpire) onExpire()
          }
        })
        widgetIdRef.current = id
      } catch (err) {
        console.error('[TurnstileWidget] Error rendering widget:', err)
      }
    }

    // Check if turnstile script is ready
    if (window.turnstile) {
      renderWidget()
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval)
          renderWidget()
        }
      }, 100)
      return () => {
        isMounted = false
        clearInterval(interval)
        if (widgetIdRef.current !== null && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch (_) {}
        }
      }
    }

    return () => {
      isMounted = false
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (_) {}
        widgetIdRef.current = null
      }
    }
  }, [activeSiteKey, theme])

  return (
    <div className={`w-full flex justify-center py-2 ${className}`}>
      <div ref={containerRef} className="min-h-[65px]" />
    </div>
  )
}

export default TurnstileWidget
