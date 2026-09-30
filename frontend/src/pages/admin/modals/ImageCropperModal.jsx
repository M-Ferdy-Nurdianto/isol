import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { FaTimes, FaCheck } from 'react-icons/fa'

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Set width and height to crop size
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/webp', 0.9)
  })
}

const ImageCropperModal = ({ isOpen, onClose, imageSrc, onCropComplete, aspect = 16 / 9 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    try {
      setIsProcessing(true)
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
      
      // Create a File object from the blob
      const file = new File([croppedBlob], `cropped-${Date.now()}.webp`, { type: 'image/webp' })
      onCropComplete(file)
    } catch (e) {
      console.error('Error cropping image:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-background border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h3 className="font-bold text-lg">Sesuaikan Gambar</h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10">
            <FaTimes />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative w-full h-[50vh] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            objectFit="contain"
            minZoom={0.5}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteHandler}
          />
        </div>

        {/* Controls */}
        <div className="p-6 bg-surface border-t border-border space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2">Rotasi (Derajat)</label>
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                aria-labelledby="Rotation"
                onChange={(e) => setRotation(e.target.value)}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-white flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              <FaCheck /> {isProcessing ? 'Memproses...' : 'Terapkan & Simpan (WebP)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageCropperModal
