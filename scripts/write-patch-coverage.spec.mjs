import assert from "node:assert/strict"
import {spawnSync} from "node:child_process"
import {mkdirSync, mkdtempSync, writeFileSync} from "node:fs"
import {tmpdir} from "node:os"
import {dirname, join} from "node:path"
import test from "node:test"
import {fileURLToPath} from "node:url"
import {buildPatchSummary, lineCounts, resolveBase} from "./write-patch-coverage.mjs"

const file = (name, statementMap, statements) => ({[name]: {statementMap, s: statements, f: {0: statements[0]}, b: {0: statements}}})

test("normalizes absolute Istanbul keys and uses statement start lines", () => {
    const report = file("C:/repo/src/changed.ts", {
        0: {start: {line: 4}, end: {line: 4}},
        1: {start: {line: 4}, end: {line: 4}},
        2: {start: {line: 8}, end: {line: 8}},
    }, [1, 0, 0])
    const summary = buildPatchSummary(report, ["src/changed.ts"], "C:/repo")
    assert.deepEqual(summary.total.lines, {total: 2, covered: 1, pct: 50})
    assert.deepEqual(lineCounts(report["C:/repo/src/changed.ts"]), [1, 0])
})

test("fails when a changed production file is absent", () => {
    assert.throws(() => buildPatchSummary({}, ["src/missing.ts"], "C:/repo"), /missing from coverage-final/)
})

test("marks zero changed production files not applicable", () => {
    assert.deepEqual(buildPatchSummary({}, ["README.md", "src/example.spec.ts"], "C:/repo"), {
        notApplicable: true,
        reason: "no changed production files",
    })
})

test("fails uncovered changed lines instead of synthesizing 100 percent", () => {
    const report = file("C:/repo/src/changed.ts", {
        0: {start: {line: 1}, end: {line: 1}},
    }, [0])
    assert.equal(buildPatchSummary(report, ["src/changed.ts"], "C:/repo").total.lines.pct, 0)
})

test("requires an explicit coverage base", () => {
    assert.equal(resolveBase({}, ["node", "script"]), undefined)
    assert.equal(resolveBase({}, ["node", "script", "--base", "abc123"]), "abc123")
    assert.equal(resolveBase({COVERAGE_BASE_SHA: "envsha"}, []), "envsha")
})

test("the CLI executes on this platform and refuses a missing base", () => {
    const cwd = mkdtempSync(join(tmpdir(), "starci-patch-cli-"))
    mkdirSync(join(cwd, "coverage"))
    writeFileSync(join(cwd, "coverage", "coverage-final.json"), "{}")
    const script = join(dirname(fileURLToPath(import.meta.url)), "write-patch-coverage.mjs")
    const result = spawnSync(process.execPath, [script], {cwd, encoding: "utf8", env: {}})
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /COVERAGE_BASE_SHA/)
})
