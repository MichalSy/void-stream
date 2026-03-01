import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'

// Extract VOE video URL using Playwright
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

// Extract VOE URL from s.to page
async function extractVoeFromSto(stoUrl: string): Promise<string | null> {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })
  
  const page = await context.newPage()
  
  try {
    await page.goto(stoUrl, { waitUntil: 'networkidle', timeout: 30000 })
    
    // Find VOE hoster link (looking for VOE in hoster list)
    const voeLink = await page.evaluate(() => {
      // Look for VOE hoster button
      const hosterButtons = document.querySelectorAll('a[href*="voe"], a[title*="VOE"], a:has(img[alt*="VOE"])')
      
      for (const btn of hosterButtons) {
        const href = btn.getAttribute('href')
        if (href && (href.includes('voe') || href.startsWith('/'))) {
          return href
        }
      }
      
      // Alternative: Find redirect link in data attributes
      const playBtn = document.querySelector('[data-play-url]')
      if (playBtn) {
        return playBtn.getAttribute('data-play-url')
      }
      
      return null
    })
    
    if (!voeLink) {
      await browser.close()
      return null
    }
    
    // If it's a redirect link, follow it
    if (voeLink.startsWith('/')) {
      const fullUrl = voeLink.startsWith('/r') 
        ? `https://s.to${voeLink}`
        : `https://s.to${voeLink}`
      
      // Follow redirect
      const response = await page.goto(fullUrl, { waitUntil: 'load', timeout: 15000 })
      const finalUrl = response?.url()
      
      await browser.close()
      
      if (finalUrl && finalUrl.includes('voe')) {
        return finalUrl
      }
      
      return null
    }
    
    await browser.close()
    return voeLink
    
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

    // s.to / serienstream.to extraction
    if (url.includes('s.to') || url.includes('serienstream.to')) {
      // Get VOE URL from s.to
      const voeUrl = await extractVoeFromSto(url)
      
      if (!voeUrl) {
        return NextResponse.json({ 
          error: 'Could not find VOE link on s.to page' 
        }, { status: 404 })
      }
      
      // Extract video from VOE
      const videoUrl = await extractVoeUrl(voeUrl)
      
      if (videoUrl) {
        return NextResponse.json({ 
          videoUrl,
          type: 'hls',
          source: 's.to → VOE'
        })
      }
      
      return NextResponse.json({ 
        error: 'Could not extract video from VOE' 
      }, { status: 404 })
    }

    // Direct VOE extraction
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
      error: 'Unsupported URL. Use s.to, VOE, or direct video URLs.' 
    }, { status: 400 })

  } catch (error) {
    console.error('Extract error:', error)
    return NextResponse.json({ 
      error: 'Failed to extract video URL' 
    }, { status: 500 })
  }
}
