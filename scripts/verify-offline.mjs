import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {spawn, execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright-core';
import {parseSrt} from '../src/subtitles.mjs';

const root = process.cwd();
const lyrics = parseSrt(await readFile('attachments/lyrics.srt', 'utf8'));
const vocabulary = JSON.parse(await readFile('attachments/vocabulary.json', 'utf8'));
const cue = lyrics.find(line => vocabulary.some(word => line.english.toLowerCase().includes(word.match.toLowerCase())));
const word = vocabulary.find(word => cue.english.toLowerCase().includes(word.match.toLowerCase()));

async function clickScreen(page, side, count = 1) {
  const {width, height} = await page.evaluate(() => ({width: innerWidth, height: innerHeight}));
  // Stay inside the content area and clear of the sidebar and control row.
  const x = width * (side === 'left' ? 0.25 : 0.52);
  for (let click = 0; click < count; click++) await page.mouse.click(x, height * 0.72, {delay: 10});
}

async function checkPlayer(page, label) {
  const errors = [];
  const remote = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
  await page.waitForSelector('.start');
  await page.waitForSelector('.album-background canvas');
  await page.waitForFunction(() => document.querySelector('audio').duration > 0);
  await page.waitForFunction(() => Boolean(document.querySelector('.app').style.getPropertyValue('--card-primary')));
  const buttonChannels = await page.locator('.start').evaluate(button => getComputedStyle(button).backgroundColor.match(/[\d.]+/g).slice(0, 3));
  assert.equal(new Set(buttonChannels).size, 1, `${label}: neutral start button`);
  await page.waitForTimeout(1600);
  const background = page.locator('.album-background');
  const before = await background.screenshot();
  await page.waitForTimeout(1600);
  assert.notDeepEqual(await background.screenshot(), before, `${label}: background should flow`);
  await page.screenshot({path: path.join(os.tmpdir(), `musica-${label}-intro.png`)});

  await page.locator('.mode').click();
  assert.equal(await page.locator('.album-background canvas').count(), 0);
  assert.equal(await page.locator('.album-background-fallback').evaluate(image => image.naturalWidth > 0), true);
  await page.locator('.mode').click();
  await page.waitForSelector('.album-background canvas');
  await page.locator('.start').click();
  await page.waitForSelector('.performance');
  await page.waitForFunction(() => !document.querySelector('audio').paused && document.querySelector('audio').currentTime > 0);
  await page.locator('audio').evaluate((audio, time) => { audio.currentTime = time; audio.dispatchEvent(new Event('timeupdate')); }, cue.start + 0.1);
  await page.waitForFunction(text => document.querySelector('.lyric-row.active .lyric-english')?.textContent === text, cue.english);
  assert.equal(await page.locator('.lyric-row.active .lyric-chinese').textContent(), cue.chinese);
  await page.waitForFunction(term => [...document.querySelectorAll('.word strong')].some(node => node.textContent === term), word.term);
  for (const card of await page.locator('.material-card').all()) {
    const styles = await card.evaluate(element => {
      const style = getComputedStyle(element);
      return {background: style.backgroundColor, image: style.backgroundImage, backdrop: style.backdropFilter, animation: style.animationName};
    });
    assert.match(styles.background, /^rgba\(/, `${label}: translucent tinted card`);
    assert.equal(styles.image, 'none');
    assert.match(styles.backdrop, /blur\(28px\)/);
    assert.equal(styles.animation, 'word-in');
  }
  await page.waitForTimeout(1100);
  await page.screenshot({path: path.join(os.tmpdir(), `musica-${label}-playing.png`)});
  await clickScreen(page, 'right');
  await page.waitForFunction(() => document.querySelector('audio').paused);
  await clickScreen(page, 'right');
  await page.waitForFunction(() => !document.querySelector('audio').paused);
  await page.locator('.fullscreen-button').click();
  await page.waitForFunction(() => Boolean(document.fullscreenElement));
  await page.locator('.fullscreen-button').click();
  await page.waitForFunction(() => !document.fullscreenElement);
  const emptyCue = lyrics.find(line => !vocabulary.some(word => line.english.toLowerCase().includes(word.match.toLowerCase())));
  await page.locator('audio').evaluate((audio, time) => { audio.currentTime = time; audio.dispatchEvent(new Event('timeupdate')); }, emptyCue.start + 0.1);
  await page.waitForFunction(() => document.querySelectorAll('.word').length === 0);
  await page.waitForSelector('.background-note', {state: 'hidden', timeout: 28000});
  await page.evaluate(() => {
    window.verificationClicks = [];
    document.addEventListener('click', event => window.verificationClicks.push({time: performance.now(), x: event.clientX, target: event.target.tagName}));
  });
  await clickScreen(page, 'right', 3);
  try {
    await page.waitForSelector('.ending');
  } catch (error) {
    await page.screenshot({path: path.join(os.tmpdir(), `musica-${label}-ending-failure.png`)});
    console.error(`${label}: screen click diagnostics`, await page.evaluate(() => ({width: innerWidth, height: innerHeight, clicks: window.verificationClicks})));
    throw error;
  }
  assert.equal(await page.locator('audio').evaluate(audio => audio.paused), true);
  await clickScreen(page, 'left', 3);
  await page.waitForSelector('.start');
  assert.deepEqual(errors, [], `${label}: script errors`);
  assert.deepEqual(remote, [], `${label}: remote requests`);
  console.log(`${label}: album background, neutral button, tinted frosted cards, unchanged card animations, timed note dismissal, compatibility, playback, bilingual sync, pause/resume, fullscreen, ending and reload passed`);
}

let executablePath;
for (const candidate of [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean)) {
  try { await access(candidate); executablePath = candidate; break; } catch {}
}
assert.ok(executablePath, 'Set CHROME_PATH to an installed Chromium browser');
if (!process.argv.includes('--electron-only')) {
const browser = await chromium.launch({executablePath, headless: true, args: ['--enable-unsafe-swiftshader']});
try {
  const context = await browser.newContext({offline: true, viewport: {width: 1280, height: 800}});
  const page = await context.newPage();
  await page.goto(pathToFileURL(path.join(root, 'dist-single/index.html')).href);
  await checkPlayer(page, 'html');
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.waitForFunction(() => document.querySelectorAll('.album-background canvas').length === 0);
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.waitForSelector('.album-background canvas');
  await page.setViewportSize({width: 390, height: 844});
  assert.equal(await page.locator('.start').isVisible(), true);
  await page.screenshot({path: path.join(os.tmpdir(), 'musica-html-mobile.png')});
  console.log('html: reduced-motion preference and narrow-screen layout passed');
} finally { await browser.close(); }
}

if (process.argv.includes('--electron') || process.argv.includes('--electron-only')) {
  for (const arch of ['x64', 'ia32']) {
    // Portable launchers do not forward Electron's debugger output to Playwright.
    const port = arch === 'x64' ? 19381 : 19382;
    const launcher = spawn(path.join(root, `release/Stage-Lyrics-1.0.0-${arch}.exe`), [`--remote-debugging-port=${port}`], {windowsHide: true, stdio: 'ignore'});
    let application;
    try {
      const deadline = Date.now() + 120000;
      let lastError;
      while (Date.now() < deadline) {
        try { application = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, {timeout: 2000, noDefaults: true}); break; }
        catch (error) { lastError = error.message; await delay(250); }
      }
      assert.ok(application, `${arch}: portable app did not start: ${lastError}`);
      const context = application.contexts()[0];
      await context.setOffline(true);
      const page = context.pages()[0] || await context.waitForEvent('page');
      await page.setViewportSize({width: 1280, height: 800});
      await checkPlayer(page, arch);
    } finally {
      await application?.close();
      if (launcher.exitCode === null) {
        try { execFileSync('taskkill', ['/PID', String(launcher.pid), '/T', '/F'], {stdio: 'ignore', windowsHide: true}); } catch {}
      }
    }
  }
}
