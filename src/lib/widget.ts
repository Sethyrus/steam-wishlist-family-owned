import { avatarImg } from './avatar';
import type { FamilyData } from './types';

export interface WidgetDeps {
  getData(): FamilyData;
  loadWishlist(): Promise<string[]>;
  refresh(): Promise<void>;
}

const ID = 'family-owned-widget';

const CSS = `#${ID}{position:fixed;right:16px;bottom:16px;z-index:9999;font:13px "Motiva Sans",Arial,sans-serif;color:#c6d4df}
#${ID} .fo-bar{display:flex;gap:6px;justify-content:flex-end}
#${ID} button{cursor:pointer;border:0;border-radius:3px;padding:8px 12px;background:#1b6fa8;color:#fff;font:inherit}
#${ID} button:hover{background:#2685cc}
#${ID} button.fo-ghost{background:#2a475e}
#${ID} .fo-panel{width:380px;max-height:60vh;overflow:auto;margin-bottom:8px;background:#16202d;border:1px solid #2a475e;border-radius:4px;box-shadow:0 4px 18px #000a}
#${ID} .fo-panel[hidden]{display:none}
#${ID} .fo-head{padding:10px 12px;border-bottom:1px solid #2a475e;color:#fff}
#${ID} .fo-item{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #1e2c3d;color:inherit;text-decoration:none}
#${ID} .fo-item:hover{background:#1e3a52}
#${ID} .fo-item img{width:20px;height:20px;border-radius:2px}
#${ID} .fo-name{flex:1;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#${ID} .fo-owners{font-size:11px;opacity:.8;white-space:nowrap}
#${ID} .fo-empty{padding:12px}`;

function ago(ms: number): string {
  const min = Math.round((Date.now() - ms) / 60000);
  return min < 1 ? 'hace un momento' : min < 60 ? `hace ${min} min` : `hace ${Math.round(min / 60)} h`;
}

/** Panel flotante con los juegos de tu wishlist que ya tiene la familia. Idempotente. */
export function mountWidget(doc: Document, deps: WidgetDeps): void {
  if (doc.getElementById(ID)) return;
  const style = doc.createElement('style');
  style.textContent = CSS;
  doc.head.appendChild(style);

  const root = doc.createElement('div');
  root.id = ID;
  const panel = doc.createElement('div');
  panel.className = 'fo-panel';
  panel.hidden = true;
  const bar = doc.createElement('div');
  bar.className = 'fo-bar';
  const toggle = doc.createElement('button');
  const refresh = doc.createElement('button');
  refresh.className = 'fo-ghost';
  refresh.textContent = '↻';
  bar.append(toggle, refresh);
  root.append(panel, bar);
  doc.body.appendChild(root);

  let appids: string[] | null = null;

  const owned = () => {
    const { index } = deps.getData();
    return (appids ?? []).filter((id) => index[id]);
  };

  function render(error?: string): void {
    const data = deps.getData();
    const list = owned();
    toggle.textContent = appids ? `👪 Familia (${list.length})` : '👪 Familia';
    refresh.title = `Actualizado ${ago(data.fetchedAt)}. Pulsa para refrescar.`;
    panel.replaceChildren();
    const head = doc.createElement('div');
    head.className = 'fo-head';
    head.textContent = error ?? `${list.length} juegos de tu wishlist ya los tiene tu familia`;
    panel.append(head);
    if (!error && list.length === 0) {
      const empty = doc.createElement('div');
      empty.className = 'fo-empty';
      empty.textContent = 'Ninguno por ahora.';
      panel.append(empty);
    }
    for (const id of list) {
      const entry = data.index[id];
      if (!entry) continue;
      const a = doc.createElement('a');
      a.className = 'fo-item';
      a.href = `https://store.steampowered.com/app/${id}/`;
      const name = doc.createElement('span');
      name.className = 'fo-name';
      name.textContent = entry.name;
      const owners = doc.createElement('span');
      owners.className = 'fo-owners';
      owners.textContent = entry.owners.map((o) => data.members[o]?.name ?? `…${o.slice(-4)}`).join(', ');
      a.append(name);
      for (const o of entry.owners) {
        const img = avatarImg(doc, data.members[o]?.avatar, data.members[o]?.name ?? o);
        if (img) a.append(img);
      }
      a.append(owners);
      panel.append(a);
    }
  }

  deps
    .loadWishlist()
    .then((ids) => {
      appids = ids;
      render();
    })
    .catch(() => render('No se pudo leer tu wishlist'));

  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });
  refresh.addEventListener('click', async () => {
    refresh.disabled = true;
    refresh.textContent = '…';
    try {
      await deps.refresh();
      render();
    } catch {
      render('No se pudo refrescar; inténtalo más tarde');
    } finally {
      refresh.disabled = false;
      refresh.textContent = '↻';
    }
  });
  render();
}
