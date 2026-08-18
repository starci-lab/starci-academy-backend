import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    UserMockInterviewCourseStatsProjectionService,
} from "./user-mock-interview-course-stats-projection.service"
import type {
    UserMockInterviewCourseStatsResult,
} from "./types"
import {
    MockInterviewAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-attempt.entity"
import {
    MockInterviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import type {
    UserMockInterviewCourseStatsProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/user-mock-interview-course-stats-projection.entity"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The enrollment under test -- only ever threaded into params / SQL bindings. */
const ENROLLMENT_ID = "9d2c1b7e-52a4-4c6f-8f3d-1a7b5e9c0d24"

/** Default TTL the SUT reads off `envConfig().projection.staleAfterMs` (5 minutes). */
const STALE_AFTER_MS = 5 * 60 * 1000

/** The zeroed shape the SUT returns / persists whenever the sample is too small. */
const EMPTY_RESULT: UserMockInterviewCourseStatsResult = {
    insufficientData: true,
    modeSplit: {
        qnaCount: 0,
        designCount: 0,
    },
    trend: [],
    byPhase: [],
    byKind: [],
    byAttribute: [],
    byLevel: [],
    byLanguage: [],
    recurringGaps: [],
    weakest: null,
    verdictCounts: {
        pass: 0,
        borderline: 0,
        fail: 0,
    },
}

/** True when a raw SQL string is this projection's UPSERT. */
const isUpsertSql = (sql: unknown): boolean =>
    String(sql).includes("INSERT INTO user_mock_interview_course_stats_projections")

describe("UserMockInterviewCourseStatsProjectionService",
    () => {
        let entityManager: EntityManagerMock

        /** Build the SUT wired to a fresh entity-manager mock registered under the primary token. */
        const build = async (): Promise<UserMockInterviewCourseStatsProjectionService> => {
            entityManager = makeEntityManagerMock()

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    UserMockInterviewCourseStatsProjectionService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()
            return module.get(UserMockInterviewCourseStatsProjectionService)
        }

        /** Build one graded attempt row, newest-first ordering supplied by the caller. */
        const makeAttempt = (
            overrides: Record<string, unknown>,
        ): MockInterviewAttemptEntity => ({
            id: "attempt-id",
            enrollmentId: ENROLLMENT_ID,
            sessionId: "session-1",
            createdAt: new Date("2026-03-01T00:00:00.000Z"),
            promptId: "prompt-1",
            promptTitle: "Design a URL shortener",
            level: null,
            mode: "design",
            overallScore: 80,
            verdict: "pass",
            phaseScores: [],
            attributeScores: [],
            strengths: [],
            gaps: [],
            matchedContentIds: [],
            questionReviews: [],
            ...overrides,
        } as unknown as MockInterviewAttemptEntity)

        /** Build one drawn session row carrying the seed questions `byLanguage` joins against. */
        const makeSession = (
            id: string,
            seedQuestions: unknown,
        ): MockInterviewSessionEntity => ({
            id,
            seedQuestions,
        } as unknown as MockInterviewSessionEntity)

        /** Program the manager so attempts and drawn sessions answer their own `find`. */
        const programScan = (
            manager: EntityManagerMock,
            attempts: Array<MockInterviewAttemptEntity>,
            sessions: Array<MockInterviewSessionEntity>,
        ): void => {
            manager.find.mockImplementation(async (target: unknown) => (
                target === MockInterviewSessionEntity
                    ? sessions
                    : attempts
            ))
        }

        /** Read back the aggregate the SUT handed to its UPSERT. */
        const persistedValue = (
            manager: EntityManagerMock,
        ): UserMockInterviewCourseStatsResult => {
            const call = manager.query.mock.calls.find(
                (entry: Array<unknown>) => isUpsertSql(entry[0]),
            ) as [unknown, Array<unknown>]
            return JSON.parse(String(call[1][1])) as UserMockInterviewCourseStatsResult
        }

        /** Build a projection row carrying the given jsonb value + freshness timestamp. */
        const buildRow = (
            value: Record<string, unknown> | undefined,
            updatedAt: Date,
        ): UserMockInterviewCourseStatsProjectionEntity => ({
            enrollmentId: ENROLLMENT_ID,
            value,
            updatedAt,
        } as unknown as UserMockInterviewCourseStatsProjectionEntity)

        describe("recompute",
            () => {
                it("scans the enrollment's newest attempts under the scan cap and upserts the aggregate",
                    async () => {
                        const service = await build()
                        programScan(
                            entityManager,
                            [],
                            [],
                        )

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(entityManager.find).toHaveBeenCalledWith(
                            MockInterviewAttemptEntity,
                            {
                                where: {
                                    enrollment: {
                                        id: ENROLLMENT_ID,
                                    },
                                },
                                order: {
                                    createdAt: "DESC",
                                },
                                take: 50,
                            },
                        )
                        const call = entityManager.query.mock.calls[0] as [unknown, Array<unknown>]
                        expect(isUpsertSql(call[0])).toBe(true)
                        expect(call[1][0]).toBe(ENROLLMENT_ID)
                    })

                it("honours the caller's transaction manager instead of the injected connection",
                    async () => {
                        const service = await build()
                        const txManager = makeEntityManagerMock()
                        programScan(
                            txManager,
                            [],
                            [],
                        )

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                            entityManager: txManager as unknown as EntityManager,
                        })

                        expect(txManager.query).toHaveBeenCalledTimes(1)
                        expect(entityManager.query).not.toHaveBeenCalled()
                        expect(entityManager.find).not.toHaveBeenCalled()
                    })

                it("persists the insufficient-data shape and never fetches sessions below the attempt floor",
                    async () => {
                        const service = await build()
                        programScan(
                            entityManager,
                            [
                                makeAttempt({
                                    mode: "qna",
                                }),
                                makeAttempt({
                                    mode: "qna",
                                }),
                            ],
                            [],
                        )

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(persistedValue(entityManager)).toEqual(EMPTY_RESULT)
                        expect(entityManager.find).toHaveBeenCalledTimes(1)
                    })

                it("propagates a failure raised by the attempts scan",
                    async () => {
                        const service = await build()
                        const dbError = new Error("connection lost")
                        entityManager.find.mockRejectedValueOnce(dbError)

                        await expect(service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })).rejects.toThrow(dbError)
                    })
            })

        describe("recompute -- design attempts",
            () => {
                it("folds phases, attributes, levels, verdicts and recurring gaps, picking the weakest phase",
                    async () => {
                        const service = await build()
                        programScan(
                            entityManager,
                            [
                                makeAttempt({
                                    createdAt: new Date("2026-03-04T00:00:00.000Z"),
                                    overallScore: 70,
                                    verdict: "pass",
                                    level: "junior",
                                    matchedContentIds: [
                                        "content-4",
                                    ],
                                    gaps: [
                                        "Trade-off",
                                    ],
                                    phaseScores: [
                                        {
                                            phase: "requirements",
                                            score: 2,
                                            max: 10,
                                        },
                                        {
                                            phase: "tradeoffs",
                                            score: 9,
                                            max: 10,
                                        },
                                    ],
                                    attributeScores: [
                                        {
                                            key: "communication",
                                            score: 80,
                                        },
                                        {
                                            key: "tradeoffAwareness",
                                            score: 30,
                                        },
                                    ],
                                }),
                                makeAttempt({
                                    createdAt: new Date("2026-03-03T00:00:00.000Z"),
                                    overallScore: 65,
                                    verdict: "borderline",
                                    level: "middle",
                                    matchedContentIds: [
                                        "content-3",
                                    ],
                                    gaps: [
                                        "trade-off ",
                                    ],
                                    phaseScores: [
                                        {
                                            phase: "requirements",
                                            score: 3,
                                            max: 10,
                                        },
                                    ],
                                    attributeScores: [
                                        {
                                            key: "communication",
                                            score: 90,
                                        },
                                        {
                                            key: "tradeoffAwareness",
                                            score: 30,
                                        },
                                    ],
                                }),
                                makeAttempt({
                                    createdAt: new Date("2026-03-02T00:00:00.000Z"),
                                    overallScore: 50,
                                    verdict: "fail",
                                    level: "senior",
                                    // no matched content on this attempt -- the deep-link candidate is null
                                    matchedContentIds: [],
                                    gaps: [
                                        "Scaling",
                                        "   ",
                                        7,
                                    ],
                                    phaseScores: [
                                        {
                                            phase: "requirements",
                                            score: 1,
                                            max: 10,
                                        },
                                    ],
                                    attributeScores: [
                                        {
                                            key: "communication",
                                            score: 70,
                                        },
                                        {
                                            key: "tradeoffAwareness",
                                            score: 30,
                                        },
                                    ],
                                }),
                                makeAttempt({
                                    createdAt: new Date("2026-03-01T00:00:00.000Z"),
                                    overallScore: 88,
                                    // an unrecognised verdict is not tallied into any band
                                    verdict: "unknown",
                                    // a legacy null level is dropped, never bucketed
                                    level: null,
                                    matchedContentIds: [
                                        "content-1",
                                    ],
                                    gaps: null,
                                    phaseScores: [
                                        {
                                            phase: "highLevel",
                                            score: 8,
                                            max: 10,
                                        },
                                        // not one of the 5 canonical phases -- dropped
                                        {
                                            phase: "garbled",
                                            score: 1,
                                            max: 10,
                                        },
                                        // a non-string phase -- dropped
                                        {
                                            phase: 42,
                                            score: 1,
                                            max: 10,
                                        },
                                        // no usable max -- dropped
                                        {
                                            phase: "estimation",
                                            score: 5,
                                            max: 0,
                                        },
                                        // a non-numeric score on a canonical phase reads as 0
                                        {
                                            phase: "deepDive",
                                            score: "low",
                                            max: 10,
                                        },
                                        // scalar entries are not records -- dropped
                                        "garbage",
                                    ],
                                    attributeScores: [
                                        // an empty key is dropped
                                        {
                                            key: "",
                                            score: 5,
                                        },
                                        // a non-string key is dropped
                                        {
                                            key: 9,
                                            score: 5,
                                        },
                                        // a non-numeric score reads as 0
                                        {
                                            key: "structuredThinking",
                                            score: "high",
                                        },
                                    ],
                                }),
                            ],
                            [],
                        )

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        const value = persistedValue(entityManager)
                        expect(value.insufficientData).toBe(false)
                        expect(value.modeSplit).toEqual({
                            qnaCount: 0,
                            designCount: 4,
                        })
                        // no qna attempt in the window -> no session fetch at all
                        expect(entityManager.find).toHaveBeenCalledTimes(1)
                        // oldest-of-the-window first
                        expect(value.trend.map((point) => point.overallScore)).toEqual([
                            88,
                            50,
                            65,
                            70,
                        ])
                        expect(value.trend[0].mode).toBe("design")
                        expect(value.byPhase).toEqual([
                            {
                                key: "deepDive",
                                avgScore: 0,
                                avgMax: 10,
                                weakCount: 1,
                                attemptCount: 1,
                            },
                            {
                                key: "requirements",
                                avgScore: 2,
                                avgMax: 10,
                                weakCount: 3,
                                attemptCount: 3,
                            },
                            {
                                key: "highLevel",
                                avgScore: 8,
                                avgMax: 10,
                                weakCount: 0,
                                attemptCount: 1,
                            },
                            {
                                key: "tradeoffs",
                                avgScore: 9,
                                avgMax: 10,
                                weakCount: 0,
                                attemptCount: 1,
                            },
                        ])
                        expect(value.byAttribute).toEqual([
                            {
                                key: "structuredThinking",
                                avgScore: 0,
                                avgMax: 100,
                                weakCount: 1,
                                attemptCount: 1,
                            },
                            {
                                key: "tradeoffAwareness",
                                avgScore: 30,
                                avgMax: 100,
                                weakCount: 3,
                                attemptCount: 3,
                            },
                            {
                                key: "communication",
                                avgScore: 80,
                                avgMax: 100,
                                weakCount: 0,
                                attemptCount: 3,
                            },
                        ])
                        expect(value.byLevel.map((item) => item.key)).toEqual([
                            "senior",
                            "middle",
                            "junior",
                        ])
                        expect(value.byKind).toEqual([])
                        expect(value.byLanguage).toEqual([])
                        expect(value.verdictCounts).toEqual({
                            pass: 1,
                            borderline: 1,
                            fail: 1,
                        })
                        // "Trade-off" + "trade-off " normalize to one gap; the blank,
                        // the non-string and the single-mention "Scaling" all drop out
                        expect(value.recurringGaps).toEqual([
                            {
                                text: "Trade-off",
                                count: 2,
                            },
                        ])
                        expect(value.weakest).toEqual({
                            key: "requirements",
                            axis: "phase",
                            avgScore: 2,
                            avgMax: 10,
                            weakCount: 3,
                            // resolved off the MOST RECENT attempt where it came in weak
                            matchedContentId: "content-4",
                        })
                    })

                it("names the weakest attribute when no phase is weak often enough",
                    async () => {
                        const service = await build()
                        const attempts = [
                            1,
                            2,
                            3,
                        ].map((index) => makeAttempt({
                            createdAt: new Date(`2026-03-0${index}T00:00:00.000Z`),
                            level: "middle",
                            matchedContentIds: [],
                            phaseScores: [
                                {
                                    phase: "requirements",
                                    score: 9,
                                    max: 10,
                                },
                            ],
                            attributeScores: [
                                {
                                    key: "communication",
                                    score: 10,
                                },
                            ],
                        }))
                        programScan(
                            entityManager,
                            attempts,
                            [],
                        )

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(persistedValue(entityManager).weakest).toEqual({
                            key: "communication",
                            axis: "attribute",
                            avgScore: 10,
                            avgMax: 100,
                            weakCount: 3,
                            // every weak attempt carried an empty matchedContentIds
                            matchedContentId: null,
                        })
                    })

                it("returns no weakest entry when nothing was weak often enough to be a pattern",
                    async () => {
                        const service = await build()
                        const attempts = [
                            1,
                            2,
                            3,
                        ].map((index) => makeAttempt({
                            createdAt: new Date(`2026-03-0${index}T00:00:00.000Z`),
                            phaseScores: [
                                {
                                    phase: "requirements",
                                    score: 9,
                                    max: 10,
                                },
                            ],
                        }))
                        programScan(
                            entityManager,
                            attempts,
                            [],
                        )

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(persistedValue(entityManager).weakest).toBeNull()
                    })

                it("caps the trend at the ten most recent attempts and reads a null mode as design",
                    async () => {
                        const service = await build()
                        const attempts = Array.from(
                            {
                                length: 11,
                            },
                            (_unused, index) => makeAttempt({
                                // index 0 is the newest attempt
                                createdAt: new Date(Date.UTC(2026,
                                    2,
                                    20 - index)),
                                overallScore: 100 - index,
                                mode: null,
                            }),
                        )
                        programScan(
                            entityManager,
                            attempts,
                            [],
                        )

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        const value = persistedValue(entityManager)
                        expect(value.trend).toHaveLength(10)
                        // the oldest attempt (score 90) is cut, the window starts at 91
                        expect(value.trend[0].overallScore).toBe(91)
                        expect(value.trend[9].overallScore).toBe(100)
                        expect(value.trend.every((point) => point.mode === "design")).toBe(true)
                        // a null mode is not qna, so it counts as a design attempt
                        expect(value.modeSplit).toEqual({
                            qnaCount: 0,
                            designCount: 11,
                        })
                    })

                it("keeps only the five most frequent recurring gaps, most frequent first",
                    async () => {
                        const service = await build()
                        const gaps = [
                            "gap-a",
                            "gap-b",
                            "gap-c",
                            "gap-d",
                            "gap-e",
                            "gap-f",
                        ]
                        const attempts = [
                            1,
                            2,
                            3,
                        ].map((index) => makeAttempt({
                            createdAt: new Date(`2026-03-0${index}T00:00:00.000Z`),
                            // the newest attempt records every gap once; the older two
                            // repeat a shrinking prefix, so the tally ranks a..f descending
                            gaps: gaps.slice(0,
                                index === 1 ? 6 : 7 - index),
                        }))
                        programScan(
                            entityManager,
                            attempts,
                            [],
                        )

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(persistedValue(entityManager).recurringGaps).toEqual([
                            {
                                text: "gap-a",
                                count: 3,
                            },
                            {
                                text: "gap-b",
                                count: 3,
                            },
                            {
                                text: "gap-c",
                                count: 3,
                            },
                            {
                                text: "gap-d",
                                count: 3,
                            },
                            {
                                text: "gap-e",
                                count: 2,
                            },
                        ])
                    })
            })

        describe("recompute -- qna attempts",
            () => {
                it("folds question kinds and joins each review to its drawn session's language",
                    async () => {
                        const service = await build()
                        programScan(
                            entityManager,
                            [
                                makeAttempt({
                                    createdAt: new Date("2026-03-04T00:00:00.000Z"),
                                    mode: "qna",
                                    sessionId: "session-a",
                                    level: "junior",
                                    overallScore: 40,
                                    verdict: "fail",
                                    matchedContentIds: [
                                        "mc-1",
                                    ],
                                    questionReviews: [
                                        {
                                            questionIndex: 0,
                                            kind: "theory",
                                            score: 2,
                                            max: 10,
                                            matchedContentId: "c-theory-1",
                                        },
                                        // no questionIndex -> no seed -> no language bucket
                                        {
                                            kind: "reasoning",
                                            score: 9,
                                            max: 10,
                                        },
                                        // empty kind is dropped from byKind; index 9 has no seed
                                        {
                                            kind: "",
                                            score: 5,
                                            max: 10,
                                            questionIndex: 9,
                                        },
                                        // a non-string kind is dropped too
                                        {
                                            kind: 3,
                                            score: 5,
                                            max: 10,
                                        },
                                        // seed 3 carries no givenCodes at all
                                        {
                                            kind: "",
                                            score: 4,
                                            max: 10,
                                            questionIndex: 3,
                                        },
                                        // seed 2 is a python code question, but max 0 drops it
                                        {
                                            questionIndex: 2,
                                            kind: "scenario",
                                            score: 5,
                                            max: 0,
                                        },
                                        // a non-numeric score on a language-bearing seed reads
                                        // as 0; python still ends up a one-draw language and is
                                        // dropped by the min-sample guard
                                        {
                                            questionIndex: 2,
                                            kind: "",
                                            score: "eight",
                                            max: 10,
                                        },
                                        // a non-numeric score reads as 0
                                        {
                                            questionIndex: 1,
                                            kind: "scenario",
                                            score: "eight",
                                            max: 10,
                                        },
                                        "garbage",
                                    ],
                                }),
                                makeAttempt({
                                    createdAt: new Date("2026-03-03T00:00:00.000Z"),
                                    mode: "qna",
                                    sessionId: "session-a",
                                    level: "junior",
                                    overallScore: 45,
                                    verdict: "fail",
                                    questionReviews: [
                                        {
                                            questionIndex: 0,
                                            kind: "theory",
                                            score: 3,
                                            max: 10,
                                            // a non-string deep-link id reads as null
                                            matchedContentId: 5,
                                        },
                                    ],
                                }),
                                makeAttempt({
                                    createdAt: new Date("2026-03-02T00:00:00.000Z"),
                                    mode: "qna",
                                    // this session was drawn before seedQuestions existed
                                    sessionId: "session-b",
                                    level: "junior",
                                    overallScore: 41,
                                    verdict: "fail",
                                    questionReviews: [
                                        {
                                            questionIndex: 0,
                                            kind: "theory",
                                            score: 1,
                                            max: 10,
                                        },
                                    ],
                                }),
                                makeAttempt({
                                    createdAt: new Date("2026-03-01T00:00:00.000Z"),
                                    mode: "qna",
                                    // no row exists for this session at all
                                    sessionId: "session-missing",
                                    level: "junior",
                                    overallScore: 42,
                                    verdict: "fail",
                                    questionReviews: [
                                        {
                                            questionIndex: 0,
                                            kind: "theory",
                                            score: 1,
                                            max: 10,
                                        },
                                    ],
                                }),
                            ],
                            [
                                makeSession("session-a",
                                    [
                                        {
                                            givenCodes: [
                                                {
                                                    lang: "typescript",
                                                    code: "const a = 1",
                                                },
                                            ],
                                        },
                                        // drawn without any code -> carries no language
                                        {
                                            givenCodes: [],
                                        },
                                        {
                                            givenCodes: [
                                                {
                                                    lang: "python",
                                                    code: "a = 1",
                                                },
                                            ],
                                        },
                                        {
                                        },
                                    ]),
                                makeSession("session-b",
                                    null),
                            ],
                        )

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        const value = persistedValue(entityManager)
                        expect(value.modeSplit).toEqual({
                            qnaCount: 4,
                            designCount: 0,
                        })
                        expect(entityManager.find).toHaveBeenCalledWith(
                            MockInterviewSessionEntity,
                            expect.objectContaining({
                                where: expect.anything(),
                            }),
                        )
                        expect(value.byPhase).toEqual([])
                        expect(value.byKind).toEqual([
                            {
                                key: "scenario",
                                avgScore: 0,
                                avgMax: 10,
                                weakCount: 1,
                                attemptCount: 1,
                            },
                            {
                                key: "theory",
                                avgScore: 1.75,
                                avgMax: 10,
                                weakCount: 4,
                                attemptCount: 4,
                            },
                            {
                                key: "reasoning",
                                avgScore: 9,
                                avgMax: 10,
                                weakCount: 0,
                                attemptCount: 1,
                            },
                        ])
                        // only "typescript" cleared the min-sample guard; "python" was
                        // dropped at max 0 and never reached the accumulator
                        expect(value.byLanguage).toEqual([
                            {
                                key: "typescript",
                                avgScore: 2.5,
                                avgMax: 10,
                                weakCount: 2,
                                attemptCount: 2,
                            },
                        ])
                        expect(value.weakest).toEqual({
                            key: "theory",
                            axis: "kind",
                            avgScore: 1.75,
                            avgMax: 10,
                            weakCount: 4,
                            matchedContentId: "c-theory-1",
                        })
                    })

                it("drops a language drawn only once as noise",
                    async () => {
                        const service = await build()
                        programScan(
                            entityManager,
                            [
                                1,
                                2,
                                3,
                            ].map((index) => makeAttempt({
                                createdAt: new Date(`2026-03-0${index}T00:00:00.000Z`),
                                mode: "qna",
                                sessionId: index === 1 ? "session-a" : "session-c",
                                questionReviews: [
                                    {
                                        questionIndex: 0,
                                        kind: "theory",
                                        score: 9,
                                        max: 10,
                                    },
                                ],
                            })),
                            [
                                makeSession("session-a",
                                    [
                                        {
                                            givenCodes: [
                                                {
                                                    lang: "rust",
                                                    code: "fn main() {}",
                                                },
                                            ],
                                        },
                                    ]),
                                makeSession("session-c",
                                    [
                                        {
                                            givenCodes: [
                                                {
                                                    lang: "go",
                                                    code: "func main() {}",
                                                },
                                            ],
                                        },
                                    ]),
                            ],
                        )

                        await service.recompute({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        const value = persistedValue(entityManager)
                        // "go" was drawn twice and survives; "rust" was drawn once and is dropped
                        expect(value.byLanguage).toEqual([
                            {
                                key: "go",
                                avgScore: 9,
                                avgMax: 10,
                                weakCount: 0,
                                attemptCount: 2,
                            },
                        ])
                    })
            })

        describe("getStats",
            () => {
                it("returns the stored aggregate straight from a fresh row without recomputing",
                    async () => {
                        const service = await build()
                        const stored = {
                            insufficientData: false,
                            modeSplit: {
                                qnaCount: 2,
                                designCount: 3,
                            },
                            trend: [
                                {
                                    completedAt: "2026-03-01T00:00:00.000Z",
                                    overallScore: 70,
                                    mode: "design",
                                    verdict: "pass",
                                },
                            ],
                            byPhase: [
                                {
                                    key: "requirements",
                                    avgScore: 2,
                                    avgMax: 10,
                                    weakCount: 3,
                                    attemptCount: 3,
                                },
                            ],
                            byKind: [],
                            byAttribute: [],
                            byLevel: [],
                            byLanguage: [],
                            recurringGaps: [
                                {
                                    text: "Trade-off",
                                    count: 2,
                                },
                            ],
                            weakest: {
                                key: "requirements",
                                axis: "phase",
                                avgScore: 2,
                                avgMax: 10,
                                weakCount: 3,
                                matchedContentId: null,
                            },
                            verdictCounts: {
                                pass: 3,
                                borderline: 1,
                                fail: 1,
                            },
                        }
                        entityManager.findOne.mockResolvedValueOnce(buildRow(
                            stored,
                            new Date(),
                        ))

                        const result = await service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(result).toEqual(stored)
                        expect(entityManager.query).not.toHaveBeenCalled()
                        expect(entityManager.findOne).toHaveBeenCalledTimes(1)
                    })

                it("lazily recomputes a row past the staleness TTL, then re-reads it",
                    async () => {
                        const service = await build()
                        programScan(
                            entityManager,
                            [],
                            [],
                        )
                        entityManager.findOne
                            .mockResolvedValueOnce(buildRow(
                                {
                                    insufficientData: false,
                                    modeSplit: {
                                        qnaCount: 1,
                                        designCount: 0,
                                    },
                                },
                                new Date(Date.now() - STALE_AFTER_MS - 1_000),
                            ))
                            .mockResolvedValueOnce(buildRow(
                                {
                                    insufficientData: false,
                                    modeSplit: {
                                        qnaCount: 9,
                                        designCount: 4,
                                    },
                                },
                                new Date(),
                            ))

                        const result = await service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(entityManager.findOne).toHaveBeenCalledTimes(2)
                        expect(result.modeSplit).toEqual({
                            qnaCount: 9,
                            designCount: 4,
                        })
                        // absent keys fall back to the zeroed shape
                        expect(result.trend).toEqual([])
                        expect(result.weakest).toBeNull()
                        expect(result.verdictCounts).toEqual(EMPTY_RESULT.verdictCounts)
                    })

                it("recomputes a missing row and returns the insufficient-data shape when still absent",
                    async () => {
                        const service = await build()
                        programScan(
                            entityManager,
                            [],
                            [],
                        )

                        const result = await service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                        expect(result).toEqual(EMPTY_RESULT)
                    })

                it("returns the insufficient-data shape for a row whose jsonb value is an empty object",
                    async () => {
                        const service = await build()
                        entityManager.findOne.mockResolvedValueOnce(buildRow(
                            {
                            },
                            new Date(),
                        ))

                        const result = await service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(result).toEqual(EMPTY_RESULT)
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("defaults every absent key, including the insufficient-data flag itself",
                    async () => {
                        const service = await build()
                        entityManager.findOne.mockResolvedValueOnce(buildRow(
                            {
                                byPhase: [
                                    {
                                        key: "deepDive",
                                        avgScore: 1,
                                        avgMax: 10,
                                        weakCount: 4,
                                        attemptCount: 4,
                                    },
                                ],
                            },
                            new Date(),
                        ))

                        const result = await service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })

                        expect(result.insufficientData).toBe(true)
                        expect(result.byPhase).toHaveLength(1)
                        expect(result.modeSplit).toEqual(EMPTY_RESULT.modeSplit)
                        expect(result.byKind).toEqual([])
                        expect(result.byAttribute).toEqual([])
                        expect(result.byLevel).toEqual([])
                        expect(result.byLanguage).toEqual([])
                        expect(result.recurringGaps).toEqual([])
                    })

                it("propagates a findOne failure while reading the projection row",
                    async () => {
                        const service = await build()
                        const dbError = new Error("read replica unavailable")
                        entityManager.findOne.mockRejectedValueOnce(dbError)

                        await expect(service.getStats({
                            enrollmentId: ENROLLMENT_ID,
                        })).rejects.toThrow(dbError)
                    })
            })
    })
