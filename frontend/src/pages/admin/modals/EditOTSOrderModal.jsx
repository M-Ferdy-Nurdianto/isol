import React, { useState, useEffect } from 'react'
import {
  FaTimes,
  FaArrowLeft,
  FaPlus,
  FaMinus,
  FaTrash,
  FaSave,
  FaSpinner,
  FaUser,
  FaMoneyBillWave,
  FaQrcode
} from 'react-icons/fa'
import api from '../../../lib/api'
import { showToast } from '../../../lib/toast'
import { formatMemberName } from '../../../lib/memberUtils'
import CustomSelect from '../components/CustomSelect'

const EditOTSOrderModal = ({
  isOpen = false,
  order,
  members = [],
  events = [],
  hargaOtsPerMember = 40000,
  hargaOtsGrup = 80000,
  hargaChekiGrupOts = 170000,
  regularChekiEnabled = true,
  wideChekiEnabled = true,
  chekiGrupEnabled = false,
  onClose,
  onSuccess
}) => {
  const [namaLengkap, setNamaLengkap] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [catatan, setCatatan] = useState('')
  const [eventId, setEventId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen || !order) return
    setNamaLengkap(order.nama_lengkap || '')
    setWhatsapp(order.whatsapp && order.whatsapp !== '-' ? order.whatsapp : '')
    setInstagram(order.instagram && order.instagram !== '-' ? order.instagram : '')
    setCatatan(order.catatan || '')
    setEventId(order.event_id || '')

    const rawPay = order.payment_proof_url || 'Cash'
    const normalizedPay =
      rawPay.startsWith('data:') || rawPay.startsWith('http')
        ? 'Cash'
        : rawPay === 'QRIS'
          ? 'QR'
          : rawPay
    setPaymentMethod(normalizedPay)

    const initialItems = (order.order_items || []).map((itm) => ({
      member_id: itm.member_id || null,
      cheki_type: itm.cheki_type || 'regular',
      item_name: itm.item_name || 'Cheki Order',
      price: Number(itm.price) || 0,
      quantity: Math.max(1, Number(itm.quantity) || 1)
    }))
    setItems(initialItems)
  }, [isOpen, order])

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !saving) onClose?.()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, saving, onClose])

  if (!isOpen || !order) return null

  const activeMembers = members.filter((m) => m.is_active !== false)
  const priceRegular = Number(hargaOtsPerMember) || 40000
  const priceWide = Number(hargaOtsGrup) || 80000
  const priceGrup = Number(hargaChekiGrupOts) || 170000

  const addChekiItem = (member, type) => {
    const isGrup = type === 'grup'
    const unitPrice = isGrup ? priceGrup : type === 'wide' ? priceWide : priceRegular
    const memberId = isGrup ? null : member.id
    const itemName = isGrup
      ? 'Cheki Grup (Semua Member)'
      : type === 'wide'
        ? `Wide 2-Shot Cheki 16:9 - ${formatMemberName(member.nama_panggung)}`
        : `Regular 2-Shot Cheki - ${formatMemberName(member.nama_panggung)}`

    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.cheki_type === type && String(i.member_id || '') === String(memberId || '')
      )
      if (idx !== -1) {
        return prev.map((i, index) => (index === idx ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [
        ...prev,
        {
          member_id: memberId,
          cheki_type: type,
          item_name: itemName,
          price: unitPrice,
          quantity: 1
        }
      ]
    })
  }

  const updateItemQty = (index, delta) => {
    setItems((prev) =>
      prev
        .map((itm, idx) => (idx === index ? { ...itm, quantity: itm.quantity + delta } : itm))
        .filter((itm) => itm.quantity > 0)
    )
  }

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  const totalHarga = items.reduce((sum, itm) => sum + Number(itm.price) * Number(itm.quantity), 0)

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    if (!namaLengkap.trim()) {
      showToast.error('Nama pembeli wajib diisi.')
      return
    }
    if (items.length === 0) {
      showToast.error('Minimal harus ada 1 item cheki.')
      return
    }

    setSaving(true)
    try {
      const res = await api.put(`/orders/${order.id}/ots`, {
        nama_lengkap: namaLengkap.trim(),
        whatsapp: whatsapp.trim() || '-',
        instagram: instagram.trim() || '-',
        catatan: catatan.trim() || null,
        event_id: eventId || order.event_id,
        payment_method: paymentMethod,
        items
      })
      showToast.success('Order OTS berhasil diperbarui!')
      onSuccess?.(res.data?.data)
      onClose?.()
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Gagal menyimpan perubahan order OTS.')
    } finally {
      setSaving(false)
    }
  }

  const eventOptions = events.map((ev) => ({
    value: ev.id,
    label: `${ev.nama} (${ev.tanggal} ${ev.bulan})`
  }))

  const paymentOptions = [
    { id: 'Cash', label: 'Cash', icon: FaMoneyBillWave },
    { id: 'QR', label: 'QRIS', icon: FaQrcode }
  ]

  const renderBuyerSection = () => (
    <div className="space-y-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--primary)] uppercase tracking-wider">
          <FaUser className="text-xs" />
          <span>Data Pembeli &amp; Pembayaran</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">
              Nama Pembeli <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              placeholder="Nama pembeli"
              className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">
                WhatsApp
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="08..."
                className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">
                Instagram
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@username"
                className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          {eventOptions.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">
                Event
              </label>
              <CustomSelect
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                options={eventOptions}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentOptions.map((opt) => {
                const Icon = opt.icon
                const active = paymentMethod === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-colors ${
                      active
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon className="text-xs" />
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1.5">
              Catatan
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan tambahan (opsional)"
              className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>
      </div>

      {/* Selected Items */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Daftar Cheki ({items.reduce((s, i) => s + i.quantity, 0)} item)
          </span>
          <span className="text-base font-black text-[var(--primary)] tabular-nums">
            Rp {totalHarga.toLocaleString('id-ID')}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--text-secondary)] bg-[var(--background)] border border-[var(--border)] rounded-xl">
            Belum ada item. Pilih member di sebelah untuk menambahkan cheki.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((itm, idx) => (
              <div
                key={`${itm.cheki_type}-${itm.member_id || idx}`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                    {itm.item_name}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] tabular-nums mt-0.5">
                    Rp {Number(itm.price).toLocaleString('id-ID')} / pcs
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateItemQty(idx, -1)}
                    className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--primary)] flex items-center justify-center"
                    title="Kurangi"
                  >
                    <FaMinus className="text-[10px]" />
                  </button>
                  <span className="w-7 text-center text-xs font-black text-[var(--text-primary)] tabular-nums">
                    {itm.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateItemQty(idx, 1)}
                    className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--primary)] flex items-center justify-center"
                    title="Tambah"
                  >
                    <FaPlus className="text-[10px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="w-7 h-7 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/25 text-[var(--danger)] hover:bg-[var(--danger)]/20 flex items-center justify-center ml-1"
                    title="Hapus item"
                  >
                    <FaTrash className="text-[10px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderMemberPickerSection = () => (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 space-y-4">
      <div>
        <h4 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider">
          Tambah / Ubah Item Cheki
        </h4>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Klik tombol di bawah untuk menambah tiket cheki ke pesanan ini.
        </p>
      </div>

      {chekiGrupEnabled && (
        <button
          type="button"
          onClick={() => addChekiItem(null, 'grup')}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors text-left"
        >
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)]">Cheki Grup (Semua Member)</div>
            <div className="text-xs text-[var(--primary)] font-bold tabular-nums">
              Rp {priceGrup.toLocaleString('id-ID')}
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1">
            <FaPlus className="text-[10px]" /> Tambah
          </span>
        </button>
      )}

      <div className="space-y-2.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
        {activeMembers.map((member) => (
          <div
            key={member.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]"
          >
            <div className="font-bold text-sm text-[var(--text-primary)] truncate">
              {formatMemberName(member.nama_panggung)}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {regularChekiEnabled && (
                <button
                  type="button"
                  onClick={() => addChekiItem(member, 'regular')}
                  className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-xs font-bold text-[var(--text-primary)] transition-colors"
                >
                  + Regular (Rp {priceRegular.toLocaleString('id-ID')})
                </button>
              )}
              {wideChekiEnabled && (
                <button
                  type="button"
                  onClick={() => addChekiItem(member, 'wide')}
                  className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-xs font-bold text-[var(--primary)] transition-colors"
                >
                  + Wide (Rp {priceWide.toLocaleString('id-ID')})
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* ── DESKTOP: Fullscreen Overlay (AGENTS.md compliant) ── */}
      <div className="hidden md:flex fixed inset-0 z-50 bg-[var(--background)] flex-col overflow-hidden animate-fade-in">
        {/* Fixed Header */}
        <div className="bg-[var(--surface)] border-b border-[var(--border)] px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Kembali"
            >
              <FaArrowLeft className="text-sm" />
            </button>
            <div>
              <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">
                Edit Order <span className="text-[var(--primary)]">OTS</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Ubah data pembeli, metode bayar, atau item cheki pesanan OTS.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background)] transition-colors"
            title="Tutup"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full p-8 grid grid-cols-2 gap-6 items-start">
            {renderBuyerSection()}
            {renderMemberPickerSection()}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="bg-[var(--surface)] border-t border-[var(--border)] px-8 py-4 flex items-center justify-between shrink-0">
          <div className="text-sm text-[var(--text-secondary)]">
            Total Baru:{' '}
            <span className="text-lg font-black text-[var(--primary)] tabular-nums ml-1">
              Rp {totalHarga.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="px-6 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-white text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE: Bottom-Sheet Drawer (AGENTS.md compliant) ── */}
      <div className="md:hidden fixed inset-0 z-50 bg-black/90" onClick={() => !saving && onClose?.()} />
      <div className="md:hidden fixed inset-x-0 bottom-0 rounded-t-3xl max-h-[92vh] flex flex-col bg-[var(--surface)] border-t border-[var(--border)] shadow-2xl z-50 animate-slide-up">
        {/* Drag Bar & Header */}
        <div className="px-5 pt-3 pb-3 border-b border-[var(--border)] shrink-0">
          <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[var(--text-primary)] uppercase">
              Edit Order <span className="text-[var(--primary)]">OTS</span>
            </h3>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Scrollable 1-Col Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {renderBuyerSection()}
          {renderMemberPickerSection()}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] p-4 flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="flex-[2] py-3 rounded-xl bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default EditOTSOrderModal
