import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { FaTimes, FaPlus, FaMinus, FaUsers, FaChevronUp, FaChevronDown } from 'react-icons/fa'
import api from '../../../lib/api'
import { formatMemberName } from '../../../lib/memberUtils'
import CustomSelect from './CustomSelect'
import AccountSearchInput from '../../../components/common/AccountSearchInput'

const OTSSpecialInlineForm = ({
  members = [],
  events = [],
  onClose,
  onSuccess,
  onCartChange,
  hargaOtsPerMember = 25000,
  defaultEventId = ''
}) => {
  // Hanya event spesial yang aktif dan fitur OTS-nya diaktifkan oleh admin
  const validSpecialEvents = events.filter(event => {
    const isSpecial = event.is_special || event.type === 'special'
    if (!isSpecial) return false
    if (event.is_past) return false
    return Boolean(event.ots_enabled)
  })

  // Tentukan default selected event
  const initialEventId = () => {
    if (defaultEventId && validSpecialEvents.some(e => String(e.id) === String(defaultEventId))) {
      return defaultEventId
    }
    return validSpecialEvents.length > 0 ? validSpecialEvents[0].id : ''
  }

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    whatsapp: '',
    email: '',
    instagram: '',
    user_id: null,
    event_id: initialEventId(),
    payment_method: 'Cash',
    items: []
  })
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [cartExpanded, setCartExpanded] = useState(false)

  const handleSelectAccount = (account) => {
    setSelectedAccount(account)
    setFormData(prev => ({
      ...prev,
      nama_lengkap: account.nama || '',
      whatsapp: account.whatsapp && account.whatsapp !== '-' ? account.whatsapp : '',
      email: account.email || '',
      instagram: account.instagram && account.instagram !== '-' ? account.instagram : '',
      user_id: account.id || null
    }))
  }

  const handleClearAccount = () => {
    setSelectedAccount(null)
    setFormData(prev => ({
      ...prev,
      nama_lengkap: '',
      whatsapp: '',
      email: '',
      instagram: '',
      user_id: null
    }))
  }

  // Update default event id jika props berubah
  useEffect(() => {
    if (defaultEventId && validSpecialEvents.some(e => String(e.id) === String(defaultEventId))) {
      setFormData(prev => ({ ...prev, event_id: defaultEventId }))
    } else if (!formData.event_id && validSpecialEvents.length > 0) {
      setFormData(prev => ({ ...prev, event_id: validSpecialEvents[0].id }))
    }
  }, [defaultEventId, validSpecialEvents.length])

  useEffect(() => {
    if (onCartChange) {
      onCartChange(formData.items.length)
    }
  }, [formData.items.length, onCartChange])

  const selectedEvent = events.find(e => String(e.id) === String(formData.event_id))

  // Harga OTS khusus event spesial jika diset, atau fallback ke default OTS
  const specialOtsPrice = selectedEvent?.harga_cheki_ots
    ? parseInt(selectedEvent.harga_cheki_ots, 10)
    : parseInt(hargaOtsPerMember, 10)

  // Saring member: HANYA yang terdaftar di lineup event spesial yang dipilih
  const lineupMemberIds = (selectedEvent?.event_lineup || []).map(l =>
    String(l.member_id || l.members?.id || '')
  )

  const activeLineupMembers = members.filter(member => {
    if (member.hadir === false) return false
    if (member.member_id === 'group' || member.member_id === 'refreshbreeze') return false
    const memberIdStr = String(member.id)
    const memberSlugStr = String(member.member_id || '')
    return lineupMemberIds.includes(memberIdStr) || lineupMemberIds.includes(memberSlugStr)
  }).sort((a, b) => (a.order_index ?? 99) - (b.order_index ?? 99))

  const addItem = (member) => {
    const price = specialOtsPrice
    const displayName = `Cheki ${formatMemberName(member.nama_panggung)}`

    const existingIndex = formData.items.findIndex(item => item.member_id === member.id)
    if (existingIndex > -1) {
      const updated = [...formData.items]
      updated[existingIndex].quantity += 1
      setFormData({ ...formData, items: updated })
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, { member_id: member.id, name: displayName, price, quantity: 1 }]
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
      Swal.fire({
        icon: 'warning',
        title: 'Pilih Event Spesial',
        text: 'Silakan pilih event spesial yang aktif terlebih dahulu.',
        confirmButtonColor: '#ec4899'
      })
      return
    }
    if (!formData.nama_lengkap || !formData.nama_lengkap.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nama Pembeli Diperlukan',
        text: 'Pilih akun fan atau ketik nama pembeli terlebih dahulu.',
        confirmButtonColor: '#ec4899'
      })
      return
    }
    if (formData.items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Belum Ada Item',
        text: 'Pilih minimal satu tiket cheki dari lineup member.',
        confirmButtonColor: '#ec4899'
      })
      return
    }

    setSubmitting(true)
    try {
      await api.post('/orders/ots', formData)
      Swal.fire({
        icon: 'success',
        title: 'Order OTS Spesial Berhasil!',
        text: `Order untuk ${formData.nama_lengkap} berhasil disimpan.`,
        timer: 1800,
        showConfirmButton: false
      })
      setFormData(prev => ({
        ...prev,
        nama_lengkap: '',
        whatsapp: '',
        email: '',
        instagram: '',
        user_id: null,
        items: []
      }))
      setSelectedAccount(null)
      setCartExpanded(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: error.response?.data?.error || error.message,
        confirmButtonColor: '#ec4899'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const totalPrice = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalQty = formData.items.reduce((sum, item) => sum + item.quantity, 0)

  const eventOptions = [
    { value: '', label: '-- Pilih Event Spesial (OTS Aktif) --' },
    ...validSpecialEvents.map(event => ({
      value: event.id,
      label: `${event.nama} - ${event.theme_name || 'Spesial'} (${event.tanggal} ${event.bulan} ${event.tahun})`
    }))
  ]

  // Keranjang List
  const CartItemsList = () => (
    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
      {formData.items.map((item, idx) => (
        <div key={idx} className="flex justify-between items-center bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1.5 rounded-lg text-xs">
          <div className="truncate max-w-[140px]">
            <div className="text-[var(--text-primary)] font-semibold truncate">{item.name}</div>
            <div className="text-[10px] text-pink-400">Rp {item.price.toLocaleString('id-ID')}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 flex items-center justify-center bg-[var(--border)] hover:bg-[var(--primary)]/15 text-[var(--text-secondary)] rounded">
              <FaMinus className="text-[9px]" />
            </button>
            <span className="font-bold text-[var(--text-primary)] text-xs px-1">{item.quantity}</span>
            <button type="button" onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 flex items-center justify-center bg-[var(--border)] hover:bg-[var(--primary)]/15 text-[var(--text-secondary)] rounded">
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

  // Lineup Grid
  const MemberGrid = () => (
    <div className="bg-[var(--background)] border border-pink-500/20 p-4 rounded-xl flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="font-bold text-xs text-pink-200 flex items-center gap-2">
          <FaUsers className="text-pink-400" /> Lineup Member Spesial ({activeLineupMembers.length})
        </h4>
        <div className="flex items-center gap-2">
          {selectedEvent?.theme_name && (
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-[var(--text-primary)] shadow-sm"
              style={{ backgroundColor: selectedEvent.theme_color || '#ec4899' }}
            >
              {selectedEvent.theme_name}
            </span>
          )}
          <span className="text-[11px] text-pink-300 font-mono font-bold bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/20">
            Rp {specialOtsPrice.toLocaleString('id-ID')} / Tiket
          </span>
        </div>
      </div>

      {activeLineupMembers.length === 0 ? (
        <div className="p-6 rounded-xl bg-pink-500/5 border border-pink-500/10 text-center text-[var(--text-secondary)] text-xs space-y-1">
          <p className="font-semibold text-pink-300">Belum ada lineup member untuk event ini.</p>
          <p className="text-[11px]">Silakan buka tab Events dan tambahkan member ke dalam lineup event spesial ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {activeLineupMembers.map((member) => {
            const price = specialOtsPrice
            const selectedItem = formData.items.find(i => i.member_id === member.id)
            const selectedCount = selectedItem ? selectedItem.quantity : 0

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => addItem(member)}
                className={`relative p-3 rounded-xl border transition-all text-left flex flex-col justify-between min-h-[84px] group ${
                  selectedCount > 0
                    ? 'bg-pink-500/15 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] ring-1 ring-pink-400/50'
                    : 'bg-[var(--background)] border-[var(--border)] hover:border-pink-500/60 hover:bg-pink-500/5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-pink-100">
                      {formatMemberName(member.nama_panggung)}
                    </span>
                    {selectedCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-pink-500 text-[var(--text-primary)] text-[10px] font-black shrink-0 shadow-[0_0_8px_rgba(236,72,153,0.6)]">
                        {selectedCount}x
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">Tiket Cheki Spesial</span>
                </div>
                <div className="text-[11px] font-bold text-pink-400 mt-2 flex items-center justify-between">
                  <span>Rp {price.toLocaleString('id-ID')}</span>
                  <span className="text-[9px] text-[var(--text-secondary)] group-hover:text-pink-300 font-normal">+ Tambah</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  // Jika tidak ada event spesial yang fitur OTS-nya diaktifkan
  if (validSpecialEvents.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-pink-500/30 rounded-2xl p-6 shadow-xl animate-fade-in relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_#ec4899] shrink-0"></span>
            <h3 className="text-lg font-black text-[var(--text-primary)]">Order OTS Event Spesial</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--border)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Tutup"
          >
            <FaTimes />
          </button>
        </div>

        <div className="bg-pink-500/10 border border-pink-500/20 p-5 rounded-xl text-center space-y-2">
          <p className="text-sm font-bold text-pink-300">Belum Ada Event Spesial dengan OTS Aktif</p>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Order OTS spesial harus diaktifkan secara manual. Buka menu <strong className="text-[var(--text-primary)]">Events</strong> &gt; Edit Event Spesial &gt; Centang checkbox <strong className="text-pink-300">"Aktifkan Order OTS Spesial"</strong> di bagian bawah form.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] border border-pink-500/30 rounded-2xl p-5 md:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.6)] animate-fade-in relative pb-24 md:pb-6">
      {/* Header */}
      <div className="pb-4 mb-5 border-b border-[var(--border)]">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_#ec4899] shrink-0"></span>
            <h3 className="text-base font-black text-[var(--text-primary)] truncate">Order OTS Spesial</h3>
            {totalQty > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 text-xs font-bold font-mono shrink-0">
                {totalQty} items
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--border)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition shrink-0 active:scale-95"
            title="Tutup Form OTS Spesial"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_#ec4899] shrink-0"></span>
              <h3 className="text-lg font-black text-[var(--text-primary)]">
                Form Order OTS Spesial <span className="text-pink-400 font-mono text-sm">(Lineup Khusus)</span>
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Input pemesanan tiket 2-Shot On The Spot khusus event spesial sesuai lineup yang ditentukan.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-[var(--border)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition flex items-center gap-2 shrink-0 active:scale-95"
            title="Tutup Form OTS Spesial"
          >
            <FaTimes /> Tutup Form OTS Spesial
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
              Event Spesial <span className="text-pink-400">*</span>
            </label>
            <CustomSelect
              options={eventOptions}
              value={formData.event_id}
              onChange={(e) => setFormData({ ...formData, event_id: e.target.value, items: [] })}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[var(--text-secondary)]">
                Akun / Nama Pembeli <span className="text-pink-400">*</span>
              </label>
              <span className="text-[10px] text-[var(--text-secondary)]">Cari ID/Nama</span>
            </div>
            <AccountSearchInput
              selectedAccount={selectedAccount}
              onSelectAccount={handleSelectAccount}
              onClearAccount={handleClearAccount}
              manualName={formData.nama_lengkap}
              onManualNameChange={(name) => setFormData(prev => ({ ...prev, nama_lengkap: name, user_id: null }))}
              placeholder="Cari ID Fan (misal: 0002) atau Nama..."
              autoFocus={true}
            />
          </div>

          <MemberGrid />

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: 'Cash' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  formData.payment_method === 'Cash'
                    ? 'bg-pink-500 text-[var(--text-primary)] border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                    : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border)]'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: 'QR Code' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  formData.payment_method === 'QR Code'
                    ? 'bg-pink-500 text-[var(--text-primary)] border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                    : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border)]'
                }`}
              >
                QR Code
              </button>
            </div>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                  Event Spesial <span className="text-pink-400">*</span>
                </label>
                <CustomSelect
                  options={eventOptions}
                  value={formData.event_id}
                  onChange={(e) => setFormData({ ...formData, event_id: e.target.value, items: [] })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">
                    Akun / Nama Pembeli <span className="text-pink-400">*</span>
                  </label>
                  <span className="text-[10px] text-[var(--text-secondary)]">Cari ID/Nama</span>
                </div>
                <AccountSearchInput
                  selectedAccount={selectedAccount}
                  onSelectAccount={handleSelectAccount}
                  onClearAccount={handleClearAccount}
                  manualName={formData.nama_lengkap}
                  onManualNameChange={(name) => setFormData(prev => ({ ...prev, nama_lengkap: name, user_id: null }))}
                  placeholder="Cari ID Fan (misal: 0002) atau Nama..."
                  autoFocus={true}
                />
              </div>
            </div>

            <MemberGrid />
          </div>

          {/* Desktop Summary Sidebar */}
          <div className="col-span-4 bg-[var(--background)] border border-[var(--border)] p-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <span>Ringkasan Order</span>
                <span className="text-pink-400 font-mono">{totalQty} Tiket</span>
              </h4>

              {formData.items.length === 0 ? (
                <div className="py-8 text-center text-[var(--text-secondary)] text-xs">
                  Pilih member dari lineup di sebelah kiri untuk menambahkan pesanan.
                </div>
              ) : (
                <CartItemsList />
              )}

              <div className="pt-2 border-t border-[var(--border)]">
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: 'Cash' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      formData.payment_method === 'Cash'
                        ? 'bg-pink-500 text-[var(--text-primary)] border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                        : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border)]'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: 'QR Code' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      formData.payment_method === 'QR Code'
                        ? 'bg-pink-500 text-[var(--text-primary)] border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                        : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border)]'
                    }`}
                  >
                    QR Code
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)] space-y-3 mt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-[var(--text-secondary)]">Total Tagihan</span>
                <span className="text-lg font-black text-pink-400 font-mono">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting || formData.items.length === 0}
                className="w-full py-3 rounded-xl font-bold text-xs text-[var(--text-primary)] bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[0_0_20px_rgba(236,72,153,0.4)] active:scale-95"
              >
                {submitting ? 'Memproses Order...' : 'Simpan Order OTS Spesial'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Floating Cart Bar */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-[var(--surface)] border-t border-pink-500/30 p-3 backdrop-blur-xl shadow-2xl">
          {cartExpanded && (
            <div className="mb-3 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">Item yang Dipilih ({totalQty})</span>
                <button
                  type="button"
                  onClick={() => setCartExpanded(false)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Tutup
                </button>
              </div>
              <CartItemsList />
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCartExpanded(prev => !prev)}
              className="flex items-center gap-2 text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 text-xs font-bold">
                {totalQty}
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                  Total {cartExpanded ? <FaChevronDown className="text-[8px]" /> : <FaChevronUp className="text-[8px]" />}
                </div>
                <div className="text-sm font-black text-pink-400 font-mono">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </div>
              </div>
            </button>

            <button
              type="submit"
              disabled={submitting || formData.items.length === 0}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-[var(--text-primary)] bg-pink-500 hover:bg-pink-600 disabled:opacity-50 transition shadow-[0_0_15px_rgba(236,72,153,0.4)] active:scale-95"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Order OTS'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default OTSSpecialInlineForm

