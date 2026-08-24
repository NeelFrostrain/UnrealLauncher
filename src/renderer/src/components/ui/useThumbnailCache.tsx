import { useEffect, useState } from 'react'

// Generate a small cached thumbnail data URL for image paths.
// Stores results in localStorage under `thumbCache:<key>` where key is the source path.

export function useThumbnailCache(src: string | undefined, cacheKey?: string): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!src) {
      return
    }

    const key = `thumbCache:${encodeURIComponent(src)}${cacheKey ? `:${cacheKey}` : ''}`
    try {
      const cached = localStorage.getItem(key)
      if (cached) {
        // schedule setState asynchronously to avoid cascading renders inside effect
        Promise.resolve().then(() => setUrl(cached))
        return
      }
    } catch {
      /* ignore cache errors */
    }

    let cancelled = false

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return
      try {
        const maxW = 320
        const ratio = img.naturalWidth ? Math.min(1, maxW / img.naturalWidth) : 1
        const w = Math.max(1, Math.round(img.naturalWidth * ratio))
        const h = Math.max(1, Math.round(img.naturalHeight * ratio))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.drawImage(img, 0, 0, w, h)
        const data = canvas.toDataURL('image/jpeg', 0.78)
        try {
          localStorage.setItem(key, data)
        } catch {
          /* ignore quota errors */
        }
        setUrl(data)
      } catch {
        setUrl(src)
      }
    }
    img.onerror = () => {
      if (!cancelled) setUrl(src)
    }
    img.src = src

    return () => {
      cancelled = true
    }
  }, [src, cacheKey])

  return url
}

export default useThumbnailCache
