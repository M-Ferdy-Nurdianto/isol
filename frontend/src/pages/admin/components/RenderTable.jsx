import React from 'react'
import { FaEye, FaTrash, FaImage, FaFileAlt, FaSpinner } from 'react-icons/fa'
import CustomSelect from './CustomSelect'

// ─── Status badge helper ───────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    pending:   { label: 'Unchecked', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    checked:   { label: 'Checked',   cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
    completed: { label: 'Completed', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  }
  const s = map[status] || { label: status, cls: 'bg-white/10 text-zinc-300 border-white/10' }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${s.cls}`}>
      {s.label}
    </span>
  )
}

// ─── Mobile Card ───────────────────────────────────────────────────────────────
const OrderCard = ({ order, onView, onDelete, onStatusChange }) => {
  const isSpecial = order.events?.type === 'special' || !!order.events?.theme_color
  const themeColor = isSpecial ? order.events?.theme_color : null

  const borderStyle = themeColor
    ? { borderLeftColor: themeColor, borderLeftWidth: '3px' }
    : {}

  const contactLine = order.whatsapp && order.whatsapp !== '-'
    ? `WA: ${order.whatsapp}`
    : order.instagram && order.instagram !== '-'
    ? `IG: ${order.instagram}`
    : null

  const paymentBadge = order.is_ots
    ? (order.payment_proof_url === 'QR'
        ? { label: 'OTS · QRIS', cls: 'bg-purple-500/10 text-purple-300 border-purple-500/20' }
        : { label: 'OTS · Cash', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' })
    : null

  return (
    <div
      className="bg-[#111726]/90 border border-white/10 rounded-2xl overflow-hidden shadow-lg"
      style={borderStyle}
    >
      {/* ── TOP: order number + nama + badges (OTS/Payment/Status/Bukti) ── */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-zinc-400">
              {order.order_number}
            </span>
            {isSpecial && (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border"
                style={{ color: themeColor, borderColor: themeColor, background: `${themeColor}15` }}>
                Special
              </span>
            )}
          </div>
          <div className="text-sm font-black text-white mt-0.5 truncate">
            {order.nama_lengkap}
          </div>
          {contactLine && (
            <div className="text-[11px] text-[#00e5e5] mt-0.5">{contactLine}</div>
          )}
        </div>

        {/* Grouped tags: payment method / proof + status badge */}
        <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
          {!order.is_ots && order.payment_proof_url ? (
            <a
              href={order.payment_proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[#00e5e5] bg-[#00e5e5]/10 border border-[#00e5e5]/20 px-2 py-0.5 rounded-lg font-bold transition hover:bg-[#00e5e5]/20"
            >
              <FaImage className="text-[9px]" /> Bukti
            </a>
          ) : paymentBadge ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${paymentBadge.cls}`}>
              {paymentBadge.label}
            </span>
          ) : null}
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* ── MIDDLE: items + notes ── */}
      <div className="px-4 py-2 border-t border-white/5">
        <div className="space-y-0.5">
          {order.order_items?.length > 0
            ? order.order_items.map((item, idx) => (
                <div key={idx} className="text-xs text-zinc-300 flex items-center gap-1">
                  <span className="font-medium">{item.item_name}</span>
                  <span className="text-zinc-500 font-bold">×{item.quantity}</span>
                </div>
              ))
            : <span className="text-zinc-500 text-xs">Tidak ada item</span>
          }
        </div>
        {order.catatan && (
          <div className="mt-2 flex items-start gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
            <FaFileAlt className="text-zinc-400 text-[10px] mt-0.5 shrink-0" />
            <span className="text-[11px] text-zinc-300 leading-snug">{order.catatan}</span>
          </div>
        )}
      </div>

      {/* ── BOTTOM: tanggal + total + status select + actions ── */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between gap-2 bg-[#161f33]/50">
        {/* Left: price + metadata */}
        <div>
          <div className="text-base font-black text-[#079108]">
            Rp {order.total_harga?.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {new Date(order.created_at).toLocaleDateString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric'
            })}
          </div>
        </div>

        {/* Right: status select + actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <CustomSelect
            value={order.status}
            onChange={(e) => onStatusChange(order.id, e.target.value)}
            variant="status"
            options={[
              { value: 'pending',   label: 'Unchecked' },
              { value: 'checked',   label: 'Checked' },
              { value: 'completed', label: 'Completed' },
            ]}
          />

          <button
            onClick={() => onView(order)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors border border-white/10"
            title="Detail Order"
          >
            <FaEye className="text-xs" />
          </button>

          <button
            onClick={() => onDelete(order.id)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
            title="Hapus Order"
          >
            <FaTrash className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main RenderTable ──────────────────────────────────────────────────────────
const RenderTable = ({ data, title, icon, emptyMessage, action, loading, onView, onDelete, onStatusChange }) => {
  return (
    <div className="bg-[#111726]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#161f33]/80">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-base md:text-lg font-bold text-white truncate">
            {title}
          </h3>
          <span className="text-[11px] md:text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10 shrink-0">
            {data.length} items
          </span>
        </div>
        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>

      {/* ── MOBILE: Card List (< md) ── */}
      <div className="md:hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <FaSpinner className="animate-spin text-3xl text-[#079108]" />
            <p className="text-xs text-zinc-400">Memuat data order...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="py-14 text-center text-zinc-400 text-sm px-4">
            {emptyMessage}
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {data.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onView={onView}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP: Table (≥ md) ── */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[1000px] text-left border-collapse">
          <thead className="bg-[#182035] text-zinc-300 uppercase text-[11px] font-bold tracking-wider border-b border-white/10">
            <tr>
              <th className="px-4 py-3.5">Order #</th>
              <th className="px-4 py-3.5">Nama</th>
              <th className="px-4 py-3.5">Items</th>
              <th className="px-4 py-3.5">Bukti Bayar</th>
              <th className="px-4 py-3.5">Total</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Tanggal</th>
              <th className="px-4 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-zinc-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-12">
                  <FaSpinner className="animate-spin text-3xl text-[#079108] mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">Memuat data order...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-12 text-zinc-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((order) => {
                const isSpecial = order.events?.type === 'special' || !!order.events?.theme_color
                const themeColor = isSpecial ? order.events?.theme_color : order.is_merch ? '#079108' : null

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-white/[0.04] transition-colors duration-150"
                    style={themeColor ? { borderLeft: `4px solid ${themeColor}` } : {}}
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-white">
                      {order.order_number}
                      {isSpecial && (
                        <div className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color: themeColor }}>
                          Special
                        </div>
                      )}
                      {order.is_merch && (
                        <div className="text-[9px] font-black uppercase tracking-wider text-[#079108] mt-0.5">
                          Merch
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white">{order.nama_lengkap}</div>
                      <div className="text-xs text-[#00e5e5] font-medium mt-0.5">
                        {order.whatsapp && order.whatsapp !== '-' ? `WA: ${order.whatsapp}` : order.instagram && order.instagram !== '-' ? `IG: ${order.instagram}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        {order.order_items?.map((item, idx) => (
                          <div key={idx} className="text-xs text-zinc-300">
                            <span className="font-medium">{item.item_name}</span>
                            <span className="text-zinc-400 font-bold ml-1">x{item.quantity}</span>
                          </div>
                        )) || <span className="text-zinc-500 text-xs">No items</span>}
                        {order.catatan && (
                          <div className="mt-1 text-[10px] text-zinc-300 bg-white/5 border border-white/10 rounded-md px-2 py-0.5 max-w-[250px] truncate flex items-center gap-1" title={order.catatan}>
                            <FaFileAlt className="flex-shrink-0 text-zinc-400" /> {order.catatan}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {!order.is_ots && order.payment_proof_url ? (
                        <a
                          href={order.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#00e5e5] hover:underline bg-[#00e5e5]/10 px-2.5 py-1 rounded-lg border border-[#00e5e5]/20 font-medium transition-colors"
                        >
                          <FaImage /> Lihat Bukti
                        </a>
                      ) : order.is_ots ? (
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                          order.payment_proof_url === 'QR'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        }`}>
                          OTS: {order.payment_proof_url?.startsWith('data:') || order.payment_proof_url?.startsWith('http') ? 'Cash' : (order.payment_proof_url || 'Cash')}
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#079108] text-sm">
                      Rp {order.total_harga?.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3.5">
                      <CustomSelect
                        value={order.status}
                        onChange={(e) => onStatusChange(order.id, e.target.value)}
                        variant="status"
                        options={[
                          { value: 'pending',   label: 'Unchecked' },
                          { value: 'checked',   label: 'Checked' },
                          { value: 'completed', label: 'Completed' },
                        ]}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-400 font-medium">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onView(order)}
                          className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                          title="Detail Order"
                        >
                          <FaEye className="text-base" />
                        </button>
                        <button
                          onClick={() => onDelete(order.id)}
                          className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Hapus Order"
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
  )
}

export default RenderTable
