/**
 * Phase 3 — retire index.ts barrels.
 *
 *   npx ts-node --transpile-only scripts/retire-barrels/phase3.ts --write
 *
 * 1. Relocate mixed index.ts (declarations live here) to ../<dirname>.ts
 * 2. Delete pure `export *` barrels
 *
 * Relative specifiers inside a relocated file are rewritten for the new home.
 * Run `rewrite-imports.ts --write` AFTER relocate and BEFORE delete-pure if
 * mixed files still import sibling barrels; this script does relocate then
 * prints the reminder. Combined mode: --write --delete-pure (delete after
 * relocate; run rewrite yourself in between if needed).
 *
 * Flags:
 *   --write         apply relocates
 *   --delete-pure   also delete pure barrels (implies they are unused)
 *   --report PATH   inventory output (default scripts/retire-barrels/BARREL-INVENTORY.txt)
 */
import * as fs from "node:fs"
import * as path from "node:path"
import * as ts from "typescript"

const REPO_ROOT = path.resolve(__dirname, "../..")
const ROOTS = [
    "src",
    "apps",
]

interface CliOptions {
    write: boolean
    deletePure: boolean
    reportPath: string
}

interface BarrelRow {
    file: string
    abs: string
    kind: "pure" | "mixed" | "empty"
    locals: string[]
    reexports: number
    other: string[]
}

function parseArgs(argv: string[]): CliOptions {
    let write = false
    let deletePure = false
    let reportPath = path.join(REPO_ROOT, "scripts/retire-barrels/BARREL-INVENTORY.txt")
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]
        if (arg === "--write") write = true
        else if (arg === "--delete-pure") deletePure = true
        else if (arg === "--report") reportPath = path.resolve(argv[++i] ?? reportPath)
    }
    return {
        write,
        deletePure,
        reportPath,
    }
}

function toPosix(p: string): string {
    return p.replace(/\\/g, "/")
}

function repoRel(abs: string): string {
    return toPosix(path.relative(REPO_ROOT, abs))
}

function walk(dir: string, out: string[]): void {
    for (const ent of fs.readdirSync(dir, {
        withFileTypes: true,
    })) {
        if (ent.name === "node_modules" || ent.name === "dist" || ent.name === ".git") continue
        const full = path.join(dir, ent.name)
        if (ent.isDirectory()) walk(full, out)
        else if (ent.name === "index.ts" || ent.name === "index.tsx") out.push(full)
    }
}

function classify(abs: string): BarrelRow {
    const text = fs.readFileSync(abs, "utf8")
    const sf = ts.createSourceFile(abs, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const locals: string[] = []
    const other: string[] = []
    let reexports = 0

    for (const stmt of sf.statements) {
        if (ts.isExportDeclaration(stmt) && stmt.moduleSpecifier) {
            reexports++
            continue
        }
        if (ts.isImportDeclaration(stmt)) {
            other.push("import")
            continue
        }
        if (ts.isFunctionDeclaration(stmt) && stmt.name) {
            locals.push(`fn:${stmt.name.text}`)
            continue
        }
        if (ts.isClassDeclaration(stmt) && stmt.name) {
            locals.push(`class:${stmt.name.text}`)
            continue
        }
        if (ts.isInterfaceDeclaration(stmt)) {
            locals.push(`iface:${stmt.name.text}`)
            continue
        }
        if (ts.isTypeAliasDeclaration(stmt)) {
            locals.push(`type:${stmt.name.text}`)
            continue
        }
        if (ts.isEnumDeclaration(stmt)) {
            locals.push(`enum:${stmt.name.text}`)
            continue
        }
        if (ts.isModuleDeclaration(stmt)) {
            locals.push(`ns:${stmt.name.getText(sf)}`)
            continue
        }
        if (ts.isVariableStatement(stmt)) {
            for (const d of stmt.declarationList.declarations) {
                if (ts.isIdentifier(d.name)) locals.push(`var:${d.name.text}`)
                else locals.push("var:<pattern>")
            }
            continue
        }
        if (ts.isExportAssignment(stmt)) {
            locals.push("export=")
            continue
        }
        other.push(ts.SyntaxKind[stmt.kind] ?? String(stmt.kind))
    }

    let kind: BarrelRow["kind"] = "pure"
    if (sf.statements.length === 0) kind = "empty"
    else if (locals.length > 0 || other.some((x) => x !== "import")) kind = "mixed"
    else if (other.includes("import") && reexports === 0) kind = "mixed"

    return {
        file: repoRel(abs),
        abs,
        kind,
        locals,
        reexports,
        other,
    }
}

function rewriteRelativeSpecifier(
    spec: string,
    fromFile: string,
    toFile: string,
): string {
    if (!spec.startsWith(".")) return spec
    const resolved = path.resolve(path.dirname(fromFile), spec)
    let rel = toPosix(path.relative(path.dirname(toFile), resolved))
    if (!rel.startsWith(".")) rel = `./${rel}`
    return rel
}

function relocateMixed(row: BarrelRow, write: boolean): string {
    const dir = path.dirname(row.abs)
    const parent = path.dirname(dir)
    const base = path.basename(dir)
    const ext = path.extname(row.abs)
    const dest = path.join(parent, `${base}${ext}`)
    if (fs.existsSync(dest)) {
        return `SKIP collision ${row.file} -> ${repoRel(dest)}`
    }

    const text = fs.readFileSync(row.abs, "utf8")
    const sf = ts.createSourceFile(row.abs, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const replacements: Array<{
        start: number
        end: number
        text: string
    }> = []

    const visit = (node: ts.Node) => {
        if (
            (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
            && node.moduleSpecifier
            && ts.isStringLiteral(node.moduleSpecifier)
        ) {
            const next = rewriteRelativeSpecifier(node.moduleSpecifier.text, row.abs, dest)
            if (next !== node.moduleSpecifier.text) {
                replacements.push({
                    start: node.moduleSpecifier.getStart(sf),
                    end: node.moduleSpecifier.getEnd(),
                    text: JSON.stringify(next),
                })
            }
        }
        ts.forEachChild(node, visit)
    }
    visit(sf)

    replacements.sort((a, b) => b.start - a.start)
    let nextText = text
    for (const rep of replacements) {
        nextText = nextText.slice(0, rep.start) + rep.text + nextText.slice(rep.end)
    }

    if (write) {
        fs.writeFileSync(dest, nextText)
        fs.unlinkSync(row.abs)
        try {
            fs.rmdirSync(dir)
        } catch {
            // still has siblings
        }
    }
    return `${row.file} -> ${repoRel(dest)} (${replacements.length} spec rewrites)`
}

function rmdirIfEmpty(dir: string): void {
    try {
        fs.rmdirSync(dir)
    } catch {
        // not empty or missing
    }
}

function main(): void {
    const options = parseArgs(process.argv.slice(2))
    const files: string[] = []
    for (const root of ROOTS) {
        const abs = path.join(REPO_ROOT, root)
        if (fs.existsSync(abs)) walk(abs, files)
    }
    const rows = files.map(classify)
    const pure = rows.filter((r) => r.kind === "pure")
    const mixed = rows.filter((r) => r.kind === "mixed")
    const empty = rows.filter((r) => r.kind === "empty")

    const report = [
        `indexFiles=${rows.length}`,
        `pure=${pure.length}`,
        `mixed=${mixed.length}`,
        `empty=${empty.length}`,
        "",
        "## mixed",
        ...mixed.map((r) => `${r.file} :: locals=${r.locals.join(",") || "-"} :: reexports=${r.reexports} :: other=${r.other.join(",") || "-"}`),
        "",
        "## empty",
        ...empty.map((r) => r.file),
        "",
        "## pure",
        ...pure.map((r) => r.file),
    ].join("\n")
    fs.writeFileSync(options.reportPath, `${report}\n`)
    console.log(`inventory ${options.reportPath}`)
    console.log(`indexFiles=${rows.length} pure=${pure.length} mixed=${mixed.length} empty=${empty.length}`)

    const mixedDeepestFirst = [...mixed].sort((a, b) => b.file.length - a.file.length)
    console.log(`\nrelocate mixed write=${options.write}`)
    for (const row of mixedDeepestFirst) {
        console.log(relocateMixed(row, options.write))
    }

    if (!options.deletePure) {
        console.log("\nskip delete-pure (pass --delete-pure after rewrite-imports)")
        return
    }

    console.log(`\ndelete pure write=${options.write} count=${pure.length}`)
    for (const row of pure) {
        if (options.write) {
            fs.unlinkSync(row.abs)
            rmdirIfEmpty(path.dirname(row.abs))
        }
        console.log(`delete ${row.file}`)
    }
}

main()
