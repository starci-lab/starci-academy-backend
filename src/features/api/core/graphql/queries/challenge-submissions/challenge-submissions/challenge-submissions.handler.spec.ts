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
    ChallengeSubmissionsHandler,
} from "./challenge-submissions.handler"
import {
    ChallengeSubmissionsQuery,
} from "./challenge-submissions.query"
import {
    ChallengeSubmissionsSortBy,
} from "./graphql-types"
import {
    SortOrder,
} from "@modules/api"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    ChallengeSubmissionEntity,
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionEntity,
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

describe("ChallengeSubmissionsHandler",
    () => {
        let module: TestingModule
        let handler: ChallengeSubmissionsHandler
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            // fresh jest-backed entity manager (find resolves [] by default)
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    ChallengeSubmissionsHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<ChallengeSubmissionsHandler>(ChallengeSubmissionsHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("builds the find order from the requested sorts and returns the submissions",
            async () => {
                const submissions = [
                    {
                        id: "sub-1",
                    },
                ] as Array<ChallengeSubmissionEntity>
                entityManager.find.mockResolvedValueOnce(submissions)

                const result = await handler.execute(
                    new ChallengeSubmissionsQuery({
                        request: {
                            challengeId: "ch-1",
                            filters: {
                                sorts: [
                                    {
                                        by: ChallengeSubmissionsSortBy.CreatedAt,
                                        order: SortOrder.Desc,
                                    },
                                ],
                            },
                        },
                        user: undefined,
                    }),
                )

                expect(result.data).toBe(submissions)
                // the sort map is translated into a typeorm FindOptionsOrder
                expect(entityManager.find).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        order: {
                            [ChallengeSubmissionsSortBy.CreatedAt]: SortOrder.Desc,
                        },
                    }),
                )
                // without a user the join queries are never issued
                expect(entityManager.find).toHaveBeenCalledTimes(1)
            })

        it("skips the user-join lookup when there are no submissions",
            async () => {
                // submissions list comes back empty
                entityManager.find.mockResolvedValueOnce([])

                const result = await handler.execute(
                    new ChallengeSubmissionsQuery({
                        request: {
                            challengeId: "ch-1",
                            filters: {
                                sorts: [],
                            },
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result.data).toEqual([])
                // even with a user, an empty list short-circuits the joins
                expect(entityManager.find).toHaveBeenCalledTimes(1)
            })

        it("attaches the latest attempt per submission for the current user",
            async () => {
                const submissions = [
                    {
                        id: "sub-1",
                    },
                    {
                        id: "sub-2",
                    },
                ] as Array<ChallengeSubmissionEntity>
                const joins = [
                    {
                        id: "us-1",
                        submissionId: "sub-1",
                    },
                    {
                        id: "us-2",
                        submissionId: "sub-2",
                    },
                ] as Array<UserChallengeSubmissionEntity>
                // attempts come back ascending; the Map keeps the last write per
                // userChallengeSubmissionId — i.e. the highest attempt number.
                const attempts = [
                    {
                        id: "a1",
                        userChallengeSubmissionId: "us-1",
                        attemptNumber: 1,
                    },
                    {
                        id: "a2",
                        userChallengeSubmissionId: "us-1",
                        attemptNumber: 2,
                    },
                ] as Array<UserChallengeSubmissionAttemptEntity>
                entityManager.find
                    // 1) the submissions list
                    .mockResolvedValueOnce(submissions)
                    // 2) the user's join rows
                    .mockResolvedValueOnce(joins)
                    // 3) the attempts for those join rows
                    .mockResolvedValueOnce(attempts)

                const result = await handler.execute(
                    new ChallengeSubmissionsQuery({
                        request: {
                            challengeId: "ch-1",
                            filters: {
                                sorts: [],
                            },
                        },
                        user: fakeUser("u1"),
                    }),
                )

                // sub-1 gets its join + the highest-numbered attempt
                expect(result.data[0].userSubmission).toBe(joins[0])
                expect(result.data[0].userSubmission?.lastAttempt).toBe(attempts[1])
                // sub-2 has a join but no attempts → lastAttempt stays undefined
                expect(result.data[1].userSubmission).toBe(joins[1])
                expect(result.data[1].userSubmission?.lastAttempt).toBeUndefined()
            })

        it("leaves userSubmission undefined for submissions the user never attempted",
            async () => {
                const submissions = [
                    {
                        id: "sub-1",
                    },
                ] as Array<ChallengeSubmissionEntity>
                entityManager.find
                    // 1) the submissions list
                    .mockResolvedValueOnce(submissions)
                    // 2) no join rows for this user
                    .mockResolvedValueOnce([])
                    // 3) no attempts
                    .mockResolvedValueOnce([])

                const result = await handler.execute(
                    new ChallengeSubmissionsQuery({
                        request: {
                            challengeId: "ch-1",
                            filters: {
                                sorts: [],
                            },
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result.data[0].userSubmission).toBeUndefined()
            })
    })
