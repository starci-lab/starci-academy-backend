/*
 * Webpack config for the StarCi playground Kubernetes agent (nest-commander CLI).
 * See apps/playground-docker-agent/webpack.config.cjs for the shared rationale.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("node:path")
const webpack = require("webpack")
const nodeExternals = require("webpack-node-externals")
const GeneratePackageJsonPlugin = require("generate-package-json-webpack-plugin")

/** package.json generated into dist/apps/playground-k8s-agent (publish this folder). */
const basePackage = {
    name: "@starciacademy/playground-k8s-agent",
    version: "0.3.0",
    description: "Pair your local Kubernetes machine with a StarCi Academy playground session — relays terminal output and reports pods/deployments/services/… for step verification.",
    license: "MIT",
    keywords: ["starci", "playground", "kubernetes", "k8s", "byom", "agent"],
    main: "./main.js",
    bin: {
        "playground-k8s-agent": "./main.js",
    },
    engines: {
        node: ">= 18",
    },
    publishConfig: {
        access: "public",
    },
    dependencies: {
        "@nestjs/common": "^11.0.1",
        "@nestjs/core": "^11.0.1",
        "execa": "^9.6.1",
        "nest-commander": "^3.20.1",
        "reflect-metadata": "^0.2.2",
        "rxjs": "^7.8.1",
        "socket.io-client": "^4.8.1",
    },
}

const buildWebpackConfig = (options) => ({
    ...options,
    entry: "./apps/playground-k8s-agent/src/main.ts",
    output: {
        path: path.join(__dirname, "../..", "dist", "apps", "playground-k8s-agent"),
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
        new webpack.BannerPlugin({
            banner: "#!/usr/bin/env node",
            raw: true,
            entryOnly: true,
        }),
        new GeneratePackageJsonPlugin(
            basePackage,
            {
                resolveContextPaths: [__dirname],
                useInstalledVersions: true,
                excludeDependencies: [],
            },
        ),
    ],
})

module.exports = buildWebpackConfig
