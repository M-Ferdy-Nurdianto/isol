import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { FaTimes, FaCalendarAlt, FaArrowLeft, FaCheck, FaUsers, FaClock, FaMapMarkerAlt } from 'react-icons/fa'
import api from '../../../lib/api'
import { formatMemberName } from '../../../lib/memberUtils'
import { showToast } from '../../../lib/toast'
import CustomSelect from '../components/CustomSelect'

const monthList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const monthOptions = monthShort.map((m, i) => ({ value: monthList[i], label: m }))

const EventModal = ({ members = [], onClose, onSuccess, editingEvent }) => {
  const isEditingSpecial = editingEvent?.is_special === true || editingEvent?.type === 'special'
  const [eventType, setEventType] = useState(isEditingSpecial ? 'special' : 'regular')
  const [formData, setFormData] = useState(() => {
    if (editingEvent) {
      const existingLineup = editingEvent.event_lineup
        ?.filter(el => el.members?.hadir !== false)
        .map(el => el.member_id) || []
      return {
        ...editingEvent,
        lineup: existingLineup,
        is_special: editingEvent.is_special || false,
        theme_name: editingEvent.theme_name || '',
        theme_color: editingEvent.theme_color || '#A855F7'
      }
    }
    return {
      nama: '', tanggal: '', bulan: '', tahun: new Date().getFullYear(),
      lokasi: '', event_time: '', cheki_time: '', is_past: false,
      is_special: false, theme_name: '', theme_color: '#A855F7', lineup: []
    }
  })
  const [submitting, setSubmitting] = useState(false)

  const presetColors = [
    '#A855F7', '#9333EA', '#7E22CE', '#C084FC', '#6B21A8'
  ]

  const currentYear = new Date().getFullYear()
  const currentMonthIdx = new Date().getMonth()
  const availableMonthOptions = (!editingEvent && formData.tahun === currentYear)
    ? monthOptions.filter((_, idx) => idx >= currentMonthIdx)
    : monthOptions

  const toggleMemberInLineup = (memberId) => {
    setFormData(prev => ({
      ...prev,
      lineup: prev.lineup.includes(memberId)
        ? prev.lineup.filter(id => id !== memberId)
        : [...prev.lineup, memberId]
    }))
  }

  const handleSelectAllMembers = () => {
    const allMemberIds = members
      .filter(m => m.member_id !== 'group' && m.hadir !== false)
      .map(m => m.id)
    setFormData(prev => ({ ...prev, lineup: allMemberIds }))
  }

  const handleClearAllMembers = () => {
    setFormData(prev => ({ ...prev, lineup: [] }))
  }

  useEffect(() => {
    setFormData(prev => ({ ...prev, is_special: eventType === 'special' }))
  }, [eventType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingEvent) {
        const payload = {
          nama: formData.nama,
          tanggal: formData.tanggal,
          bulan: formData.bulan,
          tahun: formData.tahun,
          lokasi: formData.lokasi,
          event_time: formData.event_time,
          cheki_time: formData.cheki_time,
          is_past: formData.is_past,
          type: eventType,
          is_special: eventType === 'special',
          theme_name: eventType === 'special' ? formData.theme_name : null,
          theme_color: eventType === 'special' ? formData.theme_color : null,
          lineup: formData.lineup
        }

        await api.patch(`/events/${editingEvent.id}`, payload)
        showToast.success('Event Updated!')
      } else {
        const payload = { 
          ...formData, 
          type: eventType, 
          is_special: eventType === 'special',
          theme_name: eventType === 'special' ? formData.theme_name : null,
          theme_color: eventType === 'special' ? formData.theme_color : null,
          lineup: formData.lineup 
        }
        await api.post('/events', payload)
        showToast.success('Event Created!')
      }
      onSuccess()
    } catch (error) {
      showToast.error(error.response?.data?.error || error.message, 'Gagal')
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
      <div className="fixed inset-0 z-[100] hidden md:flex flex-col bg-[var(--background)] animate-fade-in overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full w-full overflow-hidden">
          {/* Header Modal Bar */}
          <div className="px-8 py-4 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] rounded-xl transition"
                title="Kembali"
              >
                <FaArrowLeft size={15} />
              </button>
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] text-lg shrink-0">
                <FaCalendarAlt />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
                  {editingEvent ? 'Edit Event' : 'Tambah Event Baru'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Kelola jadwal konser, lokasi acara, dan lineup member idol yang hadir
                </p>
              </div>
            </div>

            {/* Toggle Tipe Event */}
            <div className="flex items-center gap-3">
              <div className="flex bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEventType('regular')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    eventType === 'regular'
                      ? 'bg-[var(--primary)] text-black shadow'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Event Regular
                </button>
                <button
                  type="button"
                  onClick={() => setEventType('special')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    eventType === 'special'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Event Spesial
                </button>
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
          </div>

          {/* Body Content Area (Scrollable Canvas dengan Container max-w-5xl) */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-5xl mx-auto w-full">
              <div className="grid grid-cols-12 gap-8">
                {/* Kolom Kiri: Detail Jadwal & Lokasi Event (6 Kolom) */}
                <div className="col-span-6 space-y-4">
                  {/* Informasi Utama Card */}
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4 shadow-sm">
                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block border-b border-[var(--border)] pb-2.5">
                      Informasi Utama
                    </span>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                        Nama Event <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Kohi Sunday Festival 2026"
                        value={formData.nama}
                        onChange={(e) => setFormData({...formData, nama: e.target.value})}
                        className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs focus:outline-none focus:border-[var(--primary)]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                        Tanggal Pelaksanaan <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        <input
                          type="number"
                          placeholder="Tgl (1-31)"
                          value={formData.tanggal}
                          onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                          className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs font-mono focus:outline-none focus:border-[var(--primary)]"
                          min="1" max="31" required
                        />
                        <CustomSelect
                          options={availableMonthOptions}
                          value={formData.bulan}
                          onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                          placeholder="Bulan"
                        />
                        <input
                          type="number"
                          placeholder="Tahun"
                          value={formData.tahun}
                          onChange={(e) => setFormData({...formData, tahun: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs font-mono focus:outline-none focus:border-[var(--primary)]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lokasi & Waktu Card (Jika Regular) */}
                  {eventType === 'regular' && (
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4 shadow-sm">
                      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block border-b border-[var(--border)] pb-2.5">
                        Lokasi & Waktu Acara
                      </span>

                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                          Lokasi Venue <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Contoh: Hall A, Senayan Park Jakarta"
                            value={formData.lokasi}
                            onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs focus:outline-none focus:border-[var(--primary)]"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                            Jam Event (Live)
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 14:00 WIB"
                            value={formData.event_time}
                            onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                            className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                            Jam Cheki / 2-Shot
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 15:30 - 18:00 WIB"
                            value={formData.cheki_time}
                            onChange={(e) => setFormData({...formData, cheki_time: e.target.value})}
                            className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Konfigurasi Event Spesial (Jika Special) */}
                  {eventType === 'special' && (
                    <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-5 space-y-4 shadow-sm">
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block border-b border-purple-500/30 pb-2.5">
                        Konfigurasi Event Spesial
                      </span>

                      <div>
                        <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-1.5">
                          Nama Tema Spesial <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Valentine Idol Romance Edition"
                          value={formData.theme_name}
                          onChange={(e) => setFormData({...formData, theme_name: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[var(--background)] border border-purple-500/40 text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs focus:outline-none focus:border-purple-400"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                          Warna Aksen Tema
                        </label>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {presetColors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setFormData({...formData, theme_color: color})}
                              className={`w-7 h-7 rounded-xl transition-transform ${formData.theme_color === color ? 'ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-purple-400 scale-110 shadow-lg' : 'hover:scale-105'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-purple-300/80 leading-relaxed pt-1">
                        Tiket cheki pada event bertema khusus ini akan diproses eksklusif sebagai Pre-Order Spesial dengan tampilan bertema ungu.
                      </p>
                    </div>
                  )}
                </div>

                {/* Kolom Kanan: Lineup Member yang Hadir (6 Kolom) */}
                <div className="col-span-6 space-y-4">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-[var(--primary)] text-sm" />
                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                          Lineup Member ({formData.lineup?.length || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllMembers}
                          className="text-[10px] font-bold text-[var(--primary)] hover:underline"
                        >
                          Pilih Semua
                        </button>
                        <span className="text-xs text-[var(--text-secondary)]">·</span>
                        <button
                          type="button"
                          onClick={handleClearAllMembers}
                          className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-red-400"
                        >
                          Batal Semua
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 flex-1 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar">
                      {members
                        .filter(m => m.member_id !== 'group' && m.hadir !== false)
                        .sort((a, b) => (a.order_index ?? 99) - (b.order_index ?? 99))
                        .map((member) => {
                          const isSelected = formData.lineup?.includes(member.id)
                          return (
                            <label
                              key={member.id}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                                isSelected
                                  ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--text-primary)] font-bold'
                                  : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/40 hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected || false}
                                onChange={() => toggleMemberInLineup(member.id)}
                                className="w-4 h-4 accent-[var(--primary)] cursor-pointer rounded"
                              />
                              <span className="truncate">{formatMemberName(member.nama_panggung)}</span>
                            </label>
                          )
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fullscreen Fixed Footer */}
          <div className="px-8 py-4 bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-between shrink-0 shadow-lg">
            <div className="max-w-5xl mx-auto w-full flex items-center justify-between flex-wrap gap-4">
              <span className="text-xs text-[var(--text-secondary)]">
                {eventType === 'special' ? 'Event Spesial (Pre-Order Bertema)' : 'Event Konser Regular'} · {formData.lineup?.length || 0} Member Lineup
              </span>

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
                  disabled={submitting}
                  className={`px-7 py-2.5 rounded-xl text-black text-xs font-black transition shadow-lg active:scale-95 disabled:opacity-50 ${
                    eventType === 'special'
                      ? 'bg-purple-500 hover:bg-purple-400 text-white'
                      : 'bg-[var(--primary)] hover:bg-[var(--primary)]/90'
                  }`}
                >
                  {submitting ? 'Menyimpan...' : (editingEvent ? 'Simpan Perubahan' : 'Buat Event')}
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
      <div className="fixed inset-0 z-[100] md:hidden flex flex-col justify-end bg-black/85">
        <div className="absolute inset-0" onClick={onClose} />
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-h-[92vh] bg-[var(--surface)] border-t border-[var(--border)] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-slide-up"
        >
          {/* Drag Handle Bar */}
          <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto my-3 shrink-0" />

          {/* Mobile Sheet Header */}
          <div className="px-5 pb-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
                <FaCalendarAlt className="text-[var(--primary)] text-sm" />
                {editingEvent ? 'Edit Event' : 'Tambah Event'}
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
            {/* Toggle Tipe Event */}
            <div className="grid grid-cols-2 gap-2 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setEventType('regular')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  eventType === 'regular'
                    ? 'bg-[var(--primary)] text-black'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Event Regular
              </button>
              <button
                type="button"
                onClick={() => setEventType('special')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  eventType === 'special'
                    ? 'bg-purple-600 text-white'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Event Spesial
              </button>
            </div>

            {/* Nama & Tanggal */}
            <div className="space-y-3 p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)]">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Nama Event *
                </label>
                <input
                  type="text"
                  placeholder="Nama Event"
                  value={formData.nama}
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-[var(--primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Tanggal Event *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="Tgl"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                    className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs font-mono"
                    min="1" max="31" required
                  />
                  <CustomSelect
                    options={availableMonthOptions}
                    value={formData.bulan}
                    onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                    placeholder="Bulan"
                  />
                  <input
                    type="number"
                    placeholder="Tahun"
                    value={formData.tahun}
                    onChange={(e) => setFormData({...formData, tahun: parseInt(e.target.value)})}
                    className="w-full px-2.5 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Lokasi & Jam (Jika Regular) */}
            {eventType === 'regular' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Lokasi *
                  </label>
                  <input
                    type="text"
                    placeholder="Lokasi Venue"
                    value={formData.lokasi}
                    onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Jam Event
                    </label>
                    <input
                      type="text"
                      placeholder="14:00 WIB"
                      value={formData.event_time}
                      onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                      className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Jam Cheki
                    </label>
                    <input
                      type="text"
                      placeholder="15:30 WIB"
                      value={formData.cheki_time}
                      onChange={(e) => setFormData({...formData, cheki_time: e.target.value})}
                      className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Jika Spesial */}
            {eventType === 'special' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
                <div>
                  <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
                    Tema Spesial *
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Tema"
                    value={formData.theme_name}
                    onChange={(e) => setFormData({...formData, theme_name: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-purple-500/40 text-[var(--text-primary)] rounded-xl text-xs"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-300 font-bold">Warna:</span>
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({...formData, theme_color: color})}
                      className={`w-6 h-6 rounded-lg ${formData.theme_color === color ? 'ring-2 ring-purple-400 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Lineup Member */}
            <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] border-b border-[var(--border)] pb-1.5">
                <span>Lineup Member ({formData.lineup?.length || 0})</span>
                <button
                  type="button"
                  onClick={handleSelectAllMembers}
                  className="text-[10px] text-[var(--primary)] font-bold"
                >
                  Pilih Semua
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto custom-scrollbar">
                {members
                  .filter(m => m.member_id !== 'group' && m.hadir !== false)
                  .sort((a, b) => (a.order_index ?? 99) - (b.order_index ?? 99))
                  .map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 text-xs text-[var(--text-secondary)] py-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.lineup?.includes(member.id) || false}
                        onChange={() => toggleMemberInLineup(member.id)}
                        className="w-3.5 h-3.5 accent-[var(--primary)]"
                      />
                      <span className="truncate">{formatMemberName(member.nama_panggung)}</span>
                    </label>
                  ))}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="p-4 bg-[var(--background)] border-t border-[var(--border)] flex gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] active:scale-95 text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`w-2/3 py-2.5 rounded-xl text-black text-xs font-black active:scale-95 text-center shadow-lg disabled:opacity-50 ${
                eventType === 'special' ? 'bg-purple-500 text-white' : 'bg-[var(--primary)]'
              }`}
            >
              {submitting ? 'Menyimpan...' : (editingEvent ? 'Simpan' : 'Buat Event')}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default EventModal
