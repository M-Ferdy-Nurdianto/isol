import React, { useState, useRef } from 'react'
import Swal from 'sweetalert2'
import { FaShoppingCart, FaPlus, FaTimes, FaFileExcel, FaBox, FaEye, FaTrash, FaStar, FaTruck, FaClipboardList, FaStore, FaMapMarkerAlt } from 'react-icons/fa'
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
  merch = [],
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
  const [editingShippingOrder, setEditingShippingOrder] = useState(null)
  const [shippingForm, setShippingForm] = useState({ status: 'shipped', shipping_courier: '', tracking_number: '' })
  const otsTopRef = useRef(null)

  const openShippingModal = (order) => {
    setEditingShippingOrder(order)
    setShippingForm({
      status: order.status === 'pending' ? 'packing' : order.status,
      shipping_courier: order.shipping_courier || '',
      tracking_number: order.tracking_number || ''
    })
  }

  const handleSaveShippingModal = async (e) => {
    e.preventDefault()
    if (!editingShippingOrder) return
    await onMerchOrderStatusChange(editingShippingOrder.id, shippingForm.status, {
      shipping_courier: shippingForm.shipping_courier.trim() || null,
      tracking_number: shippingForm.tracking_number.trim() || null
    })
    setEditingShippingOrder(null)
  }

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
          merch={merch}
          events={events}
          defaultEventId={eventFilter && eventFilter !== 'all' ? eventFilter : ''}
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
            { id: 'all', label: 'All (Reg)' },
            { id: 'ots', label: 'OTS' },
            { id: 'po', label: 'PO' },
            { id: 'special', label: 'Special' },
            { id: 'merch', label: 'Merch', onClick: () => { setOrderSubTab('merch'); onFetchMerchOrders() } }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={tab.onClick || (() => setOrderSubTab(tab.id))}
              className={`flex-1 min-w-[100px] snap-start shrink-0 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-200 ${orderSubTab === tab.id
                ? 'bg-[var(--primary)] text-white shadow-md scale-[1.02]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]'
                }`}
            >
              <span className="flex items-center justify-center">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
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
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-[0_2px_10px_rgba(232,148,74,0.25)] active:scale-95 ${showInlineOTS
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
                className="bg-amber-600 text-[var(--text-primary)] px-4 py-2 rounded-xl font-bold hover:bg-amber-700 flex items-center gap-2 text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
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
                { value: 'paid', label: 'Lunas / Checked' },
                { value: 'packing', label: 'Dikemas' },
                { value: 'shipped', label: 'Sudah Dikirim' },
                { value: 'completed', label: 'Selesai' },
                { value: 'cancelled', label: 'Dibatalkan' }
              ]}
              value={merchOrderStatusFilter}
              onChange={e => setMerchOrderStatusFilter(e.target.value)}
              className="min-w-[160px]"
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
                    <th className="px-4 py-3.5">Pengambilan / Resi</th>
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
                        <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)] max-w-[230px] space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)]">
                            {order.delivery_method === 'shipping' ? <FaTruck size={9} /> : <FaStore size={9} />}
                            {order.delivery_method === 'shipping' ? 'Dikirim' : 'Ambil di Event'}
                          </span>
                          {order.delivery_method === 'shipping' && order.shipping_address && (
                            <p className="text-[11px] text-[var(--text-primary)] line-clamp-2" title={`${order.shipping_address}${order.shipping_city ? `, ${order.shipping_city}` : ''}${order.shipping_postal_code ? ` (${order.shipping_postal_code})` : ''}`}>
                              <FaMapMarkerAlt className="inline mr-1 text-[var(--primary)]" size={10} />
                              {order.shipping_address}
                              {order.shipping_city ? `, ${order.shipping_city}` : ''}
                              {order.shipping_postal_code ? ` (${order.shipping_postal_code})` : ''}
                            </p>
                          )}
                          {(order.shipping_courier || order.tracking_number) && (
                            <p className="text-[10px] font-mono text-[var(--text-primary)] bg-[var(--background)] border border-[var(--border)] px-2 py-0.5 rounded inline-block">
                              {order.shipping_courier || 'Kurir'}{order.tracking_number ? `: ${order.tracking_number}` : ''}
                            </p>
                          )}
                          {order.catatan && (
                            <p className="text-[10px] text-[var(--text-secondary)] truncate" title={order.catatan}>Catatan: {order.catatan}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center space-y-1">
                          <CustomSelect
                            value={order.status}
                            onChange={e => onMerchOrderStatusChange(order.id, e.target.value)}
                            variant="status"
                            options={[
                              { value: 'pending', label: 'Pending' },
                              { value: 'paid', label: 'Lunas' },
                              { value: 'packing', label: 'Dikemas' },
                              { value: 'shipped', label: 'Sudah Dikirim' },
                              { value: 'completed', label: 'Selesai' },
                              { value: 'cancelled', label: 'Dibatalkan' }
                            ]}
                          />
                          {order.status === 'completed' && order.confirmed_by && (
                            <p className="text-[10px] text-emerald-400 font-semibold">
                              {order.confirmed_by === 'customer' ? 'Dikonfirmasi User' : 'Dikonfirmasi Admin'}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openShippingModal(order)}
                              className="text-[var(--primary)] hover:text-white p-2 hover:bg-[var(--primary)]/20 rounded-lg transition-colors"
                              title="Atur Status & Resi Pengiriman"
                            >
                              <FaTruck />
                            </button>
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

      {/* Modal Atur Status & Resi Pengiriman Merch */}
      {editingShippingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <form
            onSubmit={handleSaveShippingModal}
            className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight">
                  Status & Resi Pengiriman
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono">
                  #{editingShippingOrder.order_number} — {editingShippingOrder.nama_lengkap || editingShippingOrder.whatsapp}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingShippingOrder(null)}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            {editingShippingOrder.delivery_method === 'shipping' && editingShippingOrder.shipping_address && (
              <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                <p className="font-bold text-[var(--text-primary)] mb-0.5 flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-[var(--primary)]" /> Alamat Tujuan:
                </p>
                <p>
                  {editingShippingOrder.shipping_address}
                  {editingShippingOrder.shipping_city ? `, ${editingShippingOrder.shipping_city}` : ''}
                  {editingShippingOrder.shipping_postal_code ? ` (${editingShippingOrder.shipping_postal_code})` : ''}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Status Pesanan</label>
              <CustomSelect
                value={shippingForm.status}
                onChange={e => setShippingForm({ ...shippingForm, status: e.target.value })}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'paid', label: 'Lunas / Terverifikasi' },
                  { value: 'packing', label: 'Dikemas' },
                  { value: 'shipped', label: 'Sudah Dikirim' },
                  { value: 'completed', label: 'Selesai (Konfirmasi Admin)' },
                  { value: 'cancelled', label: 'Dibatalkan' }
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Kurir / Ekspedisi <span className="font-normal">(opsional, misal JNT, JNE, SiCepat)</span>
              </label>
              <input
                type="text"
                value={shippingForm.shipping_courier}
                onChange={e => setShippingForm({ ...shippingForm, shipping_courier: e.target.value })}
                placeholder="Contoh: J&T Express / JNE Reguler"
                className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Nomor Resi <span className="font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={shippingForm.tracking_number}
                onChange={e => setShippingForm({ ...shippingForm, tracking_number: e.target.value })}
                placeholder="Contoh: JP1234567890"
                className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-mono rounded-xl focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setEditingShippingOrder(null)}
                className="px-4 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[var(--primary)] text-[var(--text-primary)] text-xs font-black hover:bg-[var(--primary)]/85"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default OrdersTab




