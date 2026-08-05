// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ChallengeSubmissionHandler,
} from "./challenge-submission.handler"
import {
    ChallengeSubmissionQuery,
} from "./challenge-submission.query"
import {
    ChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    ChallengeSubmissionNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-submission-not-found"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Minimal user stand-in -- only the id is read by the handler. */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("ChallengeSubmissionHandler",
    () => {
        let module: TestingModule
        let handler: ChallengeSubmissionHandler
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            // fresh jest-backed entity manager (findOne resolves null by default)
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    ChallengeSubmissionHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<ChallengeSubmissionHandler>(ChallengeSubmissionHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when no user is present on the query",
            async () => {
                await expect(
                    handler.execute(
                        new ChallengeSubmissionQuery({
                            request: {
                                challengeSubmissionId: "sub-1",
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                // never touches the database when the user is missing
                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it("throws when the submission does not exist",
            async () => {
                // first findOne (the submission row) resolves null -> not found
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new ChallengeSubmissionQuery({
                            request: {
                                challengeSubmissionId: "sub-missing",
                            },
                            user: fakeUser("u1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengeSubmissionNotFoundException)
            })

        it("returns the submission with the user submission attached when one exists",
            async () => {
                const submission = {
                    id: "sub-1",
                } as ChallengeSubmissionEntity
                const userSubmission = {
                    id: "us-1",
                } as UserChallengeSubmissionEntity
                entityManager.findOne
                    // the submission row
                    .mockResolvedValueOnce(submission)
                    // the current user's join row (with attempts/feedbacks)
                    .mockResolvedValueOnce(userSubmission)

                const result = await handler.execute(
                    new ChallengeSubmissionQuery({
                        request: {
                            challengeSubmissionId: "sub-1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result).toBe(submission)
                expect(result.userSubmission).toBe(userSubmission)
            })

        it("returns the submission untouched when the user has no submission",
            async () => {
                const submission = {
                    id: "sub-1",
                } as ChallengeSubmissionEntity
                entityManager.findOne
                    // the submission row
                    .mockResolvedValueOnce(submission)
                    // no user join row
                    .mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new ChallengeSubmissionQuery({
                        request: {
                            challengeSubmissionId: "sub-1",
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result).toBe(submission)
                expect(result.userSubmission).toBeUndefined()
            })
    })
