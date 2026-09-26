import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { FaTimes, FaPlus, FaMinus, FaCheckCircle, FaMoneyBillWave, FaQrcode, FaUsers, FaChevronUp, FaChevronDown } from 'react-icons/fa'
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
  hargaOtsGrup = 30000
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

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    event_id: validEvents.length > 0 ? validEvents[0].id : '',
    payment_method: 'Cash',
    items: []
  })
  const [submitting, setSubmitting] = useState(false)
  const [cartExpanded, setCartExpanded] = useState(false)

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

  const addItem = (member) => {
    const isGroup = member.member_id === 'group' || member.member_id === 'kohisekai' || member.nama_panggung?.toLowerCase().includes('kohi')
    const price = parseInt(isGroup ? hargaOtsGrup : hargaOtsPerMember, 10)
    const displayName = isGroup ? 'Cheki All Member (Grup)' : `Cheki ${formatMemberName(member.nama_panggung)}`

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
      Swal.fire({ icon: 'warning', title: 'Pilih Event', text: 'Silakan tentukan event terlebih dahulu.', confirmButtonColor: '#079108' })
      return
    }
    if (formData.items.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Belum Ada Item', text: 'Pilih minimal satu tiket cheki member.', confirmButtonColor: '#079108' })
      return
    }

    setSubmitting(true)
    try {
      await api.post('/orders/ots', formData)
      Swal.fire({
        icon: 'success',
        title: 'Order OTS Berhasil!',
        text: `Order untuk ${formData.nama_lengkap} berhasil disimpan.`,
        timer: 1800,
        showConfirmButton: false
      })
      setFormData(prev => ({ ...prev, nama_lengkap: '', items: [] }))
      setCartExpanded(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.error || error.message, confirmButtonColor: '#079108' })
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
        <div key={idx} className="flex justify-between items-center bg-[#111726] border border-white/5 px-2.5 py-1.5 rounded-lg text-xs">
          <div className="truncate max-w-[140px]">
            <div className="text-white font-semibold truncate">{item.name}</div>
            <div className="text-[10px] text-[#079108]">Rp {item.price.toLocaleString('id-ID')}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 text-zinc-300 rounded">
              <FaMinus className="text-[9px]" />
            </button>
            <span className="font-bold text-white text-xs px-1">{item.quantity}</span>
            <button type="button" onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 text-zinc-300 rounded">
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
    <div className="bg-[#182032]/40 border border-white/10 p-4 rounded-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-xs text-zinc-300 flex items-center gap-2">
          <FaUsers className="text-[#079108]" /> Lineup member hadir ({individualMembers.length + (groupMember ? 1 : 0)})
        </h4>
        <span className="text-[11px] text-zinc-400 font-mono">
          Rp {parseInt(hargaOtsPerMember, 10).toLocaleString('id-ID')} / 2-Shot
        </span>
      </div>

      <div className="space-y-3">
        {groupMember && (() => {
          const groupPrice = parseInt(hargaOtsGrup, 10)
          const selectedItem = formData.items.find(i => i.member_id === groupMember.id)
          const selectedCount = selectedItem ? selectedItem.quantity : 0

          return (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-400/90 px-1">
                <span>Cheki spesial grup</span>
                <span>Semua member</span>
              </div>
              <button
                type="button"
                onClick={() => addItem(groupMember)}
                className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between relative overflow-hidden group ${
                  selectedCount > 0
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                    : 'bg-gradient-to-r from-amber-500/10 via-[#182032] to-[#182032] border-amber-500/30 hover:border-amber-400/70 hover:bg-amber-500/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                    selectedCount > 0
                      ? 'bg-amber-500 text-black border-amber-300 font-black shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 group-hover:bg-amber-500 group-hover:text-black'
                  }`}>
                    <FaUsers className="text-base" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white tracking-wide">Kohi Sekai (Grup)</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                        Semua member
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">1x Cheki 2-Shot bersama seluruh member yang hadir</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-zinc-400 block font-medium">Tarif OTS</span>
                    <span className="text-sm font-black text-amber-300">Rp {groupPrice.toLocaleString('id-ID')}</span>
                  </div>
                  {selectedCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-black text-xs font-black shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                      {selectedCount}x
                    </span>
                  ) : (
                    <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-white/10 text-xs">
                      <FaPlus />
                    </span>
                  )}
                </div>
              </button>
            </div>
          )
        })()}

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 px-1">
            <span>Member individual ({individualMembers.length})</span>
            <span>Rp {parseInt(hargaOtsPerMember, 10).toLocaleString('id-ID')} / member</span>
          </div>

          {individualMembers.length === 0 ? (
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center text-zinc-500 text-xs">
              Belum ada member individual aktif yang terdaftar di lineup event ini.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {individualMembers.map((member) => {
                const price = parseInt(hargaOtsPerMember, 10)
                const selectedItem = formData.items.find(i => i.member_id === member.id)
                const selectedCount = selectedItem ? selectedItem.quantity : 0

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => addItem(member)}
                    className={`relative p-3 rounded-xl border transition-all text-left flex flex-col justify-between min-h-[84px] group ${
                      selectedCount > 0
                        ? 'bg-[#079108]/10 border-[#079108] shadow-[0_0_15px_rgba(7,145,8,0.25)] ring-1 ring-[#079108]/40'
                        : 'bg-[#182032] border-white/10 hover:border-[#079108]/60 hover:bg-[#079108]/5'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate group-hover:text-zinc-100">
                          {formatMemberName(member.nama_panggung)}
                        </span>
                        {selectedCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#079108] text-white text-[10px] font-black shrink-0 shadow-[0_0_8px_rgba(7,145,8,0.5)]">
                            {selectedCount}x
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">2-Shot Cheki</span>
                    </div>
                    <div className="text-[11px] font-bold text-[#079108] mt-2 flex items-center justify-between">
                      <span>Rp {price.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] text-zinc-500 group-hover:text-zinc-300 font-normal">+ Tambah</span>
                    </div>
                  </button>
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
    <div className="bg-[#111726]/95 border border-[#079108]/30 rounded-2xl p-5 md:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.6)] animate-fade-in relative pb-24 md:pb-6">
      {/* Header â€” compact 1 baris teratur di mobile (< md), 1 baris di desktop (â‰¥ md) */}
      <div className="pb-4 mb-5 border-b border-white/10">
        {/* Mobile Header (< md) */}
        <div className="md:hidden flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#079108] animate-pulse shadow-[0_0_8px_#079108] shrink-0"></span>
            <h3 className="text-base font-black text-white truncate">Order OTS</h3>
            {totalQty > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#079108]/20 text-[#079108] border border-[#079108]/30 text-xs font-bold font-mono shrink-0">
                {totalQty} items
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Form OTS"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition shrink-0 active:scale-95"
            title="Tutup Form OTS"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Desktop Header (â‰¥ md) */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#079108] animate-pulse shadow-[0_0_8px_#079108] shrink-0"></span>
              <h3 className="text-lg font-black text-white">
                Form Order OTS <span className="text-[#079108] font-mono text-sm">(On The Spot)</span>
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Input pemesanan tiket 2-Shot langsung di tempat venue tanpa modal popup.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-bold transition flex items-center gap-2 shrink-0"
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
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Event aktif <span className="text-red-400">*</span>
            </label>
            <CustomSelect options={eventOptions} value={formData.event_id} onChange={(e) => setFormData({ ...formData, event_id: e.target.value })} className="w-full" />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Nama pembeli / fan <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Kiki"
              value={formData.nama_lengkap}
              onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
              className="w-full px-3.5 py-3 bg-[#182032] border border-white/10 text-white text-base rounded-xl placeholder-zinc-500 focus:border-[#079108] focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">Metode pembayaran</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: 'Cash' })}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                  formData.payment_method === 'Cash' ? 'bg-[#079108] text-white border-[#079108] shadow-[0_0_12px_rgba(7,145,8,0.4)]' : 'bg-[#182032] text-zinc-400 border-white/10 hover:border-white/20'
                }`}
              >
                <FaMoneyBillWave /> Cash / Tunai
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: 'QR' })}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                  formData.payment_method === 'QR' ? 'bg-[#079108] text-white border-[#079108] shadow-[0_0_12px_rgba(7,145,8,0.4)]' : 'bg-[#182032] text-zinc-400 border-white/10 hover:border-white/20'
                }`}
              >
                <FaQrcode /> QRIS
              </button>
            </div>
          </div>

          <MemberGrid />
        </div>

        {/* ============ DESKTOP: 2 kolom seperti sebelumnya ============ */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Event aktif <span className="text-red-400">*</span>
              </label>
              <CustomSelect options={eventOptions} value={formData.event_id} onChange={(e) => setFormData({ ...formData, event_id: e.target.value })} className="w-full" />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Nama pembeli / fan <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Kiki"
                value={formData.nama_lengkap}
                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                className="w-full px-3.5 py-3 bg-[#182032] border border-white/10 text-white text-base rounded-xl placeholder-zinc-500 focus:border-[#079108] focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Metode pembayaran</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_method: 'Cash' })}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                    formData.payment_method === 'Cash' ? 'bg-[#079108] text-white border-[#079108] shadow-[0_0_12px_rgba(7,145,8,0.4)]' : 'bg-[#182032] text-zinc-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  <FaMoneyBillWave /> Cash / Tunai
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_method: 'QR' })}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                    formData.payment_method === 'QR' ? 'bg-[#079108] text-white border-[#079108] shadow-[0_0_12px_rgba(7,145,8,0.4)]' : 'bg-[#182032] text-zinc-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  <FaQrcode /> QRIS
                </button>
              </div>
            </div>

            <div className="bg-[#182032]/80 border border-white/10 p-3.5 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
                <span>Pesanan ({totalQty} tiket)</span>
                {formData.items.length > 0 && (
                  <button type="button" onClick={() => setFormData({ ...formData, items: [] })} className="text-[10px] text-red-400 hover:underline font-semibold">
                    Kosongkan
                  </button>
                )}
              </div>

              {formData.items.length === 0 ? (
                <p className="text-[11px] text-zinc-500 py-3 text-center">Pilih member lineup di bawah untuk menambahkan tiket</p>
              ) : (
                <CartItemsList />
              )}

              <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-zinc-400">Total Tagihan:</span>
                <span className="text-base font-black text-[#079108]">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>

              <button
                type="submit"
                disabled={submitting || formData.items.length === 0}
                className="w-full py-3 bg-[#079108] hover:bg-[#067a07] text-white rounded-xl text-xs font-bold transition shadow-[0_0_15px_rgba(7,145,8,0.3)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <div className="bg-[#111726]/98 backdrop-blur-xl border-t border-x border-white/10 rounded-t-2xl p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.7)] max-h-[50vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-zinc-300">Pesanan ({totalQty} tiket)</span>
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
            className={`w-full bg-[#0c111d]/98 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center justify-between shadow-[0_-4px_24px_rgba(0,0,0,0.6)] ${cartExpanded ? '' : 'rounded-t-2xl'}`}
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                {cartExpanded ? <FaChevronDown className="text-xs" /> : <FaChevronUp className="text-xs" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{totalQty} tiket Â· Rp {totalPrice.toLocaleString('id-ID')}</div>
                <div className="text-[10px] text-zinc-400">Tap untuk detail item</div>
              </div>
            </div>
            <span
              onClick={(e) => { e.stopPropagation(); handleSubmit(e) }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                submitting ? 'bg-[#079108]/50 text-white' : 'bg-[#079108] hover:bg-[#067a07] text-white shadow-[0_0_12px_rgba(7,145,8,0.4)]'
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
