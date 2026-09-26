import React, { useState, useRef } from 'react'
import Swal from 'sweetalert2'
import { FaShoppingCart, FaPlus, FaTimes, FaFileExcel, FaBox, FaEye, FaTrash, FaStar, FaTruck, FaClipboardList } from 'react-icons/fa'
import RenderTable from '../components/RenderTable'
import CustomSelect from '../components/CustomSelect'
import ExportModal from '../../../components/ExportModal'
import OTSOrderInlineForm from '../components/OTSOrderInlineForm'

const OrdersTab = ({
  orders,
  events,
  loading,
  orderSubTab,
  setOrderSubTab,
  statusFilter,
  setStatusFilter,
  eventFilter,
  setEventFilter,
  dateFilter,
  setDateFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  searchQuery,
  setSearchQuery,
  onViewOrder,
  onDeleteOrder,
  onStatusChange,
  onShowOTSModal,
  onExportExcel,
  onExportPdf,
  merchOrders,
  loadingMerchOrders,
  merchOrderSearch,
  setMerchOrderSearch,
  merchOrderStatusFilter,
  setMerchOrderStatusFilter,
  onMerchOrderStatusChange,
  onDeleteMerchOrder,
  onFetchMerchOrders,
  onExportMerchExcel,
  onExportMerchPdf,
  members = [],
  hargaOtsPerMember = 25000,
  hargaOtsGrup = 30000,
  onRefreshOrders,
  onOtsCartActiveChange
}) => {
  // Helper to check if order is from special event
  const isSpecialOrder = (order) => {
    const event = events.find(e => e.id === order.event_id)
    return event && (event.is_special || event.type === 'special')
  }

  // Filter Logic
  const specialOrders = orders.filter(o => isSpecialOrder(o))
  const otsOrders = orders.filter(o => o.is_ots && !isSpecialOrder(o))
  const poOrders = orders.filter(o => !o.is_ots && !isSpecialOrder(o))

  const [showExportModal, setShowExportModal] = useState(false)
  const [showInlineOTS, setShowInlineOTS] = useState(false)
  const otsTopRef = useRef(null)

  const handleToggleOTS = () => {
    setShowInlineOTS(prev => {
      const next = !prev
      if (!next && onOtsCartActiveChange) {
        onOtsCartActiveChange(false)
      }
      if (next) {
        setTimeout(() => {
          if (otsTopRef.current) {
            otsTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
          const adminMain = document.querySelector('main')
          if (adminMain) adminMain.scrollTo({ top: 0, behavior: 'smooth' })
        }, 50)
      }
      return next
    })
  }

  const handleTriggerExport = async (exportData) => {
    const { format, scope, value } = exportData
    if (format === 'excel') {
      await onExportExcel({ scope, value })
    } else {
      await onExportPdf({ scope, value })
    }
  }

  return (
    <div className="space-y-6">
      <div ref={otsTopRef} />
      {/* Inline OTS Form (Collapsible, Direct in Page) */}
      {showInlineOTS && (
        <OTSOrderInlineForm
          members={members}
          events={events}
          onClose={() => {
            setShowInlineOTS(false)
            if (onOtsCartActiveChange) onOtsCartActiveChange(false)
          }}
          onSuccess={() => {
            if (onOtsCartActiveChange) onOtsCartActiveChange(false)
            if (onRefreshOrders) onRefreshOrders()
          }}
          onCartChange={(count) => {
            if (onOtsCartActiveChange) onOtsCartActiveChange(count > 0)
          }}
          hargaOtsPerMember={hargaOtsPerMember}
          hargaOtsGrup={hargaOtsGrup}
        />
      )}
      {/* Sub-tabs */}
      <div className="bg-[#111726]/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-xl relative">
        <div className="flex overflow-x-auto gap-2 custom-scrollbar snap-x snap-mandatory scroll-smooth pr-8">
          {[
            { id: 'all', label: 'All (Reg)', color: 'bg-[#079108] text-white shadow-[0_0_15px_rgba(7,145,8,0.4)]' },
            { id: 'ots', label: 'OTS', color: 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' },
            { id: 'po', label: 'PO', color: 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' },
            { id: 'special', label: 'Special', color: 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]' },
            { id: 'merch', label: 'Merch', color: 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]', onClick: () => { setOrderSubTab('merch'); onFetchMerchOrders() } }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={tab.onClick || (() => setOrderSubTab(tab.id))}
              className={`flex-1 min-w-[100px] snap-start shrink-0 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-200 ${
                orderSubTab === tab.id
                  ? `${tab.color} scale-[1.02]`
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
        {/* Right fade gradient hint for horizontal scrolling */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#111726] to-transparent pointer-events-none rounded-r-2xl" />
      </div>

      {/* Status Legend */}
      <div className="bg-[#161f33]/80 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center text-xs text-zinc-300 backdrop-blur-md">
        <span className="font-bold uppercase tracking-wider text-[#00e5e5]">Panduan Status:</span>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></span>
            <span><strong className="text-amber-300">Unchecked:</strong> Order Baru</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#00e5e5]/20 border border-[#00e5e5]/50"></span>
            <span><strong className="text-[#00e5e5]">Checked:</strong> Lunas (Valid)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></span>
            <span><strong className="text-emerald-300">Completed:</strong> Selesai (Diambil)</span>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-[#111726]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Cari nama atau order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#182032] border border-white/10 text-white rounded-xl placeholder-zinc-500 text-base focus:outline-none focus:border-[#079108] focus:ring-1 focus:ring-[#079108] transition-all"
          />

          <CustomSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'pending', label: 'Unchecked' },
              { value: 'checked', label: 'Checked' },
              { value: 'completed', label: 'Completed' }
            ]}
          />

          <CustomSelect
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Semua Event' },
              ...events.map(ev => ({ value: ev.id, label: `${ev.nama} - ${ev.bulan} ${ev.tahun}` }))
            ]}
          />

          <CustomSelect
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Semua Waktu' },
              { value: 'week', label: 'Minggu Ini' },
              { value: 'month', label: 'Bulan Ini' },
              { value: 'custom', label: 'Custom Range' }
            ]}
          />
        </div>

        {dateFilter === 'custom' && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2.5 bg-[#182032] border border-white/10 text-white text-base rounded-xl focus:border-[#079108]"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2.5 bg-[#182032] border border-white/10 text-white text-base rounded-xl focus:border-[#079108]"
            />
          </div>
        )}

        <div className="flex gap-3 justify-end border-t border-white/10 pt-4 flex-wrap">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-xs font-bold border border-white/10 active:scale-95"
          >
            <FaFileExcel /> Export Data
          </button>
        </div>
      </div>

      {/* Orders Tables */}
      {orderSubTab === 'special' && (
        <RenderTable
          data={specialOrders}
          title="Special Event Orders"
          emptyMessage="Tidak ada order special event"
          loading={loading}
          onView={onViewOrder}
          onDelete={onDeleteOrder}
          onStatusChange={onStatusChange}
        />
      )}

      {(orderSubTab === 'all' || orderSubTab === 'ots') && (
        <RenderTable
          data={otsOrders}
          title="Order OTS (On The Spot)"
          emptyMessage="Tidak ada data OTS"
          loading={loading}
          onView={onViewOrder}
          onDelete={onDeleteOrder}
          onStatusChange={onStatusChange}
          action={
            <button
              onClick={handleToggleOTS}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-[0_0_15px_rgba(7,145,8,0.3)] active:scale-95 ${
                showInlineOTS 
                  ? 'bg-zinc-700 hover:bg-zinc-600 text-white' 
                  : 'bg-[#079108] hover:bg-[#067a07] text-white'
              }`}
            >
              {showInlineOTS ? <><FaTimes /> Tutup Form OTS</> : <><FaPlus /> Order OTS</>}
            </button>
          }
        />
      )}

      {(orderSubTab === 'all' || orderSubTab === 'po') && (
        <RenderTable
          data={poOrders}
          title="Pre-Order (Online)"
          emptyMessage="Tidak ada data Pre-Order"
          loading={loading}
          onView={onViewOrder}
          onDelete={onDeleteOrder}
          onStatusChange={onStatusChange}
        />
      )}

      {orderSubTab === 'merch' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">Order Merch</h3>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const { value: format } = await Swal.fire({
                    title: 'Export Merch Data',
                    input: 'radio',
                    inputOptions: { 'excel': 'Excel', 'pdf': 'PDF' },
                    inputValidator: v => !v && 'Pilih format!',
                    confirmButtonText: 'Download',
                    confirmButtonColor: '#079108',
                    showCancelButton: true
                  })
                  if (format === 'excel') await onExportMerchExcel()
                  else if (format === 'pdf') await onExportMerchPdf()
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <FaFileExcel /> Export Merch
              </button>
              <button
                onClick={onFetchMerchOrders}
                className="bg-[#079108] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#067a07] flex items-center gap-2 text-xs transition-all"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="bg-[#111726]/80 p-4 rounded-2xl border border-white/10 shadow-xl flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Cari nama / WA / order..."
              value={merchOrderSearch}
              onChange={e => setMerchOrderSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onFetchMerchOrders()}
              className="px-4 py-2 bg-[#182032] border border-white/10 text-white text-xs rounded-xl focus:border-[#079108] flex-1 min-w-[180px]"
            />
            <CustomSelect
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'checked', label: 'Checked' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              value={merchOrderStatusFilter}
              onChange={e => setMerchOrderStatusFilter(e.target.value)}
              className="min-w-[140px]"
            />
            <button onClick={onFetchMerchOrders} className="bg-[#079108] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#067a07]">Cari</button>
          </div>
          <div className="bg-[#111726]/90 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-[#182035] text-zinc-300 uppercase text-[11px] font-bold tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">Order</th>
                    <th className="px-4 py-3.5">Pembeli</th>
                    <th className="px-4 py-3.5">Items</th>
                    <th className="px-4 py-3.5">Total</th>
                    <th className="px-4 py-3.5">Catatan</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-zinc-200">
                  {loadingMerchOrders ? (
                    <tr><td colSpan="7" className="text-center py-10 text-zinc-400">Loading...</td></tr>
                  ) : merchOrders.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-10 text-zinc-400">Belum ada order merch</td></tr>
                  ) : (
                    merchOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs">
                          <p className="font-bold text-white">{order.order_number}</p>
                          <p className="text-[10px] text-zinc-400">{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-white">{order.nama_lengkap || '-'}</p>
                          <p className="text-xs text-[#00e5e5]">WA: {order.whatsapp}</p>
                          {order.instagram && <p className="text-xs text-zinc-400">IG: {order.instagram}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            {order.merch_order_items?.map((item, i) => (
                              <p key={i} className="text-xs text-zinc-300">
                                {item.item_name} {item.size && <span className="text-zinc-400">({item.size})</span>} <span className="font-bold text-[#079108]">x{item.quantity}</span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#079108]">Rp {order.total_harga.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-xs text-zinc-400 max-w-[150px]">
                          <p className="truncate" title={order.catatan}>{order.catatan || '-'}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <CustomSelect
                            value={order.status}
                            onChange={e => onMerchOrderStatusChange(order.id, e.target.value)}
                            variant="status"
                            options={[
                              { value: 'pending', label: 'Pending' },
                              { value: 'checked', label: 'Checked' },
                              { value: 'completed', label: 'Completed' },
                              { value: 'cancelled', label: 'Cancelled' }
                            ]}
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {order.payment_proof_url && (
                              <a href={order.payment_proof_url} target="_blank" rel="noreferrer"
                                className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Lihat Bukti Bayar"
                              ><FaEye /></a>
                            )}
                            <button onClick={() => onDeleteMerchOrder(order.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleTriggerExport}
          events={events}
        />
      )}
    </div>
  )
}

export default OrdersTab
