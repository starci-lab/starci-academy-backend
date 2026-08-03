import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ChallengeSubmissionsCmsService,
} from "./challenge-submissions-cms.service"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("ChallengeSubmissionsCmsService",
    () => {
        let module: TestingModule
        let service: ChallengeSubmissionsCmsService
        let entityManager: EntityManagerMock

        const userId = "user-1"

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.query = jest.fn().mockResolvedValue([])

            module = await Test.createTestingModule({
                providers: [
                    ChallengeSubmissionsCmsService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<ChallengeSubmissionsCmsService>(ChallengeSubmissionsCmsService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("list",
            () => {
                it("runs the page + count queries in parallel, scoped to the user and windowed by limit/offset",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    id: "attempt-1",
                                    challenge_title: "Two Sum",
                                    course_title: "DSA",
                                    course_id: "course-1",
                                    score: 100,
                                    processed_at: new Date("2026-01-01T00:00:00Z"),
                                    selected_lang: "python",
                                    submission_url: null,
                                    submitted_at: new Date("2026-01-01T00:00:00Z"),
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    total: "7",
                                },
                            ])

                        const result = await service.list({
                            userId,
                            limit: 10,
                            offset: 20,
                        })

                        expect(entityManager.query).toHaveBeenCalledTimes(2)

                        // page query: scoped to the user, windowed by the given limit/offset
                        const [
                            pageSql,
                            pageParams,
                        ] = entityManager.query.mock.calls[0]
                        expect(pageSql).toContain("FROM user_challenge_submission_attempts ucsa")
                        expect(pageSql).toContain("WHERE ucs.user_id = $1")
                        expect(pageSql).toContain("ORDER BY ucsa.created_at DESC")
                        expect(pageSql).toContain("LIMIT $2 OFFSET $3")
                        expect(pageParams).toEqual([
                            userId,
                            10,
                            20,
                        ])

                        // count query: same ownership scope, no page window
                        const [
                            countSql,
                            countParams,
                        ] = entityManager.query.mock.calls[1]
                        expect(countSql).toContain("SELECT COUNT(*) AS total")
                        expect(countSql).toContain("WHERE ucs.user_id = $1")
                        expect(countSql).not.toContain("LIMIT")
                        expect(countParams).toEqual([
                            userId,
                        ])

                        // raw rows mapped into the typed contract, with ungraded → 0 score default
                        expect(result).toEqual({
                            items: [
                                {
                                    id: "attempt-1",
                                    challengeTitle: "Two Sum",
                                    courseTitle: "DSA",
                                    courseId: "course-1",
                                    status: "passed",
                                    score: 100,
                                    selectedLang: "python",
                                    submissionUrl: null,
                                    submittedAt: new Date("2026-01-01T00:00:00Z"),
                                },
                            ],
                            total: 7,
                        })
                    })

                it("derives status pending while ungraded, failed on a non-positive graded score",
                    async () => {
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    id: "attempt-pending",
                                    challenge_title: "Two Sum",
                                    course_title: "DSA",
                                    course_id: "course-1",
                                    score: null,
                                    processed_at: null,
                                    selected_lang: null,
                                    submission_url: null,
                                    submitted_at: new Date("2026-01-01T00:00:00Z"),
                                },
                                {
                                    id: "attempt-failed",
                                    challenge_title: "Two Sum",
                                    course_title: "DSA",
                                    course_id: "course-1",
                                    score: 0,
                                    processed_at: new Date("2026-01-02T00:00:00Z"),
                                    selected_lang: null,
                                    submission_url: null,
                                    submitted_at: new Date("2026-01-02T00:00:00Z"),
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

                        expect(result.items[0]).toEqual(
                            expect.objectContaining({
                                status: "pending",
                                score: 0,
                            }),
                        )
                        expect(result.items[1]).toEqual(
                            expect.objectContaining({
                                status: "failed",
                                score: 0,
                            }),
                        )
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
