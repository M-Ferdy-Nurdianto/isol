import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { FaTimes } from 'react-icons/fa'
import api from '../../../lib/api'
import { formatMemberName } from '../../../lib/memberUtils'
import { showToast } from '../../../lib/toast'
import CustomSelect from '../components/CustomSelect'

const monthList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const monthOptions = monthShort.map((m, i) => ({ value: monthList[i], label: m }))

const EventModal = ({ members, onClose, onSuccess, editingEvent }) => {
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
        theme_color: editingEvent.theme_color || '#FF6B9D'
      }
    }
    return {
      nama: '', tanggal: '', bulan: '', tahun: new Date().getFullYear(),
      lokasi: '', event_time: '', cheki_time: '', is_past: false,
      is_special: false, theme_name: '', theme_color: '#FF6B9D', lineup: []
    }
  })
  const [submitting, setSubmitting] = useState(false)

  const presetColors = [
    '#FF6B9D', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'
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

  useEffect(() => {
    setFormData(prev => ({ ...prev, is_special: eventType === 'special' }))
  }, [eventType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingEvent) {
        // Clean payload: only send fields that exist in the events table
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
          lineup: formData.lineup // Send the array of UUIDs
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col text-[var(--text-primary)]">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)] text-[var(--text-primary)]">
          <h3 className="text-base font-bold uppercase tracking-wider">{editingEvent ? 'Edit Event' : 'Tambah Event Baru'}</h3>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg transition-colors p-1"><FaTimes /></button>
        </div>

        <div className="flex border-b border-[var(--border)] bg-[var(--background)]">
          <button
            type="button"
            onClick={() => setEventType('regular')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${eventType === 'regular' ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Event Regular
          </button>
          <button
            type="button"
            onClick={() => setEventType('special')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${eventType === 'special' ? 'border-pink-500 text-pink-400 bg-pink-500/10' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Event Spesial
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Nama Event *</label>
            <input
              type="text"
              placeholder="Nama Event *"
              value={formData.nama}
              onChange={(e) => setFormData({...formData, nama: e.target.value})}
              className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Tanggal Event *</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="Tgl"
                value={formData.tanggal}
                onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)]"
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
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)]"
                required
              />
            </div>
          </div>

          {eventType === 'regular' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Lokasi *</label>
                  <input
                    type="text"
                    placeholder="Lokasi *"
                    value={formData.lokasi}
                    onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                    className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Jam Event</label>
                  <input
                    type="text"
                    placeholder="14:00 WIB"
                    value={formData.event_time}
                    onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                    className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Jam Cheki</label>
                <input
                  type="text"
                  placeholder="15:00 - 17:00 WIB"
                  value={formData.cheki_time}
                  onChange={(e) => setFormData({...formData, cheki_time: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </>
          )}

          {eventType === 'special' && (
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-3.5 space-y-2.5">
              <input
                type="text"
                placeholder="Nama Tema (e.g. Valentine Edition)"
                value={formData.theme_name}
                onChange={(e) => setFormData({...formData, theme_name: e.target.value})}
                className="w-full px-3.5 py-2 bg-[var(--background)] border border-pink-500/30 text-[var(--text-primary)] rounded-xl text-xs focus:outline-none focus:border-pink-500"
                required
              />
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-xs text-[var(--text-secondary)] font-bold mr-1">Warna Tema:</span>
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, theme_color: color})}
                    className={`w-5 h-5 rounded-full ${formData.theme_color === color ? 'ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--text-primary)] scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-[11px] text-pink-400 font-medium">Event spesial hanya tersedia untuk Pre-Order</p>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1.5">Lineup Member ({formData.lineup?.length || 0})</label>
            <div className="grid grid-cols-3 gap-2 border border-[var(--border)] rounded-xl p-3 bg-[var(--background)]">
              {members
                .filter(m => m.member_id !== 'group' && m.hadir !== false)
                .sort((a, b) => (a.order_index ?? 99) - (b.order_index ?? 99))
                .map((member) => (
                  <label key={member.id} className="flex items-center gap-2 text-xs cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={formData.lineup?.includes(member.id) || false}
                      onChange={() => toggleMemberInLineup(member.id)}
                      className="w-3.5 h-3.5 accent-[var(--primary)] cursor-pointer"
                    />
                    {formatMemberName(member.nama_panggung)}
                  </label>
                ))}
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
            <button type="button" onClick={onClose} className="flex-1 bg-[var(--border)] px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--primary)]/15 transition-all">
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(232, 148, 74,0.3)] ${eventType === 'special' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-[var(--primary)] hover:bg-[var(--primary)]/85'}`}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventModal



