import { Combinator, IClip, OffscreenSprite } from '@webrock/av-cliper';
import { useState } from 'react';
import { CombinatorPlay } from './combinator-player';

const WIDTH = 1280;
const HEIGHT = 720;

class CountdownClip implements IClip {
  #cvsEl;
  #ctx;
  #duration;

  ready;

  get meta() {
    return {
      width: this.#cvsEl.width,
      height: this.#cvsEl.height,
      duration: this.#duration * 1e6,
    };
  }

  constructor(duration: number) {
    this.#duration = duration;
    this.#cvsEl = document.createElement('canvas');
    this.#cvsEl.width = WIDTH;
    this.#cvsEl.height = HEIGHT;

    this.ready = Promise.resolve({
      width: WIDTH,
      height: HEIGHT,
      // 单位 微秒
      duration: duration * 1e6,
    });

    this.#ctx = this.#cvsEl.getContext('2d')!;
    this.#ctx.font = `100px Noto Sans SC`;
  }

  async tick(time: number): Promise<{
    video?: VideoFrame;
    state: 'success' | 'done';
  }> {
    if (time > 1e6 * 10) return { state: 'done' };

    this.#ctx.fillStyle = '#333';
    this.#ctx.fillRect(0, 0, this.#cvsEl.width, this.#cvsEl.height);

    this.#ctx.fillStyle = '#FFF';
    // 最重要的是需要知道**某一时刻**应该绘制什么内容
    // 倒计时总时长 - 当前时刻  就是需要绘制的内容
    this.#ctx.fillText(
      String(Math.round((this.#duration * 1e6 - time) / 1000) / 1000),
      this.#cvsEl.width / 2 - 100,
      this.#cvsEl.height / 2,
    );

    return {
      state: 'success',
      video: new VideoFrame(this.#cvsEl, {
        timestamp: time,
      }),
    };
  }

  async clone() {
    return new CountdownClip(this.#duration) as this;
  }

  destroy() {
    this.#cvsEl.remove();
  }
}

async function start() {
  const spr = new OffscreenSprite(new CountdownClip(5));

  const com = new Combinator({ width: WIDTH, height: HEIGHT });
  await com.addSprite(spr, { main: true });
  return com;
}

export default function UI() {
  const [com, setCom] = useState<null | Combinator>(null);

  return (
    <CombinatorPlay
      list={[]}
      onStart={async () => setCom(await start())}
      com={com}
    ></CombinatorPlay>
  );
}
