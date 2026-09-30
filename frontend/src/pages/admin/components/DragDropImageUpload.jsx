import React, { useState, useRef } from 'react'
import { FaImage, FaUpload } from 'react-icons/fa'

const DragDropImageUpload = ({ 
  onImageChange, 
  previewUrl, 
  onRemove, 
  aspectRatio = 'aspect-square', // e.g. 'aspect-square', 'aspect-video', etc.
  widthClass = 'w-32', 
  heightClass = 'h-32',
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        onImageChange(file)
      }
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageChange(e.target.files[0])
    }
  }

  return (
    <div className={`flex gap-4 items-start ${className}`}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
      />
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`${widthClass} ${heightClass} ${aspectRatio} rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
          isDragging 
            ? 'border-primary bg-primary/20 text-primary' 
            : 'border-white/20 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
        }`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <>
            {isDragging ? <FaUpload size={24} className="mb-2 animate-bounce" /> : <FaImage size={24} className="mb-2" />}
            <span className="text-xs font-bold text-center px-2">
              {isDragging ? 'Lepas untuk Upload' : 'Drag & Drop / Klik'}
            </span>
          </>
        )}
      </div>
      {previewUrl && onRemove && (
        <button type="button" onClick={onRemove} className="text-sm text-red-400 hover:text-red-300 font-bold mt-2">
          Hapus Gambar
        </button>
      )}
    </div>
  )
}

export default DragDropImageUpload
