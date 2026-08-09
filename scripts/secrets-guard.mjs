#!/usr/bin/env node
/**
 * scripts/secrets-guard.mjs -- commit-time gate for the .stacks/ secret tree.
 *
 * Run from .husky/pre-commit, BEFORE lint-staged. It looks only at the STAGED
 * changes and either blocks the commit (exit 1) or fixes the problem itself
 * (exit 0).
 *
 * What it does, in order:
 *   1. BLOCK when a plaintext value file under .stacks/ is staged. Only
 *      .gitkeep, KEYS.md, README.md, the compose fragments under infra/compose
 *      and the sops *.enc twins may ever be committed from that tree.
 *   2. BLOCK when an environment file that is meant to be generated is staged
 *      (.env.override, .env.generated). Both are rendered from the stack tree on
 *      every sync; committing one puts live values back into the history the
 *      migration just took them out of.
 *   3. RE-ENCRYPT every plaintext under .stacks/dev whose *.enc twin is missing
 *      or no longer matches it, then `git add` the twin -- the ciphertext is
 *      never allowed to drift behind the plaintext.
 *   4. BLOCK when a staged *.enc does not carry the "ENC[" marker, which means
 *      an encrypted file was overwritten with plaintext.
 *   5. BLOCK when the staged diff outside .stacks/ contains obvious secret
 *      material (private keys, provider tokens, long base64/hex blobs).
 *
 * Escape hatch for step 5 only: ALLOW_SECRET_SCAN=1 git commit ...
 * Steps 1-4 have no escape hatch on purpose.
 *
 * Node builtins only, no dependencies, works on Windows and POSIX.
 */

import { execFileSync } from "node:child_process"
import {
    existsSync, readdirSync, readFileSync, statSync, writeFileSync,
} from "node:fs"
import { homedir } from "node:os"
import path from "node:path"

/** Where the shared age master key lives on every machine of the owner. */
const MASTER_KEY = path.join(homedir(), ".starci", "master.identity")

/**
 * The only stack that keeps values on disk; vps and k8s are scaffolds. The whole
 * subtree is guarded, not just runtime/env: runtime/files holds the whole-file
 * third-party keys and infra/ holds what stands the containers up.
 */
const STACK_DEV_DIR = ".stacks/dev"

/**
 * Basenames that may be committed from inside .stacks/ regardless of where they
 * sit. Must stay in step with the negations in .gitignore, which re-include
 * exactly these plus the *.enc twins.
 */
const ALLOWED_STACK_FILES = new Set([".gitkeep", "KEYS.md", "README.md"])

/**
 * Paths inside .stacks/ that are committed as plaintext ON PURPOSE. The compose
 * fragments and the prometheus scrape config are infrastructure description, not
 * secrets: every credential in them is an interpolation, never a literal.
 */
const ALLOWED_STACK_PATHS = [
    /^\.stacks\/[^/]+\/infra\/compose\/[^/]+\.ya?ml$/,
    /^\.stacks\/[^/]+\/infra\/compose\/prometheus\/[^/]+\.ya?ml$/,
]

/**
 * Paths inside .stacks/ that are LOCAL ONLY: never committed, and never
 * encrypted either. `runtime/config/seed.yaml` is the per-machine seeding
 * switchboard -- it is state, not a credential, and giving it an encrypted twin
 * would push one machine's choices onto everybody else's.
 */
const LOCAL_ONLY_STACK_PATHS = [
    /^\.stacks\/[^/]+\/runtime\/config\//,
]

/**
 * Environment files that are RENDERED, never authored. `.env.override` is the
 * file `npm run sync` writes from the decrypted stack; `.env.generated` is what
 * compose is handed. Both hold live values, and .env.override is committed in
 * the history TODAY -- this rule is what stops it coming back.
 */
const GENERATED_ENV_FILES = new Set([".env.override", ".env.generated"])

/** Files whose content is noisy enough to skip the generic blob heuristics. */
const NOISY_PATHS = [
    /(^|\/)package-lock\.json$/,
    /(^|\/)pnpm-lock\.yaml$/,
    /(^|\/)yarn\.lock$/,
    /(^|\/)dist\//,
    /(^|\/)node_modules\//,
    /(^|\/)\.artifacts\//,
    /\.min\.(js|css)$/,
    /\.map$/,
    /\.(png|jpe?g|gif|webp|ico|svg|pdf|zip|tar|gz|woff2?|ttf|otf|mp3|mp4|wasm)$/i,
]

/**
 * Secret shapes we refuse to let through. `generic` patterns are heuristics and
 * are only applied to files that are not on the noisy list. The named ones are
 * the providers this repo actually holds credentials for -- see
 * scripts/credentials.mjs.
 */
const SECRET_PATTERNS = [
    {
        name: "PEM private key block",
        re: /-----BEGIN (?:OPENSSH|RSA|DSA|EC|PGP|ENCRYPTED )?\s?PRIVATE KEY(?: BLOCK)?-----/,
        generic: false,
    },
    {
        name: "age secret key",
        re: /AGE-SECRET-KEY-1[0-9A-Z]{20,}/,
        generic: false,
    },
    {
        name: "sk- style API key",
        re: /\bsk-(?:ant-|proj-|or-|live-|test-)?[A-Za-z0-9_-]{20,}/,
        generic: false,
    },
    {
        name: "Stripe secret/restricted key",
        re: /\b[sr]k_(?:live|test)_[A-Za-z0-9]{20,}/,
        generic: false,
    },
    {
        name: "Stripe webhook signing secret",
        re: /\bwhsec_[A-Za-z0-9]{20,}/,
        generic: false,
    },
    {
        name: "Brevo API key",
        re: /\bxkeysib-[A-Za-z0-9-]{20,}/,
        generic: false,
    },
    {
        name: "GitHub token",
        re: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/,
        generic: false,
    },
    {
        name: "Slack token",
        re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
        generic: false,
    },
    {
        name: "AWS access key id",
        re: /\bAKIA[0-9A-Z]{16}\b/,
        generic: false,
    },
    {
        name: "Google API key",
        re: /\bAIza[0-9A-Za-z_-]{35}\b/,
        generic: false,
    },
    {
        name: "long base64 blob",
        re: /(?<![A-Za-z0-9+/=])(?=[A-Za-z0-9+/]*[A-Z])(?=[A-Za-z0-9+/]*[a-z])(?=[A-Za-z0-9+/]*[0-9])[A-Za-z0-9+/]{60,}={0,2}(?![A-Za-z0-9+/=])/,
        generic: true,
    },
    {
        name: "long hex blob",
        re: /(?<![0-9a-fA-F])[0-9a-fA-F]{64,}(?![0-9a-fA-F])/,
        generic: true,
    },
]

const problems = []
const notes = []

/** Repo root, so the hook behaves the same from any subdirectory. */
const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
}).trim()

/**
 * Runs a git command inside the repo. Returns stdout as utf8 and throws on a
 * non-zero exit.
 */
const git = (args) => execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
})

/** Never echo a secret: keep the first few characters and the length only. */
const redact = (value) => `${value.slice(0, 4)}...[${value.length} chars]`

/** True when a path should be skipped by the generic blob heuristics. */
const isNoisy = (file) => NOISY_PATHS.some((re) => re.test(file))

/** True when this path inside .stacks/ is committed as plaintext on purpose. */
const isAllowedInStacks = (file) => ALLOWED_STACK_FILES.has(path.posix.basename(file))
    || ALLOWED_STACK_PATHS.some((re) => re.test(file))

// ---------------------------------------------------------------------------
// staged file list
// ---------------------------------------------------------------------------

/**
 * Paths added/copied/modified/renamed in the index. Deletions are irrelevant to
 * a guard trying to stop material from entering the history.
 */
const stagedFiles = () => git([
    "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z",
]).split("\0").filter(Boolean)

const staged = stagedFiles()

// ---------------------------------------------------------------------------
// 1. plaintext value files under .stacks/ must never be staged
// ---------------------------------------------------------------------------

const plaintextStacked = staged.filter((file) => {
    if (!file.startsWith(".stacks/")) {
        return false
    }
    if (file.endsWith(".enc")) {
        return false
    }
    // A rendered env file inside the stack tree is never committable, whatever
    // the allow rules above would otherwise say about its directory.
    if (GENERATED_ENV_FILES.has(path.posix.basename(file))) {
        return true
    }
    return !isAllowedInStacks(file)
})

if (plaintextStacked.length > 0) {
    problems.push([
        "Plaintext secret file(s) staged under .stacks/:",
        ...plaintextStacked.map((file) => `  - ${file}`),
        "",
        "  Only .gitkeep, KEYS.md, README.md, the infra/compose fragments and the",
        "  sops *.enc twins belong in git.",
        "  Fix: git restore --staged <path>   (the .enc twin is committed instead)",
    ].join("\n"))
}

// ---------------------------------------------------------------------------
// 2. generated env files must never be staged, anywhere
// ---------------------------------------------------------------------------

const stagedGenerated = staged.filter(
    (file) => GENERATED_ENV_FILES.has(path.posix.basename(file)),
)

if (stagedGenerated.length > 0) {
    problems.push([
        "Generated environment file(s) staged:",
        ...stagedGenerated.map((file) => `  - ${file}`),
        "",
        "  These are rendered from .stacks/ on every `npm run sync` and hold live",
        "  values. Committing one is what this migration exists to undo.",
        "  Fix: git rm --cached <path>   (it is gitignored; your working copy stays)",
    ].join("\n"))
}

// ---------------------------------------------------------------------------
// 3. keep every dev plaintext and its *.enc twin in step
// ---------------------------------------------------------------------------

/** `true` when the sops binary answers on this machine. */
const hasSops = () => {
    try {
        execFileSync("sops", ["--version"], { stdio: "ignore" })
        return true
    } catch {
        return false
    }
}

// NOTE: this hook deliberately does NOT pass `--age` to sops.
//
// `--age` on the command line OVERRIDES the creation_rules in .sops.yaml, and it
// can only name one recipient here -- the master identity. That is fine while
// every file has exactly one recipient, and silently wrong the moment a path is
// meant to have two (a deploy stack encrypted for the master identity *and* a CI
// identity, so CI can decrypt without holding the master key).
//
// The failure mode is the dangerous kind: the commit succeeds, the file looks
// encrypted, and the missing recipient is only discovered when a deploy tries to
// decrypt it. Letting .sops.yaml decide keeps the recipient list in one place.

/**
 * The sops format for a plaintext file. Whole-file credentials are opaque and
 * must be binary, or sops tries to parse an API key as JSON and fails.
 * @returns "dotenv" | "json" | "yaml" | "binary"
 */
const formatFor = (file) => {
    if (file.endsWith(".env")) {
        return "dotenv"
    }
    // Never let sops infer: the file it is handed ends in `.enc`, so inference
    // falls back to binary and a JSON secret fails with "No binary data found in
    // tree" even though it encrypted perfectly well.
    if (/\.json$/.test(file)) {
        return "json"
    }
    if (/\.ya?ml$/.test(file)) {
        return "yaml"
    }
    return "binary"
}

/**
 * Reduces a file to what actually carries meaning, so a re-encrypt only happens
 * on a real change. Two things would otherwise differ forever: line endings (an
 * editor on Windows leaves CRLF, sops always emits LF) and blank lines (sops
 * drops them from dotenv files on the round trip). Blank lines are only stripped
 * for dotenv; in a key or a certificate the exact bytes matter.
 * @param text - file contents.
 * @param format - the sops format of the file.
 */
const normaliseForCompare = (text, format) => {
    const unified = text.replace(/\r\n/g, "\n").replace(/\n+$/, "")
    return format === "dotenv"
        ? unified.split("\n").filter((line) => line.trim() !== "").join("\n")
        : unified
}

/**
 * Decrypts an encrypted twin and returns its plaintext, or null when it cannot
 * be read (missing key, corrupt file). null forces a re-encrypt, which is the
 * safe direction: worst case a file is rewritten that did not need it.
 * @param encPath - absolute path to the `*.enc` file.
 */
const decryptToString = (encPath) => {
    const format = formatFor(encPath.replace(/\.enc$/, ""))
    const args = ["--decrypt"]
    if (format) {
        args.push("--input-type", format, "--output-type", format)
    }
    args.push(encPath)
    try {
        return execFileSync("sops", args, {
            cwd: repoRoot,
            encoding: "utf8",
            maxBuffer: 32 * 1024 * 1024,
            env: { ...process.env, SOPS_AGE_KEY_FILE: MASTER_KEY },
        })
    } catch {
        return null
    }
}

/**
 * Every plaintext secret under .stacks/dev whose encrypted twin is missing or no
 * longer matches it. Walks recursively; the committed-plaintext paths and the
 * rendered env files are never candidates.
 * @returns repo-relative paths with forward slashes.
 */
const stalePlaintextFiles = () => {
    const root = path.join(repoRoot, STACK_DEV_DIR)
    if (!existsSync(root)) {
        return []
    }
    const out = []
    const walk = (dir) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                walk(full)
                continue
            }
            if (entry.name.endsWith(".enc")) {
                continue
            }
            const rel = path.relative(repoRoot, full).split(path.sep).join("/")
            // Infrastructure description and rosters are committed as they are.
            if (isAllowedInStacks(rel)) {
                continue
            }
            // Per-machine state: not committed, not encrypted either.
            if (LOCAL_ONLY_STACK_PATHS.some((re) => re.test(rel))) {
                continue
            }
            // The rendered compose env is regenerated on every run and must
            // never grow an encrypted twin that someone later trusts.
            if (GENERATED_ENV_FILES.has(entry.name)) {
                continue
            }
            // An empty file is a placeholder, not a secret. `npm run sync`
            // creates one for every mount path config.ts declares so the app
            // does not ENOENT at boot; encrypting them would commit dozens of
            // .enc files that protect nothing and hide which credentials are
            // genuinely set. sops also cannot encrypt an empty .json at all.
            if (statSync(full).size === 0) {
                continue
            }
            const enc = `${full}.enc`
            if (!existsSync(enc)) {
                out.push(rel)
                continue
            }
            // Compare CONTENT, not mtime. `npm run sync` decrypts on every dev
            // start, so the plaintext is always newer than its twin; an mtime
            // test would re-encrypt every file on every commit, and since each
            // encryption draws a fresh nonce that rewrites all of them in the
            // diff -- destroying the readable history sops was chosen for.
            const format = formatFor(rel)
            const decrypted = decryptToString(enc)
            if (decrypted === null
                || normaliseForCompare(decrypted, format)
                    !== normaliseForCompare(readFileSync(full, "utf8"), format)) {
                out.push(rel)
            }
        }
    }
    walk(root)
    return out.sort()
}

const stale = stalePlaintextFiles()

if (stale.length > 0) {
    if (!hasSops()) {
        problems.push([
            "sops is required to re-encrypt these files but is not on PATH:",
            ...stale.map((file) => `  - ${file}`),
            "",
            "  Install it:  winget install Mozilla.SOPS      (Windows)",
            "               brew install sops                (macOS)",
            "               https://github.com/getsops/sops/releases",
        ].join("\n"))
    } else if (!existsSync(MASTER_KEY)) {
        problems.push([
            `Master age key not found at ${MASTER_KEY}`,
            "",
            "  Restore it from your password manager before committing secrets.",
        ].join("\n"))
    } else {
        for (const file of stale) {
            const plain = path.join(repoRoot, file)
            const enc = `${plain}.enc`
            const format = formatFor(file)
            // Normalise the plaintext to LF first. A Windows editor saves CRLF,
            // and sops' dotenv parser rejects it outright ("invalid dotenv input
            // line:"), so the commit would fail for a reason that has nothing to
            // do with what was edited. Rewriting in place also stops the file
            // drifting back to CRLF on the next save.
            if (format === "dotenv") {
                const raw = readFileSync(plain, "utf8")
                if (raw.includes("\r\n")) {
                    writeFileSync(plain, raw.replace(/\r\n/g, "\n"))
                    notes.push(`normalised ${file} to LF (sops cannot parse CRLF)`)
                }
            }
            // --output, never captured stdout: it keeps sops in charge of the
            // bytes it writes, which is what every other script here does too.
            const args = ["--encrypt"]
            if (format) {
                args.push("--input-type", format, "--output-type", format)
            }
            args.push("--output", enc, plain)
            try {
                execFileSync("sops", args, {
                    cwd: repoRoot,
                    encoding: "utf8",
                    maxBuffer: 32 * 1024 * 1024,
                    env: { ...process.env, SOPS_AGE_KEY_FILE: MASTER_KEY },
                })
                git(["add", "--", `${file}.enc`])
                notes.push(`re-encrypted and staged ${file}.enc`)
            } catch {
                problems.push([
                    `sops failed to encrypt ${file}`,
                    "",
                    "  Check that the master key is readable and that a recipient is",
                    "  resolvable (a `# public key:` line in the key file, or .sops.yaml).",
                ].join("\n"))
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 4. a staged *.enc must actually be encrypted
// ---------------------------------------------------------------------------

/** Re-read the staged list: step 3 may have added freshly encrypted twins. */
const encFiles = stagedFiles().filter((file) => file.endsWith(".enc"))

for (const file of encFiles) {
    let content = ""
    try {
        content = git(["show", `:${file}`])
    } catch {
        continue
    }
    if (!content.includes("ENC[")) {
        problems.push([
            `Staged file looks like plaintext but is named as encrypted: ${file}`,
            "",
            "  A sops file always contains ENC[AES256_GCM,...] values.",
            "  Fix: re-run the encryption, or unstage the file.",
        ].join("\n"))
    }
}

// ---------------------------------------------------------------------------
// 5. scan the staged diff outside .stacks/ for loose secret material
// ---------------------------------------------------------------------------

/**
 * Added lines of the staged diff, grouped per file. `.stacks/` is excluded --
 * its encrypted payloads are base64 by design and steps 1-4 already police it.
 */
const stagedAddedLines = () => {
    const diff = git([
        "diff", "--cached", "--no-color", "--unified=0", "--", ".", ":(exclude).stacks",
    ])
    const perFile = new Map()
    let current = null
    for (const line of diff.split(/\r?\n/)) {
        if (line.startsWith("+++ ")) {
            const target = line.slice(4).trim()
            current = target === "/dev/null" ? null : target.replace(/^b\//, "")
            if (current && !perFile.has(current)) {
                perFile.set(current, [])
            }
            continue
        }
        if (!current) {
            continue
        }
        if (line.startsWith("+") && !line.startsWith("+++")) {
            perFile.get(current).push(line.slice(1))
        }
    }
    return perFile
}

if (process.env.ALLOW_SECRET_SCAN === "1") {
    notes.push("secret scan skipped (ALLOW_SECRET_SCAN=1)")
} else {
    const hits = []
    for (const [file, lines] of stagedAddedLines()) {
        const noisy = isNoisy(file)
        for (const line of lines) {
            for (const pattern of SECRET_PATTERNS) {
                if (pattern.generic && noisy) {
                    continue
                }
                const match = line.match(pattern.re)
                if (match) {
                    hits.push(`  - ${file}: ${pattern.name} -> ${redact(match[0])}`)
                    break
                }
            }
        }
    }
    if (hits.length > 0) {
        problems.push([
            "Possible secret material in the staged diff:",
            ...hits,
            "",
            "  Move the value into the stack tree -- it is gitignored there and",
            "  committed only as its sops *.enc twin:",
            "    node scripts/stack-secret.mjs set dev/runtime/files/<name>",
            "  If this really is not a secret, commit once with:",
            "    ALLOW_SECRET_SCAN=1 git commit ...",
        ].join("\n"))
    }
}

// ---------------------------------------------------------------------------
// verdict
// ---------------------------------------------------------------------------

for (const note of notes) {
    console.log(`secrets-guard: ${note}`)
}

if (problems.length === 0) {
    process.exit(0)
}

console.error("")
console.error("secrets-guard: commit blocked")
console.error("")
for (const problem of problems) {
    console.error(problem)
    console.error("")
}
process.exit(1)
