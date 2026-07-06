import { _electron as electron } from 'playwright';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const appDir = 'C:/Users/User/Documents/GitHub/cat-animation';

const app = await electron.launch({ args: [appDir], cwd: appDir });

let windows = [];
for (let i = 0; i < 60; i++) {
  windows = app.windows();
  if (windows.length >= 3) break;
  await wait(250);
}
console.log('windows:', windows.map((w) => w.url()));

const main = windows.find((w) => !w.url().includes('#'));
const widget = windows.find((w) => w.url().endsWith('#widget'));
if (!main || !widget) {
  console.log('FAIL: windows not found');
  await app.close();
  process.exit(1);
}

await main.waitForSelector('.timer__text');
const readTimer = () => main.textContent('.timer__text');
const readToggleLabel = () =>
  main.evaluate(() =>
    [...document.querySelectorAll('.timer-row .icon-btn')]
      .map((b) => b.getAttribute('aria-label'))
      .find((l) => l === 'Start' || l === 'Pause'),
  );

console.log('--- TEST 1: start via cat click ---');
await main.click('.cat-stage__cat');
await wait(2500);
console.log('timer after start+2.5s:', await readTimer(), '| button:', await readToggleLabel());

console.log('--- TEST 2: hide main, timer keeps ticking ---');
await app.evaluate(({ BrowserWindow }) => {
  const w = BrowserWindow.getAllWindows().find(
    (x) => !x.webContents.getURL().includes('#'),
  );
  w.hide();
});
await wait(1000);
const widgetVisible = await app.evaluate(({ BrowserWindow }) => {
  const w = BrowserWindow.getAllWindows().find((x) =>
    x.webContents.getURL().endsWith('#widget'),
  );
  return w.isVisible();
});
console.log('widget visible after hide:', widgetVisible);

const tA = await readTimer();
await wait(12000);
const tB = await readTimer();
console.log(`hidden ticking: ${tA} -> ${tB} (12s wall)`);

console.log('--- TEST 3: widget click = pause ---');
await widget.click('.widget');
await wait(1500);
console.log('button after widget click:', await readToggleLabel());

console.log('--- TEST 4: widget click again = resume ---');
await widget.click('.widget');
await wait(1500);
console.log('button after second click:', await readToggleLabel());

console.log('--- TEST 5: widget click precision (5 rapid toggles) ---');
for (let i = 0; i < 5; i++) {
  await widget.click('.widget');
  await wait(700);
  console.log(`  toggle ${i + 1}:`, await readToggleLabel());
}

await app.close();
console.log('DONE');
