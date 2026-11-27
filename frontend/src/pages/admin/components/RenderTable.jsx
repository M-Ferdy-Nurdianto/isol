import React from 'react'
import { FaEye, FaEdit, FaTrash, FaImage, FaSpinner } from 'react-icons/fa'
import CustomSelect from './CustomSelect'

// ─── Mobile Card ───────────────────────────────────────────────────────────────
const OrderCard = ({ order, isUpdating, onView, onEditOTS, onDelete, onStatusChange }) => {
  const isSpecial = order.events?.type === 'special' || !!order.events?.theme_color
  const themeColor = isSpecial ? (order.events?.theme_color || '#A855F7') : null

  const borderStyle = themeColor
    ? { borderLeftColor: themeColor, borderLeftWidth: '3px' }
    : {}

  const contactLine = order.instagram && order.instagram.trim() && order.instagram !== '-'
    ? `IG: ${order.instagram}`
    : order.whatsapp && order.whatsapp.trim() && order.whatsapp !== '-'
      ? `WA: ${order.whatsapp}`
      : null

  const paymentMethod = order.payment_proof_url?.startsWith('data:') || order.payment_proof_url?.startsWith('http')
    ? 'Cash'
    : (order.payment_proof_url || 'Cash')
  const paymentLabel = paymentMethod === 'QR' ? 'QRIS' : paymentMethod
  const otsSourceLabel = order.created_by === 'customer' ? 'OTS - User' : 'OTS - Admin'

  const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  return (
    <div
      className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg"
      style={borderStyle}
    >
      {/* ── TOP: Source/Proof Badges (Order # hidden on web) ── */}
      <div className="px-3.5 pt-3.5 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {isSpecial && (
              <span
                className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border"
                style={{ color: themeColor, borderColor: themeColor, background: `${themeColor}15` }}
              >
                Special
              </span>
            )}
            {order.is_merch && (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-[var(--primary)]/40 text-[var(--primary)] bg-[var(--primary)]/10">
                Merch
              </span>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            {order.is_ots ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--background)] text-[var(--text-secondary)] border border-[var(--border)] whitespace-nowrap">
                {otsSourceLabel} • {paymentLabel}
              </span>
            ) : order.payment_proof_url ? (
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-[var(--primary)] bg-[var(--background)] border border-[var(--border)] px-2 py-0.5 rounded-md font-bold active:scale-95 transition"
              >
                <FaImage className="text-[9px]" /> Bukti
              </a>
            ) : null}
          </div>
        </div>

        {/* ── Buyer Name + Total Price ── */}
        <div className="flex items-baseline justify-between gap-3 mt-1.5">
          <div className="text-[15px] font-black text-[var(--text-primary)] truncate">
            {order.nama_lengkap}
          </div>
          <div className="text-[15px] font-black text-[var(--primary)] shrink-0 tabular-nums">
            Rp {order.total_harga?.toLocaleString('id-ID')}
          </div>
        </div>

        {/* ── Contact + Date Meta ── */}
        <div className="flex items-center justify-between gap-2 mt-0.5 text-[11px] text-[var(--text-secondary)]">
          <span className="truncate">{contactLine || formattedDate}</span>
          {contactLine && <span className="shrink-0">{formattedDate}</span>}
        </div>
      </div>

      {/* ── MIDDLE: Items ── */}
      <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--background)]/40">
        <div className="space-y-1">
          {order.order_items?.length > 0
            ? order.order_items.map((item, idx) => (
              <div key={idx} className="text-xs flex items-baseline justify-between gap-3">
                <span className="text-[var(--text-secondary)] font-medium leading-snug">
                  {item.item_name}
                </span>
                <span className="font-mono text-xs font-bold text-[var(--text-primary)] shrink-0 tabular-nums">
                  ×{item.quantity}
                </span>
              </div>
            ))
            : <span className="text-[var(--text-secondary)] text-xs">Tidak ada item</span>
          }
        </div>
        {order.catatan && (
          <div className="mt-2 bg-[#E5A93C] rounded-lg px-2.5 py-1.5">
            <span className="text-[11px] font-bold text-white leading-snug block">{order.catatan}</span>
          </div>
        )}
      </div>

      {/* ── BOTTOM: Touch-Friendly Actions ── */}
      <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--background)] flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <CustomSelect
            value={order.status === 'paid' || order.status === 'approved' ? 'checked' : order.status}
            onChange={(e) => onStatusChange(order.id, e.target.value)}
            loading={isUpdating}
            variant="status"
            options={[
              { value: 'pending', label: 'Unchecked' },
              { value: 'checked', label: 'Checked' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
        </div>
        {order.is_ots ? (
          <button
            type="button"
            onClick={() => (onEditOTS ? onEditOTS(order) : onView(order))}
            className="h-9 px-3 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--primary)]/15 text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors border border-[var(--border)] text-xs font-bold active:scale-95 shrink-0"
            title="Edit Order OTS"
          >
            <FaEdit className="text-xs" />
            <span>Edit</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onView(order)}
            className="h-9 px-3 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--primary)]/15 text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors border border-[var(--border)] text-xs font-bold active:scale-95 shrink-0"
            title="Detail Order"
          >
            <FaEye className="text-xs" />
            <span>Detail</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(order.id)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-[var(--danger)] transition-colors border border-[var(--danger)]/25 active:scale-95 shrink-0"
          title="Hapus Order"
        >
          <FaTrash className="text-xs" />
        </button>
      </div>
    </div>
  )
}

// ─── Main RenderTable ──────────────────────────────────────────────────────────
const RenderTable = ({ data, title, icon, emptyMessage, action, loading, updatingOrderIds, onView, onEditOTS, onDelete, onStatusChange }) => {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden mb-6">
      {/* Header Mobile (1 baris sejajar, simple & mudah dipencet) */}
      <div className="md:hidden px-3.5 py-3 border-b border-[var(--border)] flex items-center justify-between gap-2 bg-[var(--background)]">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
            {title}
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 shrink-0 tabular-nums">
            {data.length}
          </span>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Header Desktop */}
      <div className="hidden md:flex p-5 border-b border-[var(--border)] flex-wrap items-center justify-between gap-3 bg-[var(--background)]">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">
            {title}
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 shrink-0">
            {data.length} items
          </span>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Subtle indicator if background fetching is occurring while data is visible */}
      {loading && data && data.length > 0 && (
        <div className="h-0.5 w-full bg-[var(--border)] overflow-hidden">
          <div className="h-full bg-[var(--primary)] animate-pulse w-full" />
        </div>
      )}

      {/* ── MOBILE: Card List (< md) ── */}
      <div className="md:hidden">
        {loading && (!data || data.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <FaSpinner className="animate-spin text-3xl text-[var(--primary)]" />
            <p className="text-xs text-[var(--text-secondary)]">Memuat data order...</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-14 text-center text-[var(--text-secondary)] text-sm px-4">
            {emptyMessage}
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {data.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isUpdating={updatingOrderIds?.has(order.id)}
                onView={onView}
                onEditOTS={onEditOTS}
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
          <thead className="bg-[var(--background)] text-[var(--text-secondary)] uppercase text-[11px] font-bold tracking-wider border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3.5">Tanggal</th>
              <th className="px-4 py-3.5">Nama</th>
              <th className="px-4 py-3.5">Items</th>
              <th className="px-4 py-3.5">Bukti Bayar</th>
              <th className="px-4 py-3.5">Total</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-sm text-[var(--text-secondary)]">
            {loading && (!data || data.length === 0) ? (
              <tr>
                <td colSpan="7" className="text-center py-12">
                  <FaSpinner className="animate-spin text-3xl text-[var(--primary)] mx-auto mb-2" />
                  <p className="text-xs text-[var(--text-secondary)]">Memuat data order...</p>
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-[var(--text-secondary)] text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((order) => {
                const isSpecial = order.events?.type === 'special' || !!order.events?.theme_color
                const themeColor = isSpecial ? (order.events?.theme_color || '#A855F7') : null

                // Source & payment badge logic
                const paymentMethod = order.payment_proof_url?.startsWith('data:') || order.payment_proof_url?.startsWith('http')
                  ? 'Cash'
                  : (order.payment_proof_url || 'Cash')
                const otsSrcBadge = order.is_ots
                  ? { label: order.created_by === 'customer' ? 'OTS - User' : 'OTS - Admin', cls: 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)]' }
                  : null
                const otsPayBadge = order.is_ots
                  ? { label: paymentMethod === 'QR' ? 'QRIS' : paymentMethod, cls: 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)]' }
                  : null

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-[var(--primary)]/5 transition-colors duration-150"
                    style={themeColor ? { borderLeft: `4px solid ${themeColor}` } : {}}
                  >
                    <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)] font-medium whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[var(--text-primary)]">{order.nama_lengkap}</div>
                      <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                        {order.instagram && order.instagram.trim() && order.instagram !== '-'
                          ? `IG: ${order.instagram}`
                          : order.whatsapp && order.whatsapp.trim() && order.whatsapp !== '-'
                            ? `WA: ${order.whatsapp}`
                            : ''}
                      </div>
                      {(otsSrcBadge || isSpecial || order.is_merch) && (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {otsSrcBadge && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${otsSrcBadge.cls}`}>
                              {otsSrcBadge.label}
                            </span>
                          )}
                          {isSpecial && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border" style={{ color: themeColor, borderColor: themeColor }}>
                              Special
                            </span>
                          )}
                          {order.is_merch && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--primary)] px-1.5 py-0.5 rounded-md border border-[var(--primary)]/35">
                              Merch
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        {order.order_items?.map((item, idx) => (
                          <div key={idx} className="text-xs text-[var(--text-secondary)]">
                            <span className="font-medium">{item.item_name}</span>
                            <span className="text-[var(--text-secondary)] font-bold ml-1">x{item.quantity}</span>
                          </div>
                        )) || <span className="text-[var(--text-secondary)] text-xs">No items</span>}
                        {order.catatan && (
                          <div className="mt-1.5 inline-block text-[11px] font-bold text-white bg-[#E5A93C] rounded-md px-2.5 py-1 max-w-xs sm:max-w-sm whitespace-normal break-words [overflow-wrap:anywhere] leading-snug">
                            {order.catatan}
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
                          className="inline-flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline bg-[var(--background)] px-2.5 py-1 rounded-lg border border-[var(--border)] font-medium transition-colors whitespace-nowrap"
                          title="Lihat Bukti Pembayaran"
                        >
                          <FaImage /> Payment
                        </a>
                      ) : order.is_ots ? (
                        <div className="flex flex-col gap-1 items-start">
                          {otsPayBadge && (
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${otsPayBadge.cls}`}>
                              {otsPayBadge.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--text-secondary)] text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[var(--primary)] text-sm whitespace-nowrap tabular-nums">
                      Rp {order.total_harga?.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3.5">
                      <CustomSelect
                        value={order.status === 'paid' || order.status === 'approved' ? 'checked' : order.status}
                        onChange={(e) => onStatusChange(order.id, e.target.value)}
                        loading={updatingOrderIds?.has(order.id)}
                        variant="status"
                        options={[
                          { value: 'pending', label: 'Unchecked' },
                          { value: 'checked', label: 'Checked' },
                          { value: 'completed', label: 'Completed' },
                        ]}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        {order.is_ots ? (
                          <button
                            onClick={() => (onEditOTS ? onEditOTS(order) : onView(order))}
                            className="text-[var(--text-secondary)] hover:text-[var(--primary)] p-2 rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
                            title="Edit Order OTS"
                          >
                            <FaEdit className="text-base" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onView(order)}
                            className="text-[var(--text-secondary)] hover:text-[var(--primary)] p-2 rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
                            title="Detail Order"
                          >
                            <FaEye className="text-base" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(order.id)}
                          className="text-[var(--danger)] hover:text-[var(--danger)] p-2 rounded-lg hover:bg-[var(--danger)]/10 transition-colors"
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
