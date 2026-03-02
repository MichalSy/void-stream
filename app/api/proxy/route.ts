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
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream'
    
    // If it's a playlist (m3u8), rewrite all URLs to go through our proxy
    if (contentType.includes('mpegurl') || url.includes('.m3u8')) {
      const text = new TextDecoder().decode(body)
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)
      const proxyBaseUrl = `${request.nextUrl.origin}/api/proxy?url=`
      
      // Rewrite all URLs (absolute and relative) to go through our proxy
      const rewritten = text
        .replace(
          /(https?:\/\/[^\s]+)/g,
          (match) => `${proxyBaseUrl}${encodeURIComponent(match)}`
        )
        .replace(
          /^([a-zA-Z0-9_-]+\.(m3u8|ts|key)(\?[^\s]*)?)$/gm,
          (match) => `${proxyBaseUrl}${encodeURIComponent(baseUrl + match)}`
        )
      
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
