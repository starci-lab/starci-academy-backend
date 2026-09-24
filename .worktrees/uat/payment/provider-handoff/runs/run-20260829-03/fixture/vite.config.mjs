import { defineConfig } from "file:///D:/Repositories/starci-academy-fe/node_modules/vite/dist/node/index.js"
import react from "file:///D:/Repositories/starci-academy-fe/node_modules/@vitejs/plugin-react/dist/index.js"
import tailwindcss from "file:///D:/Repositories/starci-academy-fe/node_modules/@tailwindcss/postcss/dist/index.mjs"

const frontend = "D:/Repositories/starci-academy-fe"
const fixture = "D:/Repositories/starci-academy-backend/.worktrees/uat/payment/provider-handoff/runs/run-20260829-03/fixture"

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": `${frontend}/src`,
            react: `${frontend}/node_modules/react`,
            "react-dom": `${frontend}/node_modules/react-dom`,
        },
    },
    css: {
        postcss: {
            plugins: [tailwindcss()],
        },
    },
    server: {
        fs: {
            allow: [frontend, fixture],
        },
    },
})
