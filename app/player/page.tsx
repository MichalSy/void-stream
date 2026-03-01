'use client'

import { useState } from 'react'
import VideoPlayer from '@/components/VideoPlayer'

export default function PlayerPage() {
  const [url, setUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')

  const handleExtract = async () => {
    if (!url.trim()) return
    
    setExtracting(true)
    setError('')
    
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      const data = await res.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setVideoUrl(data.videoUrl)
      }
    } catch (err) {
      setError('Failed to extract video URL')
    } finally {
      setExtracting(false)
    }
  }

  const handlePlay = () => {
    if (url.trim()) {
      // Check if it's already a direct video URL
      if (url.includes('.m3u8') || url.includes('.mp4')) {
        setVideoUrl(url)
      } else {
        handleExtract()
      }
    }
  }

  return (
    <main className="min-h-screen void-gradient p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
            Void Player
          </h1>
          <p className="text-gray-400 mt-2">Paste a URL and enter the void</p>
        </div>

        {/* URL Input */}
        <div className="flex gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
            placeholder="Paste video or streaming URL..."
            className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500"
          />
          <button
            onClick={handlePlay}
            disabled={extracting || !url.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 rounded-lg font-medium transition"
          >
            {extracting ? 'Extracting...' : 'Play'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Video Player */}
        {videoUrl && (
          <VideoPlayer src={videoUrl} />
        )}
      </div>
    </main>
  )
}
