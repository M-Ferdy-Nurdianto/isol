import React, { useState } from 'react'
import { webAlert } from '../../../lib/webAlert'
import {
  FaTimes,
  FaPlus,
  FaMinus,
  FaTrash,
  FaStore,
  FaTruck,
  FaBox,
  FaWhatsapp,
  FaInstagram,
  FaMapMarkerAlt,
  FaArrowLeft
} from 'react-icons/fa'
import api from '../../../lib/api'
import CustomSelect from './CustomSelect'

const ManualMerchOrderModal = ({
  isOpen,
  onClose,
  merch = [],
  onSuccess
}) => {
  // State form
  const [namaLengkap, setNamaLengkap] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [status, setStatus] = useState('paid') // 'paid' | 'pending' | 'completed'
  const [deliveryMethod, setDeliveryMethod] = useState('pickup_event') // 'pickup_event' | 'shipping'
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingCity, setShippingCity] = useState('')
  const [shippingPostalCode, setShippingPostalCode] = useState('')
  const [shippingCourier, setShippingCourier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [catatan, setCatatan] = useState('')

  // State keranjang item
  const [cartItems, setCartItems] = useState([])
  const [selectedSizes, setSelectedSizes] = useState({}) // { [merchId]: 'M' }
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  // Tambah item ke keranjang
  const handleAddItem = (item) => {
    const hasSizes = Array.isArray(item.sizes) && item.sizes.length > 0
    const chosenSize = hasSizes ? (selectedSizes[item.id] || item.sizes[0]) : null
    const key = chosenSize ? `${item.id}_${chosenSize}` : item.id

    const existingIndex = cartItems.findIndex(i => i.key === key)
    if (existingIndex > -1) {
      const updated = [...cartItems]
      updated[existingIndex].quantity += 1
      setCartItems(updated)
    } else {
      setCartItems([
        ...cartItems,
        {
          key,
          merchandise_id: item.id,
          nama: item.nama,
          harga: Number(item.harga) || 0,
          quantity: 1,
          size: chosenSize,
          stok: item.stok
        }
      ])
    }
  }

  // Update kuantitas item
  const handleUpdateQty = (key, delta) => {
    setCartItems(prev => {
      return prev
        .map(item => {
          if (item.key === key) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean)
    })
  }

  // Hapus item
  const handleRemoveItem = (key) => {
    setCartItems(prev => prev.filter(item => item.key !== key))
  }

  // Hitung total harga & total item
  const totalItemsCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0)
  const totalPrice = cartItems.reduce((acc, curr) => acc + curr.harga * curr.quantity, 0)

  // Submit order merch
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!namaLengkap.trim()) {
      webAlert.warning('Nama Pembeli Wajib', 'Silakan isi nama pembeli merchandise.')
      return
    }

    if (cartItems.length === 0) {
      webAlert.warning('Keranjang Kosong', 'Pilih minimal satu item merchandise untuk dimasukkan ke order.')
      return
    }

    if (deliveryMethod === 'shipping') {
      if (!shippingAddress.trim() || shippingAddress.trim().length < 5) {
        webAlert.warning('Alamat Belum Lengkap', 'Harap masukkan alamat pengiriman minimal 5 karakter.')
        return
      }
      if (!shippingCity.trim() || shippingCity.trim().length < 2) {
        webAlert.warning('Kota Belum Diisi', 'Harap masukkan nama kota / kabupaten pengiriman.')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = {
        nama_lengkap: namaLengkap.trim(),
        whatsapp: whatsapp.trim() || '-',
        instagram: instagram.trim() || null,
        status,
        delivery_method: deliveryMethod,
        shipping_address: deliveryMethod === 'shipping' ? shippingAddress.trim() : null,
        shipping_city: deliveryMethod === 'shipping' ? shippingCity.trim() : null,
        shipping_postal_code: deliveryMethod === 'shipping' && shippingPostalCode ? shippingPostalCode.trim() : null,
        shipping_courier: deliveryMethod === 'shipping' && shippingCourier ? shippingCourier.trim() : null,
        tracking_number: deliveryMethod === 'shipping' && trackingNumber ? trackingNumber.trim() : null,
        catatan: catatan.trim() || null,
        items: cartItems.map(i => ({
          merchandise_id: i.merchandise_id,
          nama: i.nama,
          harga: i.harga,
          quantity: i.quantity,
          size: i.size || null
        }))
      }

      await api.post('/merch-orders', payload)

      webAlert.success('Order Merch Berhasil!', `Pesanan atas nama ${payload.nama_lengkap} berhasil disimpan ke database.`)

      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating merch order:', error)
      webAlert.error('Gagal Menyimpan Order', error.response?.data?.error || error.message || 'Terjadi kesalahan pada server.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DESKTOP FULLSCREEN OVERLAY MODAL (hidden md:flex)     */}
      {/* Tanpa Pindah Halaman, Full Viewport, Fixed Header/Footer */}
      {/* ======================================================== */}
      <div className="fixed inset-0 z-50 hidden md:flex flex-col bg-[var(--background)] animate-fade-in overflow-hidden">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-full w-full overflow-hidden"
        >
          {/* Header Modal Bar */}
          <div className="px-8 py-4 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] rounded-xl transition mr-1"
                title="Kembali"
              >
                <FaArrowLeft size={15} />
              </button>
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] text-lg shrink-0">
                <FaBox />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
                  Input Order Merch
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Tambah pesanan merchandise baru ke dalam database
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--border)] transition ml-1"
              title="Tutup"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Body Content Area (Scrollable Canvas dengan Container max-w-6xl) */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-6xl mx-auto w-full">
              <div className="grid grid-cols-12 gap-8">
              {/* Kolom Kiri: Data Pembeli, Status, Pengiriman (5 Kolom) */}
              <div className="col-span-5 space-y-4">
                {/* Data Pembeli Card */}
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block border-b border-[var(--border)] pb-2">
                    Identitas Pembeli
                  </span>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Nama Lengkap <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={namaLengkap}
                      onChange={e => setNamaLengkap(e.target.value)}
                      placeholder="Nama pembeli / fan..."
                      className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                        No. WhatsApp
                      </label>
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={e => setWhatsapp(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-mono rounded-xl focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                        Instagram <span className="font-normal text-[10px] text-[var(--text-secondary)]">(opsional)</span>
                      </label>
                      <input
                        type="text"
                        value={instagram}
                        onChange={e => setInstagram(e.target.value)}
                        placeholder="@username"
                        className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Status & Metode Pengiriman Card */}
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block border-b border-[var(--border)] pb-2">
                    Status & Pengiriman
                  </span>

                  {/* Status Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Status Pembayaran <span className="text-red-400">*</span>
                    </label>
                    <CustomSelect
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      options={[
                        { value: 'paid', label: 'Lunas / Terverifikasi (Paid)' },
                        { value: 'pending', label: 'Pending (Menunggu Bayar)' },
                        { value: 'completed', label: 'Selesai (Barang Diterima)' }
                      ]}
                    />
                  </div>

                  {/* Metode Pengambilan Toggle */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Metode Penyerahan <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('pickup_event')}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-bold ${
                          deliveryMethod === 'pickup_event'
                            ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <FaStore className="shrink-0" />
                        <div>
                          <div>Ambil di Booth</div>
                          <p className="text-[10px] font-normal text-[var(--text-secondary)]">Venue Event</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('shipping')}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-bold ${
                          deliveryMethod === 'shipping'
                            ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)] ring-1 ring-[var(--primary)]'
                            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <FaTruck className="shrink-0" />
                        <div>
                          <div>Dikirim Alamat</div>
                          <p className="text-[10px] font-normal text-[var(--text-secondary)]">Ekspedisi Kurir</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Form Alamat jika dikirim */}
                  {deliveryMethod === 'shipping' && (
                    <div className="space-y-2.5 pt-2 border-t border-[var(--border)]/60">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                          Alamat Lengkap <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={shippingAddress}
                          onChange={e => setShippingAddress(e.target.value)}
                          placeholder="Jalan, No. rumah, RT/RW, Kecamatan"
                          className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)] resize-none"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                            Kota / Kab <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingCity}
                            onChange={e => setShippingCity(e.target.value)}
                            placeholder="Bandung, Jakarta..."
                            className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                            Kode Pos
                          </label>
                          <input
                            type="text"
                            value={shippingPostalCode}
                            onChange={e => setShippingPostalCode(e.target.value)}
                            placeholder="40135"
                            className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-mono rounded-xl focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                            Kurir
                          </label>
                          <input
                            type="text"
                            value={shippingCourier}
                            onChange={e => setShippingCourier(e.target.value)}
                            placeholder="JNE, J&T"
                            className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                            Nomor Resi
                          </label>
                          <input
                            type="text"
                            value={trackingNumber}
                            onChange={e => setTrackingNumber(e.target.value)}
                            placeholder="Resi"
                            className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-mono rounded-xl focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Catatan */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Catatan / Keterangan Tambahan
                    </label>
                    <textarea
                      rows={2}
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      placeholder="Keterangan transaksi..."
                      className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Katalog Merchandise & Keranjang (7 Kolom) */}
              <div className="col-span-7 space-y-4">
                {/* Keranjang Item Terpilih */}
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider flex items-center gap-1.5">
                      <FaBox size={12} /> Item Terpilih ({totalItemsCount})
                    </span>
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                      Subtotal: Rp {totalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-secondary)] italic border border-dashed border-[var(--border)] rounded-xl">
                      Belum ada merchandise yang dipilih. Klik tombol <span className="text-[var(--primary)] font-bold">+ Tambah</span> pada katalog di bawah.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                      {cartItems.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] p-2.5 rounded-xl text-xs"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="font-bold text-[var(--text-primary)] truncate">{item.nama}</p>
                            <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                              {item.size && (
                                <span className="bg-[var(--background)] px-1.5 py-0.5 rounded border border-[var(--border)] font-bold text-[var(--primary)]">
                                  Size {item.size}
                                </span>
                              )}
                              <span>@ Rp {item.harga.toLocaleString('id-ID')}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center bg-[var(--background)] rounded-lg border border-[var(--border)]">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.key, -1)}
                                className="p-1.5 text-[var(--text-secondary)] hover:text-red-400 transition"
                              >
                                <FaMinus size={9} />
                              </button>
                              <span className="px-2.5 text-xs font-bold font-mono text-[var(--text-primary)]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.key, 1)}
                                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--primary)] transition"
                              >
                                <FaPlus size={9} />
                              </button>
                            </div>

                            <div className="text-right w-20">
                              <span className="font-mono font-bold text-[var(--primary)] text-xs">
                                Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.key)}
                              className="p-1.5 text-[var(--text-secondary)] hover:text-red-400 transition"
                              title="Hapus item"
                            >
                              <FaTrash size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Katalog Merchandise */}
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block border-b border-[var(--border)] pb-2">
                    Katalog Merchandise Aktif
                  </span>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {merch && merch.length > 0 ? (
                      merch
                        .filter(m => m.available !== false)
                        .map((item) => {
                          const hasSizes = Array.isArray(item.sizes) && item.sizes.length > 0
                          const currentChosenSize = selectedSizes[item.id] || (hasSizes ? item.sizes[0] : null)

                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/30 transition"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-3">
                                {item.gambar_url ? (
                                  <img
                                    src={item.gambar_url}
                                    alt={item.nama}
                                    className="w-10 h-10 object-cover rounded-lg border border-[var(--border)] shrink-0"
                                    onError={e => { e.target.src = '/images/members/placeholder.svg' }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                                    <FaBox size={14} />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-xs text-[var(--text-primary)] leading-tight">{item.nama}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-[var(--primary)]">
                                      Rp {Number(item.harga).toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-secondary)]">·</span>
                                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                      item.stok > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                      Stok: {item.stok ?? '∞'}
                                    </span>
                                  </div>

                                  {/* Size Selector jika ada ukuran */}
                                  {hasSizes && (
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">Size:</span>
                                      {item.sizes.map((s) => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() => setSelectedSizes({ ...selectedSizes, [item.id]: s })}
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition border ${
                                            currentChosenSize === s
                                              ? 'bg-[var(--primary)] text-black border-[var(--primary)]'
                                              : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                          }`}
                                        >
                                          {s}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAddItem(item)}
                                disabled={item.stok <= 0}
                                className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-black text-xs font-black hover:bg-[var(--primary)]/90 transition shadow shrink-0 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                              >
                                <FaPlus size={10} /> Tambah
                              </button>
                            </div>
                          )
                        })
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)] italic text-center py-4">
                        Tidak ada data merchandise di database.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Fullscreen Fixed Footer */}
          <div className="px-8 py-4 bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-between shrink-0 shadow-lg">
            <div className="max-w-6xl mx-auto w-full flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Total Tagihan:</span>
                <span className="text-xl font-black text-[var(--primary)] font-mono">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">({totalItemsCount} item terpilih)</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/40 transition active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || cartItems.length === 0}
                  className="px-7 py-2.5 rounded-xl bg-[var(--primary)] text-black text-xs font-black hover:bg-[var(--primary)]/90 transition shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Order Merch'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* 2. MOBILE BOTTOM-SHEET MODAL (md:hidden)                  */}
      {/* Slide up dari bawah, drag bar, tombol submit sticky bawah */}
      {/* ======================================================== */}
      <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/85">
        <div className="absolute inset-0" onClick={onClose} />
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-h-[92vh] bg-[var(--surface)] border-t border-[var(--border)] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-slide-up"
        >
          {/* Drag Handle Bar */}
          <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto my-3 shrink-0" />

          {/* Mobile Sheet Header */}
          <div className="px-5 pb-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FaBox className="text-[var(--primary)] text-sm" />
              <h3 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight">
                Input Order Merch
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--border)] transition"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Mobile Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Input Pembeli */}
            <div className="space-y-2.5 p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                Data Pembeli
              </span>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                  Nama Lengkap <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={e => setNamaLengkap(e.target.value)}
                  placeholder="Nama pembeli..."
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="08xxxx"
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-mono rounded-xl focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    placeholder="@user"
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Item Keranjang Ringkas */}
            <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--primary)] border-b border-[var(--border)] pb-1.5">
                <span>Item Terpilih ({totalItemsCount})</span>
                <span className="font-black">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>

              {cartItems.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] italic py-2 text-center">
                  Belum ada merchandise yang dipilih.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {cartItems.map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-xs py-1">
                      <div className="truncate max-w-[160px]">
                        <span className="text-[var(--text-primary)] font-bold">{item.nama}</span>
                        {item.size && <span className="text-[var(--primary)] ml-1">({item.size})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded">
                          <button type="button" onClick={() => handleUpdateQty(item.key, -1)} className="px-1.5 py-0.5 text-xs text-[var(--text-secondary)]">-</button>
                          <span className="px-1.5 text-xs font-mono font-bold">{item.quantity}</span>
                          <button type="button" onClick={() => handleUpdateQty(item.key, 1)} className="px-1.5 py-0.5 text-xs text-[var(--text-secondary)]">+</button>
                        </div>
                        <span className="font-mono font-bold text-[var(--primary)] text-xs">
                          Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                        </span>
                        <button type="button" onClick={() => handleRemoveItem(item.key)} className="text-red-400 p-1">
                          <FaTrash size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pilihan Merchandise */}
            <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2.5">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                Tambah Merchandise
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {merch && merch.length > 0 ? (
                  merch.filter(m => m.available !== false).map(item => {
                    const hasSizes = Array.isArray(item.sizes) && item.sizes.length > 0
                    const currentChosenSize = selectedSizes[item.id] || (hasSizes ? item.sizes[0] : null)

                    return (
                      <div key={item.id} className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-xs text-[var(--text-primary)] truncate">{item.nama}</p>
                            <span className="text-xs font-bold text-[var(--primary)]">
                              Rp {Number(item.harga).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddItem(item)}
                            disabled={item.stok <= 0}
                            className="px-2.5 py-1 rounded-lg bg-[var(--primary)] text-black text-xs font-black shadow shrink-0 flex items-center gap-1 active:scale-95 disabled:opacity-40"
                          >
                            <FaPlus size={9} /> Tambah
                          </button>
                        </div>

                        {hasSizes && (
                          <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-[var(--border)]/50">
                            {item.sizes.map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setSelectedSizes({ ...selectedSizes, [item.id]: s })}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                  currentChosenSize === s
                                    ? 'bg-[var(--primary)] text-black border-[var(--primary)]'
                                    : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)]'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-[var(--text-secondary)] italic">Tidak ada merchandise.</p>
                )}
              </div>
            </div>

            {/* Metode Penyerahan & Status */}
            <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2.5">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                Penyerahan & Status
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup_event')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
                    deliveryMethod === 'pickup_event'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  Ambil di Booth
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('shipping')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
                    deliveryMethod === 'shipping'
                      ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  Dikirim Ekspedisi
                </button>
              </div>

              {deliveryMethod === 'shipping' && (
                <div className="space-y-2 pt-2 border-t border-[var(--border)]/60">
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Alamat lengkap tujuan..."
                    className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl resize-none"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={shippingCity}
                      onChange={e => setShippingCity(e.target.value)}
                      placeholder="Kota tujuan"
                      className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl"
                      required
                    />
                    <input
                      type="text"
                      value={shippingPostalCode}
                      onChange={e => setShippingPostalCode(e.target.value)}
                      placeholder="Kode pos"
                      className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-mono rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Status Pembayaran</label>
                <CustomSelect
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  options={[
                    { value: 'paid', label: 'Lunas / Terverifikasi (Paid)' },
                    { value: 'pending', label: 'Pending (Menunggu Bayar)' },
                    { value: 'completed', label: 'Selesai (Completed)' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Catatan..."
                  className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="p-4 bg-[var(--background)] border-t border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
            <div>
              <div className="text-[10px] text-[var(--text-secondary)]">Total ({totalItemsCount} item)</div>
              <div className="text-sm font-black text-[var(--primary)]">
                Rp {totalPrice.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] active:scale-95"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || cartItems.length === 0}
                className="px-4 py-2.5 rounded-xl bg-[var(--primary)] text-black text-xs font-black shadow-lg active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

export default ManualMerchOrderModal
