import React, { useState, useRef } from 'react'
import Swal from 'sweetalert2'
import { FaShoppingCart, FaPlus, FaTimes, FaFileExcel, FaBox, FaEye, FaTrash, FaStar, FaTruck, FaClipboardList, FaStore, FaMapMarkerAlt, FaEdit, FaWhatsapp } from 'react-icons/fa'
import RenderTable from '../components/RenderTable'
import CustomSelect from '../components/CustomSelect'
import ExportModal from '../../../components/ExportModal'
import OTSOrderInlineForm from '../components/OTSOrderInlineForm'
import ManualMerchOrderModal from '../components/ManualMerchOrderModal'

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

  const hasActiveFilter = statusFilter !== 'all' || eventFilter !== 'all' || dateFilter !== 'all' || !!searchQuery

  const handleResetFilters = () => {
    setStatusFilter('all')
    setEventFilter('all')
    setDateFilter('all')
    if (setDateFrom) setDateFrom('')
    if (setDateTo) setDateTo('')
    setSearchQuery('')
  }

  const [showExportModal, setShowExportModal] = useState(false)
  const [showInlineOTS, setShowInlineOTS] = useState(false)
  const [showManualMerchModal, setShowManualMerchModal] = useState(false)
  const [editingShippingOrder, setEditingShippingOrder] = useState(null)
  const [shippingForm, setShippingForm] = useState({
    status: 'shipped',
    delivery_method: 'shipping',
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_courier: '',
    tracking_number: '',
    catatan: ''
  })
  const otsTopRef = useRef(null)

  const openShippingModal = (order) => {
    setEditingShippingOrder(order)
    setShippingForm({
      status: order.status === 'pending' ? 'paid' : order.status,
      delivery_method: order.delivery_method || 'shipping',
      shipping_address: order.shipping_address || '',
      shipping_city: order.shipping_city || '',
      shipping_postal_code: order.shipping_postal_code || '',
      shipping_courier: order.shipping_courier || '',
      tracking_number: order.tracking_number || '',
      catatan: order.catatan || ''
    })
  }

  const handleSaveShippingModal = async (e) => {
    e.preventDefault()
    if (!editingShippingOrder) return

    if (shippingForm.delivery_method === 'shipping') {
      if (!shippingForm.shipping_address || shippingForm.shipping_address.trim().length < 5) {
        Swal.fire({
          icon: 'warning',
          title: 'Alamat Belum Lengkap',
          text: 'Harap masukkan alamat pengiriman minimal 5 karakter jika metode adalah Dikirim.'
        })
        return
      }
      if (!shippingForm.shipping_city || shippingForm.shipping_city.trim().length < 2) {
        Swal.fire({
          icon: 'warning',
          title: 'Kota Belum Diisi',
          text: 'Harap masukkan kota/kabupaten tujuan pengiriman.'
        })
        return
      }
    }

    await onMerchOrderStatusChange(editingShippingOrder.id, shippingForm.status, {
      delivery_method: shippingForm.delivery_method,
      shipping_address: shippingForm.delivery_method === 'shipping' ? shippingForm.shipping_address.trim() : null,
      shipping_city: shippingForm.delivery_method === 'shipping' ? shippingForm.shipping_city.trim() : null,
      shipping_postal_code: shippingForm.delivery_method === 'shipping' ? (shippingForm.shipping_postal_code?.trim() || null) : null,
      shipping_courier: shippingForm.delivery_method === 'shipping' ? (shippingForm.shipping_courier?.trim() || null) : null,
      tracking_number: shippingForm.delivery_method === 'shipping' ? (shippingForm.tracking_number?.trim() || null) : null,
      catatan: shippingForm.catatan?.trim() || null
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

        <div className="flex gap-3 justify-between items-center border-t border-[var(--border)] pt-4 flex-wrap">
          {hasActiveFilter ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)]">Filter aktif:</span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--danger)]/15 hover:bg-[var(--danger)]/25 text-[var(--danger)] border border-[var(--danger)]/30 rounded-lg text-xs font-bold transition-all"
              >
                <FaTimes className="text-[10px]" /> Reset Semua Filter
              </button>
            </div>
          ) : (
            <div />
          )}

          <div className="flex gap-3 items-center">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--border)] hover:bg-[var(--primary)]/15 text-[var(--text-primary)] rounded-xl transition-all text-xs font-bold border border-[var(--border)] active:scale-95"
            >
              <FaFileExcel /> Export Data
            </button>
          </div>
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
          <div className="flex justify-between items-center flex-wrap gap-3 pr-14 md:pr-16">
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">Order Merch</h3>
            <div className="flex gap-2 flex-wrap items-center">
              <button
                type="button"
                onClick={() => setShowManualMerchModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-black font-black hover:bg-[var(--primary)]/90 flex items-center gap-2 text-xs transition-all shadow-[0_2px_10px_rgba(232,148,74,0.3)] active:scale-95"
              >
                <FaPlus size={11} /> Input Order Merch (OTS / DM)
              </button>
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
            {(merchOrderStatusFilter !== 'all' || !!merchOrderSearch) && (
              <button
                type="button"
                onClick={() => {
                  setMerchOrderStatusFilter('all')
                  setMerchOrderSearch('')
                  setTimeout(() => onFetchMerchOrders && onFetchMerchOrders(), 10)
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[var(--danger)]/15 hover:bg-[var(--danger)]/25 text-[var(--danger)] border border-[var(--danger)]/30 rounded-xl text-xs font-bold transition-all"
              >
                <FaTimes className="text-[10px]" /> Reset
              </button>
            )}
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
                          <p className="text-xs text-[var(--text-secondary)] font-medium">WA: {order.whatsapp}</p>
                          {order.instagram && <p className="text-xs text-[var(--text-secondary)]/80">IG: {order.instagram}</p>}
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
                        <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)] max-w-[260px] space-y-1.5">
                          <button
                            type="button"
                            onClick={() => openShippingModal(order)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer group select-none ${
                              order.delivery_method === 'shipping'
                                ? 'bg-[var(--surface)] text-[var(--primary)] border-[var(--primary)]/30 hover:border-[var(--primary)] hover:bg-[var(--primary)]/10'
                                : 'bg-[var(--surface)] text-amber-300 border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10'
                            }`}
                            title="Klik untuk ubah metode pengiriman atau alamat"
                          >
                            {order.delivery_method === 'shipping' ? <FaTruck size={10} /> : <FaStore size={10} />}
                            <span>{order.delivery_method === 'shipping' ? 'Dikirim' : 'Ambil di Event'}</span>
                            <FaEdit size={8} className="opacity-50 group-hover:opacity-100 ml-0.5" />
                          </button>
                          {order.delivery_method === 'shipping' && order.shipping_address && (
                            <p className="text-[11px] text-[var(--text-primary)] line-clamp-2" title={`${order.shipping_address}${order.shipping_city ? `, ${order.shipping_city}` : ''}${order.shipping_postal_code ? ` (${order.shipping_postal_code})` : ''}`}>
                              <FaMapMarkerAlt className="inline mr-1 text-[var(--primary)] shrink-0" size={10} />
                              <span>{order.shipping_address}{order.shipping_city ? `, ${order.shipping_city}` : ''}{order.shipping_postal_code ? ` (${order.shipping_postal_code})` : ''}</span>
                            </p>
                          )}
                          {(order.shipping_courier || order.tracking_number) && (
                            <p className="text-[10px] font-mono text-[var(--text-primary)] bg-[var(--background)] border border-[var(--border)] px-2 py-0.5 rounded inline-block">
                              {order.shipping_courier || 'Kurir'}{order.tracking_number ? `: ${order.tracking_number}` : ''}
                            </p>
                          )}
                          {order.catatan && (
                            <p className="text-[10px] text-[var(--text-secondary)] italic truncate" title={order.catatan}>Catatan: {order.catatan}</p>
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
                              title="Ubah Pengiriman & Status Pesanan"
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

      {/* Modal Atur Pengiriman, Alamat & Resi Merch */}
      {editingShippingOrder && (
        <>
          {/* ======================================================== */}
          {/* 1. DESKTOP MODAL (hidden md:flex) - 2 Kolom Lebar        */}
          {/* Fixed Header + Fixed Sticky Footer (Simpan Selalu Tampak) */}
          {/* ======================================================== */}
          <div className="fixed inset-0 z-50 hidden md:flex items-center justify-center p-6 bg-black/85">
            <div
              className="absolute inset-0"
              onClick={() => setEditingShippingOrder(null)}
            />
            <form
              onSubmit={handleSaveShippingModal}
              className="relative w-full max-w-4xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden z-10"
            >
              {/* Header Modal (Fixed, Never scrolls) */}
              <div className="px-6 py-4 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] text-lg shrink-0">
                    <FaTruck />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
                      Pengiriman & Status Pesanan
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--background)] px-2 py-0.5 rounded border border-[var(--border)]">
                        #{editingShippingOrder.order_number}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">·</span>
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {editingShippingOrder.nama_lengkap || 'Customer'}
                      </span>
                      {editingShippingOrder.whatsapp && (
                        <a
                          href={`https://wa.me/${String(editingShippingOrder.whatsapp).replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition ml-1"
                          title="Hubungi pembeli di WhatsApp"
                        >
                          <FaWhatsapp size={12} /> WA: {editingShippingOrder.whatsapp}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">Total Order</div>
                    <div className="text-sm font-black text-[var(--primary)]">
                      Rp {(editingShippingOrder.total_harga || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingShippingOrder(null)}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--border)] transition ml-1"
                    title="Tutup Modal"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
              </div>

              {/* Body Modal (2 Kolom Grid, Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-12 gap-6">
                  {/* Kolom Kiri: Rincian Order & Status (5 Kolom) */}
                  <div className="col-span-5 space-y-4">
                    {/* Ringkasan Item Pesanan */}
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                          <FaBox className="text-[var(--primary)] text-xs" /> Item Dipesan ({editingShippingOrder.merch_order_items?.length || 0})
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                          {new Date(editingShippingOrder.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {editingShippingOrder.merch_order_items && editingShippingOrder.merch_order_items.length > 0 ? (
                          editingShippingOrder.merch_order_items.map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between text-xs py-1 border-b border-[var(--border)]/40 last:border-0">
                              <div>
                                <p className="font-bold text-[var(--text-primary)] leading-tight">{item.item_name}</p>
                                {item.size && (
                                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">Ukuran: {item.size}</span>
                                )}
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <span className="font-mono font-bold text-[var(--primary)]">x{item.quantity}</span>
                                {item.subtotal_price && (
                                  <p className="text-[10px] text-[var(--text-secondary)]">Rp {Number(item.subtotal_price).toLocaleString('id-ID')}</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[var(--text-secondary)] italic">Tidak ada rincian item.</p>
                        )}
                      </div>
                    </div>

                    {/* Status Pesanan */}
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 space-y-2">
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        Status Pesanan <span className="text-red-400">*</span>
                      </label>
                      <CustomSelect
                        value={shippingForm.status}
                        onChange={e => setShippingForm({ ...shippingForm, status: e.target.value })}
                        options={[
                          { value: 'pending', label: 'Pending (Menunggu Verifikasi)' },
                          { value: 'paid', label: 'Lunas / Terverifikasi' },
                          { value: 'packing', label: 'Sedang Dikemas' },
                          { value: 'shipped', label: 'Sudah Dikirim' },
                          { value: 'completed', label: 'Selesai (Konfirmasi Admin)' },
                          { value: 'cancelled', label: 'Dibatalkan' }
                        ]}
                      />
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                        Status saat ini: <span className="font-bold text-[var(--primary)]">{shippingForm.status.toUpperCase()}</span>
                      </p>
                    </div>

                    {/* Catatan / Permintaan Khusus */}
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 space-y-1.5">
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        Catatan Khusus <span className="font-normal text-[10px] text-[var(--text-secondary)]">(opsional)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={shippingForm.catatan}
                        onChange={e => setShippingForm({ ...shippingForm, catatan: e.target.value })}
                        placeholder="Catatan dari pembeli atau instruksi pengiriman staff..."
                        className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)] resize-none"
                      />
                    </div>
                  </div>

                  {/* Kolom Kanan: Metode & Detail Pengiriman (7 Kolom) */}
                  <div className="col-span-7 space-y-4">
                    {/* Selector Metode Pengiriman */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Metode Pengambilan / Pengiriman <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setShippingForm(prev => ({ ...prev, delivery_method: 'pickup_event' }))}
                          className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                            shippingForm.delivery_method === 'pickup_event'
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500 shadow-md'
                              : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/40 hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-xs">
                            <FaStore className="text-sm shrink-0" /> Ambil di Event
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                            Diambil langsung pembeli di booth official venue
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShippingForm(prev => ({ ...prev, delivery_method: 'shipping' }))}
                          className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                            shippingForm.delivery_method === 'shipping'
                              ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)] ring-1 ring-[var(--primary)] shadow-md'
                              : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/40 hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-xs">
                            <FaTruck className="text-sm shrink-0" /> Dikirim ke Alamat
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                            Dikirim ekspedisi via kurir ke alamat pembeli
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Jika Dikirim ke Alamat */}
                    {shippingForm.delivery_method === 'shipping' ? (
                      <div className="space-y-4 p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] border-b border-[var(--border)] pb-2.5">
                          <FaMapMarkerAlt size={13} /> Detail Alamat & Ekspedisi Pengiriman
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                            Alamat Lengkap <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            rows={3}
                            value={shippingForm.shipping_address}
                            onChange={e => setShippingForm({ ...shippingForm, shipping_address: e.target.value })}
                            placeholder="Nama jalan, nomor rumah/kantor, RT/RW, kelurahan, kecamatan"
                            className="w-full px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)] resize-none"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                              Kota / Kabupaten <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={shippingForm.shipping_city}
                              onChange={e => setShippingForm({ ...shippingForm, shipping_city: e.target.value })}
                              placeholder="Contoh: Jakarta Selatan"
                              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)]"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                              Kode Pos <span className="font-normal text-[10px] text-[var(--text-secondary)]">(opsional)</span>
                            </label>
                            <input
                              type="text"
                              value={shippingForm.shipping_postal_code}
                              onChange={e => setShippingForm({ ...shippingForm, shipping_postal_code: e.target.value })}
                              placeholder="Contoh: 12810"
                              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-mono rounded-xl focus:outline-none focus:border-[var(--primary)]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]/60">
                          <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                              Kurir / Ekspedisi <span className="font-normal text-[10px] text-[var(--text-secondary)]">(opsional)</span>
                            </label>
                            <input
                              type="text"
                              value={shippingForm.shipping_courier}
                              onChange={e => setShippingForm({ ...shippingForm, shipping_courier: e.target.value })}
                              placeholder="JNE, J&T, SiCepat, Wahana, dll"
                              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                              Nomor Resi <span className="font-normal text-[10px] text-[var(--text-secondary)]">(opsional)</span>
                            </label>
                            <input
                              type="text"
                              value={shippingForm.tracking_number}
                              onChange={e => setShippingForm({ ...shippingForm, tracking_number: e.target.value })}
                              placeholder="Contoh: JP1234567890"
                              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-mono rounded-xl focus:outline-none focus:border-[var(--primary)]"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-3">
                        <p className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                          <FaStore size={14} /> Pengambilan Langsung di Venue
                        </p>
                        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                          Pesanan ini disiapkan untuk diambil langsung oleh pembeli di booth merchandise resmi Kohi Sekai pada saat event berlangsung.
                        </p>
                        <div className="p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--text-primary)] space-y-1.5">
                          <p className="font-bold text-[var(--primary)]">Petunjuk Operasional Booth:</p>
                          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
                            <li>Cukup tunjukkan Order #{editingShippingOrder.order_number} atau nama "{editingShippingOrder.nama_lengkap}"</li>
                            <li>Pastikan status telah diverifikasi menjadi "Lunas" sebelum barang diserahkan ke pembeli</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer (Fixed Sticky at Bottom) */}
              <div className="px-6 py-4 bg-[var(--background)] border-t border-[var(--border)] flex items-center justify-between shrink-0">
                <span className="text-xs text-[var(--text-secondary)]">
                  Semua perubahan status & pengiriman langsung tersinkronisasi.
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingShippingOrder(null)}
                    className="px-5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/40 transition active:scale-95"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-black text-xs font-black hover:bg-[var(--primary)]/90 transition shadow-lg active:scale-95 flex items-center gap-2"
                  >
                    <FaTruck size={12} /> Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* ======================================================== */}
          {/* 2. MOBILE BOTTOM-SHEET MODAL (md:hidden)                  */}
          {/* Slide up dari bawah, drag bar, tombol submit sticky bawah */}
          {/* ======================================================== */}
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/85">
            <div
              className="absolute inset-0"
              onClick={() => setEditingShippingOrder(null)}
            />
            <form
              onSubmit={handleSaveShippingModal}
              className="relative w-full max-h-[92vh] bg-[var(--surface)] border-t border-[var(--border)] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-slide-up"
            >
              {/* Handle bar */}
              <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto my-3 shrink-0" />

              {/* Mobile Header */}
              <div className="px-5 pb-3 border-b border-[var(--border)] flex items-start justify-between shrink-0">
                <div>
                  <h3 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
                    <FaTruck className="text-[var(--primary)] text-sm" /> Pengiriman & Status
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[var(--primary)]">
                      #{editingShippingOrder.order_number}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">·</span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {editingShippingOrder.nama_lengkap || 'Customer'}
                    </span>
                    {editingShippingOrder.whatsapp && (
                      <a
                        href={`https://wa.me/${String(editingShippingOrder.whatsapp).replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      >
                        <FaWhatsapp size={10} /> WA
                      </a>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingShippingOrder(null)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--border)] transition"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {/* Mobile Body (Scrollable 1 Kolom) */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {/* Ringkasan Item Pesanan */}
                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] border-b border-[var(--border)] pb-1.5">
                    <span className="flex items-center gap-1.5 text-[var(--primary)]">
                      <FaBox size={11} /> Item ({editingShippingOrder.merch_order_items?.length || 0})
                    </span>
                    <span className="text-[var(--primary)] font-black">
                      Rp {(editingShippingOrder.total_harga || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                    {editingShippingOrder.merch_order_items && editingShippingOrder.merch_order_items.length > 0 ? (
                      editingShippingOrder.merch_order_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-[var(--text-primary)] truncate max-w-[200px]">
                            {item.item_name} {item.size ? `(${item.size})` : ''}
                          </span>
                          <span className="font-mono font-bold text-[var(--primary)] shrink-0">x{item.quantity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-[var(--text-secondary)] italic">Tidak ada rincian item.</p>
                    )}
                  </div>
                </div>

                {/* Metode Pengambilan / Pengiriman */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Metode Pengiriman <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShippingForm(prev => ({ ...prev, delivery_method: 'pickup_event' }))}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        shippingForm.delivery_method === 'pickup_event'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                          : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <FaStore className="text-xs shrink-0" /> Ambil di Event
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)]">Booth venue</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShippingForm(prev => ({ ...prev, delivery_method: 'shipping' }))}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        shippingForm.delivery_method === 'shipping'
                          ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)] ring-1 ring-[var(--primary)]'
                          : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <FaTruck className="text-xs shrink-0" /> Dikirim
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)]">Ekspedisi kurir</p>
                    </button>
                  </div>
                </div>

                {/* Form Alamat jika shipping */}
                {shippingForm.delivery_method === 'shipping' ? (
                  <div className="space-y-3 p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)]">
                      <FaMapMarkerAlt size={12} /> Detail Alamat Pengiriman
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                        Alamat Lengkap <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={shippingForm.shipping_address}
                        onChange={e => setShippingForm({ ...shippingForm, shipping_address: e.target.value })}
                        placeholder="Nama jalan, nomor rumah, RT/RW"
                        className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)] resize-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                          Kota <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingForm.shipping_city}
                          onChange={e => setShippingForm({ ...shippingForm, shipping_city: e.target.value })}
                          placeholder="Jakarta Selatan"
                          className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                          Kode Pos
                        </label>
                        <input
                          type="text"
                          value={shippingForm.shipping_postal_code}
                          onChange={e => setShippingForm({ ...shippingForm, shipping_postal_code: e.target.value })}
                          placeholder="12810"
                          className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-mono rounded-xl focus:outline-none focus:border-[var(--primary)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)]/60">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                          Kurir
                        </label>
                        <input
                          type="text"
                          value={shippingForm.shipping_courier}
                          onChange={e => setShippingForm({ ...shippingForm, shipping_courier: e.target.value })}
                          placeholder="JNE, J&T"
                          className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                          Nomor Resi
                        </label>
                        <input
                          type="text"
                          value={shippingForm.tracking_number}
                          onChange={e => setShippingForm({ ...shippingForm, tracking_number: e.target.value })}
                          placeholder="Resi"
                          className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-mono rounded-xl focus:outline-none focus:border-[var(--primary)]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-1">
                    <p className="font-bold text-amber-300 flex items-center gap-1.5">
                      <FaStore size={12} /> Ambil di Booth Venue
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Pesanan diambil langsung di booth merchandise event oleh pembeli.
                    </p>
                  </div>
                )}

                {/* Status Pesanan */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    Status Pesanan
                  </label>
                  <CustomSelect
                    value={shippingForm.status}
                    onChange={e => setShippingForm({ ...shippingForm, status: e.target.value })}
                    options={[
                      { value: 'pending', label: 'Pending (Menunggu Verifikasi)' },
                      { value: 'paid', label: 'Lunas / Terverifikasi' },
                      { value: 'packing', label: 'Sedang Dikemas' },
                      { value: 'shipped', label: 'Sudah Dikirim' },
                      { value: 'completed', label: 'Selesai (Konfirmasi Admin)' },
                      { value: 'cancelled', label: 'Dibatalkan' }
                    ]}
                  />
                </div>

                {/* Catatan Pembeli */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Catatan Pembeli <span className="font-normal text-[10px] text-[var(--text-secondary)]">(opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={shippingForm.catatan}
                    onChange={e => setShippingForm({ ...shippingForm, catatan: e.target.value })}
                    placeholder="Catatan dari pembeli atau instruksi staff..."
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:outline-none focus:border-[var(--primary)] resize-none"
                  />
                </div>
              </div>

              {/* Mobile Sticky Footer */}
              <div className="p-4 bg-[var(--background)] border-t border-[var(--border)] flex gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingShippingOrder(null)}
                  className="w-1/3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] active:scale-95 text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-[var(--primary)] text-black text-xs font-black active:scale-95 text-center shadow-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Modal Input Order Merchandise Manual (OTS Venue / Pesanan DM) */}
      {showManualMerchModal && (
        <ManualMerchOrderModal
          isOpen={showManualMerchModal}
          onClose={() => setShowManualMerchModal(false)}
          merch={merch}
          onSuccess={onFetchMerchOrders}
        />
      )}
    </div>
  )
}

export default OrdersTab




