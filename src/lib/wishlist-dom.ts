import { avatarImg } from './avatar';
import type { FamilyData } from './types';

const APP_RE = /\/app\/(\d+)/;
const BADGE_ATTR = 'data-family-owned';
const OWN_UI = `#family-owned-widget, [${BADGE_ATTR}]`;

export interface WishlistRow {
  appid: string;
  row: HTMLElement;
  title: HTMLElement;
}

const appidOf = (a: Element): string | undefined => a.getAttribute('href')?.match(APP_RE)?.[1];

function distinctApps(el: Element): number {
  const ids = new Set<string>();
  for (const a of el.querySelectorAll('a[href*="/app/"]')) {
    if (a.closest(OWN_UI)) continue;
    const id = appidOf(a);
    if (id) ids.add(id);
  }
  return ids.size;
}

/**
 * Localiza las filas sin depender de clases CSS: la fila es el ancestro más alto
 * de un enlace /app/N cuyo contenido solo referencia a ese appid.
 */
export function findRows(root: ParentNode): WishlistRow[] {
  const byApp = new Map<string, HTMLAnchorElement[]>();
  for (const a of root.querySelectorAll<HTMLAnchorElement>('a[href*="/app/"]')) {
    if (a.closest(`${OWN_UI}`)) continue; // nuestros propios enlaces (panel, badges) no son filas de la wishlist
    const id = appidOf(a);
    if (id) byApp.set(id, [...(byApp.get(id) ?? []), a]);
  }
  const rows: WishlistRow[] = [];
  for (const [appid, anchors] of byApp) {
    const first = anchors[0];
    if (!first) continue;
    let row: HTMLElement = first;
    while (row.parentElement && row.parentElement !== document.body && distinctApps(row.parentElement) <= 1) {
      row = row.parentElement;
    }
    const title = anchors.reduce((best, a) => ((a.textContent ?? '').trim().length > (best.textContent ?? '').trim().length ? a : best));
    rows.push({ appid, row, title });
  }
  return rows;
}

function ensureStyle(doc: Document): void {
  if (doc.getElementById('family-owned-style')) return;
  const style = doc.createElement('style');
  style.id = 'family-owned-style';
  style.textContent = `[${BADGE_ATTR}]{display:inline-block;margin-left:10px;padding:2px 8px;border-radius:3px;
    background:#1b6fa8;color:#fff;font-size:12px;font-weight:400;vertical-align:middle;white-space:nowrap}
    [${BADGE_ATTR}] img{width:16px;height:16px;border-radius:2px;vertical-align:middle;margin:0 4px 0 0}
    [${BADGE_ATTR}][data-excluded]{background:#7a5a1b}`;
  doc.head.appendChild(style);
}

function badgeInfo(data: FamilyData, appid: string) {
  const entry = data.index[appid];
  if (!entry) return null;
  const owners = entry.owners.map((id) => ({ name: data.members[id]?.name ?? `…${id.slice(-4)}`, avatar: data.members[id]?.avatar }));
  const sig = JSON.stringify([appid, entry.excluded, owners]);
  const text = `${owners.map((o) => o.name).join(', ')}${entry.excluded ? ' (no prestable)' : ''}`;
  const tip = entry.excluded ? 'Steam excluye este juego del préstamo familiar' : 'Lo tiene alguien de tu Familia de Steam';
  return { entry, owners, sig, text, tip };
}

/** Idempotente: si ya hay un badge idéntico no toca el DOM. */
export function applyBadges(root: ParentNode, data: FamilyData): void {
  for (const { appid, row, title } of findRows(root)) {
    const want = badgeInfo(data, appid);
    const next = title.nextElementSibling;
    const existing = row.querySelector<HTMLElement>(`[${BADGE_ATTR}]`) ?? (next?.hasAttribute(BADGE_ATTR) ? (next as HTMLElement) : null);
    if (!want) {
      existing?.remove();
      continue;
    }
    if (existing && existing.dataset.sig === want.sig) continue;
    existing?.remove();
    const doc = row.ownerDocument;
    ensureStyle(doc);
    const badge = doc.createElement('span');
    badge.setAttribute(BADGE_ATTR, '');
    badge.dataset.appid = appid;
    badge.dataset.sig = want.sig;
    if (want.entry.excluded) badge.setAttribute('data-excluded', '');
    badge.title = want.tip;
    badge.append('👪 ');
    for (const o of want.owners) {
      const img = avatarImg(doc, o.avatar, o.name);
      if (img) badge.append(img);
    }
    badge.append(want.text);
    title.insertAdjacentElement('afterend', badge);
  }
}
