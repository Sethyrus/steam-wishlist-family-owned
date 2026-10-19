import { browser } from 'wxt/browser';
import type { FamilyData } from './types';

const KEY = 'familyData';
export const TTL_MS = 6 * 60 * 60 * 1000;

export async function loadCache(now = Date.now()): Promise<FamilyData | null> {
  const got = await browser.storage.local.get(KEY);
  const data = got[KEY] as FamilyData | undefined;
  return data && now - data.fetchedAt < TTL_MS ? data : null;
}

export async function saveCache(data: FamilyData): Promise<void> {
  await browser.storage.local.set({ [KEY]: data });
}

export async function clearCache(): Promise<void> {
  await browser.storage.local.remove(KEY);
}
