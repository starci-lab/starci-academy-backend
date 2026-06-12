import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    TransactionActionService,
} from "./transaction-action.service"
import {
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    TransactionNotFoundException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Build a transaction row in a known status.
 *
 * @param overrides - Partial fields to merge over the defaults.
 * @returns A transaction-shaped object usable as a `findOne` return row.
 */
const buildTransaction = (
    overrides: Partial<{ id: string; status: TransactionStatus }> = {
    },
): { id: string; status: TransactionStatus } => ({
    id: "txn-1",
    status: TransactionStatus.Pending,
    ...overrides,
})

describe("TransactionActionService",
    () => {
        let module: TestingModule
        let service: TransactionActionService
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            // fresh entity manager with happy-path defaults (findOne → null)
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    TransactionActionService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<TransactionActionService>(TransactionActionService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("updateTransactionStatus",
            () => {
                it("loads the transaction, flips its status and saves it",
                    async () => {
                        const transaction = buildTransaction()
                        entityManager.findOne.mockResolvedValueOnce(transaction)

                        await service.updateTransactionStatus({
                            id: "txn-1",
                            status: TransactionStatus.Succeeded,
                        })

                        // it looks the row up by id on the primary manager
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            TransactionEntity,
                            {
                                where: {
                                    id: "txn-1",
                                },
                            },
                        )
                        // the in-memory row is mutated then persisted
                        expect(transaction.status).toBe(TransactionStatus.Succeeded)
                        expect(entityManager.save).toHaveBeenCalledWith(transaction)
                    })

                it("throws TransactionNotFoundException when the row is missing",
                    async () => {
                        // default findOne resolves null → the guard must fire
                        await expect(
                            service.updateTransactionStatus({
                                id: "missing",
                                status: TransactionStatus.Succeeded,
                            }),
                        ).rejects.toBeInstanceOf(TransactionNotFoundException)

                        // no save attempted on a missing row
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("uses the supplied transactional manager when one is passed",
                    async () => {
                        // a separate manager stands in for an open DB transaction
                        const txManager = makeEntityManagerMock()
                        const transaction = buildTransaction()
                        txManager.findOne.mockResolvedValueOnce(transaction)

                        await service.updateTransactionStatus({
                            id: "txn-1",
                            status: TransactionStatus.Failed,
                            entityManager: txManager as never,
                        })

                        // all I/O goes through the passed manager, not the injected one
                        expect(txManager.findOne).toHaveBeenCalled()
                        expect(txManager.save).toHaveBeenCalledWith(transaction)
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(transaction.status).toBe(TransactionStatus.Failed)
                    })
            })
    })
