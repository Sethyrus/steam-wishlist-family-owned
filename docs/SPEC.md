# SPEC

## Problema
La wishlist de Steam no indica qué juegos ya tiene alguien de tu Familia de Steam; solo se ve en la ficha de cada juego.

## Alcance (v1)
- Solo Familia de Steam (no amigos). Chrome/Chromium. Uso personal y compartido con amigos mediante un zip (carga desempaquetada); no se publica en tiendas.
- En `store.steampowered.com/wishlist/*`, cada fila cuyo appid esté en la biblioteca familiar muestra un badge con los nombres de los dueños.

## Criterios de aceptación
1. Un juego que tiene un familiar muestra el badge con su nombre; uno que nadie tiene no muestra nada.
2. Los juegos propios del usuario no generan badge de "familia".
3. El badge sobrevive a scroll, reordenado y filtrado de la wishlist.
4. Una única ronda de llamadas a la API por carga (caché en `storage.local`, TTL 6 h, refresco manual).
5. Si no hay sesión o grupo familiar, no rompe la página y no muestra nada.
6. Tests unitarios y E2E en verde.

7. Genérica: nada hardcodeado a una cuenta; usa la sesión de Steam de quien la instala. Quien no pertenezca a un grupo familiar no ve nada (sin errores).
8. `npm run zip` genera un zip sin datos personales y el README explica la instalación.

## Fuera de alcance
Amigos, Firefox, publicación en tiendas, app de escritorio de Steam.

## Incógnitas (Fase 0)
Ver `docs/steam-api.md` → "Por verificar".
