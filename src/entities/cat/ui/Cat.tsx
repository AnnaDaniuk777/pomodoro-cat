import { useMemo } from 'react';
import spriteSheet from '@/shared/assets/sprites/cat.png';
import spriteData from '@/shared/assets/sprites/cat.json';
import { CAT_SCALE } from '@/shared/config';
import { extractFrames, useSpriteAnimation } from '../lib/useSpriteAnimation';

export function Cat() {
  const frames = useMemo(() => extractFrames(spriteData), []);
  const current = useSpriteAnimation({ frames, loop: true });

  const { x, y, w, h } = current.frame;
  const { w: sheetW, h: sheetH } = spriteData.meta.size;

  return (
    <div
      style={{
        width: w * CAT_SCALE,
        height: h * CAT_SCALE,
        backgroundImage: `url(${spriteSheet})`,
        backgroundPosition: `-${x * CAT_SCALE}px -${y * CAT_SCALE}px`,
        backgroundSize: `${sheetW * CAT_SCALE}px ${sheetH * CAT_SCALE}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
  );
}
