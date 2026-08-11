import request from "supertest"
import type {
    ExecutionContext,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakJwksService
} from "@modules/integrations/keycloak/jwks.service"
import {
    SessionService
} from "@modules/platform/session/session.service"
import {
    CookieService
} from "@modules/platform/cookie/cookie.service"
import {
    InstallmentPlanEntity,
} from "@modules/databases/postgresql/primary/entities/installment-plan.entity"
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
    InstallmentPlanStatus,
} from "@modules/databases/postgresql/primary/enums/installment-plan-status"
import {
    InstallmentPlanType,
} from "@modules/databases/postgresql/primary/enums/installment-plan-type"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
import {
    SEPAY,
} from "@modules/integrations/sepay/constants/sepay"
import {
    PAYOS,
} from "@modules/integrations/payos/constants/payos"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
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
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

/** A learner opens the next installment checkout through the production GraphQL door. */
describe("a learner starts payment for the next installment cycle",
    () => {
        const MONTHLY_AMOUNT_VND = 500_000

        let world: FlowWorld
        let currentUser: UserEntity | null = null
        let plan: InstallmentPlanEntity
        let transactionId: string
        const enqueueReconcile = {
            enqueue: jest.fn().mockResolvedValue(undefined),
        }

        const fakeAuthGuard = {
            canActivate: async (context: ExecutionContext): Promise<boolean> => {
                if (!currentUser) return false
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = currentUser
                return Promise.resolve(true)
            },
        }

        const MUTATION = `
            mutation Pay($request: PayNextInstallmentRequest!) {
                payNextInstallment(request: $request) {
                    success
                    error
                    data { planId transactionId referenceId checkoutUrl amount }
                }
            }
        `

        beforeAll(async () => {
            jest.spyOn(KeycloakAuthGraphQLGuard.prototype,
                "canActivate").mockImplementation(fakeAuthGuard.canActivate)
            world = await bootFlowWorld({
                imports: [ApolloServerModule.register({
                    type: ApolloServerType.Monolithic,
                    useServices: false,
                })],
                providers: [
                    PayNextInstallmentResolver,
                    PayNextInstallmentService,
                    PayNextInstallmentHandler,
                    InstallmentPlanService,
                    DayjsService,
                    RetryService,
                    {
                        provide: SEPAY,
                        useValue: {
                            checkout: {
                                initCheckoutUrl: jest.fn(() => "https://sepay.test/checkout"),
                                initOneTimePaymentFields: jest.fn((fields: unknown) => fields),
                            },
                        },
                    },
                    {
                        provide: PAYOS,
                        useValue: {
                            paymentRequests: {
                                create: jest.fn()
                            },
                        },
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: enqueueReconcile,
                    },
                    {
                        provide: KeycloakAuthGraphQLGuard,
                        useValue: fakeAuthGuard,
                    },
                    {
                        provide: KeycloakJwksService, useValue: {
                        }
                    },
                    {
                        provide: SessionService, useValue: {
                        }
                    },
                    {
                        provide: CookieService, useValue: {
                        }
                    },
                ],
            })

            await world.truncate("installment_plans",
                "transactions",
                "users")
            currentUser = await world.mintLearner("installment-payment")
            plan = await world.entityManager.save(
                world.entityManager.create(InstallmentPlanEntity,
                    {
                        user: currentUser,
                        originTransaction: null,
                        lockedCourseIds: [],
                        planType: InstallmentPlanType.Fixed,
                        status: InstallmentPlanStatus.Active,
                        months: 3,
                        monthlyAmountVnd: MONTHLY_AMOUNT_VND,
                        totalAmountVnd: MONTHLY_AMOUNT_VND * 3,
                        markupPercent: 10,
                        installmentsPaid: 1,
                        nextDueAt: new Date(),
                    }),
            )
        })

        afterAll(async () => world?.close())

        it("creates the next-cycle checkout through GraphQL",
            async () => {
                const response = await request(world.app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: MUTATION,
                        variables: {
                            request: {
                                planId: plan.id,
                                paymentType: PaymentType.Sepay,
                            },
                        },
                    })

                expect(response.status).toBe(200)
                expect(response.body.errors).toBeUndefined()
                const payload = response.body.data.payNextInstallment
                expect(payload.success).toBe(true)
                transactionId = payload.data.transactionId
            })

        it("persists a pending installment payment and schedules reconciliation",
            async () => {
                const transaction = await world.entityManager.findOneByOrFail(TransactionEntity,
                    {
                        id: transactionId,
                    })
                expect(transaction).toMatchObject({
                    userId: currentUser?.id,
                    installmentPlanId: plan.id,
                    actionType: ActionType.InstallmentPayment,
                    paymentType: PaymentType.Sepay,
                    status: TransactionStatus.Pending,
                    amount: MONTHLY_AMOUNT_VND,
                })
                expect(enqueueReconcile.enqueue).toHaveBeenCalledWith({
                    transactionId,
                })
            })
    })
