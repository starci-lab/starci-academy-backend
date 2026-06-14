import {
    defineConfig,
} from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

/**
 * Vite config for the local-only ops dashboard (HeroUI v3 + Tailwind v4).
 *
 * `base: "/dashboard/"` so the built asset URLs resolve under the path the
 * backend serves the SPA from. In dev, `/api` is proxied to the tools backend
 * (default port 3003) so the same `fetch("/api/v1/tools/...")` calls work
 * unchanged in both dev and the served build.
 */
export default defineConfig({
    base: "/dashboard/",
    plugins: [
        react(),
        tailwindcss(),
    ],
    build: {
        outDir: "dist",
        emptyOutDir: true,
    },
    server: {
        port: 5180,
        proxy: {
            "/api": {
                target: "http://localhost:3003",
                changeOrigin: true,
            },
        },
    },
})
