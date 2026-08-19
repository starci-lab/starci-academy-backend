import {execFileSync} from "node:child_process"
import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {relative, resolve} from "node:path"
import {fileURLToPath} from "node:url"

const normalize = (file, cwd) => relative(cwd, file).replaceAll("\\", "/")
const production = (file) => /^(?:apps|src)\/.+\.(?:ts|tsx|js|jsx)$/.test(file)
    && !/\.(?:test|spec|int-spec|e2e-spec|harness-spec)\.[cm]?[jt]sx?$/.test(file)
export const resolveBase = (env, args) => env.COVERAGE_BASE_SHA ?? (args.includes("--base") ? args[args.indexOf("--base") + 1] : undefined)

export const lineCounts = (data) => {
    const lines = new Map()
    for (const [index, location] of Object.entries(data.statementMap ?? {})) {
        const line = location?.start?.line
        if (Number.isInteger(line)) lines.set(line, Math.max(lines.get(line) ?? 0, Number(data.s?.[index] ?? 0)))
    }
    return [...lines.values()]
}

const metric = (values) => ({
    total: values.length,
    covered: values.filter((value) => value > 0).length,
    pct: values.length ? values.filter((value) => value > 0).length / values.length * 100 : null,
})

export const buildPatchSummary = (report, changedFiles, cwd = process.cwd()) => {
    const changed = [...new Set(changedFiles.map((file) => normalize(resolve(cwd, file), cwd)).filter(production))]
    if (changed.length === 0) return {notApplicable: true, reason: "no changed production files"}
    const entries = new Map(Object.entries(report).map(([file, data]) => [normalize(file, cwd), data]))
    const missing = changed.filter((file) => !entries.has(file))
    if (missing.length) throw new Error(`Changed production files missing from coverage-final.json: ${missing.join(", ")}`)
    const files = changed.map((file) => entries.get(file))
    return {total: {
        statements: metric(files.flatMap((data) => Object.values(data.s ?? {}))),
        lines: metric(files.flatMap(lineCounts)),
        functions: metric(files.flatMap((data) => Object.values(data.f ?? {}))),
        branches: metric(files.flatMap((data) => Object.values(data.b ?? {}).flat())),
    }}
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
    const reportPath = "coverage/coverage-final.json"
    if (!existsSync(reportPath)) throw new Error(`Coverage report is missing: ${reportPath}`)
    const report = JSON.parse(readFileSync(reportPath, "utf8"))
    const base = resolveBase(process.env, process.argv)
    if (!base) throw new Error("Set COVERAGE_BASE_SHA or pass --base <merge-base-sha> to measure committed PR changes")
    const tracked = execFileSync("git", ["diff", "--name-only", base, "HEAD"], {encoding: "utf8"}).split(/\r?\n/)
    const summary = buildPatchSummary(report, tracked)
    writeFileSync("coverage/patch-summary.json", JSON.stringify(summary, null, 2) + "\n")
}
