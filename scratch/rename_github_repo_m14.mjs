/**
 * Rename module-14 GitHub repo via API. Requires GITHUB_TOKEN env.
 */
const OWNER = "StarCi-Academy"
const OLD = "system-design-mastery-module-14-ride-hailing-system"
const NEW = "system-design-mastery-module-14-geospatial-indexing-realtime-matching-and-surge-pricing"

const token = process.env.GITHUB_TOKEN
if (!token) {
    console.error("GITHUB_TOKEN not set")
    process.exit(1)
}

const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
}

async function getRepo(name) {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${name}`, { headers })
    return { status: res.status, body: res.status === 404 ? null : await res.json() }
}

async function rename() {
    const existingNew = await getRepo(NEW)
    if (existingNew.status === 200) {
        console.log(`Repo already named: ${OWNER}/${NEW}`)
        return true
    }

    const old = await getRepo(OLD)
    if (old.status === 404) {
        console.error(`Old repo not found: ${OWNER}/${OLD}`)
        return false
    }
    if (old.status !== 200) {
        console.error(`Cannot read old repo: HTTP ${old.status}`)
        return false
    }

    const res = await fetch(`https://api.github.com/repos/${OWNER}/${OLD}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name: NEW }),
    })
    const data = await res.json()
    if (!res.ok) {
        console.error("Rename failed:", res.status, data.message ?? data)
        return false
    }
    console.log(`Renamed OK: ${data.html_url}`)
    return true
}

const ok = await rename()
process.exit(ok ? 0 : 1)
