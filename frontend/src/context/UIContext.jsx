import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const UIContext = createContext({
  isBottomNavHidden: false,
  registerBottomBar: () => () => {}
})

export const UIProvider = ({ children }) => {
  // Count of active overlays/sheets/pages requesting to hide the bottom nav
  const [hideCount, setHideCount] = useState(0)

  const registerBottomBar = useCallback(() => {
    setHideCount(prev => prev + 1)
    return () => {
      setHideCount(prev => Math.max(0, prev - 1))
    }
  }, [])

  return (
    <UIContext.Provider
      value={{
        isBottomNavHidden: hideCount > 0,
        registerBottomBar
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => useContext(UIContext)

/**
 * Hook to automatically hide bottom nav when component/sheet is mounted or active.
 * Restores bottom nav when unmounted or when active becomes false.
 */
export const useHideBottomNav = (active = true) => {
  const { registerBottomBar } = useUI()

  useEffect(() => {
    if (!active) return
    const unregister = registerBottomBar()
    return unregister
  }, [active, registerBottomBar])
}
