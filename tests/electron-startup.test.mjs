import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EventEmitter} from 'node:events';
import vm from 'node:vm';
import path from 'node:path';

const source = await readFile(new URL('../electron/main.cjs', import.meta.url), 'utf8');

async function launch(hasLock, loadFails = false, workAreaSize = {width: 1920, height: 1040}) {
  const app = new EventEmitter();
  const windows = [];
  const errors = [];
  let readyCalls = 0;
  let quits = 0;
  app.requestSingleInstanceLock = () => hasLock;
  app.whenReady = () => { readyCalls++; return Promise.resolve(); };
  app.quit = () => { quits++; };
  class BrowserWindow extends EventEmitter {
    constructor(options) {
      super();
      this.options = options;
      this.webContents = new EventEmitter();
      this.webContents.setWindowOpenHandler = () => {};
      this.minimized = false;
      this.destroyed = false;
      this.focuses = 0;
      windows.push(this);
    }
    loadFile() { return loadFails ? Promise.reject(new Error('Missing file')) : Promise.resolve(); }
    isDestroyed() { return this.destroyed; }
    isMinimized() { return this.minimized; }
    restore() { this.minimized = false; }
    show() { this.shown = true; }
    focus() { this.focuses++; }
    close() { this.destroyed = true; this.emit('closed'); }
  }
  vm.runInNewContext(source, {
    require: name => name === 'electron' ? {app, BrowserWindow, screen: {getPrimaryDisplay: () => ({workAreaSize})}, dialog: {showErrorBox: (...args) => errors.push(args)}} : path,
    __dirname: path.resolve('electron')
  });
  await new Promise(resolve => setImmediate(resolve));
  return {app, windows, errors, readyCalls, get quits() { return quits; }};
}

test('a second process quits before starting Electron windows or loading assets', async () => {
  const result = await launch(false);
  assert.equal(result.quits, 1);
  assert.equal(result.readyCalls, 0);
  assert.equal(result.windows.length, 0);
});

test('startup shows immediately and repeated launches restore the existing window', async () => {
  const {app, windows} = await launch(true);
  const win = windows[0];
  assert.equal(win.options.show, true);
  win.minimized = true;
  app.emit('second-instance');
  assert.equal(win.minimized, false);
  assert.equal(win.shown, true);
  assert.equal(win.focuses, 1);
  assert.equal(windows.length, 1);
  win.close();
  assert.doesNotThrow(() => app.emit('second-instance'));
});

test('a missing player page reports failure and closes instead of staying blank', async () => {
  const result = await launch(true, true);
  assert.equal(result.errors.length, 1);
  assert.equal(result.windows[0].destroyed, true);
});

test('initial window and minimum size fit a small scaled desktop work area', async () => {
  const {windows} = await launch(true, false, {width: 800, height: 560});
  const {width, height, minWidth, minHeight} = windows[0].options;
  assert.ok(width < 800 && height < 560);
  assert.ok(minWidth <= width && minHeight <= height);
  assert.equal(windows[0].options.center, true);
});
