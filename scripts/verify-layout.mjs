import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {chromium} from 'playwright-core';

let executablePath;
for (const candidate of [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean)) {
  try { await access(candidate); executablePath = candidate; break; } catch {}
}
assert.ok(executablePath, 'No Chromium browser found');
const browser = await chromium.launch({executablePath, headless: true});
try {
  for (const scale of [1, 1.5, 2]) {
    const context = await browser.newContext({offline: true, deviceScaleFactor: scale, reducedMotion: 'reduce'});
    const page = await context.newPage();
    await page.goto(pathToFileURL(path.resolve('dist-single/index.html')).href);
    await page.waitForSelector('.start');
    for (const [width, height] of [[1366,768], [1024,600], [800,450], [640,360], [390,844], [320,480]]) {
      await page.setViewportSize({width, height});
      await page.waitForFunction(height => document.querySelector('.app').clientHeight === height, height);
      await page.locator('.fullscreen-button').scrollIntoViewIfNeeded();
      const intro = await page.locator('.fullscreen-button').boundingBox();
      assert.ok(intro.y >= 0 && intro.y + intro.height <= height, `intro control visible: ${width}x${height} @${scale}`);
    }
    await page.locator('.start').click();
    await page.waitForSelector('.performance');
    for (const [width, height] of [[1366,768], [1024,600], [800,450], [640,360], [390,844], [320,480]]) {
      await page.setViewportSize({width, height});
      await page.waitForFunction(height => document.querySelector('.app').clientHeight === height, height);
      const metrics = await page.evaluate(() => {
        const rect = selector => {
          const {x,y,width,height,bottom} = document.querySelector(selector).getBoundingClientRect();
          return {x,y,width,height,bottom,center:y+height/2};
        };
        return {button:rect('.fullscreen-button'), progress:rect('.progress'), time:rect('.time'), scene:rect('.scene'), footer:rect('.player-footer'), scroll:document.documentElement.scrollHeight};
      });
      const label = `${width}x${height} @${scale}`;
      assert.ok(metrics.button.x >= 0 && metrics.button.x + metrics.button.width <= width, `${label}: button inside horizontal bounds`);
      assert.ok(metrics.button.y >= 0 && metrics.button.bottom <= height, `${label}: button inside vertical bounds`);
      assert.ok(metrics.progress.width >= 24, `${label}: progress remains visible`);
      assert.ok(Math.abs(metrics.button.center - metrics.progress.center) < 1, `${label}: button aligned with progress`);
      assert.ok(Math.abs(metrics.button.center - metrics.time.center) < 1, `${label}: time aligned with progress`);
      assert.ok(metrics.scene.bottom <= metrics.footer.y + 1, `${label}: controls have reserved space`);
      assert.ok(metrics.scroll <= height, `${label}: no viewport overflow`);
      if (scale === 1 && [800,390,640].includes(width)) await page.screenshot({path:path.resolve(`build/layout-${width}x${height}.png`)});
    }
    await page.locator('.fullscreen-button').click();
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    await page.locator('.fullscreen-button').click();
    await page.waitForFunction(() => !document.fullscreenElement);
    await context.close();
    console.log(`layout: 6 viewport sizes at scale ${scale}, intro control visibility, playback footer alignment, no clipping and fullscreen passed`);
  }
} finally { await browser.close(); }
