import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    PAYOS,
} from "@modules/integrations/payos/constants/payos"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    PayosWebhookCommand,
} from "./webhook.command"
import type {
    PayosWebhookRequest,
} from "./dtos/request"
import {
    PayosWebhookHandler,
} from "./webhook.handler"

const POSTGRESQL_PRIMARY = "primary"
const ORDER_CODE = 123456
const TRANSACTION = {
    id: "txn-1",
    referenceId: String(ORDER_CODE),
    status: TransactionStatus.Pending,
}
const successBody = () => ({
    code: "00",
    success: true,
    data: {
        orderCode: ORDER_CODE,
    },
})
const webhookCommand = (body: object): PayosWebhookCommand =>
    new PayosWebhookCommand(body as PayosWebhookRequest)

describe("PayosWebhookHandler",
    () => {
        let module: TestingModule
        let handler: PayosWebhookHandler
        let entityManager: EntityManagerMock
        let verify: jest.Mock
        let enqueue: jest.Mock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            verify = jest.fn().mockResolvedValue(undefined)
            enqueue = jest.fn().mockResolvedValue(undefined)
            module = await Test.createTestingModule({
                providers: [
                    PayosWebhookHandler,
                    {
                        provide: PAYOS,
                        useValue: {
                            webhooks: {
                                verify,
                            },
                        },
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: {
                            enqueue,
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            }).compile()
            handler = module.get(PayosWebhookHandler)
        })

        afterEach(async () => module.close())

        it("verifies the signature then enqueues a deduplicated immediate wake-up",
            async () => {
                const body = successBody()
                entityManager.findOne.mockResolvedValueOnce(TRANSACTION)
                await handler.execute(webhookCommand(body))
                expect(verify).toHaveBeenCalledWith(body)
                expect(enqueue).toHaveBeenCalledWith({
                    transactionId: "txn-1",
                    attempt: 1,
                    delayMs: 0,
                    lane: "fast",
                    deduplication: {
                        id: "payos-webhook:txn-1",
                        ttlMs: 30_000,
                    },
                })
            })

        it("rejects an invalid signature before reading the database",
            async () => {
                verify.mockRejectedValueOnce(new Error("invalid signature"))
                await expect(handler.execute(webhookCommand(successBody())))
                    .rejects.toThrow("invalid signature")
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(enqueue).not.toHaveBeenCalled()
            })

        it.each([
            {
                code: "01",
                success: false,
                data: {
                    orderCode: ORDER_CODE,
                },
            },
            {
                code: "00",
                success: true,
                data: {
                },
            },
        ])("acknowledges a non-success callback or validation probe",
            async (body) => {
                await handler.execute(webhookCommand(body))
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(enqueue).not.toHaveBeenCalled()
            })

        it.each([
            null,
            {
                ...TRANSACTION,
                status: TransactionStatus.Succeeded,
            },
            {
                ...TRANSACTION,
                status: TransactionStatus.Unpaid,
            },
        ])("acknowledges an unknown, replayed or terminal order",
            async (transaction) => {
                entityManager.findOne.mockResolvedValueOnce(transaction)
                await handler.execute(webhookCommand(successBody()))
                expect(enqueue).not.toHaveBeenCalled()
            })

        it("propagates a broker failure so delivery can be retried",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(TRANSACTION)
                enqueue.mockRejectedValueOnce(new Error("broker unavailable"))
                await expect(handler.execute(webhookCommand(successBody())))
                    .rejects.toThrow("broker unavailable")
            })
    })
