/**
 * Rename GitHub lesson repos to match .repo folder names. Requires GITHUB_TOKEN.
 */
const OWNER = "StarCi-Academy"

/** @type {Array<{old:string,new:string}>} */
const RENAMES = [
    {
        old: "system-design-mastery-module-11-social-media-feed-news-feed-system",
        new: "system-design-mastery-module-11-news-feed-fanout-and-caching",
    },
    {
        old: "system-design-mastery-module-13-ecommerce-flash-sale-system",
        new: "system-design-mastery-module-13-flash-sale-at-scale",
    },
]

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
    return res.status
}

async function rename(oldName, newName) {
    if ((await getRepo(newName)) === 200) {
        console.log(`SKIP ${oldName} -> ${newName} (target exists)`)
        return true
    }
    if ((await getRepo(oldName)) !== 200) {
        console.log(`SKIP ${oldName} (old not found)`)
        return false
    }
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${oldName}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name: newName }),
    })
    const data = await res.json()
    if (!res.ok) {
        console.error(`FAIL ${oldName}:`, res.status, data.message ?? data)
        return false
    }
    console.log(`OK ${oldName} -> ${data.html_url}`)
    return true
}

let ok = 0
for (const { old, new: newName } of RENAMES) {
    if (await rename(old, newName)) ok++
}
console.log(`\nRenamed ${ok}/${RENAMES.length}`)
process.exit(ok === RENAMES.length ? 0 : 1)
