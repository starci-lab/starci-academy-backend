/*
 * Webpack config for the StarCi playground Docker agent (nest-commander CLI).
 *
 * - Function form `(options) => ({ ...options })` keeps the Nest-CLI defaults
 *   (ts-loader + @modules/* path resolution + ForkTsChecker), then layers on:
 *   - nodeExternals: don't bundle node_modules (resolved at runtime / install).
 *     The shared core lives in src/modules (SOURCE), so it IS bundled in.
 *   - BannerPlugin: prepend the `#!/usr/bin/env node` shebang so `npx` can exec.
 *   - GeneratePackageJsonPlugin: emit a publish-ready package.json next to main.js.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("path")
const webpack = require("webpack")
const nodeExternals = require("webpack-node-externals")
const GeneratePackageJsonPlugin = require("generate-package-json-webpack-plugin")

/** package.json generated into dist/apps/playground-docker-agent (publish this folder). */
const basePackage = {
    name: "@starciacademy/playground-docker-agent",
    version: "0.3.0",
    description: "Pair your local Docker machine with a StarCi Academy playground session — relays terminal output and reports containers/images/networks for step verification.",
    license: "MIT",
    keywords: ["starci", "playground", "docker", "byom", "agent"],
    main: "./main.js",
    bin: {
        "playground-docker-agent": "./main.js",
    },
    engines: {
        node: ">= 18",
    },
    publishConfig: {
        access: "public",
    },
    // seed the runtime externals so they land in the published deps even when only
    // reached via dynamic import (execa); versions normalized from node_modules.
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
    entry: "./apps/playground-docker-agent/src/main.ts",
    output: {
        path: path.join(__dirname, "../..", "dist", "apps", "playground-docker-agent"),
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
