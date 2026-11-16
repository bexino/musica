# musica

> An offline-capable stage lyrics player that supports bilingual SRT lyrics, dynamic cover backgrounds, and Windows portable EXE builds.

---

## Quick Start

1. On a computer with Node.js installed, run `npm install`, then run `npm run dev` to preview.
2. Replace the asset files in `attachments`, then rebuild:
   - `music.mp3`
   - `cover.jpg`
   - `lyrics.srt`
   - `intro.md`

> [!NOTE]
> Lyrics use UTF-8 SRT; English and Chinese entries with the same timestamp are merged, and Chinese is displayed during playback.

---

## Command Reference

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Local preview |
| `npm run build:exe` | Build a 64-bit Windows portable EXE |
| `npm run build:exe:ia32` | Build a 32-bit Windows portable EXE |
| `npm run build` | Build `dist/` only |
| `npm test` | Check subtitle parsing |
| `npm run verify:offline` | Automatically check the Electron packaged page |
| `npm run verify:offline -- --electron` | Also check both portable EXEs |

---

## Building the Portable Version

- **64-bit version**: Run `npm run build:exe`
- **32-bit version**: Run `npm run build:exe:ia32`
- Double-click to run; extraction is required on first launch.

> [!IMPORTANT]
> Electron 22 is the last major version that supports Windows 7; Windows 7 support must be validated on an actual Windows 7 device.

> [!WARNING]
> After a successful EXE build, `dist/`, the unpacked directory, and the debug manifest are automatically cleaned up; running `npm run build` separately can still generate `dist/`. The legacy duplicate release directory has been removed.

### Artifact Naming

| Version | Default Artifact |
| --- | --- |
| 64-bit | `release/Stage-Lyrics-<Unix millisecond timestamp>-x64.exe` |
| 32-bit (on demand) | `release/Stage-Lyrics-<Unix millisecond timestamp>-ia32.exe` |

The timestamp is generated from the build computer's system time.

---

## Playback Interaction

> [!TIP]
> During playback, click the screen to pause or resume.

| Action | Effect |
| --- | --- |
| Click the screen | Pause / Resume |
| Quickly tap the right half of the screen three times in succession | Stop playback and enter the thank-you page |
| Quickly tap the left half of the screen three times in succession | Reload |

---

## Background and Performance

The background uses the React `BackgroundRender` and `MeshGradientRenderer` from [Apple Music-like Lyrics](https://github.com/amll-dev/applemusic-like-lyrics) to generate a soft, flowing cover color palette from the local `cover.jpg`; the flow stops when playback is paused.

- When the system's "Reduce Motion" setting is enabled, a static soft-focus cover background is used.
- Rendering is paused when the page is hidden.
- The mesh background is globally soft-focused and extended beyond the viewport before being clipped, avoiding clear wavy boundaries or exposed edges between deformed color blocks.

> [!NOTE]
> The player runs with fixed offline assets; all resources are bundled with the offline files and no internet connection is required.

---

## Testing and Offline Verification

| Command | What It Checks |
| --- | --- |
| `npm test` | Checks subtitle parsing |
| `npm run verify:offline` | Automatically checks the cover background, playback, bilingual synchronization, pause, vocabulary cards, fullscreen, and end page of the Electron packaged page |
| `npm run verify:offline -- --electron` | Also checks both portable EXEs |

You can use `CHROME_PATH` to specify a browser.

---

# 简体中文
# musica

> 可离线运行的舞台歌词播放器，支持双语 SRT 歌词、动态封面背景与 Windows 便携版 EXE 构建。

---

## 快速开始

1. 在已安装 Node.js 的电脑上执行 `npm install`，然后运行 `npm run dev` 预览。
2. 替换 `attachments` 中的素材文件，再重新构建：
   - `music.mp3`
   - `cover.jpg`
   - `lyrics.srt`
   - `intro.md`

> [!NOTE]
> 歌词使用 UTF-8 SRT；相同时间的英文和中文条目会合并，播放时显示中文。

---

## 命令速查

| 命令 | 用途 |
| --- | --- |
| `npm install` | 安装依赖 |
| `npm run dev` | 本地预览 |
| `npm run build:exe` | 生成 64 位 Windows 便携版 EXE |
| `npm run build:exe:ia32` | 生成 32 位 Windows 便携版 EXE |
| `npm run build` | 单独生成 `dist/` |
| `npm test` | 检查字幕解析 |
| `npm run verify:offline` | 自动检查 Electron 打包页面 |
| `npm run verify:offline -- --electron` | 同时检查两个 portable EXE |

---

## 构建便携版

- **64 位版本**：运行 `npm run build:exe`
- **32 位版本**：运行 `npm run build:exe:ia32`
- 双击运行，首次启动需要解压。

> [!IMPORTANT]
> Electron 22 是最后支持 Windows 7 的主版本；Windows 7 支持需要在实际 Windows 7 设备上验收。

> [!WARNING]
> EXE 构建成功后自动清理 `dist/`、解包目录及调试清单；单独执行 `npm run build` 仍可生成 `dist/`。旧版重复发布目录已移除。

### 产物命名

| 版本 | 默认产物 |
| --- | --- |
| 64 位 | `release/Stage-Lyrics-<Unix毫秒时间戳>-x64.exe` |
| 32 位（按需） | `release/Stage-Lyrics-<Unix毫秒时间戳>-ia32.exe` |

时间戳由构建电脑的系统时间生成。

---

## 播放交互

> [!TIP]
> 播放时单击屏幕可暂停或继续。

| 操作 | 效果 |
| --- | --- |
| 单击屏幕 | 暂停 / 继续 |
| 快速连续点击右半屏三次 | 停止播放并进入感谢页 |
| 快速连续点击左半屏三次 | 重新加载 |

---

## 背景与性能

背景使用 [Apple Music-like Lyrics](https://github.com/amll-dev/applemusic-like-lyrics) 的 React `BackgroundRender` 和 `MeshGradientRenderer`，从本地 `cover.jpg` 生成柔和流动的封面色彩，暂停播放时停止流动。

- 系统“减少动态效果”设置下，使用静态封面柔焦背景。
- 页面隐藏时暂停渲染。
- 网格背景经过整体柔焦，并在视口外扩展后裁切，避免形变色块之间出现清晰的波浪分界或边缘露底。

> [!NOTE]
> 播放器以离线固定素材运行，所有资源随离线文件打包，无需联网。

---

## 测试与离线验证

| 命令 | 检查内容 |
| --- | --- |
| `npm test` | 检查字幕解析 |
| `npm run verify:offline` | 自动检查 Electron 打包页面的封面背景、播放、双语同步、暂停、词汇卡片、全屏和结束页 |
| `npm run verify:offline -- --electron` | 同时检查两个 portable EXE |

可用 `CHROME_PATH` 指定浏览器。
