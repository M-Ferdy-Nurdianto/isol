import React, { useState } from 'react'

const DragDropZone = ({ onFileDrop, children, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false)

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
        // Create a fake event object to match standard input onChange structure
        onFileDrop({ target: { files: [file] } })
      }
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${className} ${isDragging ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}
    >
      {/* We can pass isDragging down to children if it's a function, or just render children */}
      {typeof children === 'function' ? children({ isDragging }) : children}
    </div>
  )
}

export default DragDropZone
