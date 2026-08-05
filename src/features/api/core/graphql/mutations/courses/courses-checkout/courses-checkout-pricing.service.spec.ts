import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    LoyaltyDiscountService,
} from "@modules/bussiness/loyalty/loyalty-discount.service"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import {
    CoursesCheckoutPricingService,
} from "./courses-checkout-pricing.service"
import {
    CoursePricingService,
} from "../course-enroll/course-pricing.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The buyer under test -- value is irrelevant; it is only threaded into params. */
const USER_ID = "user-1"

/** Fixed per-course prices the mocked {@link CoursePricingService} returns. */
const CHARGED_VND = 100
const LIST_VND = 200
const CHARGED_USD = 9.99
const LIST_USD = 19.99

describe("CoursesCheckoutPricingService",
    () => {
        let module: TestingModule
        let service: CoursesCheckoutPricingService
        let entityManager: EntityManagerMock
        let coursePricingService: jest.Mocked<CoursePricingService>
        let loyaltyDiscountService: jest.Mocked<LoyaltyDiscountService>

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            // pricing math is mocked to fixed values -- this suite tests priceCart's
            // orchestration (filter / progressive loyalty / summation), not the pricing
            coursePricingService = {
                resolveAmountVnd: jest.fn().mockReturnValue(CHARGED_VND),
                resolveListAmountVnd: jest.fn().mockReturnValue(LIST_VND),
                resolveAmountUsd: jest.fn().mockReturnValue(CHARGED_USD),
                resolveListAmountUsd: jest.fn().mockReturnValue(LIST_USD),
                getCurrentPricingPhase: jest.fn().mockReturnValue(PricingPhase.EarlyBird),
            } as unknown as jest.Mocked<CoursePricingService>

            loyaltyDiscountService = {
                // the DB-backed context -- the fix asserts this is called ONCE per cart
                computeLoyaltyContext: jest.fn().mockResolvedValue({
                    ownedCount: 0,
                    diligent: false,
                }),
                // pure per-line derivation
                resolveLoyaltyPercent: jest.fn().mockReturnValue({
                    percent: 0,
                    reason: "none",
                    enrolledCount: 0,
                }),
                computeBundleBonusPercent: jest.fn().mockReturnValue(5),
                applyBundleBonus: jest.fn().mockReturnValue(0),
            } as unknown as jest.Mocked<LoyaltyDiscountService>

            module = await Test.createTestingModule({
                providers: [
                    CoursesCheckoutPricingService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: CoursePricingService,
                        useValue: coursePricingService,
                    },
                    {
                        provide: LoyaltyDiscountService,
                        useValue: loyaltyDiscountService,
                    },
                ],
            }).compile()

            service = module.get<CoursesCheckoutPricingService>(CoursesCheckoutPricingService)
        })

        afterEach(async () => {
            await module.close()
        })

        /** Params for the local `programFinds` helper. */
        interface ProgramFindsParams {
            courses: Array<CourseEntity>
            ownedEnrollments?: Array<EnrollmentEntity>
        }

        /**
         * Program the two `find` calls priceCart makes: the courses lookup and the
         * paid-enrollment lookup (used to drop already-owned courses).
         */
        const programFinds = (
            {
                courses,
                ownedEnrollments = [],
            }: ProgramFindsParams,
        ): void => {
            entityManager.find.mockImplementation(async (entity: unknown) =>
                (entity === CourseEntity ? courses : ownedEnrollments))
        }

        /** A minimal course row (only the id is read by the mocked pricing). */
        const buildCourse = (id: string): CourseEntity => ({
            id,
        } as CourseEntity)

        describe("priceCart",
            () => {
                it("prices every purchasable course and fetches the loyalty context ONCE",
                    async () => {
                        programFinds({
                            courses: [
                                buildCourse("c1"),
                                buildCourse("c2"),
                                buildCourse("c3"),
                            ],
                        })

                        const result = await service.priceCart({
                            userId: USER_ID,
                            courseIds: [
                                "c1",
                                "c2",
                                "c3",
                            ],
                        })

                        // one line per course, totals summed from the fixed per-course prices
                        expect(result.lines).toHaveLength(3)
                        expect(result.itemCount).toBe(3)
                        expect(result.totalChargedVnd).toBe(3 * CHARGED_VND)
                        expect(result.totalListVnd).toBe(3 * LIST_VND)

                        // the N+1 fix: the DB-backed context is loaded exactly once for the cart
                        expect(loyaltyDiscountService.computeLoyaltyContext).toHaveBeenCalledTimes(1)
                        // and the pure per-line derivation runs once per course, progressively
                        expect(loyaltyDiscountService.resolveLoyaltyPercent).toHaveBeenCalledTimes(3)
                        expect(loyaltyDiscountService.resolveLoyaltyPercent).toHaveBeenNthCalledWith(
                            1,
                            expect.objectContaining({
                                extraOwnedCount: 0,
                            }),
                        )
                        expect(loyaltyDiscountService.resolveLoyaltyPercent).toHaveBeenNthCalledWith(
                            2,
                            expect.objectContaining({
                                extraOwnedCount: 1,
                            }),
                        )
                        expect(loyaltyDiscountService.resolveLoyaltyPercent).toHaveBeenNthCalledWith(
                            3,
                            expect.objectContaining({
                                extraOwnedCount: 2,
                            }),
                        )
                    })

                it("drops courses the buyer already owns",
                    async () => {
                        programFinds({
                            courses: [
                                buildCourse("c1"),
                                buildCourse("c2"),
                            ],
                            // a paid enrollment for c2 -> c2 is not purchasable
                            ownedEnrollments: [
                                {
                                    courseId: "c2",
                                } as EnrollmentEntity,
                            ],
                        })

                        const result = await service.priceCart({
                            userId: USER_ID,
                            courseIds: [
                                "c1",
                                "c2",
                            ],
                        })

                        expect(result.itemCount).toBe(1)
                        expect(result.lines[0].course.id).toBe("c1")
                    })

                it("throws CourseNotFoundException when a requested id does not resolve",
                    async () => {
                        // only one of the two requested ids resolves to a course row
                        programFinds({
                            courses: [
                                buildCourse("c1"),
                            ],
                        })

                        await expect(service.priceCart({
                            userId: USER_ID,
                            courseIds: [
                                "c1",
                                "missing",
                            ],
                        })).rejects.toBeInstanceOf(CourseNotFoundException)
                    })

                it("returns an empty result (no context load) for an empty request",
                    async () => {
                        const result = await service.priceCart({
                            userId: USER_ID,
                            courseIds: [],
                        })

                        expect(result.lines).toHaveLength(0)
                        expect(result.itemCount).toBe(0)
                        // short-circuits before touching the DB or loyalty
                        expect(entityManager.find).not.toHaveBeenCalled()
                        expect(loyaltyDiscountService.computeLoyaltyContext).not.toHaveBeenCalled()
                    })

                it("nulls the USD totals when any line lacks a USD price",
                    async () => {
                        programFinds({
                            courses: [
                                buildCourse("c1"),
                                buildCourse("c2"),
                            ],
                        })
                        // c2 (2nd priced line) has no USD price -> the order cannot total in USD
                        coursePricingService.resolveAmountUsd
                            .mockReturnValueOnce(CHARGED_USD)
                            .mockReturnValueOnce(null)

                        const result = await service.priceCart({
                            userId: USER_ID,
                            courseIds: [
                                "c1",
                                "c2",
                            ],
                        })

                        expect(result.totalChargedUsd).toBeNull()
                        // VND total is unaffected -- domestic checkout still works
                        expect(result.totalChargedVnd).toBe(2 * CHARGED_VND)
                    })
            })
    })
