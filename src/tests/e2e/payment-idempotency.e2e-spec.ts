import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    TransactionActionService,
} from "@modules/bussiness/transactions/atomic/transaction-action.service"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
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
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"

const POSTGRESQL_PRIMARY = "primary"

/**
 * The webhook wake-up, delayed poll and restart sweep can all race the same
 * transaction. Their shared settlement gate is the guarded Pending claim;
 * this database integration proves only one contender can own side effects.
 */
describe("payment settlement claim idempotency (e2e)",
    () => {
        let entityManager: EntityManager
        let transactionActionService: TransactionActionService
        let close: () => Promise<void>

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    TransactionActionService,
                ],
            }).compile()
            entityManager = moduleRef.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            transactionActionService = moduleRef.get(TransactionActionService)
            close = async () => moduleRef.close().catch(() => undefined)
        })

        afterAll(async () => {
            await close?.()
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"transactions\", \"users\" RESTART IDENTITY CASCADE",
            )
        })

        it("lets exactly one of webhook, delayed poll and boot sweep settle",
            async () => {
                const user = await entityManager.save(
                    entityManager.create(UserEntity,
                        {
                            keycloakId: "kc-three-way-payment-race",
                        }),
                )
                const transaction = await entityManager.save(
                    entityManager.create(TransactionEntity,
                        {
                            user,
                            referenceId: "three-way-payment-race",
                            amount: 10_000,
                            pricingPhase: PricingPhase.Regular,
                            checkoutUrl: "https://gateway.test/pending",
                            status: TransactionStatus.Pending,
                            paymentType: PaymentType.PayOS,
                            actionType: ActionType.AiSubscriptionPurchase,
                        }),
                )

                const claim = async (): Promise<boolean> => transactionActionService
                    .updateTransactionStatusIfExpected({
                        id: transaction.id,
                        expectedStatus: TransactionStatus.Pending,
                        status: TransactionStatus.Succeeded,
                    })
                const claims = await Promise.all([
                    claim(),
                    claim(),
                    claim(),
                ])

                expect(claims.filter(Boolean)).toHaveLength(1)
                const settled = await entityManager.findOneByOrFail(
                    TransactionEntity,
                    {
                        id: transaction.id,
                    },
                )
                expect(settled.status).toBe(TransactionStatus.Succeeded)
            })

        it("does not let replay reopen a terminal transaction",
            async () => {
                const user = await entityManager.save(
                    entityManager.create(UserEntity,
                        {
                            keycloakId: "kc-terminal-payment-replay",
                        }),
                )
                const transaction = await entityManager.save(
                    entityManager.create(TransactionEntity,
                        {
                            user,
                            referenceId: "terminal-payment-replay",
                            amount: 10_000,
                            pricingPhase: PricingPhase.Regular,
                            checkoutUrl: "https://gateway.test/paid",
                            status: TransactionStatus.Succeeded,
                            paymentType: PaymentType.Sepay,
                            actionType: ActionType.AiSubscriptionPurchase,
                        }),
                )

                const won = await transactionActionService
                    .updateTransactionStatusIfExpected({
                        id: transaction.id,
                        expectedStatus: TransactionStatus.Pending,
                        status: TransactionStatus.Succeeded,
                    })
                expect(won).toBe(false)
            })
    })
