// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handlers pull `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle (same guard as `course-enroll.e2e-spec.ts`).
import "@modules/bussiness"
import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
    CanActivate,
    ExecutionContext,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
    ApolloServerType,
} from "@modules/api"
import {
    CourseEntity,
    InstallmentPlanEntity,
    InstallmentPlanStatus,
    InstallmentPlanType,
    Locale,
    PaymentType,
    PrimaryPostgreSQLModule,
    TransactionEntity,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    EnqueueReconcileTransactionJobService,
    InstallmentPlanService,
} from "@modules/bussiness"
import {
    DayjsService,
    RetryService,
} from "@modules/mixin"
import {
    SEPAY,
} from "@modules/sepay"
import {
    PAYOS,
} from "@modules/payos"
import {
    MyInstallmentPlansResolver,
} from "@features/api/core/graphql/queries/installment-plans/my-installment-plans.resolver"
import {
    MyInstallmentPlansService,
} from "@features/api/core/graphql/queries/installment-plans/my-installment-plans.service"
import {
    PayNextInstallmentResolver,
} from "@features/api/core/graphql/mutations/installment-plans/pay-next-installment/pay-next-installment.resolver"
import {
    PayNextInstallmentService,
} from "@features/api/core/graphql/mutations/installment-plans/pay-next-installment/pay-next-installment.service"
import {
    PayNextInstallmentHandler,
} from "@features/api/core/graphql/mutations/installment-plans/pay-next-installment/pay-next-installment.handler"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the installment plan surface -- `myInstallmentPlans` (the
 * viewer's non-completed plans, enriched with this cycle's minimum payment +
 * gated course titles) and `payNextInstallment` (charges exactly that cycle's
 * minimum via a fresh Sepay checkout). Drives the real
 * {@link InstallmentPlanService} + {@link PayNextInstallmentHandler} against
 * Testcontainers Postgres.
 *
 * MOCKED (genuinely external): the PayOS/Sepay SDK clients (never hit the
 * network) and the delayed reconcile-poll queue hand-off -- same pattern as
 * `course-enroll.e2e-spec.ts`.
 *
 * REAL: Postgres, Apollo, `InstallmentPlanService`, `DayjsService`,
 * `RetryService`, the CQRS command bus + handler.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Installment plan surface (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let sepayClient: {
            checkout: {
                initCheckoutUrl: jest.Mock
                initOneTimePaymentFields: jest.Mock
            }
        }
        let enqueueReconcileTransactionJob: {
            enqueue: jest.Mock
        }

        /** The "logged in" user the overridden Keycloak guard stamps onto the request. */
        let currentUser: UserEntity | null = null

        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!currentUser) {
                    return false
                }
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = currentUser
                return true
            },
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const MY_INSTALLMENT_PLANS_QUERY = `
            query MyInstallmentPlans {
                myInstallmentPlans {
                    success
                    error
                    data {
                        plans {
                            id
                            planType
                            status
                            minPaymentVnd
                            months
                            installmentsPaid
                            monthlyAmountVnd
                            courses {
                                id
                                title
                            }
                        }
                    }
                }
            }
        `
        const PAY_NEXT_INSTALLMENT_MUTATION = `
            mutation PayNextInstallment($request: PayNextInstallmentRequest!) {
                payNextInstallment(request: $request) {
                    success
                    error
                    data {
                        planId
                        checkoutUrl
                        amount
                    }
                }
            }
        `

        const post = (query: string, variables: Record<string, unknown> = {
        }) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
                    variables,
                })

        beforeAll(async () => {
            sepayClient = {
                checkout: {
                    initCheckoutUrl: jest.fn(() => "https://sepay.test/checkout"),
                    initOneTimePaymentFields: jest.fn((fields: unknown) => fields),
                },
            }
            enqueueReconcileTransactionJob = {
                enqueue: jest.fn(),
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
                    // CommandBus + @CommandHandler discovery for PayNextInstallmentHandler
                    CqrsModule,
                ],
                providers: [
                    MyInstallmentPlansResolver,
                    MyInstallmentPlansService,
                    PayNextInstallmentResolver,
                    PayNextInstallmentService,
                    PayNextInstallmentHandler,
                    // REAL -- the whole installment lifecycle stack under test
                    InstallmentPlanService,
                    DayjsService,
                    RetryService,
                    // mocked -- genuinely external SDK clients / the async queue hand-off
                    {
                        provide: SEPAY,
                        useValue: sepayClient,
                    },
                    {
                        // never exercised (Sepay-only tests here) but the handler's DI
                        // graph resolves it unconditionally
                        provide: PAYOS,
                        useValue: {
                            paymentRequests: {
                                create: jest.fn(),
                            },
                        },
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: enqueueReconcileTransactionJob,
                    },
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(fakeAuthGuard)
                .compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"installment_plans\", \"transactions\", \"users\", \"courses\" "
                + "RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
            currentUser = null
        })

        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

        const seedCourse = async (displayId: string): Promise<CourseEntity> =>
            entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId,
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )

        /** Seed an Active `Fixed` installment plan gating one course. */
        const seedFixedPlan = async (
            user: UserEntity,
            course: CourseEntity,
        ): Promise<InstallmentPlanEntity> => {
            const monthlyAmountVnd = 500_000
            return entityManager.save(
                entityManager.create(InstallmentPlanEntity,
                    {
                        user,
                        originTransaction: null,
                        lockedCourseIds: [course.id],
                        planType: InstallmentPlanType.Fixed,
                        status: InstallmentPlanStatus.Active,
                        months: 3,
                        monthlyAmountVnd,
                        totalAmountVnd: monthlyAmountVnd * 3,
                        markupPercent: 10,
                        installmentsPaid: 1,
                        nextDueAt: new Date(),
                    }),
            )
        }

        describe("myInstallmentPlans",
            () => {
                it("lists the viewer's plan enriched with this cycle's minimum + the gated course title",
                    async () => {
                        currentUser = await seedUser("kc-myinstallment-happy")
                        const course = await seedCourse("myinstallment-happy-course")
                        const plan = await seedFixedPlan(currentUser,
                            course)

                        const response = await post(MY_INSTALLMENT_PLANS_QUERY)

                        expect(response.status).toBe(200)
                        const body = response.body.data.myInstallmentPlans
                        expect(body.success).toBe(true)
                        expect(body.data.plans).toHaveLength(1)
                        const item = body.data.plans[0]
                        expect(item.id).toBe(plan.id)
                        expect(item.status).toBe("active")
                        // Fixed plan's minimum = the fixed monthly amount
                        expect(item.minPaymentVnd).toBe(500_000)
                        expect(item.months).toBe(3)
                        expect(item.installmentsPaid).toBe(1)
                        expect(item.courses).toHaveLength(1)
                        expect(item.courses[0].title).toBe(course.title)
                    })

                it("no user attached to the request → guard denies before the resolver ever runs",
                    async () => {
                        const response = await post(MY_INSTALLMENT_PLANS_QUERY)

                        expect(response.body.data).toBeNull()
                        expect(response.body.errors).toBeDefined()
                        expect(response.body.errors.length).toBeGreaterThan(0)
                    })
            })

        describe("payNextInstallment",
            () => {
                it("charges exactly this cycle's minimum via a real Sepay checkout + persists a Pending transaction",
                    async () => {
                        currentUser = await seedUser("kc-payinstallment-happy")
                        const course = await seedCourse("payinstallment-happy-course")
                        const plan = await seedFixedPlan(currentUser,
                            course)

                        const response = await post(PAY_NEXT_INSTALLMENT_MUTATION,
                            {
                                request: {
                                    planId: plan.id,
                                    paymentType: PaymentType.Sepay,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.payNextInstallment
                        expect(body.success).toBe(true)
                        expect(body.data.planId).toBe(plan.id)
                        expect(body.data.amount).toBe("500000")
                        expect(body.data.checkoutUrl).toBe("https://sepay.test/checkout")
                        expect(sepayClient.checkout.initOneTimePaymentFields)
                            .toHaveBeenCalledWith(
                                expect.objectContaining({
                                    order_amount: 500_000,
                                    currency: "VND",
                                }),
                            )

                        const transaction = await entityManager.findOneOrFail(
                            TransactionEntity,
                            {
                                where: {
                                    installmentPlanId: plan.id,
                                },
                            },
                        )
                        expect(transaction.amount).toBe(500_000)
                        expect(transaction.paymentType).toBe(PaymentType.Sepay)
                        expect(enqueueReconcileTransactionJob.enqueue).toHaveBeenCalledWith(
                            expect.objectContaining({
                                transactionId: transaction.id,
                            }),
                        )
                    })

                it("a plan belonging to ANOTHER user is rejected as not-found — ownership never leaked, nothing written",
                    async () => {
                        const owner = await seedUser("kc-payinstallment-owner")
                        const course = await seedCourse("payinstallment-notfound-course")
                        const plan = await seedFixedPlan(owner,
                            course)
                        // a DIFFERENT authenticated user tries to pay someone else's plan
                        currentUser = await seedUser("kc-payinstallment-intruder")

                        const response = await post(PAY_NEXT_INSTALLMENT_MUTATION,
                            {
                                request: {
                                    planId: plan.id,
                                    paymentType: PaymentType.Sepay,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.payNextInstallment
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("INSTALLMENT_PLAN_NOT_FOUND_EXCEPTION")
                        expect(body.data).toBeNull()
                        expect(sepayClient.checkout.initOneTimePaymentFields).not.toHaveBeenCalled()

                        const count = await entityManager.count(TransactionEntity,
                            {
                                where: {
                                    installmentPlanId: plan.id,
                                },
                            })
                        expect(count).toBe(0)
                    })
            })
    })
