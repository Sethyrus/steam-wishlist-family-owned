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
  version: 2,
  fetchedAt: 0,
  self: '1',
  members: { '2': { name: 'Ana', avatar: '' }, '3': { name: 'Luis', avatar: '' } },
  index: { '100': { name: 'Alpha', owners: ['2', '3'], excluded: false }, '300': { name: 'Gamma', owners: ['2'], excluded: true } },
};

beforeEach(() => {
  document.body.innerHTML = `<div class="list">${rowHtml(100, 'Alpha')}${rowHtml(200, 'Beta')}${rowHtml(300, 'Gamma')}</div>`;
});

describe('findRows', () => {
  it('encuentra una fila por juego y usa el título como ancla', () => {
    const rows = findRows(document);
    expect(rows.map((r) => r.appid)).toEqual(['100', '200', '300']);
    expect(rows[0]?.title.textContent).toBe('Alpha');
    expect(rows[0]?.row.classList.contains('Panel')).toBe(true);
  });
});

describe('applyBadges', () => {
  it('pone badge solo a los juegos de la familia', () => {
    applyBadges(document, data);
    const badges = document.querySelectorAll('[data-family-owned]');
    expect(badges).toHaveLength(2);
    expect(badges[0]?.textContent).toContain('Ana, Luis');
    expect(badges[1]?.textContent).toContain('no prestable');
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

describe('no se confunde con la UI propia', () => {
  it('ignora los enlaces /app/N del panel flotante y no genera badges dentro', () => {
    document.body.innerHTML += `<div id="family-owned-widget"><a class="fo-item" href="https://store.steampowered.com/app/100/"><span>Alpha</span><span>Ana, Luis, Marta</span></a><a class="fo-item" href="https://store.steampowered.com/app/300/"><span>Gamma</span><span>Ana, Luis, Marta</span></a></div>`;
    applyBadges(document, data);
    expect(document.querySelectorAll('#family-owned-widget [data-family-owned]')).toHaveLength(0);
    expect(findRows(document).map((r) => r.appid)).toEqual(['100', '200', '300']);
  });

  it('no crece sin límite aunque la fila sea el propio enlace', () => {
    document.body.innerHTML = '<div><a href="https://store.steampowered.com/app/100/">Alpha</a><a href="https://store.steampowered.com/app/200/">Beta</a></div>';
    applyBadges(document, data);
    applyBadges(document, data);
    applyBadges(document, data);
    expect(document.querySelectorAll('[data-family-owned]')).toHaveLength(1);
  });
});

describe('elección del título', () => {
  const discounted = (id: number, name: string) => `
    <div class="Panel"><div class="x">
      <a href="https://store.steampowered.com/app/${id}/"><img/></a>
      <div class="info"><a class="t" href="https://store.steampowered.com/app/${id}/">${name}</a></div>
      <a class="p" href="https://store.steampowered.com/app/${id}/">-50% 7,19€ 3,59€ y mucho más texto que el nombre</a>
    </div></div>`;

  it('no confunde el enlace del precio (más largo) con el título en filas con descuento', () => {
    document.body.innerHTML = discounted(100, 'Alpha');
    expect(findRows(document)[0]?.title.textContent).toBe('Alpha');
    applyBadges(document, data);
    expect(document.querySelector('.info [data-family-owned]')).not.toBeNull();
    expect(document.querySelector('a.p + [data-family-owned]')).toBeNull();
  });

  it('prefiere el enlace cuyo texto coincide con el nombre del juego', () => {
    document.body.innerHTML = `<div class="Panel"><a href="/app/100/">Comprar ahora</a><a href="/app/100/">Alpha</a></div>`;
    expect(findRows(document, () => 'Alpha')[0]?.title.textContent).toBe('Alpha');
    expect(findRows(document)[0]?.title.textContent).toBe('Comprar ahora'); // sin nombre: el primero con texto
  });

  it('coloca el badge siempre en el mismo sitio, con o sin descuento', () => {
    document.body.innerHTML = discounted(100, 'Alpha') + rowHtml(300, 'Gamma');
    applyBadges(document, data);
    const parents = [...document.querySelectorAll('[data-family-owned]')].map((b) => b.previousElementSibling?.className);
    expect(parents).toEqual(['t', 't']);
  });

  it('no coloca nada mientras la fila se está pintando (solo imagen, sin título) y lo coloca cuando llega', () => {
    document.body.innerHTML = '<div class="Panel"><a class="img" href="https://store.steampowered.com/app/100/"><img/></a></div><div class="Panel"><a href="/app/200/">Beta</a></div>';
    applyBadges(document, data);
    expect(document.querySelectorAll('[data-family-owned]')).toHaveLength(0);
    document.querySelector('.Panel')!.insertAdjacentHTML('beforeend', '<div class="info"><a class="t" href="https://store.steampowered.com/app/100/">Alpha</a></div>');
    applyBadges(document, data);
    expect(document.querySelector('.t + [data-family-owned]')).not.toBeNull();
    expect(document.querySelector('.img + [data-family-owned]')).toBeNull();
  });

  it('recoloca un badge que quedó en mal sitio aunque su contenido no haya cambiado', () => {
    document.body.innerHTML = discounted(100, 'Alpha');
    applyBadges(document, data);
    const badge = document.querySelector('[data-family-owned]')!;
    document.querySelector('a.p')!.insertAdjacentElement('afterend', badge); // lo movemos junto al precio
    applyBadges(document, data);
    expect(document.querySelectorAll('[data-family-owned]')).toHaveLength(1);
    expect(document.querySelector('a.t + [data-family-owned]')).not.toBeNull();
  });
});

