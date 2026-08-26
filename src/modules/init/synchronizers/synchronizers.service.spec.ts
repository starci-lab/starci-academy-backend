import {
    SynchronizersService
} from "./synchronizers.service"

describe("SynchronizersService",
    () => {
        it("runs sync stages in order and continues when user reindex fails",
            async () => {
                const order: Array<string> = []
                const stage = (name: string) => ({
                    sync: jest.fn(async () => { order.push(name) })
                })
                const now = {
                    diff: jest.fn().mockReturnValue(1)
                }
                const scope = {
                    buildCdnScope: jest.fn().mockReturnValue({
                    }), buildElasticsearchScope: jest.fn().mockReturnValue({
                    }), buildRepoScope: jest.fn().mockReturnValue({
                    }), reindexEntities: jest.fn().mockReturnValue(["CourseEntity"])
                }
                const service = new SynchronizersService(
            {
                now: jest.fn().mockReturnValue(now)
            } as never,
            {
                log: jest.fn()
            } as never,
            stage("cdn") as never,
            stage("es") as never,
            stage("indexer") as never,
            {
                sync: jest.fn(async () => { order.push("bloom") })
            } as never,
            stage("repo") as never,
            {
                reconcile: jest.fn(async () => { order.push("reconcile") })
            } as never,
            {
                resetIndices: jest.fn(async () => { order.push("reset") })
            } as never,
            {
                reindexAll: jest.fn().mockRejectedValue("temporarily unavailable")
            } as never,
            scope as never,
                )

                await service.init()

                expect(order).toEqual(["cdn",
                    "reset",
                    "es",
                    "indexer",
                    "bloom",
                    "repo",
                    "reconcile"])
            })

        it("skips index reset and logs completion when no indices are requested",
            async () => {
                const order: Array<string> = []
                const stage = (name: string) => ({
                    sync: jest.fn(async () => {
                        order.push(name)
                    }),
                })
                const now = {
                    diff: jest.fn().mockReturnValue(9),
                }
                const winston = {
                    log: jest.fn(),
                }
                const scope = {
                    buildCdnScope: jest.fn().mockReturnValue({
                        cdn: true,
                    }),
                    buildElasticsearchScope: jest.fn().mockReturnValue({
                        elasticsearch: true,
                    }),
                    buildRepoScope: jest.fn().mockReturnValue({
                        repo: true,
                    }),
                    reindexEntities: jest.fn().mockReturnValue([]),
                }
                const service = new SynchronizersService(
                    {
                        now: jest.fn().mockReturnValue(now),
                    } as never,
                    winston as never,
                    stage("cdn") as never,
                    stage("es") as never,
                    stage("indexer") as never,
                    stage("bloom") as never,
                    stage("repo") as never,
                    {
                        reconcile: jest.fn(async () => {
                            order.push("reconcile")
                        }),
                    } as never,
                    {
                        resetIndices: jest.fn(),
                    } as never,
                    {
                        reindexAll: jest.fn().mockResolvedValue(undefined),
                    } as never,
                    scope as never,
                )

                await service.init()

                expect(order).toEqual(["cdn",
                    "es",
                    "indexer",
                    "bloom",
                    "repo",
                    "reconcile"])
                expect(winston.log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        durationMs: 9,
                    }))
            })

        it("contains an Error-valued user reindex failure and still completes later stages",
            async () => {
                const winston = {
                    log: jest.fn(),
                }
                const reindexError = new Error("user index timeout")
                const stages = Array.from({
                    length: 5,
                },
                () => ({
                    sync: jest.fn().mockResolvedValue(undefined),
                }))
                const service = new SynchronizersService(
                    {
                        now: jest.fn().mockReturnValue({
                            diff: jest.fn().mockReturnValue(2),
                        }),
                    } as never,
                    winston as never,
                    stages[0] as never,
                    stages[1] as never,
                    stages[2] as never,
                    stages[3] as never,
                    stages[4] as never,
                    {
                        reconcile: jest.fn().mockResolvedValue(undefined),
                    } as never,
                    {
                        resetIndices: jest.fn().mockResolvedValue(undefined),
                    } as never,
                    {
                        reindexAll: jest.fn().mockRejectedValue(reindexError),
                    } as never,
                    {
                        buildCdnScope: jest.fn().mockReturnValue({
                        }),
                        buildElasticsearchScope: jest.fn().mockReturnValue({
                        }),
                        buildRepoScope: jest.fn().mockReturnValue({
                        }),
                        reindexEntities: jest.fn().mockReturnValue([]),
                    } as never,
                )

                await service.init()

                expect(stages.every((stage) => stage.sync.mock.calls.length === 1)).toBe(true)
                expect(winston.log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        op: "init.synchronizers.user-es-reindex-failed",
                        error: "user index timeout",
                    }))
            })
    })
