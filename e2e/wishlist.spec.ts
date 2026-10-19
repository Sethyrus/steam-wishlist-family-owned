import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const EXT = path.resolve('.output/chrome-mv3');
const SHOTS = path.resolve('e2e/screenshots');

let ctx: BrowserContext;
let page: Page;

test.beforeAll(async () => {
  expect(fs.existsSync(EXT), 'falta .output/chrome-mv3: ejecuta npm run build').toBe(true);
  expect(fs.existsSync('.e2e-profile'), 'falta .e2e-profile: ejecuta npm run e2e:login').toBe(true);
  fs.mkdirSync(SHOTS, { recursive: true });
  ctx = await chromium.launchPersistentContext('.e2e-profile', {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1400, height: 1000 },
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });
  page = ctx.pages()[0] ?? (await ctx.newPage());
});
test.afterAll(async () => ctx?.close());

/** Verdad independiente de la extensión: appids que tiene algún familiar que no soy yo. */
async function groundTruth(): Promise<Set<string>> {
  await page.goto('https://store.steampowered.com/', { waitUntil: 'domcontentloaded' });
  const ids = await page.evaluate(async () => {
    const cfg = (await (await fetch('/pointssummary/ajaxgetasyncconfig')).json()).data;
    const t = cfg.webapi_token;
    const me = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub;
    const api = 'https://api.steampowered.com/IFamilyGroupsService';
    const gid = (await (await fetch(`${api}/GetFamilyGroupForUser/v1/?access_token=${t}`)).json()).response.family_groupid;
    const apps = (await (await fetch(`${api}/GetSharedLibraryApps/v1/?access_token=${t}&family_groupid=${gid}&include_own=true&include_excluded=true&include_free=false&include_non_games=false`)).json()).response.apps;
    return apps.filter((a: any) => a.owner_steamids.some((o: string) => o !== String(me))).map((a: any) => String(a.appid));
  });
  return new Set(ids);
}

const visible = (p: Page) =>
  p.evaluate(() => {
    const rows = new Set([...document.querySelectorAll('a[href*="/app/"]')].filter((a) => !a.closest('#family-owned-widget')).map((a) => a.getAttribute('href')!.match(/\/app\/(\d+)/)![1]));
    const badges = [...document.querySelectorAll('[data-family-owned]')].map((b) => (b as HTMLElement).dataset.appid!);
    return { rows: [...rows], badges };
  });

test('los badges coinciden con la biblioteca familiar, también tras scroll', async () => {
  const truth = await groundTruth();
  await page.goto('https://store.steampowered.com/wishlist/', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-family-owned]', { timeout: 20_000 }).catch(() => {});
  await page.screenshot({ path: path.join(SHOTS, 'top.png') });

  let totalBadges = 0;
  for (let step = 0; step < 4; step++) {
    await page.waitForTimeout(1000);
    const { rows, badges } = await visible(page);
    const expected = rows.filter((id) => truth.has(id)).sort();
    expect([...new Set(badges)].sort(), `paso ${step}: badges vs verdad`).toEqual(expected);
    if (badges.length && !totalBadges) {
      const badge = page.locator('[data-family-owned]').first();
      await badge.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(SHOTS, 'badge.png') });
    }
    totalBadges += badges.length;
    await page.screenshot({ path: path.join(SHOTS, `scroll-${step}.png`) });
    await page.mouse.move(700, 600);
    await page.mouse.wheel(0, 3500);
  }
  expect(totalBadges, 'ningún badge visto: ¿la wishlist no contiene juegos de la familia?').toBeGreaterThan(0);
});

test('el panel de familia cuenta bien, se abre y se puede refrescar', async () => {
  const truth = await groundTruth();
  const wishlist: string[] = await page.evaluate(async () => {
    const t = (await (await fetch('/pointssummary/ajaxgetasyncconfig')).json()).data.webapi_token;
    const me = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub;
    const r = await (await fetch(`https://api.steampowered.com/IWishlistService/GetWishlist/v1/?access_token=${t}&steamid=${me}`)).json();
    return r.response.items.map((i: any) => String(i.appid));
  });
  const expected = wishlist.filter((id) => truth.has(id)).length;

  await page.goto('https://store.steampowered.com/wishlist/', { waitUntil: 'networkidle' });
  const toggle = page.locator('#family-owned-widget button').first();
  await expect(toggle).toHaveText(`👪 Familia (${expected})`, { timeout: 20_000 });

  await toggle.click();
  const items = page.locator('#family-owned-widget .fo-item');
  await expect(items).toHaveCount(expected);
  await expect(page.locator('#family-owned-widget [data-family-owned]')).toHaveCount(0);
  const badgeCount = await page.locator('[data-family-owned]').count();
  await page.waitForTimeout(1500);
  expect(await page.locator('[data-family-owned]').count(), 'los badges no deben crecer solos').toBe(badgeCount);
  await page.screenshot({ path: path.join(SHOTS, 'panel.png') });

  await page.locator('#family-owned-widget .fo-ghost').click();
  await expect(page.locator('#family-owned-widget .fo-ghost')).toHaveText('↻', { timeout: 30_000 });
  await expect(page.locator('#family-owned-widget .fo-head')).not.toContainText('No se pudo');
  await expect(items).toHaveCount(expected);
});
