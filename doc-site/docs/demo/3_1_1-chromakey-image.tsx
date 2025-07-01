import { createChromakey } from '@webrock/av-cliper';
import { useEffect, useState } from 'react';
import { assetsPrefix } from './utils';

const imgSrc = assetsPrefix(['img/green-dog.jpeg']);

const chromakey = createChromakey({
  // 未设置 keyColor 默认取左上角第一个像素的颜色值
  // keyColor: '#00FF00'
  similarity: 0.4,
  smoothness: 0.05,
  spill: 0.05,
});

async function start(ctx: CanvasRenderingContext2D) {
  const img = new Image();
  img.src = imgSrc[0];
  await new Promise((resolve) => {
    img.onload = resolve;
  });
  ctx.drawImage(
    await chromakey(img),
    0,
    0,
    ctx.canvas.width,
    ctx.canvas.height,
  );
}

export default function UI() {
  const [ctx, setCtx] = useState<null | undefined | CanvasRenderingContext2D>();

  useEffect(() => {
    (async () => {
      if (ctx == null) return;
      start(ctx);
    })();
  }, [ctx]);

  return (
    <div>
      <div>原图</div>
      <img src={imgSrc[0]} style={{ width: 500 }} />
      <div>移除背景</div>
      <canvas
        width={500}
        height={280}
        ref={(c) => {
          setCtx(c?.getContext('2d'));
        }}
      />
    </div>
  );
}
