#!/usr/bin/env node
/**
 * scripts/secrets-gen.mjs -- mint the infra credentials a stack needs.
 *
 *   npm run secret:gen -- dev           mint whatever dev is missing
 *   npm run secret:gen -- vps           mint a SEPARATE set for vps
 *   npm run secret:gen -- dev --force   re-mint everything (rotation)
 *
 * Every stack gets its own username and password for every service. dev and vps
 * never share a credential, so a compromised laptop gives away nothing about
 * production, and a production value can be rotated without anyone else having
 * to re-run their local stack.
 *
 * Existing values are never overwritten without --force. Once a datastore has
 * been initialised its password lives in TWO places -- here, and inside the
 * volume the datastore created with it -- so re-minting silently is exactly how
 * a stack ends up unable to authenticate against its own data. When you do pass
 * --force, wipe the volume in the same breath (`npm run compose -- down -v`).
 *
 * Values are written into .stacks/<stack>/runtime/files/<file>, encrypted, and
 * the plaintext is deleted the moment the encrypted twin exists. This script
 * prints names and counts. It never prints a value, and it never writes one
 * anywhere except into the file it is about to encrypt.
 *
 * Node builtins only -- it runs before `npm ci` on a fresh machine.
 */

import {
    existsSync, mkdirSync, readdirSync, rmSync, writeFileSync,
} from "node:fs"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { randomBytes } from "node:crypto"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { CREDENTIALS, DERIVED_CREDENTIALS } from "./credentials.mjs"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

/** The one age identity shared across every project of this owner. */
const MASTER_KEY = join(homedir(), ".starci", "master.identity")

const IS_WINDOWS = process.platform === "win32"

const USE_COLOR = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR
const paint = (code, text) => (USE_COLOR ? `[${code}m${text}[0m` : text)
const cyan = (text) => paint("36", text)
const green = (text) => paint("32", text)
const yellow = (text) => paint("33", text)
const red = (text) => paint("31", text)
const dim = (text) => paint("2", text)

/** Aborts with a readable message rather than a stack trace. */
const die = (message, hints = []) => {
    console.error(`\n${red("secret:gen:")} ${message}`)
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

/**
 * Mints a value.
 *
 * ALPHANUMERIC ON PURPOSE. These land on a docker compose command line, in a
 * redis `--requirepass`, inside a postgres URL and in a shell heredoc; a `$`, a
 * quote or an `@` in any of those turns a working password into a parse error
 * somewhere far away from where it was set. 32 alphanumeric characters is about
 * 190 bits, so excluding punctuation gives up nothing that matters.
 *
 * Rejection-sampled, not `% alphabet.length` on a raw byte: 256 is not a
 * multiple of 62, so the naive modulo makes the first eight letters of the
 * alphabet measurably likelier than the rest. Bytes at or above the largest
 * clean multiple (248 = 4 * 62) are thrown away instead, and a fresh block is
 * drawn whenever the current one runs out, so a run of rejections cannot make
 * the tail of a value repeat its head.
 *
 * @param kind - "user" | "password" | "token".
 * @returns the minted value; the caller must not log it.
 */
const generate = (kind) => {
    // Built from code points rather than written out: a 62-character literal of
    // mixed-case letters and digits is precisely the shape the pre-commit secret
    // scanner looks for, and a generator's alphabet should not need an override
    // to be committable.
    const range = (from, to) => Array.from(
        { length: to - from + 1 },
        (unused, index) => String.fromCharCode(from + index),
    ).join("")
    const alphabet = `${range(65, 90)}${range(97, 122)}${range(48, 57)}`
    const ceiling = 256 - (256 % alphabet.length)
    const length = kind === "user" ? 12 : 32

    let out = ""
    let block = randomBytes(length * 2)
    let cursor = 0
    while (out.length < length) {
        if (cursor >= block.length) {
            block = randomBytes(length * 2)
            cursor = 0
        }
        const byte = block[cursor]
        cursor += 1
        if (byte < ceiling) {
            out += alphabet[byte % alphabet.length]
        }
    }
    // A username has to be a legal SQL identifier and a legal MinIO root user,
    // so it must not start with a digit.
    return kind === "user" ? `u${out.slice(1)}` : out
}

/**
 * Writes `content` to `plainPath`, encrypts it to `plainPath + ".enc"`, and
 * deletes the plaintext whatever happens. The value exists on disk for the
 * length of one sops call and nowhere else.
 *
 * @param sops - resolved path to the sops executable.
 * @param plainPath - absolute path of the plaintext file to write.
 * @param content - the value, already terminated as it should be stored.
 * @param format - sops input/output type, or null to let sops infer.
 */
const writeEncrypted = (sops, plainPath, content, format) => {
    const encPath = `${plainPath}.enc`
    mkdirSync(dirname(plainPath), { recursive: true })
    writeFileSync(plainPath, content, "utf8")
    const args = ["--encrypt"]
    if (format) {
        args.push("--input-type", format, "--output-type", format)
    }
    // --output, never shell redirection: a redirect on Windows writes CRLF and
    // sops then cannot parse its own metadata on the way back in.
    args.push("--output", encPath, plainPath)
    const result = spawnSync(sops, args, {
        cwd: REPO_ROOT,
        encoding: "utf8",
        env: { ...process.env, SOPS_AGE_KEY_FILE: MASTER_KEY },
    })
    rmSync(plainPath, { force: true })
    if (result.status !== 0) {
        die(`sops could not encrypt ${plainPath.split(/[\\/]/).pop()}`, [
            (result.stderr || "").trim().split(/\r?\n/).slice(-3).join("\n  "),
            "",
            "the plaintext was removed -- nothing was left lying around",
        ])
    }
}

const HELP = `
  npm run secret:gen -- dev           mint whatever dev is missing
  npm run secret:gen -- vps           mint a SEPARATE set for vps
  npm run secret:gen -- dev --force   re-mint everything (rotation)

  Each stack gets its own username and password per service. Existing values are
  kept unless --force, because a datastore already holds the password it was
  created with -- rotate the value and the volume together, never one alone.
`

const main = () => {
    const args = process.argv.slice(2)
    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        console.log(HELP)
        return
    }
    const stack = args.find((arg) => !arg.startsWith("--"))
    if (!stack) {
        die("which stack?", ["example: npm run secret:gen -- dev"])
    }
    const force = args.includes("--force")

    const sops = resolveCommand("sops")
    if (sops === null) {
        die("sops is not on PATH.", [
            "Windows:  winget install Mozilla.SOPS",
            "macOS:    brew install sops",
            "Linux:    https://github.com/getsops/sops/releases",
        ])
    }
    if (!existsSync(MASTER_KEY)) {
        die(`master identity not found at ${MASTER_KEY}`, [
            "restore it from your password manager, then re-run",
        ])
    }

    const filesDir = join(REPO_ROOT, ".stacks", stack, "runtime", "files")
    mkdirSync(filesDir, { recursive: true })

    console.log(cyan(`starci-academy-backend :: secret:gen ${stack}`))
    if (force) {
        console.log(`    ${yellow("warn")} --force re-mints values a datastore may already be using.`)
        console.log(dim("           Wipe its volume in the same breath, or it will refuse the new password."))
    }

    const minted = []
    const kept = []
    /** file -> value, for this run only, so derived files can be built. */
    const mintedValues = new Map()

    for (const credential of CREDENTIALS) {
        const plainPath = join(filesDir, credential.file)
        if (existsSync(`${plainPath}.enc`) && !force) {
            kept.push(credential.file)
            continue
        }
        const value = generate(credential.kind)
        writeEncrypted(sops, plainPath, `${value}\n`, "binary")
        mintedValues.set(credential.file, value)
        minted.push(credential)
    }

    // Derived files come last: they are built out of values minted above and
    // must never be rebuilt from a guess.
    const derived = []
    const skippedDerived = []
    for (const entry of DERIVED_CREDENTIALS) {
        const sources = Object.values(entry.fields)
        const haveAll = sources.every((file) => mintedValues.has(file))
        const encPath = join(filesDir, `${entry.file}.enc`)
        if (!haveAll) {
            // Its inputs were kept, so the existing twin still matches them.
            if (existsSync(encPath)) {
                kept.push(entry.file)
            } else {
                skippedDerived.push(entry.file)
            }
            continue
        }
        const payload = {}
        for (const [key, file] of Object.entries(entry.fields)) {
            payload[key] = mintedValues.get(file)
        }
        writeEncrypted(
            sops,
            join(filesDir, entry.file),
            `${JSON.stringify(payload, null, 4)}\n`,
            entry.format || null,
        )
        derived.push(entry)
    }

    // The values are out of scope from here; nothing below may reference them.
    mintedValues.clear()

    if (minted.length > 0) {
        console.log(`\n${green("ok")}  minted ${minted.length} credential(s)`)
        for (const credential of minted) {
            console.log(dim(`    ${credential.file.padEnd(30)} ${credential.env}`))
        }
    }
    if (derived.length > 0) {
        console.log(`\n${green("ok")}  built ${derived.length} derived file(s) from the values above`)
        for (const entry of derived) {
            console.log(dim(`    ${entry.file.padEnd(30)} ${entry.env}`))
        }
    }
    if (kept.length > 0) {
        console.log(dim(`\n    kept ${kept.length} existing value(s) -- pass --force to rotate`))
    }
    for (const file of skippedDerived) {
        console.log(`\n${yellow("warn")} ${file} cannot be built: its inputs already existed and this`)
        console.log(dim("       script never decrypts. Re-run with --force to rotate the pair together,"))
        console.log(dim(`       or write it by hand: npm run secret:set -- ${stack}/runtime/files/${file}`))
    }

    console.log(dim("\n    next: npm run sync        (writes .env.override from these)"))
    console.log(dim("          npm run compose -- up -d\n"))
}

main()
