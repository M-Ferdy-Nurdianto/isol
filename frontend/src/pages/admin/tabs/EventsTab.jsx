import React, { useState } from 'react'
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers } from 'react-icons/fa'
import api from '../../../lib/api'
import { formatMemberName } from '../../../lib/memberUtils'
import { showToast } from '../../../lib/toast'
import CustomSelect from '../components/CustomSelect'

const monthList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const monthOptions = monthShort.map((m, i) => ({ value: monthList[i], label: m }))
const presetColors = ['#FF6B9D', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']

const emptyForm = {
  nama: '', tanggal: '', bulan: '', tahun: new Date().getFullYear(),
  lokasi: '', event_time: '', cheki_time: '', is_past: false,
  is_special: false, theme_name: '', theme_color: '#FF6B9D', lineup: []
}

const EventsTab = ({ events, members, onDeleteEvent, onTogglePast, onRefresh }) => {
  // view: 'list' | 'form'
  const [view, setView] = useState('list')
  const [editingEvent, setEditingEvent] = useState(null)
  const [eventType, setEventType] = useState('regular')
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [hideOlderThanMonth, setHideOlderThanMonth] = useState(true)

  const checkEventDate = (event) => {
    const months = {
      'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
      'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
    }
    const eventDate = new Date(event.tahun, months[event.bulan] || 0, event.tanggal)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return eventDate < today
  }

  const isEventPast = (event) => {
    if (event.is_past) return true
    return checkEventDate(event)
  }

  const isEventOlderThanMonth = (event) => {
    if (event.is_older_than_month !== undefined) return event.is_older_than_month
    const months = {
      'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
      'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
    }
    const eventDate = new Date(event.tahun, months[event.bulan] || 0, event.tanggal)
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return eventDate < oneMonthAgo
  }

  const displayedEvents = events.filter(e => {
    if (hideOlderThanMonth && isEventOlderThanMonth(e)) return false
    return true
  })

  const openCreateForm = () => {
    setEditingEvent(null)
    setEventType('regular')
    setFormData(emptyForm)
    setView('form')
  }

  const openEditForm = (event) => {
    const existingLineup = event.event_lineup?.map(el => el.member_id) || []
    setEditingEvent(event)
    setEventType(event.is_special ? 'special' : 'regular')
    setFormData({
      ...event,
      lineup: existingLineup,
      is_special: event.is_special || false,
      theme_name: event.theme_name || '',
      theme_color: event.theme_color || '#FF6B9D'
    })
    setView('form')
  }

  const closeForm = () => {
    setView('list')
    setEditingEvent(null)
  }

  const toggleMemberInLineup = (memberId) => {
    setFormData(prev => ({
      ...prev,
      lineup: prev.lineup.includes(memberId)
        ? prev.lineup.filter(id => id !== memberId)
        : [...prev.lineup, memberId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const basePayload = {
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

      if (editingEvent) {
        await api.patch(`/events/${editingEvent.id}`, basePayload)
        showToast.success('Event Updated!')
      } else {
        await api.post('/events', basePayload)
        showToast.success('Event Created!')
      }
      onRefresh?.()
      closeForm()
    } catch (error) {
      showToast.error(error.response?.data?.error || error.message, 'Gagal')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- FORM VIEW ----------
  if (view === 'form') {
    const currentYear = new Date().getFullYear()
    const currentMonthIdx = new Date().getMonth()

    // Saat membuat event baru (bukan edit) di tahun sekarang, hanya tampilkan bulan berjalan & bulan tersisa
    const availableMonthOptions = (!editingEvent && formData.tahun === currentYear)
      ? monthOptions.filter((_, idx) => idx >= currentMonthIdx)
      : monthOptions

    const selectableMembers = members
      .filter(m => m.member_id !== 'group' && m.hadir !== false)
      .sort((a, b) => (a.order_index ?? 99) - (b.order_index ?? 99))

    return (
      <div className="space-y-6 animate-fade-in max-w-5xl">
        <div className="flex items-center gap-3">
          <button
            onClick={closeForm}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
            title="Kembali"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight">
              {editingEvent ? 'Edit Event' : 'Tambah Event Baru'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              {editingEvent ? `Mengubah "${editingEvent.nama}"` : 'Isi detail event dan pilih lineup member.'}
            </p>
          </div>
        </div>

        {/* Segmented control, bukan tab full-width */}
        <div className="inline-flex bg-[var(--background)] border border-[var(--border)] rounded-full p-1">
          <button
            type="button"
            onClick={() => setEventType('regular')}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${eventType === 'regular' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Event Regular
          </button>
          <button
            type="button"
            onClick={() => setEventType('special')}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${eventType === 'special' ? 'bg-pink-500 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Event Spesial
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Kolom kiri: detail event */}
          <div className="lg:col-span-3 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 space-y-5">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Nama event</label>
              <input
                type="text"
                placeholder="Refresh Carnival Vol. 3"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-sm focus:outline-none focus:border-[var(--primary)]"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Tanggal event</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Tgl"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-sm focus:outline-none focus:border-[var(--primary)]"
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
                  onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-sm focus:outline-none focus:border-[var(--primary)]"
                  required
                />
              </div>
            </div>

            {eventType === 'regular' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Lokasi</label>
                    <input
                      type="text"
                      placeholder="Tulungagung Cultural Hall"
                      value={formData.lokasi}
                      onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-sm focus:outline-none focus:border-[var(--primary)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Jam event</label>
                    <input
                      type="text"
                      placeholder="14:00 WIB"
                      value={formData.event_time}
                      onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-sm focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Jam cheki</label>
                  <input
                    type="text"
                    placeholder="15:00 - 17:00 WIB"
                    value={formData.cheki_time}
                    onChange={(e) => setFormData({ ...formData, cheki_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-sm focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </>
            )}

            {eventType === 'special' && (
              <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xs text-pink-300 mb-1.5">Nama tema</label>
                  <input
                    type="text"
                    placeholder="Valentine Edition"
                    value={formData.theme_name}
                    onChange={(e) => setFormData({ ...formData, theme_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-pink-500/30 text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-sm focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)] mr-1">Warna tema</span>
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, theme_color: color })}
                      className={`w-6 h-6 rounded-full transition-transform ${formData.theme_color === color ? 'ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--text-primary)] scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-pink-400">Event spesial hanya tersedia untuk Pre-Order.</p>
              </div>
            )}
          </div>

          {/* Kolom kanan: lineup, mengisi ruang & sejajar tinggi sama kolom kiri */}
          <div className="lg:col-span-2 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-[var(--text-secondary)]">Lineup member</label>
              <span className="text-xs font-bold text-[var(--primary)]">{formData.lineup?.length || 0} dipilih</span>
            </div>
            <div className="space-y-1.5 flex-1">
              {selectableMembers.map((member) => {
                const active = formData.lineup?.includes(member.id)
                return (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => toggleMemberInLineup(member.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                      active
                        ? 'bg-[var(--primary)]/15 border-[var(--primary)]/40 text-[var(--text-primary)]'
                        : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/30 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {formatMemberName(member.nama_panggung)}
                    <span className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${active ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-zinc-600'}`}>
                      {active && (
                        <svg className="w-3 h-3 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-5 flex gap-2 pt-1 max-w-md ml-auto">
            <button type="button" onClick={closeForm} className="flex-1 bg-[var(--border)] px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--primary)]/15 transition-all">
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 transition-all shadow-[0_2px_10px_rgba(232,148,74,0.25)] ${eventType === 'special' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-[var(--primary)] hover:bg-[var(--primary)]/85'}`}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Event'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ---------- LIST VIEW ----------
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight">Event <span className="text-[var(--primary)]">Management</span></h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Jadwal & lineup event.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHideOlderThanMonth(prev => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              hideOlderThanMonth
                ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30 hover:bg-[var(--primary)]/20'
                : 'bg-[var(--border)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--primary)]/10 hover:text-[var(--text-primary)]'
            }`}
            title="Event yang sudah lebih dari 1 bulan disembunyikan otomatis untuk menjaga performa"
          >
            <span>{hideOlderThanMonth ? 'Sembunyikan > 1 Bln: Aktif' : 'Tampilkan Semua Event'}</span>
          </button>
          <button
            onClick={openCreateForm}
            className="bg-[var(--primary)] text-[var(--text-primary)] px-5 py-2.5 rounded-xl font-bold hover:bg-[var(--primary)]/85 transition-all flex items-center gap-2 text-xs shadow-[0_2px_10px_rgba(232,148,74,0.25)] active:scale-95"
          >
            <FaPlus /> Tambah Event
          </button>
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3">
        {displayedEvents.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 text-center text-[var(--text-secondary)] text-xs">
            {events.length > 0 && hideOlderThanMonth
              ? 'Semua event tersimpan sudah lebih dari 1 bulan dan disembunyikan. Klik tombol di atas untuk menampilkan.'
              : 'Belum ada event'}
          </div>
        ) : (
          displayedEvents.map((event) => {
            const pastByDate = checkEventDate(event)
            const past = isEventPast(event)
            const visibleLineupCount = event.event_lineup?.length || 0

            return (
              <div key={event.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 shadow-xl space-y-3">
                {/* Header card: nama + badge tema & badge status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[var(--text-primary)] text-sm">{event.nama}</h3>
                      {event.is_special && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[var(--text-primary)] text-[10px] font-bold"
                          style={{ backgroundColor: event.theme_color || '#FF6B9D' }}
                        >
                          {event.theme_name || 'Special'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Toggle / Badge */}
                  <div className="shrink-0">
                    {pastByDate ? (
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[var(--border)] text-[var(--text-secondary)] border border-[var(--border)] inline-block">
                        Selesai
                      </span>
                    ) : (
                      <button
                        onClick={() => onTogglePast(event.id, event.is_past)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                          past
                            ? 'bg-[var(--border)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--success)]/15 hover:text-[var(--success)]'
                            : 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20 hover:bg-[var(--border)] hover:text-[var(--text-secondary)]'
                        }`}
                        title={past ? 'Klik untuk aktifkan kembali' : 'Klik untuk tandai selesai secara manual'}
                      >
                        {past ? 'Selesai' : 'Aktif'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Detail: Tanggal, Jam, Lokasi */}
                <div className="space-y-1.5 text-xs text-[var(--text-secondary)] border-y border-[var(--border)] py-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 font-medium">
                      <FaCalendarAlt className="text-[var(--primary)] text-xs shrink-0" />
                      {event.tanggal} {event.bulan} {event.tahun}
                    </span>
                    {event.event_time && (
                      <span className="flex items-center gap-1 text-[var(--text-secondary)] ml-2">
                        <FaClock className="text-xs text-[var(--text-secondary)] shrink-0" />
                        {event.event_time}
                      </span>
                    )}
                  </div>
                  {event.lokasi && (
                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <FaMapMarkerAlt className="text-red-400 text-xs shrink-0" />
                      <span className="truncate">{event.lokasi}</span>
                    </div>
                  )}
                </div>

                {/* Footer card: Lineup & Aksi */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--primary)] font-bold">
                    <FaUsers className="text-xs shrink-0" />
                    <span>{visibleLineupCount} member</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(event)}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                      title="Edit Event"
                    >
                      <FaEdit className="text-base" />
                    </button>
                    <button
                      onClick={() => onDeleteEvent(event.id, event.nama)}
                      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Hapus Event"
                    >
                      <FaTrash className="text-base" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table (≥ md) */}
      <div className="hidden md:block bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--background)] text-[var(--text-secondary)] uppercase text-[11px] font-bold tracking-wider border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3.5">Event</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Lokasi</th>
                <th className="px-4 py-3.5">Lineup</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm text-[var(--text-secondary)]">
              {displayedEvents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[var(--text-secondary)]">
                    {events.length > 0 && hideOlderThanMonth
                      ? 'Semua event tersimpan sudah lebih dari 1 bulan dan disembunyikan. Klik tombol "Tampilkan Semua Event" di atas untuk melihat.'
                      : 'Belum ada event'}
                  </td>
                </tr>
              ) : (
                displayedEvents.map((event) => {
                  const pastByDate = checkEventDate(event)
                  const past = isEventPast(event)
                  const visibleLineupCount = event.event_lineup?.length || 0
                  return (
                    <tr key={event.id} className="hover:bg-[var(--primary)]/5 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--text-primary)] text-sm">{event.nama}</span>
                          {event.is_special && (
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[var(--text-primary)] text-[10px] font-bold shadow-sm"
                              style={{ backgroundColor: event.theme_color || '#FF6B9D' }}
                            >
                              {event.theme_name || 'Special'}
                            </span>
                          )}
                        </div>
                        {event.event_time && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{event.event_time}</p>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)] font-medium">
                        {event.tanggal} {event.bulan} {event.tahun}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)]">{event.lokasi}</td>
                      <td className="px-4 py-3.5 text-xs text-[#00e5e5] font-bold">{visibleLineupCount} member</td>
                      <td className="px-4 py-3.5 text-center">
                        {pastByDate ? (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[var(--border)] text-[var(--text-secondary)] border border-[var(--border)]">
                            Selesai
                          </span>
                        ) : (
                          <button
                            onClick={() => onTogglePast(event.id, event.is_past)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                              past
                                ? 'bg-[var(--border)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--success)]/15 hover:text-[var(--success)]'
                                : 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20 hover:bg-[var(--border)] hover:text-[var(--text-secondary)]'
                            }`}
                            title={past ? 'Klik untuk aktifkan kembali' : 'Klik untuk tandai selesai secara manual'}
                          >
                            {past ? 'Selesai' : 'Aktif'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditForm(event)}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <FaEdit className="text-base" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent(event.id, event.nama)}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Hapus Event"
                          >
                            <FaTrash className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default EventsTab



