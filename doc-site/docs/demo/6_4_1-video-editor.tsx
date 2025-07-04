import { AVCanvas } from '@webrock/av-canvas';
import {
  AudioClip,
  ImgClip,
  MP4Clip,
  VisibleSprite,
  renderTxt2ImgBitmap,
} from '@webrock/av-cliper';
import {
  Timeline,
  TimelineAction,
  TimelineRow,
  TimelineState,
} from '@xzdarcy/react-timeline-editor';
import { Button, Radio } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { assetsPrefix, createFileWriter } from './utils';

type TLActionWithName = TimelineAction & { name: string };

const uhaParam = new URLSearchParams(location.search).get('UHA') ?? '';
const __unsafe_hardwareAcceleration__ = (
  ['no-preference', 'prefer-hardware', 'prefer-software'].includes(uhaParam)
    ? uhaParam
    : undefined
) as HardwarePreference | undefined;

const TimelineEditor = ({
  timelineData: tlData,
  onPreviewTime,
  onOffsetChange,
  onDurationChange,
  onDeleteAction,
  timelineState,
  onSplitAction,
}: {
  timelineData: TimelineRow[];
  timelineState: React.MutableRefObject<TimelineState | undefined>;
  onPreviewTime: (time: number) => void;
  onOffsetChange: (action: TimelineAction) => void;
  onDurationChange: (args: {
    action: TimelineAction;
    start: number;
    end: number;
  }) => void;
  onDeleteAction: (action: TimelineAction) => void;
  onSplitAction: (action: TLActionWithName) => void;
}) => {
  const [scale, setScale] = useState(10);
  const [activeAction, setActiveAction] = useState<TLActionWithName | null>(
    null,
  );
  return (
    <div className="">
      <div className="mb-2">
        <span className="ml-[10px]">缩放：</span>
        <Button
          onClick={() => setScale(scale + 1)}
          className="border rounded-full"
        >
          -
        </Button>
        <Button
          onClick={() => setScale(scale - 1 > 1 ? scale - 1 : 1)}
          className="border rounded-full"
        >
          +
        </Button>
        <span className="mx-[10px]">|</span>
        <Button
          disabled={activeAction == null}
          className="mx-[10px]"
          onClick={() => {
            if (activeAction == null) return;
            onDeleteAction(activeAction);
          }}
        >
          删除
        </Button>
        <Button
          disabled={activeAction == null}
          className="mx-[10px]"
          onClick={() => {
            if (activeAction == null) return;
            onSplitAction(activeAction);
          }}
        >
          分割
        </Button>
      </div>
      <Timeline
        ref={(v) => {
          if (v == null) return;
          timelineState.current = v;
        }}
        onChange={(d) => {}}
        style={{ width: '100%', height: '200px' }}
        scale={scale}
        editorData={tlData}
        effects={{}}
        scaleSplitCount={5}
        onClickTimeArea={(time) => {
          onPreviewTime(time);
          return true;
        }}
        onCursorDragEnd={(time) => {
          onPreviewTime(time);
        }}
        onActionResizing={({ dir, action, start, end }) => {
          if (dir === 'left') return false;
          return onDurationChange({ action, start, end });
        }}
        onActionMoveEnd={({ action }) => {
          onOffsetChange(action);
        }}
        onClickAction={(_, { action }) => {
          // @ts-expect-error
          setActiveAction(action);
        }}
        // @ts-expect-error
        getActionRender={(action: TLActionWithName) => {
          const baseStyle =
            'h-full justify-center items-center flex text-white';
          if (action.id === activeAction?.id) {
            return (
              <div
                className={`${baseStyle} border border-red-300 border-solid box-border`}
              >
                {action.name}
              </div>
            );
          }
          return <div className={baseStyle}>{action.name}</div>;
        }}
        autoScroll
      />
    </div>
  );
};

const actionSpriteMap = new WeakMap<TimelineAction, VisibleSprite>();

const clipsSrc = assetsPrefix([
  'video/bunny_0.mp4',
  'audio/16kHz-1chan.mp3',
  'img/bunny.png',
]);

export default function App() {
  const [avCvs, setAVCvs] = useState<AVCanvas | null>(null);
  const tlState = useRef<TimelineState>();

  const [playing, setPlaying] = useState(false);
  const [clipSource, setClipSource] = useState('remote');

  const [cvsWrapEl, setCvsWrapEl] = useState<HTMLDivElement | null>(null);
  const [tlData, setTLData] = useState<TimelineRow[]>([
    { id: '1-video', actions: [] },
    { id: '2-audio', actions: [] },
    { id: '3-img', actions: [] },
    { id: '4-text', actions: [] },
  ]);

  useEffect(() => {
    if (cvsWrapEl == null) return;
    avCvs?.destroy();
    const cvs = new AVCanvas(cvsWrapEl, {
      bgColor: '#000',
      width: 1280,
      height: 720,
    });
    setAVCvs(cvs);
    cvs.on('timeupdate', (time) => {
      if (tlState.current == null) return;
      tlState.current.setTime(time / 1e6);
    });
    cvs.on('playing', () => {
      setPlaying(true);
    });
    cvs.on('paused', () => {
      setPlaying(false);
    });

    return () => {
      cvs.destroy();
    };
  }, [cvsWrapEl]);

  function addSprite2Track(trackId: string, spr: VisibleSprite, name = '') {
    const track = tlData.find(({ id }) => id === trackId);
    if (track == null) return null;

    const start =
      spr.time.offset === 0
        ? Math.max(...track.actions.map((a) => a.end), 0) * 1e6
        : spr.time.offset;

    spr.time.offset = start;
    // image
    if (spr.time.duration === Infinity) {
      spr.time.duration = 10e6;
    }

    const action = {
      id: Math.random().toString(),
      start: start / 1e6,
      end: (spr.time.offset + spr.time.duration) / 1e6,
      effectId: '',
      name,
    };

    actionSpriteMap.set(action, spr);

    track.actions.push(action);
    setTLData(
      tlData
        .filter((it) => it !== track)
        .concat({ ...track })
        .sort((a, b) => a.id.charCodeAt(0) - b.id.charCodeAt(0)),
    );
    return action;
  }

  return (
    <div className="canvas-wrap">
      <div ref={(el) => setCvsWrapEl(el)} className="mb-2"></div>
      <Radio.Group
        onChange={(e) => {
          setClipSource(e.target.value);
        }}
        value={clipSource}
      >
        <Radio value="remote">示例素材</Radio>
        <Radio value="local">本地素材</Radio>
      </Radio.Group>
      <span className="mx-[10px]">|</span>
      <Button
        className="mx-[10px]"
        onClick={async () => {
          const stream =
            clipSource === 'local'
              ? (await loadFile({ 'video/*': ['.mp4', '.mov'] })).stream()
              : (await fetch(clipsSrc[0])).body!;
          const spr = new VisibleSprite(
            new MP4Clip(stream, {
              __unsafe_hardwareAcceleration__,
            }),
          );
          await avCvs?.addSprite(spr);
          addSprite2Track('1-video', spr, '视频');
        }}
      >
        + 视频
      </Button>
      <Button
        className="mx-[10px]"
        onClick={async () => {
          const stream =
            clipSource === 'local'
              ? (await loadFile({ 'audio/*': ['.m4a', '.mp3'] })).stream()
              : (await fetch(clipsSrc[1])).body!;
          const spr = new VisibleSprite(new AudioClip(stream));
          await avCvs?.addSprite(spr);
          addSprite2Track('2-audio', spr, '音频');
        }}
      >
        + 音频
      </Button>
      <Button
        className="mx-[10px]"
        onClick={async () => {
          let args;
          if (clipSource === 'local') {
            const f = await loadFile({
              'image/*': ['.png', '.jpeg', '.jpg', '.gif'],
            });
            const stream = f.stream();
            if (/\.gif$/.test(f.name)) {
              args = { type: 'image/gif', stream };
            } else {
              args = stream;
            }
          } else {
            args = (await fetch(clipsSrc[2])).body!;
          }
          // @ts-ignore
          const spr = new VisibleSprite(new ImgClip(args));
          await avCvs?.addSprite(spr);
          addSprite2Track('3-img', spr, '图片');
        }}
      >
        + 图片
      </Button>
      <Button
        className="mx-[10px]"
        onClick={async () => {
          const spr = new VisibleSprite(
            new ImgClip(
              await renderTxt2ImgBitmap(
                '示例文字',
                'font-size: 80px; color: red;',
              ),
            ),
          );
          await avCvs?.addSprite(spr);
          addSprite2Track('4-text', spr, '文字');
        }}
      >
        + 文字
      </Button>
      <span className="mx-[10px]">|</span>
      <Button
        className="mx-[10px]"
        onClick={async () => {
          if (avCvs == null || tlState.current == null) return;
          if (playing) {
            avCvs.pause();
          } else {
            avCvs.play({ start: tlState.current.getTime() * 1e6 });
          }
        }}
      >
        {playing ? '暂停' : '播放'}
      </Button>
      <Button
        className="mx-[10px]"
        onClick={async () => {
          if (avCvs == null) return;
          (await avCvs.createCombinator({ __unsafe_hardwareAcceleration__ }))
            .output()
            .pipeTo(await createFileWriter());
        }}
      >
        导出视频
      </Button>
      <hr className="m-2" />
      <TimelineEditor
        timelineData={tlData}
        timelineState={tlState}
        onPreviewTime={(time) => {
          avCvs?.previewFrame(time * 1e6);
        }}
        onOffsetChange={(action) => {
          const spr = actionSpriteMap.get(action);
          if (spr == null) return;
          spr.time.offset = action.start * 1e6;
        }}
        onDurationChange={({ action, start, end }) => {
          const spr = actionSpriteMap.get(action);
          if (spr == null) return false;
          const duration = (end - start) * 1e6;
          if (duration > spr.getClip().meta.duration) return false;
          spr.time.duration = duration;
          return true;
        }}
        onDeleteAction={(action) => {
          const spr = actionSpriteMap.get(action);
          if (spr == null) return;
          avCvs?.removeSprite(spr);
          actionSpriteMap.delete(action);
          const track = tlData
            .map((t) => t.actions)
            .find((actions) => actions.includes(action));
          if (track == null) return;
          track.splice(track.indexOf(action), 1);
          setTLData([...tlData]);
        }}
        onSplitAction={async (action: TLActionWithName) => {
          const spr = actionSpriteMap.get(action);
          if (avCvs == null || spr == null || tlState.current == null) return;
          const newClips = await spr
            .getClip()
            .split?.(tlState.current.getTime() * 1e6 - spr.time.offset)!;
          // 移除原有对象
          avCvs.removeSprite(spr);
          actionSpriteMap.delete(action);
          const track = tlData.find((t) => t.actions.includes(action));
          if (track == null) return;
          track.actions.splice(track.actions.indexOf(action), 1);
          setTLData([...tlData]);
          // 添加分割后生成的两个新对象
          const sprsDuration = [
            tlState.current.getTime() * 1e6 - spr.time.offset,
            spr.time.duration -
              (tlState.current.getTime() * 1e6 - spr.time.offset),
          ];
          const sprsOffset = [
            spr.time.offset,
            spr.time.offset + sprsDuration[0],
          ];
          for (let i = 0; i < newClips.length; i++) {
            const clip = newClips[i];
            const newSpr = new VisibleSprite(clip);
            if (clip instanceof ImgClip) {
              newSpr.time.duration = sprsDuration[i];
            }
            newSpr.time.offset = sprsOffset[i];
            await avCvs.addSprite(newSpr);
            addSprite2Track(track.id, newSpr, action.name);
          }
        }}
      ></TimelineEditor>
    </div>
  );
}

async function loadFile(accept: Record<string, string[]>) {
  const [fileHandle] = await window.showOpenFilePicker({
    types: [{ accept }],
  });
  return (await fileHandle.getFile()) as File;
}
