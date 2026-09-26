import React, { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaFilePdf, FaFileExcel, FaCalendarAlt, FaTicketAlt, FaLayerGroup, FaTimes, FaCheck, FaDownload } from 'react-icons/fa'
import CustomSelect from '../pages/admin/components/CustomSelect'

const ExportModal = memo(({ isOpen, onClose, onExport, events = [] }) => {
  const [format, setFormat] = useState('excel') // 'excel' | 'pdf'
  const [scope, setScope] = useState('current') // 'current' | 'event' | 'month'
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setFormat('excel')
      setScope('current')
      if (events.length > 0) setSelectedEventId(events[0].id)
    }
  }, [isOpen, events])

  const handleExport = () => {
    const exportData = {
      format,
      scope,
      value: scope === 'event' ? selectedEventId : scope === 'month' ? selectedMonth : null
    }
    onExport(exportData)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative bg-[#111726] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-white z-10"
          >
            {/* Header */}
            <div className="bg-[#161f33] px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FaDownload className="text-[#079108]" />
                  Export Data Order
                </h3>
                <p className="text-[11px] text-zinc-400">Unduh laporan transaksi dalam format Excel atau PDF</p>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Tutup"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 1. Format Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5 block">
                  1. Pilih Format File
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat('excel')}
                    className={`relative p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      format === 'excel'
                        ? 'border-[#079108] bg-[#079108]/15 text-[#22c55e] shadow-[0_0_15px_rgba(7,145,8,0.25)]'
                        : 'border-white/10 bg-[#161f33] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    <FaFileExcel className="text-2xl" />
                    <span className="font-bold text-xs">Excel (.xlsx)</span>
                    {format === 'excel' && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#079108] flex items-center justify-center text-[10px] text-white">
                        <FaCheck size={8} />
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('pdf')}
                    className={`relative p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      format === 'pdf'
                        ? 'border-red-500 bg-red-500/15 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                        : 'border-white/10 bg-[#161f33] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    <FaFilePdf className="text-2xl" />
                    <span className="font-bold text-xs">PDF Document</span>
                    {format === 'pdf' && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">
                        <FaCheck size={8} />
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* 2. Scope Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5 block">
                  2. Cakupan Data
                </label>
                <div className="space-y-2.5">
                  {/* Current Filter */}
                  <label
                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                      scope === 'current'
                        ? 'border-[#079108] bg-[#079108]/10 text-white'
                        : 'border-white/10 bg-[#161f33] text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      checked={scope === 'current'}
                      onChange={() => setScope('current')}
                      className="w-4 h-4 accent-[#079108] cursor-pointer"
                    />
                    <div className="ml-3 flex items-center gap-2.5 text-xs font-semibold">
                      <FaLayerGroup className={scope === 'current' ? 'text-[#22c55e]' : 'text-zinc-400'} />
                      <span>Sesuai Filter di Layar (Data Saat Ini)</span>
                    </div>
                  </label>

                  {/* By Event */}
                  <div
                    className={`rounded-xl border transition-all overflow-hidden ${
                      scope === 'event'
                        ? 'border-[#079108] bg-[#079108]/10'
                        : 'border-white/10 bg-[#161f33] hover:border-white/20'
                    }`}
                  >
                    <label className="flex items-center p-3 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={scope === 'event'}
                        onChange={() => setScope('event')}
                        className="w-4 h-4 accent-[#079108] cursor-pointer"
                      />
                      <div className="ml-3 flex items-center gap-2.5 text-xs font-semibold text-zinc-200">
                        <FaTicketAlt className={scope === 'event' ? 'text-[#22c55e]' : 'text-zinc-400'} />
                        <span>Per Event Spesifik</span>
                      </div>
                    </label>

                    {scope === 'event' && (
                      <div className="px-3 pb-3 pt-0">
                        <CustomSelect
                          options={events.map((ev) => ({
                            value: ev.id,
                            label: `${ev.nama} (${ev.tanggal} ${ev.bulan} ${ev.tahun})`
                          }))}
                          value={selectedEventId}
                          onChange={(e) => setSelectedEventId(e.target.value)}
                          placeholder="Pilih Event"
                        />
                      </div>
                    )}
                  </div>

                  {/* By Month */}
                  <div
                    className={`rounded-xl border transition-all overflow-hidden ${
                      scope === 'month'
                        ? 'border-[#079108] bg-[#079108]/10'
                        : 'border-white/10 bg-[#161f33] hover:border-white/20'
                    }`}
                  >
                    <label className="flex items-center p-3 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={scope === 'month'}
                        onChange={() => setScope('month')}
                        className="w-4 h-4 accent-[#079108] cursor-pointer"
                      />
                      <div className="ml-3 flex items-center gap-2.5 text-xs font-semibold text-zinc-200">
                        <FaCalendarAlt className={scope === 'month' ? 'text-[#22c55e]' : 'text-zinc-400'} />
                        <span>Per Bulan Transaksi</span>
                      </div>
                    </label>

                    {scope === 'month' && (
                      <div className="px-3 pb-3 pt-0">
                        <input
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="w-full bg-[#182032] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#079108] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#161f33] flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExport}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 active:scale-95 ${
                  format === 'excel'
                    ? 'bg-[#079108] hover:bg-[#067a07] shadow-[#079108]/30'
                    : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                }`}
              >
                <FaDownload size={12} /> Unduh {format === 'excel' ? 'Excel' : 'PDF'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
})

export default ExportModal

