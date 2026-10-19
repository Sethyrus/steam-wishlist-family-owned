import { buildOwnershipIndex } from './ownership';
import { DATA_VERSION, type FamilyData, type MemberProfile, type SharedApp } from './types';

type Fetch = typeof fetch;

const API = 'https://api.steampowered.com/IFamilyGroupsService';

/** El webapi_token es un JWT; su campo `sub` es el steamid64 del usuario. */
export function steamIdFromToken(token: string): string | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const payload = part.replace(/-/g, '+').replace(/_/g, '/');
    const sub = JSON.parse(atob(payload)).sub;
    return /^\d{17}$/.test(String(sub)) ? String(sub) : null;
  } catch {
    return null;
  }
}

/** Devuelve null si el usuario no está logueado. */
export async function fetchToken(f: Fetch = fetch): Promise<{ token: string; self: string } | null> {
  const res = await f('/pointssummary/ajaxgetasyncconfig', { credentials: 'include' });
  if (!res.ok) return null;
  const token = (await res.json().catch(() => null))?.data?.webapi_token;
  const self = token ? steamIdFromToken(token) : null;
  return token && self ? { token, self } : null;
}

/** Devuelve null si el usuario no pertenece a ningún grupo familiar. */
export async function fetchFamilyGroup(token: string, f: Fetch = fetch): Promise<{ groupId: string; memberIds: string[] } | null> {
  const g = await f(`${API}/GetFamilyGroupForUser/v1/?access_token=${token}`);
  if (!g.ok) throw new Error(`GetFamilyGroupForUser ${g.status}`);
  const groupId = (await g.json())?.response?.family_groupid;
  if (!groupId || groupId === '0') return null;
  const m = await f(`${API}/GetFamilyGroup/v1/?access_token=${token}&family_groupid=${groupId}`);
  if (!m.ok) throw new Error(`GetFamilyGroup ${m.status}`);
  const members: { steamid: string }[] = (await m.json())?.response?.members ?? [];
  return { groupId: String(groupId), memberIds: members.map((x) => String(x.steamid)) };
}

export async function fetchSharedApps(token: string, groupId: string, f: Fetch = fetch): Promise<SharedApp[]> {
  const url = `${API}/GetSharedLibraryApps/v1/?access_token=${token}&family_groupid=${groupId}&include_own=true&include_excluded=true&include_free=false&include_non_games=false`;
  const res = await f(url);
  if (!res.ok) throw new Error(`GetSharedLibraryApps ${res.status}`);
  return (await res.json())?.response?.apps ?? [];
}

export function accountId(steamid: string): number {
  return Number(BigInt(steamid) & 0xffffffffn);
}

export async function fetchProfile(steamid: string, f: Fetch = fetch): Promise<MemberProfile> {
  const fallback = { name: `…${steamid.slice(-4)}`, avatar: '' };
  try {
    const res = await f(`https://steamcommunity.com/miniprofile/${accountId(steamid)}/json`);
    if (!res.ok) return fallback;
    const j = await res.json();
    return { name: j.persona_name || fallback.name, avatar: j.avatar_url || '' };
  } catch {
    return fallback;
  }
}

/** Una ronda completa: token → grupo → biblioteca → perfiles. null si no hay sesión o grupo. */
export async function fetchFamilyData(f: Fetch = fetch): Promise<FamilyData | null> {
  const auth = await fetchToken(f);
  if (!auth) return null;
  const group = await fetchFamilyGroup(auth.token, f);
  if (!group) return null;
  const apps = await fetchSharedApps(auth.token, group.groupId, f);
  const index = buildOwnershipIndex(apps, auth.self);
  const needed = [...new Set(Object.values(index).flatMap((e) => e.owners))];
  const members: FamilyData['members'] = {};
  await Promise.all(needed.map(async (id) => (members[id] = await fetchProfile(id, f))));
  return { version: DATA_VERSION, fetchedAt: Date.now(), self: auth.self, members, index };
}

/** appids de la wishlist del usuario logueado. null si no hay sesión. */
export async function fetchOwnWishlist(f: Fetch = fetch): Promise<string[] | null> {
  const auth = await fetchToken(f);
  if (!auth) return null;
  const res = await f(`https://api.steampowered.com/IWishlistService/GetWishlist/v1/?access_token=${auth.token}&steamid=${auth.self}`);
  if (!res.ok) throw new Error(`GetWishlist ${res.status}`);
  const items: { appid: number }[] = (await res.json())?.response?.items ?? [];
  return items.map((i) => String(i.appid));
}
