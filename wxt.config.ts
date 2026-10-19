import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'Steam Wishlist · Family Owned',
    description: 'Marca en tu wishlist los juegos que ya tiene alguien de tu Familia de Steam',
    permissions: ['storage'],
  },
});
