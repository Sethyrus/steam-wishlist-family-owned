import type { FamilyData } from './types';

const APP_RE = /\/app\/(\d+)/;
const BADGE_ATTR = 'data-family-owned';

export interface WishlistRow {
  appid: string;
  row: HTMLElement;
  title: HTMLElement;
}

const appidOf = (a: Element): string | undefined => a.getAttribute('href')?.match(APP_RE)?.[1];

function distinctApps(el: Element): number {
  const ids = new Set<string>();
  for (const a of el.querySelectorAll('a[href*="/app/"]')) {
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
    const id = appidOf(a);
    if (id) byApp.set(id, [...(byApp.get(id) ?? []), a]);
  }
  const rows: WishlistRow[] = [];
  for (const [appid, anchors] of byApp) {
    let row: HTMLElement = anchors[0];
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
    [${BADGE_ATTR}][data-excluded]{background:#7a5a1b}`;
  doc.head.appendChild(style);
}

function badgeText(data: FamilyData, appid: string): { text: string; tip: string } | null {
  const entry = data.index[appid];
  if (!entry) return null;
  const names = entry.owners.map((id) => data.members[id]?.name ?? `…${id.slice(-4)}`);
  const text = `👪 ${names.join(', ')}${entry.excluded ? ' (no prestable)' : ''}`;
  return { text, tip: entry.excluded ? 'Steam excluye este juego del préstamo familiar' : 'Lo tiene alguien de tu Familia de Steam' };
}

/** Idempotente: si ya hay un badge correcto no toca el DOM. */
export function applyBadges(root: ParentNode, data: FamilyData): void {
  for (const { appid, row, title } of findRows(root)) {
    const want = badgeText(data, appid);
    const existing = row.querySelector<HTMLElement>(`[${BADGE_ATTR}]`);
    if (!want) {
      existing?.remove();
      continue;
    }
    if (existing && existing.dataset.appid === appid && existing.textContent === want.text) continue;
    existing?.remove();
    ensureStyle(row.ownerDocument);
    const badge = row.ownerDocument.createElement('span');
    badge.setAttribute(BADGE_ATTR, '');
    badge.dataset.appid = appid;
    if (data.index[appid].excluded) badge.setAttribute('data-excluded', '');
    badge.title = want.tip;
    badge.textContent = want.text;
    title.insertAdjacentElement('afterend', badge);
  }
}
