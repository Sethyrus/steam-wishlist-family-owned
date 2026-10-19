# PLAN

- [x] T0 Scaffold WXT + build
- [x] T1 Fase 0: API de familia, CORS y wishlist verificados (ver docs/steam-api.md). Pendiente: fixtures anonimizados
- [x] T2 `ownership.ts` (lógica pura) + tests
- [x] T3 `steam-api.ts` (token, grupo, biblioteca) + tests con fixtures
- [x] T4 `wishlist-dom.ts` (filas, badges idempotentes) + tests con HTML fixture
- [x] T5 Content script: orquestación, caché 6 h
- [x] T6 E2E headless con capturas
- [x] T7 Pulido: panel wishlist ∩ familia (en vez de filtro CSS: la lista está virtualizada), refresco, avatares, `exclude_reason`
- [x] T8 Distribución: `npm run zip` + README; zip probado en un perfil limpio sin sesión (carga, no rompe la página, no muestra nada). Pendiente: probarlo con un amigo real que esté en un grupo familiar
