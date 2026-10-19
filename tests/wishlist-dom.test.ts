import { beforeEach, describe, expect, it } from 'vitest';
import type { FamilyData } from '../src/lib/types';
import { applyBadges, findRows } from '../src/lib/wishlist-dom';

// Imita la estructura real: varios enlaces por juego (cápsula, título, precio) y filas anidadas con clases hasheadas.
const rowHtml = (id: number, name: string) => `
  <div class="Panel"><div class="x1"><div class="x2">
    <a href="https://store.steampowered.com/app/${id}/"><img/></a>
    <div class="info"><a class="t" href="https://store.steampowered.com/app/${id}/${name}">${name}</a></div>
    <a class="p" href="https://store.steampowered.com/app/${id}/">9,99€</a>
  </div></div></div>`;

const data: FamilyData = {
  fetchedAt: 0,
  self: '1',
  members: { '2': { name: 'Ana', avatar: '' }, '3': { name: 'Luis', avatar: '' } },
  index: { '100': { owners: ['2', '3'], excluded: false }, '300': { owners: ['2'], excluded: true } },
};

beforeEach(() => {
  document.body.innerHTML = `<div class="list">${rowHtml(100, 'Alpha')}${rowHtml(200, 'Beta')}${rowHtml(300, 'Gamma')}</div>`;
});

describe('findRows', () => {
  it('encuentra una fila por juego y usa el título como ancla', () => {
    const rows = findRows(document);
    expect(rows.map((r) => r.appid)).toEqual(['100', '200', '300']);
    expect(rows[0].title.textContent).toBe('Alpha');
    expect(rows[0].row.classList.contains('Panel')).toBe(true);
  });
});

describe('applyBadges', () => {
  it('pone badge solo a los juegos de la familia', () => {
    applyBadges(document, data);
    const badges = document.querySelectorAll('[data-family-owned]');
    expect(badges).toHaveLength(2);
    expect(badges[0].textContent).toContain('Ana, Luis');
    expect(badges[1].textContent).toContain('no prestable');
  });

  it('es idempotente: la segunda pasada no modifica el DOM', () => {
    applyBadges(document, data);
    const html = document.body.innerHTML;
    applyBadges(document, data);
    expect(document.body.innerHTML).toBe(html);
  });

  it('reaplica el badge tras un re-render que lo elimina', () => {
    applyBadges(document, data);
    document.querySelector('[data-family-owned]')!.remove();
    applyBadges(document, data);
    expect(document.querySelectorAll('[data-family-owned]')).toHaveLength(2);
  });

  it('actualiza el badge cuando React reutiliza el mismo nodo fila para otro juego', () => {
    applyBadges(document, data);
    const row = document.querySelector('.Panel')!;
    const retarget = (id: number, name: string) => {
      row.querySelectorAll('a').forEach((a) => a.setAttribute('href', `https://store.steampowered.com/app/${id}/`));
      row.querySelector('a.t')!.textContent = name;
    };
    retarget(200, 'Beta'); // juego que nadie tiene -> el badge antiguo debe desaparecer
    applyBadges(document, data);
    expect(row.querySelector('[data-family-owned]')).toBeNull();
    retarget(300, 'Gamma'); // juego excluido de otro dueño -> badge nuevo
    applyBadges(document, data);
    expect(row.querySelector('[data-family-owned]')!.getAttribute('data-appid')).toBe('300');
  });
});
