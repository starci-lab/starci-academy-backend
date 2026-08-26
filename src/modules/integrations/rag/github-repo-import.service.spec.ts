import {
    RagPlaygroundImportException,
} from "@modules/platform/exceptions/errors/rag-playground/import-failed"
import {
    GithubRepoImportService,
} from "./github-repo-import.service"

const response = (
    body: unknown,
    ok = true,
) => ({
    ok,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(String(body)),
})

describe("GithubRepoImportService",
    () => {
        afterEach(() => {
            jest.restoreAllMocks()
        })

        it("rejects non-GitHub URLs before making a network request",
            async () => {
                const fetchMock = jest.spyOn(globalThis,
                    "fetch")
                const service = new GithubRepoImportService()

                await expect(service.importRepo("https://evil.example.test/owner/repo"))
                    .rejects.toThrow(RagPlaygroundImportException)
                expect(fetchMock).not.toHaveBeenCalled()
            })

        it("rejects a GitHub URL without both owner and repository segments",
            async () => {
                const fetchMock = jest.spyOn(globalThis,
                    "fetch")
                const service = new GithubRepoImportService()

                await expect(service.importRepo("https://github.com/owner"))
                    .rejects.toThrow(RagPlaygroundImportException)
                expect(fetchMock).not.toHaveBeenCalled()
            })

        it("filters a public tree, sorts small files first, fetches in batches, and skips failed files",
            async () => {
                const entries = [
                    {
                        path: "src/large.ts", type: "blob", size: 1000
                    },
                    {
                        path: "README.md", type: "blob", size: 10
                    },
                    {
                        path: "src/app.ts", type: "blob", size: 20
                    },
                    {
                        path: "src/module.ts", type: "blob", size: 30
                    },
                    {
                        path: "src/extra.ts", type: "blob", size: 40
                    },
                    {
                        path: "src/fifth.ts", type: "blob", size: 50
                    },
                    {
                        path: "src/sixth.ts", type: "blob", size: 60
                    },
                    {
                        path: "src/seventh.ts", type: "blob", size: 70
                    },
                    {
                        path: "node_modules/skip.ts", type: "blob", size: 1
                    },
                    {
                        path: "image.png", type: "blob", size: 1
                    },
                    {
                        path: "src/folder", type: "tree", size: 1
                    },
                    {
                        path: "dist/generated.ts", type: "blob", size: 1
                    },
                    {
                        path: "src/huge.ts", type: "blob", size: 25000
                    },
                ]
                const fetchMock = jest.spyOn(globalThis,
                    "fetch")
                    .mockImplementation(async (input) => {
                        const url = String(input)
                        if (url.endsWith("/owner/repo")) {
                            return response({
                                default_branch: "main",
                                private: false,
                                size: 100,
                            }) as never
                        }
                        if (url.includes("/git/trees/main")) {
                            return response({
                                tree: entries
                            }) as never
                        }
                        if (url.endsWith("src/extra.ts")) {
                            return response("unavailable",
                                false) as never
                        }
                        if (url.endsWith("src/module.ts")) {
                            throw new Error("network reset")
                        }
                        return response(`content:${url}`) as never
                    })
                const service = new GithubRepoImportService()

                const documents = await service.importRepo("  https://github.com/owner/repo.git  ")

                expect(documents).toHaveLength(6)
                expect(documents[0]).toEqual(expect.objectContaining({
                    pageContent: expect.stringContaining("README.md"),
                    metadata: {
                        filePath: "README.md"
                    },
                }))
                expect(documents.some((document) => document.metadata.filePath === "node_modules/skip.ts")).toBe(false)
                expect(fetchMock.mock.calls[0][0]).toBe("https://api.github.com/repos/owner/repo")
                expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
                    headers: expect.objectContaining({
                        "User-Agent": "StarCi-RAG-Playground",
                    }),
                }))
            })

        it("rejects private or missing repositories and trees with no importable files",
            async () => {
                const fetchMock = jest.spyOn(globalThis,
                    "fetch")
                    .mockResolvedValue(response({
                        default_branch: "main",
                        private: true,
                        size: 1,
                    }) as never)
                const service = new GithubRepoImportService()

                await expect(service.importRepo("https://github.com/owner/private"))
                    .rejects.toThrow(RagPlaygroundImportException)

                fetchMock.mockReset()
                fetchMock
                    .mockResolvedValueOnce(response({
                        default_branch: "main",
                        private: false,
                        size: 1,
                    }) as never)
                    .mockResolvedValueOnce(response({
                        tree: [
                            {
                                path: "README.exe", type: "blob", size: 1
                            },
                        ]
                    }) as never)
                await expect(service.importRepo("https://github.com/owner/empty"))
                    .rejects.toThrow(RagPlaygroundImportException)
            })

        it("converts API failures and all raw-file failures into domain import errors",
            async () => {
                const fetchMock = jest.spyOn(globalThis,
                    "fetch")
                    .mockRejectedValue(new Error("GitHub unavailable"))
                const service = new GithubRepoImportService()

                await expect(service.importRepo("https://github.com/owner/down"))
                    .rejects.toThrow(RagPlaygroundImportException)

                fetchMock.mockReset()
                fetchMock
                    .mockResolvedValueOnce(response({
                        default_branch: "main",
                        private: false,
                        size: 1,
                    }) as never)
                    .mockResolvedValueOnce(response({
                        tree: [
                            {
                                path: "src/app.ts", type: "blob", size: 1
                            },
                        ]
                    }) as never)
                    .mockRejectedValueOnce(new Error("raw unavailable"))
                await expect(service.importRepo("https://github.com/owner/raw-down"))
                    .rejects.toThrow(RagPlaygroundImportException)
            })

        it("rejects a successful repository response whose tree has no importable entries",
            async () => {
                const fetchMock = jest.spyOn(globalThis,
                    "fetch")
                    .mockResolvedValueOnce(response({
                        default_branch: "main",
                        private: false,
                        size: 1,
                    }) as never)
                    .mockResolvedValueOnce(response({
                    }) as never)
                const service = new GithubRepoImportService()

                await expect(service.importRepo("https://github.com/owner/no-tree"))
                    .rejects.toThrow(RagPlaygroundImportException)
                expect(fetchMock).toHaveBeenCalledTimes(2)
            })
    })
