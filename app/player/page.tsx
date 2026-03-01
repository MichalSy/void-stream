'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import VideoPlayer from '@/components/VideoPlayer'

function PlayerContent() {
  const searchParams = useSearchParams()
  const [url, setUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  
  // Auto-load from URL parameter
  useEffect(() => {
    const urlParam = searchParams.get('url')
    if (urlParam) {
      setUrl(urlParam)
      // Auto-trigger extraction after a short delay
      setTimeout(() => {
        handlePlayWithURL(urlParam)
      }, 100)
    }
  }, [searchParams])
  
  const handlePlayWithURL = async (targetUrl: string) => {
    if (!targetUrl.trim()) return
    
    setError('')
    setExtracting(true)
    
    try {
      // Direct video URL
      if (targetUrl.includes('.m3u8') || targetUrl.includes('.mp4')) {
        setVideoUrl(targetUrl)
        return
      }
      
      // Use server-side extraction API
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Extraction failed')
      }
      
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl)
      } else {
        throw new Error('No video URL found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  const handlePlay = async () => {
    await handlePlayWithURL(url)
  }

  return (
    <main className="min-h-screen void-gradient p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
            Void Player
          </h1>
          <p className="text-gray-400 mt-2">Füge eine Video-URL ein (HLS .m3u8 oder MP4)</p>
        </div>

        {/* URL Input */}
        <div className="flex gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
            placeholder="https://...  (HLS .m3u8 oder MP4)"
            className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
          />
          <button
            onClick={handlePlay}
            disabled={!url.trim() || extracting}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 rounded-lg font-medium transition"
          >
            {extracting ? 'Extracting...' : 'Play'}
          </button>
        </div>

        {/* Error / Instructions */}
        {error && (
          <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-300 whitespace-pre-line">
            {error}
          </div>
        )}

        {/* Video Player */}
        {videoUrl && (
          <VideoPlayer src={videoUrl} />
        )}

        {/* Help Section */}
        <div className="text-gray-500 text-sm space-y-2">
          <p className="font-medium text-gray-400">Unterstützte Formate:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>HLS Streams (.m3u8)</li>
            <li>MP4 Videos</li>
            <li>s.to / serienstream.to Links</li>
            <li>VOE Links (automatische Extraction)</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

export default function PlayerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen void-gradient p-8 flex items-center justify-center">Loading...</div>}>
      <PlayerContent />
    </Suspense>
  )
}
