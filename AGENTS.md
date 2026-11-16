# 项目约定

本项目是基于 React、Vite 和 Electron 的离线舞台歌词播放器，仅维护 Electron 版本，不再维护独立 HTML，也不构建 MHTML。`dist/` 是 Electron 打包所需的中间产物，不是独立交付物。

`src/main.jsx` 负责播放器及画面切换，`src/subtitles.mjs` 解析字幕，`src/style.css` 定义样式，`src/components/AlbumBackground.jsx` 负责专辑背景，`electron/main.cjs` 是 Electron 入口。固定素材存放于 `attachments/`，测试存放于 `tests/`。不要直接编辑构建产物。

每次修改后运行 `npm test` 和 `npm run build:exe`，默认生成 `release/` 下的 64 位便携程序；仅在明确要求时运行 `npm run build:exe:ia32` 生成 32 位版本，并执行适用的自动检查。构建失败时明确报告，不得将旧产物称为已更新。`npm run build` 仅生成打包用中间文件，`npm run dev` 启动开发服务器。

前端使用 ES 模块，Electron 入口使用 CommonJS；沿用现有代码风格，字幕处理与界面分离。运行素材必须保存在本地。播放或界面改动应尽可能自动验证 Electron 的播放、双语同步和屏幕控制；无法验证时说明原因，不宣称通过。Electron 22 面向 Windows 7，实际支持仍需在 Windows 7 设备上验证。
