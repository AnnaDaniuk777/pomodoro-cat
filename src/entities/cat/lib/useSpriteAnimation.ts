import { useEffect, useRef, useState } from 'react';

export type SpriteFrame = {
  frame: { x: number; y: number; w: number; h: number };
  duration: number;
};

type AsepriteJSON = {
  frames: Record<string, SpriteFrame>;
  meta: { size: { w: number; h: number } };
};

export function extractFrames(
  data: AsepriteJSON,
  range?: [number, number],
): SpriteFrame[] {
  const sorted = Object.entries(data.frames)
    .map(([name, value]) => {
      const match = name.match(/(\d+)/);
      const index = match ? parseInt(match[1], 10) : 0;
      return { index, value };
    })
    .sort((a, b) => a.index - b.index)
    .map((item) => item.value);

  if (!range) return sorted;
  const [from, to] = range;
  return sorted.slice(from, to + 1);
}

type Options = {
  frames: SpriteFrame[];
  loop?: boolean;
  onComplete?: () => void;
};

export function useSpriteAnimation({
  frames,
  loop = true,
  onComplete,
}: Options): SpriteFrame {
  const [index, setIndex] = useState(0);
  const [prevFrames, setPrevFrames] = useState(frames);
  const rafRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  if (prevFrames !== frames) {
    setPrevFrames(frames);
    setIndex(0);
  }

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (frames.length === 0) return;

    let currentIndex = 0;
    let startTime = performance.now();

    const tick = (now: number) => {
      if (now - startTime >= frames[currentIndex].duration) {
        const next = currentIndex + 1;

        if (next >= frames.length) {
          if (loop) {
            currentIndex = 0;
            setIndex(0);
          } else {
            onCompleteRef.current?.();
            return;
          }
        } else {
          currentIndex = next;
          setIndex(next);
        }

        startTime = now;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [frames, loop]);

  return frames[index] ?? frames[0];
}
