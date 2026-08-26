import {
    RepoSynchronizerService
} from "./repo-synchronizer.service"
import {
    envConfig
} from "@modules/platform/env/config"
import * as fsp from "node:fs/promises"
jest.mock("node:fs/promises",
    () => ({
        readdir: jest.fn(),
        readFile: jest.fn(),
    }))
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn()
    }))
describe("RepoSynchronizerService",
    () => {
        afterEach(() => {
            jest.restoreAllMocks()
        })

        it("uploads a walked public lesson and advances to the next row",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    s3: {
                        minio: {
                            bucket: "academy"
                        }
                    }
                } as ReturnType<typeof envConfig>)
                const content = {
                    id: "content-1",
                    displayId: "lesson-1",
                    githubBaseUrl: "https://github.com/acme/course",
                    githubDir: "lesson",
                    isPremium: false,
                }
                const findOne = jest.fn()
                    .mockResolvedValueOnce(content)
                    .mockResolvedValueOnce(null)
                const bucket = {
                    ensurePublicReadPrefixes: jest.fn().mockResolvedValue(undefined),
                }
                const upload = {
                    json: jest.fn().mockResolvedValue(undefined),
                }
                const names = {
                    repo: jest.fn().mockReturnValue("repo/course/lesson.json"),
                }
                const service = new RepoSynchronizerService({
                    now: jest.fn().mockReturnValue({
                        diff: jest.fn().mockReturnValue(1),
                    }),
                } as never,
{
    log: jest.fn(),
} as never,
{
    findOne
} as never,
upload as never,
            names as never,
bucket as never)
                const privateService = service as unknown as {
                walkDir: jest.Mock,
            }
                privateService.walkDir = jest.fn().mockResolvedValue({
                    "/src/index.ts": {
                        code: "export default 1",
                    },
                })

                await service.sync({
                } as never)

                expect(privateService.walkDir).toHaveBeenCalledWith(
                    expect.stringContaining(".repo"),
                    expect.stringContaining(".repo"),
                )
                expect(names.repo).toHaveBeenCalledWith("course",
                    "lesson")
                expect(upload.json).toHaveBeenCalledWith(expect.objectContaining({
                    acl: "public-read",
                    name: "repo/course/lesson.json",
                    payload: {
                        "/src/index.ts": {
                            code: "export default 1",
                        },
                    },
                }))
                expect(findOne).toHaveBeenCalledTimes(2)
            })

        it("skips content outside the selected module scope",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    s3: {
                        minio: {
                            bucket: "academy",
                        },
                    },
                } as ReturnType<typeof envConfig>)
                const findOne = jest.fn()
                    .mockResolvedValueOnce({
                        id: "content-outside",
                        module: {
                            orderIndex: 2,
                            course: {
                                displayId: "course-one",
                            },
                        },
                    })
                    .mockResolvedValueOnce(null)
                const bucket = {
                    ensurePublicReadPrefixes: jest.fn().mockResolvedValue(undefined),
                }
                const upload = {
                    json: jest.fn(),
                }
                const service = new RepoSynchronizerService({
                    now: jest.fn().mockReturnValue({
                        diff: jest.fn().mockReturnValue(1),
                    }),
                } as never,
{
    log: jest.fn()
} as never,
{
    findOne
} as never,
                upload as never,
{
} as never,
bucket as never)

                await service.sync({
                    moduleIndexFilterByDisplayId: new Map([["course-one",
                        new Set([1])]]),
                } as never)

                expect(upload.json).not.toHaveBeenCalled()
                expect(findOne).toHaveBeenCalledTimes(2)
            })

        it("walks nested text files while skipping directories and binary files",
            async () => {
                const makeEntry = (name: string, directory: boolean) => ({
                    name,
                    isDirectory: () => directory,
                })
                jest.mocked(fsp.readdir)
                    .mockResolvedValueOnce([
                        makeEntry("src",
                            true),
                        makeEntry("node_modules",
                            true),
                        makeEntry("logo.png",
                            false),
                    ] as never)
                    .mockResolvedValueOnce([
                        makeEntry("main.ts",
                            false),
                    ] as never)
                jest.mocked(fsp.readFile).mockResolvedValue("const answer = 42")
                const service = new RepoSynchronizerService({
                } as never,
{
} as never,
                {
                } as never,
{
} as never,
{
} as never,
{
} as never)
                const privateService = service as unknown as {
                    walkDir: (dirPath: string, baseDir: string) => Promise<Record<string, { code: string }>>,
                }

                await expect(privateService.walkDir("/repo",
                    "/repo")).resolves.toEqual({
                    "/src/main.ts": {
                        code: "const answer = 42",
                    },
                })
                expect(fsp.readFile).toHaveBeenCalledTimes(1)
            })

        it("logs a failed lesson without aborting the synchronization",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    s3: {
                        minio: {
                            bucket: "academy"
                        }
                    }
                } as ReturnType<typeof envConfig>)
                const content = {
                    id: "content-2",
                    displayId: "lesson-2",
                    githubBaseUrl: "https://github.com/acme/course",
                    githubDir: "lesson-2",
                    isPremium: true,
                }
                const findOne = jest.fn()
                    .mockResolvedValueOnce(content)
                    .mockResolvedValueOnce(null)
                const log = jest.fn()
                const bucket = {
                    ensurePublicReadPrefixes: jest.fn().mockResolvedValue(undefined),
                }
                const service = new RepoSynchronizerService({
                    now: jest.fn().mockReturnValue({
                        diff: jest.fn().mockReturnValue(1),
                    }),
                } as never,
{
    log
} as never,
{
    findOne
} as never,
                {
                    json: jest.fn()
                } as never,
{
    repo: jest.fn()
} as never,
                bucket as never)
                const privateService = service as unknown as {
                    walkDir: jest.Mock,
                }
                privateService.walkDir = jest.fn().mockRejectedValue(new Error("missing repo"))

                await expect(service.sync({
                } as never)).resolves.toBeUndefined()

                expect(log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        contentId: "content-2",
                        errorMessage: "missing repo",
                    }))
                expect(log).toHaveBeenCalledTimes(2)
            })

        it("ensures public prefixes and exits when there are no repo-backed contents",
            async () => { jest.mocked(envConfig).mockReturnValue({
                s3: {
                    minio: {
                        bucket: "academy"
                    }
                }
            } as ReturnType<typeof envConfig>); const findOne = jest.fn().mockResolvedValue(null); const bucket = {
                ensurePublicReadPrefixes: jest.fn().mockResolvedValue(undefined)
            }; const service = new RepoSynchronizerService({
                now: jest.fn().mockReturnValue({
                    diff: jest.fn().mockReturnValue(1)
                })
            } as never,
{
    log: jest.fn()
} as never,
{
    findOne
} as never,
{
} as never,
{
} as never,
bucket as never); await expect(service.sync({
} as never)).resolves.toBeUndefined(); expect(bucket.ensurePublicReadPrefixes).toHaveBeenCalledWith("academy"); expect(findOne).toHaveBeenCalled() }) })
