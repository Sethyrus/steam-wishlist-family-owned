import { chromium } from '@playwright/test';
import path from 'node:path';

const ext = path.resolve('.output/chrome-mv3');
const ctx = await chromium.launchPersistentContext('.e2e-profile', {
  channel: 'chromium',
  headless: false,
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto('https://store.steampowered.com/login/');
console.log('Inicia sesión en Steam y luego cierra la ventana.');
await new Promise((r) => ctx.on('close', r));
