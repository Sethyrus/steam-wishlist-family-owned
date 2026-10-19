import { chromium } from '@playwright/test';
import fs from 'node:fs';
const api = JSON.parse(fs.readFileSync('e2e/spike-out/api.json'));
const gid = api.group.response.family_groupid;
const ctx = await chromium.launchPersistentContext('.e2e-profile', { channel: 'chromium', headless: true, viewport: { width: 1400, height: 1000 } });
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://store.steampowered.com/', { waitUntil: 'domcontentloaded' });
const mp = await page.evaluate(async (gid) => {
  const t = (await (await fetch('/pointssummary/ajaxgetasyncconfig')).json()).data.webapi_token;
  const j = await (await fetch(`https://api.steampowered.com/IFamilyGroupsService/GetFamilyGroup/v1/?access_token=${t}&family_groupid=${gid}`)).json();
  const out = [];
  for (const m of j.response.members) {
    const acc = Number(BigInt(m.steamid) & 0xffffffffn);
    const r = await (await fetch(`https://steamcommunity.com/miniprofile/${acc}/json`)).json().catch(() => null);
    out.push({ keys: Object.keys(r ?? {}), hasName: !!r?.persona_name, hasAvatar: !!r?.avatar_url });
  }
  return out;
}, gid);
console.log('MINIPROFILE', JSON.stringify(mp));
await page.goto('https://store.steampowered.com/wishlist/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const dom = await page.evaluate(() => {
  const a = document.querySelector('a[href*="/app/"]');
  // sube hasta un ancestro que contenga SOLO un appid distinto
  let el = a, chain = [];
  const idOf = n => [...new Set([...n.querySelectorAll('a[href*="/app/"]')].map(x => x.href.match(/\/app\/(\d+)/)?.[1]))];
  while (el && el !== document.body) {
    chain.push({ tag: el.tagName, cls: (el.className + '').slice(0, 40), apps: idOf(el).length, h: Math.round(el.getBoundingClientRect().height), parentChildren: el.parentElement?.children.length });
    el = el.parentElement;
  }
  const title = [...document.querySelectorAll('a[href*="/app/"]')].filter(x => x.textContent.trim().length > 2).slice(0, 3).map(x => ({ text: x.textContent.trim().slice(0, 30), cls: x.className.slice(0, 30) }));
  return { chain: chain.slice(0, 9), title, dataAttrs: [...(a.closest('[data-appid]') ? [1] : [])].length };
});
console.log('DOM', JSON.stringify(dom, null, 1));
await ctx.close();
