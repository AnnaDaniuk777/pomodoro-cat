import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
const lib = readFileSync('node_modules/audiomotion-analyzer/src/audioMotion-analyzer.js', 'utf8');

const GRADIENT = {
  bgColor: '#242641',
  colorStops: [
    { pos: 0, color: '#c68476' },
    { pos: 0.42, color: '#e1a796' },
    { pos: 0.74, color: '#f2d2bf' },
    { pos: 1, color: '#fdf3e8' },
  ],
};

const VARIANTS = [
  ['1. LED, 10 полос (сейчас)', { mode: 8, ledBars: true, showPeaks: true, barSpace: 0.25 }],
  ['2. LED, 20 полос', { mode: 7, ledBars: true, showPeaks: true, barSpace: 0.25 }],
  ['3. Сплошные полосы', { mode: 7, ledBars: false, showPeaks: true, barSpace: 0.2 }],
  ['4. Скруглённые полосы', { mode: 7, ledBars: false, roundBars: true, showPeaks: false, barSpace: 0.3 }],
  ['5. Полосы с отражением', { mode: 7, ledBars: false, reflexRatio: 0.35, reflexAlpha: 0.3, showPeaks: false, barSpace: 0.2 }],
  ['6. Светящиеся (lumi)', { mode: 7, lumiBars: true, showPeaks: false, barSpace: 0.2 }],
  ['7. Контурные', { mode: 7, ledBars: false, outlineBars: true, lineWidth: 1.5, fillAlpha: 0.3, barSpace: 0.25 }],
  ['8. График линией', { mode: 10, fillAlpha: 0.4, lineWidth: 2 }],
  ['9. Зеркальный', { mode: 7, ledBars: true, showPeaks: true, mirror: 1, barSpace: 0.25 }],
  ['10. Полупрозрачные', { mode: 7, alphaBars: true, ledBars: false, showPeaks: false, barSpace: 0.2 }],
];

const W = 546;
const H = 114;

const browser = await chromium.launch({
  args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 }, deviceScaleFactor: 1 });

await page.route('http://eq.local/lib.js', (route) =>
  route.fulfill({ body: lib, contentType: 'application/javascript' }),
);
await page.route('http://eq.local/', (route) =>
  route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html><body style="margin:0;background:#242641">
      <div id="box" style="width:${W}px;height:${H}px"></div>
      <script type="module">
        import AudioMotionAnalyzer from 'http://eq.local/lib.js';
        const ctx = new AudioContext();
        void ctx.resume();
        const master = ctx.createGain();
        master.gain.value = 0.9;
        const tones = [60, 110, 180, 300, 520, 900, 1600, 2800, 5000, 9000];
        tones.forEach((f, i) => {
          const osc = ctx.createOscillator();
          osc.type = i % 3 === 0 ? 'sawtooth' : 'sine';
          osc.frequency.value = f;
          const g = ctx.createGain();
          g.gain.value = 0.5 / (1 + i * 0.35);
          osc.connect(g).connect(master);
          osc.start();
        });
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.25;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        noise.loop = true;
        noise.connect(master);
        noise.start();
        window.__make = (opts) => {
          document.getElementById('box').innerHTML = '';
          const a = new AudioMotionAnalyzer(document.getElementById('box'), {
            audioCtx: ctx, source: master, connectSpeakers: false,
            overlay: true, showBgColor: false, showScaleX: false, showScaleY: false,
            smoothing: 0.6, minDecibels: -70, maxDecibels: -26, minFreq: 45, maxFreq: 14000,
            weightingFilter: 'D', ...opts,
          });
          a.registerGradient('catodoro', ${JSON.stringify(GRADIENT)});
          a.gradient = 'catodoro';
          return true;
        };
      </script></body></html>`,
  }),
);

await page.goto('http://eq.local/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => typeof window.__make === 'function');

mkdirSync(OUT, { recursive: true });
for (const [label, opts] of VARIANTS) {
  await page.evaluate((o) => window.__make(o), opts);
  await page.waitForTimeout(1200);
  const file = join(OUT, label.split('.')[0].padStart(2, '0') + '.png');
  await page.locator('#box').screenshot({ path: file });
  const filled = await page.evaluate(() => {
    const canvas = document.querySelector('#box canvas');
    if (!canvas) return -1;
    const data = canvas
      .getContext('2d')
      .getImageData(0, 0, canvas.width, canvas.height).data;
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 16) painted += 1;
    return Math.round((painted / (canvas.width * canvas.height)) * 100);
  });
  console.log('rendered: ' + label + ' | заполнено ' + filled + '%');
}
writeFileSync(join(OUT, 'labels.json'), JSON.stringify(VARIANTS.map((v) => v[0]), null, 2));
await browser.close();
console.log('done');
