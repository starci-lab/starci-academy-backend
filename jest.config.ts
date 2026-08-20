import type {
    Config,
} from "jest"

/**
 * Settings shared by every Jest project (resolver, transform, path aliases).
 * Kept in one place so the unit and integration projects can't drift apart.
 */
const sharedProjectConfig = {
    /** Resolve TS/JS/JSON modules. */
    moduleFileExtensions: [
        "js",
        "json",
        "ts",
    ],
    /** Repo root. */
    rootDir: ".",
    /** Transpile TS via ts-jest; skip type diagnostics (build is the type gate). */
    transform: {
        "^.+\\.(t|j)s$": [
            "ts-jest",
            {
                diagnostics: false,
            },
        ],
    },
    /** Many deps ship ESM-only barrels — transform everything. */
    transformIgnorePatterns: [],
    /** Path aliases mirrored from tsconfig. */
    moduleNameMapper: {
        "^@modules/(.*)$": "<rootDir>/src/modules/$1",
        "^@features/(.*)$": "<rootDir>/src/features/$1",
        "^@tests/(.*)$": "<rootDir>/src/tests/$1",
    },
    /** Node environment — no DOM. */
    testEnvironment: "node",
    /** Only scan source + app trees for specs. */
    roots: [
        "<rootDir>/apps/",
        "<rootDir>/src/",
        "<rootDir>/testing-support/",
    ],
}

/**
 * Two projects:
 * - **unit** — pure jest-mocked specs (`*.spec.ts`), no infrastructure. This is
 *   what `npm test` / CI runs. E2E specs (`*.e2e-spec.ts`), integration specs
 *   (`*.int-spec.ts`), and LLM-eval harness specs (`*.harness-spec.ts`) are
 *   excluded BY SUFFIX, not by path -- which is why the e2e and harness suites
 *   can live under `src/tests` without the fast unit run ever picking them up.
 *   Each of those lanes has its own config under `src/tests/<lane>`.
 * - **integration** — `*.int-spec.ts` specs that need real infra (Testcontainers).
 *   Opt-in via `npm run test:int`; never part of the default fast unit run.
 */
const config: Config = {
    projects: [
        {
            ...sharedProjectConfig,
            displayName: "unit",
            testMatch: [
                "**/*.spec.ts",
            ],
            testPathIgnorePatterns: [
                "\\.int-spec\\.ts$",
                "\\.e2e-spec\\.ts$",
                "\\.harness-spec\\.ts$",
            ],
        },
        {
            ...sharedProjectConfig,
            displayName: "integration",
            testMatch: [
                "**/*.int-spec.ts",
            ],
            setupFilesAfterEnv: [
                "<rootDir>/src/tests/helpers/e2e-db-reset.ts",
            ],
            globalSetup: "<rootDir>/src/tests/helpers/e2e-setup.ts",
            globalTeardown: "<rootDir>/src/tests/helpers/e2e-teardown.ts",
            testTimeout: 120_000,
        },
    ],
    /**
     * Coverage describes authored production code. Test lanes, declarations and
     * bootstrap entrypoints are evidence/assembly, not production behavior in the
     * denominator. E2E remains linted and runnable through its own lane.
     */
    collectCoverageFrom: [
        "src/**/*.ts",
        "apps/**/*.ts",
        "!src/tests/**",
        "!**/*.spec.ts",
        "!**/*.int-spec.ts",
        "!**/*.e2e-spec.ts",
        "!**/*.harness-spec.ts",
        "!**/*.d.ts",
        "!**/main.ts",
        // apps/tools/dashboard has no source tree in this repo — only a checked-in,
        // content-hashed Vite build (`dist/assets/index-<hash>.js`). It is generated
        // evidence, not authored code, and there is no hand-written counterpart to test.
        "!apps/tools/dashboard/dist/**",
    ],
    coverageDirectory: "./coverage",
}

export default config
