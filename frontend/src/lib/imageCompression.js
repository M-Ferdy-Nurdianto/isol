/**
 * Image compression utility to convert any uploaded image to WebP format
 * with dimension optimization and quality control on client side.
 */

export const compressImageToWebP = async (file, options = {}) => {
  const {
    maxDimension = 1600,
    quality = 0.85,
    exactCropSquare = false
  } = options

  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        try {
          let sourceX = 0
          let sourceY = 0
          let sourceWidth = img.width
          let sourceHeight = img.height
          let destWidth = img.width
          let destHeight = img.height

          if (exactCropSquare) {
            const minDim = Math.min(img.width, img.height)
            sourceX = (img.width - minDim) / 2
            sourceY = (img.height - minDim) / 2
            sourceWidth = minDim
            sourceHeight = minDim
            destWidth = Math.min(minDim, maxDimension)
            destHeight = destWidth
          } else {
            if (destWidth > maxDimension || destHeight > maxDimension) {
              if (destWidth > destHeight) {
                destHeight = Math.round((destHeight * maxDimension) / destWidth)
                destWidth = maxDimension
              } else {
                destWidth = Math.round((destWidth * maxDimension) / destHeight)
                destHeight = maxDimension
              }
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = destWidth
          canvas.height = destHeight
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            resolve(file)
            return
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, destWidth, destHeight
          )

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const cleanName = (file.name || 'image').replace(/\.[^/.]+$/, '')
                const webpFile = new File([blob], `${cleanName}.webp`, {
                  type: 'image/webp',
                  lastModified: Date.now()
                })
                resolve(webpFile)
              } else {
                resolve(file)
              }
            },
            'image/webp',
            quality
          )
        } catch (err) {
          console.warn('[ImageCompression] Canvas conversion failed, using original file:', err)
          resolve(file)
        }
      }
      img.onerror = () => resolve(file)
      img.src = event.target.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

