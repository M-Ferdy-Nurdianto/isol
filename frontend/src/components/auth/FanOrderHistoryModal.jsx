import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaHistory, FaCalendarAlt, FaTicketAlt, FaReceipt, FaCheck, FaHourglassHalf, FaExternalLinkAlt } from 'react-icons/fa'
import { useFanAuth } from '../../context/FanAuthContext'
import api from '../../lib/api'

const FanOrderHistoryModal = ({ onOpenReceipt }) => {
  const { orderHistoryModalOpen, closeOrderHistory, fanUser } = useFanAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (orderHistoryModalOpen && fanUser?.email) {
      setLoading(true)
      api.get(`/auth/fan/orders?email=${encodeURIComponent(fanUser.email)}`)
        .then(res => {
          if (res.data?.success) {
            setOrders(res.data.data || [])
          }
        })
        .catch(err => {
          console.error('Error fetching order history:', err)
        })
        .finally(() => setLoading(false))
    }
  }, [orderHistoryModalOpen, fanUser?.email])

  if (!orderHistoryModalOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeOrderHistory}
          className="absolute inset-0 bg-black/60"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
          className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-surface border border-border shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />

          {/* Close Button */}
          <button
            onClick={closeOrderHistory}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background/80 transition-colors z-20"
            aria-label="Tutup"
          >
            <FaTimes size={14} />
          </button>

          {/* Header */}
          <div className="p-6 sm:p-8 pb-4 border-b border-border flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
              <FaHistory size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">Riwayat Tiket</p>
              <h3 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                Pesanan Saya
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {fanUser?.nama} ({fanUser?.email})
              </p>
            </div>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-xs text-text-secondary uppercase tracking-widest font-bold">Memuat riwayat...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center mx-auto text-text-secondary/40">
                  <FaTicketAlt size={24} />
                </div>
                <h4 className="text-base font-bold text-text-primary">Belum Ada Riwayat Pesanan</h4>
                <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                  Kamu belum melakukan pemesanan tiket dengan email ini. Silakan pilih event dan pesan tiket Cheki favoritmu!
                </p>
              </div>
            ) : (
              orders.map((ord) => {
                const isCompleted = ord.status === 'completed'
                const isPaid = ord.status === 'paid' || ord.status === 'checked' || ord.status === 'verified' || ord.status === 'approved'
                const isPending = ord.status === 'pending'
                const isRejected = ord.status === 'rejected' || ord.status === 'cancelled'

                return (
                  <div
                    key={ord.id || ord.order_number}
                    className="p-5 rounded-2xl bg-background border border-border hover:border-primary/30 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-text-secondary">
                          #{ord.order_number}
                        </span>
                        <h4 className="text-base font-black text-text-primary mt-0.5">
                          {ord.events?.nama || 'Event Kohi Sekai'}
                        </h4>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : isPaid
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : isPending
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <FaCheck size={10} /> Completed
                          </>
                        ) : isPaid ? (
                          <>
                            <FaCheck size={10} /> Paid
                          </>
                        ) : isPending ? (
                          <>
                            <FaHourglassHalf size={10} /> Pending
                          </>
                        ) : (
                          'Dibatalkan'
                        )}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 py-1">
                      {(ord.order_items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-text-secondary font-medium">
                            {item.quantity}x {item.item_name}
                          </span>
                          <span className="text-text-primary font-bold">
                            Rp {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-text-secondary">Total: </span>
                        <span className="text-sm font-black text-primary">
                          Rp {(ord.total_harga || 0).toLocaleString()}
                        </span>
                      </div>

                      {ord.payment_proof_url && (
                        <a
                          href={ord.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                        >
                          <FaReceipt size={10} />
                          <span>Bukti Bayar</span>
                          <FaExternalLinkAlt size={8} />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default FanOrderHistoryModal
