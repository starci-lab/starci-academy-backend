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
    ChallengeSubmissionProgressHandler,
} from "./challenge-submission-progress.handler"
import {
    ChallengeSubmissionProgressQuery,
} from "./challenge-submission-progress.query"
import {
    ChallengeProgressService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
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

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Minimal user stand-in — only the id is read by the handler. */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("ChallengeSubmissionProgressHandler",
    () => {
        let module: TestingModule
        let handler: ChallengeSubmissionProgressHandler
        let entityManager: EntityManagerMock
        let challengeProgressService: jest.Mocked<Pick<ChallengeProgressService, "getProgress">>

        beforeEach(async () => {
            // fresh jest-backed entity manager (findOne resolves null by default)
            entityManager = makeEntityManagerMock()

            // domain service: programmed per-test to return a progress payload
            challengeProgressService = {
                getProgress: jest.fn(),
            } as unknown as jest.Mocked<Pick<ChallengeProgressService, "getProgress">>

            module = await Test.createTestingModule({
                providers: [
                    ChallengeSubmissionProgressHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: ChallengeProgressService,
                        useValue: challengeProgressService,
                    },
                ],
            }).compile()

            handler = module.get<ChallengeSubmissionProgressHandler>(
                ChallengeSubmissionProgressHandler,
            )
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when no user is present on the query",
            async () => {
                await expect(
                    handler.execute(
                        new ChallengeSubmissionProgressQuery({
                            request: {
                                courseId: "course-1",
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it("returns an empty completion list when the user is not enrolled",
            async () => {
                // the enrollment lookup resolves null
                entityManager.findOne.mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new ChallengeSubmissionProgressQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result).toEqual({
                    completionTasks: [],
                })
                // no enrollment → never delegate to the progress service
                expect(challengeProgressService.getProgress).not.toHaveBeenCalled()
            })

        it("delegates to the progress service with the resolved enrollment id",
            async () => {
                const progress = {
                    completionTasks: [
                        {
                            challengeId: "ch-1",
                        },
                    ],
                }
                entityManager.findOne.mockResolvedValueOnce({
                    id: "enroll-1",
                })
                challengeProgressService.getProgress.mockResolvedValueOnce(
                    progress as Awaited<ReturnType<ChallengeProgressService["getProgress"]>>,
                )

                const result = await handler.execute(
                    new ChallengeSubmissionProgressQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result).toBe(progress)
                expect(challengeProgressService.getProgress).toHaveBeenCalledWith({
                    enrollmentId: "enroll-1",
                    courseId: "course-1",
                })
            })
    })
