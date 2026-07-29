import idleSheet from '@/shared/assets/sprites/cat.png';
import playStartSheet from '@/shared/assets/sprites/cat-play-start.png';
import playCycleSheet from '@/shared/assets/sprites/cat-play-cycle.png';
import chillStartSheet from '@/shared/assets/sprites/cat-chill-start.png';
import chillSleepSheet from '@/shared/assets/sprites/cat-chill-sleep.png';

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
