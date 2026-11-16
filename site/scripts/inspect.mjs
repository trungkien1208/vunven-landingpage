// Dev helper: loads the local preview in headless Chrome, reports overflow, and screenshots scroll positions.
import puppeteer from 'puppeteer-core';
const [url = 'http://localhost:4173/', out = '/tmp'] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
for (const [name, vp] of [['desk', { width: 1440, height: 900 }], ['mob', { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }]]) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  page.on('console', (m) => console.log(`[${name} console] ${m.text()}`));
  page.on('pageerror', (e) => console.log(`[${name} error] ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle0' });
  const wide = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > vw + 1).slice(0, 8)
      .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} right=${Math.round(el.getBoundingClientRect().right)}`);
    return { vw, scrollW: document.documentElement.scrollWidth, offenders };
  });
  console.log(name, JSON.stringify(wide));
  for (const id of ['c0', 'c3', 'hun-plus']) {
    await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'center' }), id);
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: `${out}/${name}-${id}.png` });
  }
  await page.close();
}
await browser.close();
