const fs = require("fs")
const path = require("path")

const root = path.join(process.cwd(), ".mount", "data")
const missing = []

const isLocaleLeaf = (dir) =>
    fs.existsSync(path.join(dir, "en.md")) || fs.existsSync(path.join(dir, "vi.md"))

const walk = (dir, relParts) => {
    if (!fs.existsSync(dir)) {
        return
    }
    if (isLocaleLeaf(dir)) {
        const rel = relParts.join("/")
        const hasEn = fs.existsSync(path.join(dir, "en.md"))
        const hasVi = fs.existsSync(path.join(dir, "vi.md"))
        if (!hasEn || !hasVi) {
            missing.push({
                rel,
                en: hasEn,
                vi: hasVi,
            })
        }
        return
    }
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name)
        if (fs.statSync(full).isDirectory()) {
            walk(full, [...relParts, name])
        }
    }
}

for (const top of ["courses", "cv", "foundations", "headhuntings"]) {
    const dir = path.join(root, top)
    if (fs.existsSync(dir)) {
        walk(dir, [top])
    }
}

console.log(JSON.stringify(missing, null, 2))
console.log("TOTAL", missing.length)
