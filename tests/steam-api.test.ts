import { describe, expect, it } from 'vitest';
import { accountId, fetchFamilyData, steamIdFromToken } from '../src/lib/steam-api';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const ME = '76561197960265729'; // accountid 1
const OTHER = '76561197960265730'; // accountid 2
const jwt = (sub: string) => `h.${btoa(JSON.stringify({ sub })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.s`;

function mockFetch(routes: Record<string, () => Response>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) throw new Error(`ruta no mockeada: ${url}`);
    return routes[key]();
  }) as typeof fetch;
}

const base = {
  ajaxgetasyncconfig: () => json({ data: { webapi_token: jwt(ME) } }),
  GetFamilyGroupForUser: () => json({ response: { family_groupid: '99' } }),
  'GetFamilyGroup/v1': () => json({ response: { members: [{ steamid: ME }, { steamid: OTHER }] } }),
  GetSharedLibraryApps: () => json({ response: { apps: [{ appid: 7, owner_steamids: [ME, OTHER], exclude_reason: 0 }] } }),
  miniprofile: () => json({ persona_name: 'Ana', avatar_url: 'a.jpg' }),
};

describe('fetchFamilyData', () => {
  it('devuelve el índice con nombres de los dueños', async () => {
    const data = await fetchFamilyData(mockFetch(base));
    expect(data?.index['7'].owners).toEqual([OTHER]);
    expect(data?.members[OTHER].name).toBe('Ana');
  });

  it('devuelve null sin sesión', async () => {
    const data = await fetchFamilyData(mockFetch({ ...base, ajaxgetasyncconfig: () => json({ data: {} }) }));
    expect(data).toBeNull();
  });

  it('devuelve null si no hay grupo familiar', async () => {
    const data = await fetchFamilyData(
      mockFetch({ ...base, GetFamilyGroupForUser: () => json({ response: { is_not_member_of_any_group: true } }) }),
    );
    expect(data).toBeNull();
  });

  it('usa un nombre de reserva si el miniprofile falla', async () => {
    const data = await fetchFamilyData(mockFetch({ ...base, miniprofile: () => json({}, 500) }));
    expect(data?.members[OTHER].name).toBe(`…${OTHER.slice(-4)}`);
  });

  it('propaga errores de la API de biblioteca', async () => {
    await expect(fetchFamilyData(mockFetch({ ...base, GetSharedLibraryApps: () => json({}, 429) }))).rejects.toThrow('429');
  });
});

describe('steamIdFromToken', () => {
  it('lee el steamid del campo sub del JWT', () => expect(steamIdFromToken(jwt(ME))).toBe(ME));
  it('devuelve null con un token mal formado', () => {
    expect(steamIdFromToken('basura')).toBeNull();
    expect(steamIdFromToken(jwt('abc'))).toBeNull();
  });
});

describe('accountId', () => {
  it('extrae los 32 bits bajos del steamid64', () => {
    expect(accountId(OTHER)).toBe(2);
  });
});
