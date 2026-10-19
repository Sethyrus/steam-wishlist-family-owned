# Política de seguridad

## Qué datos toca la extensión
- Solo se ejecuta en `https://store.steampowered.com/wishlist/*`.
- Usa tu sesión de Steam ya iniciada para pedir a Steam, desde tu navegador, tu biblioteca familiar, tu wishlist y los nombres/avatares de tu familia.
- **No envía nada a servidores de terceros** y no tiene backend, analítica ni telemetría.
- El token de acceso de Steam solo vive en memoria durante la petición: **nunca se guarda ni se registra**. Lo único que se guarda (`storage.local`) es la caché de la biblioteca familiar: appids, nombres y avatares públicos de tus familiares y tu steamid.
- No pide permisos de sitios adicionales (`host_permissions`); solo `storage`.
- Todo texto que llega de Steam se inserta con `textContent` (nunca `innerHTML`) y solo se aceptan avatares `https://`.

La política de privacidad completa está en [PRIVACY.md](PRIVACY.md).

## Cómo verificarlo tú mismo
Compila desde el código fuente (ver [README](README.md)) y revisa `.output/chrome-mv3/manifest.json`. Cada release publica además un `SHA256SUMS` del zip.

## Informar de una vulnerabilidad
Usa **"Report a vulnerability"** en la pestaña *Security* del repositorio (aviso privado de GitHub) en lugar de abrir un issue público. Intentaré responder en unos días.

## Alcance y limitaciones
La extensión depende de endpoints de Steam no documentados oficialmente; pueden cambiar sin aviso. Proyecto personal, sin garantías (ver [LICENSE](LICENSE)).
