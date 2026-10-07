import { URL, fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: {
            // The parts of the demo that are not framework-specific. In this starter they live in
            // `src/demo`; in the AG Studio repo the same alias points at a shared directory, which
            // is how one copy serves every framework variant.
            '@demo': fileURLToPath(new URL('./src/demo', import.meta.url)),
        },
    },
});
