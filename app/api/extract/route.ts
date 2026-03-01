import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'

async function extractVoeUrl(voeUrl: string): Promise<string | null> {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })
  
  const page = await context.newPage()
  
  // Collect video URLs from network
  const videoUrls: string[] = []
  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('.m3u8')) {
      videoUrls.push(url)
    }
  })
  
  try {
    await page.goto(voeUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)
    
    // Try jwplayer first
    const jwplayerUrl = await page.evaluate(() => {
      if (typeof (window as any).jwplayer !== 'undefined') {
        const player = (window as any).jwplayer()
        return player?.getPlaylistItem()?.file || null
      }
      return null
    })
    
    await browser.close()
    return jwplayerUrl || videoUrls[0] || null
    
  } catch (error) {
    await browser.close()
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Direct video URL
    if (url.includes('.m3u8') || url.includes('.mp4')) {
      return NextResponse.json({ 
        videoUrl: url,
        type: url.includes('.m3u8') ? 'hls' : 'mp4'
      })
    }

    // VOE extraction
    if (url.includes('voe.sx') || url.includes('voe-unblock')) {
      const videoUrl = await extractVoeUrl(url)
      
      if (videoUrl) {
        return NextResponse.json({ 
          videoUrl,
          type: 'hls'
        })
      }
      
      return NextResponse.json({ 
        error: 'Could not extract video from VOE' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      error: 'Unsupported URL. Only VOE and direct video URLs are supported.' 
    }, { status: 400 })

  } catch (error) {
    console.error('Extract error:', error)
    return NextResponse.json({ 
      error: 'Failed to extract video URL' 
    }, { status: 500 })
  }
}
