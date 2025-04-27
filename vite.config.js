import { defineConfig } from vite;

export default defineConfig({
  path: {
    aliases: {
      '/': 'src/index.js'
    }
  }
});