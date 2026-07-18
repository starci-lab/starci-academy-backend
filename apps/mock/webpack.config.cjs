/*
 * Webpack configuration for the mock-sandbox app (NestJS application).
 *
 * - Bundles the TypeScript entry so `@modules/*` / `@features/*` path aliases
 *   resolve at runtime (mirrors the core app).
 * - node_modules stay external and are resolved at runtime.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("path")

// Load .env.override so DISABLE_FORK_TS_CHECKER is visible during webpack.
require("dotenv").config({ path: path.join(__dirname, "../../.env.override") })

// Prevent bundling node_modules; they will be resolved at runtime.
const nodeExternals = require("webpack-node-externals")

// Generates a package.json file in the output directory.
const GeneratePackageJsonPlugin = require("generate-package-json-webpack-plugin")

/** Base package.json template generated inside dist/apps/mock. */
const basePackage = {
    name: "mock",
    version: "0.0.1",
    main: "./main.js",
    scripts: {
        start: "node ./main.js"
    },
    engines: {
        node: ">= 24",
    },
    dependencies: {
        "@nestjs/platform-express": "^11.0.1",
    },
}

module.exports = (options) => ({
    ...options,
    entry: "./apps/mock/src/main.ts",
    output: {
        path: path.join(__dirname,
            "../..",
            "dist",
            "apps",
            "mock"),
        filename: "main.js",
    },
    target: "node",
    externals: [nodeExternals()],
    plugins: [
        // ForkTsChecker disabled by default — repo-wide type-check on build OOMs;
        // rely on `tsc --noEmit` / the IDE for type safety instead.
        ...(options.plugins ?? []).filter(
            (plugin) => !/ForkTsChecker/i.test(plugin?.constructor?.name ?? ""),
        ),
        new GeneratePackageJsonPlugin(
            basePackage,
            {
                resolveContextPaths: [__dirname],
                useInstalledVersions: true,
                excludeDependencies: [],
            }
        ),
    ],
})
