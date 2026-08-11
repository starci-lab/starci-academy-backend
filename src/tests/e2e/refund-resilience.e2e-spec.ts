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
    CqrsModule,
} from "@nestjs/cqrs"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
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
    RefundCoursePurchaseResolver,
} from "@features/api/core/graphql/mutations/courses/refund-course-purchase/refund-course-purchase.resolver"
import {
    RefundCoursePurchaseService,
} from "@features/api/core/graphql/mutations/courses/refund-course-purchase/refund-course-purchase.service"
import {
    RefundCoursePurchaseHandler,
} from "@features/api/core/graphql/mutations/courses/refund-course-purchase/refund-course-purchase.handler"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

describe("a confirmed refund remains atomic and idempotent under races",
    () => {
        const ADMIN_KEY = "refund-resilience-admin"
        const MUTATION = `
            mutation Refund($request: RefundCoursePurchaseRequest!) {
                refundCoursePurchase(request: $request) {
                    success
                    error
                    data { transactionId status providerRefundReference alreadyRefunded revokedCourseIds }
                }
            }
        `
        let app: INestApplication
        let entityManager: EntityManager
        let transactionId: string
        let learnerId: string
        let courseId: string

        const refund = async (providerRefundReference: string) => request(app.getHttpServer())
            .post("/graphql")
            .set("x-admin-api-key",
                ADMIN_KEY)
            .send({
                query: MUTATION,
                variables: {
                    request: {
                        transactionId,
                        providerRefundReference,
                        reason: "provider-confirmed operational refund",
                    },
                },
            })

        beforeAll(async () => {
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
                        useValue: {
                            get: jest.fn(),
                            set: jest.fn(),
                            del: jest.fn(),
                        },
                    },
                    {
                        provide: MountStorageService,
                        useValue: {
                            adminApiKey: ADMIN_KEY
                        },
                    },
                ],
            }).compile()
            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get(getEntityManagerToken(POSTGRESQL_PRIMARY))
        })

        beforeEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE transaction_items, transactions, enrollments, courses, users RESTART IDENTITY CASCADE",
            )
            const learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: `refund-resilience-${Date.now()}`,
                }))
            learnerId = learner.id
            const course = await entityManager.save(entityManager.create(CourseEntity,
                {
                    title: "Refund resilience",
                    displayId: `refund-resilience-${Date.now()}`,
                    description: "refund fixture",
                    originalPrice: 10_000,
                    defaultLocale: Locale.En,
                }))
            courseId = course.id
            const transaction = await entityManager.save(entityManager.create(TransactionEntity,
                {
                    user: learner,
                    course,
                    referenceId: `captured-${Date.now()}`,
                    providerPaymentId: null,
                    amount: 10_000,
                    discountPercent: 0,
                    voucherCode: null,
                    pricingPhase: PricingPhase.Regular,
                    checkoutUrl: "https://provider.test/captured",
                    status: TransactionStatus.Succeeded,
                    paymentType: PaymentType.PayOS,
                    actionType: ActionType.Enroll,
                    aiSubTier: null,
                    installmentPlanId: null,
                    installmentMonths: null,
                    installmentMarkupPercent: null,
                    installmentTotalVnd: null,
                    refundReference: null,
                    refundReason: null,
                    refundedAt: null,
                }))
            transactionId = transaction.id
            await entityManager.save(entityManager.create(EnrollmentEntity,
                {
                    user: learner,
                    course,
                    pricingPhase: PricingPhase.Regular,
                    isEnrolled: true,
                }))
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
        })

        it("serializes the same evidence into one refund and one idempotent replay",
            async () => {
                const responses = await Promise.all([
                    refund("refund-race-same"),
                    refund("refund-race-same"),
                ])
                const payloads = responses.map((response) => response.body.data.refundCoursePurchase.data)

                expect(payloads.every((payload) => payload.status === TransactionStatus.Refunded)).toBe(true)
                expect(payloads.filter((payload) => payload.alreadyRefunded)).toHaveLength(1)
                expect((await entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: transactionId
                        },
                    })).refundReference).toBe("refund-race-same")
                expect((await entityManager.findOneOrFail(EnrollmentEntity,
                    {
                        where: {
                            user: {
                                id: learnerId
                            }, course: {
                                id: courseId
                            }
                        },
                    })).isEnrolled).toBe(false)
            })

        it("allows only one of two conflicting provider references to own the audit row",
            async () => {
                const responses = await Promise.all([
                    refund("refund-race-a"),
                    refund("refund-race-b"),
                ])
                const payloads = responses.map((response) => response.body.data.refundCoursePurchase)

                expect(payloads.filter((payload) => payload.success)).toHaveLength(1)
                expect(payloads.filter((payload) => payload.error === "TRANSACTION_REFUND_REFERENCE_CONFLICT_EXCEPTION"))
                    .toHaveLength(1)
                const persisted = await entityManager.findOneOrFail(TransactionEntity,
                    {
                        where: {
                            id: transactionId
                        },
                    })
                expect(["refund-race-a",
                    "refund-race-b"]).toContain(persisted.refundReference)
            })

        it("rolls the financial audit back when entitlement reversal fails",
            async () => {
                await entityManager.query(`
                    CREATE OR REPLACE FUNCTION fail_refund_enrollment_update() RETURNS trigger AS $$
                    BEGIN RAISE EXCEPTION 'injected entitlement reversal failure'; END;
                    $$ LANGUAGE plpgsql;
                    CREATE TRIGGER fail_refund_enrollment_update
                    BEFORE UPDATE ON enrollments
                    FOR EACH ROW EXECUTE FUNCTION fail_refund_enrollment_update();
                `)
                try {
                    const response = await refund("refund-must-roll-back")
                    expect(response.body.data.refundCoursePurchase.success).toBe(false)
                    const transaction = await entityManager.findOneOrFail(TransactionEntity,
                        {
                            where: {
                                id: transactionId
                            },
                        })
                    expect(transaction.status).toBe(TransactionStatus.Succeeded)
                    expect(transaction.refundReference).toBeNull()
                    expect((await entityManager.findOneOrFail(EnrollmentEntity,
                        {
                            where: {
                                user: {
                                    id: learnerId
                                }, course: {
                                    id: courseId
                                }
                            },
                        })).isEnrolled).toBe(true)
                } finally {
                    await entityManager.query(
                        "DROP TRIGGER IF EXISTS fail_refund_enrollment_update ON enrollments; DROP FUNCTION IF EXISTS fail_refund_enrollment_update();",
                    )
                }
            })
    })
