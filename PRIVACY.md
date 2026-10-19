# Política de privacidad · Privacy Policy

*Última actualización / Last updated: 2026-10-19*

**Steam Wishlist · Family Owned** es una extensión de navegador de código abierto. No está afiliada ni respaldada por Valve Corporation. *Steam Wishlist · Family Owned is an open-source browser extension. It is not affiliated with or endorsed by Valve Corporation.*

---

## Español

### Resumen
La extensión **no recopila, no envía y no vende ningún dato a su autor ni a terceros**. Todo se procesa en tu navegador. No tiene servidor, cuentas, analítica, publicidad ni telemetría.

### Qué hace y qué datos lee
Solo funciona en `https://store.steampowered.com/wishlist/*`. Para mostrarte qué juegos de tu lista de deseados ya tiene tu Familia de Steam, usa **tu propia sesión de Steam ya iniciada** para pedir a Steam, desde tu navegador:

- Tu identificador de Steam (steamid), obtenido del token de sesión de la tienda.
- Tu grupo de Familia de Steam y su biblioteca compartida (juegos y quién los tiene).
- Los appids de tu lista de deseados.
- El nombre y el avatar públicos de los miembros de tu familia, y tu URL personalizada de perfil (solo para saber si la lista abierta es la tuya).

Estas peticiones van **únicamente a servidores de Valve**: `store.steampowered.com`, `api.steampowered.com` y `steamcommunity.com`. No hay ninguna petición a otros dominios.

### Qué se guarda
En el almacenamiento local de la extensión (`storage.local`, solo en tu navegador) se guarda una caché con: tu steamid, los appids y nombres de los juegos de la biblioteca familiar, y para cada familiar su steamid, nombre público y URL de avatar. Sirve para no repetir las consultas: se considera caducada a las 6 horas y se reemplaza al refrescar (botón ↻) o al volver a cargar con la caché caducada. No hay otro almacenamiento.

El **token de acceso** de Steam solo se usa en memoria durante las peticiones: **nunca se guarda ni se registra**.

### Con quién se comparte
Con nadie. Los datos no salen de tu navegador, salvo las propias peticiones a Steam descritas arriba, que Steam ya conoce porque las haces tú con tu sesión. No se venden, ceden ni usan para publicidad, perfilado ni ningún otro fin ajeno al funcionamiento de la extensión.

### Permisos
- `storage`: guardar la caché descrita.
- Ejecución en `https://store.steampowered.com/wishlist/*`: es el único sitio donde actúa.
- No pide permisos de acceso a otros sitios, historial, pestañas ni cookies, y no ejecuta código remoto.

### Control y borrado de tus datos
Al **desinstalar la extensión** se elimina su almacenamiento local. También puedes borrarlo desde `chrome://extensions` → Detalles → *Borrar datos*/reinstalar. No existe una cuenta ni datos en ningún servidor del autor que haya que borrar.

### Menores
La extensión no recopila datos de nadie, tampoco de menores.

### Cambios
Si esta política cambia, se actualizará este archivo con una nueva fecha. El historial es público en el repositorio.

### Contacto
Abre un issue en https://github.com/Sethyrus/steam-wishlist-family-owned/issues. Para vulnerabilidades, consulta [SECURITY.md](SECURITY.md).

---

## English

### Summary
The extension **does not collect, send or sell any data to its author or to third parties**. Everything is processed in your browser. It has no server, accounts, analytics, ads or telemetry.

### What it does and what data it reads
It only runs on `https://store.steampowered.com/wishlist/*`. To show which wishlist games your Steam Family already owns, it uses **your own, already signed-in Steam session** to request from Steam, from your browser:

- Your Steam ID (steamid), taken from the store session token.
- Your Steam Family group and its shared library (games and who owns them).
- The app IDs on your wishlist.
- The public name and avatar of your family members, and your profile's custom URL (only to tell whether the open wishlist is yours).

These requests go **only to Valve's servers**: `store.steampowered.com`, `api.steampowered.com` and `steamcommunity.com`. No other domain is contacted.

### What is stored
The extension's local storage (`storage.local`, in your browser only) keeps a cache with: your steamid, the app IDs and names of the family library games, and for each family member their steamid, public name and avatar URL. It avoids repeating requests: it is considered expired after 6 hours and is replaced on refresh (↻ button) or on the next load once expired. Nothing else is stored.

Steam's **access token** is only held in memory while requests run: **it is never stored or logged**.

### Who it is shared with
Nobody. Data never leaves your browser except for the requests to Steam described above, which you make yourself with your own session. It is not sold, transferred or used for advertising, profiling, or any purpose unrelated to the extension's function.

### Permissions
- `storage`: to keep the cache described above.
- Execution on `https://store.steampowered.com/wishlist/*`: the only site where it acts.
- It requests no access to other sites, history, tabs or cookies, and runs no remote code.

### Control and deletion
**Uninstalling the extension** removes its local storage. There is no account and no data on any author-operated server to delete.

### Children
The extension collects no data from anyone, including children.

### Changes
If this policy changes, this file will be updated with a new date. The history is public in the repository.

### Contact
Open an issue at https://github.com/Sethyrus/steam-wishlist-family-owned/issues. For vulnerabilities, see [SECURITY.md](SECURITY.md).
