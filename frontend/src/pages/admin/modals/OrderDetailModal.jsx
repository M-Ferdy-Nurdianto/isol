import React from 'react'
import { FaDownload, FaTimes, FaEye } from 'react-icons/fa'
import { showToast } from '../../../lib/toast'

const OrderDetailModal = ({ isOpen = false, order, events = [], onClose }) => {
  if (!isOpen || !order) {
    return null
  }

  const generateReceipt = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const W = 500
    const pad = 30
    const lineH = 22

    const selectedEvent = events.find(e => e.id === order.event_id)
    const eventName = selectedEvent?.nama || order.event_name || '-'

    const items = order.order_items || []

    const logo = new Image()
    logo.src = '/images/logos/logo.svg'

    logo.onload = () => {
      let totalLines = 0
      totalLines += 8
      totalLines += 1
      totalLines += items.length
      totalLines += 3
      totalLines += 6
      if (order.catatan) totalLines += 2
      totalLines += 2
      totalLines += 3

      const H = 100 + (pad * 2) + (totalLines * lineH) + 100
      canvas.width = W
      canvas.height = H

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, W, H)

      let y = pad + 20

      const drawText = (text, x, size, color = '#000000', align = 'left', weight = 'normal', font = 'Courier New') => {
        ctx.fillStyle = color
        ctx.font = `${weight} ${size}px ${font}`
        ctx.textAlign = align
        ctx.fillText(text, x, y)
      }

      const drawDashedLine = () => {
        ctx.setLineDash([5, 5])
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(pad, y)
        ctx.lineTo(W - pad, y)
        ctx.stroke()
        ctx.setLineDash([])
        y += lineH
      }

      const logoW = 80
      const logoH = 80 * (logo.height / logo.width)
      ctx.drawImage(logo, (W - logoW) / 2, y, logoW, logoH)
      y += logoH + 20

      drawText('KOHI SEKAI', W / 2, 24, '#000000', 'center', 'bold')
      y += lineH + 5
      drawText('Official Store', W / 2, 14, '#000000', 'center', 'normal')
      y += lineH + 5

      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      const boxW = 280
      const boxH = 34
      ctx.strokeRect((W - boxW) / 2, y, boxW, boxH)
      y += 24
      drawText(order.order_number, W / 2, 16, '#000000', 'center', 'bold')
      y += lineH + 10

      drawDashedLine()

      const dateStr = new Date(order.created_at).toLocaleString('id-ID')
      drawText(dateStr, pad, 12, '#000000', 'left', 'normal')
      drawText('Admin', W - pad, 12, '#000000', 'right', 'normal')
      y += lineH
      drawText(`Event: ${eventName}`, pad, 12, '#000000', 'left', 'normal')
      y += lineH

      drawDashedLine()

      items.forEach(item => {
        drawText(item.item_name, pad, 12, '#000000', 'left', 'bold')
        y += lineH - 4

        drawText(`${item.quantity} x ${item.price.toLocaleString('id-ID')}`, pad + 20, 12, '#000000', 'left', 'normal')
        drawText(`Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`, W - pad, 12, '#000000', 'right', 'normal')
        y += lineH + 4
      })

      drawDashedLine()

      drawText('Total QTY:', pad, 12, '#000000', 'left', 'normal')
      const totalQty = items.reduce((acc, i) => acc + i.quantity, 0)
      drawText(totalQty.toString(), W - pad, 12, '#000000', 'right', 'normal')
      y += lineH

      drawText('Sub Total', pad, 12, '#000000', 'left', 'normal')
      drawText(`Rp ${order.total_harga.toLocaleString('id-ID')}`, W - pad, 12, '#000000', 'right', 'normal')
      y += lineH + 5

      drawText('TOTAL', pad, 20, '#000000', 'left', 'bold')
      drawText(`Rp ${order.total_harga.toLocaleString('id-ID')}`, W - pad, 20, '#000000', 'right', 'bold')
      y += lineH + 10

      drawText('Metode Bayar', pad, 12, '#000000', 'left', 'normal')
      drawText(order.is_ots ? 'Cash/QRIS' : 'Transfer', W - pad, 12, '#000000', 'right', 'normal')
      y += lineH

      if (!order.is_ots) {
        drawText('Bank', pad, 12, '#000000', 'left', 'normal')
        drawText('BCA', W - pad, 12, '#000000', 'right', 'normal')
        y += lineH
        drawText('No. Rek', pad, 12, '#000000', 'left', 'normal')
        drawText('8162015779', W - pad, 12, '#000000', 'right', 'normal')
        y += lineH
        drawText('A/n', pad, 12, '#000000', 'left', 'normal')
        drawText('REYHAN ALFA SUKMAJATI', W - pad, 12, '#000000', 'right', 'normal')
        y += lineH
      }

      drawDashedLine()

      drawText('Nama  :', pad, 12, '#000000', 'left', 'normal')
      drawText(order.nama_lengkap || '-', pad + 80, 12, '#000000', 'left', 'bold')
      y += lineH
      drawText('Kontak:', pad, 12, '#000000', 'left', 'normal')
      const kontak = order.whatsapp && order.whatsapp !== '-' ? order.whatsapp : order.instagram
      drawText(kontak || '-', pad + 80, 12, '#000000', 'left', 'normal')
      y += lineH

      if (order.catatan) {
        drawText('Catatan:', pad, 12, '#000000', 'left', 'normal')
        y += lineH
        const words = order.catatan.split(' ')
        let line = ''
        words.forEach(word => {
          if (ctx.measureText(line + word).width > W - (pad * 2)) {
            drawText(line, pad, 12, '#000000', 'left', 'italic')
            line = word + ' '
            y += lineH
          } else {
            line += word + ' '
          }
        })
        drawText(line, pad, 12, '#000000', 'left', 'italic')
        y += lineH
      }

      drawDashedLine()

      y += 10
      drawText('Terima kasih telah berbelanja', W / 2, 14, '#000000', 'center', 'normal')
      y += lineH
      drawText('IG: @kohisekai', W / 2, 14, '#000000', 'center', 'bold')
      y += lineH

      const link = document.createElement('a')
      link.download = `Nota_${order.order_number}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    logo.onerror = () => {
      showToast.error('Gagal memuat logo. Pastikan koneksi internet aman.')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 animate-fade-in">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar text-[var(--text-primary)]">
        <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">Detail Order <span className="text-[var(--primary)] font-mono">{order.order_number}</span></h3>
            <button
              onClick={generateReceipt}
              className="bg-[var(--primary)]/15 hover:bg-[var(--primary)]/25 text-[var(--primary)] border border-[var(--primary)]/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Download Nota"
            >
              <FaDownload /> Nota
            </button>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg transition-colors p-1">
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 bg-[var(--background)] p-4 rounded-xl border border-[var(--border)]">
            <div>
              <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Nama Lengkap</p>
              <p className="font-bold text-[var(--text-primary)] text-sm mt-0.5">{order.nama_lengkap}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">WhatsApp</p>
              <p className="font-bold text-[var(--primary)] text-sm mt-0.5">{order.whatsapp}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Instagram</p>
              <p className="font-semibold text-[var(--text-secondary)] text-sm mt-0.5">{order.instagram || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Tipe Order</p>
              <p className="font-semibold text-xs mt-0.5">
                <span className={`px-2 py-0.5 rounded-md font-bold ${order.is_ots ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'}`}>
                  {order.is_ots ? 'OTS' : 'Pre-Order'}
                </span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-3">Order Items</h4>
            <div className="space-y-2">
              {order.order_items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-[var(--background)] border border-[var(--border)] p-3 rounded-xl">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{item.item_name} <span className="text-[var(--primary)] font-bold ml-1">x{item.quantity}</span></span>
                  <span className="font-bold text-[var(--primary)] text-sm">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between items-center">
              <span className="font-bold text-sm text-[var(--text-secondary)]">Total Harga:</span>
              <span className="font-black text-2xl text-[var(--primary)]">
                Rp {order.total_harga?.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {order.catatan && (
            <div className="border-t border-[var(--border)] pt-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 mb-2">Catatan Order</h4>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-xs text-amber-200 whitespace-pre-wrap">{order.catatan}</p>
              </div>
            </div>
          )}

          {order.payment_proof_url && (
            <div className="border-t border-[var(--border)] pt-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-3">Bukti Pembayaran</h4>
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={order.payment_proof_url}
                  alt="Payment Proof"
                  className="w-full max-w-md mx-auto rounded-xl border border-[var(--border)] shadow-xl hover:opacity-90 transition-opacity cursor-pointer max-h-80 object-contain bg-[var(--background)]"
                />
              </a>
              <div className="text-center mt-2">
                <a
                  href={order.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#00e5e5] hover:underline"
                >
                  <FaEye /> Lihat Bukti Ukuran Penuh
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetailModal



