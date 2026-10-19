import type { OwnershipIndex, SharedApp } from './types';

/**
 * Construye appid -> dueños de la familia, sin contar al propio usuario.
 * Un juego que solo tiene el usuario no aparece en el índice.
 */
export function buildOwnershipIndex(apps: SharedApp[], self: string): OwnershipIndex {
  const index: OwnershipIndex = {};
  for (const app of apps) {
    const owners = app.owner_steamids.filter((id) => id !== self);
    if (owners.length === 0) continue;
    index[String(app.appid)] = { name: app.name ?? `app ${app.appid}`, owners, excluded: app.exclude_reason !== 0 };
  }
  return index;
}
