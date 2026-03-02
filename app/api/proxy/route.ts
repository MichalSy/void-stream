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
      // Use the request host header to determine the correct origin
      const host = request.headers.get('host') || 'void-stream.sytko.de'
      const protocol = host.includes('localhost') ? 'http' : 'https'
      const proxyBaseUrl = `${protocol}://${host}/api/proxy?url=`
      
      // Rewrite all URLs (absolute and relative) to go through our proxy
      // But skip URLs that are already proxy URLs (avoid double encoding)
      const rewritten = text
        .replace(
          /(https?:\/\/[^\s]+)/g,
          (match) => {
            // Decode and check if already a proxy URL
            try {
              const decoded = decodeURIComponent(match)
              if (decoded.includes('/api/proxy?url=')) return match
            } catch (e) {
              // If decoding fails, continue with normal processing
            }
            return `${proxyBaseUrl}${encodeURIComponent(match)}`
          }
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
