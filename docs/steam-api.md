# Endpoints de Steam (no oficiales)

Fuentes: SteamTracking (protobufs), steamapi.xpaw.me, código de Lutris y Augmented Steam.

1. Token: `GET https://store.steampowered.com/pointssummary/ajaxgetasyncconfig` (con cookies) → `data.webapi_token`.
2. Grupo: `GET https://api.steampowered.com/IFamilyGroupsService/GetFamilyGroupForUser/v1/?access_token=…` → `family_groupid`.
3. Biblioteca: `GET https://api.steampowered.com/IFamilyGroupsService/GetSharedLibraryApps/v1/?access_token=…&family_groupid=…&include_own=true&include_excluded=true` → `apps[] {appid, owner_steamids[], exclude_reason, …}`.
4. Wishlist (datos iniciales): `SSR.renderContext.queryData`, clave `WishlistSortedFiltered`; o `IWishlistService/GetWishlist`.

## Correcciones tras el MVP
- `ajaxgetasyncconfig` devuelve SOLO `data.webapi_token`, sin steamid. El steamid64 propio es el campo `sub` del JWT del token (se decodifica en local, ver `steamIdFromToken`).
- El miniprofile (`persona_name`, `avatar_url`) sí da nombre y avatar de cada miembro.
- La wishlist lanza el error de React #418 (hidratación) con y sin la extensión: no es nuestro.
- Un content script de la extensión puede llamar a `api.steampowered.com` sin problemas de CORS (verificado en E2E).

- `IWishlistService/GetWishlist/v1/?access_token=…&steamid=…` → `items[] {appid, priority, date_added}` (verificado: 135 items).
- `steamcommunity.com/actions/ajaxresolveusers?steamids=<id>` → `[{profile_url: "<vanity>", …}]` (sirve para saber si /wishlist/id/<vanity> es la propia). Funciona desde la tienda (CORS ok).
- `/wishlist/` a secas redirige a `/wishlist/id/<vanity>/` DESPUÉS de que arranca el content script; por eso se trata como propia.
- La lista es un contenedor de altura fija (N × 174 px) con un bloque absoluto que contiene solo ~14 filas: ocultar filas con CSS rompe la virtualización (hueco enorme). Por eso el "filtro" es un panel aparte.

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
