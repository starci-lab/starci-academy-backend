/**
 * Push System Design modules 1–15 to GitHub. Requires GITHUB_TOKEN.
 */
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(__dirname, "..", ".repo")
const OWNER = "StarCi-Academy"

/** @type {Array<{dir:string,github?:string,altGithub?:string[],createIfMissing?:boolean,msg:string}>} */
const MODULES = [
    { dir: "system-design-mastery-module-1-fundamentals-of-system-design", msg: "chore: sync module 1 fundamentals labs" },
    { dir: "system-design-mastery-module-2-microservices-kubernetes-fundamentals", msg: "chore: sync module 2 microservices k8s labs" },
    { dir: "system-design-mastery-module-3-communication-patterns", msg: "chore: sync module 3 communication patterns labs" },
    { dir: "system-design-mastery-module-4-data-and-consistency-in-microservices", msg: "chore: sync module 4 data consistency labs" },
    {
        dir: "system-design-mastery-module-5-scalability-and-performance",
        github: "system-design-mastery-module-7-scalability-and-performance",
        altGithub: ["system-design-mastery-module-5-scalability-and-performance"],
        msg: "chore: sync module 5 scalability and performance labs",
    },
    { dir: "system-design-mastery-module-6-reliability-and-resilience-patterns", msg: "chore: sync module 6 reliability labs" },
    {
        dir: "system-design-mastery-module-7-monitoring-and-observability",
        github: "system-design-mastery-module-5-monitoring-and-observability",
        altGithub: ["system-design-mastery-module-7-monitoring-and-observability"],
        msg: "chore: sync module 7 monitoring and observability labs",
    },
    { dir: "system-design-mastery-module-8-security-and-identity-management", msg: "chore: sync module 8 security labs" },
    { dir: "system-design-mastery-module-9-high-throughput-notification-system", msg: "chore: sync module 9 notification labs" },
    {
        dir: "system-design-mastery-module-10-kafka-streaming-and-reliability",
        createIfMissing: true,
        msg: "feat: module 10 Kafka streaming labs",
    },
    {
        dir: "system-design-mastery-module-11-news-feed-fanout-and-caching",
        github: "system-design-mastery-module-11-news-feed-fanout-and-caching",
        altGithub: ["system-design-mastery-module-11-social-media-feed-news-feed-system"],
        msg: "feat: module 11 news feed fanout and caching labs",
    },
    { dir: "system-design-mastery-module-12-large-scale-video-streaming-platform", msg: "feat: module 12 video streaming labs" },
    {
        dir: "system-design-mastery-module-13-flash-sale-at-scale",
        github: "system-design-mastery-module-13-flash-sale-at-scale",
        altGithub: ["system-design-mastery-module-13-ecommerce-flash-sale-system"],
        msg: "feat: module 13 flash sale labs",
    },
    {
        dir: "system-design-mastery-module-14-geospatial-indexing-realtime-matching-and-surge-pricing",
        msg: "feat: module 14 H3 Redis Geo surge labs",
    },
    {
        dir: "system-design-mastery-module-15-distributed-search-and-autocomplete",
        github: "system-design-mastery-module-15-distributed-search-and-autocomplete",
        altGithub: ["system-design-mastery-module-15-distributed-search-autocomplete-system"],
        msg: "feat: module 15 search autocomplete labs",
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
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            private: true,
            description: `StarCi System Design Mastery — ${name}`,
            auto_init: false,
        }),
    })
    if (res.status === 201) {
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

function ensureGitignore(cwd) {
    const gitignore = path.join(cwd, ".gitignore")
    const line = "node_modules/"
    if (!fs.existsSync(gitignore)) {
        fs.writeFileSync(gitignore, `${line}\ndist/\n.env.local\n`, "utf8")
        return
    }
    const text = fs.readFileSync(gitignore, "utf8")
    if (!text.includes("node_modules")) {
        fs.appendFileSync(gitignore, `\n${line}\n`, "utf8")
    }
}

function ensureGitignoresRecursive(root) {
    ensureGitignore(root)
    for (const lesson of fs.readdirSync(root, { withFileTypes: true })) {
        if (!lesson.isDirectory() || lesson.name.startsWith(".")) continue
        const lessonPath = path.join(root, lesson.name)
        ensureGitignore(lessonPath)
        for (const svc of fs.readdirSync(lessonPath, { withFileTypes: true })) {
            if (svc.isDirectory() && !svc.name.startsWith(".")) {
                ensureGitignore(path.join(lessonPath, svc.name))
            }
        }
    }
}

function pushRepo(localDir, githubName, commitMsg) {
    const cwd = path.join(REPO_ROOT, localDir)
    if (!fs.existsSync(cwd)) {
        console.log(`SKIP missing: ${localDir}`)
        return false
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
    } catch { /* */ }
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
        return true
    } catch {
        console.log(`FORCE push ${githubName}`)
        try {
            run(`git fetch ${base} main`, cwd)
        } catch { /* empty remote */ }
        run(`git push ${base} main --force`, cwd)
        console.log(`OK force ${githubName}`)
        return true
    }
}

const results = []
for (const mod of MODULES) {
    const githubDefault = mod.dir
    const names = [mod.github ?? githubDefault, ...(mod.altGithub ?? [])]
    let github = await resolveGithubName(names)
    if (!(await repoExists(github))) {
        const target = mod.github ?? githubDefault
        if (mod.createIfMissing) {
            await createRepo(target)
            github = target
        } else {
            await createRepo(githubDefault)
            github = githubDefault
        }
    }
    console.log(`\n=== ${mod.dir} -> ${github} ===`)
    const ok = pushRepo(mod.dir, github, mod.msg)
    results.push({ dir: mod.dir, github, ok })
}

console.log("\n--- Summary ---")
for (const r of results) {
    console.log(`${r.ok ? "OK" : "FAIL"}  ${r.github}`)
}
console.log("\nDone modules 1-15.")
