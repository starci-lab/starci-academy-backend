// Load the bussiness barrel first so its CQRS base classes are initialised before the handler
// pulls `@modules/cqrs` -- dodges a load-order "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CourseReviewStatsProjectionService,
} from "@modules/bussiness/projections/course-review-stats/course-review-stats-projection.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CourseReviewsQuery,
} from "./course-reviews.query"
import {
    CourseReviewsHandler,
} from "./course-reviews.handler"

/** The primary connection's name, declared here as the sibling specs declare it. */
const POSTGRESQL_PRIMARY = "primary"

/** The course whose reviews are read. */
const COURSE_ID = "22222222-2222-2222-2222-222222222222"

/** The server's maximum page size, mirrored from the pagination util. */
const MAX_PAGINATION_LIMIT = 100

interface CourseReviewsQueryOverrides {
    courseId?: string
    limit?: number
    offset?: number
}

/**
 * Build the query the handler receives.
 *
 * @param overrides - The course and the requested window.
 * @returns A query carrying request and locale.
 */
const query = ({
    courseId = COURSE_ID,
    limit,
    offset,
}: CourseReviewsQueryOverrides): CourseReviewsQuery =>
    new CourseReviewsQuery({
        locale: Locale.En,
        request: {
            courseId,
            limit,
            offset,
        },
    })

describe("CourseReviewsHandler",
    () => {
        let module: TestingModule
        let handler: CourseReviewsHandler
        let entityManager: EntityManagerMock
        let projection: {
            getStats: jest.Mock
        }

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.findAndCount = jest.fn().mockResolvedValue([
                [
                    {
                        id: "review-1",
                        score: 5,
                    },
                    {
                        id: "review-2",
                        score: 3,
                    },
                ],
                7,
            ])

            projection = {
                getStats: jest.fn().mockResolvedValue({
                    averageScore: 4.25,
                    reviewCount: 7,
                    scoreHistogram: {
                    },
                }),
            }

            module = await Test.createTestingModule({
                providers: [
                    CourseReviewsHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: CourseReviewStatsProjectionService,
                        useValue: projection,
                    },
                ],
            }).compile()

            handler = module.get(CourseReviewsHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("returns the page of reviews",
            async () => {
                const page = await handler.execute(query({
                }))

                expect(page.nodes).toHaveLength(2)
            })

        it("returns the whole-population total, not the page size",
            async () => {
            // the page holds two rows and the course has seven; a handler returning `nodes.length`
            // would pass every other case in this file
                const page = await handler.execute(query({
                }))

                expect(page.total).toBe(7)
            })

        it("takes the average from the PROJECTION rather than from the page",
            async () => {
            // the two rows on this page average 4; the projection says 4.25 across all seven.
            // Asserting 4.25 is what proves the handler did not quietly average what it loaded
                const page = await handler.execute(query({
                }))

                expect(page.averageScore).toBe(4.25)
                expect(projection.getStats).toHaveBeenCalledWith(COURSE_ID)
            })

        it("reads only the requested course's reviews",
            async () => {
                await handler.execute(query({
                }))

                const options = entityManager.findAndCount.mock.calls[0][1]
                expect(options.where.courseId).toBe(COURSE_ID)
            })

        it("orders newest first",
            async () => {
                await handler.execute(query({
                }))

                const options = entityManager.findAndCount.mock.calls[0][1]
                expect(options.order.createdAt).toBe("DESC")
            })

        it("clamps a limit above the server maximum",
            async () => {
                await handler.execute(query({
                    limit: 10_000,
                }))

                const options = entityManager.findAndCount.mock.calls[0][1]
                expect(options.take).toBe(MAX_PAGINATION_LIMIT)
            })

        it("clamps a limit below one",
            async () => {
                await handler.execute(query({
                    limit: 0,
                }))

                const options = entityManager.findAndCount.mock.calls[0][1]
                expect(options.take).toBe(1)
            })

        it("clamps a negative offset to the start of the list",
            async () => {
                await handler.execute(query({
                    offset: -50,
                }))

                const options = entityManager.findAndCount.mock.calls[0][1]
                expect(options.skip).toBe(0)
            })

        it("honours an offset the caller asked for",
            async () => {
                await handler.execute(query({
                    offset: 20,
                }))

                const options = entityManager.findAndCount.mock.calls[0][1]
                expect(options.skip).toBe(20)
            })

        it("starts at the beginning when no window is given",
            async () => {
                await handler.execute(query({
                }))

                const options = entityManager.findAndCount.mock.calls[0][1]
                expect(options.skip).toBe(0)
            })

        it("answers a course with no reviews without inventing a rating",
            async () => {
                entityManager.findAndCount = jest.fn().mockResolvedValue([
                    [],
                    0,
                ])
                projection.getStats = jest.fn().mockResolvedValue({
                    averageScore: 0,
                    reviewCount: 0,
                    scoreHistogram: {
                    },
                })

                const page = await handler.execute(query({
                }))

                expect(page.nodes).toHaveLength(0)
                expect(page.total).toBe(0)
                expect(page.averageScore).toBe(0)
            })
    })
