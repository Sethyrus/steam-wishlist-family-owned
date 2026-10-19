export default defineContentScript({
  matches: ['https://store.steampowered.com/wishlist/*'],
  main() {
    console.log('[family-owned] content script cargado');
  },
});
