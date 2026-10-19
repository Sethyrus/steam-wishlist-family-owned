---
name: e2e
description: Ejecutar y leer las pruebas E2E reales de la extensión contra la wishlist de Steam con el perfil logueado
---

1. `npm run build`
2. Si no existe `.e2e-profile/`, pedir al usuario que ejecute `npm run e2e:login` y se loguee (no se puede automatizar: Steam Guard).
3. `npm run e2e` (headless, Chromium de Playwright; el Chrome de marca 137+ no admite --load-extension).
4. Leer las capturas de `e2e/screenshots/` con Read y comprobar badges.
5. Si falla el login/sesión caducada, pedir al usuario repetir `e2e:login`.
