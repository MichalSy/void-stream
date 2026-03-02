import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  try {
    // Handle both absolute and relative URLs
    let targetUrl = url
    
    // If it's a relative URL starting with /api/, it's a sub-playlist from VOE
    if (url.startsWith('/api/') || url.startsWith('api/')) {
      // Extract the base URL from referer or construct it
      const baseUrl = request.headers.get('referer')?.match(/https:\/\/[^\/]+\.edgeon-bandwidth\.com/)?.[0]
      if (baseUrl) {
        targetUrl = `${baseUrl}${url}`
      }
    }
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://voe.sx/',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: response.status })
    }

    let body: ArrayBuffer | string = await response.arrayBuffer()
    const contentType = response.headers.get('Content-Type') || 'application/vnd.apple.mpegurl'
    
    // Rewrite relative URLs in m3u8 files
    if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
      const text = new TextDecoder().decode(body)
      const baseUrl = new URL(targetUrl).origin
      
      // Rewrite relative URLs to absolute URLs with our proxy
      const rewritten = text
        .replace(/^(?!https?|#)([^\n]+\.m3u8[^\n]*)$/gm, (match) => {
          const absoluteUrl = match.startsWith('/') 
            ? `${baseUrl}${match}`
            : `${baseUrl}/${match}`
          return absoluteUrl
        })
        .replace(/^(?!https?|#)([^\n]+\.(ts|key)[^\n]*)$/gm, (match) => {
          const absoluteUrl = match.startsWith('/') 
            ? `${baseUrl}${match}`
            : `${baseUrl}/${match}`
          return absoluteUrl
        })
      
      body = rewritten
    }
    
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 })
  }
}
