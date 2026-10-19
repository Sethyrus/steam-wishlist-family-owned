import { beforeEach, describe, expect, it, vi } from 'vitest';
import { safeAvatar } from '../src/lib/avatar';
import { isOwnWishlist } from '../src/lib/own-wishlist';
import type { FamilyData } from '../src/lib/types';
import { mountWidget } from '../src/lib/widget';
import { applyBadges } from '../src/lib/wishlist-dom';

const data = (over: Partial<FamilyData> = {}): FamilyData => ({
  version: 2,
  fetchedAt: Date.now(),
  self: '1',
  members: { '2': { name: 'Ana', avatar: 'https://cdn/a.jpg' }, '3': { name: '<b>Evil</b>', avatar: 'javascript:alert(1)' } },
  index: {
    '100': { name: 'Alpha', owners: ['2'], excluded: false },
    '300': { name: 'Gamma', owners: ['3'], excluded: false },
  },
  ...over,
});
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

describe('mountWidget', () => {
  it('lista solo los juegos de la wishlist que tiene la familia', async () => {
    mountWidget(document, { getData: () => data(), loadWishlist: async () => ['100', '200', '300'], refresh: async () => {} });
    await flush();
    expect(document.querySelector('button')!.textContent).toBe('👪 Familia (2)');
    expect([...document.querySelectorAll('.fo-name')].map((n) => n.textContent)).toEqual(['Alpha', 'Gamma']);
    expect(document.querySelector<HTMLAnchorElement>('.fo-item')!.href).toBe('https://store.steampowered.com/app/100/');
  });

  it('trata nombres y avatares de Steam como no fiables (sin HTML ni javascript:)', async () => {
    mountWidget(document, { getData: () => data(), loadWishlist: async () => ['300'], refresh: async () => {} });
    await flush();
    expect(document.querySelector('.fo-owners')!.textContent).toBe('<b>Evil</b>');
    expect(document.querySelector('.fo-owners b')).toBeNull();
    expect(document.querySelectorAll('.fo-item img')).toHaveLength(0);
  });

  it('es idempotente al montarse dos veces', () => {
    const deps = { getData: () => data(), loadWishlist: async () => [] as string[], refresh: async () => {} };
    mountWidget(document, deps);
    mountWidget(document, deps);
    expect(document.querySelectorAll('#family-owned-widget')).toHaveLength(1);
  });

  it('refresca y re-renderiza con los datos nuevos', async () => {
    let current = data();
    const refresh = vi.fn(async () => {
      current = data({ index: { ...current.index, '200': { name: 'Beta', owners: ['2'], excluded: false } } });
    });
    mountWidget(document, { getData: () => current, loadWishlist: async () => ['100', '200'], refresh });
    await flush();
    expect(document.querySelector('button')!.textContent).toBe('👪 Familia (1)');
    document.querySelector<HTMLButtonElement>('.fo-ghost')!.click();
    await flush();
    expect(refresh).toHaveBeenCalledOnce();
    expect(document.querySelector('button')!.textContent).toBe('👪 Familia (2)');
  });

  it('muestra un error si falla la lectura de la wishlist', async () => {
    mountWidget(document, { getData: () => data(), loadWishlist: async () => Promise.reject(new Error('x')), refresh: async () => {} });
    await flush();
    expect(document.querySelector('.fo-head')!.textContent).toBe('No se pudo leer tu wishlist');
  });
});

describe('avatares en los badges', () => {
  it('muestra avatares https y descarta los que no lo son', () => {
    document.body.innerHTML = `<div class="Panel"><a href="/app/100/">Alpha</a></div><div class="Panel"><a href="/app/300/">Gamma</a></div>`;
    applyBadges(document, data());
    const badges = document.querySelectorAll('[data-family-owned]');
    expect(badges[0].querySelector('img')!.src).toBe('https://cdn/a.jpg');
    expect(badges[1].querySelector('img')).toBeNull();
  });
});

describe('safeAvatar', () => {
  it('solo acepta https', () => {
    expect(safeAvatar('https://x/y.jpg')).toBe('https://x/y.jpg');
    expect(safeAvatar('http://x/y.jpg')).toBeNull();
    expect(safeAvatar('javascript:alert(1)')).toBeNull();
    expect(safeAvatar(undefined)).toBeNull();
  });
});

describe('isOwnWishlist', () => {
  const vanityFetch = (profile_url: string | null, status = 200) =>
    (async () => new Response(JSON.stringify(profile_url === null ? [] : [{ profile_url }]), { status })) as unknown as typeof fetch;

  it('trata /wishlist/ a secas como la propia', async () => {
    expect(await isOwnWishlist('/wishlist/', '1')).toBe(true);
    expect(await isOwnWishlist('/wishlist', '1')).toBe(true);
  });
  it('reconoce /wishlist/profiles/<mi id>', async () => expect(await isOwnWishlist('/wishlist/profiles/1/', '1')).toBe(true));
  it('rechaza el perfil de otro', async () => expect(await isOwnWishlist('/wishlist/profiles/2/', '1')).toBe(false));
  it('reconoce mi vanity, sin importar mayúsculas', async () =>
    expect(await isOwnWishlist('/wishlist/id/Sethyrus/', '1', vanityFetch('sethyrus'))).toBe(true));
  it('rechaza la vanity de otro', async () => expect(await isOwnWishlist('/wishlist/id/otro/', '1', vanityFetch('sethyrus'))).toBe(false));
  it('rechaza si falla la consulta o no tengo vanity', async () => {
    expect(await isOwnWishlist('/wishlist/id/x/', '1', vanityFetch(null, 500))).toBe(false);
    expect(await isOwnWishlist('/wishlist/id/x/', '1', vanityFetch('76561197960265729'))).toBe(false);
    expect(await isOwnWishlist('/wishlist/id/x/', '1', (async () => { throw new Error('red'); }) as unknown as typeof fetch)).toBe(false);
  });
});
