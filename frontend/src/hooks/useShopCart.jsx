import { useState, useEffect } from 'react'
import { rbToast } from '../components/ui/RBToast'

export const getSizePriceIncrement = (size) => {
  if (!size) return 0;
  const s = size.toUpperCase().trim();
  if (s === 'XXL' || s === '2XL') return 5000;
  if (s === '3XL' || s === 'XXXL') return 10000;
  if (s === '4XL' || s === 'XXXXL') return 15000;
  return 0;
}

// chekiType: 'regular' | 'wide' | 'grup'
export const useShopCart = (hargaMember, hargaGrup, {
  chekiGrupEnabled = false,
  regularChekiEnabled = true,
  wideChekiEnabled = false,
  hargaChekiGrupPo = 150000,
} = {}) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('ks_cart')
      return saved ? JSON.parse(saved) : []
    } catch (e) { return [] }
  })
  
  const [merchCart, setMerchCart] = useState(() => {
    try {
      const saved = localStorage.getItem('ks_merch_cart')
      return saved ? JSON.parse(saved) : []
    } catch (e) { return [] }
  })

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('ks_cart', JSON.stringify(cart))
  }, [cart])

  // Sync prices with config if they change.
  // Now item can be:
  //   cheki_type='grup'    → hargaChekiGrupPo (semua member, if enabled)
  //   cheki_type='wide'    → hargaGrup (= Wide Cheki per member 16:9)
  //   cheki_type='regular' → hargaMember (= Regular per member, 2-shot)
  useEffect(() => {
    setCart(prev => prev.map(item => {
      let expectedPrice = hargaMember
      const type = item.cheki_type || (item.id === 'group' || item.id === 'grup' ? 'grup' : 'regular')
      if (type === 'grup') expectedPrice = Number(hargaChekiGrupPo) || 150000
      else if (type === 'wide') expectedPrice = hargaGrup
      if (item.price !== expectedPrice) {
        return { ...item, price: expectedPrice, cheki_type: type }
      }
      return { ...item, cheki_type: type }
    }))
  }, [hargaMember, hargaGrup, hargaChekiGrupPo])

  useEffect(() => {
    localStorage.setItem('ks_merch_cart', JSON.stringify(merchCart))
  }, [merchCart])

  // --- Cheki Cart Logic ---
  // chekiType: 'regular' | 'wide' | 'grup'
  const addToCart = (type, member = null, getMemberImage, chekiType = 'regular') => {
    const isGrup = type === 'group' || type === 'grup' || chekiType === 'grup'

    // Fallback ke tipe aman jika toggle OFF (protect)
    let finalType = chekiType
    if (isGrup) finalType = 'grup'
    if (finalType === 'grup' && !chekiGrupEnabled) return
    if (finalType === 'wide' && !wideChekiEnabled) finalType = 'regular'
    if (finalType === 'regular' && !regularChekiEnabled) return

    let price = Number(hargaMember)
    let labelPrefix = 'Regular Cheki'
    if (finalType === 'wide') { price = Number(hargaGrup); labelPrefix = 'Wide Cheki (16:9)' }
    if (finalType === 'grup') { price = Number(hargaChekiGrupPo) || 150000; labelPrefix = 'Cheki Grup' }

    const imageUrl = isGrup || finalType === 'grup'
      ? (member?.image_url || '/images/members/group.webp')
      : getMemberImage(member)

    const itemName = (isGrup || finalType === 'grup')
      ? 'Cheki Grup (Semua Member)'
      : (member.is_secret ? `${labelPrefix} Mystery (Secret Member)` : `${labelPrefix} ${member.nama_panggung}`)

    // Unique id = member + cheki_type (sehingga same member bisa punya 2 item: regular + wide terpisah)
    const uniqueId = (isGrup || finalType === 'grup')
      ? 'grup'
      : `${member.id}-${finalType}`

    const item = {
      id: uniqueId,
      cheki_type: finalType,
      member_id: (isGrup || finalType === 'grup') ? 'grup' : member.id,
      name: itemName,
      is_secret: Boolean(member?.is_secret),
      price,
      quantity: 1,
      image: imageUrl
    }

    const existing = cart.find(i => i.id === uniqueId)
    const newQty = existing ? existing.quantity + 1 : 1
    void newQty

    setCart(prev => {
      const existingInPrev = prev.find(i => i.id === uniqueId)
      if (existingInPrev) {
        return prev.map(i => i.id === uniqueId ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, item]
    })
  }

  const updateQuantity = (id, delta) => {
    const item = cart.find(i => i.id === id)
    if (item && item.quantity === 1 && delta === -1) {
      rbToast.error(`${item.name} dihapus dari keranjang`)
    }

    setCart(prev => {
      const itemInPrev = prev.find(i => i.id === id)
      if (itemInPrev && itemInPrev.quantity === 1 && delta === -1) {
        return prev.filter(i => i.id !== id)
      }
      return prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) }
        }
        return item
      })
    })
  }

  const removeFromCart = (id) => {
    const item = cart.find(i => i.id === id)
    if (item) {
      rbToast.error(`${item.name} dihapus dari keranjang`)
    }
    setCart(prev => prev.filter(item => item.id !== id))
  }

  // --- Merch Cart Logic ---

  const addToMerchCart = (item, size = '') => {
    const cartId = size ? `${item.id}-${size}` : item.id
    const existing = merchCart.find(i => i.cartId === cartId)
    const newQty = existing ? existing.quantity + 1 : 1
    // rbToast.merch(`${item.nama}${size ? ` (${size})` : ''}`, newQty)

    setMerchCart(prev => {
      const ex = prev.find(i => i.cartId === cartId)
      if (ex) return prev.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + 1 } : i)
      const baseHarga = item.baseHarga || item.harga;
      const finalHarga = baseHarga + getSizePriceIncrement(size);
      return [...prev, { ...item, baseHarga, harga: finalHarga, quantity: 1, cartId, size }]
    })
  }

  const updateMerchQuantity = (cartId, delta) => {
    setMerchCart(prev => {
      const item = prev.find(i => i.cartId === cartId)
      if (item && item.quantity === 1 && delta === -1) return prev.filter(i => i.cartId !== cartId)
      return prev.map(i => i.cartId === cartId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    })
  }

  const removeFromMerchCart = (cartId) => setMerchCart(prev => prev.filter(i => i.cartId !== cartId))
  
  const updateMerchSize = (cartId, newSize) => {
    setMerchCart(prev => {
      const existing = prev.find(i => i.cartId === cartId)
      if (!existing) return prev
      const newCartId = newSize ? `${existing.id}-${newSize}` : existing.id
      const duplicate = prev.find(i => i.cartId === newCartId && i.cartId !== cartId)
      if (duplicate) {
        return prev.map(i => {
          if (i.cartId === newCartId) return { ...i, quantity: i.quantity + existing.quantity }
          return i
        }).filter(i => i.cartId !== cartId)
      }
      const newHarga = existing.baseHarga + getSizePriceIncrement(newSize);
      return prev.map(i => i.cartId === cartId ? { ...i, cartId: newCartId, size: newSize, harga: newHarga } : i)
    })
  }

  const totalHarga = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalMerchHarga = merchCart.reduce((sum, i) => sum + (i.harga * i.quantity), 0)

  return {
    cart,
    setCart,
    merchCart,
    setMerchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    addToMerchCart,
    updateMerchQuantity,
    removeFromMerchCart,
    updateMerchSize,
    totalHarga,
    totalMerchHarga
  }
}
