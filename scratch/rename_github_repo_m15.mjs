const OWNER = "StarCi-Academy"
const OLD = "system-design-mastery-module-15-distributed-search-autocomplete-system"
const NEW = "system-design-mastery-module-15-distributed-search-and-autocomplete"

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

const existingNew = await getRepo(NEW)
if (existingNew.status === 200) {
    console.log(`Already exists: ${NEW}`)
    process.exit(0)
}

const old = await getRepo(OLD)
if (old.status !== 200) {
    console.error(`Old repo not found: ${OLD} (${old.status})`)
    process.exit(1)
}

const res = await fetch(`https://api.github.com/repos/${OWNER}/${OLD}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ name: NEW }),
})
const data = await res.json()
if (!res.ok) {
    console.error("Rename failed:", res.status, data.message ?? data)
    process.exit(1)
}
console.log(`Renamed OK: ${data.html_url}`)
