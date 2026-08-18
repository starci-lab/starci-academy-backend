import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    UserFlashcardStatsProjectionService,
} from "./user-flashcard-stats-projection.service"
import type {
    PersistedUserFlashcardStatsValue,
    ReviewHistoryRow,
    ReviewMetaRow,
} from "./types"
import type {
    UserFlashcardStatsProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/user-flashcard-stats-projection.entity"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The user under test -- only ever threaded into params / SQL bindings. */
const USER_ID = "5f0b6e3a-3c9b-4a1e-9a5f-8f1c9d2e7b40"

/** Default TTL the SUT reads off `envConfig().projection.staleAfterMs` (5 minutes). */
const STALE_AFTER_MS = 5 * 60 * 1000

/** A fixed instant whose Asia/Ho_Chi_Minh calendar day is unambiguously 2026-03-15 (VN noon). */
const FROZEN_NOW = new Date("2026-03-15T05:00:00.000Z")

/** The VN calendar day of {@link FROZEN_NOW}. */
const VN_TODAY = "2026-03-15"

/** True when a raw SQL string is this projection's UPSERT (vs the two history reads). */
const isUpsertSql = (sql: unknown): boolean =>
    String(sql).includes("INSERT INTO user_flashcard_stats_projections")

/** True when a raw SQL string is the single-row meta aggregate (today + last review). */
const isMetaSql = (sql: unknown): boolean =>
    String(sql).includes("MAX(reviewed_at)")

describe("UserFlashcardStatsProjectionService",
    () => {
        let entityManager: EntityManagerMock

        /** Build the SUT wired to a fresh entity-manager mock registered under the primary token. */
        const build = async (): Promise<UserFlashcardStatsProjectionService> => {
            entityManager = makeEntityManagerMock()

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    UserFlashcardStatsProjectionService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()
            return module.get(UserFlashcardStatsProjectionService)
        }

        /**
         * Program a manager's raw-SQL mock so the history scan and the meta
         * aggregate answer independently, and the UPSERT resolves empty.
         */
        const programHistory = (
            manager: EntityManagerMock,
            history: Array<ReviewHistoryRow>,
            meta: ReviewMetaRow | undefined,
        ): void => {
            manager.query.mockImplementation(async (sql: unknown) => {
                if (isUpsertSql(sql)) {
                    return []
                }
                if (isMetaSql(sql)) {
                    return meta === undefined
                        ? []
                        : [
                            meta,
                        ]
                }
                return history
            })
        }

        /** Read back the jsonb payload the SUT handed to its UPSERT. */
        const persistedValue = (manager: EntityManagerMock): PersistedUserFlashcardStatsValue => {
            const call = manager.query.mock.calls.find(
                (entry: Array<unknown>) => isUpsertSql(entry[0]),
            ) as [unknown, Array<unknown>]
            return JSON.parse(String(call[1][1])) as PersistedUserFlashcardStatsValue
        }

        /** Build a projection row carrying the given jsonb value + freshness timestamp. */
        const buildRow = (
            value: Record<string, unknown> | undefined,
            updatedAt: Date,
        ): UserFlashcardStatsProjectionEntity => ({
            userId: USER_ID,
            value,
            updatedAt,
        } as unknown as UserFlashcardStatsProjectionEntity)

        afterEach(() => {
            jest.useRealTimers()
        })

        describe("recompute",
            () => {
                it("folds the scanned history into the persisted jsonb value on the injected connection",
                    async () => {
                        const service = await build()
                        programHistory(
                            entityManager,
                            [
                                {
                                    day: "2026-03-10",
                                    grade: 2,
                                },
                                {
                                    day: "2026-03-11",
                                    grade: 3,
                                },
                                {
                                    day: "2026-03-12",
                                    grade: 0,
                                },
                                {
                                    day: "2026-03-14",
                                    grade: 1,
                                },
                                {
                                    day: VN_TODAY,
                                    grade: 2,
                                },
                                {
                                    day: VN_TODAY,
                                    grade: 2,
                                },
                            ],
                            {
                                today: VN_TODAY,
                                last_reviewed_at: "2026-03-15T04:30:00.000Z",
                            },
                        )

                        await service.recompute({
                            userId: USER_ID,
                        })

                        const upsertCall = entityManager.query.mock.calls.find(
                            (entry: Array<unknown>) => isUpsertSql(entry[0]),
                        ) as [unknown, Array<unknown>]
                        expect(upsertCall[1][0]).toBe(USER_ID)
                        expect(persistedValue(entityManager)).toEqual({
                            // 03-10 -> 03-11 -> 03-12 is the longest consecutive run
                            longestStreak: 3,
                            // 03-14 -> 03-15 ends on today, so the run is still live
                            currentStreak: 2,
                            // 4 of 6 reviews graded Good/Easy
                            retentionRate: 67,
                            totalReviewed: 6,
                            lastReviewedAt: "2026-03-15T04:30:00.000Z",
                            dailyReviewCounts: {
                                "2026-03-10": 1,
                                "2026-03-11": 1,
                                "2026-03-12": 1,
                                "2026-03-14": 1,
                                "2026-03-15": 2,
                            },
                            gradeDistribution: {
                                again: 1,
                                hard: 1,
                                good: 3,
                                easy: 1,
                            },
                        })
                    })

                it("honours the caller's transaction manager instead of the injected connection",
                    async () => {
                        const service = await build()
                        const txManager = makeEntityManagerMock()
                        programHistory(
                            txManager,
                            [],
                            {
                                today: VN_TODAY,
                                last_reviewed_at: null,
                            },
                        )

                        await service.recompute({
                            userId: USER_ID,
                            entityManager: txManager as unknown as EntityManager,
                        })

                        expect(txManager.query).toHaveBeenCalledTimes(3)
                        expect(entityManager.query).not.toHaveBeenCalled()
                        expect(persistedValue(txManager).lastReviewedAt).toBeNull()
                    })

                it("persists a zeroed value and an empty daily map when the meta aggregate returns no row",
                    async () => {
                        const service = await build()
                        programHistory(
                            entityManager,
                            [],
                            undefined,
                        )

                        await service.recompute({
                            userId: USER_ID,
                        })

                        expect(persistedValue(entityManager)).toEqual({
                            currentStreak: 0,
                            longestStreak: 0,
                            retentionRate: 0,
                            totalReviewed: 0,
                            lastReviewedAt: null,
                            dailyReviewCounts: {
                            },
                            gradeDistribution: {
                                again: 0,
                                hard: 0,
                                good: 0,
                                easy: 0,
                            },
                        })
                    })

                it("zeroes the current streak once the latest review day is older than yesterday",
                    async () => {
                        const service = await build()
                        programHistory(
                            entityManager,
                            [
                                {
                                    day: "2026-03-12",
                                    grade: 2,
                                },
                                {
                                    day: "2026-03-13",
                                    grade: 2,
                                },
                            ],
                            {
                                today: VN_TODAY,
                                last_reviewed_at: "2026-03-13T02:00:00.000Z",
                            },
                        )

                        await service.recompute({
                            userId: USER_ID,
                        })

                        const value = persistedValue(entityManager)
                        expect(value.currentStreak).toBe(0)
                        expect(value.longestStreak).toBe(2)
                    })

                it("counts a single review day reviewed yesterday as a live one-day streak",
                    async () => {
                        const service = await build()
                        programHistory(
                            entityManager,
                            [
                                {
                                    day: "2026-03-14",
                                    grade: 2,
                                },
                            ],
                            {
                                today: VN_TODAY,
                                last_reviewed_at: "2026-03-14T02:00:00.000Z",
                            },
                        )

                        await service.recompute({
                            userId: USER_ID,
                        })

                        const value = persistedValue(entityManager)
                        expect(value.currentStreak).toBe(1)
                        expect(value.longestStreak).toBe(1)
                        expect(value.retentionRate).toBe(100)
                    })

                it("drops review days older than the retained window from the stored daily map",
                    async () => {
                        const service = await build()
                        programHistory(
                            entityManager,
                            [
                                // 2025-12-16 is exactly the 90th day back -- retained
                                {
                                    day: "2025-12-16",
                                    grade: 2,
                                },
                                // 2025-12-15 falls one day outside the window -- dropped
                                {
                                    day: "2025-12-15",
                                    grade: 2,
                                },
                                {
                                    day: VN_TODAY,
                                    grade: 2,
                                },
                            ],
                            {
                                today: VN_TODAY,
                                last_reviewed_at: "2026-03-15T04:00:00.000Z",
                            },
                        )

                        await service.recompute({
                            userId: USER_ID,
                        })

                        const value = persistedValue(entityManager)
                        expect(value.dailyReviewCounts).toEqual({
                            "2025-12-16": 1,
                            "2026-03-15": 1,
                        })
                        // the dropped day still counts toward the lifetime totals
                        expect(value.totalReviewed).toBe(3)
                    })

                it("ignores an out-of-range grade in the distribution while still counting it as reviewed",
                    async () => {
                        const service = await build()
                        programHistory(
                            entityManager,
                            [
                                {
                                    day: VN_TODAY,
                                    grade: 7,
                                },
                                {
                                    day: VN_TODAY,
                                    grade: 1,
                                },
                            ],
                            {
                                today: VN_TODAY,
                                last_reviewed_at: "2026-03-15T04:00:00.000Z",
                            },
                        )

                        await service.recompute({
                            userId: USER_ID,
                        })

                        const value = persistedValue(entityManager)
                        expect(value.gradeDistribution).toEqual({
                            again: 0,
                            hard: 1,
                            good: 0,
                            easy: 0,
                        })
                        expect(value.totalReviewed).toBe(2)
                        // grade 7 is >= the recalled floor, so retention still counts it
                        expect(value.retentionRate).toBe(50)
                    })

                it("propagates a failure raised by the history scan",
                    async () => {
                        const service = await build()
                        const dbError = new Error("connection lost")
                        entityManager.query.mockRejectedValueOnce(dbError)

                        await expect(service.recompute({
                            userId: USER_ID,
                        })).rejects.toThrow(dbError)
                    })
            })

        describe("getStats",
            () => {
                it("returns the stored stats straight from a fresh row without recomputing",
                    async () => {
                        const service = await build()
                        entityManager.findOne.mockResolvedValueOnce(buildRow(
                            {
                                currentStreak: 4,
                                longestStreak: 9,
                                retentionRate: 81,
                                totalReviewed: 120,
                                lastReviewedAt: "2026-03-15T04:00:00.000Z",
                                gradeDistribution: {
                                    again: 3,
                                    hard: 7,
                                    good: 60,
                                    easy: 50,
                                },
                            },
                            new Date(),
                        ))

                        const result = await service.getStats({
                            userId: USER_ID,
                        })

                        expect(result).toEqual({
                            currentStreak: 4,
                            longestStreak: 9,
                            retentionRate: 81,
                            totalReviewed: 120,
                            lastReviewedAt: "2026-03-15T04:00:00.000Z",
                            gradeDistribution: {
                                again: 3,
                                hard: 7,
                                good: 60,
                                easy: 50,
                            },
                        })
                        expect(entityManager.query).not.toHaveBeenCalled()
                        expect(entityManager.findOne).toHaveBeenCalledTimes(1)
                    })

                it("lazily recomputes a row past the staleness TTL, then re-reads it",
                    async () => {
                        const service = await build()
                        programHistory(
                            entityManager,
                            [],
                            {
                                today: VN_TODAY,
                                last_reviewed_at: null,
                            },
                        )
                        entityManager.findOne
                            .mockResolvedValueOnce(buildRow(
                                {
                                    totalReviewed: 1,
                                },
                                new Date(Date.now() - STALE_AFTER_MS - 1_000),
                            ))
                            .mockResolvedValueOnce(buildRow(
                                {
                                    totalReviewed: 42,
                                },
                                new Date(),
                            ))

                        const result = await service.getStats({
                            userId: USER_ID,
                        })

                        expect(entityManager.findOne).toHaveBeenCalledTimes(2)
                        expect(result.totalReviewed).toBe(42)
                    })

                it("recomputes a missing row and returns zeros when it is still absent afterwards",
                    async () => {
                        const service = await build()
                        programHistory(
                            entityManager,
                            [],
                            {
                                today: VN_TODAY,
                                last_reviewed_at: null,
                            },
                        )

                        const result = await service.getStats({
                            userId: USER_ID,
                        })

                        expect(result).toEqual({
                            currentStreak: 0,
                            longestStreak: 0,
                            retentionRate: 0,
                            totalReviewed: 0,
                            lastReviewedAt: null,
                            gradeDistribution: {
                                again: 0,
                                hard: 0,
                                good: 0,
                                easy: 0,
                            },
                        })
                    })

                it("coerces a non-numeric metric to 0 and a non-string lastReviewedAt to null",
                    async () => {
                        const service = await build()
                        entityManager.findOne.mockResolvedValueOnce(buildRow(
                            {
                                currentStreak: "not-a-number",
                                longestStreak: "12",
                                lastReviewedAt: 1_773_000_000_000,
                                gradeDistribution: null,
                            },
                            new Date(),
                        ))

                        const result = await service.getStats({
                            userId: USER_ID,
                        })

                        expect(result.currentStreak).toBe(0)
                        expect(result.longestStreak).toBe(12)
                        expect(result.lastReviewedAt).toBeNull()
                        expect(result.gradeDistribution).toEqual({
                            again: 0,
                            hard: 0,
                            good: 0,
                            easy: 0,
                        })
                    })

                it("propagates a findOne failure while reading the projection row",
                    async () => {
                        const service = await build()
                        const dbError = new Error("read replica unavailable")
                        entityManager.findOne.mockRejectedValueOnce(dbError)

                        await expect(service.getStats({
                            userId: USER_ID,
                        })).rejects.toThrow(dbError)
                    })
            })

        describe("getDailyActivity",
            () => {
                it("zero-fills the trailing window oldest-first from the stored per-day counts",
                    async () => {
                        const service = await build()
                        entityManager.findOne.mockResolvedValueOnce(buildRow(
                            {
                                dailyReviewCounts: {
                                    "2026-03-13": 5,
                                    "2026-03-15": 2,
                                    // a day outside the requested window must not leak in
                                    "2026-02-01": 99,
                                },
                            },
                            new Date(),
                        ))
                        jest.useFakeTimers().setSystemTime(FROZEN_NOW)

                        const window = await service.getDailyActivity({
                            userId: USER_ID,
                            days: 4,
                        })

                        expect(window).toEqual([
                            {
                                date: "2026-03-12",
                                cardsReviewed: 0,
                            },
                            {
                                date: "2026-03-13",
                                cardsReviewed: 5,
                            },
                            {
                                date: "2026-03-14",
                                cardsReviewed: 0,
                            },
                            {
                                date: "2026-03-15",
                                cardsReviewed: 2,
                            },
                        ])
                    })

                it("reads all zeros from a row written before the per-day map existed",
                    async () => {
                        const service = await build()
                        entityManager.findOne.mockResolvedValueOnce(buildRow(
                            {
                                totalReviewed: 10,
                            },
                            new Date(),
                        ))
                        jest.useFakeTimers().setSystemTime(FROZEN_NOW)

                        const window = await service.getDailyActivity({
                            userId: USER_ID,
                            days: 2,
                        })

                        expect(window).toEqual([
                            {
                                date: "2026-03-14",
                                cardsReviewed: 0,
                            },
                            {
                                date: VN_TODAY,
                                cardsReviewed: 0,
                            },
                        ])
                    })

                it("falls back to 0 for a non-numeric stored count",
                    async () => {
                        const service = await build()
                        entityManager.findOne.mockResolvedValueOnce(buildRow(
                            {
                                dailyReviewCounts: {
                                    "2026-03-15": "corrupted",
                                },
                            },
                            new Date(),
                        ))
                        jest.useFakeTimers().setSystemTime(FROZEN_NOW)

                        const window = await service.getDailyActivity({
                            userId: USER_ID,
                            days: 1,
                        })

                        expect(window).toEqual([
                            {
                                date: VN_TODAY,
                                cardsReviewed: 0,
                            },
                        ])
                    })

                it("returns an empty window for a zero-day request without touching the clock math",
                    async () => {
                        const service = await build()
                        entityManager.findOne.mockResolvedValueOnce(buildRow(
                            {
                                dailyReviewCounts: {
                                    "2026-03-15": 3,
                                },
                            },
                            new Date(),
                        ))
                        jest.useFakeTimers().setSystemTime(FROZEN_NOW)

                        const window = await service.getDailyActivity({
                            userId: USER_ID,
                            days: 0,
                        })

                        expect(window).toEqual([])
                    })

                it("recomputes first when the row backing the window is missing",
                    async () => {
                        const service = await build()
                        programHistory(
                            entityManager,
                            [],
                            {
                                today: VN_TODAY,
                                last_reviewed_at: null,
                            },
                        )
                        jest.useFakeTimers().setSystemTime(FROZEN_NOW)

                        const window = await service.getDailyActivity({
                            userId: USER_ID,
                            days: 1,
                        })

                        expect(entityManager.findOne).toHaveBeenCalledTimes(2)
                        expect(entityManager.query.mock.calls.some(
                            (entry: Array<unknown>) => isUpsertSql(entry[0]),
                        )).toBe(true)
                        expect(window).toEqual([
                            {
                                date: VN_TODAY,
                                cardsReviewed: 0,
                            },
                        ])
                    })
            })
    })
