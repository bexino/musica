# 舞台歌词播放器

## 使用

在安装 Node.js 的电脑上执行 `npm install`，然后运行 `npm run dev` 预览。替换 `attachments` 中的 `music.mp3`、`cover.jpg`、`lyrics.srt`、`intro.md`，再重新构建。歌词使用 UTF-8 SRT；相同时间的英文和中文条目会合并，播放时显示中文。


`npm run build:exe` 生成 64 位 Windows 便携版 EXE；需要 32 位版本时运行 `npm run build:exe:ia32`。双击运行，首次启动需要解压。Electron 22 是最后支持 Windows 7 的主版本；播放器以离线固定素材运行。播放时单击屏幕可暂停或继续；快速连续点击右半屏三次会停止播放并进入感谢页，连续点击左半屏三次会重新加载；Windows 7 支持需要在实际 Windows 7 设备上验收。

背景使用 [Apple Music-like Lyrics](https://github.com/amll-dev/applemusic-like-lyrics) 的 React `BackgroundRender` 和 `MeshGradientRenderer`，从本地 `cover.jpg` 生成柔和流动的封面色彩，暂停播放时停止流动。系统“减少动态效果”设置下使用静态封面柔焦背景，页面隐藏时暂停渲染。所有资源随离线文件打包，无需联网。

网格背景经过整体柔焦，并在视口外扩展后裁切，避免形变色块之间出现清晰的波浪分界或边缘露底。


默认产物命名为 `release/Stage-Lyrics-<Unix毫秒时间戳>-x64.exe`；32 位版本按需生成 `release/Stage-Lyrics-<Unix毫秒时间戳>-ia32.exe`。时间戳由构建电脑的系统时间生成。EXE 构建成功后自动清理 `dist/`、解包目录及调试清单；单独执行 `npm run build` 仍可生成 `dist/`。旧版重复发布目录已移除。

`npm test` 检查字幕解析。`npm run verify:offline` 自动检查 Electron 打包页面的封面背景、播放、双语同步、暂停、词汇卡片、全屏和结束页；`npm run verify:offline -- --electron` 同时检查两个 portable EXE。可用 `CHROME_PATH` 指定浏览器。
