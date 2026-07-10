// node .audits/check-directive-render.mjs <file.md> ...  — RENDER-validate directive nesting
// (accordion/panel/tab/code/preview/muted) bang CHINH parser cua FE (remark-directive). Neu nesting/colon
// SAI -> parser de marker thanh TEXT thay vi directive node -> ta bat duoc. KHONG doan bang mat.
// Import tu FE node_modules (remark-directive la cai MarkdownContent dung).
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
const FE = "D:/Repositories/starci-academy"
const req = createRequire(FE + "/package.json")
const { unified } = req("unified")
const remarkParse = req("remark-parse").default || req("remark-parse")
const remarkGfm = req("remark-gfm").default || req("remark-gfm")
const remarkDirective = req("remark-directive").default || req("remark-directive")

const proc = unified().use(remarkParse).use(remarkGfm).use(remarkDirective)

const DIRECTIVE_NAMES = ["accordion", "panel", "tab", "code", "preview", "muted"]
// 1 marker la directive HOP LE neu remark parse ra node containerDirective/leafDirective/textDirective.
// Neu SAI nesting -> marker xuat hien trong TEXT node -> fail.
const markerRe = /(?:^|\n)\s*:{3,}(accordion|panel|tab|code|preview|muted)\b/

function collectText (node, acc) {
    if (node.type === "text" || node.type === "inlineCode" || node.type === "code") acc.push(node.value || "")
    for (const c of node.children || []) collectText(c, acc)
}
function countDirectives (node, counts) {
    if ((node.type === "containerDirective" || node.type === "leafDirective" || node.type === "textDirective") && DIRECTIVE_NAMES.includes(node.name)) {
        counts[node.name] = (counts[node.name] || 0) + 1
    }
    for (const c of node.children || []) countDirectives(c, counts)
}
// accordion phai chua panel; panel khong duoc rong
function structuralIssues (node, issues, path = []) {
    if (node.type === "containerDirective") {
        if (node.name === "accordion") {
            const panels = (node.children || []).filter((c) => c.type === "containerDirective" && c.name === "panel")
            if (!panels.length) issues.push("accordion KHONG co panel con (nesting hong)")
        }
        if (node.name === "panel") {
            const title = node.attributes && node.attributes.title
            if (!title) issues.push("panel thieu attribute title")
        }
    }
    for (const c of node.children || []) structuralIssues(c, issues, path)
}

let totalFail = 0
for (const f of process.argv.slice(2)) {
    const src = readFileSync(f, "utf8")
    const tree = proc.parse(src)
    proc.runSync(tree)
    const issues = []
    // (a) marker bi ket trong text/code-block-html? -> tim text node con chua ":::name"
    const texts = []
    collectText(tree, texts)
    for (const t of texts) {
        const m = t.match(/:{3,}(accordion|panel|tab|code|preview)\b/)
        if (m) issues.push(`marker ":::${m[1]}" bi parse thanh TEXT (nesting/colon SAI, khong thanh directive)`)
    }
    // (b) cau truc
    structuralIssues(tree, issues)
    // (c) co accordion nao khong?
    const counts = {}
    countDirectives(tree, counts)
    const rel = f.replace(/\\/g, "/").split("/courses/")[1] || f
    if (issues.length) {
        totalFail++
        console.log(`✗ ${rel}`)
        ;[...new Set(issues)].forEach((i) => console.log("    - " + i))
    } else {
        console.log(`✓ ${rel}  [accordion=${counts.accordion || 0} panel=${counts.panel || 0} tab=${counts.tab || 0}]`)
    }
}
console.log(`\n${process.argv.slice(2).length} file · ${totalFail} fail`)
process.exit(totalFail ? 1 : 0)
