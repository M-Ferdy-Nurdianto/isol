import React, { useState, useEffect, useRef, useCallback } from 'react'
import Swal from 'sweetalert2'
import { FaTimes, FaPlus, FaMinus, FaCheckCircle, FaMoneyBillWave, FaQrcode, FaUsers, FaChevronUp, FaChevronDown, FaSearch, FaUserCheck, FaUser, FaTimesCircle, FaLandmark, FaImage } from 'react-icons/fa'
import api from '../../../lib/api'
import { formatMemberName } from '../../../lib/memberUtils'
import CustomSelect from './CustomSelect'

const OTSOrderInlineForm = ({
  members = [],
  events = [],
  onClose,
  onSuccess,
  onCartChange,
  hargaOtsPerMember = 25000,
  hargaOtsGrup = 30000,
  hargaChekiGrupOts = 0,
  mode = 'admin', // 'admin' | 'user'
  regularChekiEnabled = true,
  wideChekiEnabled = false,
  chekiGrupEnabled = false,
  fanUser = null, // user object when mode='user'
  paymentEnableCash = true,
  paymentEnableQris = true,
  paymentEnableTf = false,
}) => {
  const validEvents = events.filter(event => {
    if (event.is_special) return false
    if (event.is_past) return false
    const months = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 }
    const eventDate = new Date(event.tahun, months[event.bulan] || 0, event.tanggal)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return eventDate >= today
  })

  const defaultPayment = (() => {
    if (paymentEnableCash) return 'Cash'
    if (paymentEnableQris) return 'QR'
    if (paymentEnableTf) return 'Transfer'
    return 'Cash'
  })()

  const [formData, setFormData] = useState({
    nama_lengkap: mode === 'user' && fanUser ? fanUser.nama : '',
    user_id: mode === 'user' && fanUser ? fanUser.id : undefined,
    event_id: validEvents.length > 0 ? validEvents[0].id : '',
    payment_method: defaultPayment,
    items: []
  })
  const [submitting, setSubmitting] = useState(false)
  const [cartExpanded, setCartExpanded] = useState(false)

  // ── Fan account search state ───────────────────────────────────────────────
  const [fanSearchQuery, setFanSearchQuery] = useState('')
  const [fanSearchResults, setFanSearchResults] = useState([])
  const [fanSearchLoading, setFanSearchLoading] = useState(false)
  const [selectedFan, setSelectedFan] = useState(null)
  const [showFanDropdown, setShowFanDropdown] = useState(false)
  const fanSearchRef = useRef(null)
  const fanDropdownRef = useRef(null)
  const fanSearchDebounce = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        fanDropdownRef.current && !fanDropdownRef.current.contains(e.target) &&
        fanSearchRef.current && !fanSearchRef.current.contains(e.target)
      ) {
        setShowFanDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced fan search
  const handleFanSearch = useCallback((query) => {
    setFanSearchQuery(query)
    if (fanSearchDebounce.current) clearTimeout(fanSearchDebounce.current)
    if (query.length < 2) {
      setFanSearchResults([])
      setShowFanDropdown(false)
      return
    }
    fanSearchDebounce.current = setTimeout(async () => {
      setFanSearchLoading(true)
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`)
        setFanSearchResults(res.data?.data || [])
        setShowFanDropdown(true)
      } catch {
        setFanSearchResults([])
      } finally {
        setFanSearchLoading(false)
      }
    }, 300)
  }, [])

  // Select a fan from search results
  const handleSelectFan = (fan) => {
    setSelectedFan(fan)
    setFormData(prev => ({ ...prev, nama_lengkap: fan.nama, user_id: fan.id }))
    setFanSearchQuery('')
    setFanSearchResults([])
    setShowFanDropdown(false)
  }

  // Clear selected fan
  const handleClearFan = () => {
    setSelectedFan(null)
    setFormData(prev => ({ ...prev, nama_lengkap: '', user_id: undefined }))
  }
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (onCartChange) {
      onCartChange(formData.items.length)
    }
  }, [formData.items.length, onCartChange])

  const selectedEvent = events.find(e => e.id === formData.event_id)

  const activeMembersInLineup = members.filter(member => {
    if (member.hadir === false) return false
    const isGroup = member.member_id === 'group' || member.member_id === 'kohisekai' || member.nama_panggung?.toLowerCase().includes('kohi')
    if (isGroup) return true
    if (selectedEvent && selectedEvent.event_lineup && selectedEvent.event_lineup.length > 0) {
      const allowedIds = selectedEvent.event_lineup.map(l => String(l.member_id || l.members?.id || l.members?.member_id))
      const memberIdStr = String(member.id)
      const memberSlugStr = String(member.member_id || '')
      return allowedIds.includes(memberIdStr) || allowedIds.includes(memberSlugStr)
    }
    return true
  })

  const groupMember = activeMembersInLineup.find(
    m => m.member_id === 'group' || m.member_id === 'kohisekai' || m.nama_panggung?.toLowerCase().includes('kohi')
  )
  const individualMembers = activeMembersInLineup.filter(
    m => !(m.member_id === 'group' || m.member_id === 'kohisekai' || m.nama_panggung?.toLowerCase().includes('kohi'))
  )

  // addItem now accepts chekiType: 'regular' | 'wide' | 'grup'
  const addItem = (member, chekiType = 'regular') => {
    const isGrupCard = chekiType === 'grup'
    let price = 0
    let displayName = ''

    if (chekiType === 'regular') {
      price = parseInt(hargaOtsPerMember, 10)
      displayName = `Regular Cheki ${formatMemberName(member.nama_panggung)}`
    } else if (chekiType === 'wide') {
      price = parseInt(hargaOtsGrup, 10)
      displayName = `Wide Cheki (16:9) ${formatMemberName(member.nama_panggung)}`
    } else if (chekiType === 'grup') {
      price = parseInt(hargaChekiGrupOts, 10)
      displayName = 'Cheki Grup (Semua Member)'
    }

    // Key is combination of member_id + cheki_type (same member can have regular & wide separately)
    const keyMember = isGrupCard ? 'grup' : member.id
    const existingIndex = formData.items.findIndex(
      item => item.member_id === keyMember && (item.cheki_type || 'regular') === chekiType
    )
    if (existingIndex > -1) {
      const updated = [...formData.items]
      updated[existingIndex].quantity += 1
      setFormData({ ...formData, items: updated })
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, {
          member_id: keyMember,
          cheki_type: chekiType,
          name: displayName,
          price,
          quantity: 1
        }]
      })
    }
  }

  const updateQuantity = (index, delta) => {
    const updated = [...formData.items]
    const newQty = updated[index].quantity + delta
    if (newQty <= 0) {
      removeItem(index)
    } else {
      updated[index].quantity = newQty
      setFormData({ ...formData, items: updated })
    }
  }

  const removeItem = (index) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.event_id) {
      Swal.fire({ icon: 'warning', title: 'Pilih Event', text: 'Silakan tentukan event terlebih dahulu.', confirmButtonColor: '#E8944A' })
      return
    }
    if (formData.items.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Belum Ada Item', text: 'Pilih minimal satu tiket cheki member.', confirmButtonColor: '#E8944A' })
      return
    }
    if (!formData.nama_lengkap || formData.nama_lengkap.trim() === '') {
      Swal.fire({ icon: 'warning', title: 'Nama Pembeli', text: 'Nama pembeli wajib diisi.', confirmButtonColor: '#E8944A' })
      return
    }

    setSubmitting(true)
    try {
      const payload = { ...formData }
      if (mode === 'user' && fanUser) {
        // Force user_id dan nama dari token fan (server akan validasi juga)
        payload.user_id = fanUser.id
        payload.nama_lengkap = fanUser.nama
      }

      const endpoint = mode === 'user' ? '/orders/ots-user' : '/orders/ots'
      await api.post(endpoint, payload)

      const title = mode === 'user' ? 'Order OTS Diajukan!' : 'Order OTS Berhasil!'
      const textMsg = mode === 'user'
        ? `Order untuk ${payload.nama_lengkap} berhasil diajukan. Silakan tunggu konfirmasi admin di venue.`
        : `Order untuk ${payload.nama_lengkap} berhasil disimpan.`

      Swal.fire({
        icon: 'success',
        title,
        text: textMsg,
        timer: 2200,
        showConfirmButton: false
      })
      setFormData(prev => ({
        ...prev,
        nama_lengkap: mode === 'user' && fanUser ? fanUser.nama : '',
        items: [],
        user_id: mode === 'user' && fanUser ? fanUser.id : undefined,
        payment_method: defaultPayment
      }))
      setCartExpanded(false)
      setSelectedFan(null)
      if (onSuccess) onSuccess()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.error || error.message, confirmButtonColor: '#E8944A' })
    } finally {
      setSubmitting(false)
    }
  }

  const totalPrice = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalQty = formData.items.reduce((sum, item) => sum + item.quantity, 0)

  const eventOptions = [
    { value: '', label: '-- Pilih Event OTS --' },
    ...validEvents.map(event => ({ value: event.id, label: `${event.nama} (${event.tanggal} ${event.bulan} ${event.tahun})` }))
  ]

  // Dipakai di 2 tempat (desktop sidebar & mobile expanded sheet) â€” hindari duplikasi JSX
  const CartItemsList = () => (
    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
      {formData.items.map((item, idx) => (
        <div key={idx} className="flex justify-between items-center bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1.5 rounded-lg text-xs">
          <div className="truncate max-w-[140px]">
            <div className="text-[var(--text-primary)] font-semibold truncate">{item.name}</div>
            <div className="text-[10px] text-[var(--primary)]">Rp {item.price.toLocaleString('id-ID')}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 flex items-center justify-center bg-[var(--border)] hover:bg-[var(--primary)]/20 text-[var(--text-secondary)] rounded">
              <FaMinus className="text-[9px]" />
            </button>
            <span className="font-bold text-[var(--text-primary)] text-xs px-1">{item.quantity}</span>
            <button type="button" onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 flex items-center justify-center bg-[var(--border)] hover:bg-[var(--primary)]/20 text-[var(--text-secondary)] rounded">
              <FaPlus className="text-[9px]" />
            </button>
            <button type="button" onClick={() => removeItem(idx)} className="ml-1 text-red-400 hover:text-red-300 p-1" title="Hapus">
              <FaTimes className="text-xs" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const MemberGrid = () => (
    <div className="bg-[var(--background)] border border-[var(--border)] p-4 rounded-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-xs text-[var(--text-secondary)] flex items-center gap-2">
          <FaUsers className="text-[var(--primary)]" /> Lineup member hadir ({individualMembers.length})
        </h4>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] font-mono flex-wrap justify-end">
          {regularChekiEnabled && <span>Regular: Rp {parseInt(hargaOtsPerMember, 10).toLocaleString('id-ID')}</span>}
          {regularChekiEnabled && wideChekiEnabled && <span className="opacity-40">·</span>}
          {wideChekiEnabled && <span>Wide: Rp {parseInt(hargaOtsGrup, 10).toLocaleString('id-ID')}</span>}
        </div>
      </div>

      <div className="space-y-3">
        {/* ═══ CHEKI GRUP (SEMUA MEMBER) — hanya jika enabled ═══════ */}
        {chekiGrupEnabled && (() => {
          const grupPrice = parseInt(hargaChekiGrupOts, 10)
          const selectedItem = formData.items.find(i => i.member_id === 'grup' && (i.cheki_type || 'grup') === 'grup')
          const selectedCount = selectedItem ? selectedItem.quantity : 0

          return (
            <div className="space-y-1.5 pb-2 mb-1 border-b border-[var(--border)]">
              <div className="flex items-center justify-between text-[10px] font-bold text-purple-400/90 px-1">
                <span>Cheki Grup (Semua Member)</span>
                <span>1x foto semua member</span>
              </div>
              <button
                type="button"
                onClick={() => addItem(groupMember || { id: 'grup' }, 'grup')}
                className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between relative overflow-hidden group ${
                  selectedCount > 0
                    ? 'bg-purple-500/15 border-purple-400 text-[var(--text-primary)] shadow-[0_0_15px_rgba(192,132,252,0.2)] ring-1 ring-purple-400/40'
                    : 'bg-[var(--background)] border-[var(--border)] hover:border-purple-400/60 hover:bg-purple-500/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                    selectedCount > 0
                      ? 'bg-purple-400 text-white border-purple-400 font-black'
                      : 'bg-purple-400/20 text-purple-300 border-purple-400/40 group-hover:bg-purple-400 group-hover:text-white'
                  }`}>
                    <FaUsers className="text-base" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-[var(--text-primary)] tracking-wide">Cheki Grup — Semua Member</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-400/15 text-purple-300 text-[10px] font-bold border border-purple-400/30">
                        Semua member
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">1x foto polaroid bersama seluruh member yang hadir</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-[var(--text-secondary)] block font-medium">Tarif OTS</span>
                    <span className="text-sm font-black text-purple-300">Rp {grupPrice.toLocaleString('id-ID')}</span>
                  </div>
                  {selectedCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-lg bg-purple-400 text-white text-xs font-black">
                      {selectedCount}x
                    </span>
                  ) : (
                    <span className="w-7 h-7 rounded-lg bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-purple-300 group-hover:bg-purple-400/15 text-xs">
                      <FaPlus />
                    </span>
                  )}
                </div>
              </button>
            </div>
          )
        })()}

        {/* ═══ MEMBER INDIVIDUAL: Regular + Wide per member ═══════ */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-secondary)] px-1">
            <span>Member individual ({individualMembers.length})</span>
          </div>

          {individualMembers.length === 0 ? (
            <div className="p-6 rounded-xl bg-[var(--border)] border border-[var(--border)] text-center text-[var(--text-secondary)] text-xs">
              Belum ada member individual aktif yang terdaftar di lineup event ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {individualMembers.map((member) => {
                const regularPrice = parseInt(hargaOtsPerMember, 10)
                const widePrice = parseInt(hargaOtsGrup, 10)
                const selectedRegular = formData.items.find(i => i.member_id === member.id && (i.cheki_type || 'regular') === 'regular')
                const selectedWide = formData.items.find(i => i.member_id === member.id && (i.cheki_type || 'wide') === 'wide')
                const countRegular = selectedRegular ? selectedRegular.quantity : 0
                const countWide = selectedWide ? selectedWide.quantity : 0
                const totalThisMember = countRegular + countWide

                return (
                  <div
                    key={member.id}
                    className={`relative p-3 rounded-xl border transition-all flex flex-col gap-2 min-h-[110px] ${
                      totalThisMember > 0
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-[0_0_10px_rgba(232,148,74,0.2)] ring-1 ring-[var(--primary)]/30'
                        : 'bg-[var(--background)] border-[var(--border)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {formatMemberName(member.nama_panggung)}
                      </span>
                      {totalThisMember > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[var(--primary)] text-[var(--text-primary)] text-[10px] font-black shrink-0">
                          {totalThisMember}x
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      {regularChekiEnabled && (
                        <button
                          type="button"
                          onClick={() => addItem(member, 'regular')}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all group ${
                            countRegular > 0
                              ? 'bg-[var(--primary)]/20 border-[var(--primary)]/60'
                              : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/10'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FaImage className={`text-[10px] shrink-0 ${countRegular > 0 ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`} />
                            <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">Regular (2-Shot)</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-[var(--primary)]">
                              Rp {regularPrice.toLocaleString('id-ID')}
                            </span>
                            {countRegular > 0 ? (
                              <span className="px-1.5 py-0.5 rounded bg-[var(--primary)] text-[var(--text-primary)] text-[9px] font-black">
                                {countRegular}×
                              </span>
                            ) : (
                              <FaPlus className="text-[10px] text-[var(--text-secondary)] group-hover:text-[var(--primary)]" />
                            )}
                          </div>
                        </button>
                      )}
                      {wideChekiEnabled && (
                        <button
                          type="button"
                          onClick={() => addItem(member, 'wide')}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all group ${
                            countWide > 0
                              ? 'bg-amber-500/20 border-amber-400/60'
                              : 'bg-[var(--surface)] border-[var(--border)] hover:border-amber-400/50 hover:bg-amber-500/10'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FaImage className={`text-[10px] shrink-0 ${countWide > 0 ? 'text-amber-400' : 'text-[var(--text-secondary)]'}`} />
                            <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">Wide (Polaroid 16:9)</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-amber-400">
                              Rp {widePrice.toLocaleString('id-ID')}
                            </span>
                            {countWide > 0 ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-[var(--text-primary)] text-[9px] font-black">
                                {countWide}×
                              </span>
                            ) : (
                              <FaPlus className="text-[10px] text-[var(--text-secondary)] group-hover:text-amber-400" />
                            )}
                          </div>
                        </button>
                      )}
                      {!regularChekiEnabled && !wideChekiEnabled && (
                        <p className="text-[10px] text-center text-[var(--text-secondary)] py-1.5">
                          Semua tipe cheki nonaktif
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    // pb-24 di mobile = ruang aman untuk floating cart bar + bottom navbar; md:pb-0 supaya tidak nambah spasi di desktop
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 md:p-6 shadow-xl animate-fade-in relative pb-24 md:pb-6">
      {/* Header â€” compact 1 baris teratur di mobile (< md), 1 baris di desktop (â‰¥ md) */}
      <div className="pb-4 mb-5 border-b border-[var(--border)]">
        {/* Mobile Header (< md) */}
        <div className="md:hidden flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse shrink-0"></span>
            <h3 className="text-base font-black text-[var(--text-primary)] truncate">Order OTS</h3>
            {totalQty > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 text-xs font-bold font-mono shrink-0">
                {totalQty} items
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Form OTS"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--border)] hover:bg-[var(--primary)]/15 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition shrink-0 active:scale-95"
            title="Tutup Form OTS"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Desktop Header (â‰¥ md) */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse shrink-0"></span>
              <h3 className="text-lg font-black text-[var(--text-primary)]">
                Form Order OTS <span className="text-[var(--primary)] font-mono text-sm">(On The Spot)</span>
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Input pemesanan tiket 2-Shot langsung di tempat venue tanpa modal popup.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-[var(--border)] hover:bg-[var(--primary)]/15 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] text-xs font-bold transition flex items-center gap-2 shrink-0"
            title="Tutup Form OTS"
          >
            <FaTimes /> Tutup Form OTS
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ============ MOBILE: 1 kolom, member grid duluan ============ */}
        <div className="lg:hidden space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
              Event aktif <span className="text-red-400">*</span>
            </label>
            <CustomSelect options={eventOptions} value={formData.event_id} onChange={(e) => setFormData({ ...formData, event_id: e.target.value })} className="w-full" />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
              Nama pembeli / fan <span className="text-red-400">*</span>
            </label>
            {/* Mode USER: nama readonly dari akun */}
            {mode === 'user' && fanUser ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[var(--primary)]/10 border border-[var(--primary)]/50 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center shrink-0">
                  <FaUserCheck className="text-[var(--primary)] text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{fanUser.nama}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">Akunmu · Fan #{fanUser.fan_code || '-'}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-[var(--primary)]/15 text-[var(--primary)] text-[10px] font-bold border border-[var(--primary)]/30">
                  Otomatis
                </span>
              </div>
            ) : selectedFan ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[var(--primary)]/10 border border-[var(--primary)]/50 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center shrink-0">
                  <FaUserCheck className="text-[var(--primary)] text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{selectedFan.nama}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">Fan #{selectedFan.fan_code}{selectedFan.whatsapp ? ` · ${selectedFan.whatsapp}` : ''}</p>
                </div>
                <button type="button" onClick={handleClearFan} className="text-[var(--text-secondary)] hover:text-red-400 transition shrink-0 p-1" title="Ganti akun">
                  <FaTimesCircle className="text-sm" />
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative" ref={fanSearchRef}>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none">
                    {fanSearchLoading ? (
                      <span className="w-3 h-3 border border-[var(--primary)] border-t-transparent rounded-full animate-spin block" />
                    ) : (
                      <FaSearch className="text-xs" />
                    )}
                  </span>
                  <input
                    type="text"
                    placeholder="Cari akun fan (nama/Fan ID)..."
                    value={fanSearchQuery}
                    onChange={(e) => handleFanSearch(e.target.value)}
                    onFocus={() => fanSearchResults.length > 0 && setShowFanDropdown(true)}
                    className="w-full pl-8 pr-3 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl placeholder-[var(--text-secondary)]/50 focus:border-[var(--primary)] focus:outline-none transition"
                  />
                  {showFanDropdown && fanSearchResults.length > 0 && (
                    <div ref={fanDropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto">
                      {fanSearchResults.map((fan) => (
                        <button
                          key={fan.id}
                          type="button"
                          onClick={() => handleSelectFan(fan)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--primary)]/10 transition text-left border-b border-[var(--border)] last:border-0"
                        >
                          <div className="w-7 h-7 rounded-full bg-[var(--border)] flex items-center justify-center shrink-0 text-[var(--text-secondary)]">
                            <FaUser className="text-[10px]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">{fan.nama}</p>
                            <p className="text-[10px] text-[var(--text-secondary)] truncate">
                              Fan #{fan.fan_code}{fan.whatsapp ? ` · ${fan.whatsapp}` : ''}
                            </p>
                          </div>
                          <span className="text-[10px] text-[var(--primary)] font-bold shrink-0">Pilih</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showFanDropdown && !fanSearchLoading && fanSearchQuery.length >= 2 && fanSearchResults.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 px-3 py-2.5 text-xs text-[var(--text-secondary)]">
                      Akun tidak ditemukan.
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] px-0.5">Atau ketik nama langsung jika fan belum punya akun:</p>
                <input
                  type="text"
                  placeholder="Contoh: Kiki"
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-xl placeholder-[var(--text-secondary)]/50 focus:border-[var(--primary)] focus:outline-none transition"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* ============ DESKTOP: 2 kolom seperti sebelumnya ============ */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Event aktif <span className="text-red-400">*</span>
              </label>
              <CustomSelect options={eventOptions} value={formData.event_id} onChange={(e) => setFormData({ ...formData, event_id: e.target.value })} className="w-full" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Nama pembeli / fan <span className="text-red-400">*</span>
            </label>
              {/* Mode USER: nama readonly dari akun */}
              {mode === 'user' && fanUser ? (
                <div className="flex items-center gap-2 px-3.5 py-3 bg-[var(--primary)]/10 border border-[var(--primary)]/50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center shrink-0">
                    <FaUserCheck className="text-[var(--primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{fanUser.nama}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">Akunmu · Fan #{fanUser.fan_code || '-'}{fanUser.whatsapp ? ` · ${fanUser.whatsapp}` : ''}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-[var(--primary)]/15 text-[var(--primary)] text-[11px] font-bold border border-[var(--primary)]/30">
                    Otomatis dari akun
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Contoh: Kiki"
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  className="w-full px-3.5 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-base rounded-xl placeholder-[var(--text-secondary)]/50 focus:border-[var(--primary)] focus:outline-none transition"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Metode pembayaran</label>
              <div className={`grid gap-2.5 ${
                (paymentEnableCash ? 1 : 0) + (paymentEnableQris ? 1 : 0) + (paymentEnableTf ? 1 : 0) <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {paymentEnableCash && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: 'Cash' })}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                      formData.payment_method === 'Cash' ? 'bg-[var(--primary)] text-[var(--text-primary)] border-[var(--primary)] shadow-[0_2px_8px_rgba(232,148,74,0.3)]' : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/40'
                    }`}
                  >
                    <FaMoneyBillWave /> Cash / Tunai
                  </button>
                )}
                {paymentEnableQris && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: 'QR' })}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                      formData.payment_method === 'QR' ? 'bg-[var(--primary)] text-[var(--text-primary)] border-[var(--primary)] shadow-[0_2px_8px_rgba(232,148,74,0.3)]' : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/40'
                    }`}
                  >
                    <FaQrcode /> QRIS
                  </button>
                )}
                {paymentEnableTf && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: 'Transfer' })}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                      formData.payment_method === 'Transfer' ? 'bg-[var(--primary)] text-[var(--text-primary)] border-[var(--primary)] shadow-[0_2px_8px_rgba(232,148,74,0.3)]' : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/40'
                    }`}
                  >
                    <FaLandmark /> Transfer
                  </button>
                )}
              </div>
            </div>

            <div className="bg-[var(--background)] border border-[var(--border)] p-3.5 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)]">
                <span>Pesanan ({totalQty} tiket)</span>
                {formData.items.length > 0 && (
                  <button type="button" onClick={() => setFormData({ ...formData, items: [] })} className="text-[10px] text-red-400 hover:underline font-semibold">
                    Kosongkan
                  </button>
                )}
              </div>

              {formData.items.length === 0 ? (
                <p className="text-[11px] text-[var(--text-secondary)] py-3 text-center">Pilih member lineup di bawah untuk menambahkan tiket</p>
              ) : (
                <CartItemsList />
              )}

              <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center">
                <span className="text-xs text-[var(--text-secondary)]">Total Tagihan:</span>
                <span className="text-base font-black text-[var(--primary)]">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>

              <button
                type="submit"
                disabled={submitting || formData.items.length === 0}
                className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-[var(--text-primary)] rounded-xl text-xs font-bold transition shadow-[0_2px_10px_rgba(232,148,74,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaCheckCircle />
                {submitting ? 'Menyimpan...' : 'Simpan Order OTS'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <MemberGrid />
          </div>
        </div>
      </form>

      {/* ============ MOBILE: floating cart bar ============ */}
      {formData.items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
          {/* Expanded sheet â€” daftar item + kosongkan, muncul di atas bar ringkas */}
          {cartExpanded && (
            <div className="bg-[var(--surface)] border-t border-x border-[var(--border)] rounded-t-2xl p-4 shadow-[0_-8px_20px_rgba(26,21,18,0.8)] max-h-[50vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-[var(--text-secondary)]">Pesanan ({totalQty} tiket)</span>
                <button type="button" onClick={() => setFormData({ ...formData, items: [] })} className="text-[10px] text-red-400 hover:underline font-semibold">
                  Kosongkan
                </button>
              </div>
              <CartItemsList />
            </div>
          )}

          {/* Bar ringkas â€” flush bottom-0 mengisi posisi bottom navbar secara eksklusif */}
          <button
            type="button"
            onClick={() => setCartExpanded(prev => !prev)}
            className={`w-full bg-[var(--surface)] backdrop-blur-xl border-t border-[var(--border)] px-4 py-3 flex items-center justify-between shadow-[0_-4px_24px_rgba(0,0,0,0.6)] ${cartExpanded ? '' : 'rounded-t-2xl'}`}
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-7 h-7 rounded-lg bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)]">
                {cartExpanded ? <FaChevronDown className="text-xs" /> : <FaChevronUp className="text-xs" />}
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)]">{totalQty} tiket Â· Rp {totalPrice.toLocaleString('id-ID')}</div>
                <div className="text-[10px] text-[var(--text-secondary)]">Tap untuk detail item</div>
              </div>
            </div>
            <span
              onClick={(e) => { e.stopPropagation(); handleSubmit(e) }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                submitting ? 'bg-[var(--primary)]/50 text-white' : 'bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-[var(--text-primary)] shadow-[0_2px_8px_rgba(232,148,74,0.3)]'
              }`}
            >
              <FaCheckCircle />
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

export default OTSOrderInlineForm



