import { loadCache, saveCache } from '@/lib/cache';
import { fetchFamilyData } from '@/lib/steam-api';
import { applyBadges } from '@/lib/wishlist-dom';

export default defineContentScript({
  matches: ['https://store.steampowered.com/wishlist/*'],
  async main() {
    let data = await loadCache();
    if (!data) {
      try {
        data = await fetchFamilyData();
        if (data) await saveCache(data);
      } catch (err) {
        console.warn('[family-owned] no se pudo obtener la biblioteca familiar', err instanceof Error ? err.message : err);
      }
    }
    if (!data) return; // sin sesión o sin grupo familiar: no hacemos nada

    const run = () => applyBadges(document, data!);
    let pending = false;
    new MutationObserver(() => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        run();
      });
    }).observe(document.body, { childList: true, subtree: true });
    run();
  },
});
