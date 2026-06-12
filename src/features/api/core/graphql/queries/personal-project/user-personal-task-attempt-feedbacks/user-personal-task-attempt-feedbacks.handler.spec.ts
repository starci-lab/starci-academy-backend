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
    UserPersonalTaskAttemptFeedbacksHandler,
} from "./user-personal-task-attempt-feedbacks.handler"
import {
    UserPersonalTaskAttemptFeedbacksQuery,
} from "./user-personal-task-attempt-feedbacks.query"
import {
    UserPersonalTaskAttemptFeedbacksSortBy,
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

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("UserPersonalTaskAttemptFeedbacksHandler",
    () => {
        let module: TestingModule
        let handler: UserPersonalTaskAttemptFeedbacksHandler
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
                    UserPersonalTaskAttemptFeedbacksHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<UserPersonalTaskAttemptFeedbacksHandler>(
                UserPersonalTaskAttemptFeedbacksHandler,
            )
        })

        afterEach(async () => {
            await module.close()
        })

        it("returns rows + count and builds the order/window from the request",
            async () => {
                ;(entityManager.findAndCount as jest.Mock).mockResolvedValueOnce([
                    [
                        {
                            id: "fb-1",
                        },
                    ],
                    1,
                ])

                const result = await handler.execute(
                    new UserPersonalTaskAttemptFeedbacksQuery({
                        request: {
                            attemptId: "attempt-1",
                            filters: {
                                sorts: [
                                    {
                                        by: UserPersonalTaskAttemptFeedbacksSortBy.SortIndex,
                                        order: SortOrder.Asc,
                                    },
                                ],
                                limit: 5,
                                pageNumber: 2,
                            },
                        },
                    }),
                )

                expect(result.count).toBe(1)
                expect(result.data).toEqual([
                    {
                        id: "fb-1",
                    },
                ])
                const findArgs = (entityManager.findAndCount as jest.Mock).mock.calls[0][1]
                // scoped to the requested attempt
                expect(findArgs.where.attempt.id).toBe("attempt-1")
                // page 2 with size 5 → skip 10, take 5
                expect(findArgs.skip).toBe(10)
                expect(findArgs.take).toBe(5)
                // sort field maps to the requested order
                expect(findArgs.order).toEqual({
                    sortIndex: SortOrder.Asc,
                })
            })

        it("falls back to the configured default limit when none is given",
            async () => {
                await handler.execute(
                    new UserPersonalTaskAttemptFeedbacksQuery({
                        request: {
                            attemptId: "attempt-1",
                            filters: {
                                sorts: [],
                            },
                        },
                    }),
                )

                const findArgs = (entityManager.findAndCount as jest.Mock).mock.calls[0][1]
                // default limit applied (positive number) with the first page offset
                expect(findArgs.take).toBeGreaterThan(0)
                expect(findArgs.skip).toBe(0)
            })
    })
