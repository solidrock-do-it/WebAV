import { MP4Clip } from '@webrock/av-cliper';
import { useEffect, useState } from 'react';
import { assetsPrefix } from './utils';

const resList = assetsPrefix(['video/bunny.mp4']);

async function start() {
  const clip = new MP4Clip((await fetch(resList[0])).body!);
  await clip.ready;
  let t = performance.now();
  const imgList = await clip.thumbnails(200, {
    start: 10e6,
    end: 20e6,
    step: 1e6,
  });
  const cost = ((performance.now() - t) / 1000).toFixed(2);
  return {
    imgList,
    cost,
  };
}

export default function UI() {
  const [imgList, setImgList] = useState<Array<{ ts: number; img: string }>>(
    [],
  );
  const [cost, setCost] = useState(0);

  useEffect(() => {
    (async () => {
      const { imgList, cost } = await start();
      setImgList(
        imgList.map((it) => ({
          ts: it.ts,
          img: URL.createObjectURL(it.img),
        })),
      );
      setCost(cost);
    })();
  }, []);

  return (
    <>
      <div>
        {imgList.length === 0
          ? 'loading...'
          : `耗时：${cost}s，提取帧数：${imgList.length}`}
      </div>
      <br />
      <div className="flex flex-wrap">
        {imgList.map((it) => (
          <div key={it.ts}>
            <div className="text-center">{(it.ts / 1e6).toFixed(2)}s</div>
            <img src={it.img}></img>
          </div>
        ))}
      </div>
    </>
  );
}
