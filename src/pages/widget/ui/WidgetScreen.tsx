import { useEffect, useMemo, useState } from 'react';
import { extractFrames, useSpriteAnimation } from '@/entities/cat';
import workSheet from '@/shared/assets/sprites/tray-circle-work.png';
import workData from '@/shared/assets/sprites/tray-circle-work.json';
import breakSheet from '@/shared/assets/sprites/tray-circle-break.png';
import breakData from '@/shared/assets/sprites/tray-circle-break.json';
import {
  electronApi,
  type WidgetTimerState,
} from '@/shared/lib/electron-api';
import { progressColor } from '@/shared/lib/tray-icon';

const RING_RADIUS = 39;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export function WidgetScreen() {
  const [timer, setTimer] = useState<WidgetTimerState>({
    mode: 'work',
    status: 'idle',
    progress: 0,
  });

  useEffect(() => {
    electronApi.onTimerState(setTimer);
  }, []);

  const isBreak = timer.mode === 'break';
  const sheet = isBreak ? breakSheet : workSheet;
  const data = isBreak ? breakData : workData;

  const allFrames = useMemo(() => extractFrames(data), [data]);
  const frames = useMemo(
    () => (timer.status === 'running' ? allFrames : allFrames.slice(0, 1)),
    [allFrames, timer.status],
  );

  const current = useSpriteAnimation({ frames, loop: true });
  const { x, y } = current.frame;
  const { w: sheetW, h: sheetH } = data.meta.size;

  return (
    <div
      className="widget"
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        const grabX = e.screenX - window.screenX;
        const grabY = e.screenY - window.screenY;
        const startX = e.screenX;
        const startY = e.screenY;
        let moved = false;
        const move = (ev: MouseEvent) => {
          if (
            !moved &&
            Math.hypot(ev.screenX - startX, ev.screenY - startY) > 4
          ) {
            moved = true;
          }
          if (moved) {
            electronApi.widgetSetPosition(ev.screenX - grabX, ev.screenY - grabY);
          }
        };
        const up = () => {
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
          if (!moved) {
            electronApi.widgetToggle();
          }
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        electronApi.widgetRestore();
      }}
    >
      <div
        className="widget__sprite"
        style={{
          backgroundImage: `url(${sheet})`,
          backgroundPosition: `-${x}px -${y}px`,
          backgroundSize: `${sheetW}px ${sheetH}px`,
        }}
      />
      {timer.progress > 0 && (
        <svg className="widget__ring" viewBox="0 0 84 84">
          <circle
            cx="42"
            cy="42"
            r={RING_RADIUS}
            fill="none"
            stroke={progressColor(timer.mode, timer.progress)}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${RING_LENGTH * Math.min(1, timer.progress)} ${RING_LENGTH}`}
            transform="rotate(-90 42 42)"
          />
        </svg>
      )}
    </div>
  );
}
