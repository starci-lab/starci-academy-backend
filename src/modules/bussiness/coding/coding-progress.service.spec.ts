import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CodingProgressService,
} from "./coding-progress.service"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import type {
    CodingProblemProgressCacheResult,
} from "@modules/cache"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("CodingProgressService",
    () => {
        let module: TestingModule
        let service: CodingProgressService
        let entityManager: EntityManagerMock
        let cacheService: jest.Mocked<CacheService>

        const userId = "user-1"

        /** The row shape `compute()` builds when every query is empty/zero. */
        const emptyProgress: CodingProblemProgressCacheResult = {
            solvedProblemIds: [],
            attemptedProblemIds: [],
            revealedProblemIds: [],
            totalPoints: 0,
        }

        beforeEach(async () => {
            // fresh jest-backed entity manager; `query` defaults to [] per call
            entityManager = makeEntityManagerMock()

            // cache get/set/del stubs the test programs per-case
            cacheService = {
                get: jest.fn(),
                set: jest.fn(),
                del: jest.fn(),
            } as unknown as jest.Mocked<CacheService>

            module = await Test.createTestingModule({
                providers: [
                    CodingProgressService,
                    {
                        provide: CacheService,
                        useValue: cacheService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<CodingProgressService>(CodingProgressService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getProgress",
            () => {
                it("returns the cached progress without touching the DB",
                    async () => {
                        const cached: CodingProblemProgressCacheResult = {
                            solvedProblemIds: [
                                "p1",
                            ],
                            attemptedProblemIds: [
                                "p1",
                                "p2",
                            ],
                            revealedProblemIds: [],
                            totalPoints: 10,
                        }
                        cacheService.get.mockResolvedValueOnce(cached)

                        const result = await service.getProgress({
                            userId,
                        })

                        expect(result).toBe(cached)
                        expect(entityManager.query).not.toHaveBeenCalled()
                        expect(cacheService.set).not.toHaveBeenCalled()
                    })

                it("recomputes from the DB and caches it on a cache miss",
                    async () => {
                        // miss is signalled by `undefined`
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    id: "p1",
                                },
                            ]) // solved
                            .mockResolvedValueOnce([
                                {
                                    id: "p1",
                                },
                                {
                                    id: "p2",
                                },
                            ]) // attempted
                            .mockResolvedValueOnce([]) // revealed
                            .mockResolvedValueOnce([
                                {
                                    points: 25,
                                },
                            ]) // coin balance

                        const result = await service.getProgress({
                            userId,
                        })

                        expect(result).toEqual({
                            solvedProblemIds: [
                                "p1",
                            ],
                            attemptedProblemIds: [
                                "p1",
                                "p2",
                            ],
                            revealedProblemIds: [],
                            totalPoints: 25,
                        })
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.CodingProblemProgress,
                            args: [
                                userId,
                            ],
                            cacheResult: result,
                        })
                    })

                it("treats a non-array cached entry (empty-default shape) as a miss and recomputes",
                    async () => {
                        // the empty default cached value does not have the array shape
                        cacheService.get.mockResolvedValueOnce({} as CodingProblemProgressCacheResult)

                        const result = await service.getProgress({
                            userId,
                        })

                        expect(result).toEqual(emptyProgress)
                        expect(entityManager.query).toHaveBeenCalledTimes(4)
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.CodingProblemProgress,
                            args: [
                                userId,
                            ],
                            cacheResult: emptyProgress,
                        })
                    })

                it("defaults totalPoints to 0 when the user row is missing",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        // query defaults to [] for every call, including the points lookup

                        const result = await service.getProgress({
                            userId,
                        })

                        expect(result.totalPoints).toBe(0)
                    })
            })

        describe("updateProgress",
            () => {
                it("always recomputes from the DB and overwrites the cache, bypassing any cached value",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([]) // solved
                            .mockResolvedValueOnce([]) // attempted
                            .mockResolvedValueOnce([]) // revealed
                            .mockResolvedValueOnce([
                                {
                                    points: 7,
                                },
                            ]) // coin balance

                        const result = await service.updateProgress({
                            userId,
                        })

                        // never consults the cache read path
                        expect(cacheService.get).not.toHaveBeenCalled()
                        expect(result.totalPoints).toBe(7)
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.CodingProblemProgress,
                            args: [
                                userId,
                            ],
                            cacheResult: result,
                        })
                    })

                it("issues the solved/attempted/revealed/points queries scoped to the user id",
                    async () => {
                        await service.updateProgress({
                            userId,
                        })

                        expect(entityManager.query).toHaveBeenCalledTimes(4)
                        for (const call of entityManager.query.mock.calls) {
                            const params = call[1] as Array<unknown>
                            // every query is parameterized on this user (first bound param)
                            expect(params[0]).toBe(userId)
                        }
                        // the solved-problems query gates on the Accepted verdict specifically
                        const [
                            solvedSql,
                            solvedParams,
                        ] = entityManager.query.mock.calls[0]
                        expect(solvedSql).toContain("coding_submissions")
                        expect(solvedSql).toContain("verdict = $2")
                        expect(solvedParams).toEqual([
                            userId,
                            "accepted",
                        ])
                    })
            })

        describe("invalidate",
            () => {
                it("drops the user's cached progress",
                    async () => {
                        await service.invalidate({
                            userId,
                        })

                        expect(cacheService.del).toHaveBeenCalledWith({
                            key: CacheKey.CodingProblemProgress,
                            args: [
                                userId,
                            ],
                        })
                    })
            })
    })
