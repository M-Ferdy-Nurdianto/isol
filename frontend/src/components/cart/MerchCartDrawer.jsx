import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FaTimes, FaTrash, FaMinus, FaPlus, FaShoppingBag, FaArrowRight, FaBox } from 'react-icons/fa'
import { useMerchCart } from '../../context/MerchCartContext'
import { getAssetPath } from '../../lib/pathUtils'

const MerchCartDrawer = () => {
  const navigate = useNavigate()
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, totalItems, totalPrice } = useMerchCart()

  const handleGoToCheckout = () => {
    closeCart()
    navigate('/checkout/merch')
  }

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="absolute inset-0 bg-black/85"
          />

          {/* =========================================================================
              MOBILE CART DRAWER (md:hidden) — Bottom Sheet
              ========================================================================= */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="md:hidden absolute inset-x-0 bottom-0 bg-[#241E19] border-t border-[#3A2E24] rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl z-10"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#3A2E24] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E8944A]/15 text-[#E8944A] flex items-center justify-center text-xs">
                  <FaShoppingBag />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                    Keranjang Merch
                  </h3>
                  <p className="text-[10px] text-text-secondary font-mono">
                    {totalItems} item dipilih
                  </p>
                </div>
              </div>

              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-full bg-[#1A1512] border border-[#3A2E24] flex items-center justify-center text-text-secondary hover:text-text-primary"
                aria-label="Tutup Keranjang"
              >
                <FaTimes size={12} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#1A1512] border border-[#3A2E24] flex items-center justify-center text-text-secondary mx-auto">
                    <FaBox size={24} className="text-[#E8944A]/40" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-primary uppercase">Keranjang Kosong</p>
                    <p className="text-xs text-text-secondary mt-1">Kamu belum menambahkan merchandise ke keranjang.</p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="px-4 py-2 rounded-xl bg-[#E8944A] text-white text-xs font-black uppercase tracking-wider shadow-md hover:bg-[#E8944A]/90 transition"
                  >
                    Lihat Koleksi Merch
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.cartId}
                    className="p-3 rounded-2xl bg-[#1A1512] border border-[#3A2E24] flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-xl bg-[#241E19] border border-[#3A2E24] overflow-hidden shrink-0">
                      {item.gambar_url ? (
                        <img
                          src={getAssetPath(item.gambar_url)}
                          alt={item.nama}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = getAssetPath('/images/members/placeholder.svg')
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaBox className="text-[#E8944A]/40 text-lg" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-text-primary truncate">{item.nama}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-black text-[#E8944A]">
                          Rp {Number(item.harga || 0).toLocaleString('id-ID')}
                        </span>
                        {item.size && (
                          <span className="px-1.5 py-0.5 rounded bg-[#241E19] border border-[#3A2E24] text-[9px] font-mono font-bold text-text-secondary uppercase">
                            Size: {item.size}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, -1)}
                            className="w-6 h-6 rounded-lg bg-[#241E19] border border-[#3A2E24] flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-95"
                          >
                            <FaMinus size={8} />
                          </button>
                          <span className="text-xs font-mono font-black text-text-primary w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, 1)}
                            className="w-6 h-6 rounded-lg bg-[#241E19] border border-[#3A2E24] flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-95"
                          >
                            <FaPlus size={8} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartId)}
                          className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                          title="Hapus"
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mobile Footer Checkout Bar */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-[#3A2E24] bg-[#241E19] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total</span>
                  <span className="text-base font-black text-[#E8944A]">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoToCheckout}
                  className="w-full py-3 px-4 rounded-xl bg-[#E8944A] hover:bg-[#E8944A]/90 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
                >
                  <span>Lanjut ke Checkout ({totalItems})</span>
                  <FaArrowRight size={11} />
                </button>
              </div>
            )}
          </motion.div>

          {/* =========================================================================
              DESKTOP CART DRAWER (hidden md:block) — Right Side Panel
              ========================================================================= */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="hidden md:flex absolute top-0 right-0 bottom-0 w-full max-w-md bg-[#241E19] border-l border-[#3A2E24] flex-col shadow-2xl z-10"
          >
            {/* Desktop Header */}
            <div className="p-6 border-b border-[#3A2E24] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E8944A]/15 text-[#E8944A] flex items-center justify-center text-sm">
                  <FaShoppingBag />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary uppercase tracking-tight">
                    Keranjang Belanja Merch
                  </h3>
                  <p className="text-xs text-text-secondary font-mono">
                    {totalItems} item merchandise
                  </p>
                </div>
              </div>

              <button
                onClick={closeCart}
                className="w-9 h-9 rounded-xl bg-[#1A1512] border border-[#3A2E24] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Tutup"
              >
                <FaTimes size={13} />
              </button>
            </div>

            {/* Desktop Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-[#1A1512] border border-[#3A2E24] flex items-center justify-center text-text-secondary mx-auto">
                    <FaBox size={32} className="text-[#E8944A]/40" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-text-primary uppercase tracking-tight">
                      Keranjang Masih Kosong
                    </h4>
                    <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto leading-relaxed">
                      Pilih official merchandise favoritmu dan klik "Tambah ke Keranjang".
                    </p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="px-6 py-2.5 rounded-full bg-[#E8944A] text-white text-xs font-black uppercase tracking-wider shadow-md hover:bg-[#E8944A]/90 transition"
                  >
                    Jelajahi Merchandise
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.cartId}
                    className="p-4 rounded-2xl bg-[#1A1512] border border-[#3A2E24] flex items-center gap-4 hover:border-[#E8944A]/40 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-xl bg-[#241E19] border border-[#3A2E24] overflow-hidden shrink-0">
                      {item.gambar_url ? (
                        <img
                          src={getAssetPath(item.gambar_url)}
                          alt={item.nama}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = getAssetPath('/images/members/placeholder.svg')
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaBox className="text-[#E8944A]/40 text-xl" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-text-primary line-clamp-1 uppercase">
                        {item.nama}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-[#E8944A]">
                          Rp {Number(item.harga || 0).toLocaleString('id-ID')}
                        </span>
                        {item.size && (
                          <span className="px-2 py-0.5 rounded-md bg-[#241E19] border border-[#3A2E24] text-[10px] font-mono font-bold text-text-secondary uppercase">
                            Ukuran: {item.size}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#3A2E24]/60">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, -1)}
                            className="w-7 h-7 rounded-lg bg-[#241E19] border border-[#3A2E24] flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-[#E8944A]/40 transition-colors"
                          >
                            <FaMinus size={9} />
                          </button>
                          <span className="text-xs font-mono font-black text-text-primary w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartId, 1)}
                            className="w-7 h-7 rounded-lg bg-[#241E19] border border-[#3A2E24] flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-[#E8944A]/40 transition-colors"
                          >
                            <FaPlus size={9} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartId)}
                          className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors"
                        >
                          <FaTrash size={10} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Footer Checkout Bar */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-[#3A2E24] bg-[#241E19] space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>Subtotal Produk</span>
                    <span className="font-mono font-bold">Rp {totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-black text-text-primary pt-2 border-t border-[#3A2E24]">
                    <span>Total Pembayaran</span>
                    <span className="text-lg font-black text-[#E8944A] font-mono">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoToCheckout}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#E8944A] hover:bg-[#E8944A]/90 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#E8944A]/20 transition active:scale-95"
                >
                  <span>Halaman Checkout ({totalItems} Item)</span>
                  <FaArrowRight size={12} />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default MerchCartDrawer

