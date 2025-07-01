# WebAV

![GitHub commit activity](https://img.shields.io/github/commit-activity/m/WebAV-Tech/WebAV)
![NPM downloads](https://img.shields.io/npm/dm/@webrock/av-cliper)
[![Release](https://github.com/WebAV-Tech/WebAV/actions/workflows/release.yml/badge.svg)](https://github.com/WebAV-Tech/WebAV/actions/workflows/release.yml)

[English](./README.md) | 中文

WebAV 是 Web 平台上**创建/编辑**视频文件的 SDK，基于 WebCodecs 构建。

_访问 [WebAV Pro](https://github.com/WebAV-Tech/WebAV-Pro) 了解更多高级功能，若有需要您可以购买 Pro 版授权或外包定制化需求， 同时也能帮助作者更好地维护当前项目。_

### 优势

- 跨平台：支持在 Edge、Chrome 浏览器，以及 Electron 中运行
- 零成本：完全在客户端计算，无需服务器成本
- 隐私安全：不会上传用户的任何数据
- 高性能：是 ffmpeg.wasm 的 20 倍，与 Native 性能对比查看 [WebCodecs 性能表现](https://hughfenghen.github.io/posts/2024/07/27/webcodecs-performance-benchmark/)
- 易扩展：对 Web 开发者非常友好，能轻松与 Canvas、WebAudio 配合，实现自定义功能
- 体积小：约 50kb（MINIFIED + GZIPPED, 未 tree-shaking）

_兼容 chrome 102+_

### 应用场景

- 批量音视频文件处理；如：添加水印、配音、嵌入字幕
- 构建音视频相关产品；如：视频剪辑、直播推流、视频动画制作

## DEMO

WebAV 项目有丰富的可快速体验的 DEMO，可以访问 [DEMO 首页](https://webav-tech.github.io/WebAV/demo)检查当前设备的兼容性，点击这里在线体验 [Pro 高级功能](https://webav-tech.github.io/WebAV-Pro/demo)。

_提示：测试用的视频资源托管在 github pages，启动 DEMO 可能需要一些网络加载时间_

下面是你可能感兴趣的功能演示

- [视频合成](https://webav-tech.github.io/WebAV/demo/2_1-concat-video)
- [视频剪辑](https://webav-tech.github.io/WebAV/demo/6_4-video-editor)
- [直播录制](https://webav-tech.github.io/WebAV/demo/4_2-recorder-avcanvas)
- WebAV + Canvas + WebAudio [解码播放视频](https://webav-tech.github.io/WebAV/demo/1_1-decode-video)

## packages 介绍

### [av-cliper](https://webav-tech.github.io/WebAV/_api/av-cliper/)

`av-cliper` 是音视频数据处理的基础 SDK，它提供了一些基础 class 或 function 帮助开发者快速实现目标功能。

这里简要介绍 `av-cliper` 的核心 API

- `IClip` 是音视频素材的抽象，解析音视频、图片、字幕资源，给其他模块提供数据
- `Sprite<IClip>` 给素材附加空间、时间属性，用于控制素材中视频的空间位置、时间偏移，实现多素材协作、动画等功能
- `Combinator` 能添加多个 Sprite，根据它们位置、层级、时间偏移等信息，合成输出为视频文件

<details>
<summary style="cursor: pointer;"> 代码演示：给视频添加一个移动的半透明水印 </summary>

```js
import {
  ImgClip,
  MP4Clip,
  OffscreenSprite,
  renderTxt2ImgBitmap,
  Combinator,
} from '@webrock/av-cliper';

const spr1 = new OffscreenSprite(
  new MP4Clip((await fetch('./video/bunny.mp4')).body),
);
const spr2 = new OffscreenSprite(
  new ImgClip(
    await renderTxt2ImgBitmap(
      '水印',
      `font-size:40px; color: white; text-shadow: 2px 2px 6px red;`,
    ),
  ),
);
spr2.time = { offset: 0, duration: 5e6 };
spr2.setAnimation(
  {
    '0%': { x: 0, y: 0 },
    '25%': { x: 1200, y: 680 },
    '50%': { x: 1200, y: 0 },
    '75%': { x: 0, y: 680 },
    '100%': { x: 0, y: 0 },
  },
  { duration: 4e6, iterCount: 1 },
);
spr2.zIndex = 10;
spr2.opacity = 0.5;

const com = new Combinator({
  width: 1280,
  height: 720,
});

await com.addSprite(spr1);
await com.addSprite(spr2);

com.output(); // => ReadableStream
```

</details>

### [av-canvas](https://webav-tech.github.io/WebAV/_api/av-canvas/)

`av-canvas` 依赖 `av-cliper` 的基础能力，提供一个画布响应用户对 Sprite 的操作（拖拽、缩放、旋转），用于快速实现视频剪辑、直播推流工作台等产品。

<details>
<summary style="cursor: pointer;"> 代码演示：向画布中添加视频与文字 </summary>

```js
import {
  ImgClip,
  MP4Clip,
  VisibleSprite,
  renderTxt2ImgBitmap,
} from '@webrock/av-cliper';
import { AVCanvas } from '@webrock/av-canvas';

const avCvs = new AVCanvas(document.querySelector('#app'), {
  width: 1280,
  height: 720,
});

const spr1 = new VisibleSprite(
  new MP4Clip((await fetch('./video/bunny.mp4')).body),
);
const spr2 = new VisibleSprite(
  new ImgClip(
    await renderTxt2ImgBitmap(
      '水印',
      `font-size:40px; color: white; text-shadow: 2px 2px 6px red;`,
    ),
  ),
);

await avCvs.add(spr1);
await avCvs.add(spr2);

// 将用户编辑的素材导出成视频
// (await avCvs.createCombinator()).output()

// 从画布捕获流（MediaStream），用于直播推流或录制视频
// avCvs.captureStream()
```

</details>

### [av-recorder](https://webav-tech.github.io/WebAV/_api/av-canvas/)

`av-recorder` 录制 `MediaStream` 输出 MP4 格式的视频文件流。

<details>
<summary style="cursor: pointer;"> 代码演示：录制摄像头、麦克风，输出 MP4 文件流 </summary>

```js
import { AVRecorder } from '@webrock/av-recorder';
const mediaStream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
});

const recorder = new AVRecorder(recodeMS);
recorder.start(); // => ReadableStream
```

</details>

## 贡献

### 运行项目

1. clone 当前项目到本地
2. 在根目录下执行 `pnpm install && pnpm build`
3. cd 跳转到特定 package (假设为 av-cliper)，运行 `pnpm dev`
4. path 为 DEMO 目录下的文件名，如 `concat-media.html`
5. 在浏览器中打开 DEMO URL，如 `http://localhost:6066/concat-media.html`
6. `pnpm test` 运行该 package 的单元测试

### 运行 WebAV 站点

1. clone 当前项目到本地
2. 在根目录下执行 `pnpm install && pnpm build`
3. cd 跳转到 `doc-site` 目录，执行 `pnpm dev`
4. 根据终端提示，访问指定 URL

如果你是 Web 音视频领域的初学者，可以先了解入门知识

[作者写的相关文章](https://webav-tech.github.io/WebAV/article)
[Web 音视频知识图谱](https://github.com/hughfenghen/WebAV-KnowledgeGraph)

## 赞助

如果该项目对你有帮助，扫描二维码请作者喝奶茶 ：）

<img src="https://github.com/WebAV-Tech/WebAV/assets/3307051/4b25836a-3f85-4160-b0bf-6c8360fad9a4" width=200 />
<img src="https://github.com/WebAV-Tech/WebAV/assets/3307051/b0d8ff07-71c9-46c1-af33-019420d17c06" width=200 />

---

加微信 `liujun_fenghen` 备注 WebAV，邀请进入 WebAV 音视频技术交流 微信群

## 赞助者

我们要感谢以下 GitHub 赞助者对 WebAV 开发的支持：

<div>
  <a href="https://github.com/425776024"><img src="https://github.com/425776024.png" width="50" height="50" alt="425776024" /></a>
  <a href="https://github.com/CheckCoder"><img src="https://github.com/CheckCoder.png" width="50" height="50" alt="CheckCoder" /></a>
</div>

您的支持帮助我们持续改进和维护这个项目！
