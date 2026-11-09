import assert from 'node:assert/strict';
import {execFileSync, spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import path from 'node:path';
import {chromium} from 'playwright-core';

// Load the window probe before starting the clock so PowerShell startup is excluded.
const probe = `
$ProgressPreference = 'SilentlyContinue'
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class StartupWindows {
  public delegate bool Callback(IntPtr window, IntPtr data);
  [DllImport("user32.dll")] public static extern bool EnumWindows(Callback callback, IntPtr data);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr window);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window, out uint pid);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr window, int command);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr window);
  public static bool Visible(int pid) {
    bool found = false;
    EnumWindows((window, data) => {
      uint owner; GetWindowThreadProcessId(window, out owner);
      if (owner == pid && IsWindowVisible(window)) found = true;
      return true;
    }, IntPtr.Zero);
    return found;
  }
}
'@
$clock = [Diagnostics.Stopwatch]::StartNew()
$process = Start-Process -FilePath $env:MUSICA_TEST_EXE -ArgumentList $env:MUSICA_TEST_ARGS -PassThru -WindowStyle Hidden
while ($clock.ElapsedMilliseconds -lt 30000) {
  if ([StartupWindows]::Visible($process.Id)) {
    @{ pid = $process.Id; visibleMs = $clock.ElapsedMilliseconds } | ConvertTo-Json -Compress
    exit 0
  }
  Start-Sleep -Milliseconds 20
}
Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
throw 'No visible launcher window within 30 seconds'
`;

function nativeWindow(action) {
  const script = probe.slice(0, probe.indexOf('$clock =')) + `
$window = (Get-Process -Name 'Stage Lyrics' | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1).MainWindowHandle
if (!$window) { throw 'Player window not found' }
${action}
`;
  return execFileSync('powershell', ['-NoProfile', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], {encoding: 'utf8', windowsHide: true}).trim();
}

for (const [index, arch] of ['x64', 'ia32'].entries()) {
  const exe = path.resolve(`release/Stage-Lyrics-1.0.0-${arch}.exe`);
  const port = 19481 + index;
  const start = Date.now();
  const launch = JSON.parse(execFileSync('powershell', ['-NoProfile', '-EncodedCommand', Buffer.from(probe, 'utf16le').toString('base64')], {
    encoding: 'utf8', windowsHide: true,
    env: {...process.env, MUSICA_TEST_EXE: exe, MUSICA_TEST_ARGS: `--remote-debugging-port=${port}`}
  }).trim());
  let browser;
  const duplicates = [];
  try {
    // Repeat the launch while the first instance may still be extracting.
    const repeat = spawn(exe, [`--remote-debugging-port=${port}`], {windowsHide: true, stdio: 'ignore'});
    duplicates.push(repeat);
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, {timeout: 1000, noDefaults: true}); break; }
      catch { await delay(100); }
    }
    assert.ok(browser, `${arch}: player did not launch`);
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.waitForEvent('page');
    await page.waitForSelector('.start');
    assert.equal(await page.locator('.fullscreen-button').evaluate(button => {
      const bounds = button.getBoundingClientRect();
      return bounds.top >= 0 && bounds.bottom <= innerHeight && bounds.right <= innerWidth;
    }), true, `${arch}: fullscreen control fits the actual Electron content area`);
    console.log(`${arch}: native startup feedback ${launch.visibleMs} ms; player ready within ${Date.now() - start} ms (includes probe setup)`);
    const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
    const repeatDeadline = Date.now() + 60000;
    // Either racing launcher may win the application lock.
    while (alive(launch.pid) && repeat.exitCode === null && Date.now() < repeatDeadline) await delay(100);
    assert.equal(Number(alive(launch.pid)) + Number(repeat.exitCode === null), 1, 'Exactly one portable launcher must remain');
    assert.equal(context.pages().length, 1, 'Repeated launch must keep one player');

    const session = await context.newCDPSession(page);
    await page.evaluate(() => { window.startupTestMarker = 'preserved'; });
    nativeWindow('[StartupWindows]::ShowWindow($window, 6) | Out-Null');
    assert.equal(nativeWindow('[StartupWindows]::IsIconic($window)'), 'True');
    const second = spawn(exe, [], {windowsHide: true, stdio: 'ignore'});
    duplicates.push(second);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Second launcher did not exit')), 60000);
      second.once('exit', () => { clearTimeout(timeout); resolve(); });
      second.once('error', error => { clearTimeout(timeout); reject(error); });
    });
    assert.equal(nativeWindow('[StartupWindows]::IsIconic($window)'), 'False');
    assert.equal(await page.evaluate(() => window.startupTestMarker), 'preserved', 'Existing player must not reload');
    assert.equal(context.pages().length, 1);

    // Simulate slow scripts: loading feedback must be usable before React runs.
    await session.send('Network.enable');
    await session.send('Network.setBlockedURLs', {urls: ['*.js']});
    await page.reload({waitUntil: 'domcontentloaded'});
    assert.match(await page.locator('[role="status"]').textContent(), /正在加载歌曲与画面/);
    await page.screenshot({path: path.resolve(`build/loading-${arch}.png`)});
    await session.send('Network.setBlockedURLs', {urls: []});
    await page.reload();
    await page.waitForSelector('.start');
    console.log(`${arch}: repeated startup during extraction, single player, minimized-window restore, preserved state and pre-React loading feedback passed`);
  } finally {
    await browser?.close();
    for (const pid of [launch.pid, ...duplicates.map(child => child.pid)]) {
      try { execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], {windowsHide: true, stdio: 'ignore'}); } catch {}
    }
  }
}
