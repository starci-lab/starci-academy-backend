/**
 * Push modules 9–16 lesson repos to GitHub. Requires GITHUB_TOKEN env.
 */
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(__dirname, "..", ".repo")
const OWNER = "StarCi-Academy"

const MODULES = [
    {
        dir: "system-design-mastery-module-9-high-throughput-notification-system",
        github: "system-design-mastery-module-9-high-throughput-notification-system",
        msg: "chore: sync notification system labs",
    },
    {
        dir: "system-design-mastery-module-10-kafka-streaming-and-reliability",
        github: "system-design-mastery-module-10-kafka-streaming-and-reliability",
        createIfMissing: true,
        msg: "feat: Kafka log messaging, ordering, reliability labs",
    },
    {
        dir: "system-design-mastery-module-11-news-feed-fanout-and-caching",
        github: "system-design-mastery-module-11-news-feed-fanout-and-caching",
        altGithub: ["system-design-mastery-module-11-social-media-feed-news-feed-system"],
        msg: "feat: news feed push/pull fanout and Redis caching labs",
    },
    {
        dir: "system-design-mastery-module-12-large-scale-video-streaming-platform",
        github: "system-design-mastery-module-12-large-scale-video-streaming-platform",
        msg: "feat: video ingestion, HLS/DASH, CDN edge labs",
    },
    {
        dir: "system-design-mastery-module-13-flash-sale-at-scale",
        github: "system-design-mastery-module-13-flash-sale-at-scale",
        altGithub: ["system-design-mastery-module-13-ecommerce-flash-sale-system"],
        msg: "feat: flash sale inventory, waiting room, idempotent checkout",
    },
    {
        dir: "system-design-mastery-module-14-geospatial-indexing-realtime-matching-and-surge-pricing",
        github: "system-design-mastery-module-14-geospatial-indexing-realtime-matching-and-surge-pricing",
        msg: "feat: H3, Redis Geo, surge matching labs",
    },
    {
        dir: "system-design-mastery-module-15-distributed-search-and-autocomplete",
        github: "system-design-mastery-module-15-distributed-search-and-autocomplete",
        altGithub: [
            "system-design-mastery-module-15-distributed-search-autocomplete-system",
            "system-design-mastery-module-15-14-distributed-search-autocomplete-system",
        ],
        msg: "feat: Trie/Redis, CDC, distributed search labs",
    },
    {
        dir: "system-design-mastery-module-16-highly-available-distributed-key-value-store",
        github: "system-design-mastery-module-16-highly-available-distributed-key-value-store",
        altGithub: [
            "system-design-mastery-module-16-15-highly-available-distributed-key-value-store",
        ],
        msg: "feat: Redis Cluster, DynamoDB, Cassandra KV labs",
    },
]

const token = process.env.GITHUB_TOKEN
if (!token) {
    console.error("Set GITHUB_TOKEN")
    process.exit(1)
}

const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

async function repoExists(name) {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${name}`, { headers })
    return res.status === 200
}

async function resolveGithubName(candidates) {
    for (const name of candidates) {
        if (await repoExists(name)) return name
    }
    return candidates[0]
}

async function createRepo(name) {
    const res = await fetch(`https://api.github.com/orgs/${OWNER}/repos`, {
        method: "POST",
        headers: {
            ...headers,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name,
            private: true,
            description: `StarCi System Design Mastery — ${name}`,
            auto_init: false,
        }),
    })
    if (res.status === 201 || res.status === 200) {
        console.log(`Created repo ${name}`)
        return true
    }
    const body = await res.json()
    if (body.message?.includes("already exists")) return true
    console.error("Create failed:", res.status, body.message ?? body)
    return false
}

function run(cmd, cwd) {
    execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, GITHUB_TOKEN: token } })
}

function ensureGitignoresRecursive(root) {
    const writeGi = (d) => {
        const p = path.join(d, ".gitignore")
        const chunk = "node_modules/\ndist/\n"
        if (!fs.existsSync(p)) fs.writeFileSync(p, chunk, "utf8")
        else if (!fs.readFileSync(p, "utf8").includes("node_modules")) {
            fs.appendFileSync(p, `\n${chunk}`, "utf8")
        }
    }
    writeGi(root)
    for (const e of fs.readdirSync(root, { withFileTypes: true })) {
        if (!e.isDirectory() || e.name.startsWith(".")) continue
        const lp = path.join(root, e.name)
        writeGi(lp)
        for (const s of fs.readdirSync(lp, { withFileTypes: true })) {
            if (s.isDirectory() && !s.name.startsWith(".")) writeGi(path.join(lp, s.name))
        }
    }
}

function pushRepo(localDir, githubName, commitMsg) {
    const cwd = path.join(REPO_ROOT, localDir)
    if (!fs.existsSync(cwd)) {
        console.log(`SKIP missing: ${localDir}`)
        return
    }

    ensureGitignoresRecursive(cwd)

    const base = `https://x-access-token:${token}@github.com/${OWNER}/${githubName}.git`
    const clean = `https://github.com/${OWNER}/${githubName}.git`

    if (!fs.existsSync(path.join(cwd, ".git"))) {
        console.log(`INIT ${githubName}`)
        run("git init -b main", cwd)
    }

    try {
        execSync("git remote remove origin", { cwd, stdio: "ignore" })
    } catch { /* no origin */ }
    try {
        run(`git remote add origin "${clean}"`, cwd)
    } catch {
        run(`git remote set-url origin "${clean}"`, cwd)
    }

    run("git add -A", cwd)
    const status = execSync("git status --porcelain", { cwd, encoding: "utf8" })
    if (status.trim()) {
        run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, cwd)
    } else {
        console.log(`No changes: ${githubName}`)
    }

    try {
        run(`git push ${base} main`, cwd)
        console.log(`OK push ${githubName}`)
    } catch {
        console.log(`FORCE push ${githubName}`)
        run(`git fetch ${base} main`, cwd)
        run(`git push ${base} main --force`, cwd)
        console.log(`OK force ${githubName}`)
    }
}

for (const mod of MODULES) {
    if (mod.skip) {
        console.log(`SKIP ${mod.dir} (already pushed)`)
        continue
    }
    const names = [mod.github, ...(mod.altGithub ?? [])]
    let github = await resolveGithubName(names)
    if (!(await repoExists(github)) && mod.createIfMissing) {
        await createRepo(mod.github)
        github = mod.github
    }
    console.log(`\n=== ${mod.dir} -> ${github} ===`)
    pushRepo(mod.dir, github, mod.msg)
}

console.log("\nDone modules 9-16 push.")
