import { motion } from 'framer-motion'
import { FaBox, FaPlus } from 'react-icons/fa'
import { useFlyToCart } from '../../context/FlyToCartContext'

const MerchSection = ({ merch, merchCart, setSelectedMerch, addToMerchCart }) => {
  const { triggerFly } = useFlyToCart()
  if (merch.length === 0) return null

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[#079108] to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-[#079108]/20">
          <FaBox className="text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase tracking-wide">Official Merch</h3>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">Merchandise resmi Kohi Sekai</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {merch.map((item, idx) => {
          const inCart = merchCart.find(i => i.id === item.id)
          const isClosed = item.available === false
          const habis = !isClosed && item.stok > 0 && item.stok <= (inCart?.quantity || 0)
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              className={`relative bg-white dark:bg-[#111726] rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-white/10 cursor-pointer transition-all duration-300 ${habis || isClosed ? 'opacity-60' : 'hover:shadow-xl dark:hover:bg-[#151c2e] hover:border-gray-200 dark:hover:border-white/20'}`}
              onClick={() => !habis && !isClosed && setSelectedMerch(item)}
            >
              <div className="relative w-full overflow-hidden">
                {item.gambar_url ? (
                  <img src={item.gambar_url} alt={item.nama} className="w-full h-auto object-contain" />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-emerald-50 to-gray-100 dark:from-[#0e1a1e] dark:to-[#111726] flex items-center justify-center">
                    <FaBox className="text-5xl text-emerald-200 dark:text-emerald-800" />
                  </div>
                )}
                {isClosed && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-gray-800 text-white text-xs font-black uppercase px-4 py-2 rounded-full tracking-widest border border-gray-600">Close</span>
                  </div>
                )}
                {!isClosed && habis && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-xs font-black uppercase px-4 py-2 rounded-full tracking-widest">Habis</span>
                  </div>
                )}
                {!habis && !isClosed && inCart && (
                  <div className="absolute top-2 right-2 bg-[#079108] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                    {inCart.quantity}x
                  </div>
                )}
              </div>

              <div className="p-4 space-y-2">
                <h4 className="font-black text-sm uppercase tracking-tight text-gray-900 dark:text-white leading-tight">{item.nama}</h4>
                {item.deskripsi && <p className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed whitespace-pre-line">{item.deskripsi}</p>}
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-base font-black ${isClosed ? 'text-gray-400 dark:text-slate-500' : 'text-[#079108]'}`}>
                    IDR {item.harga.toLocaleString()}
                  </span>
                  {!habis && !isClosed && (
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-full bg-[#079108] flex items-center justify-center text-white shadow-md cursor-pointer"
                        onClick={e => { 
                          e.stopPropagation(); 
                          const rect = e.currentTarget.getBoundingClientRect()
                          const startPos = {
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2
                          }
                          triggerFly(startPos, item.gambar_url)
                          if (item.sizes && item.sizes.length > 0) {
                            setSelectedMerch(item);
                          } else {
                            addToMerchCart(item);
                          }
                        }}
                      >
                        <FaPlus className="text-xs" />
                      </motion.div>
                  )}
                </div>
                {(!item.stok || item.stok === 0) && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{isClosed ? '' : 'Pre-Order'}</p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default MerchSection
