# Endpoints de Steam (no oficiales)

Fuentes: SteamTracking (protobufs), steamapi.xpaw.me, código de Lutris y Augmented Steam.

1. Token: `GET https://store.steampowered.com/pointssummary/ajaxgetasyncconfig` (con cookies) → `data.webapi_token`.
2. Grupo: `GET https://api.steampowered.com/IFamilyGroupsService/GetFamilyGroupForUser/v1/?access_token=…` → `family_groupid`.
3. Biblioteca: `GET https://api.steampowered.com/IFamilyGroupsService/GetSharedLibraryApps/v1/?access_token=…&family_groupid=…&include_own=true&include_excluded=true` → `apps[] {appid, owner_steamids[], exclude_reason, …}`.
4. Wishlist (datos iniciales): `SSR.renderContext.queryData`, clave `WishlistSortedFiltered`; o `IWishlistService/GetWishlist`.

## Verificado en vivo (Fase 0, 2026-10-19)
- Token OK desde la página de la tienda; `GetFamilyGroupForUser` y `GetSharedLibraryApps` devuelven 200. CORS no es problema (fetch desde la propia página de la tienda).
- `GetSharedLibraryApps` devolvió 3470 apps en una sola llamada. Cada app trae `appid`, `owner_steamids[]`, `name`, `exclude_reason`, `app_type`.
- `GetFamilyGroupForUser` NO trae miembros. Los miembros salen de `GetFamilyGroup/v1?family_groupid=…`: `members[] {steamid, role, time_joined}`, sin nombres.
- Nombres: `https://steamcommunity.com/miniprofile/{accountid}/json` responde 200 (accountid = steamid64 & 0xffffffff). Falta confirmar que trae el nombre.
- La wishlist (`/wishlist/` redirige a `/wishlist/id/<vanity>/`) NO muestra ninguna marca de familia: el proyecto aporta valor.
- La lista está VIRTUALIZADA: con 135 juegos, al hacer scroll el primer appid visible pasa a ser otro. Hay que reaplicar badges en cada mutación.
- La página expone `window.SSR`.

## Por verificar
- Que el miniprofile devuelve nombre y avatar.
- Estructura exacta de la fila para colocar el badge, y si Steam muestra `is_owned` propio.
