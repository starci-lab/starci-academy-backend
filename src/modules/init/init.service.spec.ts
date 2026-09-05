import {
    readdir,
} from "fs/promises"
import {
    join,
} from "path"
import {
    clearRuntimeContextRoot,
    clearRuntimeSeedConfig,
    setRuntimeContextRoot,
    setRuntimeSeedConfig,
} from "@modules/filesystem/utils/mount-seed"
import type {
    InitConfig,
    SeedConfig,
} from "@modules/filesystem/types/seed"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import type {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    AssetsService,
} from "@modules/lib/assets/assets.service"
import type {
    ContentRagIndexService,
} from "@modules/integrations/rag/content-rag-index.service"
import type {
    CvRagIndexService,
} from "@modules/integrations/rag/cv-rag-index.service"
import {
    InitService,
} from "./init.service"
import {
    parseDataGitDiff,
} from "./diff/utils/parse-changed-paths"
import type {
    SeedScopeService,
} from "./scope/seed-scope.service"
import type {
    SyncScopeService,
} from "./scope/sync-scope.service"
import type {
    SeedersService,
} from "./seeders/seeders.service"
import type {
    SynchronizersService,
} from "./synchronizers/synchronizers.service"
import type {
    DataGitBootstrapService,
} from "./data-git/data-git.service"
import type {
    EnsureDataGitResult,
} from "./data-git/types/data-git"
import type {
    SeedDiffOverlayService,
} from "./diff/seed-config-overlay.service"
import type {
    InitConfigParserService,
} from "./config/init-config-parser.service"

/** The `seed.yaml` the stubbed `getInitConfig` hands back; each test rewrites it. */
const mockInitConfig: {
    value: InitConfig
} = {
    value: {
    },
}

/** Local courses root the stubbed `envConfig` reports outside a snapshot. */
const LOCAL_COURSES_DIR = join("/local",
    "contexts",
    "courses")

/** Env knobs the stubbed `envConfig` overlays on the real tree. */
interface InitEnvKnobs {
    /** Value returned for `mountPath.data.courses`. */
    coursesDir: string
    /** Value returned for `services.contentRag.enabled`. */
    contentRagEnabled: boolean
}

/**
 * The env override slot. It lives on `globalThis` because the `jest.mock`
 * factory below runs while the module graph is still loading -- before any
 * module-scoped `const` in this file has been initialized.
 */
const envKnobs = (): InitEnvKnobs =>
    (globalThis as unknown as {
        __initEnvKnobs: InitEnvKnobs
    }).__initEnvKnobs

// the data-git bootstrap module pulls octokit's ESM-only bundle into the import
// graph; the orchestrator never constructs a client, so the class is enough
jest.mock("octokit",
    () => ({
        Octokit: jest.fn(),
    }))

jest.mock("@modules/filesystem/utils/mount-seed",
    () => ({
        getInitConfig: jest.fn(() => mockInitConfig.value),
        setRuntimeSeedConfig: jest.fn(),
        clearRuntimeSeedConfig: jest.fn(),
        setRuntimeContextRoot: jest.fn(),
        clearRuntimeContextRoot: jest.fn(),
    }))

jest.mock("fs/promises",
    () => ({
        ...jest.requireActual("fs/promises"),
        readdir: jest.fn(),
    }))

jest.mock("@modules/platform/env/config",
    () => {
        const actual = jest.requireActual("@modules/platform/env/config")
        return {
            ...actual,
            // keep the whole real tree -- modules in the import graph read other
            // keys at load time -- and overlay only the two knobs this spec drives
            envConfig: () => {
                const real = actual.envConfig()
                const knobs = (globalThis as unknown as {
                    __initEnvKnobs?: {
                        coursesDir: string
                        contentRagEnabled: boolean
                    }
                }).__initEnvKnobs
                if (!knobs) {
                    return real
                }
                return {
                    ...real,
                    mountPath: {
                        ...real.mountPath,
                        data: {
                            ...real.mountPath.data,
                            courses: knobs.coursesDir,
                        },
                    },
                    services: {
                        ...real.services,
                        contentRag: {
                            ...real.services.contentRag,
                            enabled: knobs.contentRagEnabled,
                        },
                    },
                }
            },
        }
    })

jest.mock("./diff/utils/parse-changed-paths",
    () => ({
        parseDataGitDiff: jest.fn(() => ({
            fullReseed: false,
        })),
    }))

const readdirMock = readdir as jest.MockedFunction<typeof readdir>
const parseDataGitDiffMock = parseDataGitDiff as jest.MockedFunction<
    typeof parseDataGitDiff
>
const setRuntimeSeedConfigMock = setRuntimeSeedConfig as jest.MockedFunction<
    typeof setRuntimeSeedConfig
>
const clearRuntimeSeedConfigMock = clearRuntimeSeedConfig as jest.MockedFunction<
    typeof clearRuntimeSeedConfig
>
const setRuntimeContextRootMock = setRuntimeContextRoot as jest.MockedFunction<
    typeof setRuntimeContextRoot
>
const clearRuntimeContextRootMock = clearRuntimeContextRoot as jest.MockedFunction<
    typeof clearRuntimeContextRoot
>

/** Snapshot root a successful pull reports. */
const SNAPSHOT_ROOT = join("/srv",
    "contexts",
    "sha-new")

describe("InitService",
    () => {
        let service: InitService
        let dataGitBootstrapService: {
            ensure: jest.Mock
            commitSnapshot: jest.Mock
            rollbackSnapshot: jest.Mock
            cleanup: jest.Mock
        }
        let seedDiffOverlayService: {
            buildFullConfig: jest.Mock
            buildDiffConfig: jest.Mock
        }
        let initConfigParserService: {
            parse: jest.Mock
        }
        let winstonService: {
            log: jest.Mock
        }
        let seedScopeService: {
            isSeedersEnabled: jest.Mock
        }
        let syncScopeService: {
            isSynchronizersEnabled: jest.Mock
        }
        let seedersService: {
            init: jest.Mock
        }
        let synchronizersService: {
            init: jest.Mock
        }
        let assetsService: {
            sync: jest.Mock
        }
        let contentRagIndexService: {
            build: jest.Mock
        }
        let cvRagIndexService: {
            build: jest.Mock
        }

        /** A distinguishable stand-in for a resolved pipeline config. */
        const fullConfig = {
            marker: "full",
        } as unknown as SeedConfig
        /** A distinguishable stand-in for the diff-narrowed overlay. */
        const overlayConfig = {
            marker: "overlay",
        } as unknown as SeedConfig
        /** A distinguishable stand-in for the explicit seed/sync config. */
        const explicitConfig = {
            marker: "explicit",
            seeders: {
                courses: {
                    tracks: {
                        "fullstack-mastery": {
                        },
                    },
                },
            },
        } as unknown as SeedConfig

        /**
         * Build the bootstrap result the stubbed `ensure` resolves with.
         *
         * @param overrides - Fields to change on the default changed-snapshot result
         * @returns The result the orchestrator will see
         */
        const ensureResult = (
            overrides: Partial<EnsureDataGitResult> = {
            },
        ): EnsureDataGitResult => ({
            changed: true,
            sha: "sha-new",
            previousSha: "sha-old",
            changedPaths: [
                "courses/0-fullstack-mastery/en.md",
            ],
            diffAvailable: true,
            snapshotRoot: SNAPSHOT_ROOT,
            datasourcesRoot: join("/srv",
                "contexts"),
            tempDir: join("/tmp",
                "data-git-1"),
            ...overrides,
        })

        /** Every `DataGitDiffScoped` payload logged during the run. */
        const scopeLogs = (): Array<Record<string, unknown>> =>
            winstonService.log.mock.calls
                .filter(([
                    logKey,
                ]) => logKey === WinstonLog.DataGitDiffScoped)
                .map(([
                    ,
                    payload,
                ]) => payload)

        beforeEach(() => {
            jest.clearAllMocks()
            mockInitConfig.value = {
            }
            ;(globalThis as unknown as {
                __initEnvKnobs: InitEnvKnobs
            }).__initEnvKnobs = {
                coursesDir: LOCAL_COURSES_DIR,
                contentRagEnabled: false,
            }

            readdirMock.mockResolvedValue([
                "0-fullstack-mastery",
                "1-system-design-mastery",
                "README.md",
            ] as unknown as Awaited<ReturnType<typeof readdir>>)
            parseDataGitDiffMock.mockReturnValue({
                fullReseed: false,
            } as unknown as ReturnType<typeof parseDataGitDiff>)

            dataGitBootstrapService = {
                ensure: jest.fn().mockResolvedValue(ensureResult()),
                commitSnapshot: jest.fn().mockResolvedValue(undefined),
                rollbackSnapshot: jest.fn().mockResolvedValue(undefined),
                cleanup: jest.fn().mockResolvedValue(undefined),
            }
            seedDiffOverlayService = {
                buildFullConfig: jest.fn(() => fullConfig),
                buildDiffConfig: jest.fn(() => ({
                    overlay: overlayConfig,
                    courseCount: 1,
                    moduleCount: 2,
                    domainCount: 3,
                })),
            }
            initConfigParserService = {
                parse: jest.fn(() => explicitConfig),
            }
            winstonService = {
                log: jest.fn(),
            }
            seedScopeService = {
                isSeedersEnabled: jest.fn(() => true),
            }
            syncScopeService = {
                isSynchronizersEnabled: jest.fn(() => true),
            }
            seedersService = {
                init: jest.fn().mockResolvedValue(undefined),
            }
            synchronizersService = {
                init: jest.fn().mockResolvedValue(undefined),
            }
            assetsService = {
                sync: jest.fn().mockResolvedValue({
                    assets: [
                        "badges/a.png",
                    ],
                }),
            }
            contentRagIndexService = {
                build: jest.fn().mockResolvedValue({
                    indexed: 7,
                }),
            }
            cvRagIndexService = {
                build: jest.fn().mockResolvedValue({
                    indexed: 3,
                }),
            }

            service = new InitService(
                dataGitBootstrapService as unknown as DataGitBootstrapService,
                seedDiffOverlayService as unknown as SeedDiffOverlayService,
                initConfigParserService as unknown as InitConfigParserService,
                winstonService as unknown as WinstonService,
                seedScopeService as unknown as SeedScopeService,
                syncScopeService as unknown as SyncScopeService,
                seedersService as unknown as SeedersService,
                synchronizersService as unknown as SynchronizersService,
                assetsService as unknown as AssetsService,
                contentRagIndexService as unknown as ContentRagIndexService,
                cvRagIndexService as unknown as CvRagIndexService,
            )
        })

        describe("kill switches",
            () => {
                it("skips the entire init when `enable: false`",
                    async () => {
                        mockInitConfig.value = {
                            enable: false,
                        }

                        await service.onModuleInit()

                        expect(dataGitBootstrapService.ensure).not.toHaveBeenCalled()
                        expect(seedersService.init).not.toHaveBeenCalled()
                        expect(scopeLogs()).toEqual([
                            {
                                fullReseed: false,
                                courseCount: 0,
                                moduleCount: 0,
                                domainCount: 0,
                            },
                        ])
                    })

                it("skips both phases when `mode: none` and no explicit blocks",
                    async () => {
                        mockInitConfig.value = {
                            mode: "none",
                        }

                        await service.onModuleInit()

                        expect(dataGitBootstrapService.ensure).not.toHaveBeenCalled()
                        expect(setRuntimeSeedConfigMock).not.toHaveBeenCalled()
                    })

                it("still runs when `mode: none` is overridden by an explicit block",
                    async () => {
                        mockInitConfig.value = {
                            mode: "none",
                            seed: {
                            },
                        }

                        await service.onModuleInit()

                        expect(dataGitBootstrapService.ensure).toHaveBeenCalledWith(true)
                        expect(setRuntimeSeedConfigMock).toHaveBeenCalledWith(explicitConfig)
                    })
            })

        describe("diff mode",
            () => {
                it("short-circuits when the remote has not moved",
                    async () => {
                        dataGitBootstrapService.ensure.mockResolvedValue(ensureResult({
                            changed: false,
                        }))

                        await service.onModuleInit()

                        expect(dataGitBootstrapService.ensure).toHaveBeenCalledWith(false)
                        expect(setRuntimeSeedConfigMock).not.toHaveBeenCalled()
                        expect(seedersService.init).not.toHaveBeenCalled()
                        expect(dataGitBootstrapService.cleanup).not.toHaveBeenCalled()
                    })

                it("applies the diff-narrowed overlay and logs the resolved scope",
                    async () => {
                        await service.onModuleInit()

                        expect(parseDataGitDiffMock).toHaveBeenCalledWith(
                            [
                                "courses/0-fullstack-mastery/en.md",
                            ],
                            "",
                        )
                        expect(setRuntimeContextRootMock)
                            .toHaveBeenCalledWith(SNAPSHOT_ROOT)
                        expect(setRuntimeSeedConfigMock).toHaveBeenCalledWith(overlayConfig)
                        expect(scopeLogs()).toEqual([
                            {
                                fullReseed: false,
                                courseCount: 1,
                                moduleCount: 2,
                                domainCount: 3,
                            },
                        ])
                    })

                it("falls back to a full reseed when the diff cannot be scoped",
                    async () => {
                        seedDiffOverlayService.buildDiffConfig.mockReturnValue({
                            overlay: null,
                            courseCount: 0,
                            moduleCount: 0,
                            domainCount: 0,
                        })

                        await service.onModuleInit()

                        expect(readdirMock).toHaveBeenCalledWith(join(SNAPSHOT_ROOT,
                            "courses"))
                        expect(seedDiffOverlayService.buildFullConfig)
                            .toHaveBeenCalledWith([
                                "fullstack-mastery",
                                "system-design-mastery",
                            ])
                        expect(setRuntimeSeedConfigMock).toHaveBeenCalledWith(fullConfig)
                        expect(scopeLogs()).toEqual([
                            {
                                fullReseed: true,
                                courseCount: 2,
                                moduleCount: 0,
                                domainCount: 0,
                            },
                        ])
                    })

                it("builds the first full snapshot even when it has concepts but no courses directory",
                    async () => {
                        readdirMock.mockRejectedValue(new Error("ENOENT"))
                        dataGitBootstrapService.ensure.mockResolvedValue(ensureResult({
                            previousSha: "",
                        }))

                        await service.onModuleInit()

                        expect(parseDataGitDiffMock).not.toHaveBeenCalled()
                        expect(seedDiffOverlayService.buildFullConfig).toHaveBeenCalledWith([])
                        expect(setRuntimeSeedConfigMock).toHaveBeenCalledWith(fullConfig)
                    })

                it("full-reseeds when the pull produced no trustworthy diff",
                    async () => {
                        dataGitBootstrapService.ensure.mockResolvedValue(ensureResult({
                            diffAvailable: false,
                        }))

                        await service.onModuleInit()

                        expect(parseDataGitDiffMock).not.toHaveBeenCalled()
                        expect(setRuntimeSeedConfigMock).toHaveBeenCalledWith(fullConfig)
                    })

                it("seeds the local courses root when the pull failed outright",
                    async () => {
                        dataGitBootstrapService.ensure.mockRejectedValue(
                            new Error("github unreachable"),
                        )

                        await service.onModuleInit()

                        expect(readdirMock).toHaveBeenCalledWith(LOCAL_COURSES_DIR)
                        expect(setRuntimeContextRootMock).not.toHaveBeenCalled()
                        expect(setRuntimeSeedConfigMock).toHaveBeenCalledWith(fullConfig)
                        // no snapshot -> nothing to commit, roll back or clean up
                        expect(dataGitBootstrapService.commitSnapshot)
                            .not.toHaveBeenCalled()
                        expect(dataGitBootstrapService.rollbackSnapshot)
                            .not.toHaveBeenCalled()
                        expect(dataGitBootstrapService.cleanup).not.toHaveBeenCalled()
                        expect(clearRuntimeContextRootMock).not.toHaveBeenCalled()
                        expect(clearRuntimeSeedConfigMock).toHaveBeenCalled()
                    })

                it("treats a courses root it cannot read as holding no courses",
                    async () => {
                        readdirMock.mockRejectedValue(new Error("ENOENT"))
                        seedDiffOverlayService.buildDiffConfig.mockReturnValue({
                            overlay: null,
                            courseCount: 0,
                            moduleCount: 0,
                            domainCount: 0,
                        })

                        await service.onModuleInit()

                        expect(seedDiffOverlayService.buildFullConfig)
                            .toHaveBeenCalledWith([])
                    })

                it("enumerates the local courses root when a diff arrives with no snapshot",
                    async () => {
                        // a trustworthy diff but nothing staged on disk -> the unscopable
                        // fallback must still find courses to reseed, locally
                        dataGitBootstrapService.ensure.mockResolvedValue(ensureResult({
                            snapshotRoot: null,
                        }))
                        seedDiffOverlayService.buildDiffConfig.mockReturnValue({
                            overlay: null,
                            courseCount: 0,
                            moduleCount: 0,
                            domainCount: 0,
                        })

                        await service.onModuleInit()

                        expect(readdirMock).toHaveBeenCalledWith(LOCAL_COURSES_DIR)
                        expect(setRuntimeContextRootMock).not.toHaveBeenCalled()
                        expect(setRuntimeSeedConfigMock).toHaveBeenCalledWith(fullConfig)
                    })

                it("keeps a bare ordinal folder name as its own displayId",
                    async () => {
                        readdirMock.mockResolvedValue([
                            "7",
                            "8-extra-course",
                        ] as unknown as Awaited<ReturnType<typeof readdir>>)
                        seedDiffOverlayService.buildDiffConfig.mockReturnValue({
                            overlay: null,
                            courseCount: 0,
                            moduleCount: 0,
                            domainCount: 0,
                        })

                        await service.onModuleInit()

                        expect(seedDiffOverlayService.buildFullConfig)
                            .toHaveBeenCalledWith([
                                "7",
                                "extra-course",
                            ])
                    })
            })

        describe("mode: all",
            () => {
                it("forces a fresh pull and a full-scope config",
                    async () => {
                        mockInitConfig.value = {
                            mode: "all",
                        }

                        await service.onModuleInit()

                        expect(dataGitBootstrapService.ensure).toHaveBeenCalledWith(true)
                        expect(seedDiffOverlayService.buildDiffConfig)
                            .not.toHaveBeenCalled()
                        expect(setRuntimeSeedConfigMock).toHaveBeenCalledWith(fullConfig)
                        expect(scopeLogs()).toEqual([
                            {
                                fullReseed: true,
                                courseCount: 2,
                                moduleCount: 0,
                                domainCount: 0,
                            },
                        ])
                    })

                it("does not short-circuit even when the remote has not moved",
                    async () => {
                        mockInitConfig.value = {
                            mode: "all",
                        }
                        dataGitBootstrapService.ensure.mockResolvedValue(ensureResult({
                            changed: false,
                        }))

                        await service.onModuleInit()

                        expect(seedersService.init).toHaveBeenCalled()
                    })

                it("enumerates the local courses root when no snapshot was produced",
                    async () => {
                        mockInitConfig.value = {
                            mode: "all",
                        }
                        dataGitBootstrapService.ensure.mockResolvedValue(ensureResult({
                            snapshotRoot: null,
                        }))

                        await service.onModuleInit()

                        expect(readdirMock).toHaveBeenCalledWith(LOCAL_COURSES_DIR)
                        expect(setRuntimeContextRootMock).not.toHaveBeenCalled()
                        expect(assetsService.sync).not.toHaveBeenCalled()
                    })
            })

        describe("explicit seed / sync blocks",
            () => {
                it("expands the explicit config against the snapshot's courses",
                    async () => {
                        mockInitConfig.value = {
                            sync: {
                            },
                        }

                        await service.onModuleInit()

                        expect(readdirMock).toHaveBeenCalledWith(join(SNAPSHOT_ROOT,
                            "courses"))
                        expect(initConfigParserService.parse).toHaveBeenCalledWith(
                            mockInitConfig.value,
                            [
                                "fullstack-mastery",
                                "system-design-mastery",
                            ],
                        )
                        expect(setRuntimeSeedConfigMock).toHaveBeenCalledWith(explicitConfig)
                        expect(scopeLogs()).toEqual([
                            {
                                fullReseed: false,
                                courseCount: 1,
                                moduleCount: 0,
                                domainCount: 0,
                            },
                        ])
                    })

                it("expands against the local courses root when no snapshot exists",
                    async () => {
                        mockInitConfig.value = {
                            seed: {
                            },
                        }
                        dataGitBootstrapService.ensure.mockResolvedValue(ensureResult({
                            snapshotRoot: null,
                        }))

                        await service.onModuleInit()

                        expect(readdirMock).toHaveBeenCalledWith(LOCAL_COURSES_DIR)
                    })
            })

        describe("pipeline phases",
            () => {
                it("runs seed then sync then assets, and commits the snapshot",
                    async () => {
                        await service.onModuleInit()

                        expect(seedersService.init).toHaveBeenCalled()
                        expect(synchronizersService.init).toHaveBeenCalled()
                        expect(assetsService.sync).toHaveBeenCalled()
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitPhaseCompleted,
                            {
                                op: "init.assets.mirrored",
                                count: 1,
                            },
                        )
                        expect(dataGitBootstrapService.commitSnapshot)
                            .toHaveBeenCalledWith(expect.objectContaining({
                                sha: "sha-new",
                            }))
                        expect(dataGitBootstrapService.rollbackSnapshot)
                            .not.toHaveBeenCalled()
                        expect(dataGitBootstrapService.cleanup).toHaveBeenCalled()
                        expect(clearRuntimeSeedConfigMock).toHaveBeenCalled()
                        expect(clearRuntimeContextRootMock).toHaveBeenCalled()
                    })

                it("skips the seed phase when the seeders are disabled",
                    async () => {
                        seedScopeService.isSeedersEnabled.mockReturnValue(false)

                        await service.onModuleInit()

                        expect(seedersService.init).not.toHaveBeenCalled()
                        expect(synchronizersService.init).toHaveBeenCalled()
                    })

                it("skips the sync phase when the synchronizers are disabled",
                    async () => {
                        syncScopeService.isSynchronizersEnabled.mockReturnValue(false)

                        await service.onModuleInit()

                        expect(synchronizersService.init).not.toHaveBeenCalled()
                        expect(seedersService.init).toHaveBeenCalled()
                    })

                it("swallows a synchronizer failure and still commits the snapshot",
                    async () => {
                        synchronizersService.init.mockRejectedValue(
                            new Error("es bulk timeout"),
                        )

                        await service.onModuleInit()

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitPhaseFailed,
                            {
                                op: "init.synchronizers.failed",
                                error: "es bulk timeout",
                            },
                        )
                        expect(dataGitBootstrapService.commitSnapshot).toHaveBeenCalled()
                    })

                it("stringifies a non-Error synchronizer rejection",
                    async () => {
                        synchronizersService.init.mockRejectedValue("connection reset")

                        await service.onModuleInit()

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitPhaseFailed,
                            {
                                op: "init.synchronizers.failed",
                                error: "connection reset",
                            },
                        )
                    })

                it("swallows an asset mirroring failure",
                    async () => {
                        assetsService.sync.mockRejectedValue(new Error("minio down"))

                        await service.onModuleInit()

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitPhaseFailed,
                            {
                                op: "init.assets.failed",
                                error: "minio down",
                            },
                        )
                        expect(dataGitBootstrapService.commitSnapshot).toHaveBeenCalled()
                    })

                it("stringifies a non-Error asset rejection",
                    async () => {
                        assetsService.sync.mockRejectedValue("bucket missing")

                        await service.onModuleInit()

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitPhaseFailed,
                            {
                                op: "init.assets.failed",
                                error: "bucket missing",
                            },
                        )
                    })

                it("rolls the snapshot back when the seed phase throws",
                    async () => {
                        seedersService.init.mockRejectedValue(new Error("constraint violation"))

                        await expect(service.onModuleInit())
                            .rejects.toThrow("constraint violation")
                        expect(dataGitBootstrapService.commitSnapshot)
                            .not.toHaveBeenCalled()
                        expect(dataGitBootstrapService.rollbackSnapshot)
                            .toHaveBeenCalledWith(expect.objectContaining({
                                sha: "sha-new",
                            }))
                        expect(dataGitBootstrapService.cleanup).toHaveBeenCalled()
                        expect(clearRuntimeSeedConfigMock).toHaveBeenCalled()
                        expect(clearRuntimeContextRootMock).toHaveBeenCalled()
                    })
            })

        describe("RAG index phases",
            () => {
                it("skips both RAG builds when the flag is off",
                    async () => {
                        await service.onModuleInit()

                        expect(contentRagIndexService.build).not.toHaveBeenCalled()
                        expect(cvRagIndexService.build).not.toHaveBeenCalled()
                    })

                it("builds both indexes and logs their counts when enabled",
                    async () => {
                        envKnobs().contentRagEnabled = true

                        await service.onModuleInit()

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitPhaseCompleted,
                            {
                                op: "init.content-rag.completed",
                                count: 7,
                            },
                        )
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitPhaseCompleted,
                            {
                                op: "init.cv-rag.completed",
                                count: 3,
                            },
                        )
                    })

                it("swallows a content-RAG failure and still builds the CV index",
                    async () => {
                        envKnobs().contentRagEnabled = true
                        contentRagIndexService.build.mockRejectedValue(
                            new Error("qdrant refused"),
                        )

                        await service.onModuleInit()

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitPhaseFailed,
                            {
                                op: "init.content-rag.failed",
                                error: "qdrant refused",
                            },
                        )
                        expect(cvRagIndexService.build).toHaveBeenCalled()
                        expect(dataGitBootstrapService.commitSnapshot).toHaveBeenCalled()
                    })

                it("stringifies non-Error RAG rejections",
                    async () => {
                        envKnobs().contentRagEnabled = true
                        contentRagIndexService.build.mockRejectedValue("timeout")
                        cvRagIndexService.build.mockRejectedValue("timeout")

                        await service.onModuleInit()

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitPhaseFailed,
                            {
                                op: "init.content-rag.failed",
                                error: "timeout",
                            },
                        )
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitPhaseFailed,
                            {
                                op: "init.cv-rag.failed",
                                error: "timeout",
                            },
                        )
                    })

                it("swallows a CV-RAG failure",
                    async () => {
                        envKnobs().contentRagEnabled = true
                        cvRagIndexService.build.mockRejectedValue(new Error("no cv corpus"))

                        await service.onModuleInit()

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.InitPhaseFailed,
                            {
                                op: "init.cv-rag.failed",
                                error: "no cv corpus",
                            },
                        )
                        expect(dataGitBootstrapService.commitSnapshot).toHaveBeenCalled()
                    })

                it("skips both RAG builds when there is no snapshot to index",
                    async () => {
                        envKnobs().contentRagEnabled = true
                        mockInitConfig.value = {
                            mode: "all",
                        }
                        dataGitBootstrapService.ensure.mockResolvedValue(ensureResult({
                            snapshotRoot: null,
                        }))

                        await service.onModuleInit()

                        expect(contentRagIndexService.build).not.toHaveBeenCalled()
                        expect(cvRagIndexService.build).not.toHaveBeenCalled()
                    })
            })
    })
