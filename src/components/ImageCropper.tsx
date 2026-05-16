'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Loader2, Check, X, ZoomIn, ZoomOut } from 'lucide-react'

interface CropArea { x: number; y: number; width: number; height: number }

interface Props {
  imageSrc: string
  onComplete: (croppedBlob: Blob) => void
  onCancel: () => void
}

export default function ImageCropper({ imageSrc, onComplete, onCancel }: Props) {
  const [crop, setCrop]           = useState({ x: 0, y: 0 })
  const [zoom, setZoom]           = useState(1)
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null)
  const [applying, setApplying]   = useState(false)

  const onCropComplete = useCallback((_: unknown, croppedAreaPixels: CropArea) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  async function handleApply() {
    if (!croppedArea) return
    setApplying(true)

    const image = new Image()
    image.src = imageSrc
    await new Promise(r => { image.onload = r })

    const canvas = document.createElement('canvas')
    canvas.width  = 1200   // fixed banner output size
    canvas.height = 500
    const ctx = canvas.getContext('2d')!

    ctx.drawImage(
      image,
      croppedArea.x, croppedArea.y,
      croppedArea.width, croppedArea.height,
      0, 0,
      1200, 500
    )

    canvas.toBlob(blob => {
      setApplying(false)
      if (blob) onComplete(blob)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">Crop your image</p>
            <p className="text-xs text-gray-400 mt-0.5">Drag to reposition · Scroll to zoom</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Cropper — fixed 16:9 banner ratio */}
        <div className="relative w-full" style={{ height: 380 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 6}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={true}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle:  { border: '2px solid white', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <ZoomOut size={16} className="text-gray-400 shrink-0" />
          <input
            type="range"
            min={1} max={3} step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-violet-600"
          />
          <ZoomIn size={16} className="text-gray-400 shrink-0" />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={applying}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {applying
              ? <Loader2 size={14} className="animate-spin" />
              : <Check size={14} />
            }
            Apply crop
          </button>
        </div>

      </div>
    </div>
  )
}