/**
 * Measure every `.claudev2` backend rule against this repository.
 *
 *   node scripts/measure-canon-rules.mjs
 *
 * Canon's own procedure is to MEASURE a rule before choosing its level, and to measure it with the
 * rule itself rather than with a grep. Two things this script does are the reason it exists rather
 * than a one-liner:
 *
 *   - It counts ONLY reports carrying the rule's own id. Inline `eslint-disable` comments in the
 *     source refer to rules a minimal config never loads, and eslint reports each of those as a
 *     problem of its own - which silently inflated every count here by the same seven files.
 *   - It scopes each rule to the files it governs, so a per-suffix rule is not reported as a
 *     fraction of the whole tree.
 */
import { Linter } from "eslint"
import tsParser from "@typescript-eslint/parser"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { handlerOverridesProcess, messageCarriesParamsOnly } from "../.claude/sources/be/cqrs.mjs"
import { e2eAssertsPersistedState, noCallOnlySpec, noModelCallInE2e } from "../.claude/sources/be/testing.mjs"
import {
    mustInjectEntityManager,
    noInjectedRepository,
    requireEntityTableName,
} from "../.claude/sources/be/data-access.mjs"
import {
    exceptionExtendsAbstract,
    exceptionInErrorsFolder,
    requireExceptionObjectArg,
    throwAbstractException,
} from "../.claude/sources/be/exceptions.mjs"
import {
    noFrameworkLogger,
    noInterpolatedLogMessage,
    standaloneProgramGlobs,
} from "../.claude/sources/be/observability.mjs"
import { noConstEnum, noDoubleCast, noInlineParamType } from "../.claude/sources/be/type-safety.mjs"
import { noNonAsciiSource, requireEnumMemberJsdoc, requireExportJsdoc } from "../.claude/sources/be/comments.mjs"
import { mustDeepModuleImport, noSelfModuleAlias } from "../.claude/sources/be/module-layering.mjs"

const ROOT = join(process.cwd(), "src").replace(/\\/g, "/")

/** Every `.ts` file under `src/`, forward-slashed. */
const walk = (dir, out = []) => {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name).replace(/\\/g, "/")
        if (statSync(path).isDirectory()) walk(path, out)
        else if (path.endsWith(".ts")) out.push(path)
    }
    return out
}

const files = walk(ROOT)
const linter = new Linter()

/** Suffix predicates, so each rule is measured against the files it actually governs. */
const isHandler = (file) => file.endsWith(".handler.ts")
const isMessage = (file) => /\.(?:command|query)\.ts$/.test(file)
const isUnitSpec = (file) => /\.spec\.ts$/.test(file) && !/\.(?:e2e|int|harness)-spec\.ts$/.test(file)
const isE2e = (file) => file.endsWith(".e2e-spec.ts")
const everything = () => true

/**
 * Run one rule over the files it governs.
 *
 * @param rule - The rule module.
 * @param ruleName - Its published name.
 * @param governs - Predicate selecting the files it applies to.
 * @returns The offending files, each with the message.
 */
const run = (rule, ruleName, governs) => {
    const targets = files.filter(governs)
    const offenders = []
    for (const file of targets) {
        let messages = []
        try {
            messages = linter.verify(readFileSync(file, "utf8"), [
                {
                    files: ["**/*.ts"],
                    languageOptions: { parser: tsParser, ecmaVersion: 2022, sourceType: "module" },
                    plugins: { local: { rules: { [ruleName]: rule } } },
                    rules: { [`local/${ruleName}`]: "error" },
                },
            ], file)
        } catch (error) {
            offenders.push({ file, message: `PARSE: ${error.message.slice(0, 70)}` })
            continue
        }
        for (const message of messages) {
            if (message.ruleId !== `local/${ruleName}`) continue
            offenders.push({ file: file.replace(`${ROOT}/`, ""), message: message.message.slice(0, 100) })
        }
    }
    const verdict = offenders.length === 0 ? "error (no=0)" : `warn (no=${offenders.length})`
    console.log(`\n== ${ruleName} ==  governs ${targets.length}  offenders ${offenders.length}  -> ${verdict}`)
    for (const hit of offenders) console.log(`   ${hit.file}\n     ${hit.message}`)
    return offenders.length
}

let debt = 0
debt += run(mustInjectEntityManager, "must-inject-entity-manager", everything)
debt += run(noInjectedRepository, "no-injected-repository", everything)
debt += run(requireEntityTableName, "require-entity-table-name", everything)
debt += run(handlerOverridesProcess, "handler-overrides-process", isHandler)
debt += run(messageCarriesParamsOnly, "message-carries-params-only", isMessage)
debt += run(noCallOnlySpec, "no-call-only-spec", isUnitSpec)
debt += run(e2eAssertsPersistedState, "e2e-asserts-persisted-state", isE2e)
debt += run(noModelCallInE2e, "no-model-call-in-e2e", isE2e)
debt += run(throwAbstractException, "throw-abstract-exception", (file) => !isUnitSpec(file) && !/\/src\/tests\//.test(file))
debt += run(requireExceptionObjectArg, "require-exception-object-arg", everything)
debt += run(exceptionExtendsAbstract, "exception-extends-abstract", everything)
debt += run(exceptionInErrorsFolder, "exception-in-errors-folder", everything)
/**
 * The observability exit, applied from the law module's own list rather than restated here.
 *
 * A standalone agent has no request to correlate, so the house logging service would give it a
 * dependency and nothing else. Two copies of an exemption is how one of them silently grows, so the
 * globs live beside the rule and this gate reads them.
 */
const isStandaloneProgram = (file) =>
    standaloneProgramGlobs.some((glob) => {
        const pattern = new RegExp(`/${glob.replace(/\*\*/g, ".*").replace(/(?<!\.)\*/g, "[^/]*")}$`.replace("/.*$", "/.*"))
        return pattern.test(file)
    })

debt += run(noFrameworkLogger, "no-framework-logger", (file) => !isStandaloneProgram(file))
debt += run(noInterpolatedLogMessage, "no-interpolated-log-message", everything)
debt += run(noDoubleCast, "no-double-cast", everything)
debt += run(noInlineParamType, "no-inline-param-type", everything)
debt += run(noConstEnum, "no-const-enum", everything)
debt += run(requireExportJsdoc, "require-export-jsdoc", everything)
debt += run(requireEnumMemberJsdoc, "require-enum-member-jsdoc", everything)
debt += run(noNonAsciiSource, "no-non-ascii-source", everything)
debt += run(mustDeepModuleImport, "must-deep-module-import", everything)
debt += run(noSelfModuleAlias, "no-self-module-alias", everything)

console.log(`\nTOTAL DEBT: ${debt}`)
