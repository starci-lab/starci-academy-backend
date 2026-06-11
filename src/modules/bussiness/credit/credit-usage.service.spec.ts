import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CreditUsageService,
} from "./credit-usage.service"
import {
    AiMode,
} from "@modules/databases"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import {
    DayjsService,
} from "@modules/mixin"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem"
import {
    makeEntityManagerMock,
} from "@tests/utils"
import type {
    EntityManagerMock,
} from "@tests/utils"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Auto-lane credit caps the mocked quota config hands back. */
const AUTO_CREDITS_5H = 50
const AUTO_CREDITS_WEEK = 500

/**
 * Build a credit charge history row (one Auto-lane spend).
 *
 * @param overrides - Partial fields to merge over the defaults.
 * @returns A history-row-shaped object usable as a `find` return row.
 */
const buildHistoryRow = (
    overrides: Partial<{ id: string; credits: number | null; createdAt: Date }> = {
    },
): { id: string; credits: number | null; createdAt: Date } => ({
    id: "charge-1",
    credits: 10,
    createdAt: new Date(),
    ...overrides,
})

describe("CreditUsageService",
    () => {
        let module: TestingModule
        let service: CreditUsageService
        let cacheService: jest.Mocked<CacheService>
        let entityManager: EntityManagerMock & { findAndCount: jest.Mock }
        let aiAutoQuotaConfigService: jest.Mocked<AiAutoQuotaConfigService>

        const userId = "user-1"

        beforeEach(async () => {
            // cache stubs — programmed per-test for hit / miss behavior
            cacheService = {
                get: jest.fn(),
                set: jest.fn(),
                del: jest.fn(),
            } as unknown as jest.Mocked<CacheService>

            // base mock + findAndCount (not part of the shared helper) for getHistory
            entityManager = Object.assign(makeEntityManagerMock(),
                {
                    findAndCount: jest.fn().mockResolvedValue([
                        [],
                        0,
                    ]),
                })

            // Auto-lane credit caps
            aiAutoQuotaConfigService = {
                getAutoQuota: jest.fn(() => ({
                    creditsPer5h: AUTO_CREDITS_5H,
                    creditsPerWeek: AUTO_CREDITS_WEEK,
                })),
            } as unknown as jest.Mocked<AiAutoQuotaConfigService>

            module = await Test.createTestingModule({
                providers: [
                    CreditUsageService,
                    // DayjsService is a pure dayjs wrapper (no I/O) → use the real one
                    DayjsService,
                    {
                        provide: CacheService,
                        useValue: cacheService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: AiAutoQuotaConfigService,
                        useValue: aiAutoQuotaConfigService,
                    },
                ],
            }).compile()

            service = module.get<CreditUsageService>(CreditUsageService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getSnapshot",
            () => {
                it("uses cached totals without recomputing from the table",
                    async () => {
                        // a fully-formed cache row short-circuits the DB sum
                        cacheService.get.mockResolvedValueOnce({
                            usedCredits5h: 20,
                            usedCreditsWeek: 120,
                            resetAt5hMs: null,
                            resetAtWeekMs: null,
                        })

                        const result = await service.getSnapshot(userId)

                        // top-level fields mirror the week window
                        expect(result.usedCredits).toBe(120)
                        expect(result.quota).toBe(AUTO_CREDITS_WEEK)
                        expect(result.remainingCredits).toBe(AUTO_CREDITS_WEEK - 120)
                        expect(result.window5h.usedCredits).toBe(20)
                        expect(result.window5h.remainingCredits).toBe(AUTO_CREDITS_5H - 20)
                        // a cache hit must not hit the table or re-cache
                        expect(entityManager.find).not.toHaveBeenCalled()
                        expect(cacheService.set).not.toHaveBeenCalled()
                    })

                it("flags overQuota when the week window is exhausted",
                    async () => {
                        cacheService.get.mockResolvedValueOnce({
                            usedCredits5h: 0,
                            usedCreditsWeek: AUTO_CREDITS_WEEK,
                            resetAt5hMs: null,
                            resetAtWeekMs: null,
                        })

                        const result = await service.getSnapshot(userId)

                        expect(result.overQuota).toBe(true)
                        // remaining never goes negative
                        expect(result.remainingCredits).toBe(0)
                    })

                it("flags overQuota when only the 5-hour window is exhausted",
                    async () => {
                        cacheService.get.mockResolvedValueOnce({
                            usedCredits5h: AUTO_CREDITS_5H,
                            usedCreditsWeek: 60,
                            resetAt5hMs: null,
                            resetAtWeekMs: null,
                        })

                        const result = await service.getSnapshot(userId)

                        expect(result.overQuota).toBe(true)
                    })

                it("recomputes from the table on a cache miss and sums both windows",
                    async () => {
                        // missing cache → compute path runs
                        cacheService.get.mockResolvedValueOnce(undefined)
                        const now = Date.now()
                        // one charge inside the 5h window, one only inside the week window
                        entityManager.find.mockResolvedValueOnce([
                            buildHistoryRow({
                                id: "old",
                                credits: 30,
                                // two days ago → counts toward the week, not the 5h window
                                createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
                            }),
                            buildHistoryRow({
                                id: "recent",
                                credits: 5,
                                // one minute ago → counts toward both windows
                                createdAt: new Date(now - 60 * 1000),
                            }),
                        ])

                        const result = await service.getSnapshot(userId)

                        // week window summed both rows, 5h window only the recent one
                        expect(result.windowWeek.usedCredits).toBe(35)
                        expect(result.window5h.usedCredits).toBe(5)
                        // the computed totals were written back to cache
                        expect(cacheService.set).toHaveBeenCalledWith(
                            expect.objectContaining({
                                key: CacheKey.CreditUsage,
                                args: [userId],
                            }),
                        )
                    })

                it("derives reset timestamps from the oldest in-window charge",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        const oldest = new Date("2026-01-01T00:00:00.000Z")
                        entityManager.find.mockResolvedValueOnce([
                            buildHistoryRow({
                                credits: 10,
                                createdAt: oldest,
                            }),
                        ])

                        const result = await service.getSnapshot(userId)

                        // week reset = oldest + 7 days
                        const expectedWeekReset = new Date(
                            oldest.getTime() + 7 * 24 * 60 * 60 * 1000,
                        )
                        expect(result.windowWeek.resetAt).toEqual(expectedWeekReset)
                    })

                it("returns null reset timestamps and zero usage with no charges",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        // no charge rows at all
                        entityManager.find.mockResolvedValueOnce([])

                        const result = await service.getSnapshot(userId)

                        expect(result.usedCredits).toBe(0)
                        expect(result.windowWeek.resetAt).toBeNull()
                        expect(result.window5h.resetAt).toBeNull()
                        expect(result.overQuota).toBe(false)
                    })

                it("recomputes when the cache row is partial (missing usedCredits5h)",
                    async () => {
                        // a malformed cache row (only one numeric field) forces a recompute
                        cacheService.get.mockResolvedValueOnce({
                            usedCreditsWeek: 100,
                        } as never)
                        entityManager.find.mockResolvedValueOnce([])

                        await service.getSnapshot(userId)

                        // the compute path ran because the cache row was incomplete
                        expect(entityManager.find).toHaveBeenCalled()
                        expect(cacheService.set).toHaveBeenCalled()
                    })

                it("treats a null charge amount as zero credits",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        entityManager.find.mockResolvedValueOnce([
                            buildHistoryRow({
                                credits: null,
                            }),
                        ])

                        const result = await service.getSnapshot(userId)

                        expect(result.windowWeek.usedCredits).toBe(0)
                    })
            })

        describe("getHistory",
            () => {
                it("maps rows to history items and returns the total count",
                    async () => {
                        const createdAt = new Date("2026-02-02T00:00:00.000Z")
                        entityManager.findAndCount.mockResolvedValueOnce([
                            [
                                {
                                    id: "charge-1",
                                    mode: AiMode.Auto,
                                    recommendation: null,
                                    model: null,
                                    provider: null,
                                    credits: 7,
                                    createdAt,
                                },
                            ],
                            1,
                        ])

                        const result = await service.getHistory(userId,
                            {
                                limit: 10,
                                offset: 0,
                            })

                        expect(result).toEqual({
                            items: [
                                {
                                    id: "charge-1",
                                    mode: AiMode.Auto,
                                    recommendation: null,
                                    model: null,
                                    provider: null,
                                    credits: 7,
                                    createdAt,
                                },
                            ],
                            total: 1,
                        })
                    })

                it("forwards limit / offset as take / skip to the query",
                    async () => {
                        entityManager.findAndCount.mockResolvedValueOnce([
                            [],
                            0,
                        ])

                        const result = await service.getHistory(userId,
                            {
                                limit: 25,
                                offset: 50,
                            })

                        expect(result).toEqual({
                            items: [],
                            total: 0,
                        })
                        expect(entityManager.findAndCount).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                take: 25,
                                skip: 50,
                            }),
                        )
                    })
            })

        describe("invalidate",
            () => {
                it("deletes the cached usage totals for the user",
                    async () => {
                        await service.invalidate(userId)

                        expect(cacheService.del).toHaveBeenCalledWith({
                            key: CacheKey.CreditUsage,
                            args: [userId],
                        })
                    })
            })
    })
