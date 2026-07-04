import workSheetUrl from '@/shared/assets/sprites/tray-circle-work.png';
import breakSheetUrl from '@/shared/assets/sprites/tray-circle-break.png';

const FRAME_SIZE = 82;
const ICON_SIZE = 32;

const sheets: Record<string, HTMLImageElement | null> = {
  work: null,
  break: null,
};

function loadSheet(mode: 'work' | 'break'): Promise<HTMLImageElement> {
  const cached = sheets[mode];
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      sheets[mode] = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = mode === 'work' ? workSheetUrl : breakSheetUrl;
  });
}

export function progressColor(mode: 'work' | 'break', progress: number): string {
  if (mode === 'break') return '#8ec9ff';
  const remaining = 1 - progress;
  if (remaining > 0.5) return '#7dd87d';
  if (remaining > 0.2) return '#ffcf5c';
  return '#ff6f6f';
}

type TrayIconOptions = {
  mode: 'work' | 'break';
  frame: number;
  progress: number;
  running: boolean;
};

export async function renderTrayIcon({
  mode,
  frame,
  progress,
  running,
}: TrayIconOptions): Promise<string | null> {
  try {
    const sheet = await loadSheet(mode);
    const frameCount = Math.floor(sheet.width / FRAME_SIZE);
    const index = running ? frame % frameCount : 0;

    const canvas = document.createElement('canvas');
    canvas.width = ICON_SIZE;
    canvas.height = ICON_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sheet,
      index * FRAME_SIZE,
      0,
      FRAME_SIZE,
      FRAME_SIZE,
      1,
      1,
      ICON_SIZE - 2,
      ICON_SIZE - 2,
    );

    if (running && progress > 0) {
      ctx.strokeStyle = progressColor(mode, progress);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(
        ICON_SIZE / 2,
        ICON_SIZE / 2,
        ICON_SIZE / 2 - 2,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * Math.min(1, progress),
      );
      ctx.stroke();
    }

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}
