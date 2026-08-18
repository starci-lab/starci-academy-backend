#!/usr/bin/env node

import { existsSync } from "node:fs"
import { delimiter, dirname, join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const composeRoot = join(root, ".stacks", "dev", "infra", "compose")
const composeFile = join(composeRoot, "starci.yaml")
const envFile = join(composeRoot, ".env.generated")
const isWindows = process.platform === "win32"

const resolveCommand = (name) => {
    const extensions = isWindows ? [".exe", ".cmd", ".bat", ""] : [""]
    for (const directory of (process.env.PATH ?? "").split(delimiter).filter(Boolean)) {
        for (const extension of extensions) {
            const candidate = join(directory, `${name}${extension}`)
            if (existsSync(candidate)) return candidate
        }
    }
    throw new Error(`${name} is not installed or absent from PATH`)
}

const run = (command, args) => {
    const result = spawnSync(command, args, { cwd: root, stdio: "inherit", windowsHide: true })
    if (result.error) throw result.error
    if (result.status !== 0) process.exit(result.status ?? 1)
}

run(process.execPath, [join(root, "scripts", "compose.mjs"), "--render-only", "--profile", "public"])
const args = process.argv.slice(2)
run(resolveCommand("docker"), [
    "compose", "--env-file", envFile, "-f", composeFile, "--profile", "public",
    ...(args.length > 0 ? args : ["up", "-d"]),
])
