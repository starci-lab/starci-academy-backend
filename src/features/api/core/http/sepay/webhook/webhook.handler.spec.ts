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
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    SepayWebhookCommand,
} from "./webhook.command"
import {
    SepayWebhookHandler,
} from "./webhook.handler"

const POSTGRESQL_PRIMARY = "primary"
const INVOICE = "inv-123"
const TRANSACTION = {
    id: "txn-1",
    referenceId: INVOICE,
    status: TransactionStatus.Pending,
}

describe("SepayWebhookHandler",
    () => {
        let module: TestingModule
        let handler: SepayWebhookHandler
        let entityManager: EntityManagerMock
        let enqueue: jest.Mock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            enqueue = jest.fn().mockResolvedValue(undefined)
            module = await Test.createTestingModule({
                providers: [
                    SepayWebhookHandler,
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
            handler = module.get(SepayWebhookHandler)
        })

        afterEach(async () => module.close())

        it.each([
            {
                order_invoice_number: INVOICE,
            },
            {
                order: {
                    order_invoice_number: INVOICE,
                },
            },
        ])("enqueues one deduplicated immediate wake-up for a pending invoice",
            async (body) => {
                entityManager.findOne.mockResolvedValueOnce(TRANSACTION)

                await handler.execute(new SepayWebhookCommand(body))

                expect(enqueue).toHaveBeenCalledWith({
                    transactionId: "txn-1",
                    attempt: 1,
                    delayMs: 0,
                    lane: "fast",
                    deduplication: {
                        id: "sepay-webhook:txn-1",
                        ttlMs: 30_000,
                    },
                })
            })

        it("acknowledges a payload without an invoice",
            async () => {
                await expect(handler.execute(new SepayWebhookCommand({
                }))).resolves.toBeUndefined()
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
        ])("acknowledges an unknown, replayed or terminal invoice without enqueueing",
            async (transaction) => {
                entityManager.findOne.mockResolvedValueOnce(transaction)
                await handler.execute(new SepayWebhookCommand({
                    order_invoice_number: INVOICE,
                }))
                expect(enqueue).not.toHaveBeenCalled()
            })

        it("propagates a broker failure so delivery can be retried",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(TRANSACTION)
                enqueue.mockRejectedValueOnce(new Error("broker unavailable"))
                await expect(handler.execute(new SepayWebhookCommand({
                    order_invoice_number: INVOICE,
                }))).rejects.toThrow("broker unavailable")
            })
    })
