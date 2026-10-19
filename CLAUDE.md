# Steam Wishlist · Family Owned

Extensión MV3 (WXT + TypeScript) para Chrome/Chromium, de uso personal. En `store.steampowered.com/wishlist/*` marca cada juego que ya posee algún miembro de la Familia de Steam del usuario y muestra quién.

## Comandos
- `npm run dev` / `npm run build` → extensión en `.output/chrome-mv3` (cargar desempaquetada en chrome://extensions)
- `npm test` → Vitest (lógica pura + DOM con fixtures)
- `npm run typecheck`
- `npm run e2e:login` → UNA vez, el usuario se loguea en Steam en un Chromium con interfaz (perfil en `.e2e-profile/`, fuera de git)
- `npm run e2e` → Playwright headless con la extensión cargada y el perfil logueado; capturas en `e2e/screenshots/`

## Reglas
- Toda llamada a Steam pasa por `src/lib/steam-api.ts` (los endpoints no están documentados y pueden cambiar).
- NO depender de clases CSS hasheadas de la wishlist: localizar filas por `a[href*="/app/"]` y extraer el appid con `/app\/(\d+)/`.
- La inyección de badges debe ser idempotente y sobrevivir a re-renders (MutationObserver).
- No commitear datos personales: los fixtures se anonimizan (steamids, nombres).
- Nunca guardar ni loguear el `access_token`.
- Referencia: `docs/SPEC.md`, `docs/steam-api.md`, `docs/PLAN.md`, `docs/adr/`.
