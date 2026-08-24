import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import pngjs from 'pngjs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { PNG } = pngjs;

const URL = process.env.SHOT_URL ?? 'http://localhost:5173';
const OUT = 'docs';
const VIEWPORT = { width: 460, height: 520 };
const LIVE = '.screen-slot:not(.screen-slot--hidden)';

function makeWav(seconds = 8) {
  const rate = 44100;
  const total = rate * seconds;
  const buffer = Buffer.alloc(44 + total * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + total * 2, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(total * 2, 40);
  for (let i = 0; i < total; i += 1) {
    const t = i / rate;
    const beat = Math.max(0, Math.sin(t * Math.PI * 4)) ** 3;
    const sample =
      Math.sin(2 * Math.PI * 70 * t) * 0.45 * beat +
      Math.sin(2 * Math.PI * 320 * t) * 0.25 +
      Math.sin(2 * Math.PI * 1400 * t) * 0.14 +
      Math.sin(2 * Math.PI * 5200 * t) * 0.08 +
      (Math.random() - 0.5) * 0.05;
    buffer.writeInt16LE(Math.max(-1, Math.min(1, sample)) * 26000, 44 + i * 2);
  }
  return buffer;
}

mkdirSync(OUT, { recursive: true });
const wavPath = join(tmpdir(), 'lofi cat beat.wav');
writeFileSync(wavPath, makeWav());

const browser = await chromium.launch({
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
});
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
});
const page = await context.newPage();

const done = [];
async function shot(name, selector = `${LIVE} .screen`) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  await el.screenshot({ path: join(OUT, `${name}.png`) });
  done.push(name);
  console.log('captured: ' + name);
}

function openEyeScore(png) {
  const { width, height, data } = PNG.sync.read(png);
  let score = 0;
  for (let i = 0; i < width * height; i += 1) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    if (r < 130 && g < r && r > b + 15) score += 1;
  }
  return score;
}

async function shotAwake(name, selector = `${LIVE} .screen`) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  let best = null;
  let bestScore = -1;
  for (let i = 0; i < 14; i += 1) {
    const frame = await el.screenshot();
    const score = openEyeScore(frame);
    if (score > bestScore) {
      bestScore = score;
      best = frame;
    }
    await page.waitForTimeout(70);
  }
  writeFileSync(join(OUT, `${name}.png`), best);
  done.push(name);
  console.log('captured: ' + name);
}
const tap = (selector) => page.locator(`${LIVE} ${selector}`).first().click();
const byLabel = (label) => `button[aria-label="${label}"]`;

await page.goto(URL, { waitUntil: 'networkidle' });
await shotAwake('main');

await tap(byLabel('Settings'));
await shot('settings');
await page.locator('.settings-sheet__close').first().click({ force: true });

await tap(byLabel('Tasks'));
for (const text of ['покормить кота', 'дописать плеер', 'размяться']) {
  await page.locator(`${LIVE} .todo__row--new .todo__text`).fill(text);
  await page.locator(`${LIVE} .todo__row--new .todo__text`).press('Enter');
}
await tap('.todo__row:not(.todo__row--new) .todo__checkbox');
await shot('todo');
await tap('.player__back');

await tap(byLabel('Music'));
await page.locator('input[type="file"]').first().setInputFiles(wavPath);
await page.waitForTimeout(500);
await tap('.player__play');
await page.waitForTimeout(2500);
await shot('player');
await tap('.player__back');

await page.evaluate(() => {
  localStorage.setItem(
    'pomodoro-cat-settings',
    JSON.stringify({ workDuration: 1, breakDuration: 300 }),
  );
});
await page.goto(URL, { waitUntil: 'networkidle' });
await tap('.cat-stage__cat');
await page.waitForTimeout(4000);
await shot('break');

await page.goto(`${URL}#widget`, { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await shot('widget-timer', '.widget');

await page.goto(`${URL}#player-widget`, { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.locator('.pwidget').waitFor({ state: 'visible' });
await page.waitForFunction(() => {
  const cat = document.querySelector('.pwidget__cat');
  const volume = document.querySelector('.pwidget__volume-btn');
  if (!cat || !volume) return false;
  const a = cat.getBoundingClientRect();
  const b = volume.getBoundingClientRect();
  return Math.abs(a.left + a.width / 2 - (b.left + b.width / 2)) < 1;
});
await page.waitForTimeout(500);
const clip = await page.evaluate(() => {
  const parts = [...document.querySelectorAll('.pwidget__panel, .pwidget__cat, .pwidget__window-btns')];
  const boxes = parts.map((el) => el.getBoundingClientRect());
  const left = Math.min(...boxes.map((b) => b.left));
  const top = Math.min(...boxes.map((b) => b.top));
  const right = Math.max(...boxes.map((b) => b.right));
  const bottom = Math.max(...boxes.map((b) => b.bottom));
  const pad = 4;
  return { x: left - pad, y: top - pad, width: right - left + pad * 2, height: bottom - top + pad * 2 };
});
await page.screenshot({ path: join(OUT, 'mini-player.png'), clip, omitBackground: true });
console.log('captured: mini-player');
done.push('mini-player');

await browser.close();
console.log('done, ' + done.length + ' shots');
