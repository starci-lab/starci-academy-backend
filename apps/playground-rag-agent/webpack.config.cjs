/*
 * Webpack config for the StarCi playground on-device RAG agent (nest-commander CLI).
 * See apps/playground-docker-agent/webpack.config.cjs for the shared rationale.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("path")
const webpack = require("webpack")
const nodeExternals = require("webpack-node-externals")
const GeneratePackageJsonPlugin = require("generate-package-json-webpack-plugin")

/** package.json generated into dist/apps/playground-rag-agent (publish this folder). */
const basePackage = {
    name: "@starciacademy/playground-rag-agent",
    version: "0.3.0",
    description: "Run on-device RAG for a StarCi Academy playground session — indexes your code and answers questions using your LOCAL Ollama (no cloud, no auth).",
    license: "MIT",
    keywords: ["starci", "playground", "rag", "ollama", "byom", "agent"],
    main: "./main.js",
    bin: {
        "playground-rag-agent": "./main.js",
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

module.exports = (options) => ({
    ...options,
    entry: "./apps/playground-rag-agent/src/main.ts",
    output: {
        path: path.join(__dirname, "../..", "dist", "apps", "playground-rag-agent"),
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
