import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { kohiToast } from '../components/ui/KohiToast'
import { useFlyToCart } from './FlyToCartContext'

const MerchCartContext = createContext(null)

export const MerchCartProvider = ({ children }) => {
  const { triggerFly } = useFlyToCart()

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('ks_merch_cart')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.warn('Failed to parse cart from localStorage:', e)
      return []
    }
  })

  const [isCartOpen, setIsCartOpen] = useState(false)

  // Sync to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem('ks_merch_cart', JSON.stringify(cart))
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e)
    }
  }, [cart])

  // Add item to cart
  const addToCart = useCallback((item, size = '', quantity = 1, startPos = null) => {
    if (!item) return

    const cartId = size ? `${item.id}-${size}` : String(item.id)
    const basePrice = Number(item.harga || 0)

    setCart(prev => {
      const existingIdx = prev.findIndex(i => i.cartId === cartId)
      if (existingIdx >= 0) {
        const existing = prev[existingIdx]
        const maxStok = existing.stok !== undefined ? existing.stok : 99
        const newQty = Math.min(maxStok, existing.quantity + quantity)
        
        const updated = [...prev]
        updated[existingIdx] = { ...existing, quantity: newQty }
        return updated
      } else {
        const newItem = {
          cartId,
          merchandise_id: item.id,
          nama: item.nama,
          harga: basePrice,
          size: size || null,
          quantity: quantity,
          gambar_url: item.gambar_url || null,
          stok: item.stok !== undefined ? item.stok : 99,
          kategori: item.kategori || 'baju'
        }
        return [...prev, newItem]
      }
    })

    // Trigger flying animation if startPos given
    if (startPos && triggerFly) {
      const imgUrl = item.gambar_url ? item.gambar_url : null
      triggerFly(startPos, imgUrl)
    }

    kohiToast.success(`${item.nama} ${size ? `(${size}) ` : ''}ditambahkan ke keranjang!`)
  }, [triggerFly])

  // Update quantity (+1 or -1 or custom)
  const updateQuantity = useCallback((cartId, delta) => {
    setCart(prev => {
      const item = prev.find(i => i.cartId === cartId)
      if (!item) return prev

      const newQty = item.quantity + delta
      if (newQty <= 0) {
        kohiToast.info(`${item.nama} dihapus dari keranjang`)
        return prev.filter(i => i.cartId !== cartId)
      }

      const maxStok = item.stok !== undefined ? item.stok : 99
      return prev.map(i => i.cartId === cartId ? { ...i, quantity: Math.min(maxStok, newQty) } : i)
    })
  }, [])

  // Remove single item
  const removeFromCart = useCallback((cartId) => {
    setCart(prev => {
      const item = prev.find(i => i.cartId === cartId)
      if (item) {
        kohiToast.info(`${item.nama} dihapus dari keranjang`)
      }
      return prev.filter(i => i.cartId !== cartId)
    })
  }, [])

  // Clear all items
  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const totalItems = cart.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)
  const totalPrice = cart.reduce((sum, i) => sum + ((Number(i.harga) || 0) * (Number(i.quantity) || 1)), 0)

  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  return (
    <MerchCartContext.Provider
      value={{
        cart,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice
      }}
    >
      {children}
    </MerchCartContext.Provider>
  )
}

export const useMerchCart = () => {
  const context = useContext(MerchCartContext)
  if (!context) {
    throw new Error('useMerchCart must be used within a MerchCartProvider')
  }
  return context
}

export default MerchCartContext

