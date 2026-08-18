import {
    existsSync,
} from "fs"
import {
    cp,
    mkdir,
    mkdtemp,
    readdir,
    readFile,
    rm,
    writeFile,
} from "fs/promises"
import {
    join,
} from "path"
import * as tar from "tar"
import {
    Octokit,
} from "octokit"
import {
    ContextType,
} from "@modules/platform/env/enums/context"
import {
    DataGitBootstrapException,
} from "@modules/platform/exceptions/errors/init/data-git-bootstrap"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import type {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import type {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    DataGitBootstrapService,
} from "./data-git.service"
import {
    DATA_GIT_MANIFEST_FILE,
    DATA_GIT_MAX_SNAPSHOTS,
} from "./constants"
import {
    diffSnapshots,
} from "./utils/diff-snapshots"
import type {
    EnsureDataGitResult,
} from "./types/data-git"

// every boundary this service touches is stubbed: GitHub, the filesystem, the
// tarball extractor, the snapshot differ and the env tree
jest.mock("octokit",
    () => ({
        Octokit: jest.fn(),
    }))

jest.mock("fs",
    () => ({
        ...jest.requireActual("fs"),
        existsSync: jest.fn(),
    }))

jest.mock("fs/promises",
    () => ({
        ...jest.requireActual("fs/promises"),
        cp: jest.fn(),
        mkdir: jest.fn(),
        mkdtemp: jest.fn(),
        readdir: jest.fn(),
        readFile: jest.fn(),
        rm: jest.fn(),
        writeFile: jest.fn(),
    }))

jest.mock("tar",
    () => ({
        x: jest.fn(),
    }))

jest.mock("./utils/diff-snapshots",
    () => ({
        diffSnapshots: jest.fn(),
    }))

jest.mock("@modules/platform/env/config",
    () => {
        const actual = jest.requireActual("@modules/platform/env/config")
        return {
            ...actual,
            envConfig: () => {
                const real = actual.envConfig()
                return {
                    ...real,
                    // the spec's own mutable knobs, installed by `setEnv` below
                    ...(globalThis as unknown as {
                        __dataGitEnv: Record<string, unknown>
                    }).__dataGitEnv,
                }
            },
        }
    })

/** Data-sources root every test resolves to. */
const DATASOURCES_ROOT = join("/srv",
    "contexts")
/** Remote tip SHA the fake GitHub answers with. */
const REMOTE_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
/** Previous snapshot SHA used by the diff-mode tests. */
const PREVIOUS_SHA = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
/** Temp dir the stubbed `mkdtemp` hands back. */
const TEMP_DIR = join("/tmp",
    "data-git-xyz")

const existsSyncMock = existsSync as jest.MockedFunction<typeof existsSync>
const readFileMock = readFile as jest.MockedFunction<typeof readFile>
const writeFileMock = writeFile as jest.MockedFunction<typeof writeFile>
const readdirMock = readdir as jest.MockedFunction<typeof readdir>
const rmMock = rm as jest.MockedFunction<typeof rm>
const mkdirMock = mkdir as jest.MockedFunction<typeof mkdir>
const mkdtempMock = mkdtemp as jest.MockedFunction<typeof mkdtemp>
const cpMock = cp as jest.MockedFunction<typeof cp>
const tarExtractMock = tar.x as unknown as jest.Mock
const diffSnapshotsMock = diffSnapshots as jest.MockedFunction<typeof diffSnapshots>
const OctokitMock = Octokit as unknown as jest.Mock

describe("DataGitBootstrapService",
    () => {
        let service: DataGitBootstrapService
        let winstonService: {
            log: jest.Mock
        }
        let mountFilesystemService: {
            dataGitToken: jest.Mock
        }
        let getBranch: jest.Mock
        let getRepo: jest.Mock
        let downloadTarballArchive: jest.Mock
        /** Absolute paths the fake filesystem reports as existing. */
        let present: Set<string>

        /**
         * Install the env knobs this spec's `envConfig` mock merges over the real tree.
         *
         * @param dataGit - `dataGit` overrides (owner/repo/ref/subdir)
         * @param contexts - The filesystem contexts `resolveDatasourcesRoot` walks
         */
        const setEnv = (
            dataGit: {
                ref?: string
                subdir?: string
            } = {
            },
            contexts?: Array<{
                enabled: boolean
                type: ContextType
                path: string
            }>,
        ): void => {
            (globalThis as unknown as {
                __dataGitEnv: Record<string, unknown>
            }).__dataGitEnv = {
                dataGit: {
                    owner: "starci-lab",
                    repo: "data",
                    ref: "main",
                    subdir: "",
                    ...dataGit,
                },
                contexts: contexts ?? [
                    {
                        enabled: false,
                        type: ContextType.S3,
                        path: "https://cdn.example.com",
                    },
                    {
                        enabled: true,
                        type: ContextType.Filesystem,
                        path: DATASOURCES_ROOT,
                    },
                ],
            }
        }

        /**
         * Seed the fake manifest read by {@link DataGitBootstrapService}.
         *
         * @param body - Raw manifest file contents, or `null` for "no manifest"
         */
        const setManifest = (body: string | null): void => {
            const manifestPath = join(DATASOURCES_ROOT,
                DATA_GIT_MANIFEST_FILE)
            if (body === null) {
                present.delete(manifestPath)
                return
            }
            present.add(manifestPath)
            readFileMock.mockResolvedValue(body)
        }

        beforeEach(() => {
            jest.clearAllMocks()
            present = new Set()
            setEnv()

            existsSyncMock.mockImplementation((path) => present.has(String(path)))
            readFileMock.mockResolvedValue("{\"snapshots\":[]}")
            writeFileMock.mockResolvedValue(undefined)
            mkdirMock.mockResolvedValue(undefined)
            rmMock.mockResolvedValue(undefined)
            cpMock.mockResolvedValue(undefined)
            mkdtempMock.mockResolvedValue(TEMP_DIR)
            readdirMock.mockResolvedValue([
                "courses",
                "coding-problems",
            ] as unknown as Awaited<ReturnType<typeof readdir>>)
            tarExtractMock.mockResolvedValue(undefined)
            diffSnapshotsMock.mockResolvedValue([])

            getBranch = jest.fn().mockResolvedValue({
                data: {
                    commit: {
                        sha: REMOTE_SHA,
                    },
                },
            })
            getRepo = jest.fn().mockResolvedValue({
                data: {
                    default_branch: "trunk",
                },
            })
            downloadTarballArchive = jest.fn().mockResolvedValue({
                data: new ArrayBuffer(8),
            })
            OctokitMock.mockImplementation(() => ({
                rest: {
                    repos: {
                        get: getRepo,
                        getBranch,
                        downloadTarballArchive,
                    },
                },
            }))

            winstonService = {
                log: jest.fn(),
            }
            mountFilesystemService = {
                dataGitToken: jest.fn(() => "  gh-token  "),
            }

            service = new DataGitBootstrapService(
                mountFilesystemService as unknown as MountFilesystemService,
                winstonService as unknown as WinstonService,
            )
        })

        describe("ensure",
            () => {
                it("downloads into a new snapshot on a first pull and reports no diff",
                    async () => {
                        const result = await service.ensure()

                        expect(result).toEqual({
                            changed: true,
                            sha: REMOTE_SHA,
                            previousSha: "",
                            changedPaths: [],
                            diffAvailable: false,
                            snapshotRoot: join(DATASOURCES_ROOT,
                                REMOTE_SHA),
                            datasourcesRoot: DATASOURCES_ROOT,
                            tempDir: TEMP_DIR,
                        })
                        expect(diffSnapshotsMock).not.toHaveBeenCalled()
                        expect(tarExtractMock).toHaveBeenCalledWith({
                            file: join(TEMP_DIR,
                                "repo.tar.gz"),
                            cwd: join(TEMP_DIR,
                                "extracted"),
                            strip: 1,
                        })
                        // the extracted tree replaces any stale dir for this SHA
                        expect(rmMock).toHaveBeenCalledWith(
                            join(DATASOURCES_ROOT,
                                REMOTE_SHA),
                            {
                                recursive: true,
                                force: true,
                            },
                        )
                        expect(cpMock).toHaveBeenCalledWith(
                            join(TEMP_DIR,
                                "extracted"),
                            join(DATASOURCES_ROOT,
                                REMOTE_SHA),
                            {
                                recursive: true,
                            },
                        )
                    })

                it("authenticates with the trimmed data-git token",
                    async () => {
                        await service.ensure()

                        expect(OctokitMock).toHaveBeenCalledWith({
                            auth: "gh-token",
                        })
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.DataGitBootstrapStarted,
                            {
                                owner: "starci-lab",
                                repo: "data",
                                ref: "main",
                            },
                        )
                    })

                it("resolves the repo default branch when no ref is configured",
                    async () => {
                        setEnv({
                            ref: "",
                        })

                        await service.ensure()

                        expect(getRepo).toHaveBeenCalledWith({
                            owner: "starci-lab",
                            repo: "data",
                        })
                        expect(getBranch).toHaveBeenCalledWith({
                            owner: "starci-lab",
                            repo: "data",
                            branch: "trunk",
                        })
                    })

                it("extracts from the configured sub-directory when one is set",
                    async () => {
                        setEnv({
                            subdir: "content",
                        })

                        await service.ensure()

                        expect(cpMock).toHaveBeenCalledWith(
                            join(TEMP_DIR,
                                "extracted",
                                "content"),
                            join(DATASOURCES_ROOT,
                                REMOTE_SHA),
                            {
                                recursive: true,
                            },
                        )
                    })

                it("short-circuits when the newest snapshot already holds the remote SHA",
                    async () => {
                        setManifest(JSON.stringify({
                            snapshots: [
                                {
                                    sha: REMOTE_SHA,
                                    pulledAt: "2026-01-01T00:00:00.000Z",
                                },
                            ],
                        }))
                        const snapshotRoot = join(DATASOURCES_ROOT,
                            REMOTE_SHA)
                        present.add(snapshotRoot)
                        present.add(join(snapshotRoot,
                            "courses"))

                        const result = await service.ensure()

                        expect(result).toEqual({
                            changed: false,
                            sha: REMOTE_SHA,
                            previousSha: REMOTE_SHA,
                            changedPaths: [],
                            diffAvailable: false,
                            snapshotRoot,
                            datasourcesRoot: DATASOURCES_ROOT,
                            tempDir: null,
                        })
                        expect(downloadTarballArchive).not.toHaveBeenCalled()
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.DataGitBootstrapUpToDate,
                            {
                                owner: "starci-lab",
                                repo: "data",
                                ref: "main",
                                sha: REMOTE_SHA,
                            },
                        )
                    })

                it("downloads anyway when the caller forces a reseed",
                    async () => {
                        setManifest(JSON.stringify({
                            snapshots: [
                                {
                                    sha: REMOTE_SHA,
                                    pulledAt: "2026-01-01T00:00:00.000Z",
                                },
                            ],
                        }))
                        const snapshotRoot = join(DATASOURCES_ROOT,
                            REMOTE_SHA)
                        present.add(snapshotRoot)
                        present.add(join(snapshotRoot,
                            "courses"))

                        const result = await service.ensure(true)

                        expect(result.changed).toBe(true)
                        expect(downloadTarballArchive).toHaveBeenCalled()
                        // same SHA on both sides -> no trustworthy baseline to diff against
                        expect(result.diffAvailable).toBe(false)
                    })

                it("downloads when the recorded snapshot directory is empty",
                    async () => {
                        setManifest(JSON.stringify({
                            snapshots: [
                                {
                                    sha: REMOTE_SHA,
                                    pulledAt: "2026-01-01T00:00:00.000Z",
                                },
                            ],
                        }))
                        // the dir exists but carries no `courses` tree -> not real content
                        present.add(join(DATASOURCES_ROOT,
                            REMOTE_SHA))

                        const result = await service.ensure()

                        expect(result.changed).toBe(true)
                        expect(downloadTarballArchive).toHaveBeenCalled()
                    })

                it("computes the diff against the previous snapshot when one exists",
                    async () => {
                        setManifest(JSON.stringify({
                            snapshots: [
                                {
                                    sha: PREVIOUS_SHA,
                                    pulledAt: "2026-01-01T00:00:00.000Z",
                                },
                            ],
                        }))
                        const previousRoot = join(DATASOURCES_ROOT,
                            PREVIOUS_SHA)
                        present.add(previousRoot)
                        present.add(join(previousRoot,
                            "courses"))
                        diffSnapshotsMock.mockResolvedValue([
                            "courses/0-fullstack-mastery/en.md",
                        ])

                        const result = await service.ensure()

                        expect(diffSnapshotsMock).toHaveBeenCalledWith(
                            previousRoot,
                            join(DATASOURCES_ROOT,
                                REMOTE_SHA),
                        )
                        expect(result.diffAvailable).toBe(true)
                        expect(result.previousSha).toBe(PREVIOUS_SHA)
                        expect(result.changedPaths).toEqual([
                            "courses/0-fullstack-mastery/en.md",
                        ])
                    })

                it("skips the diff when the previous snapshot directory has no content",
                    async () => {
                        setManifest(JSON.stringify({
                            snapshots: [
                                {
                                    sha: PREVIOUS_SHA,
                                    pulledAt: "2026-01-01T00:00:00.000Z",
                                },
                            ],
                        }))
                        // previous dir was pruned from disk -> nothing trustworthy to diff

                        const result = await service.ensure()

                        expect(diffSnapshotsMock).not.toHaveBeenCalled()
                        expect(result.diffAvailable).toBe(false)
                    })

                it("treats a corrupt manifest as an empty snapshot store",
                    async () => {
                        setManifest("{ not json")

                        const result = await service.ensure()

                        expect(result.previousSha).toBe("")
                    })

                it("treats a manifest without a snapshots array as empty",
                    async () => {
                        setManifest(JSON.stringify({
                            snapshots: "nope",
                        }))

                        const result = await service.ensure()

                        expect(result.previousSha).toBe("")
                    })

                it("logs and rethrows a GitHub failure as DataGitBootstrapException",
                    async () => {
                        const failure = new Error("bad credentials")
                        getBranch.mockRejectedValue(failure)

                        await expect(service.ensure())
                            .rejects.toBeInstanceOf(DataGitBootstrapException)
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.DataGitBootstrapFailed,
                            expect.objectContaining({
                                owner: "starci-lab",
                                repo: "data",
                                ref: "main",
                                errorCode: "Error",
                                errorMessage: "bad credentials",
                            }),
                        )
                    })

                it("normalizes a non-Error rejection before logging it",
                    async () => {
                        getBranch.mockRejectedValue("socket hang up")

                        await expect(service.ensure())
                            .rejects.toBeInstanceOf(DataGitBootstrapException)
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.DataGitBootstrapFailed,
                            expect.objectContaining({
                                errorMessage: "socket hang up",
                            }),
                        )
                    })

                it("fails when no enabled filesystem context is configured",
                    async () => {
                        setEnv({
                        },
                        [
                            {
                                enabled: true,
                                type: ContextType.S3,
                                path: "https://cdn.example.com",
                            },
                            {
                                enabled: false,
                                type: ContextType.Filesystem,
                                path: DATASOURCES_ROOT,
                            },
                        ])

                        await expect(service.ensure())
                            .rejects.toBeInstanceOf(DataGitBootstrapException)
                        expect(OctokitMock).not.toHaveBeenCalled()
                    })
            })

        describe("commitSnapshot",
            () => {
                /**
                 * Build an {@link EnsureDataGitResult} for the commit/rollback tests.
                 *
                 * @param overrides - Fields to change on the default changed-snapshot result
                 * @returns The result to hand to the service
                 */
                const result = (
                    overrides: Partial<EnsureDataGitResult> = {
                    },
                ): EnsureDataGitResult => ({
                    changed: true,
                    sha: REMOTE_SHA,
                    previousSha: PREVIOUS_SHA,
                    changedPaths: [],
                    diffAvailable: true,
                    snapshotRoot: join(DATASOURCES_ROOT,
                        REMOTE_SHA),
                    datasourcesRoot: DATASOURCES_ROOT,
                    tempDir: TEMP_DIR,
                    ...overrides,
                })

                it("does nothing when the run was already up to date",
                    async () => {
                        await service.commitSnapshot(result({
                            changed: false,
                        }))

                        expect(writeFileMock).not.toHaveBeenCalled()
                        expect(winstonService.log).not.toHaveBeenCalled()
                    })

                it("does nothing when no snapshot was produced",
                    async () => {
                        await service.commitSnapshot(result({
                            snapshotRoot: null,
                        }))

                        expect(writeFileMock).not.toHaveBeenCalled()
                    })

                it("appends the new SHA and writes the manifest back",
                    async () => {
                        setManifest(JSON.stringify({
                            snapshots: [
                                {
                                    sha: PREVIOUS_SHA,
                                    pulledAt: "2026-01-01T00:00:00.000Z",
                                },
                            ],
                        }))

                        await service.commitSnapshot(result())

                        expect(mkdirMock).toHaveBeenCalledWith(DATASOURCES_ROOT,
                            {
                                recursive: true,
                            })
                        const [
                            path,
                            body,
                        ] = writeFileMock.mock.calls[0]
                        expect(path).toBe(join(DATASOURCES_ROOT,
                            DATA_GIT_MANIFEST_FILE))
                        expect(JSON.parse(String(body)).snapshots.map(
                            (entry: {
                                sha: string
                            }) => entry.sha,
                        )).toEqual([
                            PREVIOUS_SHA,
                            REMOTE_SHA,
                        ])
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.DataGitBootstrapUpdated,
                            expect.objectContaining({
                                previousSha: PREVIOUS_SHA,
                                newSha: REMOTE_SHA,
                                entryCount: 2,
                            }),
                        )
                    })

                it("does not append twice when the tail already records this SHA",
                    async () => {
                        setManifest(JSON.stringify({
                            snapshots: [
                                {
                                    sha: REMOTE_SHA,
                                    pulledAt: "2026-01-01T00:00:00.000Z",
                                },
                            ],
                        }))

                        await service.commitSnapshot(result())

                        const [
                            ,
                            body,
                        ] = writeFileMock.mock.calls[0]
                        expect(JSON.parse(String(body)).snapshots).toHaveLength(1)
                    })

                it("prunes the oldest snapshots beyond the retention cap",
                    async () => {
                        const olderShas = Array.from(
                            {
                                length: DATA_GIT_MAX_SNAPSHOTS,
                            },
                            (_unused, index) => `old-sha-${index}`,
                        )
                        setManifest(JSON.stringify({
                            snapshots: olderShas.map((sha) => ({
                                sha,
                                pulledAt: "2026-01-01T00:00:00.000Z",
                            })),
                        }))

                        await service.commitSnapshot(result())

                        // one entry over the cap -> the single oldest dir is removed
                        expect(rmMock).toHaveBeenCalledWith(
                            join(DATASOURCES_ROOT,
                                "old-sha-0"),
                            {
                                recursive: true,
                                force: true,
                            },
                        )
                        const [
                            ,
                            body,
                        ] = writeFileMock.mock.calls[0]
                        expect(JSON.parse(String(body)).snapshots).toHaveLength(
                            DATA_GIT_MAX_SNAPSHOTS,
                        )
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.DataGitBootstrapUpdated,
                            expect.objectContaining({
                                entryCount: DATA_GIT_MAX_SNAPSHOTS,
                            }),
                        )
                    })

                it("never deletes a directory a retained entry still points at",
                    async () => {
                        // the same SHA appears twice: dropping the head entry must not
                        // remove the dir the retained duplicate still needs
                        setManifest(JSON.stringify({
                            snapshots: [
                                {
                                    sha: "shared-sha",
                                    pulledAt: "2026-01-01T00:00:00.000Z",
                                },
                                {
                                    sha: "shared-sha",
                                    pulledAt: "2026-01-02T00:00:00.000Z",
                                },
                                {
                                    sha: "old-sha-1",
                                    pulledAt: "2026-01-03T00:00:00.000Z",
                                },
                                {
                                    sha: "old-sha-2",
                                    pulledAt: "2026-01-04T00:00:00.000Z",
                                },
                            ],
                        }))

                        await service.commitSnapshot(result())

                        expect(rmMock).not.toHaveBeenCalledWith(
                            join(DATASOURCES_ROOT,
                                "shared-sha"),
                            expect.anything(),
                        )
                    })
            })

        describe("rollbackSnapshot",
            () => {
                it("removes the snapshot a failed seed produced",
                    async () => {
                        await service.rollbackSnapshot({
                            changed: true,
                            sha: REMOTE_SHA,
                            previousSha: PREVIOUS_SHA,
                            changedPaths: [],
                            diffAvailable: false,
                            snapshotRoot: join(DATASOURCES_ROOT,
                                REMOTE_SHA),
                            datasourcesRoot: DATASOURCES_ROOT,
                            tempDir: null,
                        })

                        expect(rmMock).toHaveBeenCalledWith(
                            join(DATASOURCES_ROOT,
                                REMOTE_SHA),
                            {
                                recursive: true,
                                force: true,
                            },
                        )
                    })

                it("leaves the recorded baseline alone on an up-to-date run",
                    async () => {
                        await service.rollbackSnapshot({
                            changed: false,
                            sha: REMOTE_SHA,
                            previousSha: REMOTE_SHA,
                            changedPaths: [],
                            diffAvailable: false,
                            snapshotRoot: join(DATASOURCES_ROOT,
                                REMOTE_SHA),
                            datasourcesRoot: DATASOURCES_ROOT,
                            tempDir: null,
                        })

                        expect(rmMock).not.toHaveBeenCalled()
                    })

                it("does nothing when there is no snapshot to discard",
                    async () => {
                        await service.rollbackSnapshot({
                            changed: true,
                            sha: REMOTE_SHA,
                            previousSha: "",
                            changedPaths: [],
                            diffAvailable: false,
                            snapshotRoot: null,
                            datasourcesRoot: DATASOURCES_ROOT,
                            tempDir: null,
                        })

                        expect(rmMock).not.toHaveBeenCalled()
                    })
            })

        describe("cleanup",
            () => {
                it("removes the downloaded tarball temp directory",
                    async () => {
                        await service.cleanup({
                            changed: true,
                            sha: REMOTE_SHA,
                            previousSha: "",
                            changedPaths: [],
                            diffAvailable: false,
                            snapshotRoot: null,
                            datasourcesRoot: DATASOURCES_ROOT,
                            tempDir: TEMP_DIR,
                        })

                        expect(rmMock).toHaveBeenCalledWith(TEMP_DIR,
                            {
                                recursive: true,
                                force: true,
                            })
                    })

                it("does nothing when nothing was downloaded",
                    async () => {
                        await service.cleanup({
                            changed: false,
                            sha: REMOTE_SHA,
                            previousSha: REMOTE_SHA,
                            changedPaths: [],
                            diffAvailable: false,
                            snapshotRoot: null,
                            datasourcesRoot: DATASOURCES_ROOT,
                            tempDir: null,
                        })

                        expect(rmMock).not.toHaveBeenCalled()
                    })
            })
    })
