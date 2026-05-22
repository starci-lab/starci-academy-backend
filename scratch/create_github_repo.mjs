const token = process.env.GITHUB_TOKEN
const OWNER = process.env.GITHUB_OWNER ?? "StarCi-Academy"
const name = process.argv[2]
if (!token || !name) {
    console.error("Usage: GITHUB_TOKEN=... node create_github_repo.mjs <repo-name>")
    process.exit(1)
}

const res = await fetch(`https://api.github.com/repos/${OWNER}/${name}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
})
if (res.status === 200) {
    console.log(`Exists: ${name}`)
    process.exit(0)
}

const create = await fetch(`https://api.github.com/orgs/${OWNER}/repos`, {
    method: "POST",
    headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        name,
        private: true,
        description: `StarCi System Design Mastery — ${name}`,
        auto_init: false,
    }),
})

const body = await create.json()
if (!create.ok) {
    console.error(create.status, body.message ?? body)
    process.exit(1)
}
console.log(`Created: ${body.html_url}`)
