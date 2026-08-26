import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    ProgressProjectionService,
} from "./progress-projection.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Squash all runs of whitespace so SQL-substring assertions are resilient to the
 * heredoc's indentation / line breaks.
 *
 * @param sql - the raw query string captured from the mock
 * @returns the same SQL with collapsed whitespace
 */
const flat = (
    sql: string,
): string => sql.replace(/\s+/g,
    " ").trim()

describe("ProgressProjectionService",
    () => {
        let module: TestingModule
        let service: ProgressProjectionService
        let entityManager: EntityManagerMock

        const courseId = "course-1"
        const userId = "user-1"

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()
            // every read in this service is a raw `query` -- default to empty rows
            entityManager.query = jest.fn().mockResolvedValue([])

            module = await Test.createTestingModule({
                providers: [
                    ProgressProjectionService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<ProgressProjectionService>(ProgressProjectionService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getMyCourseProgress (trials INCLUDED)",
            () => {
                it("drives off enrollments and does NOT filter out trials",
                    async () => {
                        // a trial course (the row still has a course + a 0-defaulted
                        // projection) is returned for My Courses
                        entityManager.query.mockResolvedValueOnce([
                            {
                                course_id: courseId,
                                title: "Trial Course",
                                thumbnail_url: null,
                                content_completed: 0,
                                content_total: 10,
                                challenge_completed: 0,
                                challenge_total: 4,
                                completed: 0,
                                total: 5,
                            },
                        ])

                        const result = await service.getMyCourseProgress(userId)

                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[0]
                        const sqlText = flat(sql)
                        // the query is driven by the user's enrollments (so trial rows,
                        // is_enrolled = false, are still listed)
                        expect(sqlText).toContain("FROM enrollments e")
                        expect(sqlText).toContain("WHERE e.user_id = $1")
                        // it must NOT gate the listing on is_enrolled = true -- trials stay
                        expect(sqlText).not.toContain("is_enrolled = true")
                        expect(params).toEqual([
                            userId,
                        ])
                        // the trial course surfaces with its 0-progress
                        expect(result).toEqual([
                            expect.objectContaining({
                                courseId,
                                title: "Trial Course",
                                contentTotal: 10,
                                total: 5,
                                completed: 0,
                            }),
                        ])
                    })
            })

        describe("getLeaderboard (trials EXCLUDED)",
            () => {
                it("joins enrollments with is_enrolled = true so trials never rank",
                    async () => {
                        // totals query first, then the ranked-entries query
                        entityManager.query.mockResolvedValueOnce([
                            {
                                total_challenges: 4,
                                max_possible_score: 400,
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                enrollment_id: "enrollment-1",
                                user_id: userId,
                                username: "alice",
                                avatar: null,
                                total_score: 120,
                                completed_challenges: 2,
                                lessons_read: 5,
                                milestone_progress: 1,
                                total_xp: 145,
                            },
                        ])

                        const result = await service.getLeaderboard(courseId)

                        // the SECOND call is the ranked-entries read -- assert the trial gate
                        const entriesSql = flat(entityManager.query.mock.calls[1][0])
                        expect(entriesSql).toContain("JOIN enrollments e")
                        expect(entriesSql).toContain("e.is_enrolled = true")

                        // only the paid entry is ranked, position 1
                        expect(result.courseId).toBe(courseId)
                        expect(result.totalChallenges).toBe(4)
                        expect(result.entries).toEqual([
                            expect.objectContaining({
                                enrollmentId: "enrollment-1",
                                userId,
                                totalXp: 145,
                                rank: 1,
                            }),
                        ])
                    })
            })

        describe("getMyRank (trials EXCLUDED)",
            () => {
                it("requires the viewer's projection row to be backed by a PAID enrollment",
                    async () => {
                        // a paid viewer with peers above -> rank 3
                        entityManager.query.mockResolvedValueOnce([
                            {
                                user_id: userId,
                                total_score: 80,
                                completed_challenges: 1,
                                lessons_read: 4,
                                milestone_progress: 0,
                                total_xp: 92,
                                higher_count: 2,
                            },
                        ])

                        const result = await service.getMyRank(courseId,
                            userId)

                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[0]
                        const sqlText = flat(sql)
                        // viewer row gated to a real enrollment ...
                        expect(sqlText).toContain("FROM enrollments e WHERE e.is_enrolled = true")
                        // ... and peers counted above are likewise restricted to paid rows
                        expect(sqlText).toContain("FROM enrollments he WHERE he.is_enrolled = true")
                        expect(params).toEqual([
                            courseId,
                            userId,
                        ])
                        expect(result).toEqual(
                            expect.objectContaining({
                                rank: 3,
                                totalXp: 92,
                            }),
                        )
                    })

                it("returns null when the viewer has no paid projection row",
                    async () => {
                        // the is_enrolled = true gate filters a trial viewer out entirely
                        entityManager.query.mockResolvedValueOnce([])

                        const result = await service.getMyRank(courseId,
                            userId)

                        expect(result).toBeNull()
                    })

                it("returns null when the viewer's totalXp is zero (not surfaced)",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([
                            {
                                user_id: userId,
                                total_score: 0,
                                completed_challenges: 0,
                                lessons_read: 0,
                                milestone_progress: 0,
                                total_xp: 0,
                                higher_count: 0,
                            },
                        ])

                        const result = await service.getMyRank(courseId,
                            userId)

                        expect(result).toBeNull()
                    })
            })

        describe("recompute paths",
            () => {
                it("uses the caller transaction manager for a scoped recompute",
                    async () => {
                        const transactionManager = {
                            query: jest.fn().mockResolvedValue([]),
                        }

                        await service.recompute({
                            userId,
                            courseId,
                            entityManager: transactionManager as never,
                        })

                        expect(transactionManager.query).toHaveBeenCalledWith(
                            expect.stringContaining("AND e.user_id = $2"),
                            [courseId,
                                userId],
                        )
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("recomputes every enrolled user for a course",
                    async () => {
                        await service.recomputeCourse(courseId)

                        expect(entityManager.query).toHaveBeenCalledWith(
                            expect.not.stringContaining("AND e.user_id = $2"),
                            [courseId],
                        )
                    })

                it("uses its own manager when no transaction manager is supplied",
                    async () => {
                        await service.recompute({
                            userId,
                            courseId,
                        })

                        expect(entityManager.query).toHaveBeenCalledWith(
                            expect.stringContaining("AND e.user_id = $2"),
                            [courseId,
                                userId],
                        )
                    })
            })
    })
