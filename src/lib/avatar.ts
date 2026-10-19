/** Solo aceptamos avatares https: los datos vienen de Steam y se tratan como no fiables. */
export const safeAvatar = (url: string | undefined): string | null => (url && /^https:\/\//i.test(url) ? url : null);

export function avatarImg(doc: Document, url: string | undefined, name: string): HTMLImageElement | null {
  const src = safeAvatar(url);
  if (!src) return null;
  const img = doc.createElement('img');
  img.src = src;
  img.alt = name;
  img.title = name;
  img.setAttribute('data-family-avatar', '');
  return img;
}
