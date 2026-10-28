import { defineConfig } from 'vite';

export default defineConfig({
    // Relative asset paths, so the built `dist/` works from any static host path, such as a
    // GitHub Pages project site.
    base: './',
    build: {
        // The Studio and AG Charts bundles are large and always loaded together, so the default
        // 500 kB warning fires on every build and tells us nothing.
        chunkSizeWarningLimit: 4000,
    },
});
