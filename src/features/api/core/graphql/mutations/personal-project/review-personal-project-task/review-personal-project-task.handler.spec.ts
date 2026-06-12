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
    BadRequestException,
} from "@nestjs/common"
import {
    EnqueueReviewPersonalProjectTaskJobService,
} from "@modules/bussiness"
import {
    GradingLaneValidationService,
} from "@modules/ai"
import {
    UrlValidatorService,
} from "@modules/vaildators"
import {
    NoPersonalProjectTasksFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    AiMode,
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
    ReviewPersonalProjectTaskCommand,
} from "./review-personal-project-task.command"
import {
    ReviewPersonalProjectTaskHandler,
} from "./review-personal-project-task.handler"

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

describe("ReviewPersonalProjectTaskHandler",
    () => {
        let module: TestingModule
        let handler: ReviewPersonalProjectTaskHandler
        let entityManager: EntityManagerMock
        let enqueueService: jest.Mocked<Pick<EnqueueReviewPersonalProjectTaskJobService, "enqueue">>
        let gradingLaneValidationService: jest.Mocked<Pick<GradingLaneValidationService, "validate">>
        let urlValidatorService: jest.Mocked<Pick<UrlValidatorService, "isParsable">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()
            // `findOneOrFail` is not part of the shared mock surface — add it
            entityManager.findOneOrFail = jest.fn()

            // grading job hand-off — assert it is enqueued on the happy path
            enqueueService = {
                enqueue: jest.fn().mockResolvedValue({
                    id: "job-1",
                }),
            } as unknown as jest.Mocked<Pick<EnqueueReviewPersonalProjectTaskJobService, "enqueue">>

            // lane validation returns a resolved auto lane by default
            gradingLaneValidationService = {
                validate: jest.fn().mockResolvedValue({
                    mode: AiMode.Auto,
                    gradingModel: null,
                    gradingProvider: null,
                }),
            } as unknown as jest.Mocked<Pick<GradingLaneValidationService, "validate">>

            // url syntactic validation — resolves by default (valid url)
            urlValidatorService = {
                isParsable: jest.fn(),
            } as unknown as jest.Mocked<Pick<UrlValidatorService, "isParsable">>

            module = await Test.createTestingModule({
                providers: [
                    ReviewPersonalProjectTaskHandler,
                    {
                        provide: EnqueueReviewPersonalProjectTaskJobService,
                        useValue: enqueueService,
                    },
                    {
                        provide: GradingLaneValidationService,
                        useValue: gradingLaneValidationService,
                    },
                    {
                        provide: UrlValidatorService,
                        useValue: urlValidatorService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<ReviewPersonalProjectTaskHandler>(ReviewPersonalProjectTaskHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user (no enrollment lookup)",
            async () => {
                await expect(
                    handler.execute(
                        new ReviewPersonalProjectTaskCommand({
                            request: {
                                courseId: "course-1",
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                // guard fires before loading the enrollment
                expect(entityManager.findOneOrFail).not.toHaveBeenCalled()
            })

        it("enqueues the grading job with the resolved url + task and returns the job id",
            async () => {
                // enrollment carries a stored url; an explicit taskId is provided
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: "enroll-1",
                    personalProjectGithubUrl: "https://github.com/me/repo",
                    personalProjectGithubBranch: "main",
                })

                const result = await handler.execute(
                    new ReviewPersonalProjectTaskCommand({
                        request: {
                            courseId: "course-1",
                            taskId: "task-1",
                            githubUrl: "  https://github.com/me/fresh  ",
                            mode: AiMode.Auto,
                        },
                        user: fakeUser("user-1"),
                        locale: undefined,
                    }),
                )

                // the request url (trimmed) wins over the stored one and is validated
                expect(urlValidatorService.isParsable).toHaveBeenCalledWith("https://github.com/me/fresh")
                // the grading lane is validated for the user
                expect(gradingLaneValidationService.validate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: "user-1",
                        mode: AiMode.Auto,
                    }),
                )
                // the job is enqueued with the resolved url, task and enrollment
                expect(enqueueService.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        taskId: "task-1",
                        userId: "user-1",
                        enrollmentId: "enroll-1",
                        githubUrl: "https://github.com/me/fresh",
                    }),
                )
                expect(result).toEqual({
                    jobId: "job-1",
                })
            })

        it("defaults to the first milestone task when no taskId is provided",
            async () => {
                // enrollment has a stored url; the request omits taskId
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: "enroll-1",
                    personalProjectGithubUrl: "https://github.com/me/repo",
                    personalProjectGithubBranch: null,
                })
                // first milestone task lookup resolves the default task
                entityManager.findOne.mockResolvedValueOnce({
                    id: "task-default",
                })

                await handler.execute(
                    new ReviewPersonalProjectTaskCommand({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the enqueued job carries the defaulted task id
                expect(enqueueService.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        taskId: "task-default",
                    }),
                )
            })

        it("throws when no taskId is given and the course has no milestone tasks",
            async () => {
                // enrollment loads, but the first-task lookup finds nothing
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: "enroll-1",
                    personalProjectGithubUrl: "https://github.com/me/repo",
                    personalProjectGithubBranch: null,
                })
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new ReviewPersonalProjectTaskCommand({
                            request: {
                                courseId: "course-1",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(NoPersonalProjectTasksFoundException)

                // no job is enqueued without a task to grade
                expect(enqueueService.enqueue).not.toHaveBeenCalled()
            })

        it("rejects when neither the request nor the enrollment carries a github url",
            async () => {
                // enrollment has no stored url and the request omits one
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: "enroll-1",
                    personalProjectGithubUrl: null,
                    personalProjectGithubBranch: null,
                })

                await expect(
                    handler.execute(
                        new ReviewPersonalProjectTaskCommand({
                            request: {
                                courseId: "course-1",
                                taskId: "task-1",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(BadRequestException)

                // url validation and enqueue never run without a url
                expect(urlValidatorService.isParsable).not.toHaveBeenCalled()
                expect(enqueueService.enqueue).not.toHaveBeenCalled()
            })

        it("rejects a branch that violates the allowed-character pattern",
            async () => {
                // enrollment has a stored url; the request branch is malformed
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: "enroll-1",
                    personalProjectGithubUrl: "https://github.com/me/repo",
                    personalProjectGithubBranch: null,
                })

                await expect(
                    handler.execute(
                        new ReviewPersonalProjectTaskCommand({
                            request: {
                                courseId: "course-1",
                                taskId: "task-1",
                                branch: "bad branch",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(BadRequestException)

                expect(enqueueService.enqueue).not.toHaveBeenCalled()
            })
    })
