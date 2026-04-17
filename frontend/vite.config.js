import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test-setup.js',
        env: {
            VITE_API_URL: 'http://localhost:5000/api',
        },
    },
    server: {
        host: true,
        port: 3000,
        strictPort: true,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
        },
    },
})