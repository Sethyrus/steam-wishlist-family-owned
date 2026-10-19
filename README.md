# Steam Wishlist · Family Owned

[![CI](https://github.com/Sethyrus/steam-wishlist-family-owned/actions/workflows/ci.yml/badge.svg)](https://github.com/Sethyrus/steam-wishlist-family-owned/actions/workflows/ci.yml)
[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)

Extensión de Chrome/Chromium que te dice, **directamente en tu lista de deseados de Steam**, cuáles de esos juegos ya tiene alguien de tu **Familia de Steam**.

Hasta ahora solo podías saberlo entrando en la ficha de cada juego. Con esta extensión:

- Cada juego de la wishlist que ya tiene un familiar muestra una pastilla azul con su **avatar y nombre**. Si Steam excluye el juego del préstamo familiar, lo indica.
- En tu propia wishlist aparece abajo a la derecha el botón **👪 Familia (N)**, que abre un panel con todos esos juegos y sus dueños.
- El botón **↻** vuelve a consultar a Steam; si no, los datos se refrescan solos cada 6 horas.

> Proyecto personal y no oficial. No está afiliado ni respaldado por Valve. "Steam" es marca registrada de Valve Corporation.

## Requisitos

- Chrome o un navegador basado en Chromium (Brave, Edge, Arc…).
- Pertenecer a un grupo de **Familia de Steam** y tener la sesión iniciada en `store.steampowered.com`. Sin grupo familiar, la extensión simplemente no muestra nada.

## Instalar (sin compilar)

1. Descarga `steam-wishlist-family-owned-X.Y.Z-chrome.zip` desde [Releases](https://github.com/Sethyrus/steam-wishlist-family-owned/releases/latest). Opcional: comprueba el hash con `SHA256SUMS` (`shasum -a 256 -c SHA256SUMS`).
2. Descomprímelo en una carpeta que no vayas a borrar.
3. Abre `chrome://extensions` y activa el **Modo de desarrollador**.
4. Pulsa **Cargar descomprimida** y elige la carpeta.
5. Abre tu [lista de deseados](https://store.steampowered.com/wishlist/).

Chrome avisará de que hay extensiones en modo desarrollador; es normal porque no está publicada en la Chrome Web Store. Para actualizar, descomprime la versión nueva y pulsa recargar en `chrome://extensions`.

## Compilarla tú mismo

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
git clone https://github.com/Sethyrus/steam-wishlist-family-owned.git
cd steam-wishlist-family-owned
npm ci
npm run build      # genera la extensión en .output/chrome-mv3
npm run zip        # (opcional) genera el .zip en .output/
```

Después carga la carpeta `.output/chrome-mv3` en `chrome://extensions` como se explica arriba.

## Desarrollo

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Compila en modo desarrollo con recarga automática |
| `npm run typecheck` | Comprueba los tipos de TypeScript |
| `npm test` | Tests unitarios (Vitest + jsdom) |
| `npm run e2e:login` | Abre un Chromium para que inicies sesión en Steam **una vez** |
| `npm run e2e` | Tests E2E reales con Playwright contra tu wishlist |

Los tests E2E usan tu propia cuenta de Steam: `npm run e2e:login` guarda la sesión en `.e2e-profile/` (ignorado por git) y `npm run e2e` carga la extensión en un Chromium headless con esa sesión y comprueba que los badges coinciden con la biblioteca familiar. No se ejecutan en CI, porque necesitan una sesión de Steam. **No compartas nunca la carpeta `.e2e-profile/`**: contiene las cookies de tu sesión.

Estructura:

```
src/entrypoints/wishlist.content.ts   orquestación (content script)
src/lib/steam-api.ts                  única capa que habla con Steam
src/lib/ownership.ts                  lógica pura: biblioteca familiar → dueños
src/lib/wishlist-dom.ts               localizar filas e inyectar badges
src/lib/widget.ts                     panel flotante
tests/                                tests unitarios
e2e/                                  tests E2E con Playwright
docs/                                 especificación, endpoints de Steam y decisiones (ADR)
```

Más detalle en [docs/SPEC.md](docs/SPEC.md), [docs/steam-api.md](docs/steam-api.md) y [CLAUDE.md](CLAUDE.md) (reglas del proyecto).

## Privacidad y seguridad

- Solo se ejecuta en `store.steampowered.com/wishlist/*` y habla únicamente con Steam, desde tu navegador y con tu propia sesión.
- Sin backend, analítica ni telemetría. No envía nada a terceros.
- El token de acceso de Steam **nunca se guarda**. Solo se cachea (`storage.local`) la biblioteca familiar: appids, nombres y avatares públicos de tu familia.
- No pide `host_permissions`, solo `storage`.

Política completa en [PRIVACY.md](PRIVACY.md). Detalles técnicos y cómo informar de una vulnerabilidad en [SECURITY.md](SECURITY.md).

## Limitaciones

- Usa endpoints de Steam **no documentados oficialmente** (el mismo mecanismo que usa la propia tienda). Si Valve los cambia, la extensión puede dejar de funcionar hasta que se actualice.
- Solo Familia de Steam, no amigos; solo Chrome/Chromium.
- La lista de deseados de Steam está virtualizada, por eso el "filtro" es un panel aparte y no oculta filas.

## Licencia

[MIT](LICENSE)
