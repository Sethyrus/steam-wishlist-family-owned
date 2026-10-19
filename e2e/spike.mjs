import { chromium } from '@playwright/test';
import fs from 'node:fs';

const ctx = await chromium.launchPersistentContext('.e2e-profile', { channel: 'chromium', headless: true });
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://store.steampowered.com/', { waitUntil: 'domcontentloaded' });

const out = await page.evaluate(async () => {
  const r = {};
  const cfg = await fetch('/pointssummary/ajaxgetasyncconfig', { credentials: 'include' });
  const j = await cfg.json().catch(() => null);
  const token = j?.data?.webapi_token;
  r.tokenOk = !!token;
  r.steamid = j?.data?.steamid ?? null;
  if (!token) return r;
  const g = await fetch(`https://api.steampowered.com/IFamilyGroupsService/GetFamilyGroupForUser/v1/?access_token=${token}`);
  r.groupStatus = g.status;
  r.group = await g.json().catch(() => null);
  const gid = r.group?.response?.family_groupid;
  if (gid) {
    const s = await fetch(`https://api.steampowered.com/IFamilyGroupsService/GetSharedLibraryApps/v1/?access_token=${token}&family_groupid=${gid}&include_own=true&include_excluded=true&include_free=false&include_non_games=false`);
    r.libStatus = s.status;
    const lj = await s.json().catch(() => null);
    r.libCount = lj?.response?.apps?.length ?? null;
    r.libSample = lj?.response?.apps?.slice(0, 2) ?? null;
  }
  return r;
});
fs.mkdirSync('e2e/spike-out', { recursive: true });
fs.writeFileSync('e2e/spike-out/api.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({ tokenOk: out.tokenOk, groupStatus: out.groupStatus, libStatus: out.libStatus, libCount: out.libCount, groupKeys: Object.keys(out.group?.response ?? {}) }));
await ctx.close();
