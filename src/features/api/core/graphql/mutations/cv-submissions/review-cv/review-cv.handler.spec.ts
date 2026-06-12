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
    TemplateCVNotFoundException,
    UserCVSubmissionNotFoundException,
} from "@modules/exceptions"
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
    ReviewCvCommand,
} from "./review-cv.command"
import {
    ReviewCvHandler,
} from "./review-cv.handler"

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

describe("ReviewCvHandler",
    () => {
        let module: TestingModule
        let handler: ReviewCvHandler
        let entityManager: EntityManagerMock
        let enqueueService: jest.Mocked<Pick<EnqueueProcessCvSubmissionJobService, "enqueue">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // grading job hand-off — assert it is enqueued on the happy path
            enqueueService = {
                enqueue: jest.fn().mockResolvedValue({
                    id: "job-1",
                }),
            } as unknown as jest.Mocked<Pick<EnqueueProcessCvSubmissionJobService, "enqueue">>

            module = await Test.createTestingModule({
                providers: [
                    ReviewCvHandler,
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

            handler = module.get<ReviewCvHandler>(ReviewCvHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("enqueues the CV-review job and returns the job id",
            async () => {
                // the template exists, then the user's submission exists
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "tpl-1",
                    })
                    .mockResolvedValueOnce({
                        id: "cv-1",
                    })

                const result = await handler.execute(
                    new ReviewCvCommand({
                        request: {
                            cvSubmissionId: "cv-1",
                            templateCvId: "tpl-1",
                        },
                        user: fakeUser("user-1"),
                        locale: undefined,
                    }),
                )

                // the review job is enqueued for the resolved submission + template
                expect(enqueueService.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: "user-1",
                        cvSubmissionId: "cv-1",
                        templateCvId: "tpl-1",
                    }),
                )
                expect(result).toEqual({
                    jobId: "job-1",
                })
            })

        it("throws when the template does not exist (no enqueue)",
            async () => {
                // template lookup finds nothing
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new ReviewCvCommand({
                            request: {
                                cvSubmissionId: "cv-1",
                                templateCvId: "missing",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(TemplateCVNotFoundException)

                expect(enqueueService.enqueue).not.toHaveBeenCalled()
            })

        it("throws when the user's submission does not exist (no enqueue)",
            async () => {
                // template found, but the submission lookup finds nothing
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "tpl-1",
                    })
                    .mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new ReviewCvCommand({
                            request: {
                                cvSubmissionId: "missing",
                                templateCvId: "tpl-1",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserCVSubmissionNotFoundException)

                expect(enqueueService.enqueue).not.toHaveBeenCalled()
            })
    })
