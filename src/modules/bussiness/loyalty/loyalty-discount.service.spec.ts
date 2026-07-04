import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    DiscountReason,
} from "@modules/databases"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import {
    LoyaltyDiscountService,
} from "./loyalty-discount.service"
import {
    UserStatsProjectionService,
} from "../projections"
import type {
    LoyaltyContext,
} from "./types"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The user under test — value is irrelevant; it is only threaded into params. */
const USER_ID = "user-1"

describe("LoyaltyDiscountService",
    () => {
        let module: TestingModule
        let service: LoyaltyDiscountService
        let entityManager: EntityManagerMock
        let userStatsProjectionService: jest.Mocked<UserStatsProjectionService>

        beforeEach(async () => {
            // fresh entity-manager mock per test (query = COUNT enrollments, findOne = user row)
            entityManager = makeEntityManagerMock()
            // stub the projection read the diligence check depends on
            userStatsProjectionService = {
                getStats: jest.fn(),
            } as unknown as jest.Mocked<UserStatsProjectionService>

            module = await Test.createTestingModule({
                providers: [
                    LoyaltyDiscountService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: UserStatsProjectionService,
                        useValue: userStatsProjectionService,
                    },
                ],
            }).compile()

            service = module.get<LoyaltyDiscountService>(LoyaltyDiscountService)
        })

        afterEach(async () => {
            await module.close()
        })

        /**
         * Program the two DB inputs: the enrolled-course COUNT (raw query) and the
         * diligence signals (projection streak + materialized total points).
         */
        const programContext = (
            {
                ownedCount,
                streak,
                totalPoints,
            }: {
                ownedCount: number
                streak: number
                totalPoints: number
            },
        ): void => {
            // countEnrolledCourses → SELECT COUNT(*) ... returns a single {count} row
            entityManager.query.mockResolvedValue([
                {
                    count: String(ownedCount),
                },
            ])
            // isDiligent → projection streak
            userStatsProjectionService.getStats.mockResolvedValue({
                streak,
            } as unknown as Awaited<ReturnType<UserStatsProjectionService["getStats"]>>)
            // isDiligent fallback → materialized total points on the user row
            entityManager.findOne.mockResolvedValue({
                id: USER_ID,
                totalPoints,
            })
        }

        describe("computeLoyaltyContext",
            () => {
                it("reads the owned-course count + diligence exactly once",
                    async () => {
                        programContext({
                            ownedCount: 3,
                            streak: 0,
                            totalPoints: 0,
                        })

                        const context = await service.computeLoyaltyContext(USER_ID)

                        expect(context).toEqual<LoyaltyContext>({
                            ownedCount: 3,
                            diligent: false,
                        })
                        // one COUNT query + one projection read for the whole context
                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                        expect(userStatsProjectionService.getStats).toHaveBeenCalledTimes(1)
                    })

                it("is diligent when the streak meets the threshold (no points read needed)",
                    async () => {
                        programContext({
                            ownedCount: 0,
                            streak: 7,
                            totalPoints: 0,
                        })

                        const context = await service.computeLoyaltyContext(USER_ID)

                        expect(context.diligent).toBe(true)
                        // streak alone satisfied diligence → the user-row points read is skipped
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                    })

                it("is diligent when total points meet the threshold despite a low streak",
                    async () => {
                        programContext({
                            ownedCount: 0,
                            streak: 1,
                            totalPoints: 1000,
                        })

                        const context = await service.computeLoyaltyContext(USER_ID)

                        expect(context.diligent).toBe(true)
                    })
            })

        describe("resolveLoyaltyPercent",
            () => {
                it("returns no discount for a fresh, non-diligent user",
                    () => {
                        const result = service.resolveLoyaltyPercent({
                            context: {
                                ownedCount: 0,
                                diligent: false,
                            },
                        })

                        expect(result.percent).toBe(0)
                        expect(result.reason).toBe(DiscountReason.None)
                        expect(result.enrolledCount).toBe(0)
                    })

                it("grants +5 per owned course",
                    () => {
                        const result = service.resolveLoyaltyPercent({
                            context: {
                                ownedCount: 2,
                                diligent: false,
                            },
                        })

                        expect(result.percent).toBe(10)
                        expect(result.reason).toBe(DiscountReason.EnrolledCount)
                    })

                it("grants the flat diligent bonus on its own",
                    () => {
                        const result = service.resolveLoyaltyPercent({
                            context: {
                                ownedCount: 0,
                                diligent: true,
                            },
                        })

                        expect(result.percent).toBe(5)
                        expect(result.reason).toBe(DiscountReason.Diligent)
                    })

                it("combines both bonuses and reports the Both reason",
                    () => {
                        const result = service.resolveLoyaltyPercent({
                            context: {
                                ownedCount: 2,
                                diligent: true,
                            },
                        })

                        expect(result.percent).toBe(15)
                        expect(result.reason).toBe(DiscountReason.Both)
                    })

                it("caps the loyalty percent at 30",
                    () => {
                        const result = service.resolveLoyaltyPercent({
                            context: {
                                ownedCount: 10,
                                diligent: true,
                            },
                        })

                        // 10*5 + 5 = 55, capped to 30
                        expect(result.percent).toBe(30)
                    })

                it("treats extraOwnedCount as additional owned courses (progressive cart pricing)",
                    () => {
                        const result = service.resolveLoyaltyPercent({
                            context: {
                                ownedCount: 0,
                                diligent: false,
                            },
                            extraOwnedCount: 2,
                        })

                        // 0 real + 2 extra → 10%, and enrolledCount reflects the extra
                        expect(result.percent).toBe(10)
                        expect(result.enrolledCount).toBe(2)
                    })
            })

        describe("computeBundleBonusPercent",
            () => {
                it("gives no bundle bonus for a single course",
                    () => {
                        expect(service.computeBundleBonusPercent(1)).toBe(0)
                    })

                it("gives +5 for exactly two courses",
                    () => {
                        expect(service.computeBundleBonusPercent(2)).toBe(5)
                    })

                it("gives a flat +10 for three or more courses",
                    () => {
                        expect(service.computeBundleBonusPercent(3)).toBe(10)
                        expect(service.computeBundleBonusPercent(6)).toBe(10)
                    })
            })

        describe("applyBundleBonus",
            () => {
                it("adds the bundle bonus to the base loyalty percent",
                    () => {
                        expect(service.applyBundleBonus({
                            basePercent: 20,
                            itemCount: 3,
                        })).toBe(30)
                    })

                it("caps the combined loyalty + bundle percent at 40",
                    () => {
                        // 35 + 10 = 45, capped to the combined ceiling
                        expect(service.applyBundleBonus({
                            basePercent: 35,
                            itemCount: 3,
                        })).toBe(40)
                    })

                it("adds nothing for a single-course order",
                    () => {
                        expect(service.applyBundleBonus({
                            basePercent: 15,
                            itemCount: 1,
                        })).toBe(15)
                    })
            })

        describe("computeLoyaltyDiscount",
            () => {
                it("loads the context then derives the percent (owned + diligent)",
                    async () => {
                        programContext({
                            ownedCount: 1,
                            streak: 8,
                            totalPoints: 0,
                        })

                        const result = await service.computeLoyaltyDiscount({
                            userId: USER_ID,
                        })

                        // 1 owned (+5) + diligent (+5) = 10
                        expect(result.percent).toBe(10)
                        expect(result.reason).toBe(DiscountReason.Both)
                    })
            })
    })
