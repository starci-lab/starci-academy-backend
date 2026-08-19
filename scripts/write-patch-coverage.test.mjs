import assert from "node:assert/strict"
import test from "node:test"
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
    assert.deepEqual(buildPatchSummary({}, ["README.md"], "C:/repo"), {
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
