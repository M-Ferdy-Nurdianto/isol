import React, { useState, useEffect } from 'react'
import { FaSpinner } from 'react-icons/fa'
import { subscribeGlobalLoading } from '../../lib/api'

const GlobalLoadingOverlay = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    return subscribeGlobalLoading(setVisible)
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
      role="status"
      aria-live="assertive"
      aria-label="Sedang memproses"
    >
      <div className="bg-[#241E19] border border-[#3A2E24] rounded-2xl px-7 py-6 flex flex-col items-center text-center gap-3 shadow-2xl max-w-xs w-full">
        <FaSpinner className="animate-spin text-2xl text-[#E8944A]" />
        <div className="space-y-1">
          <p className="text-sm font-black text-[#F5E6D3] uppercase tracking-wider">
            Memproses...
          </p>
          <p className="text-xs text-[#B0A599] leading-relaxed">
            Mohon tunggu sebentar, jangan tutup halaman atau klik ulang.
          </p>
        </div>
      </div>
    </div>
  )
}

export default GlobalLoadingOverlay
