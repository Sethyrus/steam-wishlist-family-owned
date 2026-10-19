// Genera los iconos de la extensión (public/icon) y los carteles de la ficha (store/out) a partir de store/icon.svg y store/promo.html.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const svg = fs.readFileSync(path.join(root, 'store/icon.svg'), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();

async function renderIcon(size, file, padding = 0) {
  const inner = size - padding * 2;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{position:absolute;left:${padding}px;top:${padding}px;width:${inner}px;height:${inner}px}</style>${svg}`);
  await page.screenshot({ path: file, omitBackground: true });
}

for (const size of [16, 32, 48, 128]) await renderIcon(size, path.join(root, `public/icon/${size}.png`));
// El icono de la ficha lleva 16 px de margen transparente alrededor (96 px de dibujo en 128).
await renderIcon(128, path.join(root, 'store/out/store-icon-128.png'), 16);

const promo = pathToFileURL(path.join(root, 'store/promo.html')).href;
for (const [name, w, h] of [['promo-small-440x280', 440, 280], ['marquee-1400x560', 1400, 560]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`${promo}?`);
  await page.addStyleTag({ content: `:root{--w:${w}px;--h:${h}px}` });
  await page.screenshot({ path: path.join(root, `store/out/${name}.png`) });
}
await browser.close();
console.log('Iconos en public/icon y carteles en store/out');
