import { useMemo } from 'react';
import {
  extractFrames,
  useSpriteAnimation,
  type AsepriteJSON,
} from '@/entities/cat';
import { cssUrl } from '@/shared/lib/css-url';

type SpriteBurstProps = {
  sheet: string;
  data: AsepriteJSON;
  scale: number;
  className: string;
  onDone: () => void;
};

export function SpriteBurst({
  sheet,
  data,
  scale,
  className,
  onDone,
}: SpriteBurstProps) {
  const frames = useMemo(() => extractFrames(data), [data]);
  const current = useSpriteAnimation({
    frames,
    loop: false,
    onComplete: onDone,
  });

  const { x, y, w, h } = current.frame;
  const { w: sheetW, h: sheetH } = data.meta.size;

  return (
    <div
      className={className}
      style={{
        width: w * scale,
        height: h * scale,
        backgroundImage: cssUrl(sheet),
        backgroundPosition: `-${x * scale}px -${y * scale}px`,
        backgroundSize: `${sheetW * scale}px ${sheetH * scale}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
  );
}
