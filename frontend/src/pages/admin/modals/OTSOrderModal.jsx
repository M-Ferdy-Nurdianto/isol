import React, { useState } from 'react'
import Swal from 'sweetalert2'
import { FaTimes } from 'react-icons/fa'
import api from '../../../lib/api'
import { formatMemberName } from '../../../lib/memberUtils'
import CustomSelect from '../components/CustomSelect'

const OTSOrderModal = ({ members, events, onClose, onSuccess, hargaOtsPerMember = 25000, hargaOtsGrup = 30000 }) => {
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    event_id: '',
    payment_method: 'Cash',
    items: []
  })
  const [submitting, setSubmitting] = useState(false)

  const addItem = (member) => {
    const isGroup = member.member_id === 'group'
    const price = parseInt(isGroup ? hargaOtsGrup : hargaOtsPerMember, 10)

    const existing = formData.items.find(item => item.member_id === member.id)
    if (existing) {
      setFormData({
        ...formData,
        items: formData.items.map(item =>
          item.member_id === member.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      })
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, {
          member_id: member.id,
          name: `Cheki ${formatMemberName(member.nama_panggung)}`,
          price: price,
          quantity: 1
        }]
      })
    }
  }

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await api.post('/orders/ots', formData)
      Swal.fire({
        icon: 'success',
        title: 'Order OTS Berhasil!',
        confirmButtonColor: '#079108'
      })
      onSuccess()
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: error.response?.data?.error || error.message,
        confirmButtonColor: '#079108'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const totalPrice = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#111726] border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar text-white">
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#161f33] sticky top-0 z-10">
          <h3 className="text-base md:text-lg font-bold text-white uppercase tracking-wider">Order OTS <span className="text-[#079108]">(On The Spot)</span></h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-lg transition-colors p-1">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">Pilih Event *</label>
                <CustomSelect
                  options={events.filter(event => {
                    if (event.is_special) return false;
                    if (event.is_past) return false;
                    const months = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 };
                    const eventDate = new Date(event.tahun, months[event.bulan] || 0, event.tanggal);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return eventDate >= today;
                  }).map(event => ({
                    value: event.id,
                    label: `${event.nama} - ${event.tanggal} ${event.bulan} ${event.tahun}`
                  }))}
                  value={formData.event_id}
                  onChange={(e) => setFormData({...formData, event_id: e.target.value})}
                  placeholder="-- Pilih Event *--"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">Nama Pembeli *</label>
                <input
                  type="text"
                  placeholder="Contoh: Kiki"
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#182032] border border-white/10 text-white text-xs rounded-xl placeholder-zinc-500 focus:border-[#079108] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Metode Pembayaran *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, payment_method: 'Cash'})}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-all ${
                      formData.payment_method === 'Cash'
                        ? 'bg-[#079108] text-white border-[#079108] shadow-[0_0_12px_rgba(7,145,8,0.4)]'
                        : 'bg-[#182032] text-zinc-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, payment_method: 'QR'})}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-all ${
                      formData.payment_method === 'QR'
                        ? 'bg-[#079108] text-white border-[#079108] shadow-[0_0_12px_rgba(7,145,8,0.4)]'
                        : 'bg-[#182032] text-zinc-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    QR Code
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-300 mb-2">Items Dipilih:</h4>
                {formData.items.length === 0 ? (
                  <p className="text-zinc-500 text-xs italic">Pilih member di panel kanan →</p>
                ) : (
                  <div className="space-y-2">
                    <div className="max-h-[140px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-[#182032] border border-white/5 p-2.5 rounded-xl">
                          <span className="text-xs text-zinc-200">{item.name} <span className="font-bold text-[#079108]">x{item.quantity}</span></span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#079108]">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-sm">
                      <span className="text-zinc-300">Total Harga:</span>
                      <span className="text-[#079108] font-black text-base">Rp {totalPrice.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-300 mb-3">Pilih Member / Items:</h4>
              <div className="grid grid-cols-2 gap-2.5 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {members.map((member) => {
                  const selectedEvent = events.find(e => e.id === formData.event_id);
                  let isAllowed = true;
                  if (selectedEvent && selectedEvent.event_lineup && selectedEvent.event_lineup.length > 0) {
                    if (member.member_id !== 'group') {
                      const allowedIds = selectedEvent.event_lineup.map(l => String(l.member_id));
                      isAllowed = allowedIds.includes(String(member.id)) || allowedIds.includes(String(member.member_id));
                    }
                  }

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        if (!formData.event_id) {
                          Swal.fire({ icon: 'warning', title: 'Pilih Event', text: 'Silakan pilih event terlebih dahulu.', confirmButtonColor: '#079108' });
                          return;
                        }
                        addItem(member);
                      }}
                      disabled={!isAllowed}
                      className={`p-3 border rounded-xl transition-all text-left ${
                        isAllowed 
                          ? 'bg-[#182032] border-white/10 hover:border-[#079108] hover:bg-[#079108]/10 cursor-pointer' 
                          : 'bg-white/5 border-white/5 text-zinc-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className={`text-xs font-bold ${isAllowed ? 'text-white' : 'text-zinc-500'}`}>
                        {formatMemberName(member.nama_panggung)}
                      </div>
                      <div className="text-[11px] text-[#079108] font-semibold mt-0.5">
                        Rp {parseInt(member.member_id === 'group' ? hargaOtsGrup : hargaOtsPerMember, 10).toLocaleString('id-ID')}
                      </div>
                      {!isAllowed && <div className="text-[9px] text-red-400 mt-1 font-bold">Tidak Hadir</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse md:flex-row gap-3 pt-4 border-t border-white/10 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white/10 text-zinc-300 rounded-xl font-bold text-xs hover:bg-white/20 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || formData.items.length === 0}
              className="px-6 py-2.5 bg-[#079108] text-white rounded-xl font-bold text-xs hover:bg-[#067a07] disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(7,145,8,0.3)]"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Order OTS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OTSOrderModal
