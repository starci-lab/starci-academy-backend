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
            '@typescript-eslint/no-explicit-any': 'error', // type-safety §1 — canon: no `any`, use `unknown` + narrow
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
            "no-console": "error", // observability · nợ=0 → error
        },
    },
    {
        // Two canon bans that need no plugin code — a selector is enough. Scoped OFF the
        // `*spec.ts` family and `src/tests/**`: type-safety §6 sanctions `as unknown as`
        // inside spec mocks by name, and the e2e/harness lanes read and WRITE
        // `process.env` to point the app at the Testcontainers instance they just booted,
        // which is a different concern from the app's OWN typed config tree.
        //
        // One entry, not two: the unit mocks used to sit apart in `src/modules/tests/**`
        // and needed their own line. They live under `src/tests/mocks/` now, because a
        // mock only specs touch is not part of the shared library `modules/` is for.
        files: ["src/**/*.ts", "apps/**/*.ts"],
        ignores: [
            "**/*spec.ts",
            "src/tests/**",
            // config-and-env §8: this file IS the only permitted process.env reader.
            "src/modules/platform/env/utils/parse-env.ts",
        ],
        rules: {
            "no-restricted-syntax": [
                "error", // type-safety §6 + config-and-env §8 · nợ=0 → error
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
        //
        // This block used to carve out `apps/tools/dashboard/**`, a Vite/React SPA that the
        // backend-shaped rules did not fit. That app is gone, and with it the only exception
        // to "every remaining app is a NestJS app". Do not re-add a front-end carve-out here
        // without the front end actually returning.
        files: ["src/**/*.ts", "apps/**/*.ts"],
        plugins: {
            "starci-be": starciBe,
        },
        rules: {
            "starci-be/no-ai-symbol": "error", // nợ=0 -> error · comments stay ASCII (auto-fixable)
            "starci-be/no-emoji": "error", // nợ=0 → error · emoji carry tone, not information
            "starci-be/no-vietnamese": "error", // comments.md · nợ=0 → error
            "starci-be/no-interpolated-log-message": "error", // observability · nợ=0 (the WinstonService signature already forces an enum arg)
            "starci-be/require-exception-object-arg": "error", // error-handling §1 · nợ=0 → error
            "starci-be/throw-abstract-exception": "error", // error-handling §1 · nợ=0 → error
            "starci-be/no-inline-param-type": "error", // type-safety §4 · nợ=0 → error
            "starci-be/no-nest-logger": "error", // observability · nợ=0 → error
            "starci-be/must-deep-module-import": "error", // naming-and-structure §3 · nợ=0 → error
            "starci-be/no-self-module-alias": "error", // naming-and-structure §3 · nợ=0 → error
            // Eight rules added after a sweep for what the source ALREADY does without
            // exception. Each count below was taken by running the rule, not by grepping:
            // an estimate on this repo once missed a rule's debt by a factor of
            // twenty-five. All land at `error` because all measured zero.
            "starci-be/exception-extends-abstract": "error", // error-handling §1 · nợ=0 (305 vs 1, that 1 fixed)
            "starci-be/exception-in-errors-folder": "error", // error-handling §1 · nợ=0
            "starci-be/must-inject-entity-manager": "error", // data-access · nợ=0 (296/296)
            "starci-be/no-injected-repository": "error", // data-access · nợ=0 (1341 EntityManager vs 0)
            "starci-be/must-use-cache-service": "error", // caching · nợ=0 (raw tokens only inside the cache module)
            "starci-be/no-const-enum": "error", // type-safety · nợ=0 (129/129)
            "starci-be/require-entity-table-name": "error", // data-access · nợ=0 (181/181)
            "starci-be/no-default-export": "error", // naming-and-structure · nợ=0 (Jest lifecycle entries carved out in the rule)
            "starci-be/require-export-jsdoc": "error", // comments §3 · nợ=0 → error
            "starci-be/require-enum-member-jsdoc": "error", // type-safety §3 · nợ=0 → error
        },
    },
    {
        // naming-and-structure §8 -- modules do not import other in-repo modules.
        // Split from src/features so severities can diverge. apps/*/src/** is
        // the composition root and is intentionally out of this glob.
        files: ["src/modules/**/*.module.ts"],
        rules: {
            "starci-be/no-non-global-module-import": "error", // naming-and-structure §8 · nợ=0 → error
        },
    },
    {
        // features debt is 17, concentrated in features/api (ElasticsearchModule
        // + a handful of other capability imports) plus one IoRedisModule in
        // socketio/core/playground-byom. mock/** aggregators are same-capability
        // nesting and correctly silent -- the estimator's mock/socketio numbers
        // counted those aggregators; this rule does not.
        files: ["src/features/**/*.module.ts"],
        rules: {
            // naming-and-structure §8 · nợ=0 → error.
            //
            // Burned down from 17. Thirteen were already registered `isGlobal: true` at
            // apps/core -- the only app composing @features/api and @features/socketio --
            // so removing the local import changed nothing at runtime. A fourteenth
            // (ApolloServerModule) stopped being a violation when the rule learned to
            // allow a registration carrying real per-instance configuration: `type:
            // Monolithic` cannot be expressed by one global registration.
            //
            // The last three each needed a decision rather than a deletion:
            //   JobsModule    -- redundant; the global BussinessModule already imports
            //                    AND exports JobsModule.register(options)
            //   HealthModule  -- moved to the app root, which is what its own doc
            //   Judge0Module     already prescribed ("Register with isGlobal: true")
            "starci-be/no-non-global-module-import": "error",
        },
    },
    {
        // error-handling.md §1 states the auto-ban's own intended surface in so many words:
        // "a no-restricted-syntax rule banning `NewExpression[callee.name="Error"]` in `src/**`"
        // — the e2e/harness runners are Jest-side test infrastructure (poll-until-true helpers,
        // forced-failure injection, doc-parsing assertions) that never crosses an API boundary
        // and is never a production error representation; a raw `Error` there is a test-runner
        // assertion, not a domain failure. Same carve-out the neighboring `no-restricted-syntax`
        // block already applies for the same reason.
        //
        // `src/tests/**` is named explicitly rather than relying on `src/**`: those lanes moved
        // under `src/` so their specs sit in the same import universe as the services they
        // exercise, which brought them INSIDE the canon rules' `files` glob for the first time.
        files: [
            "apps/*/test/**/*.ts",
            "src/tests/**/*.ts",
        ],
        rules: {
            "starci-be/throw-abstract-exception": "off",
        },
    },
])