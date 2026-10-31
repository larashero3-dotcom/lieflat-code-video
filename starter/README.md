# A runnable launch-film starter / 可运行的发布片起步工程

An editable **12-second, 1920 × 1080, 30 fps** film for a fictional notes app. It uses the project's camera, typography, spring and transition helpers. This is the complete source for this small example, with no dependency on private project folders.

一个可修改的 **12 秒、1920 × 1080、30 fps** 虚构笔记产品发布片，包含运行这个示例所需的完整源码。使用本项目的镜头、文字、弹簧和转场组件，不依赖私有目录。

## Run / 运行

Install Node.js 22 or newer, then run these commands from this folder. The first installation and browser setup need network access.

安装 Node.js 22 或更新版本，在本目录执行。首次安装依赖和渲染浏览器需要联网。

```bash
npm ci
npm run typecheck
npm test
npm run check
npm run studio
```

Open the local Studio address printed in the terminal. In another terminal, from this same folder:

打开终端显示的本地预览地址。另开一个终端，在同一目录中导出：

```bash
npm run preview
npm run render
```

| Command / 命令 | Output / 结果 |
| --- | --- |
| `npm test` | Timeline regression tests / 时间线异常输入与连续性测试 |
| `npm run studio` | Interactive timeline preview / 可拖动时间线的预览 |
| `npm run preview` | `out/preview.mp4` · 960 × 540, motion blur off / 关闭运动模糊，快速检查 |
| `npm run render` | `out/film.mp4` · 1920 × 1080, H.264, CRF 17, motion blur on / 完整画质导出 |
| `npm run still` | `out/still.png` · frame 180 / 第 180 帧静帧 |
| `npm run events` | `out/events.json` · timing cues for audio editing / 音效卡点参考，不会自动合成音效 |

## Make it yours / 改成你的产品

1. **`src/content.ts`** — edit the product name, accent color, headline, prompt, three result rows, three rotating words and closing URL. Keep copy short enough to fit the layout.
2. **`src/film.ts`** — edit timing, beat grid, sections and events. Run `npm run check` after changing the timing. The default layout and helpers target 1080p at 30 fps; changing orientation or frame rate requires adapting them too.
3. **`src/Video.tsx`** — replace the mock interface with your own product interaction and compose additional shots.
4. **`src/kit/`** — reuse the camera, spring, typography, depth, pointer and transition helpers.

对应中文：先改 `src/content.ts` 的产品内容，再按需改 `src/film.ts` 的节奏和 `src/Video.tsx` 的界面。结果清单和转轮默认各三项；文案变长时需要检查排版。默认是横屏 1080p、30 fps，更改比例或帧率时也要调整布局及动画参数。

## Sound & fonts / 声音与字体

The example is **silent by default**. To add your own licensed music, place a file such as `music.mp3` in `public/`, set `musicFile: 'music.mp3'` in `src/content.ts`, then render again. `musicVolume` controls gain, with short fades at the beginning and end. Choose a track long enough for the film. Automatic beat detection, event-based sound design and mixing are not included.

示例**默认无声**。把你有权使用的音乐放到 `public/music.mp3`，在 `src/content.ts` 设置 `musicFile: 'music.mp3'`，即可在导出时加入。`musicVolume` 控制音量，已带首尾短淡变。音乐应覆盖影片时长；自动测节拍、事件音效编排和混音不包含在本起步工程中。

Inter and JetBrains Mono are installed with the npm dependencies and bundled locally. Rendering does not fetch Google Fonts. They do not cover Chinese; for Chinese content, add a properly licensed Chinese font and update `src/kit/fonts.ts` before rendering.

Inter 与 JetBrains Mono 随依赖安装并在本地打包，渲染时不请求 Google Fonts。它们不覆盖中文；制作中文影片时，请补充有授权的中文字体并修改 `src/kit/fonts.ts`。

## Check the actual picture / 检查真实画面

The checker evaluates the declared timeline. Passing it does not prove that the rendered video has no clipping, unreadable text or weak transitions. Watch the preview, inspect every scene boundary and hold the closing message long enough to read. The final render enables motion blur; inspect that output as well.

检查脚本检查的是声明的时间线，不能替代看片。通过检查不等于画面没有裁切、文字可读或转场自然。请检查预览中的每个场景衔接，并确保结尾有足够阅读时间；正式导出启用运动模糊，也要复看。

## Dependency maintenance / 依赖维护

The lockfile fixes dependency versions. `package.json` overrides the transitive `zod` dependency to 4.6.7 for a security fix; Remotion 4.0.538 may report that it expects 4.5.4. Keep the override until an upstream update includes the fix, and rerun the checks and a render after dependency changes.

依赖版本已锁定。为修复安全问题，`package.json` 将间接依赖 `zod` 固定为 4.6.7；Remotion 4.0.538 可能提示它原本要求 4.5.4。在上游更新包含修复之前，请保留此覆盖设置；更改依赖后应重新检查并导出验证。

License: [PolyForm Noncommercial 1.0.0](LICENSE.md). Commercial licensing: [larashero3@gmail.com](mailto:larashero3@gmail.com). Dependencies retain their own licenses; see [third-party notices](THIRD_PARTY_NOTICES.md).
