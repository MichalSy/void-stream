'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

interface VideoPlayerProps {
  src: string
  title?: string
}

export default function VideoPlayer({ src, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setError(null)
    setLoading(true)

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    // Check if HLS stream
    if (src.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        })
        
        // Load master playlist through proxy, then rewrite URLs
        const proxySrc = src.includes('edgeon-bandwidth.com') 
          ? `/api/proxy?url=${encodeURIComponent(src)}`
          : src
        
        // Fetch and rewrite the playlist
        fetch(proxySrc)
          .then(res => res.text())
          .then(playlist => {
            // Extract base URL from the original CDN URL for relative URL resolution
            const cdnBaseUrl = src.substring(0, src.lastIndexOf('/') + 1)
            // Get our proxy base URL
            const proxyBaseUrl = `${window.location.origin}/api/proxy?url=`
            
            // Rewrite all URLs in the playlist to go through our proxy
            // Handle both absolute URLs and relative URLs
            const rewrittenPlaylist = playlist
              .replace(
                /(https?:\/\/[^\s]+)/g,
                (match) => `${proxyBaseUrl}${encodeURIComponent(match)}`
              )
              .replace(
                /^([a-zA-Z0-9_-]+\.(m3u8|ts|key)(\?[^\s]*)?)$/gm,
                (match) => `${proxyBaseUrl}${encodeURIComponent(cdnBaseUrl + match)}`
              )
            
            // Create a blob URL with the rewritten playlist
            const blob = new Blob([rewrittenPlaylist], { type: 'application/vnd.apple.mpegurl' })
            const blobUrl = URL.createObjectURL(blob)
            
            hls.loadSource(blobUrl)
            hls.attachMedia(video)
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setLoading(false)
              URL.revokeObjectURL(blobUrl)
              video.play().catch(() => {}) // Autoplay may be blocked
            })

            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal) {
                setError(`Playback error: ${data.type}`)
                setLoading(false)
              }
            })
          })
          .catch(err => {
            console.error('Failed to load playlist:', err)
            setError('Failed to load video playlist')
            setLoading(false)
          })
        
        hlsRef.current = hls
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src
        video.addEventListener('loadedmetadata', () => {
          setLoading(false)
          video.play().catch(() => {})
        })
      } else {
        setError('HLS not supported in this browser')
        setLoading(false)
      }
    } else {
      // Regular video URL
      video.src = src
      video.addEventListener('loadeddata', () => {
        setLoading(false)
      })
      video.addEventListener('error', () => {
        setError('Failed to load video')
        setLoading(false)
      })
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src])

  return (
    <div className="relative w-full max-w-6xl mx-auto bg-black rounded-xl overflow-hidden glow-purple">
      {title && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
          <h2 className="text-lg font-medium text-white truncate">{title}</h2>
        </div>
      )}
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-red-400 text-center p-4">
            <p className="text-lg font-medium">Error</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="w-full aspect-video"
        controls
        playsInline
      />
    </div>
  )
}
