import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CvVerificationService,
    UserSolvedChallengesProjectionService,
} from "@modules/bussiness"
import {
    CvVerificationLevel,
} from "@modules/databases"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import {
    JobReadinessService,
} from "./job-readiness.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Unit suite for {@link JobReadinessService}. Every DB read is mocked; the
 * `entityManager.query` mock is ORDER-SENSITIVE because `buildTracks` issues its
 * THREE aggregate reads via `Promise.all` in a fixed order — capstoneTotals,
 * capstonePassed, interviewAverages. The CV pillar (2026-07-05: deterministic,
 * no AI/CV-row read) comes from {@link CvVerificationService} instead —
 * `resolveLevelForCourse` per track, `resolveLevel` for the global foundation —
 * mocked separately below, defaulting to `SelfReported` (→ null/0) unless a
 * test overrides it.
 *
 * Locks the fair-monetization axiom (see
 * `.claude/rules/concepts/fair-monetization-axiom.md`): a track's numbers never
 * change with the number of courses a learner has bought.
 */
describe("JobReadinessService",
    () => {
        let module: TestingModule
        let service: JobReadinessService
        let entityManager: EntityManagerMock
        let userSolvedChallengesProjectionService: jest.Mocked<
            Pick<UserSolvedChallengesProjectionService, "getChallengeStrength">
        >
        let cvVerificationService: jest.Mocked<
            Pick<CvVerificationService, "resolveLevel" | "resolveLevelForCourse" | "scoreOf">
        >

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            // global foundation input — a single per-user percentile, independent of
            // how many tracks/enrollments the user has
            userSolvedChallengesProjectionService = {
                getChallengeStrength: jest.fn().mockResolvedValue({
                    percentile: 42,
                    rank: 7,
                    xp: 1200,
                }),
            } as unknown as jest.Mocked<
                Pick<UserSolvedChallengesProjectionService, "getChallengeStrength">
            >

            // default: no graded StarCi work anywhere → every CV pillar (per-track
            // AND global foundation) degrades to null/0, same as the old "no CV
            // row" default — individual tests override per courseId/globally
            cvVerificationService = {
                resolveLevel: jest.fn().mockResolvedValue(CvVerificationLevel.SelfReported),
                resolveLevelForCourse: jest.fn().mockResolvedValue(CvVerificationLevel.SelfReported),
                scoreOf: jest.fn((level: CvVerificationLevel) => {
                    // capstone-only score (2026-07-05): challenge/activity scores 0
                    switch (level) {
                    case CvVerificationLevel.CapstoneVerified:
                        return 100
                    case CvVerificationLevel.ActivityBacked:
                    case CvVerificationLevel.SelfReported:
                        return 0
                    }
                }),
            } as unknown as jest.Mocked<
                Pick<CvVerificationService, "resolveLevel" | "resolveLevelForCourse" | "scoreOf">
            >

            module = await Test.createTestingModule({
                providers: [
                    JobReadinessService,
                    {
                        provide: UserSolvedChallengesProjectionService,
                        useValue: userSolvedChallengesProjectionService,
                    },
                    {
                        provide: CvVerificationService,
                        useValue: cvVerificationService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<JobReadinessService>(JobReadinessService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("compute",
            () => {
                // THE core invariant: "1 course = N courses" for any EXISTING track.
                // Adding a second qualified track (with depth <= the first) must leave
                // the first track's depthScore/band/pillars byte-for-byte identical AND
                // the global foundation identical — no shared composite/breadthBonus.
                it("keeps an existing track's depthScore/band/pillars + foundation byte-identical when a second qualified track is added, with no composite/breadthBonus keys",
                    async () => {
                        // --- run A: exactly ONE enrollment (track A, high depth) ---
                        const enrollmentA = {
                            id: "enrollment-a",
                            courseId: "course-a",
                            isEnrolled: true,
                            course: {
                                title: "Track A",
                                displayId: "track-a",
                            },
                        }

                        entityManager.find.mockResolvedValueOnce([
                            enrollmentA,
                        ])
                        // query order: capstoneTotals, capstonePassed, interviewAverages
                        // (CV pillar comes from CvVerificationService, mocked separately —
                        // default SelfReported → cv pillar absent, same as the old "no CV row")
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    course_id: "course-a",
                                    total: "10",
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enrollment-a",
                                    passed: "9",
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enrollment-a",
                                    avg_score: "88",
                                },
                            ])

                        const resultWithOneTrack = await service.compute({
                            userId: "user-1",
                        })

                        expect(resultWithOneTrack.tracks).toHaveLength(1)
                        const trackABefore = resultWithOneTrack.tracks[0]
                        expect(trackABefore.courseId).toBe("course-a")
                        expect(trackABefore.depthScore).not.toBeNull()

                        // --- run B: SAME user, now TWO enrollments — track A (identical
                        // inputs) + track B (weaker-or-equal depth, also qualifies) ---
                        const enrollmentB = {
                            id: "enrollment-b",
                            courseId: "course-b",
                            isEnrolled: true,
                            course: {
                                title: "Track B",
                                displayId: "track-b",
                            },
                        }

                        entityManager.find.mockResolvedValueOnce([
                            enrollmentA,
                            enrollmentB,
                        ])
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    course_id: "course-a",
                                    total: "10",
                                },
                                {
                                    course_id: "course-b",
                                    total: "10",
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enrollment-a",
                                    passed: "9",
                                },
                                {
                                    enrollment_id: "enrollment-b",
                                    passed: "5",
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enrollment-a",
                                    avg_score: "88",
                                },
                                {
                                    enrollment_id: "enrollment-b",
                                    avg_score: "60",
                                },
                            ])

                        const resultWithTwoTracks = await service.compute({
                            userId: "user-1",
                        })

                        expect(resultWithTwoTracks.tracks).toHaveLength(2)
                        const trackAAfter = resultWithTwoTracks.tracks.find(
                            (track) => track.courseId === "course-a",
                        )
                        expect(trackAAfter).toBeDefined()

                        // THE ASSERTION: track A's own numbers are byte-for-byte identical
                        // whether it is the only track or one of two.
                        expect(trackAAfter?.depthScore).toBe(trackABefore.depthScore)
                        expect(trackAAfter?.band).toBe(trackABefore.band)
                        expect(trackAAfter?.capstoneScore).toBe(trackABefore.capstoneScore)
                        expect(trackAAfter?.interviewScore).toBe(trackABefore.interviewScore)
                        expect(trackAAfter?.cvScore).toBe(trackABefore.cvScore)

                        // the global foundation is per-user — unaffected by track count
                        expect(resultWithTwoTracks.foundation).toEqual(
                            resultWithOneTrack.foundation,
                        )

                        // no composite/breadth-bonus scalar left on the result — the
                        // whole point of the portfolio refactor
                        expect(resultWithTwoTracks).not.toHaveProperty("compositeScore")
                        expect(resultWithTwoTracks).not.toHaveProperty("breadthBonus")
                    })

                it("sorts tracks strongest depthScore first",
                    async () => {
                        const weakerEnrollment = {
                            id: "enrollment-weak",
                            courseId: "course-weak",
                            isEnrolled: true,
                            course: {
                                title: "Weak Track",
                                displayId: "weak-track",
                            },
                        }
                        const strongerEnrollment = {
                            id: "enrollment-strong",
                            courseId: "course-strong",
                            isEnrolled: true,
                            course: {
                                title: "Strong Track",
                                displayId: "strong-track",
                            },
                        }

                        // enrollments returned weak-first — the service must re-sort
                        entityManager.find.mockResolvedValueOnce([
                            weakerEnrollment,
                            strongerEnrollment,
                        ])
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    course_id: "course-weak",
                                    total: "10",
                                },
                                {
                                    course_id: "course-strong",
                                    total: "10",
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enrollment-weak",
                                    passed: "2",
                                },
                                {
                                    enrollment_id: "enrollment-strong",
                                    passed: "10",
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enrollment-weak",
                                    avg_score: "30",
                                },
                                {
                                    enrollment_id: "enrollment-strong",
                                    avg_score: "95",
                                },
                            ])

                        const result = await service.compute({
                            userId: "user-2",
                        })

                        expect(result.tracks[0].courseId).toBe("course-strong")
                        expect(result.tracks[1].courseId).toBe("course-weak")
                    })

                // Recent-window interview pillar (WF-09): the query itself is mocked
                // at the row level here, so this test locks the CONSUMPTION side —
                // `avg_score` already reflects only the recent-N window by the time
                // it reaches `buildTracks` (the window function lives in SQL, not in
                // JS). What we assert is that a recent-window average (computed as if
                // an old weak attempt had been excluded) produces a HIGH interview
                // score, not one dragged down by history — i.e. the service trusts
                // whatever recency-filtered average the query hands back, rather than
                // re-averaging or otherwise diluting it in code.
                it("reflects a recent high-score trend rather than being dragged down by an old low-score attempt",
                    async () => {
                        const enrollment = {
                            id: "enrollment-recent",
                            courseId: "course-recent",
                            isEnrolled: true,
                            course: {
                                title: "Recent Window",
                                displayId: "recent-window",
                            },
                        }

                        entityManager.find.mockResolvedValueOnce([
                            enrollment,
                        ])
                        entityManager.query
                            // capstoneTotals
                            .mockResolvedValueOnce([
                                {
                                    course_id: "course-recent",
                                    total: "10",
                                },
                            ])
                            // capstonePassed
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enrollment-recent",
                                    passed: "8",
                                },
                            ])
                            // interviewAverages — an old attempt scored 20 (say, week 1),
                            // then several recent attempts scored 95+; the recent-N window
                            // query (mocked here at the row level) excludes the old attempt,
                            // so the average handed back is the recent high, NOT the
                            // all-time average (which would be ~30 if the old 20 were
                            // still mixed in)
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enrollment-recent",
                                    avg_score: "96",
                                },
                            ])

                        const result = await service.compute({
                            userId: "user-recent",
                        })

                        const track = result.tracks.find(
                            (candidate) => candidate.courseId === "course-recent",
                        )
                        expect(track?.interviewScore).toBe(96)
                        // sanity: nowhere close to what an all-time average dragged down
                        // by the old 20-point attempt would have produced
                        expect(track?.interviewScore).toBeGreaterThan(60)
                    })

                // CV per-track pillar: a course with a passed capstone/graded challenge
                // IN THAT COURSE lands on THAT track's cvScore; a course with no such
                // signal → cvScore null. Scoped per-course on purpose (fair-monetization:
                // a capstone passed in a DIFFERENT course must never leak in here).
                it("attaches a deterministic CV score to its own track and leaves an unverified track's cvScore null",
                    async () => {
                        const enrollmentWithCv = {
                            id: "enrollment-cv",
                            courseId: "course-cv",
                            isEnrolled: true,
                            course: {
                                title: "Has CV",
                                displayId: "has-cv",
                            },
                        }
                        const enrollmentNoCv = {
                            id: "enrollment-nocv",
                            courseId: "course-nocv",
                            isEnrolled: true,
                            course: {
                                title: "No CV",
                                displayId: "no-cv",
                            },
                        }

                        entityManager.find.mockResolvedValueOnce([
                            enrollmentWithCv,
                            enrollmentNoCv,
                        ])
                        entityManager.query
                            // capstoneTotals
                            .mockResolvedValueOnce([
                                {
                                    course_id: "course-cv",
                                    total: "10",
                                },
                                {
                                    course_id: "course-nocv",
                                    total: "10",
                                },
                            ])
                            // capstonePassed
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enrollment-cv",
                                    passed: "8",
                                },
                                {
                                    enrollment_id: "enrollment-nocv",
                                    passed: "8",
                                },
                            ])
                            // interviewAverages
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enrollment-cv",
                                    avg_score: "70",
                                },
                                {
                                    enrollment_id: "enrollment-nocv",
                                    avg_score: "70",
                                },
                            ])
                        // only course-cv has a capstone-verified signal, scoped per-course
                        cvVerificationService.resolveLevelForCourse.mockImplementation(
                            async ({ courseId }) => courseId === "course-cv"
                                ? CvVerificationLevel.CapstoneVerified
                                : CvVerificationLevel.SelfReported,
                        )

                        const result = await service.compute({
                            userId: "user-3",
                        })

                        const withCv = result.tracks.find(
                            (track) => track.courseId === "course-cv",
                        )
                        const noCv = result.tracks.find(
                            (track) => track.courseId === "course-nocv",
                        )
                        expect(withCv?.cvScore).toBe(100)
                        expect(noCv?.cvScore).toBeNull()
                    })

                // 3-pillar renormalization: only-capstone present → depth == capstone;
                // all pillars absent → depthScore null + "needsWork" band.
                it("renormalizes over present pillars — capstone-only scores on capstone alone; all-null pillars → depthScore null and needsWork band",
                    async () => {
                        const capstoneOnly = {
                            id: "enrollment-cap",
                            courseId: "course-cap",
                            isEnrolled: true,
                            course: {
                                title: "Capstone Only",
                                displayId: "cap-only",
                            },
                        }
                        const emptyTrack = {
                            id: "enrollment-empty",
                            courseId: "course-empty",
                            isEnrolled: true,
                            course: {
                                title: "Empty",
                                displayId: "empty",
                            },
                        }

                        entityManager.find.mockResolvedValueOnce([
                            capstoneOnly,
                            emptyTrack,
                        ])
                        entityManager.query
                            // capstoneTotals — only course-cap has capstone tasks
                            .mockResolvedValueOnce([
                                {
                                    course_id: "course-cap",
                                    total: "10",
                                },
                            ])
                            // capstonePassed — only enrollment-cap passed tasks
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enrollment-cap",
                                    passed: "6",
                                },
                            ])
                            // interviewAverages — none
                            .mockResolvedValueOnce([])
                        // CV pillar — none (default SelfReported for both courses)

                        const result = await service.compute({
                            userId: "user-4",
                        })

                        const capTrack = result.tracks.find(
                            (track) => track.courseId === "course-cap",
                        )
                        // only capstone present (6/10 = 60%) → depth is capstone alone,
                        // renormalized weight 0.4/0.4 = 1.0
                        expect(capTrack?.capstoneScore).toBe(60)
                        expect(capTrack?.interviewScore).toBeNull()
                        expect(capTrack?.cvScore).toBeNull()
                        expect(capTrack?.depthScore).toBe(60)

                        const emptyResultTrack = result.tracks.find(
                            (track) => track.courseId === "course-empty",
                        )
                        // no capstone tasks, no interview, no CV → every pillar null
                        expect(emptyResultTrack?.capstoneScore).toBeNull()
                        expect(emptyResultTrack?.interviewScore).toBeNull()
                        expect(emptyResultTrack?.cvScore).toBeNull()
                        expect(emptyResultTrack?.depthScore).toBeNull()
                        expect(emptyResultTrack?.band).toBe("needsWork")
                    })

                it("returns an empty tracks list when the learner has no paid enrollments",
                    async () => {
                        // no enrollments → buildTracks short-circuits, no query calls
                        entityManager.find.mockResolvedValueOnce([])

                        const result = await service.compute({
                            userId: "user-5",
                        })

                        expect(result.tracks).toEqual([])
                        // foundation still populated from the projection + CV reads
                        expect(result.foundation.codingPercentile).toBe(42)
                    })
            })
    })
