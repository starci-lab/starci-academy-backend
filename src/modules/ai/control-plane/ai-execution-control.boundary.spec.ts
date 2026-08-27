import {
    readdirSync,
    readFileSync,
} from "node:fs"
import {
    resolve,
} from "node:path"

const PRODUCTION_COMPOSITION_ROOTS = [
    "apps/core/src/app.module.ts",
    "src/modules/ai/ai.module.ts",
    "src/features/api/processors/processors.module.ts",
]

const ALLOWED_CONTROL_AUTHORITY = [
    "src/modules/ai/control-plane/",
    "src/modules/databases/postgresql/primary/entities/ai-execution.entity.ts",
    "src/modules/databases/postgresql/primary/entities/ai-runtime-control.entity.ts",
    "src/modules/databases/postgresql/primary/entities/ai-runtime-incarnation.entity.ts",
    "src/modules/databases/postgresql/primary/migrations/1787900000000-CreateAiExecutionControlFoundation",
    "src/modules/databases/postgresql/primary/primary.module.ts",
    "src/tests/",
]

function collectTypeScriptFiles(directory: string): Array<string> {
    return readdirSync(directory,
        {
            withFileTypes: true,
        }).flatMap((entry) => {
        const path = `${directory}/${entry.name}`
        if (entry.isDirectory()) {
            return collectTypeScriptFiles(path)
        }
        return entry.isFile() && path.endsWith(".ts")
            ? [path]
            : []
    })
}

describe("Slice 00 production boundary",
    () => {
        it.each(PRODUCTION_COMPOSITION_ROOTS)("does not activate the control module from %s",
            (sourcePath) => {
                const source = readFileSync(resolve(sourcePath),
                    "utf8")
                expect(source).not.toContain("AiExecutionControlModule")
                expect(source).not.toContain("AiExecutionControlService")
            })

        it("keeps the control module free of public transports and providers",
            () => {
                const source = readFileSync(resolve("src/modules/ai/control-plane/ai-execution-control.module.ts"),
                    "utf8")
                expect(source).not.toMatch(/GraphQL|Resolver|Gateway|Bull|Qdrant|OpenAI|Anthropic/)
            })

        it("detects every import or raw DML reference outside the closed authority",
            () => {
                const references = [
                    ...collectTypeScriptFiles("src"),
                    ...collectTypeScriptFiles("apps"),
                ].filter((sourcePath) => !ALLOWED_CONTROL_AUTHORITY.some(
                    (allowedPath) => sourcePath.replaceAll("\\",
                        "/").startsWith(allowedPath),
                )).filter((sourcePath) => {
                    const source = readFileSync(resolve(sourcePath),
                        "utf8")
                    return /AiExecutionControl(?:Module|Service)|(?:public\.)?ai_(?:executions|runtime_control|runtime_incarnations)/.test(source)
                })

                expect(references).toEqual([])
            })
    })
