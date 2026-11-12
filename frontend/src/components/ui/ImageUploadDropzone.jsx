import React, { useState, useRef, useEffect } from 'react'
import {
  FaCloudUploadAlt,
  FaUpload,
  FaTimes,
  FaSearchPlus,
  FaTrashAlt,
  FaCheckCircle,
  FaSpinner,
  FaImage
} from 'react-icons/fa'
import { compressImageToWebP } from '../../lib/imageCompression'

/**
 * Universal Image Upload with:
 * 1. Full Drag & Drop support
 * 2. Automatic client-side WebP compression
 * 3. 1:1 compact thumbnail display
 * 4. Click thumbnail to open high-res Lightbox modal
 * 5. Direct Drag & Drop over existing image to replace/overwrite immediately
 */
const ImageUploadDropzone = ({
  onImageChange,
  previewUrl,
  onRemove,
  label,
  hint = 'Format didukung: JPG, PNG, WebP (Auto-kompres WebP)',
  compact = false,
  aspectRatio = 'aspect-square',
  disabled = false,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const fileInputRef = useRef(null)

  // Close lightbox on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isZoomOpen) {
        setIsZoomOpen(false)
      }
    }
    if (isZoomOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isZoomOpen])

  const processFile = async (rawFile) => {
    if (!rawFile || !rawFile.type.startsWith('image/')) return
    setIsCompressing(true)
    try {
      // Compress to WebP
      const webpFile = await compressImageToWebP(rawFile, {
        maxDimension: 1600,
        quality: 0.85
      })
      const blobUrl = URL.createObjectURL(webpFile)
      if (onImageChange) {
        onImageChange(webpFile, blobUrl)
      }
    } catch (err) {
      console.error('[ImageUploadDropzone] Compression failed:', err)
      const fallbackUrl = URL.createObjectURL(rawFile)
      if (onImageChange) {
        onImageChange(rawFile, fallbackUrl)
      }
    } finally {
      setIsCompressing(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      await processFile(droppedFile)
    }
  }

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0]
      await processFile(selected)
    }
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-text-secondary">
          {label}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />

      {/* Main Container */}
      {previewUrl ? (
        /* Case 1: Photo is present / uploaded -> 1:1 compact thumbnail with direct drag & drop replace */
        <div className="flex flex-wrap items-center gap-3.5">
          {/* 1:1 Square Thumbnail + Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => setIsZoomOpen(true)}
            className={`relative ${compact ? 'w-20 h-20' : 'w-24 h-24 sm:w-28 sm:h-28'} aspect-square rounded-2xl overflow-hidden border-2 bg-surface cursor-pointer group shadow-md transition-all shrink-0 ${
              isDragging
                ? 'border-primary ring-2 ring-primary bg-primary/20 scale-105'
                : 'border-border hover:border-primary/60'
            }`}
            title="Klik untuk melihat ukuran besar"
          >
            <img
              src={previewUrl}
              alt="Uploaded Preview"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Hover overlay for zoom */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
              <FaSearchPlus size={18} className="mb-1" />
              <span className="text-[9px] font-bold tracking-tight">Perbesar</span>
            </div>

            {/* Dragging Active Overlay (Direct Drop to Overwrite) */}
            {isDragging && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-primary z-20 pointer-events-none p-1 text-center">
                <FaUpload size={20} className="mb-1 animate-bounce" />
                <span className="text-[10px] font-black leading-tight">Lepas untuk menimpa foto</span>
              </div>
            )}

            {/* Compressing spinner */}
            {isCompressing && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-primary z-30 pointer-events-none">
                <FaSpinner size={20} className="animate-spin mb-1" />
                <span className="text-[9px] font-bold">Mengompres...</span>
              </div>
            )}
          </div>

          {/* Action details beside 1:1 thumbnail */}
          <div className="space-y-1.5 flex-1 min-w-[160px]">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <FaCheckCircle size={12} />
              <span>Foto terpasang (1:1 WebP)</span>
            </div>

            <p className="text-[11px] text-text-secondary leading-snug">
              Klik kotak foto untuk melihat ukuran besar, atau drag & drop foto baru langsung ke kotak untuk menimpa.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isCompressing}
                className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-bold text-text-secondary hover:text-text-primary hover:border-primary/50 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <FaUpload size={10} />
                <span>Ganti Foto</span>
              </button>

              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={disabled || isCompressing}
                  className="px-3 py-1.5 rounded-xl bg-background border border-red-500/20 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
                >
                  <FaTrashAlt size={10} />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Case 2: Empty State -> Clean Drag & Drop Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isCompressing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
            isDragging
              ? 'border-primary bg-primary/15 ring-2 ring-primary/40'
              : 'border-border bg-background hover:border-primary/60 hover:bg-surface/60'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            {isCompressing ? (
              <FaSpinner size={18} className="animate-spin" />
            ) : isDragging ? (
              <FaUpload size={18} className="animate-bounce" />
            ) : (
              <FaCloudUploadAlt size={20} />
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-text-primary">
              {isCompressing
                ? 'Mengompres gambar ke WebP...'
                : isDragging
                ? 'Lepas foto di sini untuk upload'
                : 'Drag & drop foto ke sini, atau klik untuk pilih'}
            </p>
            {hint && (
              <p className="text-[10px] text-text-secondary mt-0.5 font-medium">
                {hint}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal (Click to Enlarge / Tampil Besar) */}
      {isZoomOpen && previewUrl && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {/* Header bar of lightbox */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl flex items-center justify-between mb-3 text-white px-2"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
              <FaImage className="text-primary" />
              <span>Pratinjau Foto Penuh</span>
            </div>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Tutup"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Large Image Box */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[82vh] rounded-2xl overflow-hidden border border-white/15 bg-black/50 shadow-2xl flex items-center justify-center p-2"
          >
            <img
              src={previewUrl}
              alt="Tampilan Besar"
              className="max-h-[78vh] max-w-full object-contain rounded-xl select-none"
            />
          </div>

          <p className="text-xs text-white/50 mt-3 select-none">
            Klik area luar atau tekan ESC untuk menutup
          </p>
        </div>
      )}
    </div>
  )
}

export default ImageUploadDropzone

