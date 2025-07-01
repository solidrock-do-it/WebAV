import { EventTool } from '@webav/internal-utils';
import { IRectBaseProps, Rect } from './rect';

// 缓动函数类型
export enum EasingType {
  Linear = 'linear',
  EaseIn = 'ease-in',
  EaseOut = 'ease-out',
  EaseInOut = 'ease-in-out',
  EaseInQuad = 'ease-in-quad',
  EaseOutQuad = 'ease-out-quad',
  EaseInOutQuad = 'ease-in-out-quad',
  EaseInCubic = 'ease-in-cubic',
  EaseOutCubic = 'ease-out-cubic',
  EaseInOutCubic = 'ease-in-out-cubic',
  EaseInBack = 'ease-in-back',
  EaseOutBack = 'ease-out-back',
  EaseInOutBack = 'ease-in-out-back',
  EaseInBounce = 'ease-in-bounce',
  EaseOutBounce = 'ease-out-bounce',
  EaseInOutBounce = 'ease-in-out-bounce',
}

// 缓动函数映射
export const EASING_FUNCTIONS = {
  [EasingType.Linear]: (t: number) => t,
  [EasingType.EaseIn]: (t: number) => t * t,
  [EasingType.EaseOut]: (t: number) => 1 - (1 - t) * (1 - t),
  [EasingType.EaseInOut]: (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  [EasingType.EaseInQuad]: (t: number) => t * t,
  [EasingType.EaseOutQuad]: (t: number) => 1 - (1 - t) * (1 - t),
  [EasingType.EaseInOutQuad]: (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  [EasingType.EaseInCubic]: (t: number) => t * t * t,
  [EasingType.EaseOutCubic]: (t: number) => 1 - Math.pow(1 - t, 3),
  [EasingType.EaseInOutCubic]: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  [EasingType.EaseInBack]: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  [EasingType.EaseOutBack]: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  [EasingType.EaseInOutBack]: (t: number) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  [EasingType.EaseInBounce]: (t: number) =>
    1 - EASING_FUNCTIONS[EasingType.EaseOutBounce](1 - t),
  [EasingType.EaseOutBounce]: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  [EasingType.EaseInOutBounce]: (t: number) => {
    return t < 0.5
      ? (1 - EASING_FUNCTIONS[EasingType.EaseOutBounce](1 - 2 * t)) / 2
      : (1 + EASING_FUNCTIONS[EasingType.EaseOutBounce](2 * t - 1)) / 2;
  },
};

interface IAnimationOpts {
  duration: number;
  delay?: number;
  iterCount?: number;
  easing?: EasingType;
}

type TAnimateProps = IRectBaseProps & { opacity: number };

export type TAnimationKeyFrame = Array<[number, Partial<TAnimateProps>]>;

type TKeyFrameOpts = Partial<
  Record<`${number}%` | 'from' | 'to', Partial<TAnimateProps>>
>;

/**
 * Sprite 基类
 *
 * @see {@link OffscreenSprite}
 * @see {@link VisibleSprite}
 */
export abstract class BaseSprite {
  rect = new Rect();

  #time = {
    offset: 0,
    duration: 0,
    playbackRate: 1,
  };

  get time(): { offset: number; duration: number; playbackRate: number } {
    return this.#time;
  }
  set time(v: { offset: number; duration: number; playbackRate?: number }) {
    Object.assign(this.#time, v);
  }

  #evtTool = new EventTool<{
    propsChange: (
      value: Partial<{ rect: Partial<Rect>; zIndex: number }>,
    ) => void;
  }>();
  on = this.#evtTool.on;

  #zIndex = 0;
  get zIndex(): number {
    return this.#zIndex;
  }
  set zIndex(v: number) {
    const changed = this.#zIndex !== v;
    this.#zIndex = v;
    if (changed) this.#evtTool.emit('propsChange', { zIndex: v });
  }

  opacity = 1;
  flip: 'horizontal' | 'vertical' | null = null;

  #animatKeyFrame: TAnimationKeyFrame | null = null;
  #animatOpts: Required<IAnimationOpts> | null = null;

  ready = Promise.resolve();

  constructor() {
    this.rect.on('propsChange', (props) => {
      this.#evtTool.emit('propsChange', { rect: props });
    });
  }

  protected _render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  ): void {
    const {
      rect: { center, angle },
    } = this;
    ctx.setTransform(
      this.flip === 'horizontal' ? -1 : 1,
      0,
      0,
      this.flip === 'vertical' ? -1 : 1,
      center.x,
      center.y,
    );
    ctx.rotate((this.flip == null ? 1 : -1) * angle);
    ctx.globalAlpha = this.opacity;
  }

  /**
   * 给素材添加动画，支持缓动
   */
  setAnimation(keyFrame: TKeyFrameOpts, opts: IAnimationOpts): void {
    this.#animatKeyFrame = Object.entries(keyFrame).map(([k, val]) => {
      const numK = { from: 0, to: 100 }[k] ?? Number(k.slice(0, -1));
      if (isNaN(numK) || numK > 100 || numK < 0) {
        throw Error('keyFrame must between 0~100');
      }
      return [numK / 100, val];
    }) as TAnimationKeyFrame;
    this.#animatOpts = Object.assign({}, this.#animatOpts, {
      duration: opts.duration,
      delay: opts.delay ?? 0,
      iterCount: opts.iterCount ?? Infinity,
      easing: opts.easing ?? EasingType.Linear,
    });
  }

  animate(time: number): void {
    if (
      this.#animatKeyFrame == null ||
      this.#animatOpts == null ||
      time < this.#animatOpts.delay
    )
      return;
    const updateProps = linearTimeFn(
      time,
      this.#animatKeyFrame,
      this.#animatOpts,
    );
    for (const k in updateProps) {
      switch (k) {
        case 'opacity':
          this.opacity = updateProps[k] as number;
          break;
        case 'x':
        case 'y':
        case 'w':
        case 'h':
        case 'angle':
          this.rect[k] = updateProps[k] as number;
          break;
      }
    }
  }

  getAnimatKeyFrame(): TAnimationKeyFrame | null {
    return this.#animatKeyFrame;
  }
  setAnimatKeyFrame(val: TAnimationKeyFrame | null) {
    this.#animatKeyFrame = val;
  }

  getAnimatOpts(): Required<IAnimationOpts> | null {
    return this.#animatOpts;
  }
  setAnimatOpts(val: Required<IAnimationOpts> | null) {
    this.#animatOpts = val;
  }

  copyStateTo<T extends BaseSprite>(target: T) {
    target.setAnimatKeyFrame(this.getAnimatKeyFrame());
    target.setAnimatOpts(this.getAnimatOpts());
    target.zIndex = this.zIndex;
    target.opacity = this.opacity;
    target.flip = this.flip;
    target.rect = this.rect.clone();
    target.time = { ...this.time };
  }

  protected destroy() {
    this.#evtTool.destroy();
  }
}

/**
 * 动画关键帧插值，支持缓动类型
 */
export function linearTimeFn(
  time: number,
  kf: TAnimationKeyFrame,
  opts: Required<IAnimationOpts>,
): Partial<TAnimateProps> {
  const offsetTime = time - opts.delay;
  if (offsetTime / opts.duration >= opts.iterCount) return {};

  const t = offsetTime % opts.duration;
  const process = offsetTime === opts.duration ? 1 : t / opts.duration;
  const idx = kf.findIndex((it) => it[0] >= process);
  if (idx === -1) return {};

  const startState = kf[idx - 1];
  const nextState = kf[idx];
  const nextFrame = nextState[1];
  if (startState == null) return nextFrame;
  const startFrame = startState[1];

  const rs: Partial<TAnimateProps> = {};
  // 介于两个Frame状态间的进度，应用缓动
  const rawStateProcess =
    (process - startState[0]) / (nextState[0] - startState[0]);
  const easingFn =
    EASING_FUNCTIONS[opts.easing!] ?? EASING_FUNCTIONS[EasingType.Linear];
  const stateProcess = easingFn(rawStateProcess);

  for (const prop in nextFrame) {
    const p = prop as keyof TAnimateProps;
    if (startFrame[p] == null) continue;
    // @ts-expect-error
    rs[p] = (nextFrame[p] - startFrame[p]) * stateProcess + startFrame[p];
  }

  return rs;
}
