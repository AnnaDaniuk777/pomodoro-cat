import { useMemo } from 'react';
import spriteSheet from '../assets/sprites/cat.png';
import spriteData from '../assets/sprites/cat.json';
import { extractFrames, useSpriteAnimation } from '../hooks/useSpriteAnimation';
import { SCALE } from '../../shared/config';

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
