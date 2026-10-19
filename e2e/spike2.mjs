import { chromium } from '@playwright/test';
import fs from 'node:fs';

const api = JSON.parse(fs.readFileSync('e2e/spike-out/api.json'));
const gid = api.group.response.family_groupid;
const ctx = await chromium.launchPersistentContext('.e2e-profile', { channel: 'chromium', headless: true, viewport: { width: 1400, height: 1000 } });
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://store.steampowered.com/', { waitUntil: 'domcontentloaded' });

const fam = await page.evaluate(async (gid) => {
  const cfg = await (await fetch('/pointssummary/ajaxgetasyncconfig')).json();
  const t = cfg.data.webapi_token;
  const r = await fetch(`https://api.steampowered.com/IFamilyGroupsService/GetFamilyGroup/v1/?access_token=${t}&family_groupid=${gid}`);
  const j = await r.json().catch(() => null);
  const members = j?.response?.members ?? [];
  const out = { status: r.status, keys: Object.keys(j?.response ?? {}), memberCount: members.length, memberKeys: Object.keys(members[0] ?? {}), me: cfg.data.steamid };
  // miniprofile name test for first member
  if (members[0]) {
    const sid = BigInt(members[0].steamid);
    const acc = Number(sid & 0xffffffffn);
    const mp = await fetch(`https://steamcommunity.com/miniprofile/${acc}/json`).then(x => x.status).catch(e => 'err:' + e.message);
    out.miniprofileStatus = mp;
  }
  return out;
}, gid);
console.log('FAMILY', JSON.stringify(fam));

await page.goto('https://store.steampowered.com/wishlist/', { waitUntil: 'networkidle' });
console.log('URL', page.url().replace(/\d{15,}/, '<id>'));
await page.waitForTimeout(3000);
const info = await page.evaluate(() => {
  const links = [...document.querySelectorAll('a[href*="/app/"]')];
  const ids = [...new Set(links.map(a => a.href.match(/\/app\/(\d+)/)?.[1]).filter(Boolean))];
  const txt = document.body.innerText;
  return { rowLinks: links.length, uniqueApps: ids.length, firstIds: ids.slice(0, 5), mentionsFamily: /familia|family/i.test(txt), famSnippets: (txt.match(/.{0,40}(familia|family).{0,40}/gi) || []).slice(0, 5), ssr: typeof window.SSR !== 'undefined' };
});
console.log('WISHLIST', JSON.stringify(info));
fs.mkdirSync('e2e/spike-out', { recursive: true });
await page.screenshot({ path: 'e2e/spike-out/wishlist-top.png' });
await page.mouse.move(700, 600);
await page.mouse.wheel(0, 6000);
await page.waitForTimeout(2500);
const after = await page.evaluate(() => {
  const ids = [...new Set([...document.querySelectorAll('a[href*="/app/"]')].map(a => a.href.match(/\/app\/(\d+)/)?.[1]))];
  return { uniqueAppsAfterScroll: ids.length, firstId: ids[0] };
});
console.log('AFTER_SCROLL', JSON.stringify(after));
await page.screenshot({ path: 'e2e/spike-out/wishlist-scrolled.png' });
await ctx.close();
