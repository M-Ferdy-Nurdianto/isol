import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaShoppingCart } from 'react-icons/fa'

const FlyToCartContext = createContext()

export const FlyToCartProvider = ({ children }) => {
  const [flies, setFlies] = useState([])

  const triggerFly = useCallback((startPos, imageUrl) => {
    // Cari elemen target keranjang (Cart Button di Header / Mobile Navbar / Cart Sidebar)
    let targetEl = document.querySelector('[data-cart-icon]')
    
    let targetPos = {
      x: window.innerWidth - 60,
      y: 30
    }

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect()
      targetPos = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    }

    const id = Date.now() + Math.random()

    setFlies(prev => [...prev, { id, startPos, targetPos, imageUrl }])

    // Animasi icon keranjang agar berdenyut / bounce ketika item sampai
    setTimeout(() => {
      if (targetEl) {
        targetEl.classList.add('animate-bounce')
        setTimeout(() => targetEl.classList.remove('animate-bounce'), 500)
      }
    }, 600)
  }, [])

  const removeFly = useCallback((id) => {
    setFlies(prev => prev.filter(f => f.id !== id))
  }, [])

  return (
    <FlyToCartContext.Provider value={{ triggerFly }}>
      {children}
      <div className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden">
        <AnimatePresence>
          {flies.map(fly => (
            <motion.div
              key={fly.id}
              initial={{
                x: fly.startPos.x - 24,
                y: fly.startPos.y - 24,
                scale: 1,
                opacity: 1,
                rotate: 0
              }}
              animate={{
                x: fly.targetPos.x - 16,
                y: fly.targetPos.y - 16,
                scale: 0.2,
                opacity: 0.8,
                rotate: 360
              }}
              exit={{ opacity: 0, scale: 0.1 }}
              transition={{
                duration: 0.65,
                ease: [0.2, 0.8, 0.2, 1]
              }}
              onAnimationComplete={() => removeFly(fly.id)}
              className="absolute w-12 h-12 rounded-full bg-white dark:bg-[#111726] border-2 border-[#079108] shadow-2xl overflow-hidden p-1 flex items-center justify-center pointer-events-none"
            >
              {fly.imageUrl ? (
                <img src={fly.imageUrl} alt="Fly item" className="w-full h-full object-cover rounded-full" />
              ) : (
                <FaShoppingCart className="text-[#079108]" style={{ fontSize: '14px' }} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </FlyToCartContext.Provider>
  )
}

export const useFlyToCart = () => {
  const context = useContext(FlyToCartContext)
  if (!context) {
    return { triggerFly: () => {} }
  }
  return context
}
