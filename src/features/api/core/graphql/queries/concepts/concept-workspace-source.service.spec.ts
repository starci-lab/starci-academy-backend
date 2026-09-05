import {
    mkdir,
    mkdtemp,
    rm,
    writeFile,
} from "node:fs/promises"
import {
    tmpdir,
} from "node:os"
import {
    join,
} from "node:path"
import {
    ConceptWorkspaceSourceService,
} from "./concept-workspace-source.service"

describe("ConceptWorkspaceSourceService",
    () => {
        const originalContextRoot = process.env.CONTEXT_1_URL
        let root: string
        const sha = "a".repeat(40)

        beforeEach(async () => {
            root = await mkdtemp(join(tmpdir(),
                "concept-source-"))
            process.env.CONTEXT_1_URL = root
            const workspace = join(root,
                sha,
                "concepts",
                "0-request-lifecycle",
                "workspace")
            await mkdir(workspace,
                {
                    recursive: true,
                })
            await writeFile(join(root,
                "manifest.json"),
            JSON.stringify({
                snapshots: [{
                    sha,
                    pulledAt: new Date(0).toISOString(),
                }],
            }))
            await writeFile(join(workspace,
                "source.ts"),
            "export const trace = true\n")
            await writeFile(join(workspace,
                "source.test.ts"),
            "test('trace', () => trace)\n")
        })

        afterEach(async () => {
            if (originalContextRoot === undefined) {
                delete process.env.CONTEXT_1_URL
            } else {
                process.env.CONTEXT_1_URL = originalContextRoot
            }
            await rm(root,
                {
                    recursive: true,
                    force: true,
                })
        })

        it("reads only listed public workspace roles from the committed snapshot",
            async () => {
                const service = new ConceptWorkspaceSourceService()
                const concept = {
                    displayId: "request-lifecycle",
                    orderIndex: 0,
                }
                await expect(service.read(concept,
                    {
                        path: "workspace/source.ts",
                        role: "source",
                    })).resolves.toContain("trace = true")
                await expect(service.read(concept,
                    {
                        path: "workspace/source.test.ts",
                        role: "test",
                    })).resolves.toContain("test('trace'")
                await expect(service.read(concept,
                    {
                        path: "workspace/source.ts",
                        role: "checks" as never,
                    })).resolves.toBeNull()
            })

        it("rejects traversal and absolute paths before reading",
            async () => {
                const service = new ConceptWorkspaceSourceService()
                const concept = {
                    displayId: "request-lifecycle",
                    orderIndex: 0,
                }
                await expect(service.read(concept,
                    {
                        path: "workspace/../../manifest.json",
                        role: "source",
                    })).resolves.toBeNull()
                await expect(service.read(concept,
                    {
                        path: join(root,
                            "manifest.json"),
                        role: "source",
                    })).resolves.toBeNull()
                await expect(service.read(concept,
                    {
                        path: "workspace/source.ts:private",
                        role: "source",
                    })).resolves.toBeNull()
            })
    })
