// FE convention codemod (ts-morph): safe mechanical transforms only.
//  1) top-level `function` -> arrow `const` (skips hoisting-unsafe forward refs)
//  2) `type XProps = {...}` -> `interface XProps {...}`
//  3) inline component param type-literal -> extracted `interface <Comp>Props`
// Semantic/visual rules (Card border, Input variant, Button, spacing, title) are
// handled by per-module agents, NOT here.
import { Project, SyntaxKind } from "ts-morph"
import process from "node:process"

const root = process.argv[2]
if (!root) {
    console.error("usage: node fe-convention.mjs <frontend/src dir>")
    process.exit(1)
}

const project = new Project({
    compilerOptions: { jsx: 4 /* preserve */, allowJs: false },
    skipAddingFilesFromTsConfig: true,
})
project.addSourceFilesAtPaths(`${root}/**/*.{ts,tsx}`)

let nFn = 0
let nType = 0
let nInline = 0

for (const sf of project.getSourceFiles()) {
    // ---- 1) function declaration -> arrow const (top-level only, hoisting-safe) ----
    const fns = sf.getFunctions().filter((f) => f.getName())
    for (const fn of fns) {
        const name = fn.getName()
        const declStart = fn.getStart()
        // hoisting safety: skip if any reference appears BEFORE this declaration.
        const nameNode = fn.getNameNode()
        let unsafe = false
        const BODY_KINDS = new Set([
            SyntaxKind.ArrowFunction,
            SyntaxKind.FunctionDeclaration,
            SyntaxKind.FunctionExpression,
            SyntaxKind.MethodDeclaration,
        ])
        // Purely syntactic, in-file check (no language-service resolver — that throws
        // on exported symbols used cross-file). TDZ only bites when the identifier is
        // referenced at MODULE TOP-LEVEL before this declaration. References inside any
        // function body are closures (run at call/render time) and are safe as arrows.
        for (const id of sf.getDescendantsOfKind(SyntaxKind.Identifier)) {
            if (id === nameNode) continue
            if (id.getText() !== name) continue
            if (id.getStart() >= declStart) continue
            // skip property-access like `obj.Name` (not a binding reference)
            const parent = id.getParent()
            if (parent && parent.getKind() === SyntaxKind.PropertyAccessExpression && parent.getNameNode() === id) continue
            const ancestors = id.getAncestors()
            // skip identifiers inside JSDoc/comments (e.g. {@link ComponentName}) — not runtime refs
            if (ancestors.some((a) => a.getKindName().startsWith("JSDoc"))) continue
            const inBody = ancestors.some((a) => BODY_KINDS.has(a.getKind()))
            if (!inBody) {
                unsafe = true
                break
            }
        }
        if (unsafe) continue
        if (fn.getOverloads().length > 0) continue // skip overloaded

        const isAsync = fn.isAsync()
        const isDefault = fn.isDefaultExport()
        const isNamedExport = fn.isNamedExport() || fn.hasExportKeyword()
        const tps = fn.getTypeParameters().map((t) => t.getText())
        const params = fn.getParameters().map((p) => p.getText()).join(", ")
        const ret = fn.getReturnTypeNode()?.getText()
        const bodyNode = fn.getBody()
        if (!bodyNode) continue
        const bodyText = bodyNode.getText()
        const jsdoc = fn.getJsDocs().map((d) => d.getText()).join("\n")

        // generics in .tsx need a trailing comma to disambiguate from JSX
        const tpText = tps.length ? `<${tps.join(", ")}${tps.length === 1 ? "," : ""}>` : ""
        const asyncText = isAsync ? "async " : ""
        const retText = ret ? `: ${ret}` : ""
        const arrow = `${asyncText}${tpText}(${params})${retText} => ${bodyText}`

        let replacement
        if (isDefault) {
            replacement = `${jsdoc ? jsdoc + "\n" : ""}const ${name} = ${arrow}\n\nexport default ${name}`
        } else if (isNamedExport) {
            replacement = `${jsdoc ? jsdoc + "\n" : ""}export const ${name} = ${arrow}`
        } else {
            replacement = `${jsdoc ? jsdoc + "\n" : ""}const ${name} = ${arrow}`
        }
        fn.replaceWithText(replacement)
        nFn++
    }

    // ---- 2) type XProps = { ... } -> interface XProps { ... } ----
    for (const ta of sf.getTypeAliases()) {
        const nm = ta.getName()
        if (!nm.endsWith("Props")) continue
        const tn = ta.getTypeNode()
        if (!tn || tn.getKind() !== SyntaxKind.TypeLiteral) continue
        const isExport = ta.isExported()
        const jsdoc = ta.getJsDocs().map((d) => d.getText()).join("\n")
        const body = tn.getText() // includes { ... }
        const replacement = `${jsdoc ? jsdoc + "\n" : ""}${isExport ? "export " : ""}interface ${nm} ${body}`
        ta.replaceWithText(replacement)
        nType++
    }
}

project.saveSync()

// ---- 3) PHASE B: inline component param type-literal -> interface <Comp>Props ----
// Reload so the AST reflects the arrow conversions from phase A.
const projB = new Project({
    compilerOptions: { jsx: 4, allowJs: false },
    skipAddingFilesFromTsConfig: true,
})
projB.addSourceFilesAtPaths(`${root}/**/*.{ts,tsx}`)

for (const sf of projB.getSourceFiles()) {
    for (const stmt of sf.getVariableStatements()) {
        for (const decl of stmt.getDeclarations()) {
            const comp = decl.getName()
            if (!/^[A-Z]/.test(comp)) continue // components only (PascalCase)
            const init = decl.getInitializer()
            if (!init) continue
            const k = init.getKind()
            if (k !== SyntaxKind.ArrowFunction && k !== SyntaxKind.FunctionExpression) continue
            const params = init.getParameters()
            if (params.length < 1) continue
            const p0 = params[0]
            const tn = p0.getTypeNode()
            if (!tn || tn.getKind() !== SyntaxKind.TypeLiteral) continue

            const ifaceName = `${comp}Props`
            const body = tn.getText() // { ... }
            p0.setType(ifaceName)
            // prepend the interface immediately above this statement
            stmt.replaceWithText(`interface ${ifaceName} ${body}\n\n${stmt.getText()}`)
            nInline++
        }
    }
}
projB.saveSync()

console.log(`[codemod] ${root}`)
console.log(`  fn->arrow: ${nFn}   type->interface: ${nType}   inline-extracted: ${nInline}`)
