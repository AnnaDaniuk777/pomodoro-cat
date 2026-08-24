import { chromium } from 'playwright';
import gifenc from 'gifenc';
import pngjs from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const { GIFEncoder, quantize, applyPalette } = gifenc;
const { PNG } = pngjs;

const URL = process.env.SHOT_URL ?? 'http://localhost:5173';
const OUT = join('docs', 'demo.gif');
const LIVE = '.screen-slot:not(.screen-slot--hidden)';
const FPS = 10;
const FRAME_MS = Math.round(1000 / FPS);

mkdirSync('docs', { recursive: true });

const browser = await chromium.launch();
const page = await (
  await browser.newContext({ viewport: { width: 460, height: 520 } })
).newPage();

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

const screen = page.locator(`${LIVE} .screen`).first();
await screen.waitFor({ state: 'visible' });
const box = await screen.boundingBox();
const clip = {
  x: Math.round(box.x),
  y: Math.round(box.y),
  width: Math.round(box.width),
  height: Math.round(box.height),
};

const frames = [];
async function record(ms, label) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    const started = Date.now();
    frames.push(await page.screenshot({ clip, type: 'png' }));
    const rest = FRAME_MS - (Date.now() - started);
    if (rest > 0) await page.waitForTimeout(rest);
  }
  console.log(`  ${label}: всего ${frames.length} кадров`);
}

const tap = (selector) => page.locator(`${LIVE} ${selector}`).first().click();

await record(1200, 'кот ждёт');
await tap('.cat-stage__cat');
await record(6000, 'таймер запущен, кот играет');

await browser.close();

const pixels = frames.map((png) => new Uint8Array(PNG.sync.read(png).data));

const sample = pixels.filter((_, i) => i % 5 === 0);
const merged = new Uint8Array(sample.reduce((n, f) => n + f.length, 0));
let offset = 0;
for (const frame of sample) {
  merged.set(frame, offset);
  offset += frame.length;
}
const palette = quantize(merged, 256, { format: 'rgb565' });

const gif = GIFEncoder();
for (const frame of pixels) {
  gif.writeFrame(applyPalette(frame, palette, 'rgb565'), clip.width, clip.height, {
    palette,
    delay: FRAME_MS,
    repeat: 0,
  });
}
gif.finish();

const bytes = gif.bytes();
writeFileSync(OUT, Buffer.from(bytes));
console.log(
  `готово: ${OUT}  ${clip.width}x${clip.height}  ${pixels.length} кадров  ${(
    bytes.length / 1024
  ).toFixed(0)} КБ`,
);
