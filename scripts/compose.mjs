#!/usr/bin/env node
/**
 * scripts/compose.mjs -- bring the whole local infrastructure up in one command.
 *
 *   npm run compose                     up -d, then wait for every healthcheck
 *   npm run compose -- down             stop, keep the volumes
 *   npm run compose -- down -v          stop and WIPE the data
 *   npm run compose -- ps               what is running
 *   npm run compose -- logs -f          follow the logs
 *   npm run compose -- --render-only    write .env.generated and stop
 *   npm run compose -- --stack vps      pick a different stack tree
 *
 * Anything else after `--` is handed to `docker compose` untouched, so this is
 * a wrapper, not a replacement. Compose-level flags work too, because they are
 * passed through ahead of the subcommand:
 *
 *   npm run compose -- -p starci-verify up -d
 *
 * Why a wrapper at all: the compose files publish `${STARCI_PORT_POSTGRES}`
 * rather than a literal. Source allocation resolves the projection recorded in
 * metadata.json; this script renders that projection into an env file and
 * points compose at it. Running `docker compose` by hand leaves it unset -- compose
 * then publishes on a port nobody can reach, and the app fails with
 * ECONNREFUSED against a stack that looks perfectly healthy.
 *
 * Node builtins only, no dependencies: this has to run before `npm ci`.
 */

import {
    existsSync, readFileSync, writeFileSync
} from "node:fs"
import {
    dirname, join, resolve
} from "node:path"
import {
    spawnSync
} from "node:child_process"
import {
    fileURLToPath, pathToFileURL
} from "node:url"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)),
    "..")

/**
 * Which stack to bring up. `dev` is the ten backing services a laptop needs.
 * `vps` and `k8s` are scaffolding today -- the flag exists so the shape is
 * already right when they gain compose trees of their own.
 *
 * The only thing that ever differs between stacks is where the credential
 * VALUES come from: a dev machine decrypts them into
 * `.stacks/<stack>/runtime/files`, while a server has them written out by its
 * deploy pipeline. STARCI_FILES_DIR overrides that directory.
 */
const STACK = (() => {
    const index = process.argv.indexOf("--stack")
    return index !== -1 ? (process.argv[index + 1] || "dev") : "dev"
})()

const COMPOSE_FILE = join(REPO_ROOT,
    ".stacks",
    STACK,
    "infra",
    "compose",
    "compose.yaml")
const ENV_FILE = join(REPO_ROOT,
    ".stacks",
    STACK,
    "infra",
    "compose",
    ".env.generated")
const FILES_DIR = process.env.STARCI_FILES_DIR || join(REPO_ROOT,
    ".stacks",
    STACK,
    "runtime",
    "files")
const METADATA = join(REPO_ROOT,
    "metadata.json")

/**
 * Every port name a compose fragment interpolates.
 *
 * Checked up front rather than discovered at `docker compose up`: an unset
 * variable makes compose publish something unusable instead of refusing, so a
 * missing entry in metadata.json would otherwise show up much later as a
 * connection error from the app.
 *
 * `core` is intentionally absent -- the Nest process runs on the host, so no
 * container publishes it. It is still read from metadata.json for the summary.
 */
const REQUIRED_PORTS = ["postgres",
    "redis",
    "elasticsearch",
    "qdrant",
    "qdrantGrpc",
    "kafka",
    "minio",
    "minioConsole",
    "nats",
    "natsMonitor",
    "keycloak",
    "cadvisor",
    "prometheus",
    "sonarqube"]

/**
 * The prefix every container name carries.
 *
 * It has to stay `starci-` in steady state: PrometheusMetricsService queries
 * cAdvisor with `name=~"starci-.+"` and strips exactly that prefix to land on
 * the component key the public health page shows. The override exists so this
 * stack can be brought up beside the old `.containers` one during migration,
 * where the health page is not what is being verified.
 */
const CONTAINER_PREFIX = process.env.STARCI_CONTAINER_PREFIX || "starci-"

/**
 * Absolute path to the docker executable.
 *
 * Resolved by hand so the child process can run with `shell: false`: passing an
 * argument array together with `shell: true` is deprecated (the arguments are
 * concatenated, not escaped), and the paths here contain the repo root, which
 * may well have a space in it.
 * @returns the full path, or null when docker is not on PATH.
 */
const dockerBinary = () => {
    const isWindows = process.platform === "win32"
    const dirs = (process.env.PATH || "").split(isWindows ? ";" : ":").filter(Boolean)
    const extensions = isWindows
        ? (process.env.PATHEXT || ".EXE;.CMD;.BAT").split(";").filter(Boolean)
        : [""]
    for (const dir of dirs) {
        for (const extension of extensions) {
            const candidate = join(dir,
                `docker${extension}`)
            if (existsSync(candidate)) {
                return candidate
            }
        }
    }
    return null
}

const DOCKER = dockerBinary()

const USE_COLOR = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR
const paint = (code, text) => USE_COLOR ? `\u001B[${code}m${text}\u001B[0m` : text
const cyan = (text) => paint("36",
    text)
const green = (text) => paint("32",
    text)
const red = (text) => paint("31",
    text)
const yellow = (text) => paint("33",
    text)
const dim = (text) => paint("2",
    text)

const die = (message, hints = []) => {
    console.error(`\n${red("compose:")} ${message}`)
    for (const hint of hints) {
        console.error(`  ${hint}`)
    }
    console.error("")
    process.exit(1)
}

/**
 * Loads the credential table.
 *
 * Imported dynamically so a missing table is a sentence rather than a stack
 * trace from the module loader before anything has printed.
 * @returns the CREDENTIALS array.
 */
const loadCredentials = async () => {
    const path = join(REPO_ROOT,
        "scripts",
        "credentials.mjs")
    if (!existsSync(path)) {
        die("scripts/credentials.mjs is missing.",
            ["It is the one table mapping a credential file to the variable each container reads."])
    }
    // pathToFileURL, not a hand-built `file://` string: on Windows the latter
    // yields `file://C:/...`, where `C:` is parsed as the URL HOST and the
    // import fails with ERR_UNSUPPORTED_ESM_URL_SCHEME.
    const module = await import(pathToFileURL(path).href)
    if (!Array.isArray(module.CREDENTIALS)) {
        die("scripts/credentials.mjs does not export a CREDENTIALS array.")
    }
    const serviceCredentials = module.SERVICE_CREDENTIALS ?? []
    if (!Array.isArray(serviceCredentials)) {
        die("scripts/credentials.mjs SERVICE_CREDENTIALS must be an array when present.")
    }
    return [...module.CREDENTIALS, ...serviceCredentials]
}

/** Reads and validates metadata.json. @returns the parsed object. */
const readMetadata = () => {
    if (!existsSync(METADATA)) {
        die("metadata.json is missing at the repo root.",
            ["It declares every service identity and its resolved ports projection."])
    }
    let metadata
    try {
        metadata = JSON.parse(readFileSync(METADATA,
            "utf8"))
    } catch (error) {
        die(`metadata.json is not valid JSON: ${error.message}`)
    }
    const ports = metadata.ports || {}
    const missing = REQUIRED_PORTS.filter((name) => typeof ports[name] !== "number")
    if (missing.length > 0) {
        die(`metadata.json is missing a numeric port for: ${missing.join(", ")}`,
            ["Every fragment under .stacks/<stack>/infra/compose interpolates one.",
                "Source allocation is validated separately by check-port-offsets.mjs."])
    }
    return metadata
}

/**
 * Renders the env file the compose fragments interpolate from.
 *
 * Ports come from metadata.json. Credentials come from the decrypted files
 * next to the stack. A row with `composeVar` writes its VALUE here because most
 * datastore images cannot consume a password file. A row with `composeMount`
 * is only verified; compose mounts that file directly, so its value never
 * enters this bridge. That asymmetry is held by the credential table rather
 * than re-declared in each service.
 *
 * The file itself is gitignored and holds nothing the encrypted stack did not
 * already hold.
 * @param credentials - the CREDENTIALS table.
 * @param metadata - the parsed metadata.json.
 * @param activeProfiles - compose profiles selected for this invocation.
 * @returns `{ ports, injected, missing }` for the summary and the up-front check.
 */
const renderEnvFile = (credentials, metadata, activeProfiles) => {
    const ports = metadata.ports
    const lines = ["# GENERATED by scripts/compose.mjs -- do not edit, do not commit.",
        "# Ports: resolved projection from metadata.json; allocation lives in .workspace/ports.json.",
        `# Credentials: ${FILES_DIR}`,
        ""]
    for (const [name, port] of Object.entries(ports)) {
        lines.push(`STARCI_PORT_${name.toUpperCase()}=${port}`)
    }
    lines.push("",
        `STARCI_CONTAINER_PREFIX=${CONTAINER_PREFIX}`)

    const injected = []
    const missing = []
    for (const credential of credentials) {
        if (Array.isArray(credential.composeProfiles)
            && !credential.composeProfiles.some((profile) => activeProfiles.has(profile))) {
            continue
        }
        if (!credential.composeVar && !credential.composeMount) {
            continue
        }
        const plainPath = join(FILES_DIR,
            credential.file)
        if (!existsSync(plainPath)) {
            missing.push(credential.file)
            continue
        }
        const value = readFileSync(plainPath,
            "utf8").trim()
        if (value === "") {
            missing.push(credential.file)
            continue
        }
        if (credential.composeVar) {
            lines.push(`${credential.composeVar}=${value}`)
            injected.push(credential.composeVar)
        } else {
            injected.push(`file:${credential.file}`)
        }
    }
    writeFileSync(ENV_FILE,
        `${lines.join("\n")}\n`,
        "utf8")
    return {
        ports, injected, missing
    }
}

/**
 * Compose-level flags that must be repeated on EVERY invocation, not just the
 * one the caller typed them on.
 *
 * `-p` is the case that matters: `npm run compose -- -p starci-verify up -d`
 * brings a second copy of the stack up under its own project, and the health
 * poll below then has to ask about THAT project. Without this the poll would
 * query the default project and report a stack that was never started.
 *
 * Filled in by main(), read by both spawn helpers.
 */
let composeFlags = []

/** Builds the argv shared by every docker compose call. */
const composeArgs = (args) => ["compose",
    "--env-file",
    ENV_FILE,
    "-f",
    COMPOSE_FILE,
    ...composeFlags,
    ...args]

/** Runs docker compose with the generated env file, inheriting the terminal. */
const runCompose = (args) => spawnSync(DOCKER,
    composeArgs(args),
    {
        cwd: REPO_ROOT, stdio: "inherit"
    })

/** Same, but captures stdout instead of printing it. */
const readCompose = (args) => spawnSync(DOCKER,
    composeArgs(args),
    {
        cwd: REPO_ROOT, encoding: "utf8"
    })

/** Blocks the main thread without pulling in a timer library. */
const sleep = (ms) => spawnSync(process.execPath,
    ["-e",
        `setTimeout(()=>{},${ms})`],
    { stdio: "ignore" })

/**
 * Waits until every long-running service is healthy.
 *
 * `docker compose up --wait` cannot be used here: it counts a one-shot service
 * as failed the moment it exits, so `minio-init` -- which exists precisely to
 * do one job and stop -- would turn a healthy stack into exit code 1. This
 * distinguishes the two: a container that exited 0 did its job, one that is
 * running must also report healthy if it declares a healthcheck, and a
 * container with no healthcheck (qdrant, kafka, nats, keycloak, cadvisor,
 * prometheus) only has to be running.
 * @param timeoutMs - give up after this long.
 * @returns `{ ok, pending }` where pending names whatever never came up.
 */
const waitForHealthy = (timeoutMs = 180_000) => {
    const deadline = Date.now() + timeoutMs
    let pending = []
    while (Date.now() < deadline) {
        const result = readCompose(["ps",
            "--format",
            "json"])
        if (result.status !== 0) {
            return {
                ok: false, pending: ["docker compose ps failed"]
            }
        }
        const rows = result.stdout.split(/\r?\n/).filter(Boolean).map((line) => {
            try {
                return JSON.parse(line)
            } catch {
                return null
            }
        }).filter(Boolean)
        if (rows.length === 0) {
            return {
                ok: false, pending: ["no containers started"]
            }
        }
        pending = rows.filter((row) => {
            const state = (row.State || "").toLowerCase()
            const health = (row.Health || "").toLowerCase()
            if (state === "exited") {
                // a one-shot that finished cleanly is a success, not a failure
                return row.ExitCode !== 0
            }
            if (state !== "running") {
                return true
            }
            return health !== "" && health !== "healthy"
        }).map((row) => row.Service || row.Name)
        if (pending.length === 0) {
            return {
                ok: true, pending: []
            }
        }
        // cheap spin: compose healthchecks tick on a 5s interval, and
        // elasticsearch takes the longest to go yellow
        sleep(2000)
    }
    return {
        ok: false, pending
    }
}

const HELP = `
  npm run compose                  up -d, then wait for healthchecks
  npm run compose -- down          stop, keep volumes
  npm run compose -- down -v       stop and wipe the data
  npm run compose -- ps            what is running
  npm run compose -- logs -f       follow logs
  npm run compose -- --render-only write .env.generated and stop
  npm run compose -- --stack <s>   use .stacks/<s>/infra/compose
  npm run compose -- -p <name> up  a second copy under its own project

  Anything else after -- goes straight to docker compose.
`

const main = async () => {
    // strip `--stack <name>`: it selects the compose file above, it is not a
    // docker compose flag and would be rejected if passed through
    const passthrough = (() => {
        const argv = process.argv.slice(2)
        const index = argv.indexOf("--stack")
        const rest = index === -1 ? argv : [...argv.slice(0, index),
            ...argv.slice(index + 2)]
        // npm swallows the first `--`; a direct `node scripts/compose.mjs -- down`
        // does not, and docker would then reject it as an unknown command
        return rest[0] === "--" ? rest.slice(1) : rest
    })()
    if (passthrough.includes("--help") || passthrough.includes("-h")) {
        console.log(HELP)
        return
    }

    // --render-only: write the env file and stop. Useful for CI, which renders
    // a server's compose env on the runner (where the credentials decrypt) and
    // ships the result, so the box needs neither node nor any knowledge of
    // where a credential comes from.
    const renderOnly = passthrough.includes("--render-only")

    // Lift compose-level flags out of the passthrough so they can be repeated
    // on the health poll as well as on the command the caller actually typed.
    // Profiles matter before rendering too: a public-only credential must not
    // block the local stack, but it must block `--profile public up`.
    const activeProfiles = new Set((process.env.COMPOSE_PROFILES || "")
        .split(",")
        .map((profile) => profile.trim())
        .filter(Boolean))
    const args = (() => {
        const rest = []
        const argv = passthrough.filter((argument) => argument !== "--render-only")
        for (let index = 0; index < argv.length; index += 1) {
            const argument = argv[index]
            if ((argument === "-p"
                || argument === "--project-name"
                || argument === "--profile") && argv[index + 1]) {
                composeFlags.push(argument,
                    argv[index + 1])
                if (argument === "--profile") {
                    activeProfiles.add(argv[index + 1])
                }
                index += 1
                continue
            }
            if (argument.startsWith("--profile=")) {
                composeFlags.push(argument)
                activeProfiles.add(argument.slice("--profile=".length))
                continue
            }
            rest.push(argument)
        }
        // no verb given -> the common case: bring everything up and wait
        return rest.length > 0 ? rest : ["up",
            "-d"]
    })()
    const isUp = args[0] === "up"

    if (!renderOnly && DOCKER === null) {
        die("docker is not on PATH.",
            ["Install Docker Desktop, then re-run npm run compose."])
    }
    if (!existsSync(COMPOSE_FILE)) {
        die(`compose file not found: ${COMPOSE_FILE}`,
            [`Stack "${STACK}" has no compose tree yet.`])
    }

    const credentials = await loadCredentials()
    const metadata = readMetadata()
    const {
        ports, injected, missing
    } = renderEnvFile(credentials,
        metadata,
        activeProfiles)

    if (renderOnly) {
        console.log(cyan(`rendered ${ENV_FILE}`))
        console.log(dim(`    ${Object.keys(ports).length} port(s), ${injected.length} credential(s) from ${FILES_DIR}`))
        if (missing.length > 0) {
            console.log(yellow(`    ${missing.length} credential file(s) missing: ${missing.join(", ")}`))
        }
        return
    }

    // Refuse to start a datastore on a placeholder. The fragments all carry a
    // `:-REPLACE_ME` default so `docker compose config` stays renderable, but
    // a postgres volume initialised with that placeholder bakes it in until
    // the volume is wiped -- a slow, confusing failure instead of a fast one.
    if (isUp && missing.length > 0) {
        die(`${missing.length} credential file(s) missing under ${FILES_DIR}`,
            [`missing: ${missing.join(", ")}`,
                "Mint them first:  npm run secret:gen -- dev",
                "Then decrypt the stack:  npm run sync"])
    }

    console.log(cyan(`starci-academy-backend :: infra (${STACK})`))
    console.log(dim(`    ${Object.entries(ports).filter(([name]) => name !== "core")
        .map(([name, port]) => `${name} ${port}`)
        .join("  ")}`))
    console.log("")

    const result = runCompose(args)
    if (result.status !== 0) {
        die(`docker compose exited ${result.status}`,
            ["Is Docker Desktop running?  docker info",
                `Retry by hand: docker compose --env-file ${ENV_FILE} -f ${COMPOSE_FILE} ${args.join(" ")}`])
    }
    if (isUp) {
        console.log(dim("\n    waiting for healthchecks..."))
        const {
            ok, pending
        } = waitForHealthy()
        if (!ok) {
            die(`these never became healthy: ${pending.join(", ")}`,
                [`inspect with: npm run compose -- logs ${pending[0] ?? ""}`.trim()])
        }
        console.log(`\n${green("ok")}  infra is up and healthy. The API expects :${ports.core ?? "?"}`)
        console.log(dim("    next: npm run start:dev\n"))
    }
}

main().catch((error) => die(error?.message ?? String(error)))
