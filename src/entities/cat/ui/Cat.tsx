import { useCallback, useEffect, useMemo, useState } from 'react';
import idleSheet from '@/shared/assets/sprites/cat.png';
import idleData from '@/shared/assets/sprites/cat.json';
import playStartSheet from '@/shared/assets/sprites/cat-play-start.png';
import playStartData from '@/shared/assets/sprites/cat-play-start.json';
import playCycleSheet from '@/shared/assets/sprites/cat-play-cycle.png';
import playCycleData from '@/shared/assets/sprites/cat-play-cycle.json';
import chillStartSheet from '@/shared/assets/sprites/cat-chill-start.png';
import chillStartData from '@/shared/assets/sprites/cat-chill-start.json';
import chillSleepSheet from '@/shared/assets/sprites/cat-chill-sleep.png';
import chillSleepData from '@/shared/assets/sprites/cat-chill-sleep.json';
import { CAT_SCALE } from '@/shared/config';
import {
  extractFrames,
  useSpriteAnimation,
  type AsepriteJSON,
} from '../lib/useSpriteAnimation';

export type CatAnimationName = 'idle' | 'play' | 'chill';

const ALL_SHEETS = [
  idleSheet,
  playStartSheet,
  playCycleSheet,
  chillStartSheet,
  chillSleepSheet,
];

const warmedSheets: HTMLImageElement[] = [];

export function preloadCatSheets() {
  if (warmedSheets.length > 0) return;
  for (const src of ALL_SHEETS) {
    const img = new Image();
    img.src = src;
    void img.decode().catch(() => {});
    warmedSheets.push(img);
  }
}

type Clip = {
  sheet: string;
  data: AsepriteJSON;
  loop: boolean;
  dx: number;
  dy: number;
  scale?: number;
  durationScale?: number;
  range?: [number, number];
  driftTo?: [number, number];
};

const CLIPS: Record<CatAnimationName, Clip[]> = {
  idle: [{ sheet: idleSheet, data: idleData, loop: true, dx: 0, dy: 0 }],
  play: [
    {
      sheet: playStartSheet,
      data: playStartData,
      loop: false,
      dx: 12,
      dy: 7,
    },
    {
      sheet: playCycleSheet,
      data: playCycleData,
      loop: true,
      dx: 0,
      dy: 7,
    },
  ],
  chill: [
    {
      sheet: chillStartSheet,
      data: chillStartData,
      loop: false,
      dx: 4,
      dy: 5,
      driftTo: [-5, -18],
    },
    {
      sheet: chillSleepSheet,
      data: chillSleepData,
      loop: true,
      dx: 2,
      dy: -18,
    },
  ],
};

type CatProps = {
  animation?: CatAnimationName;
};

export function Cat({ animation = 'idle' }: CatProps) {
  const [clipIndex, setClipIndex] = useState(0);
  const [prevAnimation, setPrevAnimation] = useState(animation);

  if (prevAnimation !== animation) {
    setPrevAnimation(animation);
    setClipIndex(0);
  }

  const clips = CLIPS[animation];
  const clip = clips[Math.min(clipIndex, clips.length - 1)];

  const frames = useMemo(() => {
    const base = extractFrames(clip.data, clip.range);
    const scale = clip.durationScale ?? 1;
    if (scale === 1) return base;
    return base.map((frame) => ({
      ...frame,
      duration: frame.duration * scale,
    }));
  }, [clip]);

  const advanceClip = useCallback(() => {
    setClipIndex((index) => Math.min(index + 1, clips.length - 1));
  }, [clips.length]);

  const current = useSpriteAnimation({
    frames,
    loop: clip.loop,
    onComplete: clip.loop ? undefined : advanceClip,
  });

  const [drifted, setDrifted] = useState(false);
  useEffect(() => {
    setDrifted(false);
    if (!clip.driftTo) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setDrifted(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [clip]);

  const clipDuration = useMemo(
    () => frames.reduce((sum, frame) => sum + frame.duration, 0),
    [frames],
  );

  const { x, y, w, h } = current.frame;
  const { w: sheetW, h: sheetH } = clip.data.meta.size;
  const renderScale = CAT_SCALE * (clip.scale ?? 1);
  const [tx, ty] = clip.driftTo && drifted ? clip.driftTo : [clip.dx, clip.dy];

  return (
    <div
      style={{
        width: w * renderScale,
        height: h * renderScale,
        backgroundImage: `url(${clip.sheet})`,
        backgroundPosition: `-${x * renderScale}px -${y * renderScale}px`,
        backgroundSize: `${sheetW * renderScale}px ${sheetH * renderScale}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        transform: `translate(${tx * CAT_SCALE}px, ${ty * CAT_SCALE}px)`,
        transition:
          clip.driftTo && drifted
            ? `transform ${clipDuration}ms ease-in-out`
            : undefined,
      }}
    />
  );
}
