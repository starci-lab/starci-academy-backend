import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness"
import {
    DayjsService,
} from "@modules/mixin"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    envConfig,
} from "@modules/env"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import {
    ReconcileTransactionBootSweepService,
} from "./reconcile-transaction-boot-sweep.service"

dayjs.extend(utc)

// `envConfig()` is a plain factory fn read at boot; partially mock the env
// module so each test can dial delayMs/maxAttempts freely while the REAL
// config (read at import time by sibling modules) still works.
jest.mock("@modules/env",
    () => {
        const actual = jest.requireActual<typeof import("@modules/env")>("@modules/env")
        return {
            ...actual,
            envConfig: jest.fn(actual.envConfig),
        }
    })

const mockEnvConfig = envConfig as jest.MockedFunction<typeof envConfig>

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Frozen "now" every test measures elapsed-pending-time against. */
const NOW_ISO = "2026-07-21T00:00:00.000Z"

/** Stub the reconcile poll block of env config; overrides merge over sane defaults. */
const setEnv = (overrides: Partial<{
    delayMs: number
    maxAttempts: number
}> = {
}): void => {
    mockEnvConfig.mockReturnValue({
        services: {
            api: {
                transaction: {
                    reconcile: {
                        enabled: true,
                        delayMs: 60_000,
                        maxAttempts: 5,
                        ...overrides,
                    },
                },
            },
        },
    } as unknown as ReturnType<typeof envConfig>)
}

/**
 * Build a fake {@link DayjsService} whose `now()` is pinned to {@link NOW_ISO}
 * and whose `from()` mirrors the real implementation (`dayjs(config).utc()`),
 * so elapsed-time math in the SUT runs through real dayjs diffing.
 */
const makeDayjsService = (): jest.Mocked<Pick<DayjsService, "now" | "from">> =>
    ({
        now: jest.fn(() => dayjs(NOW_ISO).utc()),
        from: jest.fn((config: dayjs.ConfigType) => dayjs(config).utc()),
    } as unknown as jest.Mocked<Pick<DayjsService, "now" | "from">>)

/** The `select: { id, createdAt }` shape the SUT reads pending transactions as. */
type PendingRow = Pick<TransactionEntity, "id" | "createdAt">

/**
 * Build a pending-transaction row that has been pending for `elapsedMs` as of
 * {@link NOW_ISO} -- the only two fields the SUT's `select` projection reads.
 *
 * @param id - the transaction id
 * @param elapsedMs - how long ago (from NOW_ISO) the row was created
 */
const pendingRow = (id: string, elapsedMs: number): PendingRow => ({
    id,
    createdAt: dayjs(NOW_ISO).utc().subtract(elapsedMs,
        "milliseconds").toDate(),
})

describe("ReconcileTransactionBootSweepService",
    () => {
        let module: TestingModule
        let service: ReconcileTransactionBootSweepService
        let entityManager: EntityManagerMock
        let enqueueReconcileTransactionJobService: jest.Mocked<Pick<EnqueueReconcileTransactionJobService, "enqueue">>
        let dayjsService: jest.Mocked<Pick<DayjsService, "now" | "from">>
        let winstonService: jest.Mocked<Pick<WinstonService, "log">>

        beforeEach(async () => {
            setEnv()

            entityManager = makeEntityManagerMock()
            enqueueReconcileTransactionJobService = {
                enqueue: jest.fn(async () => undefined),
            } as unknown as jest.Mocked<Pick<EnqueueReconcileTransactionJobService, "enqueue">>
            dayjsService = makeDayjsService()
            winstonService = {
                log: jest.fn(),
            } as unknown as jest.Mocked<Pick<WinstonService, "log">>

            module = await Test.createTestingModule({
                providers: [
                    ReconcileTransactionBootSweepService,
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: enqueueReconcileTransactionJobService,
                    },
                    {
                        provide: DayjsService,
                        useValue: dayjsService,
                    },
                    {
                        provide: WinstonService,
                        useValue: winstonService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<ReconcileTransactionBootSweepService>(ReconcileTransactionBootSweepService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("onApplicationBootstrap",
            () => {
                it("queries the first page with the pending filter, then skips fresh rows and enqueues overdue ones with a clamped attempt",
                    async () => {
                        // fresh: still has its originally-scheduled delayed job -> skip
                        const fresh = pendingRow("tx-fresh",
                            30_000)
                        // overdue: 150s pending / 60s delay -> floor(2.5) = attempt 2
                        const overdue = pendingRow("tx-overdue",
                            150_000)
                        // way overdue: floor(15) clamped down to maxAttempts (5)
                        const wayOverdue = pendingRow("tx-way-overdue",
                            900_000)
                        entityManager.find.mockResolvedValueOnce([
                            fresh,
                            overdue,
                            wayOverdue,
                        ])

                        await service.onApplicationBootstrap()

                        expect(entityManager.find).toHaveBeenCalledTimes(1)
                        expect(entityManager.find).toHaveBeenCalledWith(
                            TransactionEntity,
                            {
                                where: {
                                    status: TransactionStatus.Pending,
                                },
                                select: {
                                    id: true,
                                    createdAt: true,
                                },
                                order: {
                                    createdAt: "ASC",
                                },
                                take: 200,
                                skip: 0,
                            },
                        )

                        // fresh row never enqueued; the two overdue rows are, immediately (delayMs: 0)
                        expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledTimes(2)
                        expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenNthCalledWith(1,
                            {
                                transactionId: "tx-overdue",
                                attempt: 2,
                                delayMs: 0,
                            })
                        expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenNthCalledWith(2,
                            {
                                transactionId: "tx-way-overdue",
                                attempt: 5,
                                delayMs: 0,
                            })

                        // one summary line with the total re-enqueued
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.TransactionReconcileBootSweep,
                            {
                                transactionId: "*",
                                attempt: 0,
                                count: 2,
                            },
                        )
                    })

                it("does nothing and logs a zero count when there are no pending transactions",
                    async () => {
                        // makeEntityManagerMock defaults `find` to resolve `[]`
                        await service.onApplicationBootstrap()

                        expect(entityManager.find).toHaveBeenCalledTimes(1)
                        expect(enqueueReconcileTransactionJobService.enqueue).not.toHaveBeenCalled()
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.TransactionReconcileBootSweep,
                            {
                                transactionId: "*",
                                attempt: 0,
                                count: 0,
                            },
                        )
                    })

                it("pages through a full first batch (200 rows) into a second, smaller batch",
                    async () => {
                        // a full page of fresh rows (skipped) so this test stays about
                        // pagination, not attempt math
                        const firstPage: Array<PendingRow> = Array.from(
                            {
                                length: 200,
                            },
                            (_, index) => pendingRow(`tx-fresh-${index}`,
                                30_000),
                        )
                        // the tail page is short -> the loop stops after this one
                        const secondPage = [
                            pendingRow("tx-second-page-overdue",
                                150_000),
                        ]
                        entityManager.find
                            .mockResolvedValueOnce(firstPage)
                            .mockResolvedValueOnce(secondPage)

                        await service.onApplicationBootstrap()

                        expect(entityManager.find).toHaveBeenCalledTimes(2)
                        expect(entityManager.find).toHaveBeenNthCalledWith(1,
                            TransactionEntity,
                            expect.objectContaining({
                                skip: 0,
                            }))
                        expect(entityManager.find).toHaveBeenNthCalledWith(2,
                            TransactionEntity,
                            expect.objectContaining({
                                skip: 200,
                            }))

                        // only the single overdue row from the second page was enqueued
                        expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledTimes(1)
                        expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledWith({
                            transactionId: "tx-second-page-overdue",
                            attempt: 2,
                            delayMs: 0,
                        })
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.TransactionReconcileBootSweep,
                            expect.objectContaining({
                                count: 1,
                            }),
                        )
                    })

                it("propagates a page-read failure and never emits the summary log",
                    async () => {
                        // no typed AbstractException fits here -- the SUT does not catch or
                        // wrap this call, so a raw driver failure is what actually propagates
                        const dbError = new Error("connection reset")
                        entityManager.find.mockRejectedValueOnce(dbError)

                        await expect(service.onApplicationBootstrap()).rejects.toThrow("connection reset")

                        expect(enqueueReconcileTransactionJobService.enqueue).not.toHaveBeenCalled()
                        expect(winstonService.log).not.toHaveBeenCalled()
                    })

                it("propagates an enqueue failure partway through a page and never emits the summary log",
                    async () => {
                        const first = pendingRow("tx-first",
                            150_000)
                        const second = pendingRow("tx-second",
                            150_000)
                        entityManager.find.mockResolvedValueOnce([
                            first,
                            second,
                        ])
                        // same honest-error note as above: the SUT does not catch this either
                        const queueError = new Error("queue unavailable")
                        enqueueReconcileTransactionJobService.enqueue
                            .mockResolvedValueOnce(undefined)
                            .mockRejectedValueOnce(queueError)

                        await expect(service.onApplicationBootstrap()).rejects.toThrow("queue unavailable")

                        // both rows were attempted (first succeeded, second is where it broke) ...
                        expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledTimes(2)
                        // ... but the loop never reaches the trailing summary log
                        expect(winstonService.log).not.toHaveBeenCalled()
                    })
            })
    })
