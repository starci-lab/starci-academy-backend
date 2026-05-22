const token = process.env.GITHUB_TOKEN
const OWNER = "StarCi-Academy"
let page = 1
const names = []
while (page <= 5) {
    const res = await fetch(
        `https://api.github.com/orgs/${OWNER}/repos?per_page=100&page=${page}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } },
    )
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) break
    for (const r of data) names.push(r.name)
    page++
}
for (const n of names.filter((x) => /module-(9|10|11|12|13|14|15|16)/.test(x)).sort()) {
    console.log(n)
}
