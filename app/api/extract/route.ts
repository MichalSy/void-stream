import { NextRequest, NextResponse } from 'next/server'

// Supported streaming sites
const SUPPORTED_DOMAINS = [
  's.to',
  'serienstream.to',
  'voe.sx',
  'voe-unblock.com',
  'streamtape.com',
  'vidoza.net',
  'doodstream.com'
]

// Extract video URL using server-side logic
async function extractVideoUrl(pageUrl: string): Promise<string | null> {
  // For VOE links, use the extraction logic
  if (pageUrl.includes('voe.sx') || pageUrl.includes('voe-unblock')) {
    // Extract video ID from URL
    const match = pageUrl.match(/\/e\/([a-zA-Z0-9]+)/)
    if (!match) return null
    
    const videoId = match[1]
    
    // Use browser automation to extract (in production, this would use Playwright)
    // For now, return a placeholder that the client can use
    return null // Will be handled by client-side extraction
  }
  
  // Direct video URLs
  if (pageUrl.includes('.m3u8') || pageUrl.includes('.mp4')) {
    return pageUrl
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Check if direct video URL
    if (url.includes('.m3u8') || url.includes('.mp4')) {
      return NextResponse.json({ 
        videoUrl: url,
        type: url.includes('.m3u8') ? 'hls' : 'mp4'
      })
    }

    // For streaming sites, we need to extract the video URL
    // This requires browser automation which should be done server-side
    // For security, we'll return instructions for the client
    
    const domain = parsedUrl.hostname.replace('www.', '')
    const isSupported = SUPPORTED_DOMAINS.some(d => domain.includes(d))
    
    if (!isSupported) {
      return NextResponse.json({ 
        error: 'Unsupported streaming site',
        supported: SUPPORTED_DOMAINS 
      }, { status: 400 })
    }

    // Return the page URL for client-side extraction
    // In production, this would use a server-side browser
    return NextResponse.json({ 
      videoUrl: null,
      requiresExtraction: true,
      pageUrl: url,
      message: 'Use browser extension or manual extraction'
    })

  } catch (error) {
    console.error('Extract error:', error)
    return NextResponse.json({ 
      error: 'Failed to process URL' 
    }, { status: 500 })
  }
}
