import { useMemo } from 'react';
import spriteSheet from '@/shared/assets/sprites/cat.png';
import spriteData from '@/shared/assets/sprites/cat.json';
import { SCALE } from '../../../../shared/config';
import { extractFrames, useSpriteAnimation } from '../lib/useSpriteAnimation';

export function Cat() {
  const frames = useMemo(() => extractFrames(spriteData), []);
  const current = useSpriteAnimation({ frames, loop: true });

  const { x, y, w, h } = current.frame;
  const { w: sheetW, h: sheetH } = spriteData.meta.size;

  return (
    <div
      style={{
        width: w * SCALE,
        height: h * SCALE,
        backgroundImage: `url(${spriteSheet})`,
        backgroundPosition: `-${x * SCALE}px -${y * SCALE}px`,
        backgroundSize: `${sheetW * SCALE}px ${sheetH * SCALE}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
  );
}
