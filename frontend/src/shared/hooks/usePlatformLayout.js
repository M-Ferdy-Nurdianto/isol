import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

const MOBILE_BREAKPOINT = 768 // Tablet 769-1024px uses desktop layout

/**
 * Hook to determine whether to render Mobile (native-feel) or Desktop layout.
 * Detects Capacitor native platform (Android/iOS) OR screen width <= 768px.
 * Tablets (769px - 1024px) use desktop layout as per architecture guidelines.
 */
export function usePlatformLayout() {
  const checkIsMobile = () => {
    if (typeof window === 'undefined') return false
    // 1. Native platform (Capacitor Android / iOS) is always mobile layout
    if (Capacitor.isNativePlatform()) {
      return true
    }
    // 2. Viewport width check (<= 768px is mobile; >= 769px is desktop/tablet)
    return window.innerWidth <= MOBILE_BREAKPOINT
  }

  const [isMobile, setIsMobile] = useState(checkIsMobile)

  useEffect(() => {
    // If native platform, it will always be mobile layout
    if (Capacitor.isNativePlatform()) {
      setIsMobile(true)
      return
    }

    const handleResize = () => {
      const nextIsMobile = window.innerWidth <= MOBILE_BREAKPOINT
      setIsMobile(prev => (prev !== nextIsMobile ? nextIsMobile : prev))
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return {
    isMobile,
    isDesktop: !isMobile,
    isNative: Capacitor.isNativePlatform()
  }
}

export default usePlatformLayout
