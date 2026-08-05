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
    UserChallengeSubmissionAttemptsHandler,
} from "./user-challenge-submission-attempts.handler"
import {
    UserChallengeSubmissionAttemptsQuery,
} from "./user-challenge-submission-attempts.query"
import {
    UserChallengeSubmissionAttemptsSortBy,
} from "./graphql-types/request"
import {
    SortOrder,
} from "@modules/api/apollo/server/graphql-types/inputs/sort"
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
    UserChallengeSubmissionAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-attempt.entity"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Default page size from envConfig().services.api.pagination.page.limit. */
const DEFAULT_PAGE_LIMIT = 20

/** Minimal user stand-in -- only the id is read by the handler. */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("UserChallengeSubmissionAttemptsHandler",
    () => {
        let module: TestingModule
        let handler: UserChallengeSubmissionAttemptsHandler
        let entityManager: EntityManagerMock
        let findAndCount: jest.Mock

        beforeEach(async () => {
            // fresh jest-backed entity manager; findAndCount is not part of the
            // shared mock, so attach a per-test jest.fn for this handler.
            entityManager = makeEntityManagerMock()
            findAndCount = jest.fn().mockResolvedValue([
                [],
                0,
            ])
            ;(entityManager as unknown as {
                findAndCount: jest.Mock
            }).findAndCount = findAndCount

            module = await Test.createTestingModule({
                providers: [
                    UserChallengeSubmissionAttemptsHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<UserChallengeSubmissionAttemptsHandler>(
                UserChallengeSubmissionAttemptsHandler,
            )
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when no user is present on the query",
            async () => {
                await expect(
                    handler.execute(
                        new UserChallengeSubmissionAttemptsQuery({
                            request: {
                                challengeSubmissionId: "sub-1",
                                filters: {
                                    sorts: [],
                                },
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                expect(findAndCount).not.toHaveBeenCalled()
            })

        it("returns an empty page when the user has no submission row",
            async () => {
                // the user-challenge-submission lookup resolves null
                entityManager.findOne.mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new UserChallengeSubmissionAttemptsQuery({
                        request: {
                            challengeSubmissionId: "sub-1",
                            filters: {
                                sorts: [],
                            },
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result).toEqual({
                    data: [],
                    count: 0,
                })
                // no submission row -> never paginate the attempts
                expect(findAndCount).not.toHaveBeenCalled()
            })

        it("paginates attempts with the default limit and zero page when none provided",
            async () => {
                const attempts = [
                    {
                        id: "a1",
                    },
                ] as Array<UserChallengeSubmissionAttemptEntity>
                entityManager.findOne.mockResolvedValueOnce({
                    id: "us-1",
                })
                findAndCount.mockResolvedValueOnce([
                    attempts,
                    1,
                ])

                const result = await handler.execute(
                    new UserChallengeSubmissionAttemptsQuery({
                        request: {
                            challengeSubmissionId: "sub-1",
                            filters: {
                                sorts: [
                                    {
                                        by: UserChallengeSubmissionAttemptsSortBy.AttemptNumber,
                                        order: SortOrder.Desc,
                                    },
                                ],
                            },
                        },
                        user: fakeUser("u1"),
                    }),
                )

                expect(result).toEqual({
                    data: attempts,
                    count: 1,
                })
                // default page (0) and limit (20) translate to skip 0 / take 20,
                // and the sort map becomes a typeorm FindOptionsOrder.
                expect(findAndCount).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        skip: 0,
                        take: DEFAULT_PAGE_LIMIT,
                        order: {
                            [UserChallengeSubmissionAttemptsSortBy.AttemptNumber]: SortOrder.Desc,
                        },
                    }),
                )
            })

        it("computes skip from the requested page number and limit",
            async () => {
                entityManager.findOne.mockResolvedValueOnce({
                    id: "us-1",
                })
                findAndCount.mockResolvedValueOnce([
                    [],
                    0,
                ])

                await handler.execute(
                    new UserChallengeSubmissionAttemptsQuery({
                        request: {
                            challengeSubmissionId: "sub-1",
                            filters: {
                                limit: 5,
                                pageNumber: 3,
                                sorts: [],
                            },
                        },
                        user: fakeUser("u1"),
                    }),
                )

                // skip = pageNumber * limit = 3 * 5 = 15
                expect(findAndCount).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        skip: 15,
                        take: 5,
                    }),
                )
            })
    })
