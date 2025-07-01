import {
  Combinator,
  ImgClip,
  MP4Clip,
  OffscreenSprite,
  createChromakey,
  fastConcatMP4,
} from '@webrock/av-cliper';
import { useState } from 'react';
import { CombinatorPlay } from './combinator-player';
import { assetsPrefix } from './utils';

const videoList = assetsPrefix([
  'video/123.mp4',
  'video/223.mp4',
  'video/323.mp4',
]);
const imgList = assetsPrefix(['img/bunny.png']);

const chromakey = createChromakey({
  similarity: 0.35,
  smoothness: 0.1,
  spill: 0.1,
});

async function start() {
  const width = 1280;
  const height = 720;

  // Remove background, add bunny as new background, composite video
  const coms = (
    await Promise.all(videoList.map(async (vurl) => (await fetch(vurl)).body!))
  )
    .map((sbody) => {
      const clip = new MP4Clip(sbody);
      clip.tickInterceptor = async (_, tickRet) => {
        if (tickRet.video == null) return tickRet;
        return {
          ...tickRet,
          video: await chromakey(tickRet.video),
        };
      };
      return clip;
    })
    .map((clip, idx) => new OffscreenSprite(clip))
    .map(async (spr, idx) => {
      const com = new Combinator({ width, height });
      const imgSpr = new OffscreenSprite(
        new ImgClip(
          await createImageBitmap(await (await fetch(imgList[0])).blob()),
        ),
      );
      await spr.ready;
      spr.rect.x = idx * spr.rect.w;
      await com.addSprite(imgSpr);
      await com.addSprite(spr, { main: true });
      return com.output();
    });

  return await fastConcatMP4(await Promise.all(coms));
}

export default function UI() {
  const [stream, setStream] = useState<null | ReadableStream>(null);
  return (
    <CombinatorPlay
      list={videoList.concat(imgList)}
      onStart={async () => setStream(await start())}
      stream={stream}
    ></CombinatorPlay>
  );
}
