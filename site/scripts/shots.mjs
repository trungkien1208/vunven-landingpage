// Dev helper: screenshots the local preview at several viewports and scroll targets.
import puppeteer from 'puppeteer-core';
const [url, out, ...targets] = process.argv.slice(2);
const vps = { wide: { width: 2000, height: 1000 }, desk: { width: 1440, height: 900 }, mob: { width: 390, height: 844, isMobile: true, hasTouch: true } };
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
for (const [name, vp] of Object.entries(vps)) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  page.on('pageerror', (e) => console.log(`[${name}] ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle0' });
  const info = await page.evaluate(() => ({ header: Math.round(document.querySelector('.top').getBoundingClientRect().height), scrollW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  console.log(name, JSON.stringify(info));
  for (const t of targets) {
    await page.evaluate((id) => window.scrollTo(0, document.getElementById(id).offsetTop - 62), t);
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: `${out}/${name}-${t}.png` });
  }
  await page.close();
}
await browser.close();
