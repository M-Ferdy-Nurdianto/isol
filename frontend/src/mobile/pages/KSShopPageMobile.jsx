import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaTicketAlt,
  FaBox,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaShoppingBag,
  FaPlus,
  FaMinus,
  FaCheck,
  FaChevronRight,
  FaUsers,
  FaStar,
  FaRulerCombined
} from 'react-icons/fa'
import { useShopData } from '@shared/hooks/useShopData'
import { useMerchCart, useFanAuth } from '@shared/context'
import { kohiToast } from '../../components/ui/KohiToast'
import MobileAppShell from '../components/layout/MobileAppShell'
import MobileBottomSheet from '../components/common/MobileBottomSheet'

/**
 * KSShopPageMobile (Native-Feel Shop & Ticketing for Mobile)
 * Strictly adheres to Deep Coffee Design:
 * - Solid surfaces (#241E19), borders (#3A2E24)
 * - Anti-blur: NO backdrop-blur, NO gradients
 * - Unified brand tab switch (bg-[var(--primary)])
 * - Thumb-friendly event cards & member cheki selection
 * - Bottom sheet for merchandise size & quantity selection
 */
const KSShopPageMobile = () => {
  const navigate = useNavigate()
  const { events, members, groupMember, merchandise, loading } = useShopData()
  const { addToCart, totalItems, totalPrice } = useMerchCart()
  const { isLoggedIn, openAuthModal } = useFanAuth()

  // Tab State: 'cheki' | 'merch'
  const [activeTab, setActiveTab] = useState('cheki')
  
  // Selected Event for Cheki
  const [selectedEventId, setSelectedEventId] = useState(null)

  // Merch States
  const [merchCategory, setMerchCategory] = useState('all') // 'all' | 'baju' | 'aksesoris'
  const [activeMerchItem, setActiveMerchItem] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)

  // Sort upcoming events
  const upcomingEvents = useMemo(() => {
    return (events || [])
      .filter(e => !e.is_past)
      .sort((a, b) => (a.tanggal || 0) - (b.tanggal || 0))
  }, [events])

  // Automatically select first event if none selected
  const activeEvent = useMemo(() => {
    if (selectedEventId) {
      return upcomingEvents.find(e => e.id === selectedEventId) || upcomingEvents[0] || null
    }
    return upcomingEvents[0] || null
  }, [upcomingEvents, selectedEventId])

  // Filtered Merch items
  const filteredMerch = useMemo(() => {
    if (!merchandise) return []
    if (merchCategory === 'all') return merchandise
    return merchandise.filter(m => (m.kategori || '').toLowerCase() === merchCategory)
  }, [merchandise, merchCategory])

  const handleOpenMerchModal = (item) => {
    setActiveMerchItem(item)
    setSelectedSize(item.sizes && item.sizes.length > 0 ? item.sizes[0] : '')
    setQuantity(1)
  }

  const handleAddMerchToCart = () => {
    if (!activeMerchItem) return
    if (activeMerchItem.sizes && activeMerchItem.sizes.length > 0 && !selectedSize) {
      kohiToast.error('Silakan pilih ukuran terlebih dahulu.')
      return
    }

    addToCart({
      id: `${activeMerchItem.id}-${selectedSize || 'all'}`,
      merchId: activeMerchItem.id,
      nama: activeMerchItem.nama,
      harga: activeMerchItem.harga,
      size: selectedSize || null,
      image_url: activeMerchItem.image_url,
      quantity
    })

    kohiToast.success(`${activeMerchItem.nama} ditambahkan ke keranjang!`)
    setActiveMerchItem(null)
  }

  const handleBookCheki = (member = null, isGroup = false) => {
    if (!activeEvent) {
      kohiToast.error('Silakan pilih event panggung terlebih dahulu.')
      return
    }

    const type = isGroup ? 'group' : 'member'
    const memberParam = member ? `&memberId=${member.id}` : ''
    navigate(`/checkout/${activeEvent.id}?type=${type}${memberParam}`)
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[var(--background)] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mb-3" />
        <span className="text-xs font-mono font-bold text-[var(--primary)] tracking-widest uppercase">
          Memuat Katalog Shop...
        </span>
      </div>
    )
  }

  return (
    <MobileAppShell title="Kohi Sekai Shop">
      <div className="space-y-4 pb-12">

        {/* 1. Unified Brand Segmented Tab Switch */}
        <div className="flex rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('cheki')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all tap-active ${
              activeTab === 'cheki'
                ? 'bg-[var(--primary)] text-[var(--background)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FaTicketAlt size={13} />
            <span>Tiket 2-Shot</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('merch')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all tap-active ${
              activeTab === 'merch'
                ? 'bg-[var(--primary)] text-[var(--background)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FaBox size={13} />
            <span>Merchandise</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: TIKET 2-SHOT CHEKI                                            */}
        {/* ==================================================================== */}
        {activeTab === 'cheki' && (
          <div className="space-y-5">
            
            {/* Event Selector List */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                1. Pilih Jadwal Panggung
              </span>

              {upcomingEvents.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center text-xs text-[var(--text-secondary)]">
                  Belum ada jadwal panggung yang dibuka saat ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingEvents.map((evt) => {
                    const isSelected = activeEvent?.id === evt.id
                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEventId(evt.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer tap-active ${
                          isSelected
                            ? 'bg-[var(--surface)] border-[var(--primary)] ring-1 ring-[var(--primary)] shadow-md'
                            : 'bg-[var(--surface)] border-[var(--border)] opacity-85'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Date Badge */}
                          <div
                            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[var(--primary)] text-[var(--background)] font-black'
                                : 'bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]'
                            }`}
                          >
                            <span className="text-base font-black font-mono leading-none">
                              {evt.tanggal}
                            </span>
                            <span className="text-[9px] uppercase font-bold mt-0.5 leading-none">
                              {evt.bulan?.slice(0, 3)}
                            </span>
                          </div>

                          {/* Event Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {evt.is_special ? (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
                                  Special Stage
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[var(--background)] text-[var(--primary)] border border-[var(--border)] uppercase">
                                  Live Stage
                                </span>
                              )}
                            </div>
                            <h3 className="text-xs font-black text-[var(--text-primary)] truncate">
                              {evt.nama_event}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] mt-1">
                              <FaMapMarkerAlt className="text-[var(--primary)] shrink-0 text-[10px]" />
                              <span className="truncate">{evt.lokasi || 'Venue Yogyakarta'}</span>
                            </div>
                          </div>

                          {/* Selection Check Icon */}
                          <div className="shrink-0">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                                isSelected
                                  ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--background)]'
                                  : 'border-[var(--border)] bg-[var(--background)] text-transparent'
                              }`}
                            >
                              <FaCheck size={10} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Lineup Member 2-Shot Selection */}
            {activeEvent && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                    2. Pilih Idol Favorit (2-Shot Cheki)
                  </span>
                  <span className="text-[10px] text-[var(--primary)] font-bold">
                    {members.length} Member Tersedia
                  </span>
                </div>

                <div className="space-y-2.5">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3 flex items-center gap-3.5 shadow-sm tap-active"
                    >
                      {/* Member Photo */}
                      <img
                        src={member.shop_image_url || member.image_url || '/images/members/placeholder.svg'}
                        alt={member.nama}
                        className="w-14 h-14 rounded-xl object-cover object-top border border-[var(--border)] bg-[var(--background)] shrink-0"
                        loading="lazy"
                      />

                      {/* Member Details */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-mono font-bold text-[var(--primary)] uppercase">
                          {member.member_id || 'IDOL'}
                        </span>
                        <h4 className="text-xs font-black text-[var(--text-primary)] leading-tight truncate">
                          {member.nama}
                        </h4>
                        <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                          {member.catchphrase || 'Kohi Sekai Idol Member'}
                        </p>
                        <div className="mt-1">
                          <span className="text-xs font-black font-mono text-[var(--primary)]">
                            Rp {(member.cheki_price || 40000).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-[var(--text-secondary)] ml-1">/ sesi</span>
                        </div>
                      </div>

                      {/* Action CTA Button */}
                      <button
                        type="button"
                        onClick={() => handleBookCheki(member, false)}
                        className="touch-target py-2 px-3 rounded-xl bg-[var(--primary)] text-[var(--background)] font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shrink-0 tap-active shadow-sm"
                      >
                        <span>Pesan</span>
                        <FaChevronRight size={10} />
                      </button>
                    </div>
                  ))}

                  {/* Group Cheki Option */}
                  {groupMember && (
                    <div className="bg-[var(--surface)] border border-[var(--primary)] rounded-2xl p-3 flex items-center gap-3.5 shadow-sm tap-active">
                      <div className="w-14 h-14 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0">
                        <FaUsers size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-mono font-bold text-[var(--primary)] uppercase">
                          ALL MEMBER
                        </span>
                        <h4 className="text-xs font-black text-[var(--text-primary)] leading-tight truncate">
                          {groupMember.nama || 'Group Cheki (All Member)'}
                        </h4>
                        <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                          Foto polaroid bersama seluruh member Kohi Sekai
                        </p>
                        <div className="mt-1">
                          <span className="text-xs font-black font-mono text-[var(--primary)]">
                            Rp {(groupMember.cheki_price || 120000).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBookCheki(groupMember, true)}
                        className="touch-target py-2 px-3 rounded-xl bg-[var(--primary)] text-[var(--background)] font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shrink-0 tap-active shadow-sm"
                      >
                        <span>Pesan</span>
                        <FaChevronRight size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: MERCHANDISE OFFICIAL                                          */}
        {/* ==================================================================== */}
        {activeTab === 'merch' && (
          <div className="space-y-4">
            
            {/* Category Filter Chips (Neutral tokens) */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
              {[
                { id: 'all', label: 'Semua Merchandise' },
                { id: 'baju', label: 'Apparel & Jersey' },
                { id: 'aksesoris', label: 'Aksesoris' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setMerchCategory(cat.id)}
                  className={`touch-target py-2 px-3 rounded-xl text-xs font-bold shrink-0 transition-colors tap-active ${
                    merchCategory === cat.id
                      ? 'bg-[var(--primary)] text-[var(--background)]'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Merch Items List */}
            {filteredMerch.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center text-xs text-[var(--text-secondary)]">
                Belum ada produk merchandise pada kategori ini.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredMerch.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenMerchModal(item)}
                    className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-2.5 flex flex-col justify-between shadow-sm cursor-pointer tap-active"
                  >
                    <div>
                      {/* Product Thumbnail */}
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-[var(--background)] border border-[var(--border)] mb-2 relative">
                        <img
                          src={item.image_url || '/images/merch/placeholder.svg'}
                          alt={item.nama}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {item.stok <= 5 && item.stok > 0 && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[var(--danger)] text-white font-mono text-[8px] font-bold">
                            Sisa {item.stok}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-2 leading-snug">
                        {item.nama}
                      </h4>
                      <p className="text-[11px] font-black font-mono text-[var(--primary)] mt-1">
                        Rp {Number(item.harga || 0).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenMerchModal(item)
                      }}
                      className="w-full mt-2.5 py-2 px-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--primary)] font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 tap-active hover:bg-[var(--primary)] hover:text-[var(--background)]"
                    >
                      <FaPlus size={9} />
                      <span>Beli / Pilih</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Floating Cart Checkout Summary Bar (if items exist in cart) */}
            {totalItems > 0 && (
              <div
                onClick={() => navigate('/merch-checkout')}
                className="fixed bottom-20 left-4 right-4 z-30 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--primary)] shadow-2xl flex items-center justify-between tap-active cursor-pointer animate-slide-up"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-[var(--background)] flex items-center justify-center font-bold">
                    <FaShoppingBag size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-[var(--text-secondary)]">
                      Keranjang Belanja ({totalItems} Item)
                    </span>
                    <p className="text-sm font-black font-mono text-[var(--primary)] leading-tight">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-black text-[var(--primary)] uppercase tracking-wider">
                  <span>Checkout</span>
                  <FaChevronRight size={10} />
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Merch Detail & Size Selector Bottom Sheet */}
      <MobileBottomSheet
        isOpen={Boolean(activeMerchItem)}
        onClose={() => setActiveMerchItem(null)}
        title={activeMerchItem?.nama}
        subtitle={`Rp ${Number(activeMerchItem?.harga || 0).toLocaleString('id-ID')}`}
        footer={
          <button
            type="button"
            onClick={handleAddMerchToCart}
            className="w-full touch-target py-3.5 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md"
          >
            <FaShoppingBag size={14} />
            <span>Tambah ke Keranjang</span>
          </button>
        }
      >
        {activeMerchItem && (
          <div className="space-y-4">
            <div className="w-full h-48 rounded-2xl overflow-hidden bg-[var(--background)] border border-[var(--border)]">
              <img
                src={activeMerchItem.image_url || '/images/merch/placeholder.svg'}
                alt={activeMerchItem.nama}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {activeMerchItem.deskripsi || 'Official merchandise resmi Kohi Sekai.'}
            </p>

            {/* Size Selector (if applicable) */}
            {activeMerchItem.sizes && activeMerchItem.sizes.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Pilih Ukuran:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {activeMerchItem.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[44px] h-10 px-3 rounded-xl text-xs font-mono font-bold border transition-colors tap-active ${
                        selectedSize === s
                          ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--background)]'
                          : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between py-2 border-t border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Jumlah Pesanan:
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] tap-active"
                >
                  <FaMinus size={11} />
                </button>
                <span className="text-sm font-bold font-mono text-[var(--text-primary)] w-6 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] tap-active"
                >
                  <FaPlus size={11} />
                </button>
              </div>
            </div>

          </div>
        )}
      </MobileBottomSheet>

    </MobileAppShell>
  )
}

export default KSShopPageMobile
