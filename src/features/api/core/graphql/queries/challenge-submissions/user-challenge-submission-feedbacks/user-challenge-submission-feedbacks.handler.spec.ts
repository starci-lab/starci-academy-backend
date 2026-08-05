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
    UserChallengeSubmissionFeedbacksHandler,
} from "./user-challenge-submission-feedbacks.handler"
import {
    UserChallengeSubmissionFeedbacksQuery,
} from "./user-challenge-submission-feedbacks.query"
import {
    UserChallengeSubmissionFeedbacksSortBy,
} from "./graphql-types/request"
import {
    SortOrder,
} from "@modules/api/apollo/server/graphql-types/inputs/sort"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    UserChallengeSubmissionFeedbackEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-feedback.entity"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Default page size from envConfig().services.api.pagination.page.limit. */
const DEFAULT_PAGE_LIMIT = 20

describe("UserChallengeSubmissionFeedbacksHandler",
    () => {
        let module: TestingModule
        let handler: UserChallengeSubmissionFeedbacksHandler
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
                    UserChallengeSubmissionFeedbacksHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<UserChallengeSubmissionFeedbacksHandler>(
                UserChallengeSubmissionFeedbacksHandler,
            )
        })

        afterEach(async () => {
            await module.close()
        })

        it("paginates feedbacks with the default limit and zero page when none provided",
            async () => {
                const feedbacks = [
                    {
                        id: "f1",
                    },
                ] as Array<UserChallengeSubmissionFeedbackEntity>
                findAndCount.mockResolvedValueOnce([
                    feedbacks,
                    1,
                ])

                const result = await handler.execute(
                    new UserChallengeSubmissionFeedbacksQuery({
                        request: {
                            submissionAttemptId: "attempt-1",
                            filters: {
                                sorts: [
                                    {
                                        by: UserChallengeSubmissionFeedbacksSortBy.SortIndex,
                                        order: SortOrder.Asc,
                                    },
                                ],
                            },
                        },
                    }),
                )

                expect(result).toEqual({
                    data: feedbacks,
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
                            [UserChallengeSubmissionFeedbacksSortBy.SortIndex]: SortOrder.Asc,
                        },
                    }),
                )
            })

        it("computes skip from the requested page number and limit",
            async () => {
                findAndCount.mockResolvedValueOnce([
                    [],
                    0,
                ])

                const result = await handler.execute(
                    new UserChallengeSubmissionFeedbacksQuery({
                        request: {
                            submissionAttemptId: "attempt-1",
                            filters: {
                                limit: 10,
                                pageNumber: 2,
                                sorts: [],
                            },
                        },
                    }),
                )

                expect(result).toEqual({
                    data: [],
                    count: 0,
                })
                // skip = pageNumber * limit = 2 * 10 = 20
                expect(findAndCount).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        skip: 20,
                        take: 10,
                    }),
                )
            })
    })
