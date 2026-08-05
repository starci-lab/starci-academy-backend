import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    MilestoneTaskAttemptsCmsService,
} from "./milestone-task-attempts-cms.service"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("MilestoneTaskAttemptsCmsService",
    () => {
        let module: TestingModule
        let service: MilestoneTaskAttemptsCmsService
        let entityManager: EntityManagerMock

        const userId = "user-1"

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.query = jest.fn().mockResolvedValue([])

            module = await Test.createTestingModule({
                providers: [
                    MilestoneTaskAttemptsCmsService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<MilestoneTaskAttemptsCmsService>(MilestoneTaskAttemptsCmsService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("list",
            () => {
                it("runs the page + count queries in parallel, scoped through the user's enrollments and windowed by limit/offset",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    id: "attempt-1",
                                    task_title: "Build the API",
                                    milestone_title: "Milestone 1",
                                    course_title: "Full-Stack",
                                    course_id: "course-1",
                                    passed: true,
                                    score: 90,
                                    attempted_at: new Date("2026-01-01T00:00:00Z"),
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    total: "5",
                                },
                            ])

                        const result = await service.list({
                            userId,
                            limit: 15,
                            offset: 30,
                        })

                        expect(entityManager.query).toHaveBeenCalledTimes(2)

                        // page query: joins through enrollments to reach the user, windowed
                        const [
                            pageSql,
                            pageParams,
                        ] = entityManager.query.mock.calls[0]
                        expect(pageSql).toContain("FROM user_milestone_task_attempts mta")
                        expect(pageSql).toContain("JOIN enrollments e ON e.id = umt.enrollment_id")
                        expect(pageSql).toContain("WHERE e.user_id = $1")
                        expect(pageSql).toContain("ORDER BY mta.created_at DESC")
                        expect(pageSql).toContain("LIMIT $2 OFFSET $3")
                        expect(pageParams).toEqual([
                            userId,
                            15,
                            30,
                        ])

                        // count query: same enrollment-scoped ownership, no page window
                        const [
                            countSql,
                            countParams,
                        ] = entityManager.query.mock.calls[1]
                        expect(countSql).toContain("SELECT COUNT(*) AS total")
                        expect(countSql).toContain("WHERE e.user_id = $1")
                        expect(countSql).not.toContain("LIMIT")
                        expect(countParams).toEqual([
                            userId,
                        ])

                        expect(result).toEqual({
                            items: [
                                {
                                    id: "attempt-1",
                                    taskTitle: "Build the API",
                                    milestoneTitle: "Milestone 1",
                                    courseTitle: "Full-Stack",
                                    courseId: "course-1",
                                    passed: true,
                                    score: 90,
                                    attemptedAt: new Date("2026-01-01T00:00:00Z"),
                                },
                            ],
                            total: 5,
                        })
                    })

                it("includes both passed and failed attempts as-is (no status derivation)",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    id: "attempt-passed",
                                    task_title: "Task",
                                    milestone_title: "Milestone",
                                    course_title: "Course",
                                    course_id: "course-1",
                                    passed: true,
                                    score: 100,
                                    attempted_at: new Date("2026-01-01T00:00:00Z"),
                                },
                                {
                                    id: "attempt-failed",
                                    task_title: "Task",
                                    milestone_title: "Milestone",
                                    course_title: "Course",
                                    course_id: "course-1",
                                    passed: false,
                                    score: 40,
                                    attempted_at: new Date("2026-01-02T00:00:00Z"),
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    total: "2",
                                },
                            ])

                        const result = await service.list({
                            userId,
                            limit: 10,
                            offset: 0,
                        })

                        expect(result.items.map((item) => item.passed)).toEqual([
                            true,
                            false,
                        ])
                    })

                it("defaults total to 0 when the count query returns no row",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([])
                            .mockResolvedValueOnce([])

                        const result = await service.list({
                            userId,
                            limit: 10,
                            offset: 0,
                        })

                        expect(result).toEqual({
                            items: [],
                            total: 0,
                        })
                    })
            })
    })
