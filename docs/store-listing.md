# Ficha de la Chrome Web Store: assets

Todo se genera con scripts; nada se dibuja a mano.

| Asset | Tamaño | Dónde | Cómo se genera |
| --- | --- | --- | --- |
| Iconos de la extensión | 16, 32, 48, 128 | `public/icon/` (van en el manifest) | `npm run store:assets` |
| Icono de la ficha | 128×128 (96 de dibujo + 16 de margen) | `store/out/store-icon-128.png` | `npm run store:assets` |
| Cartel pequeño | 440×280 | `store/out/promo-small-440x280.png` | `npm run store:assets` |
| Marquee (opcional) | 1400×560 | `store/out/marquee-1400x560.png` | `npm run store:assets` |
| Capturas | 1280×800 | `store/screenshots/` (**no se versionan**) | `npm run store:screenshots` |

Fuentes: `store/icon.svg` (icono) y `store/promo.html` (carteles). Si cambias el diseño, edítalos y vuelve a ejecutar `npm run store:assets`.

## Capturas con datos ficticios
`npm run store:screenshots` (necesita `npm run build` y una sesión en `.e2e-profile`, ver README):

- Trabaja sobre una **copia temporal** del perfil: no toca tu caché real.
- Intercepta en red la biblioteca familiar y los perfiles y los sustituye por familiares inventados (Ana, Luis, Marta) con avatares generados. Antes de cada captura comprueba que todo lo mostrado es ficticio.
- La cabecera de la tienda (usuario, saldo) queda fuera del encuadre. En esta página **el scroll lo hace el contenedor `#StoreTemplate`, no el documento** (`scrollY` vale siempre 0), y el script comprueba que ningún enlace a perfil o cuenta entra en el encuadre. Si falla algo, aborta y no deja capturas a medias.
- Salen juegos de tu wishlist real (carátulas de terceros). Revisa las imágenes antes de subirlas.

## Pendiente para publicar
- Política de privacidad: escrita en [PRIVACY.md](../PRIVACY.md) (es/en). URL para la ficha, una vez subida a `main`: https://github.com/Sethyrus/steam-wishlist-family-owned/blob/main/PRIVACY.md. Si cambia el comportamiento de la extensión (otros dominios, otros datos guardados), hay que actualizarla y cambiar la fecha.
- Formulario de prácticas de datos y justificación de permisos (`storage` y el content script en la wishlist).
- Textos de la ficha. Hoy la interfaz está solo en español; para público global habría que internacionalizar (`_locales`).
- Cuenta de desarrollador y declaración de trader/no-trader (UE).
