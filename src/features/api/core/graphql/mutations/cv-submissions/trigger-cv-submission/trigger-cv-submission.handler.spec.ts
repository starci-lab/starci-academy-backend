// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    EnqueueProcessCvSubmissionJobService,
} from "@modules/bussiness"
import {
    CvSubmissionStatus,
} from "@modules/databases"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    UserEntity,
} from "@modules/databases"
import {
    TriggerCvSubmissionCommand,
} from "./trigger-cv-submission.command"
import {
    TriggerCvSubmissionHandler,
} from "./trigger-cv-submission.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Build a minimal user stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("TriggerCvSubmissionHandler",
    () => {
        let module: TestingModule
        let handler: TriggerCvSubmissionHandler
        let entityManager: EntityManagerMock
        let enqueueService: jest.Mocked<Pick<EnqueueProcessCvSubmissionJobService, "enqueue">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // processing job hand-off — assert it is enqueued on the happy path
            enqueueService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueProcessCvSubmissionJobService, "enqueue">>

            module = await Test.createTestingModule({
                providers: [
                    TriggerCvSubmissionHandler,
                    {
                        provide: EnqueueProcessCvSubmissionJobService,
                        useValue: enqueueService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<TriggerCvSubmissionHandler>(TriggerCvSubmissionHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("marks the latest pending attempt processing and enqueues the job",
            async () => {
                // submission found, then the latest attempt is still pending
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "cv-1",
                    })
                    .mockResolvedValueOnce({
                        id: "attempt-1",
                        status: CvSubmissionStatus.Pending,
                    })

                const result = await handler.execute(
                    new TriggerCvSubmissionCommand({
                        request: {
                            cvSubmissionId: "cv-1",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the attempt is flipped to processing before enqueueing
                expect(entityManager.update).toHaveBeenCalledWith(
                    expect.anything(),
                    "attempt-1",
                    expect.objectContaining({
                        status: CvSubmissionStatus.Processing,
                    }),
                )
                // the processing job is enqueued for the resolved submission + attempt
                expect(enqueueService.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: "user-1",
                        cvSubmissionId: "cv-1",
                        cvSubmissionAttemptId: "attempt-1",
                    }),
                )
                expect(result).toEqual({
                    success: true,
                    message: "CV processing has been queued.",
                })
            })

        it("throws when the submission does not exist (no enqueue)",
            async () => {
                // submission lookup finds nothing
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new TriggerCvSubmissionCommand({
                            request: {
                                cvSubmissionId: "missing",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toThrow("CV submission not found.")

                expect(enqueueService.enqueue).not.toHaveBeenCalled()
            })

        it("throws when the resolved attempt is no longer pending (no enqueue)",
            async () => {
                // submission found, but the latest attempt already moved past pending
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "cv-1",
                    })
                    .mockResolvedValueOnce({
                        id: "attempt-1",
                        status: CvSubmissionStatus.Processing,
                    })

                await expect(
                    handler.execute(
                        new TriggerCvSubmissionCommand({
                            request: {
                                cvSubmissionId: "cv-1",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toThrow(/already/)

                // a non-pending attempt is never re-enqueued
                expect(entityManager.update).not.toHaveBeenCalled()
                expect(enqueueService.enqueue).not.toHaveBeenCalled()
            })
    })
