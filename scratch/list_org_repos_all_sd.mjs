const token = process.env.GITHUB_TOKEN
const OWNER = "StarCi-Academy"
let page = 1
const names = []
while (page <= 10) {
    const res = await fetch(
        `https://api.github.com/orgs/${OWNER}/repos?per_page=100&page=${page}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } },
    )
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) break
    for (const r of data) {
        if (r.name.startsWith("system-design-mastery-module-")) names.push(r.name)
    }
    page++
}
names.sort((a, b) => {
    const na = Number(a.match(/module-(\d+)/)?.[1] ?? 99)
    const nb = Number(b.match(/module-(\d+)/)?.[1] ?? 99)
    return na - nb || a.localeCompare(b)
})
for (const n of names) console.log(n)
