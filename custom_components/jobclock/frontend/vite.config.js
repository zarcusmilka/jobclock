import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        tailwindcss(),
    ],
    build: {
        outDir: '../www',
        emptyOutDir: false, // Don't wipe the whole www folder
        lib: {
            entry: 'src/jobclock-card.js',
            name: 'JobClockCard',
            formats: ['es'],
            fileName: () => 'jobclock-card.js'
        },
        rollupOptions: {
            // Lit is bundled into the single file, so no external deps for HA
        }
    }
});
