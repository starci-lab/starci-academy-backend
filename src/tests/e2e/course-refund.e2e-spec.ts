import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    GraphQLAdminAccessGuard,
} from "@modules/bussiness/guards/graphql-admin-access.guard"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    RefundCoursePurchaseResolver,
} from "@features/api/core/graphql/mutations/courses/refund-course-purchase/refund-course-purchase.resolver"
import {
    RefundCoursePurchaseService,
} from "@features/api/core/graphql/mutations/courses/refund-course-purchase/refund-course-purchase.service"
import {
    RefundCoursePurchaseHandler,
} from "@features/api/core/graphql/mutations/courses/refund-course-purchase/refund-course-purchase.handler"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

/**
 * The bank fails after capture, so the money and the access both go back.
 *
 * The bank ledger is an in-memory boundary because an E2E lane must never move
 * real money. Everything after that boundary is real: GraphQL HTTP, the admin
 * guard, PostgreSQL row locking, transaction audit columns, enrollment write,
 * and enrolled-course cache invalidation.
 *
 * This ordering is intentional. `refundCoursePurchase` accepts a provider
 * reference only after the external refund succeeds; it must never revoke
 * access and claim money was returned merely because an upstream call started.
 */
describe("the bank fails after capture, so the money and the access both go back",
    () => {
        const ADMIN_API_KEY = "course-refund-flow-admin-key"
        const CAPTURED_AMOUNT = 10_000
        const REFUND_REFERENCE = "bank-refund-course-flow-1"
        const MUTATION = `
            mutation RefundCoursePurchase($request: RefundCoursePurchaseRequest!) {
                refundCoursePurchase(request: $request) {
                    success
                    error
                    data {
                        transactionId
                        status
                        providerRefundReference
                        revokedCourseIds
                        alreadyRefunded
                        refundedAt
                    }
                }
            }
        `

        let app: INestApplication
        let entityManager: EntityManager
        let cache: {
            get: jest.Mock
            set: jest.Mock
            del: jest.Mock
        }
        let learnerId: string
        let courseId: string
        let transactionId: string

        // The smallest honest stand-in for the external bank wallet: capture
        // removes value, refund restores it and yields immutable evidence.
        const bank = {
            walletBalance: 50_000,
            captured: new Map<string, number>(),
            refunds: new Set<string>(),
            capture(reference: string, amount: number): void {
                this.walletBalance -= amount
                this.captured.set(reference,
                    amount)
            },
            refund(captureReference: string, refundReference: string): void {
                const amount = this.captured.get(captureReference)
                if (amount === undefined || this.refunds.has(refundReference)) {
                    throw new Error("invalid or duplicate bank refund")
                }
                this.walletBalance += amount
                this.refunds.add(refundReference)
            },
        }

        beforeAll(async () => {
            cache = {
                get: jest.fn().mockResolvedValue(undefined),
                set: jest.fn().mockResolvedValue(undefined),
                del: jest.fn().mockResolvedValue(undefined),
            }
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    CqrsModule,
                ],
                providers: [
                    RefundCoursePurchaseResolver,
                    RefundCoursePurchaseService,
                    RefundCoursePurchaseHandler,
                    UserService,
                    GraphQLAdminAccessGuard,
                    {
                        provide: CacheService,
                        useValue: cache,
                    },
                    {
                        provide: MountStorageService,
                        useValue: {
                            get adminApiKey() {
                                return ADMIN_API_KEY
                            },
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            await entityManager.query(
                "TRUNCATE TABLE \"transaction_items\", \"transactions\", \"enrollments\", \"courses\", \"users\" RESTART IDENTITY CASCADE",
            )

            const learner = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-course-refund-flow",
                    }),
            )
            learnerId = learner.id
            const course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Refundable course",
                        displayId: "course-refund-flow",
                        description: "e2e fixture course",
                        originalPrice: CAPTURED_AMOUNT,
                        defaultLocale: Locale.En,
                    }),
            )
            courseId = course.id
            const transaction = await entityManager.save(
                entityManager.create(TransactionEntity,
                    {
                        user: learner,
                        course,
                        referenceId: "capture-course-refund-flow",
                        providerPaymentId: null,
                        amount: CAPTURED_AMOUNT,
                        discountPercent: 0,
                        voucherCode: null,
                        pricingPhase: PricingPhase.EarlyBird,
                        checkoutUrl: "https://bank.test/capture",
                        status: TransactionStatus.Succeeded,
                        paymentType: PaymentType.Sepay,
                        actionType: ActionType.Enroll,
                        aiSubTier: null,
                        installmentPlanId: null,
                        installmentMonths: null,
                        installmentMarkupPercent: null,
                        installmentTotalVnd: null,
                        refundReference: null,
                        refundReason: null,
                        refundedAt: null,
                    }),
            )
            transactionId = transaction.id
            await entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user: learner,
                        course,
                        pricingPhase: PricingPhase.EarlyBird,
                        isEnrolled: true,
                    }),
            )
            bank.capture(transaction.referenceId,
                CAPTURED_AMOUNT)
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
        })

        it("starts with captured money and paid course access",
            async () => {
                expect(bank.walletBalance).toBe(40_000)
                const enrollment = await entityManager.findOneOrFail(
                    EnrollmentEntity,
                    {
                        where: {
                            user: {
                                id: learnerId,
                            },
                            course: {
                                id: courseId,
                            },
                        },
                    },
                )
                expect(enrollment.isEnrolled).toBe(true)
            })

        it("returns the money upstream before asking the API to reverse access",
            () => {
                bank.refund("capture-course-refund-flow",
                    REFUND_REFERENCE)
                expect(bank.walletBalance).toBe(50_000)
                expect(bank.refunds.has(REFUND_REFERENCE)).toBe(true)
            })

        it("commits the confirmed refund and closes the entitlement",
            async () => {
                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .set("x-admin-api-key",
                        ADMIN_API_KEY)
                    .send({
                        query: MUTATION,
                        variables: {
                            request: {
                                transactionId,
                                providerRefundReference: REFUND_REFERENCE,
                                reason: "bank settlement failed after capture",
                            },
                        },
                    })

                expect(response.status).toBe(200)
                const body = response.body.data.refundCoursePurchase
                expect(body.error).toBeNull()
                expect(body).toMatchObject({
                    success: true,
                })
                expect(body.data).toMatchObject({
                    transactionId,
                    status: TransactionStatus.Refunded,
                    providerRefundReference: REFUND_REFERENCE,
                    revokedCourseIds: [courseId],
                    alreadyRefunded: false,
                })

                const refunded = await entityManager.findOneOrFail(
                    TransactionEntity,
                    {
                        where: {
                            id: transactionId,
                        },
                    },
                )
                expect(refunded.status).toBe(TransactionStatus.Refunded)
                expect(refunded.refundReference).toBe(REFUND_REFERENCE)
                expect(refunded.refundedAt).toBeInstanceOf(Date)

                const enrollment = await entityManager.findOneOrFail(
                    EnrollmentEntity,
                    {
                        where: {
                            user: {
                                id: learnerId,
                            },
                            course: {
                                id: courseId,
                            },
                        },
                    },
                )
                expect(enrollment.isEnrolled).toBe(false)
                expect(cache.del).toHaveBeenCalledWith({
                    key: expect.any(String),
                    args: [learnerId],
                })
            })

        it("replays the same evidence idempotently but rejects replacement evidence",
            async () => {
                const replay = await request(app.getHttpServer())
                    .post("/graphql")
                    .set("x-admin-api-key",
                        ADMIN_API_KEY)
                    .send({
                        query: MUTATION,
                        variables: {
                            request: {
                                transactionId,
                                providerRefundReference: REFUND_REFERENCE,
                                reason: "safe retry",
                            },
                        },
                    })
                expect(replay.body.data.refundCoursePurchase.data.alreadyRefunded).toBe(true)

                const conflict = await request(app.getHttpServer())
                    .post("/graphql")
                    .set("x-admin-api-key",
                        ADMIN_API_KEY)
                    .send({
                        query: MUTATION,
                        variables: {
                            request: {
                                transactionId,
                                providerRefundReference: "another-bank-refund",
                                reason: "must not replace audit evidence",
                            },
                        },
                    })
                expect(conflict.body.data.refundCoursePurchase).toEqual({
                    success: false,
                    error: "TRANSACTION_REFUND_REFERENCE_CONFLICT_EXCEPTION",
                    data: null,
                })
            })
    })
