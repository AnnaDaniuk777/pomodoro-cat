import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join('docs', 'social-preview.png');
const WIDTH = 1280;
const HEIGHT = 640;

mkdirSync('docs', { recursive: true });

const dataUri = (path, mime) =>
  `data:${mime};base64,${readFileSync(path).toString('base64')}`;

const pixelFont = dataUri(
  'node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2',
  'font/woff2',
);
const screenshot = dataUri('docs/main.png', 'image/png');
const icon = dataUri('build/app-icon.png', 'image/png');

const html = `
<style>
  @font-face {
    font-family: 'Press Start 2P';
    src: url('${pixelFont}') format('woff2');
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    background: #242641;
    font-family: 'Press Start 2P', monospace;
    display: flex;
    align-items: center;
    gap: 64px;
    padding: 0 76px;
    overflow: hidden;
    position: relative;
  }
  .glow {
    position: absolute;
    width: 900px;
    height: 900px;
    right: -180px;
    top: -230px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(63,71,108,0.85) 0%, rgba(36,38,65,0) 68%);
  }
  .text { position: relative; flex: 1; }
  .title {
    display: flex;
    align-items: center;
    gap: 26px;
    margin-bottom: 30px;
  }
  .title img { width: 84px; height: 84px; image-rendering: pixelated; }
  .title h1 { font-size: 58px; color: #fdf3e8; letter-spacing: 1px; }
  .tagline {
    font-size: 20px;
    line-height: 1.75;
    color: #acbae7;
    margin-bottom: 38px;
    max-width: 620px;
  }
  .tags { display: flex; gap: 12px; flex-wrap: wrap; }
  .tag {
    font-size: 13px;
    color: #d8def0;
    border: 2px solid #575c8c;
    background: #2f3154;
    padding: 10px 14px;
  }
  .shot {
    position: relative;
    width: 366px;
    height: 397px;
    flex-shrink: 0;
  }
  .shot img {
    width: 366px;
    height: 397px;
    image-rendering: pixelated;
    filter: drop-shadow(0 18px 34px rgba(0,0,0,0.5));
  }
</style>
<div class="glow"></div>
<div class="text">
  <div class="title">
    <img src="${icon}" alt="">
    <h1>Catodoro</h1>
  </div>
  <p class="tagline">
    A cosy desktop pomodoro timer<br>
    with a pixel cat companion.
  </p>
  <div class="tags">
    <span class="tag">Windows</span>
    <span class="tag">macOS</span>
    <span class="tag">Electron</span>
    <span class="tag">React</span>
    <span class="tag">GPL-3.0</span>
  </div>
</div>
<div class="shot"><img src="${screenshot}" alt=""></div>
`;

const browser = await chromium.launch();
const page = await (
  await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } })
).newPage();
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: OUT });
await browser.close();

console.log(`готово: ${OUT}  ${WIDTH}x${HEIGHT}`);
