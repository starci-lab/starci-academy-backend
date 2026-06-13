/* eslint-disable */
// Standalone parse check for the new AI/LLM course content.
// Reuses the REAL ExtractJsonFromMdService grammar (no aliases needed).
import * as fs from "fs"
import * as path from "path"
import { ExtractJsonFromMdService } from "../src/modules/init/seeders/shared/extracts/extract-json-from-md.service"

const svc = new ExtractJsonFromMdService()
const root = path.resolve(
    __dirname,
    "../.mount/data/courses/3-ai-llm-engineering",
)

const read = (rel: string): string =>
    fs.readFileSync(path.join(root, rel), "utf8")

let failures = 0
const check = (label: string, cond: boolean, extra?: unknown): void => {
    if (cond) {
        console.log(`  PASS  ${label}`)
    } else {
        failures += 1
        console.log(`  FAIL  ${label}`, extra ?? "")
    }
}

// 1. Course root
const course = svc.extract(read("en.md"))
console.log("[course en.md]")
check("title present", course.title === "AI / LLM Engineering", course.title)
check("prerequisites is array of 3", Array.isArray(course.prerequisites) && (course.prerequisites as any[]).length === 3, course.prerequisites)
check("qnas[0] has question+answer", !!(course.qnas as any)?.[0]?.question && !!(course.qnas as any)?.[0]?.answer)

// 2. Module M0
const m0 = svc.extract(read("modules/0-llm-and-the-api/en.md"))
console.log("[M0 module en.md]")
check("module title", m0.title === "LLM & the API", m0.title)
check("contentType foundation", m0.contentType === "foundation", m0.contentType)
check("previewContents array of 4", Array.isArray(m0.previewContents) && (m0.previewContents as any[]).length === 4)

// 3. Lessons — verify V2 marker + body is a single verbatim leaf (NOT parsed into sub-objects)
const lessons = [
    "modules/0-llm-and-the-api/contents/0-what-is-an-llm",
    "modules/0-llm-and-the-api/contents/1-calling-the-model-api",
    "modules/0-llm-and-the-api/contents/2-sampling-and-parameters",
    "modules/0-llm-and-the-api/contents/3-token-economics-and-cost",
    "modules/1-prompt-engineering/contents/0-anatomy-of-a-prompt",
    "modules/1-prompt-engineering/contents/1-few-shot-and-chain-of-thought",
    "modules/1-prompt-engineering/contents/2-prompt-templates-and-variables",
    "modules/1-prompt-engineering/contents/3-prompt-anti-patterns-and-failure-modes",
]
for (const lesson of lessons) {
    for (const locale of ["en", "vi"]) {
        const j = svc.extract(read(`${lesson}/${locale}.md`))
        const tag = `[${lesson}/${locale}.md]`
        check(`${tag} title is string`, typeof j.title === "string" && (j.title as string).length > 0, j.title)
        check(`${tag} verified date parses`, !Number.isNaN(Date.parse(j.verified as string)), j.verified)
        check(`${tag} body is verbatim string (not object)`, typeof j.body === "string" && (j.body as string).includes("##"), typeof j.body)
        check(`${tag} body has no stray top keys`, !("Role" in j) && !("temperature" in j) && !("1. Role (who the model is)" in j), Object.keys(j))
    }
}

// 4. Bodies (per-language) for M0 L1
for (const lang of ["0-typescript", "1-python"]) {
    for (const locale of ["en", "vi"]) {
        const rel = `modules/0-llm-and-the-api/contents/1-calling-the-model-api/bodies/${lang}/${locale}.md`
        const j = svc.extract(read(rel))
        const tag = `[${rel}]`
        check(`${tag} lang present`, typeof j.lang === "string" && (j.lang as string).length > 0, j.lang)
        check(`${tag} body verbatim`, typeof j.body === "string" && (j.body as string).includes("```"), typeof j.body)
    }
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
