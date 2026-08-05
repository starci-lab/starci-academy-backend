/**
 * Retire barrel imports via the TypeScript compiler API.
 *
 * For every named / default / namespace binding, unwrap aliases to the file
 * that actually declares the symbol, then rewrite the specifier. Same-module
 * targets become relative; everything else becomes `@modules/<path>`,
 * `@features/<path>`, or `@tests/<path>`.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/retire-barrels/rewrite-imports.ts [--write] [--module-root src/modules/ai]
 */
import * as fs from "node:fs"
import * as path from "node:path"
import ts from "typescript"

const REPO_ROOT = path.resolve(__dirname, "../..")
const META_ROOTS = new Set([
    "lib",
    "platform",
    "integrations",
])
const IN_REPO_PREFIXES = [
    "@modules/",
    "@features/",
    "@tests/",
]

interface CliOptions {
    write: boolean
    moduleRoot: string | null
    reportPath: string
}

interface UnresolvedRow {
    file: string
    specifier: string
    binding: string
    reason: string
}

interface NamedBinding {
    importedName: string
    localName: string
    isTypeOnly: boolean
}

interface ResolvedBinding extends NamedBinding {
    targetFile: string
}

const unresolved: UnresolvedRow[] = []
const stats = {
    filesVisited: 0,
    filesRewritten: 0,
    declsSeen: 0,
    declsRewritten: 0,
    declsSplit: 0,
    bindingsResolved: 0,
    jestMocksRewritten: 0,
}

function parseArgs(argv: string[]): CliOptions {
    let write = false
    let moduleRoot: string | null = null
    let reportPath = path.join(REPO_ROOT, ".artifacts", "retire-barrels-unresolved.txt")
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]
        if (arg === "--write") write = true
        else if (arg === "--module-root") moduleRoot = argv[++i] ?? null
        else if (arg === "--report") reportPath = path.resolve(argv[++i] ?? reportPath)
    }
    return {
        write,
        moduleRoot: moduleRoot ? path.resolve(REPO_ROOT, moduleRoot) : null,
        reportPath,
    }
}

function norm(p: string): string {
    return path.resolve(p).replace(/\\/g, "/").replace(/^([A-Z]):/, (m) => m.toLowerCase())
}

function toPosix(p: string): string {
    return p.replace(/\\/g, "/")
}

function isTsSource(fileName: string): boolean {
    return /\.(ts|tsx)$/.test(fileName) && !fileName.endsWith(".d.ts")
}

function isInRepoSpecifier(specifier: string): boolean {
    if (specifier.startsWith(".")) return true
    return IN_REPO_PREFIXES.some((prefix) => specifier === prefix.slice(0, -1) || specifier.startsWith(prefix))
}

function stripExt(filePath: string): string {
    return filePath.replace(/\.(tsx|ts|jsx|js)$/u, "")
}

function stripIndex(posixNoExt: string): string {
    return posixNoExt.replace(/\/index$/u, "")
}

function repoRel(abs: string): string {
    return toPosix(path.relative(REPO_ROOT, abs))
}

function moduleRootOf(absFile: string): string | null {
    const rel = toPosix(path.relative(path.join(REPO_ROOT, "src/modules"), absFile))
    if (rel.startsWith("..") || path.isAbsolute(rel)) return null
    const parts = rel.split("/")
    if (META_ROOTS.has(parts[0]) && parts.length >= 2) {
        return norm(path.join(REPO_ROOT, "src/modules", parts[0], parts[1]))
    }
    return norm(path.join(REPO_ROOT, "src/modules", parts[0]))
}

function featureRootOf(absFile: string): string | null {
    const rel = toPosix(path.relative(path.join(REPO_ROOT, "src/features"), absFile))
    if (rel.startsWith("..") || path.isAbsolute(rel)) return null
    return norm(path.join(REPO_ROOT, "src/features", rel.split("/")[0]))
}

function testsRootOf(absFile: string): string | null {
    const rel = toPosix(path.relative(path.join(REPO_ROOT, "src/tests"), absFile))
    if (rel.startsWith("..") || path.isAbsolute(rel)) return null
    return norm(path.join(REPO_ROOT, "src/tests", rel.split("/")[0]))
}

function specifierFor(importerFile: string, targetFile: string): string {
    const importer = norm(importerFile)
    const target = norm(targetFile)
    const targetNoExt = stripIndex(stripExt(target))

    const importerMod = moduleRootOf(importer)
    const targetMod = moduleRootOf(target)
    if (importerMod && targetMod && importerMod === targetMod) {
        return relativeSpecifier(importer, targetNoExt)
    }

    const importerFeat = featureRootOf(importer)
    const targetFeat = featureRootOf(target)
    if (importerFeat && targetFeat && importerFeat === targetFeat) {
        return relativeSpecifier(importer, targetNoExt)
    }

    const importerTest = testsRootOf(importer)
    const targetTest = testsRootOf(target)
    if (importerTest && targetTest && importerTest === targetTest) {
        return relativeSpecifier(importer, targetNoExt)
    }

    const modulesRoot = norm(path.join(REPO_ROOT, "src/modules"))
    if (target.startsWith(`${modulesRoot}/`) || target === modulesRoot) {
        return `@modules/${toPosix(path.relative(modulesRoot, targetNoExt))}`
    }
    const featuresRoot = norm(path.join(REPO_ROOT, "src/features"))
    if (target.startsWith(`${featuresRoot}/`) || target === featuresRoot) {
        return `@features/${toPosix(path.relative(featuresRoot, targetNoExt))}`
    }
    const testsRoot = norm(path.join(REPO_ROOT, "src/tests"))
    if (target.startsWith(`${testsRoot}/`) || target === testsRoot) {
        return `@tests/${toPosix(path.relative(testsRoot, targetNoExt))}`
    }

    return relativeSpecifier(importer, targetNoExt)
}

function relativeSpecifier(importerFile: string, targetNoExt: string): string {
    let rel = toPosix(path.relative(path.dirname(importerFile), targetNoExt))
    if (!rel.startsWith(".")) rel = `./${rel}`
    return rel
}

function isUnder(file: string, root: string): boolean {
    const nFile = norm(file)
    const nRoot = norm(root)
    return nFile === nRoot || nFile.startsWith(`${nRoot}/`)
}

function isExternalDeclarationFile(fileName: string): boolean {
    const n = norm(fileName)
    return n.includes("/node_modules/") || n.endsWith(".d.ts")
}

function npmSpecifierFromNodeModules(fileName: string): string | null {
    const n = norm(fileName)
    const marker = "/node_modules/"
    const idx = n.lastIndexOf(marker)
    if (idx < 0) return null
    const rest = n.slice(idx + marker.length)
    if (rest.startsWith("@")) {
        const [
            scope,
            name,
        ] = rest.split("/")
        if (!scope || !name) return null
        return `${scope}/${name}`
    }
    return rest.split("/")[0] ?? null
}

function unwrapAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
    let current = symbol
    const seen = new Set<ts.Symbol>()
    while (current.flags & ts.SymbolFlags.Alias) {
        if (seen.has(current)) break
        seen.add(current)
        let next: ts.Symbol
        try {
            next = checker.getAliasedSymbol(current)
        } catch {
            break
        }
        if (!next || next === current || next.escapedName === "unknown") break
        current = next
    }
    return current
}

function declarationFileOf(symbol: ts.Symbol): string | null {
    const decl = symbol.declarations?.[0]
    if (!decl) return null
    return norm(decl.getSourceFile().fileName)
}

function resolveBindingTarget(
    checker: ts.TypeChecker,
    nameNode: ts.Node,
    importerFile: string,
    specifier: string,
    bindingLabel: string,
): string | null {
    const symbol = checker.getSymbolAtLocation(nameNode)
    if (!symbol) {
        unresolved.push({
            file: repoRel(importerFile),
            specifier,
            binding: bindingLabel,
            reason: "getSymbolAtLocation returned undefined",
        })
        return null
    }
    const ultimate = unwrapAlias(checker, symbol)
    const declFile = declarationFileOf(ultimate)
    if (!declFile) {
        unresolved.push({
            file: repoRel(importerFile),
            specifier,
            binding: bindingLabel,
            reason: "ultimate symbol has no declarations",
        })
        return null
    }
    if (declFile.includes("/node_modules/")) {
        const npm = npmSpecifierFromNodeModules(declFile)
        if (!npm) {
            unresolved.push({
                file: repoRel(importerFile),
                specifier,
                binding: bindingLabel,
                reason: `external declaration with unreadable package path: ${declFile}`,
            })
            return null
        }
        stats.bindingsResolved++
        return `npm:${npm}`
    }
    if (declFile.endsWith(".d.ts") && !declFile.includes("/src/") && !declFile.includes("/apps/")) {
        unresolved.push({
            file: repoRel(importerFile),
            specifier,
            binding: bindingLabel,
            reason: `ambient/d.ts declaration: ${repoRel(declFile)}`,
        })
        return null
    }
    stats.bindingsResolved++
    return declFile
}

function shouldConsiderSpecifier(
    options: CliOptions,
    importerFile: string,
    specifier: string,
    targetHint?: string,
): boolean {
    if (!isInRepoSpecifier(specifier)) return false
    // Leave a barrel's own relative export-* wiring alone — Phase 3 deletes
    // those files. Alias re-exports inside an index.ts (`export { X } from
    // "@modules/ai"`) are consumer-side and must be rewritten.
    const importerBase = path.basename(importerFile).replace(/\\/g, "/")
    if ((importerBase === "index.ts" || importerBase === "index.tsx") && specifier.startsWith(".")) {
        return false
    }
    if (!options.moduleRoot) return true
    const aliasName = path.basename(options.moduleRoot)
    const metaParent = path.basename(path.dirname(options.moduleRoot))
    const deepAlias = META_ROOTS.has(metaParent)
        ? `@modules/${metaParent}/${aliasName}`
        : `@modules/${aliasName}`
    const shortAlias = `@modules/${aliasName}`
    if (specifier === shortAlias || specifier.startsWith(`${shortAlias}/`)) return true
    if (specifier === deepAlias || specifier.startsWith(`${deepAlias}/`)) return true
    if (!specifier.startsWith(".")) return false
    if (!isUnder(importerFile, options.moduleRoot)) return false
    if (targetHint && !isUnder(targetHint, options.moduleRoot)) return false
    return true
}

function printNamedList(bindings: NamedBinding[], indent = "    "): string {
    return bindings
        .map((b) => {
            const typePrefix = b.isTypeOnly ? "type " : ""
            const name = b.importedName === b.localName
                ? b.importedName
                : `${b.importedName} as ${b.localName}`
            return `${indent}${typePrefix}${name},`
        })
        .join("\n")
}

function printImportGroup(args: {
    isTypeOnlyStmt: boolean
    defaultName?: string
    namespaceName?: string
    bindings: NamedBinding[]
    specifier: string
}): string {
    const spec = JSON.stringify(args.specifier)
    if (args.namespaceName && args.bindings.length === 0 && !args.defaultName) {
        return args.isTypeOnlyStmt
            ? `import type * as ${args.namespaceName} from ${spec}`
            : `import * as ${args.namespaceName} from ${spec}`
    }
    if (args.defaultName && args.bindings.length === 0 && !args.namespaceName) {
        return args.isTypeOnlyStmt
            ? `import type ${args.defaultName} from ${spec}`
            : `import ${args.defaultName} from ${spec}`
    }
    if (!args.defaultName && !args.namespaceName && args.bindings.length === 0) {
        return `import ${spec}`
    }
    const head = args.isTypeOnlyStmt ? "import type" : "import"
    const list = printNamedList(args.bindings.map((b) => ({
        ...b,
        isTypeOnly: args.isTypeOnlyStmt ? false : b.isTypeOnly,
    })))
    if (args.defaultName) {
        return `${head} ${args.defaultName}, {\n${list}\n} from ${spec}`
    }
    return `${head} {\n${list}\n} from ${spec}`
}

function printExportGroup(args: {
    isTypeOnlyStmt: boolean
    namespaceName?: string
    isStar: boolean
    bindings: NamedBinding[]
    specifier: string
}): string {
    const spec = JSON.stringify(args.specifier)
    if (args.isStar && args.namespaceName) {
        return args.isTypeOnlyStmt
            ? `export type * as ${args.namespaceName} from ${spec}`
            : `export * as ${args.namespaceName} from ${spec}`
    }
    if (args.isStar) {
        return args.isTypeOnlyStmt
            ? `export type * from ${spec}`
            : `export * from ${spec}`
    }
    const head = args.isTypeOnlyStmt ? "export type" : "export"
    const list = printNamedList(args.bindings.map((b) => ({
        ...b,
        isTypeOnly: args.isTypeOnlyStmt ? false : b.isTypeOnly,
    })))
    return `${head} {\n${list}\n} from ${spec}`
}

function groupByTarget(bindings: ResolvedBinding[]): Map<string, ResolvedBinding[]> {
    const groups = new Map<string, ResolvedBinding[]>()
    for (const binding of bindings) {
        const list = groups.get(binding.targetFile) ?? []
        list.push(binding)
        groups.set(binding.targetFile, list)
    }
    return groups
}

function targetToSpecifier(importerFile: string, targetFile: string): string {
    if (targetFile.startsWith("npm:")) return targetFile.slice("npm:".length)
    return specifierFor(importerFile, targetFile)
}

function rewriteImportDecl(
    checker: ts.TypeChecker,
    sf: ts.SourceFile,
    node: ts.ImportDeclaration,
    options: CliOptions,
): string | null {
    if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) return null
    const specifier = node.moduleSpecifier.text
    if (!shouldConsiderSpecifier(options, sf.fileName, specifier)) return null
    stats.declsSeen++

    const clause = node.importClause
    if (!clause) {
        unresolved.push({
            file: repoRel(sf.fileName),
            specifier,
            binding: "(side-effect)",
            reason: "side-effect import — left untouched",
        })
        return null
    }

    const stmtTypeOnly = clause.isTypeOnly === true
    type ImportGroup = {
        defaultName?: string
        namespaceName?: string
        bindings: ResolvedBinding[]
        allTypeOnly: boolean
    }
    const groups = new Map<string, ImportGroup>()

    const takeGroup = (target: string): ImportGroup => {
        const existing = groups.get(target)
        if (existing) return existing
        const created: ImportGroup = {
            bindings: [],
            allTypeOnly: true,
        }
        groups.set(target, created)
        return created
    }

    if (clause.name) {
        const target = resolveBindingTarget(checker, clause.name, sf.fileName, specifier, clause.name.text)
        if (!target) return null
        const g = takeGroup(target)
        g.defaultName = clause.name.text
        g.allTypeOnly = g.allTypeOnly && stmtTypeOnly
    }

    const named = clause.namedBindings
    if (named && ts.isNamespaceImport(named)) {
        const moduleSymbol = checker.getSymbolAtLocation(node.moduleSpecifier)
        if (!moduleSymbol) {
            unresolved.push({
                file: repoRel(sf.fileName),
                specifier,
                binding: `* as ${named.name.text}`,
                reason: "namespace import: module symbol unresolved",
            })
            return null
        }
        const exported = checker.getExportsOfModule(unwrapAlias(checker, moduleSymbol))
        const targets = new Set<string>()
        for (const exp of exported) {
            const ultimate = unwrapAlias(checker, exp)
            const declFile = declarationFileOf(ultimate)
            if (!declFile) continue
            if (declFile.includes("/node_modules/")) {
                const npm = npmSpecifierFromNodeModules(declFile)
                if (npm) targets.add(`npm:${npm}`)
                continue
            }
            targets.add(declFile)
        }
        if (targets.size !== 1) {
            unresolved.push({
                file: repoRel(sf.fileName),
                specifier,
                binding: `* as ${named.name.text}`,
                reason: `namespace import spans ${targets.size} target files — left untouched`,
            })
            return null
        }
        const target = [
            ...targets,
        ][0]
        const g = takeGroup(target)
        g.namespaceName = named.name.text
        g.allTypeOnly = g.allTypeOnly && stmtTypeOnly
    } else if (named && ts.isNamedImports(named)) {
        for (const spec of named.elements) {
            const importedName = (spec.propertyName ?? spec.name).text
            const localName = spec.name.text
            const target = resolveBindingTarget(
                checker,
                spec.name,
                sf.fileName,
                specifier,
                importedName === localName ? importedName : `${importedName} as ${localName}`,
            )
            if (!target) return null
            const g = takeGroup(target)
            const isTypeOnly = stmtTypeOnly || spec.isTypeOnly
            g.bindings.push({
                importedName,
                localName,
                isTypeOnly,
                targetFile: target,
            })
            g.allTypeOnly = g.allTypeOnly && isTypeOnly
        }
    }

    if (groups.size === 0) return null

    const pieces: string[] = []
    const sortedTargets = [
        ...groups.keys(),
    ].sort()
    let changed = false
    for (const target of sortedTargets) {
        const g = groups.get(target)!
        const nextSpec = targetToSpecifier(sf.fileName, target)
        if (nextSpec !== specifier || groups.size > 1) {
            changed = true
        }
        pieces.push(printImportGroup({
            isTypeOnlyStmt: stmtTypeOnly || (g.allTypeOnly && !g.defaultName && !g.namespaceName),
            defaultName: g.defaultName,
            namespaceName: g.namespaceName,
            bindings: g.bindings,
            specifier: nextSpec,
        }))
    }
    if (!changed && pieces.length === 1) return null
    if (pieces.length > 1) stats.declsSplit++
    stats.declsRewritten++
    return pieces.join("\n")
}

function rewriteExportDecl(
    checker: ts.TypeChecker,
    sf: ts.SourceFile,
    node: ts.ExportDeclaration,
    options: CliOptions,
): string | null {
    if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) return null
    const specifier = node.moduleSpecifier.text
    if (!shouldConsiderSpecifier(options, sf.fileName, specifier)) return null
    stats.declsSeen++

    if (node.exportClause && ts.isNamespaceExport(node.exportClause)) {
        unresolved.push({
            file: repoRel(sf.fileName),
            specifier,
            binding: `* as ${node.exportClause.name.text}`,
            reason: "namespace re-export left to manual review",
        })
        return null
    }

    if (!node.exportClause) {
        const moduleSymbol = checker.getSymbolAtLocation(node.moduleSpecifier)
        if (!moduleSymbol) {
            unresolved.push({
                file: repoRel(sf.fileName),
                specifier,
                binding: "*",
                reason: "export * module symbol unresolved",
            })
            return null
        }
        const exported = checker.getExportsOfModule(unwrapAlias(checker, moduleSymbol))
        const bindings: ResolvedBinding[] = []
        for (const exp of exported) {
            const ultimate = unwrapAlias(checker, exp)
            let declFile = declarationFileOf(ultimate)
            if (!declFile) continue
            if (declFile.includes("/node_modules/")) {
                const npm = npmSpecifierFromNodeModules(declFile)
                if (!npm) continue
                declFile = `npm:${npm}`
            }
            bindings.push({
                importedName: exp.name,
                localName: exp.name,
                isTypeOnly: node.isTypeOnly || !(ultimate.flags & ts.SymbolFlags.Value),
                targetFile: declFile,
            })
            stats.bindingsResolved++
        }
        if (bindings.length === 0) return null
        const groups = groupByTarget(bindings)
        const pieces: string[] = []
        for (const target of [
            ...groups.keys(),
        ].sort()) {
            const group = groups.get(target)!
            const nextSpec = targetToSpecifier(sf.fileName, target)
            const allType = group.every((b) => b.isTypeOnly)
            pieces.push(printExportGroup({
                isTypeOnlyStmt: node.isTypeOnly || allType,
                isStar: false,
                bindings: group,
                specifier: nextSpec,
            }))
        }
        if (pieces.length === 1 && targetToSpecifier(sf.fileName, [
            ...groups.keys(),
        ][0]) === specifier) {
            return null
        }
        if (pieces.length > 1) stats.declsSplit++
        stats.declsRewritten++
        return pieces.join("\n")
    }

    if (!ts.isNamedExports(node.exportClause)) return null
    const bindings: ResolvedBinding[] = []
    for (const spec of node.exportClause.elements) {
        const importedName = (spec.propertyName ?? spec.name).text
        const localName = spec.name.text
        const target = resolveBindingTarget(
            checker,
            spec.propertyName ?? spec.name,
            sf.fileName,
            specifier,
            importedName === localName ? importedName : `${importedName} as ${localName}`,
        )
        if (!target) return null
        bindings.push({
            importedName,
            localName,
            isTypeOnly: node.isTypeOnly || spec.isTypeOnly,
            targetFile: target,
        })
    }
    const groups = groupByTarget(bindings)
    const pieces: string[] = []
    for (const target of [
        ...groups.keys(),
    ].sort()) {
        const group = groups.get(target)!
        const nextSpec = targetToSpecifier(sf.fileName, target)
        const allType = group.every((b) => b.isTypeOnly)
        pieces.push(printExportGroup({
            isTypeOnlyStmt: node.isTypeOnly || (allType && group.every((b) => b.isTypeOnly)),
            isStar: false,
            bindings: group,
            specifier: nextSpec,
        }))
    }
    if (pieces.length === 1 && targetToSpecifier(sf.fileName, [
        ...groups.keys(),
    ][0]) === specifier) {
        return null
    }
    if (pieces.length > 1) stats.declsSplit++
    stats.declsRewritten++
    return pieces.join("\n")
}

function rewriteFile(
    checker: ts.TypeChecker,
    sf: ts.SourceFile,
    options: CliOptions,
): string | null {
    const replacements: {
        start: number
        end: number
        text: string
        oldSpec?: string
        newSpecs?: string[]
    }[] = []
    const specMap = new Map<string, Set<string>>()

    const visit = (node: ts.Node) => {
        if (ts.isImportDeclaration(node)) {
            const next = rewriteImportDecl(checker, sf, node, options)
            if (next && ts.isStringLiteral(node.moduleSpecifier)) {
                const oldSpec = node.moduleSpecifier.text
                const newSpecs = [
                    ...next.matchAll(/from ("(?:\\.|[^"])+")/g),
                ].map((m) => JSON.parse(m[1]))
                replacements.push({
                    start: node.getStart(sf),
                    end: node.end,
                    text: next,
                    oldSpec,
                    newSpecs,
                })
                const set = specMap.get(oldSpec) ?? new Set<string>()
                for (const s of newSpecs) set.add(s)
                specMap.set(oldSpec, set)
            }
            return
        }
        if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
            const next = rewriteExportDecl(checker, sf, node, options)
            if (next) {
                replacements.push({
                    start: node.getStart(sf),
                    end: node.end,
                    text: next,
                })
            }
            return
        }
        if (ts.isImportTypeNode(node) && node.argument && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
            const specifier = node.argument.literal.text
            if (!shouldConsiderSpecifier(options, sf.fileName, specifier)) {
                ts.forEachChild(node, visit)
                return
            }
            stats.declsSeen++
            const moduleSymbol = checker.getSymbolAtLocation(node.argument.literal)
            let target: string | null = null
            if (node.qualifier) {
                const head = ts.isIdentifier(node.qualifier) ? node.qualifier : node.qualifier.left
                const headId = ts.isIdentifier(head) ? head : null
                if (headId) {
                    // Prefer resolving the qualified name through the module exports.
                    if (moduleSymbol) {
                        const exports = checker.getExportsOfModule(unwrapAlias(checker, moduleSymbol))
                        const hit = exports.find((e) => e.name === headId.text)
                        if (hit) {
                            const ultimate = unwrapAlias(checker, hit)
                            const declFile = declarationFileOf(ultimate)
                            if (declFile?.includes("/node_modules/")) {
                                const npm = npmSpecifierFromNodeModules(declFile)
                                target = npm ? `npm:${npm}` : null
                            } else {
                                target = declFile
                            }
                        }
                    }
                }
            } else if (moduleSymbol) {
                const exports = checker.getExportsOfModule(unwrapAlias(checker, moduleSymbol))
                const targets = new Set<string>()
                for (const exp of exports) {
                    const declFile = declarationFileOf(unwrapAlias(checker, exp))
                    if (!declFile) continue
                    if (declFile.includes("/node_modules/")) {
                        const npm = npmSpecifierFromNodeModules(declFile)
                        if (npm) targets.add(`npm:${npm}`)
                    } else {
                        targets.add(declFile)
                    }
                }
                if (targets.size === 1) target = [
                    ...targets,
                ][0]
                else {
                    unresolved.push({
                        file: repoRel(sf.fileName),
                        specifier,
                        binding: `import("${specifier}")`,
                        reason: `import type spans ${targets.size} files — left untouched`,
                    })
                }
            }
            if (target) {
                const nextSpec = targetToSpecifier(sf.fileName, target)
                if (nextSpec !== specifier) {
                    replacements.push({
                        start: node.argument.literal.getStart(sf),
                        end: node.argument.literal.end,
                        text: JSON.stringify(nextSpec),
                    })
                    stats.declsRewritten++
                    const set = specMap.get(specifier) ?? new Set<string>()
                    set.add(nextSpec)
                    specMap.set(specifier, set)
                }
            }
            ts.forEachChild(node, visit)
            return
        }

        if (ts.isCallExpression(node)
            && ts.isPropertyAccessExpression(node.expression)
            && ts.isIdentifier(node.expression.expression)
            && node.expression.expression.text === "jest"
            && [
                "mock",
                "doMock",
                "unmock",
                "requireActual",
                "requireMock",
            ].includes(node.expression.name.text)
            && node.arguments[0]
            && ts.isStringLiteral(node.arguments[0])) {
            const oldSpec = node.arguments[0].text
            const mapped = specMap.get(oldSpec)
            if (mapped && mapped.size === 1) {
                const nextSpec = [
                    ...mapped,
                ][0]
                if (nextSpec !== oldSpec) {
                    replacements.push({
                        start: node.arguments[0].getStart(sf),
                        end: node.arguments[0].end,
                        text: JSON.stringify(nextSpec),
                    })
                    stats.jestMocksRewritten++
                }
            } else if (mapped && mapped.size > 1 && node.expression.name.text === "mock") {
                unresolved.push({
                    file: repoRel(sf.fileName),
                    specifier: oldSpec,
                    binding: "jest.mock",
                    reason: `jest.mock spans ${mapped.size} rewritten targets: ${[
                        ...mapped,
                    ].join(", ")}`,
                })
            }
        }

        ts.forEachChild(node, visit)
    }

    // First pass: imports/exports only, to populate specMap before jest.mock visit.
    for (const stmt of sf.statements) {
        if (ts.isImportDeclaration(stmt) || (ts.isExportDeclaration(stmt) && stmt.moduleSpecifier)) {
            visit(stmt)
        }
    }
    // Second pass: import types + jest.mock, which depend on specMap / independent resolution.
    const visitRest = (node: ts.Node) => {
        if (ts.isImportDeclaration(node) || (ts.isExportDeclaration(node) && node.moduleSpecifier)) return
        if (ts.isImportTypeNode(node)
            && node.argument
            && ts.isLiteralTypeNode(node.argument)
            && ts.isStringLiteral(node.argument.literal)) {
            visit(node)
            return
        }
        if (ts.isCallExpression(node)) visit(node)
        ts.forEachChild(node, visitRest)
    }
    visitRest(sf)

    if (replacements.length === 0) return null
    const text = sf.getFullText()
    replacements.sort((a, b) => b.start - a.start)
    let next = text
    for (const rep of replacements) {
        next = next.slice(0, rep.start) + rep.text + next.slice(rep.end)
    }
    return next
}

function loadProgram(): {
    program: ts.Program
    checker: ts.TypeChecker
} {
    const configPath = ts.findConfigFile(REPO_ROOT, ts.sys.fileExists, "tsconfig.json")
    if (!configPath) throw new Error("tsconfig.json not found")
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
    if (configFile.error) {
        throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"))
    }
    const parsed = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        REPO_ROOT,
    )
    const program = ts.createProgram({
        rootNames: parsed.fileNames,
        options: {
            ...parsed.options,
            incremental: false,
            composite: false,
            tsBuildInfoFile: undefined,
        },
    })
    return {
        program,
        checker: program.getTypeChecker(),
    }
}

function main() {
    const options = parseArgs(process.argv.slice(2))
    console.log(`retire-barrels: write=${options.write} moduleRoot=${options.moduleRoot ?? "(all)"}`)
    const {
        program,
        checker,
    } = loadProgram()

    for (const sf of program.getSourceFiles()) {
        if (sf.isDeclarationFile) continue
        if (!isTsSource(sf.fileName)) continue
        const n = norm(sf.fileName)
        if (n.includes("/node_modules/")) continue
        if (n.includes("/dist/")) continue
        if (n.includes("/scripts/retire-barrels/")) continue
        if (!n.startsWith(`${norm(REPO_ROOT)}/`)) continue
        stats.filesVisited++
        const next = rewriteFile(checker, sf, options)
        if (!next || next === sf.getFullText()) continue
        stats.filesRewritten++
        const rel = repoRel(sf.fileName)
        if (options.write) {
            fs.writeFileSync(sf.fileName, next, "utf8")
            console.log(`wrote ${rel}`)
        } else {
            console.log(`would rewrite ${rel}`)
        }
    }

    fs.mkdirSync(path.dirname(options.reportPath), {
        recursive: true,
    })
    const report = [
        `filesVisited=${stats.filesVisited}`,
        `filesRewritten=${stats.filesRewritten}`,
        `declsSeen=${stats.declsSeen}`,
        `declsRewritten=${stats.declsRewritten}`,
        `declsSplit=${stats.declsSplit}`,
        `bindingsResolved=${stats.bindingsResolved}`,
        `jestMocksRewritten=${stats.jestMocksRewritten}`,
        `unresolved=${unresolved.length}`,
        "",
        ...unresolved.map((u) => `${u.file} :: ${u.specifier} :: ${u.binding} :: ${u.reason}`),
        "",
    ].join("\n")
    fs.writeFileSync(options.reportPath, report, "utf8")
    console.log(report)
}

main()
