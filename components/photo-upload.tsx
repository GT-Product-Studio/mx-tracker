'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'

export function PhotoUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Compress if over 1MB
    let uploadFile = file
    if (file.size > 1024 * 1024) {
      uploadFile = await compressImage(file)
    }

    setUploading(true)
    setPreview(URL.createObjectURL(uploadFile))

    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('proof-photos')
      .upload(path, uploadFile, { contentType: uploadFile.type })

    if (data) {
      const { data: urlData } = supabase.storage
        .from('proof-photos')
        .getPublicUrl(data.path)

      onUpload(urlData.publicUrl)
    }
    setUploading(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg border border-dashed border-border bg-bg p-4 text-center hover:border-accent/50 transition-colors"
      >
        {uploading ? (
          <span className="text-sm text-text-muted">Uploading...</span>
        ) : preview ? (
          <div className="relative h-32 rounded-lg overflow-hidden mx-auto max-w-xs">
            <Image src={preview} alt="Preview" fill quality={100} className="object-cover" />
          </div>
        ) : (
          <div>
            <svg className="w-8 h-8 mx-auto text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
            </svg>
            <span className="text-sm text-text-muted">Upload photo proof</span>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = document.createElement('img')

    img.onload = () => {
      const maxDim = 1200
      let w = img.width
      let h = img.height

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = (h / w) * maxDim
          w = maxDim
        } else {
          w = (w / h) * maxDim
          h = maxDim
        }
      }

      canvas.width = w
      canvas.height = h
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => {
          resolve(new File([blob!], file.name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.8
      )
    }

    img.src = URL.createObjectURL(file)
  })
}
