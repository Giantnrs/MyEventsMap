'use client'

import { useState, useRef } from 'react'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'

interface Props {
  value?: string
  onChange: (url: string) => void
}

export default function ImageUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState<string | null>(value || null)
  const [urlInput, setUrlInput]   = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))   // instant local preview
    setUploading(true)

    const form = new FormData()
    form.append('file', file)

    const res  = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()

    setUploading(false)
    if (data.url) {
      onChange(data.url)
      setUrlInput(data.url)
    }
  }

  function handleUrlBlur() {
    if (urlInput.startsWith('http')) {
      setPreview(urlInput)
      onChange(urlInput)
    }
  }

  function clear() {
    setPreview(null)
    setUrlInput('')
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-medium text-gray-700">
        Image <span className="text-gray-400 font-normal">(optional)</span>
      </label>

      {/* Preview */}
      {preview && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-violet-600" />
            </div>
          )}
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-36 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-sm text-gray-400 hover:border-violet-400 hover:text-violet-500 transition-colors"
        >
          <Upload size={22} />
          Click to upload a photo
          <span className="text-xs">JPG, PNG, WebP — max 10 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* URL fallback */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or paste a URL</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <input
        type="url"
        value={urlInput}
        onChange={e => setUrlInput(e.target.value)}
        onBlur={handleUrlBlur}
        placeholder="https://..."
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Hidden field for form submission */}
      <input type="hidden" name="imageUrl" value={urlInput} />
    </div>
  )
}