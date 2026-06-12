// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    UserMilestoneTaskFeedbacksHandler,
} from "./user-milestone-task-feedbacks.handler"
import {
    UserMilestoneTaskFeedbacksQuery,
} from "./user-milestone-task-feedbacks.query"
import {
    UserMilestoneTaskFeedbacksSortBy,
} from "./graphql-types"
import {
    SortOrder,
} from "@modules/api"
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

/** Minimal user stand-in carrying only the id the handler reads. */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

/** Build a request with a single sort line + explicit pagination. */
const buildRequest = (): unknown => ({
    courseId: "course-1",
    taskId: "task-1",
    filters: {
        sorts: [
            {
                by: UserMilestoneTaskFeedbacksSortBy.SortIndex,
                order: SortOrder.Asc,
            },
        ],
        limit: 5,
        pageNumber: 1,
    },
})

describe("UserMilestoneTaskFeedbacksHandler",
    () => {
        let module: TestingModule
        let handler: UserMilestoneTaskFeedbacksHandler
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            // findAndCount is not on the shared mock — add it per spec (no util edit)
            entityManager.findAndCount = jest.fn().mockResolvedValue([
                [],
                0,
            ])

            module = await Test.createTestingModule({
                providers: [
                    UserMilestoneTaskFeedbacksHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<UserMilestoneTaskFeedbacksHandler>(
                UserMilestoneTaskFeedbacksHandler,
            )
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user",
            async () => {
                await expect(
                    handler.execute(
                        new UserMilestoneTaskFeedbacksQuery({
                            request: buildRequest() as never,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)
            })

        it("returns empty when the user has no enrollment (no latest attempt)",
            async () => {
                // first findOne (enrollment) resolves null → resolveLatestAttemptId bails
                const result = await handler.execute(
                    new UserMilestoneTaskFeedbacksQuery({
                        request: buildRequest() as never,
                        user: fakeUser("u1"),
                    }),
                )

                expect(result).toEqual({
                    data: [],
                    count: 0,
                })
                expect(entityManager.findAndCount).not.toHaveBeenCalled()
            })

        it("returns empty when there is no user-milestone-task row",
            async () => {
                entityManager.findOne
                    .mockResolvedValueOnce({
                        id: "enr-1",
                    })
                    // user-milestone-task lookup misses
                    .mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new UserMilestoneTaskFeedbacksQuery({
                        request: buildRequest() as never,
                        user: fakeUser("u1"),
                    }),
                )

                expect(result).toEqual({
                    data: [],
                    count: 0,
                })
            })

        it("lists feedbacks for the latest attempt with the order/window",
            async () => {
                entityManager.findOne
                    // enrollment
                    .mockResolvedValueOnce({
                        id: "enr-1",
                    })
                    // user-milestone-task
                    .mockResolvedValueOnce({
                        id: "umt-1",
                    })
                    // latest attempt
                    .mockResolvedValueOnce({
                        id: "att-1",
                        attemptNumber: 3,
                    })
                ;(entityManager.findAndCount as jest.Mock).mockResolvedValueOnce([
                    [
                        {
                            id: "fb-1",
                        },
                    ],
                    1,
                ])

                const result = await handler.execute(
                    new UserMilestoneTaskFeedbacksQuery({
                        request: buildRequest() as never,
                        user: fakeUser("u1"),
                    }),
                )

                expect(result.count).toBe(1)
                expect(result.data).toEqual([
                    {
                        id: "fb-1",
                    },
                ])
                const findArgs = (entityManager.findAndCount as jest.Mock).mock.calls[0][1]
                // feedbacks scoped to the resolved latest attempt
                expect(findArgs.where.attempt.id).toBe("att-1")
                // page 1 with size 5 → skip 5, take 5
                expect(findArgs.skip).toBe(5)
                expect(findArgs.take).toBe(5)
                expect(findArgs.order).toEqual({
                    sortIndex: SortOrder.Asc,
                })
            })
    })
