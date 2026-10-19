# ADR 0001: WXT y llamada en lote de Familia

- **Estado**: aceptada
- **Decisión**: WXT + TypeScript; solo Familia de Steam con `GetSharedLibraryApps` (1 llamada para toda la wishlist).
- **Alternativas descartadas**: amigos con `GetFriendsGameplayInfo` (una llamada por appid, con riesgo de 429, y se pospone); Plasmo (mantenimiento dudoso); API key de Web API (no se puede distribuir en una extensión).
- **Consecuencias**: dependemos de endpoints no documentados, por eso se aíslan en `steam-api.ts` con tests de contrato.
