// Capturas de 1280x800 para la ficha de la tienda: tu wishlist real, pero con la familia sustituida por datos
// ficticios (interceptados en red) y recortada para que no salga tu usuario ni tu saldo.
// Requiere `npm run build` y una sesión en .e2e-profile (npm run e2e:login). Trabaja sobre una COPIA del perfil.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const EXT = path.join(root, '.output/chrome-mv3');
const OUT = path.join(root, 'store/screenshots');
const FAKE = { 1001: ['Ana', '#e07a5f'], 1002: ['Luis', '#3d85c6'], 1003: ['Marta', '#81b29a'] };
const BASE = 76561197960265728n;
const fakeId = (n) => String(BASE + BigInt(n));
const fakeAccounts = Object.keys(FAKE).map(Number);

if (!fs.existsSync(EXT)) throw new Error('Falta .output/chrome-mv3: ejecuta npm run build');
if (!fs.existsSync(path.join(root, '.e2e-profile'))) throw new Error('Falta .e2e-profile: ejecuta npm run e2e:login');
fs.mkdirSync(OUT, { recursive: true });

const tmp = fs.mkdtempSync(path.join(process.env.SHOTS_TMP ?? os.tmpdir(), 'fo-shots-'));
const profile = path.join(tmp, 'profile');
fs.cpSync(path.join(root, '.e2e-profile'), profile, { recursive: true, filter: (src) => !path.basename(src).startsWith('Singleton') });

const subOf = (url) => {
  const t = new URL(url).searchParams.get('access_token') ?? '';
  try { return JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString()).sub; } catch { return null; }
};

const avatarSvg = (name, color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${color}"/><circle cx="32" cy="24" r="12" fill="#fff" opacity=".9"/><path d="M10 64c2-16 12-22 22-22s20 6 22 22z" fill="#fff" opacity=".9"/></svg>`;

const ctx = await chromium.launchPersistentContext(profile, {
  channel: 'chromium',
  headless: true,
  viewport: { width: 1280, height: 800 },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});

try {
  // Biblioteca familiar: se conserva la real (los appids) pero los dueños se sustituyen por familiares ficticios.
  await ctx.route('**/IFamilyGroupsService/GetSharedLibraryApps/**', async (route) => {
    const res = await route.fetch();
    const json = await res.json();
    const me = subOf(route.request().url());
    const others = new Map();
    const mapId = (id) => {
      if (id === me) return id;
      if (!others.has(id)) others.set(id, fakeId(fakeAccounts[others.size % fakeAccounts.length]));
      return others.get(id);
    };
    for (const app of json.response?.apps ?? []) app.owner_steamids = [...new Set(app.owner_steamids.map(mapId))];
    await route.fulfill({ response: res, json });
  });
  await ctx.route('**/miniprofile/*/json', async (route) => {
    const acc = Number(route.request().url().match(/miniprofile\/(\d+)\//)?.[1]);
    if (!FAKE[acc]) return route.fulfill({ status: 404, body: '{}' }); // nunca dejamos pasar perfiles reales
    await route.fulfill({ json: { persona_name: FAKE[acc][0], avatar_url: `https://avatars.steamstatic.com/fake-${acc}.svg` } });
  });
  await ctx.route('https://avatars.steamstatic.com/fake-*.svg', (route) => {
    const acc = Number(route.request().url().match(/fake-(\d+)/)?.[1]);
    return route.fulfill({ contentType: 'image/svg+xml', body: avatarSvg(...FAKE[acc]) });
  });

  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto('https://store.steampowered.com/wishlist/', { waitUntil: 'networkidle' });
  await page.locator('#family-owned-widget .fo-ghost').click(); // fuerza datos nuevos (ficticios) en la caché de la copia
  await page.waitForFunction(() => document.querySelector('#family-owned-widget .fo-ghost')?.textContent === '↻', null, { timeout: 60_000 });

  const names = new Set(Object.values(FAKE).map((f) => f[0]));
  const assertFake = async () => {
    const shown = await page.evaluate(() => [...document.querySelectorAll('[data-family-owned], #family-owned-widget .fo-owners')].map((e) => e.textContent ?? ''));
    const bad = shown.filter((t) => t.replace(/[👪(),]|no prestable/g, ' ').split(/\s+/).filter(Boolean).some((w) => !names.has(w)));
    if (!shown.length || bad.length) throw new Error(`Datos no ficticios o sin badges: ${JSON.stringify(bad.slice(0, 3))}`);
  };
  await page.waitForSelector('[data-family-owned]');
  await assertFake();

  // En esta página el documento no scrollea: lo hace el contenedor interior (#StoreTemplate), así que scrollY vale siempre 0.
  const SCROLLER = `(() => { for (let e = document.querySelector('a[href*="/app/"]'); e; e = e.parentElement) { const o = getComputedStyle(e).overflowY; if (/(auto|scroll|overlay)/.test(o) && e.scrollHeight > e.clientHeight + 10) return e; } return null; })()`;
  const scrollToY = async (y) => {
    await page.evaluate(`${SCROLLER}.scrollTo({ top: ${y}, behavior: 'instant' })`);
    await page.waitForTimeout(900); // la lista está virtualizada: damos tiempo a pintar las filas
  };

  // Protección de privacidad: la cabecera con tu usuario y saldo NO puede entrar en el encuadre.
  const MIN_Y = 360;
  const assertNoPersonalHeader = async () => {
    const info = await page.evaluate(`(() => {
      const sc = ${SCROLLER};
      const inView = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
      const personal = [...document.querySelectorAll('a[href*="steamcommunity.com/id/"], a[href*="steamcommunity.com/profiles/"], a[href*="/account"]')].filter((a) => !a.closest('#family-owned-widget'));
      return { scrollTop: sc ? Math.round(sc.scrollTop) : -1, visible: personal.filter(inView).map((a) => a.textContent.trim().slice(0, 12) || a.getAttribute('href').slice(-20)).length };
    })()`);
    if (info.scrollTop < MIN_Y || info.visible > 0) throw new Error(`Cabecera personal en el encuadre: ${JSON.stringify(info)}`);
  };

  // Posición de scroll con más badges completos a la vista.
  const scan = [];
  for (let y = MIN_Y; y < 6000; y += 450) {
    await scrollToY(y);
    const n = await page.evaluate(() => [...document.querySelectorAll('[data-family-owned]')].filter((b) => { const r = b.getBoundingClientRect(); return r.top > 40 && r.bottom < innerHeight - 40; }).length);
    scan.push({ y, n });
  }
  scan.sort((a, b) => b.n - a.n);
  const first = scan[0];
  const second = scan.find((c) => Math.abs(c.y - first.y) >= 1500 && c.n >= 1) ?? scan[1];
  if (!first || first.n < 1) throw new Error(`No se encontró ninguna zona con badges: ${JSON.stringify(scan)}`);
  console.log('scrolls elegidos', JSON.stringify([first, second]));

  const shot = async (name, y, openPanel = false) => {
    await scrollToY(y);
    const panel = page.locator('#family-owned-widget .fo-panel');
    if ((await panel.isVisible()) !== openPanel) await page.locator('#family-owned-widget button').first().click();
    await assertFake();
    await assertNoPersonalHeader();
    await page.screenshot({ path: path.join(OUT, name) });
  };
  try {
    await shot('1-badges.png', first.y);
    await shot('2-panel.png', first.y, true);
    await shot('3-badges-otra-zona.png', second.y);
  } catch (e) {
    for (const f of fs.readdirSync(OUT)) if (f.endsWith('.png')) fs.rmSync(path.join(OUT, f)); // nunca dejar capturas a medias
    throw e;
  }
  console.log('Capturas en', OUT);
} finally {
  await ctx.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
