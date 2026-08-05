import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    LearningFeedbacksCmsService,
} from "./learning-feedbacks-cms.service"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("LearningFeedbacksCmsService",
    () => {
        let module: TestingModule
        let service: LearningFeedbacksCmsService
        let entityManager: EntityManagerMock

        const userId = "user-1"

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.query = jest.fn().mockResolvedValue([])

            module = await Test.createTestingModule({
                providers: [
                    LearningFeedbacksCmsService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<LearningFeedbacksCmsService>(LearningFeedbacksCmsService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("list",
            () => {
                it("runs the page + count queries in parallel over the shared 2-source UNION ALL, windowed by limit/offset",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    source: "challenge",
                                    title: "Two Sum",
                                    course_title: "DSA",
                                    summary: "Nice work",
                                    created_at: new Date("2026-01-02T00:00:00Z"),
                                },
                                {
                                    source: "task",
                                    title: "Build the API",
                                    course_title: "Full-Stack",
                                    summary: "Needs polish",
                                    created_at: new Date("2026-01-01T00:00:00Z"),
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    total: "9",
                                },
                            ])

                        const result = await service.list({
                            userId,
                            limit: 5,
                            offset: 10,
                        })

                        expect(entityManager.query).toHaveBeenCalledTimes(2)

                        // page query: both source branches unioned, ordered newest-first, windowed
                        const [
                            pageSql,
                            pageParams,
                        ] = entityManager.query.mock.calls[0]
                        expect(pageSql).toContain("UNION ALL")
                        expect(pageSql).toContain("FROM user_challenge_submission_feedbacks cf")
                        expect(pageSql).toContain("FROM user_milestone_task_attempt_feedbacks tf")
                        expect(pageSql).toContain("WHERE ucs.user_id = $1")
                        expect(pageSql).toContain("WHERE e.user_id = $1")
                        expect(pageSql).toContain("ORDER BY created_at DESC")
                        expect(pageSql).toContain("LIMIT $2 OFFSET $3")
                        expect(pageParams).toEqual([
                            userId,
                            5,
                            10,
                        ])

                        // count query: same shared union body, no page window
                        const [
                            countSql,
                            countParams,
                        ] = entityManager.query.mock.calls[1]
                        expect(countSql).toContain("SELECT COUNT(*) AS total")
                        expect(countSql).toContain("UNION ALL")
                        expect(countSql).not.toContain("LIMIT")
                        expect(countParams).toEqual([
                            userId,
                        ])

                        expect(result).toEqual({
                            items: [
                                {
                                    source: "challenge",
                                    title: "Two Sum",
                                    courseTitle: "DSA",
                                    summary: "Nice work",
                                    createdAt: new Date("2026-01-02T00:00:00Z"),
                                },
                                {
                                    source: "task",
                                    title: "Build the API",
                                    courseTitle: "Full-Stack",
                                    summary: "Needs polish",
                                    createdAt: new Date("2026-01-01T00:00:00Z"),
                                },
                            ],
                            total: 9,
                        })
                    })

                it("normalises a null course title (orphaned row) through to the result untouched",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    source: "challenge",
                                    title: "Two Sum",
                                    course_title: null,
                                    summary: "Nice work",
                                    created_at: new Date("2026-01-01T00:00:00Z"),
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    total: "1",
                                },
                            ])

                        const result = await service.list({
                            userId,
                            limit: 10,
                            offset: 0,
                        })

                        expect(result.items[0].courseTitle).toBeNull()
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
