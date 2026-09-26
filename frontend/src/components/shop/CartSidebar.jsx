import { motion, AnimatePresence } from 'framer-motion'
import { FaShoppingCart, FaPlus, FaMinus, FaTrash, FaChevronRight, FaUniversity, FaShoppingBag } from 'react-icons/fa'

const CartSidebar = ({ 
  cart, 
  merchCart, 
  updateQuantity, 
  removeFromCart, 
  updateMerchQuantity, 
  removeFromMerchCart, 
  updateMerchSize, 
  totalHarga, 
  totalMerchHarga, 
  onCheckout 
}) => {
  const hasItems = cart.length > 0 || merchCart.length > 0

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:col-span-1">
        <div className="sticky top-32">
          <div className="bg-white dark:bg-[#111726] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-[#079108]">
                <FaShoppingCart className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Keranjang</h3>
                <p className="text-xs text-gray-400">{cart.length + merchCart.length} item dipilih</p>
              </div>
            </div>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {/* Cheki Items */}
                {cart.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-white/5 flex-shrink-0 overflow-hidden border border-gray-100 dark:border-white/10">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</h4>
                      <p className="text-xs text-emerald-600 font-medium">Rp {item.price.toLocaleString()}</p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-lg p-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 rounded transition-colors"><FaMinus className="text-[8px] text-gray-400" /></button>
                          <span className="w-6 text-center text-xs font-bold dark:text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 rounded transition-colors"><FaPlus className="text-[8px] text-emerald-600" /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <FaTrash className="text-[10px]" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Merch Items */}
                {merchCart.map((item) => (
                  <motion.div 
                    key={item.cartId}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-white/5 flex-shrink-0 overflow-hidden border border-gray-100 dark:border-white/10 relative">
                      {item.gambar_url ? (
                        <img src={item.gambar_url} alt={item.nama} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <FaShoppingBag className="text-gray-300" style={{ fontSize: '16px' }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.nama}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-emerald-600 font-medium">Rp {item.harga.toLocaleString()}</p>
                        {item.size && <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500 dark:text-slate-300 font-bold uppercase">{item.size}</span>}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-lg p-1">
                          <button onClick={() => updateMerchQuantity(item.cartId, -1)} className="w-5 h-5 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 rounded transition-colors"><FaMinus className="text-[8px] text-gray-400" /></button>
                          <span className="w-6 text-center text-xs font-bold dark:text-white">{item.quantity}</span>
                          <button onClick={() => updateMerchQuantity(item.cartId, 1)} className="w-5 h-5 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 rounded transition-colors"><FaPlus className="text-[8px] text-emerald-600" /></button>
                        </div>
                        <button onClick={() => removeFromMerchCart(item.cartId)} className="text-gray-300 hover:text-red-500 transition-colors"><FaTrash className="text-[10px]" /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {!hasItems && (
                <div className="py-10 text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200 dark:text-white/20">
                    <FaShoppingCart className="text-2xl" />
                  </div>
                  <p className="text-gray-400 text-sm">Keranjang belanja kosong</p>
                  <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-widest font-bold">Pilih item untuk memulai</p>
                </div>
              )}
            </div>

            {hasItems && (
              <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-500 dark:text-slate-400">Total Pembayaran</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Rp {(totalHarga + totalMerchHarga).toLocaleString()}</span>
                </div>
                
                <button 
                  onClick={onCheckout}
                  className="w-full bg-[#079108] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-900/10 hover:bg-[#067a07] transition-all flex items-center justify-center gap-2"
                >
                  Checkout Sekarang
                  <FaChevronRight className="text-[10px]" />
                </button>

                <p className="text-center text-[10px] text-gray-400 mt-4 font-medium uppercase tracking-widest">
                  Pembayaran Aman via Transfer Bank
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Button */}
      <AnimatePresence>
        {hasItems && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-40 lg:hidden"
          >
            <button 
              onClick={onCheckout}
              className="w-full bg-white dark:bg-[#111726] text-gray-900 dark:text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-gray-200 dark:border-white/10 backdrop-blur-md transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#079108] rounded-xl flex items-center justify-center shadow-md shadow-[#079108]/30" data-cart-icon>
                  <FaShoppingCart className="text-white text-sm" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Checkout</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{cart.length + merchCart.length} item dipilih</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-[#079108] dark:text-emerald-400">Rp {(totalHarga + totalMerchHarga).toLocaleString()}</span>
                <div className="w-8 h-8 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white rounded-full flex items-center justify-center">
                  <FaChevronRight className="text-[10px]" />
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}


export default CartSidebar
