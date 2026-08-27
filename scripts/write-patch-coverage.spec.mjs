import assert from "node:assert/strict"
import {spawnSync} from "node:child_process"
import {mkdirSync, mkdtempSync, writeFileSync} from "node:fs"
import {tmpdir} from "node:os"
import {dirname, join} from "node:path"
import test from "node:test"
import {fileURLToPath} from "node:url"
import {assertPatchThreshold, buildPatchSummary, lineCounts, resolveBase} from "./write-patch-coverage.mjs"

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

test("ignores a changed TypeScript module that emits no executable JavaScript", () => {
    const cwd = mkdtempSync(join(tmpdir(), "starci-patch-types-"))
    mkdirSync(join(cwd, "src"))
    writeFileSync(join(cwd, "src", "types.ts"), [
        "import type {Stats} from './stats'",
        "export interface Result { stats: Stats }",
        "export type Status = 'ready' | 'blocked'",
    ].join("\n"))
    assert.deepEqual(buildPatchSummary({}, ["src/types.ts"], cwd), {
        notApplicable: true,
        reason: "no changed executable production files",
    })
})

test("still fails when a missing changed TypeScript module emits runtime code", () => {
    const cwd = mkdtempSync(join(tmpdir(), "starci-patch-runtime-"))
    mkdirSync(join(cwd, "src"))
    writeFileSync(join(cwd, "src", "runtime.ts"), "export const answer = 42\n")
    assert.throws(() => buildPatchSummary({}, ["src/runtime.ts"], cwd), /missing from coverage-final/)
})

test("marks zero changed production files not applicable", () => {
    assert.deepEqual(buildPatchSummary({}, ["README.md", "src/example.spec.ts"], "C:/repo"), {
        notApplicable: true,
        reason: "no changed production files",
    })
})

test("excludes test-lane helpers from the production patch boundary", () => {
    assert.deepEqual(buildPatchSummary({}, ["src/tests/helpers/runtime.module.ts"], "C:/repo"), {
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

test("enforces every patch metric at the declared threshold", () => {
    const passing = {total: {
        statements: {pct: 90}, lines: {pct: 91}, functions: {pct: 92}, branches: {pct: 93},
    }}
    assert.equal(assertPatchThreshold(passing, 90), passing)
    assert.throws(() => assertPatchThreshold({total: {
        statements: {pct: 89}, lines: {pct: 90}, functions: {pct: 90}, branches: {pct: 90},
    }}, 90), /statements=89/)
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
