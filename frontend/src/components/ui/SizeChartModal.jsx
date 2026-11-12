import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaRulerCombined, FaInfoCircle } from 'react-icons/fa'

const SIZE_CHART_DATA = [
  { size: 'S', width: '48 cm', length: '68 cm', sleeve: '20 cm' },
  { size: 'M', width: '50 cm', length: '70 cm', sleeve: '21 cm' },
  { size: 'L', width: '52 cm', length: '72 cm', sleeve: '22 cm' },
  { size: 'XL', width: '54 cm', length: '74 cm', sleeve: '23 cm' },
  { size: 'XXL', width: '56 cm', length: '76 cm', sleeve: '24 cm' },
  { size: '3XL', width: '58 cm', length: '78 cm', sleeve: '25 cm' },
]

const SizeChartModal = ({ isOpen, onClose, itemName = 'Apparel Kohi Sekai' }) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-[#241E19] border border-[#3A2E24] rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1A1512] border border-[#3A2E24] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Tutup"
          >
            <FaTimes size={12} />
          </button>

          {/* Title */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#E8944A]/15 text-[#E8944A] flex items-center justify-center text-sm shrink-0">
              <FaRulerCombined />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-text-primary uppercase tracking-tight">
                Panduan Ukuran (Size Chart)
              </h3>
              <p className="text-[11px] text-text-secondary truncate max-w-xs">{itemName}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#3A2E24] bg-[#1A1512] mb-4">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#3A2E24] bg-[#241E19] text-text-secondary uppercase tracking-wider text-[10px] font-black">
                  <th className="py-2.5 px-3 font-mono">Size</th>
                  <th className="py-2.5 px-3">Lebar Dada</th>
                  <th className="py-2.5 px-3">Panjang Baju</th>
                  <th className="py-2.5 px-3">Panjang Lengan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A2E24]/60 font-mono">
                {SIZE_CHART_DATA.map((row) => (
                  <tr key={row.size} className="hover:bg-[#241E19]/50 transition-colors">
                    <td className="py-2 px-3 font-black text-[#E8944A]">{row.size}</td>
                    <td className="py-2 px-3 text-text-primary">{row.width}</td>
                    <td className="py-2 px-3 text-text-primary">{row.length}</td>
                    <td className="py-2 px-3 text-text-secondary">{row.sleeve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          <div className="p-3 rounded-xl bg-[#1A1512] border border-[#3A2E24] flex items-start gap-2.5 mb-4">
            <FaInfoCircle className="text-[#E8944A] shrink-0 mt-0.5 text-xs" />
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Toleransi ukuran ±1-2 cm karena proses jahit konveksi. Bahan menggunakan katun combed / dryfit premium dengan stretch ringan.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#E8944A] text-white font-black text-xs uppercase tracking-wider hover:bg-[#E8944A]/90 transition shadow-md active:scale-95"
          >
            Tutup Panduan Ukuran
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default SizeChartModal

