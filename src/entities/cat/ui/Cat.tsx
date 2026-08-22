import { useCallback, useMemo, useState } from 'react';
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

type Clip = {
  sheet: string;
  data: AsepriteJSON;
  loop: boolean;
  dx: number;
  dy: number;
  scale?: number;
  squash?: [number, number];
  durationScale?: number;
  range?: [number, number];
};

const CLIPS: Record<CatAnimationName, Clip[]> = {
  idle: [{ sheet: idleSheet, data: idleData, loop: true, dx: 0, dy: 0 }],
  play: [
    {
      sheet: playStartSheet,
      data: playStartData,
      loop: false,
      dx: 12,
      dy: 1,
      squash: [1, 0.9646],
    },
    {
      sheet: playCycleSheet,
      data: playCycleData,
      loop: true,
      dx: 0,
      dy: 1,
      squash: [1, 0.9646],
    },
  ],
  chill: [
    {
      sheet: chillStartSheet,
      data: chillStartData,
      loop: false,
      dx: 4,
      dy: 1,
    },
    {
      sheet: chillSleepSheet,
      data: chillSleepData,
      loop: true,
      dx: 11,
      dy: 1,
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

  const { x, y, w, h } = current.frame;
  const { w: sheetW, h: sheetH } = clip.data.meta.size;
  const renderScale = CAT_SCALE * (clip.scale ?? 1);

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
        transform: `translate(${clip.dx * CAT_SCALE}px, ${clip.dy * CAT_SCALE}px) scale(${clip.squash?.[0] ?? 1}, ${clip.squash?.[1] ?? 1})`,
        transformOrigin: '50% 100%',
      }}
    />
  );
}
