import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaCheck } from 'react-icons/fa'

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180
}

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

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

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(file)
      } else {
        reject(new Error('Canvas is empty'))
      }
    }, 'image/jpeg', 0.95)
  })
}

const ImageCropModal = ({ isOpen, onClose, imageSrc, aspect = 1, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    try {
      setIsProcessing(true)
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const croppedFile = new File([croppedImageBlob], 'cropped-image.jpg', { type: 'image/jpeg' })
      onCropComplete(croppedFile)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[70vh] sm:h-[80vh] max-h-[800px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-background/50">
            <div>
              <h3 className="text-lg font-black tracking-tight text-text-primary uppercase">Atur Posisi Foto</h3>
              <p className="text-xs text-text-secondary font-medium mt-0.5">Geser dan zoom gambar agar pas</p>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2.5 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          {/* Cropper Container */}
          <div className="relative flex-1 bg-black overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={setZoom}
              objectFit="contain"
            />
          </div>

          {/* Footer Controls */}
          <div className="p-4 sm:p-6 border-t border-border bg-background/50 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-text-secondary">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <FaCheck /> Simpan & Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ImageCropModal
