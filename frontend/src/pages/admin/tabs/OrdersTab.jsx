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
  hargaChekiGrupOts = 0,
  regularChekiEnabled = true,
  wideChekiEnabled = false,
  chekiGrupEnabled = false,
  paymentEnableCash = true,
  paymentEnableQris = true,
  paymentEnableTf = false,
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
          mode="admin"
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
          hargaChekiGrupOts={hargaChekiGrupOts}
          regularChekiEnabled={regularChekiEnabled}
          wideChekiEnabled={wideChekiEnabled}
          chekiGrupEnabled={chekiGrupEnabled}
          paymentEnableCash={paymentEnableCash}
          paymentEnableQris={paymentEnableQris}
          paymentEnableTf={paymentEnableTf}
        />
      )}
      {/* Sub-tabs */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-2 rounded-2xl shadow-xl relative">
        <div className="flex overflow-x-auto gap-2 custom-scrollbar snap-x snap-mandatory scroll-smooth pr-8">
          {[
            { id: 'all', label: 'All (Reg)', color: 'bg-[var(--primary)] text-[var(--text-primary)] shadow-[0_0_15px_rgba(232,148,74,0.35)]' },
            { id: 'ots', label: 'OTS', color: 'bg-amber-500 text-[var(--text-primary)] shadow-[0_0_15px_rgba(245,158,11,0.4)]' },
            { id: 'po', label: 'PO', color: 'bg-cyan-500 text-[var(--text-primary)] shadow-[0_0_15px_rgba(6,182,212,0.4)]' },
            { id: 'special', label: 'Special', color: 'bg-pink-500 text-[var(--text-primary)] shadow-[0_0_15px_rgba(236,72,153,0.4)]' },
            { id: 'merch', label: 'Merch', color: 'bg-emerald-500 text-[var(--text-primary)] shadow-[0_0_15px_rgba(16,185,129,0.4)]', onClick: () => { setOrderSubTab('merch'); onFetchMerchOrders() } }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={tab.onClick || (() => setOrderSubTab(tab.id))}
              className={`flex-1 min-w-[100px] snap-start shrink-0 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-200 ${
                orderSubTab === tab.id
                  ? `${tab.color} scale-[1.02]`
                  : 'text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="flex items-center justify-center">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
        {/* Right fade gradient hint for horizontal scrolling */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--surface)] to-transparent pointer-events-none rounded-r-2xl" />
      </div>

      {/* Status Legend */}
      <div className="bg-[var(--background)] border border-[var(--border)] p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center text-xs text-[var(--text-secondary)]">
        <span className="font-bold uppercase tracking-wider text-[var(--primary)]">Panduan Status:</span>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></span>
            <span><strong className="text-amber-300">Unchecked:</strong> Order Baru</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--surface)]/20 border border-[#00e5e5]/50"></span>
            <span><strong className="text-[#00e5e5]">Checked:</strong> Lunas (Valid)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></span>
            <span><strong className="text-emerald-300">Completed:</strong> Selesai (Diambil)</span>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Cari nama atau order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/50 transition-all"
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
              className="px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-xl focus:border-[var(--primary)]"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-xl focus:border-[var(--primary)]"
            />
          </div>
        )}

        <div className="flex gap-3 justify-end border-t border-[var(--border)] pt-4 flex-wrap">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--border)] hover:bg-[var(--primary)]/15 text-[var(--text-primary)] rounded-xl transition-all text-xs font-bold border border-[var(--border)] active:scale-95"
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
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-[0_2px_10px_rgba(232,148,74,0.25)] active:scale-95 ${
                showInlineOTS 
                  ? 'bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--text-primary)]' 
                  : 'bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-white'
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
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">Order Merch</h3>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const { value: format } = await Swal.fire({
                    title: 'Export Merch Data',
                    input: 'radio',
                    inputOptions: { 'excel': 'Excel', 'pdf': 'PDF' },
                    inputValidator: v => !v && 'Pilih format!',
                    confirmButtonText: 'Download',
                    confirmButtonColor: '#E8944A',
                    showCancelButton: true
                  })
                  if (format === 'excel') await onExportMerchExcel()
                  else if (format === 'pdf') await onExportMerchPdf()
                }}
                className="bg-emerald-600 text-[var(--text-primary)] px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <FaFileExcel /> Export Merch
              </button>
              <button
                onClick={onFetchMerchOrders}
                className="bg-[var(--primary)] text-[var(--text-primary)] px-4 py-2 rounded-xl font-bold hover:bg-[var(--primary)]/85 flex items-center gap-2 text-xs transition-all"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] shadow-xl flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Cari nama / WA / order..."
              value={merchOrderSearch}
              onChange={e => setMerchOrderSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onFetchMerchOrders()}
              className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:border-[var(--primary)] flex-1 min-w-[180px]"
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
            <button onClick={onFetchMerchOrders} className="bg-[var(--primary)] text-[var(--text-primary)] px-4 py-2 rounded-xl font-bold text-xs hover:bg-[var(--primary)]/85">Cari</button>
          </div>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-[var(--background)] text-[var(--text-secondary)] uppercase text-[11px] font-bold tracking-wider border-b border-[var(--border)]">
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
                <tbody className="divide-y divide-[var(--border)] text-sm text-[var(--text-secondary)]">
                  {loadingMerchOrders ? (
                    <tr><td colSpan="7" className="text-center py-10 text-[var(--text-secondary)]">Loading...</td></tr>
                  ) : merchOrders.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-10 text-[var(--text-secondary)]">Belum ada order merch</td></tr>
                  ) : (
                    merchOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[var(--primary)]/5 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs">
                          <p className="font-bold text-[var(--text-primary)]">{order.order_number}</p>
                          <p className="text-[10px] text-[var(--text-secondary)]">{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-[var(--text-primary)]">{order.nama_lengkap || '-'}</p>
                          <p className="text-xs text-[#00e5e5]">WA: {order.whatsapp}</p>
                          {order.instagram && <p className="text-xs text-[var(--text-secondary)]">IG: {order.instagram}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            {order.merch_order_items?.map((item, i) => (
                              <p key={i} className="text-xs text-[var(--text-secondary)]">
                                {item.item_name} {item.size && <span className="text-[var(--text-secondary)]">({item.size})</span>} <span className="font-bold text-[var(--primary)]">x{item.quantity}</span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[var(--primary)]">Rp {order.total_harga.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)] max-w-[150px]">
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
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 hover:bg-[var(--border)] rounded-lg transition-colors"
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




