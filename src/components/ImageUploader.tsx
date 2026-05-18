'use client'

import { useState, useRef } from 'react'
import { Loader2, Upload, X, Sparkles } from 'lucide-react'
import ImageCropper from './ImageCropper'

interface Props {
  value?: string
  onChange: (url: string) => void
  /** If provided, the "Generate with AI" button appears */
  getEventDetails?: () => {
    title: string
    location: string
    category: string
    description: string
  }
}

export default function ImageUploader({ value, onChange, getEventDetails }: Props) {
  const [uploading, setUploading]   = useState(false)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview]       = useState<string | null>(value || null)
  const [urlInput, setUrlInput]     = useState(value || '')
  const [cropSrc, setCropSrc]       = useState<string | null>(null)
  const [genError, setGenError]     = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSrc(URL.createObjectURL(file))
  }

  async function handleCropComplete(blob: Blob) {
    setCropSrc(null)
    setUploading(true)
    setPreview(URL.createObjectURL(blob))

    const form = new FormData()
    form.append('file', blob, 'banner.jpg')
    const res  = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()

    setUploading(false)
    if (data.url) { onChange(data.url); setUrlInput(data.url) }
  }

  function handleCropCancel() {
    setCropSrc(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleGenerate() {
    if (!getEventDetails) return
    const { title, location, category, description } = getEventDetails()

    if (!title.trim()) {
      setGenError('Add a title first so AI knows what to draw.')
      return
    }

    setGenerating(true)
    setGenError(null)

    try {
      const res  = await fetch('/api/ai/banner', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, location, category, description }),
      })
      const data = await res.json()

      if (data.url) {
        setPreview(data.url)
        setUrlInput(data.url)
        onChange(data.url)
      } else {
        setGenError(data.error ?? 'Generation failed. Try again.')
      }
    } catch {
      setGenError('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function clear() {
    setPreview(null)
    setUrlInput('')
    onChange('')
    setGenError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleUrlBlur() {
    if (urlInput.startsWith('http')) { setPreview(urlInput); onChange(urlInput) }
  }

  return (
    <>
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Image <span className="text-gray-400 font-normal">(optional)</span>
          </label>

          {getEventDetails && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || uploading}
              className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium disabled:opacity-50 transition-colors"
            >
              {generating
                ? <Loader2 size={13} className="animate-spin" />
                : <Sparkles size={13} />
              }
              {generating ? 'Generating…' : 'Generate with AI'}
            </button>
          )}
        </div>

        {generating && (
          <div className="w-full h-48 rounded-xl border border-violet-200 bg-violet-50 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-violet-400" />
            <p className="text-xs text-violet-500 font-medium">Creating your banner…</p>
            <p className="text-xs text-violet-400">This takes about 10–20 seconds</p>
          </div>
        )}

        {!generating && preview && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-violet-600" />
              </div>
            )}
            <button type="button" onClick={clear}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50">
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        )}

        {!generating && !preview && (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="w-full h-36 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-sm text-gray-400 hover:border-violet-400 hover:text-violet-500 transition-colors">
            <Upload size={22} />
            Click to upload a photo
            <span className="text-xs">You'll be able to crop it after picking</span>
          </button>
        )}

        {genError && <p className="text-xs text-red-500">{genError}</p>}

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or paste a URL</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <input type="url" value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="https://..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input type="hidden" name="imageUrl" value={urlInput} />
      </div>
    </>
  )
}