import React, { useRef, useState, useEffect } from 'react'
import { FaDownload, FaChevronLeft, FaExclamationTriangle, FaWhatsapp } from 'react-icons/fa'
import { toPng } from 'html-to-image'

const DigitalReceipt = ({ data, payment, onBack, onDownload, isPreview = false }) => {
  const receiptRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(0)
  const [maskEnabled, setMaskEnabled] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const padding = 32 // total horizontal padding
        const availableWidth = window.innerWidth - padding
        const baseWidth = 655
        
        let newScale = 1
        if (availableWidth < baseWidth) {
          newScale = availableWidth / baseWidth
        }
        setScale(newScale)

        if (receiptRef.current) {
          setHeight(receiptRef.current.offsetHeight)
        }
      }
    }

    handleResize()
    // Small delay to ensure ref is populated
    const timeout = setTimeout(handleResize, 100)
    
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeout)
    }
  }, [data]) // Re-run if data changes as it affects height

  if (!data) return null

  // Special theme color logic
  const accentColor = data.isSpecial ? (data.themeColor || '#FF6B9D') : '#079108'
  const isMerch = data.orderNumber?.startsWith('MERCH')

  // Styles for the typewriter/receipt look
  const receiptFontStyle = {
    fontFamily: '"Courier New", Courier, monospace',
    color: '#333',
    lineHeight: '1.4'
  }

  const handleDownload = async () => {
    if (receiptRef.current === null) return

    try {
      // Create a clone for capturing to ensure specific resolution and styles
      const node = receiptRef.current;
      
      // Hide buttons during capture
      const buttons = node.querySelector('.receipt-actions');
      if (buttons) buttons.style.display = 'none';

      const dataUrl = await toPng(node, {
        width: 655,
        style: {
          transform: 'none',
          width: '655px',
          height: 'auto',
          borderRadius: '0',
          margin: '0',
          padding: '40px 60px',
          backgroundColor: '#f7f6f2'
        },
        pixelRatio: 2,
        backgroundColor: '#f7f6f2',
      });

      if (buttons) buttons.style.display = 'flex';

      const link = document.createElement('a');
      const safeName = (data.nama || 'User').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      link.download = `${safeName}_${data.orderNumber}.png`;
      link.href = dataUrl;
      link.click();
      
      if (onDownload) onDownload();
    } catch (err) {
      console.error('Oops, something went wrong!', err);
    }
  }

  const separator = "------------------------------------------------------------"

  const maskPhone = (phone) => {
    if (!phone) return '-';
    const str = String(phone).replace(/\s/g, '');
    if (str.length <= 4) return str;
    return '*'.repeat(Math.max(0, str.length - 4)) + str.slice(-4);
  };

  const formatContact = (contact) => {
    if (!contact) return '-';
    const str = String(contact).trim();
    // Check if it's likely a phone number (mostly digits)
    const isPhoneNumber = /^[\d\s\+\-\(\)]+$/.test(str) && str.replace(/\D/g, '').length >= 8;
    
    if (isPhoneNumber) {
      return maskEnabled ? maskPhone(str) : str;
    }
    // Otherwise treat as username
    const username = str.startsWith('@') ? str : `@${str}`;
    if (!maskEnabled) return username;
    
    // Simple masking for username: @us*****
    if (username.length <= 4) return username;
    return username.slice(0, 3) + '*'.repeat(Math.max(2, username.length - 4)) + username.slice(-1);
  };

  return (
    <div className={`relative flex flex-col items-center ${isPreview ? 'py-4' : 'py-12 min-h-screen bg-slate-50 dark:bg-transparent'} px-4 overflow-hidden`}>
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#079108]/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div 
        className="relative z-10 transition-transform duration-300"
        style={{
          width: '655px',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          marginBottom: height > 0 ? `${height * (scale - 1)}px` : '0px' // Remove extra space caused by scaling
        }}
      >
        <div 
          ref={receiptRef}
          className="digital-receipt-paper overflow-hidden flex flex-col rounded-sm" 
          style={{ 
            ...receiptFontStyle, 
            width: '655px',
            minHeight: 'auto',
            padding: '40px 60px'
          }}
        >
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-1 mb-4 mt-2">
          <img src="/images/logos/logo.webp" alt="Kohi Sekai" className="h-16 object-contain mb-1" />
          <h2 className="text-2xl font-bold tracking-[0.1em] text-black uppercase">KOHI SEKAI</h2>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Official Website</p>
        </div>

        {/* Order Badge */}
        <div className="mb-4 px-2">
          <div 
            className="w-full py-3 rounded-lg text-center shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            <span className="text-white font-bold tracking-[0.2em] text-lg">{data.orderNumber}</span>
          </div>
        </div>

        {/* Dividers & Meta */}
        <div className="space-y-1 mb-4 px-2">
          <div className="text-gray-800 text-sm font-bold opacity-80">{separator}</div>
          <div className="flex justify-between items-center text-xs font-bold text-gray-700">
            <span>{data.createdAt}</span>
            <span>Admin</span>
          </div>
          <div className="text-gray-800 text-sm font-bold opacity-80">{separator}</div>
        </div>

        {/* Customer Info */}
        <div className="space-y-2 mb-4 px-4">
          <div className="flex text-sm">
            <span className="w-24 flex-shrink-0">Nama</span>
            <span className="mr-2">:</span>
            <span className="font-bold">{data.nama}</span>
          </div>
          {/* For Cheki order (Single Contact Field) */}
          {!isMerch && data.kontak && (
            <div className="flex text-sm">
              <span className="w-24 flex-shrink-0">Kontak</span>
              <span className="mr-2">:</span>
              <span>{formatContact(data.kontak)}</span>
            </div>
          )}
          {!isMerch && data.eventName && data.eventName !== '-' && (
            <div className="flex text-sm">
              <span className="w-24 flex-shrink-0">Event</span>
              <span className="mr-2">:</span>
              <span className="font-bold">{data.eventName}</span>
            </div>
          )}

          {/* For Merch order (Two Contact Fields) */}
          {isMerch && data.whatsapp && (
            <div className="flex text-sm">
              <span className="w-24 flex-shrink-0">WhatsApp</span>
              <span className="mr-2">:</span>
              <span>{maskEnabled ? maskPhone(data.whatsapp) : data.whatsapp}</span>
            </div>
          )}
          {isMerch && data.instagram && (
            <div className="flex text-sm">
              <span className="w-24 flex-shrink-0">Instagram</span>
              <span className="mr-2">:</span>
              <span>{formatContact(data.instagram)}</span>
            </div>
          )}
          <div className="flex text-sm">
            <span className="w-24 flex-shrink-0">Catatan</span>
            <span className="mr-2">:</span>
            <span className="italic text-gray-700 break-words">{data.catatan || '-'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="text-gray-800 text-sm font-bold opacity-80 mb-4 px-2">{separator}</div>

        {/* Items Section */}
        <div className="space-y-4 mb-4 px-4">
          {data.items.map((item, idx) => (
            <div key={idx} className="flex flex-col text-left">
              <h4 className="text-sm font-bold uppercase leading-tight mb-1" style={{ color: accentColor }}>
                {item.name} {item.size ? `(${item.size})` : ''}
              </h4>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-600 font-bold">
                  {item.quantity} x Rp {item.price?.toLocaleString('id-ID')}
                </p>
                <span className="text-sm font-bold" style={{ color: accentColor }}>
                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="text-gray-800 text-sm font-bold opacity-80 mb-4 px-2">{separator}</div>

        {/* Summary */}
        <div className="space-y-2 mb-4 px-4">
          <div className="flex justify-between text-sm font-bold text-gray-700">
            <span>Total QTY:</span>
            <span>{data.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-gray-700">
            <span>Sub Total</span>
            <span>Rp {data.total.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-200">
            <span className="text-2xl font-black">TOTAL</span>
            <span className="text-3xl font-black" style={{ color: accentColor }}>
              Rp {data.total.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Payment */}
        <div className="space-y-2 mb-4 px-4 text-sm font-bold">
          <div className="flex justify-between">
            <span className="w-40 text-gray-700">Metode Bayar</span>
            <span className="text-right">{payment?.method || 'Transfer'}</span>
          </div>
          <div className="flex justify-between">
            <span className="w-40 text-gray-700">Bank</span>
            <span className="text-right">{payment?.bank || 'BCA'}</span>
          </div>
          <div className="flex justify-between">
            <span className="w-40 text-gray-700">No. Rek</span>
            <span className="text-right font-mono">{payment?.rekening || '0902683273'}</span>
          </div>
          <div className="flex flex-col text-right">
            <div className="flex justify-between">
              <span className="w-40 text-left text-gray-700">A/n</span>
              <span className="font-black uppercase text-gray-900">{payment?.atasNama || 'NATASYA ANGELINA PUTRI'}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="text-gray-800 text-sm font-bold opacity-80 mb-4 px-2">{separator}</div>

        {/* Notes */}
        <div className="text-center space-y-2 mb-4 px-4">
          <div className="flex items-center justify-center gap-2 text-[#C68D00] text-[11px] font-bold">
            <FaExclamationTriangle className="text-xs" />
            <p>Catatan Pengambilan {isMerch ? 'Merchandise' : 'Solo/Spesial Cheki'}</p>
          </div>
          <p className="text-[10px] text-gray-500 uppercase font-bold leading-relaxed px-4">
            {isMerch ? 'Merchandise' : 'Solo/Spesial Cheki'} bisa diambil di next event jika tidak datang, atau bisa dikirim dengan catatan ongkir ditanggung pembeli (Konfirmasi via Admin).
          </p>
        </div>

        {/* Divider */}
        <div className="text-gray-800 text-sm font-bold opacity-80 mb-6 px-2">{separator}</div>

        {/* Footer */}
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <p className="text-sm font-bold italic" style={{ color: accentColor }}>
            Terima kasih telah berbelanja
          </p>
          <p className="text-xs font-bold text-gray-500 flex items-center gap-2">
            <span>IG: <span style={{ color: accentColor }}>@kohisekai</span></span>
            <span>•</span>
            <a 
              href="https://whatsapp.com/channel/0029VbDVjJzDJ6GwgUQ9cP32"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-500 transition-colors flex items-center gap-1"
            >
              <FaWhatsapp className="text-xs" /> WA Channel
            </a>
          </p>
        </div>

        {/* Actions (Hidden on capture) */}
        <div className={`receipt-actions flex flex-col gap-4 w-full mt-auto ${isPreview ? 'pt-4 pb-2' : 'pt-8 pb-4'} px-4 print:hidden`}>
          <button 
            onClick={() => setMaskEnabled(!maskEnabled)}
            className={`w-full py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${maskEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
          >
            <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-colors ${maskEnabled ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
              {maskEnabled && <div className="w-1 h-1 bg-white rounded-full"></div>}
            </div>
            {maskEnabled ? 'Kontak Disamarkan' : 'Samarkan Kontak'}
          </button>

          <div className="flex gap-4 w-full">
            {!isPreview && (
              <button 
                onClick={onBack}
                className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <FaChevronLeft className="text-xs" />
                Kembali
              </button>
            )}
            <button 
              onClick={handleDownload}
              className={`${isPreview ? 'w-full' : 'flex-[2]'} bg-gray-900 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-black transition-colors`}
            >
              <FaDownload className="text-xs" />
              Download Nota
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default DigitalReceipt
