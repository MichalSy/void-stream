import { chromium } from 'playwright';

export async function extractVoeUrl(voeUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  // Collect all video URLs
  const videoUrls = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('.m3u8') || url.includes('.mp4')) {
      videoUrls.push(url);
    }
  });
  
  await page.goto(voeUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Try to get jwplayer source
  const jwplayerUrl = await page.evaluate(() => {
    if (typeof jwplayer !== 'undefined') {
      const player = jwplayer();
      return player ? player.getPlaylistItem()?.file : null;
    }
    return null;
  });
  
  await browser.close();
  
  return jwplayerUrl || videoUrls[0] || null;
}

// CLI usage
if (process.argv[2]) {
  extractVoeUrl(process.argv[2]).then(url => {
    if (url) {
      console.log(url);
    } else {
      console.error('No video URL found');
      process.exit(1);
    }
  });
}
