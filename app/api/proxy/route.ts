import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
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
    
    // Return as-is, let hls.js handle URL resolution
    // The key is that ALL requests must go through the proxy
    
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
