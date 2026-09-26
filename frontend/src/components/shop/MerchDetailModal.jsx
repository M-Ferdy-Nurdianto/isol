import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaPlus, FaMinus, FaChevronLeft, FaChevronRight, FaShoppingCart } from 'react-icons/fa'
import { getSizePriceIncrement } from '../../hooks/useShopCart'

const MerchDetailModal = ({ 
  selectedMerch, 
  setSelectedMerch, 
  activeSlide, 
  setActiveSlide, 
  selectedSize, 
  setSelectedSize, 
  addToMerchCart 
}) => {
  if (!selectedMerch) return null

  const images = [selectedMerch.gambar_url, ...(selectedMerch.size_chart_urls || [])].filter(Boolean)
  const hasMultipleImages = images.length > 1

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md"
        onClick={() => setSelectedMerch(null)}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }} 
          animate={{ scale: 1, y: 0 }} 
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white dark:bg-[#111726] rounded-[2.5rem] max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
          onClick={e => e.stopPropagation()}
        >
          <button 
            onClick={() => setSelectedMerch(null)}
            className="absolute top-6 right-6 z-50 w-10 h-10 bg-white/90 dark:bg-[#1a2234]/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-lg hover:bg-white dark:hover:bg-[#243048] transition-colors"
          >
            <FaTimes />
          </button>

          {/* Left: Image Carousel */}
          <div className="w-full md:w-1/2 bg-gray-50 dark:bg-white/5 relative flex items-center justify-center min-h-[300px] md:min-h-0">
             <AnimatePresence mode="wait">
                <motion.img 
                  key={activeSlide}
                  src={images[activeSlide]} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full object-contain p-8"
                />
             </AnimatePresence>

             {hasMultipleImages && (
                <>
                  <div className="absolute inset-x-4 flex justify-between pointer-events-none">
                     <button 
                       onClick={() => setActiveSlide((activeSlide - 1 + images.length) % images.length)}
                       className="w-10 h-10 rounded-full bg-white/90 dark:bg-[#1a2234]/90 backdrop-blur-md flex items-center justify-center text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-lg pointer-events-auto hover:bg-white dark:hover:bg-[#243048] transition-all"
                     >
                        <FaChevronLeft className="text-xs" />
                     </button>
                     <button 
                       onClick={() => setActiveSlide((activeSlide + 1) % images.length)}
                       className="w-10 h-10 rounded-full bg-white/90 dark:bg-[#1a2234]/90 backdrop-blur-md flex items-center justify-center text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-lg pointer-events-auto hover:bg-white dark:hover:bg-[#243048] transition-all"
                     >
                        <FaChevronRight className="text-xs" />
                     </button>
                  </div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                     {images.map((_, i) => (
                        <button 
                           key={i} 
                           onClick={() => setActiveSlide(i)}
                           className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeSlide ? 'bg-[#079108] w-4' : 'bg-gray-300'}`}
                        />
                     ))}
                  </div>
                </>
             )}
          </div>

          {/* Right: Content */}
          <div className="w-full md:w-1/2 p-8 sm:p-12 overflow-y-auto custom-scrollbar flex flex-col">
             <div className="flex-1 space-y-8">
                 <div>
                    <p className="text-[10px] font-black text-[#079108] uppercase tracking-[0.2em] mb-2">Official Merchandise</p>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">{selectedMerch.nama}</h2>
                    <div className="flex items-baseline gap-2 mt-2">
                       <p className="text-2xl font-black text-[#079108]">
                          IDR {(selectedMerch.harga + getSizePriceIncrement(selectedSize)).toLocaleString()}
                       </p>
                       {getSizePriceIncrement(selectedSize) > 0 && (
                          <span className="text-xs font-bold text-emerald-600">
                             (+IDR {getSizePriceIncrement(selectedSize).toLocaleString()} untuk {selectedSize})
                          </span>
                       )}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Deskripsi Produk</h4>
                    <p className="text-sm font-medium text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{selectedMerch.deskripsi || 'Tidak ada deskripsi.'}</p>
                 </div>

                 {selectedMerch.sizes && selectedMerch.sizes.length > 0 && (
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pilih Ukuran</h4>
                          {selectedMerch.size_chart_urls?.length > 0 && (
                             <button 
                               onClick={() => setActiveSlide(1)}
                               className="text-[10px] font-black text-[#079108] uppercase tracking-widest hover:underline"
                             >
                                Size Chart
                             </button>
                          )}
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {selectedMerch.sizes.map(size => (
                             <button 
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedSize === size ? 'bg-[#079108] text-white shadow-lg shadow-[#079108]/20' : 'bg-gray-50 dark:bg-white/10 text-gray-400 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/20'}`}
                             >
                                {size}
                             </button>
                          ))}
                       </div>
                    </div>
                 )}
             </div>

             <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/10">
                 <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                       if (selectedMerch.sizes?.length > 0 && !selectedSize) return alert('Silakan pilih ukuran terlebih dahulu')
                       addToMerchCart(selectedMerch, selectedSize)
                       setSelectedMerch(null)
                    }}
                    className="w-full bg-[#079108] hover:bg-[#067a07] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-3 transition-all"
                 >
                    <FaShoppingCart /> Add to Cart
                 </motion.button>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MerchDetailModal
