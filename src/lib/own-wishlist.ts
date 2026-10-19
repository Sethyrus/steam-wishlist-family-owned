type Fetch = typeof fetch;

/** URL personalizada (vanity) de un steamid, o null si no tiene o falla la consulta. */
export async function fetchVanity(steamid: string, f: Fetch = fetch): Promise<string | null> {
  try {
    const res = await f(`https://steamcommunity.com/actions/ajaxresolveusers?steamids=${steamid}`, { credentials: 'include' });
    if (!res.ok) return null;
    const url = (await res.json())?.[0]?.profile_url;
    return typeof url === 'string' && url && !/^\d+$/.test(url) ? url.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** ¿La página abierta es la wishlist del propio usuario? Los badges salen siempre; el panel solo en la propia. */
export async function isOwnWishlist(pathname: string, self: string, f: Fetch = fetch): Promise<boolean> {
  // /wishlist/ a secas: Steam lo redirige (desde el cliente, tras cargar el script) a la wishlist del propio usuario.
  if (/^\/wishlist\/?$/.test(pathname)) return true;
  const byId = pathname.match(/^\/wishlist\/profiles\/(\d+)/);
  if (byId) return byId[1] === self;
  const vanity = pathname.match(/^\/wishlist\/id\/([^/]+)/)?.[1]?.toLowerCase();
  return !!vanity && vanity === (await fetchVanity(self, f));
}
