import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import {
    defineConfig
} from "eslint/config"
import starciBe from "./plugins/eslint/index.mjs"

export default defineConfig([
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            ".repo/**",
            "scratch/**",
        ],
    },
    {
        files: ["src/**/*.ts", "apps/**/*.ts", "libs/**/*.ts", "test/**/*.ts", "tests/**/*.ts"],
        plugins: {
            js
        },
        extends: ["js/recommended"],
        languageOptions: {
            globals: globals.node
        }
    },
    ...tseslint.configs.recommended.map((config) => ({
        ...config,
        files: ["src/**/*.ts", "apps/**/*.ts", "libs/**/*.ts", "test/**/*.ts", "tests/**/*.ts"],
    })),
    {
        files: ["src/**/*.ts", "apps/**/*.ts", "libs/**/*.ts", "test/**/*.ts", "tests/**/*.ts"],
        rules: {
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn', // type-safety §1 — canon: no `any`, use `unknown` + narrow
            "array-element-newline": ["error",
                "always"],
            "object-curly-newline": [
                "error",
                {
                    "ObjectExpression": "always",
                    "ImportDeclaration": "always",
                }
            ],
            "function-call-argument-newline": ["error",
                "always"],
            indent: ["error",
                4],
            "linebreak-style": "off",
            quotes: ["error",
                "double"],
            semi: ["error",
                "never"],
        },
    },
    {
        // observability.md — logs leave through `WinstonService`, never `console.*`.
        files: ["src/**/*.ts", "apps/**/*.ts"],
        rules: {
            "no-console": "warn", // observability · nợ≈3
        },
    },
    {
        // Two canon bans that need no plugin code — a selector is enough. Scoped OFF the
        // `*spec.ts` family, `apps/*/test/**` and `src/modules/tests/**`: type-safety §6
        // sanctions `as unknown as` inside spec mocks by name, and the e2e/harness stack
        // reads `process.env` to stand up its own Testcontainers infra, which is a
        // different concern from the app's OWN typed config tree.
        files: ["src/**/*.ts", "apps/**/*.ts"],
        ignores: ["**/*spec.ts", "apps/*/test/**", "src/modules/tests/**"],
        rules: {
            "no-restricted-syntax": [
                "warn", // type-safety §6 · nợ≈37 (as unknown as) · config-and-env §8 · nợ≈5 (process.env)
                {
                    selector: "TSAsExpression:has(> TSAsExpression > TSUnknownKeyword)",
                    message: "`as unknown as X` is banned outside test mocks — narrow properly instead (type-safety §6).",
                },
                {
                    selector: "MemberExpression[object.name='process'][property.name='env']",
                    message: "`process.env` may only be read inside src/modules/platform/env/utils/parse-env.ts — use envConfig() (config-and-env §8).",
                },
            ],
        },
    },
    {
        // The custom canon layer. Every rule starts at `warn` with its measured debt in the
        // trailing comment, and is flipped to `error` the moment that debt reaches 0 — the
        // same burn-down playbook the front-end plugin follows.
        files: ["src/**/*.ts", "apps/**/*.ts"],
        plugins: {
            "starci-be": starciBe,
        },
        rules: {
            "starci-be/no-interpolated-log-message": "error", // observability · nợ=0 (the WinstonService signature already forces an enum arg)
            "starci-be/require-exception-object-arg": "warn", // error-handling §1
            "starci-be/throw-abstract-exception": "warn", // error-handling §1
            "starci-be/no-inline-param-type": "warn", // type-safety §4
            "starci-be/no-nest-logger": "warn", // observability
            "starci-be/no-deep-module-import": "warn", // naming-and-structure §3
            "starci-be/require-export-jsdoc": "warn", // comments §3
            "starci-be/require-enum-member-jsdoc": "warn", // type-safety §3
        },
    },
])