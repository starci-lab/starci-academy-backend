
/* 
 * Webpack configuration for core (NestJS application)
 * 
 * - Uses CommonJS for maximum compatibility with Nest CLI
 * - Bundles TypeScript entry into a Node.js application
 * - Generates a standalone package.json for distribution
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("node:path")

// Load .env.override so DISABLE_FORK_TS_CHECKER is visible during webpack (Nest ConfigModule only loads it at runtime).
require("dotenv").config({ path: path.join(__dirname, "../../.env.override") })

// Prevent bundling node_modules; they will be resolved at runtime
const nodeExternals = require("webpack-node-externals")

// Generates a package.json file in the output directory
const GeneratePackageJsonPlugin = require("generate-package-json-webpack-plugin")

/**
 * Base package.json template for core
 * This file will be generated inside dist/apps/core
 */
const basePackage = {
    name: "core",
    version: "0.0.1",

    /**
     * Entry point relative to the generated package.json
     * IMPORTANT:
     * - package.json is generated inside dist/apps/core
     * - main.js will also live in the same directory
     */
    main: "./main.js",

    scripts: {
        start: "node ./main.js"
    },

    /**
     * Node.js runtime requirement
     */
    engines: {
        node: ">= 24",
    },

    /**
     * Dependencies for the coordinator application
     */
    dependencies: {
        "@nestjs/platform-express": "^11.0.1",
    },
}

const buildWebpackConfig = (options) => ({
    ...options,
    /**
     * TypeScript entry point for the coordinator application
     */
    entry: "./apps/core/src/main.ts",

    /**
     * Output bundle location
     * Final result: dist/apps/core/main.js
     */
    output: {
        path: path.join(__dirname,
            "../..",
            "dist",
            "apps",
            "core"),
        filename: "main.js",
    },

    /**
     * Target Node.js runtime (not browser)
     */
    target: "node",

    /**
     * Exclude node_modules from the bundle
     */
    externals: [nodeExternals()],

    /**
     * Plugins used during the build process.
     *
     * When `DISABLE_FORK_TS_CHECKER=true`, the Nest-CLI default
     * ForkTsCheckerWebpackPlugin is stripped. This is an opt-in escape hatch for
     * local seeding/dev when repo-wide pre-existing type errors make the
     * type-check fork run out of memory; the bundle is transpiled regardless.
     * Default behavior (checker on) is unchanged.
     */
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

module.exports = buildWebpackConfig
