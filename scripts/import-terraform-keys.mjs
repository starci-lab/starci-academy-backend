#!/usr/bin/env node
/**
 * scripts/import-terraform-keys.mjs -- ONE-SHOT: move the third-party keys out
 * of .mount/terraform and into the encrypted stack tree.
 *
 *   node scripts/import-terraform-keys.mjs dev --dry-run
 *   node scripts/import-terraform-keys.mjs dev
 *   node scripts/import-terraform-keys.mjs dev --force     (overwrite existing .enc)
 *
 * These keys are the ones that CANNOT be regenerated. Stripe, PayPal, Brevo,
 * GitHub, the AI pools, the AES encryption key that every encrypted column in
 * the database was written with. Losing one costs a support ticket at best and
 * unreadable data at worst, so this script is built around three rules:
 *
 *   1. It NEVER deletes an original. .mount/terraform is left exactly as it was
 *      found; retiring it is the operator's job, after the encrypted twins have
 *      been proven to decrypt.
 *   2. It NEVER holds a key in memory. The bytes go from the source file to the
 *      destination through `copyFileSync` -- a filesystem-level copy that never
 *      enters this process's heap -- and from there straight into sops.
 *   3. It NEVER prints a value. Names, byte counts and verdicts only.
 *
 * Why copy-then-encrypt rather than encrypting the source in place: sops matches
 * its `creation_rules` against the path it is HANDED. Pointed at
 * `.mount/terraform/x.key` it would find no rule in .sops.yaml (whose rules are
 * scoped to `.stacks/`) and refuse for a reason that reads like a bug. Copying
 * to the destination first means the rule that matches is the rule that was
 * written for that destination.
 *
 * Two files are renamed on the way across, because the name on disk is not the
 * name config.ts looks for. The mapping lives in scripts/credentials.mjs; it is
 * not decided here.
 *
 * Node builtins only -- it runs before `npm ci` on a fresh machine.
 */

import {
    copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync,
} from "node:fs"
import { homedir } from "node:os"
import {
    dirname, join, relative, resolve, sep,
} from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { APP_CREDENTIALS, IMPORT_SKIP } from "./credentials.mjs"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const MOUNT_ROOT = join(REPO_ROOT, ".mount")
const TERRAFORM_ROOT = join(MOUNT_ROOT, "terraform")

/** The one age identity shared across every project of this owner. */
const MASTER_KEY = join(homedir(), ".starci", "master.identity")

const IS_WINDOWS = process.platform === "win32"

const USE_COLOR = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR
const paint = (code, text) => (USE_COLOR ? `[${code}m${text}[0m` : text)
const cyan = (text) => paint("36", text)
const green = (text) => paint("32", text)
const yellow = (text) => paint("33", text)
const red = (text) => paint("31", text)
const dim = (text) => paint("2", text)

/** Aborts with a readable message rather than a stack trace. */
const die = (message, hints = []) => {
    console.error(`\n${red("import-terraform-keys:")} ${message}`)
    for (const hint of hints) {
        console.error(`  ${hint}`)
    }
    console.error("")
    process.exit(1)
}

/**
 * Resolves an executable by hand. `spawnSync` without a shell ignores PATHEXT on
 * Windows, and winget installs sops under Packages/ with a PATH entry that
 * already-open shells have not picked up yet.
 * @param command - bare command name, e.g. "sops".
 */
const resolveCommand = (command) => {
    const dirs = (process.env.PATH || "").split(IS_WINDOWS ? ";" : ":").filter(Boolean)
    if (IS_WINDOWS && process.env.LOCALAPPDATA) {
        const winget = join(process.env.LOCALAPPDATA, "Microsoft", "WinGet")
        dirs.push(join(winget, "Links"))
        const packages = join(winget, "Packages")
        if (existsSync(packages)) {
            for (const entry of readdirSync(packages)) {
                const packageDir = join(packages, entry)
                dirs.push(packageDir)
                try {
                    for (const nested of readdirSync(packageDir, { withFileTypes: true })) {
                        if (nested.isDirectory()) {
                            dirs.push(join(packageDir, nested.name))
                        }
                    }
                } catch {
                    // unreadable package dir -- another candidate may still match
                }
            }
        }
    }
    const extensions = IS_WINDOWS
        ? (process.env.PATHEXT || ".EXE;.CMD;.BAT").split(";").filter(Boolean)
        : [""]
    for (const dir of dirs) {
        for (const extension of extensions) {
            const candidate = join(dir, `${command}${extension}`)
            if (existsSync(candidate)) {
                return candidate
            }
        }
    }
    return null
}

/** Every file under .mount/terraform, as a posix path relative to .mount/. */
const walkTerraform = () => {
    const out = []
    const walk = (dir) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const full = join(dir, entry.name)
            if (entry.isDirectory()) {
                walk(full)
                continue
            }
            out.push(relative(MOUNT_ROOT, full).split(sep).join("/"))
        }
    }
    walk(TERRAFORM_ROOT)
    return out.sort()
}

const HELP = `
import-terraform-keys -- move .mount/terraform/** into .stacks/<stack>/runtime/files
as sops ciphertext. One-shot; the originals are never deleted.

  node scripts/import-terraform-keys.mjs dev --dry-run   show what would move
  node scripts/import-terraform-keys.mjs dev            do it
  node scripts/import-terraform-keys.mjs dev --force    overwrite existing .enc

After it reports ok, verify before you delete anything:
  node scripts/stack-secret.mjs show dev/runtime/files/<name>
`

const main = () => {
    const args = process.argv.slice(2)
    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        console.log(HELP)
        return
    }
    const stack = args.find((arg) => !arg.startsWith("--"))
    if (!stack) {
        die("which stack?", ["example: node scripts/import-terraform-keys.mjs dev"])
    }
    const force = args.includes("--force")
    const dryRun = args.includes("--dry-run")

    if (!existsSync(TERRAFORM_ROOT)) {
        die(`nothing to import: ${TERRAFORM_ROOT} does not exist`, [
            "if the tree has already been retired, this script has done its job",
        ])
    }

    const sops = resolveCommand("sops")
    if (sops === null && !dryRun) {
        die("sops is not on PATH.", [
            "Windows:  winget install Mozilla.SOPS",
            "macOS:    brew install sops",
            "Linux:    https://github.com/getsops/sops/releases",
        ])
    }
    if (!existsSync(MASTER_KEY) && !dryRun) {
        die(`master identity not found at ${MASTER_KEY}`, [
            "restore it from your password manager, then re-run",
        ])
    }

    const filesDir = join(REPO_ROOT, ".stacks", stack, "runtime", "files")
    if (!dryRun) {
        mkdirSync(filesDir, { recursive: true })
    }

    console.log(cyan(`starci-academy-backend :: import-terraform-keys ${stack}`))
    if (dryRun) {
        console.log(dim("    --dry-run: nothing will be written\n"))
    }

    const imported = []
    const renamed = []
    const skipped = []
    const missing = []
    const failed = []
    /** Sources this table accounts for, to find anything it does not. */
    const claimed = new Set(IMPORT_SKIP)

    for (const credential of APP_CREDENTIALS) {
        if (credential.source === null) {
            // Recorded in the table for its env mapping; no file to move.
            continue
        }
        claimed.add(credential.source)
        const sourcePath = join(MOUNT_ROOT, ...credential.source.split("/"))
        if (!existsSync(sourcePath)) {
            missing.push(credential)
            continue
        }
        const encPath = join(filesDir, `${credential.file}.enc`)
        if (existsSync(encPath) && !force) {
            skipped.push(credential)
            continue
        }
        const bytes = statSync(sourcePath).size
        if (bytes === 0) {
            // sops cannot encrypt an empty file, and an empty credential is a
            // placeholder rather than a secret.
            missing.push(credential)
            continue
        }
        if (dryRun) {
            imported.push({ credential, bytes })
            if (credential.file !== credential.source.split("/").pop()) {
                renamed.push(credential)
            }
            continue
        }

        // The bytes never enter this process: copyFileSync is a filesystem copy,
        // and sops reads the copy off disk.
        const plainPath = join(filesDir, credential.file)
        copyFileSync(sourcePath, plainPath)
        try {
            const sopsArgs = ["--encrypt"]
            if (credential.format) {
                sopsArgs.push(
                    "--input-type", credential.format,
                    "--output-type", credential.format,
                )
            }
            // --output, never shell redirection: a redirect on Windows writes
            // CRLF and sops cannot parse its own metadata on the way back in.
            sopsArgs.push("--output", encPath, plainPath)
            const result = spawnSync(sops, sopsArgs, {
                cwd: REPO_ROOT,
                encoding: "utf8",
                env: { ...process.env, SOPS_AGE_KEY_FILE: MASTER_KEY },
            })
            if (result.status !== 0) {
                failed.push({
                    credential,
                    reason: (result.stderr || "").trim().split(/\r?\n/).slice(-2).join(" / "),
                })
                continue
            }
        } finally {
            // Whatever happened above, the plaintext copy does not survive it.
            rmSync(plainPath, { force: true })
        }
        imported.push({ credential, bytes })
        if (credential.file !== credential.source.split("/").pop()) {
            renamed.push(credential)
        }
    }

    // Anything on disk the table does not account for. These are the dangerous
    // ones: they would be lost the moment .mount/terraform is deleted.
    const unclaimed = walkTerraform().filter((file) => !claimed.has(file))

    if (imported.length > 0) {
        console.log(`\n${green("ok")}  ${dryRun ? "would import" : "imported"} ${imported.length} credential(s)`)
        for (const { credential, bytes } of imported) {
            const target = credential.env || dim("(no reader)")
            console.log(dim(`    ${credential.file.padEnd(32)} ${String(bytes).padStart(6)}b  ${target}`))
        }
    }
    if (renamed.length > 0) {
        console.log(`\n${yellow("note")} ${renamed.length} file(s) were renamed to the name config.ts reads:`)
        for (const credential of renamed) {
            console.log(dim(`    ${credential.source}  ->  ${credential.file}`))
        }
    }
    if (skipped.length > 0) {
        console.log(dim(`\n    skipped ${skipped.length} already-encrypted file(s) -- pass --force to replace`))
        for (const credential of skipped) {
            console.log(dim(`      ${credential.file}`))
        }
    }
    if (missing.length > 0) {
        console.log(dim(`\n    ${missing.length} declared credential(s) absent or empty on this machine:`))
        for (const credential of missing) {
            console.log(dim(`      ${credential.source} -> ${credential.file}`))
        }
    }
    if (IMPORT_SKIP.size > 0) {
        console.log(dim(`\n    ${IMPORT_SKIP.size} file(s) deliberately NOT imported:`))
        for (const file of IMPORT_SKIP) {
            console.log(dim(`      ${file}  (rebuilt by secret:gen from the minted keycloak admin pair)`))
        }
    }
    if (unclaimed.length > 0) {
        console.log(`\n${yellow("warn")} ${unclaimed.length} file(s) under .mount/terraform are in no table row:`)
        for (const file of unclaimed) {
            console.log(`      ${file}`)
        }
        console.log(dim("       They will be LOST when .mount/terraform is retired. Either add a row to"))
        console.log(dim("       scripts/credentials.mjs, or store them by hand:"))
        console.log(dim(`         node scripts/stack-secret.mjs set ${stack}/runtime/files/<name> --from-file .mount/<path>`))
    }
    if (failed.length > 0) {
        console.error(`\n${red("failed")} ${failed.length} credential(s) could not be encrypted:`)
        for (const { credential, reason } of failed) {
            console.error(`      ${credential.file}: ${reason}`)
        }
        console.error(dim("\n       The originals are untouched. Fix the error and re-run.\n"))
        process.exit(1)
    }

    console.log(dim("\n    .mount/terraform was NOT modified. Verify a twin before retiring it:"))
    console.log(dim(`      node scripts/stack-secret.mjs show ${stack}/runtime/files/<name>\n`))
}

main()
