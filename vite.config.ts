import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' gera caminhos relativos, então o build funciona no GitHub Pages
// em qualquer nome de repositório (usuario.github.io/qualquer-nome/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2019',
    assetsInlineLimit: 4096,
  },
});
