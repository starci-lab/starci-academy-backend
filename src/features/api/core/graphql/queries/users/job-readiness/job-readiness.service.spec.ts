import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    UserSolvedChallengesProjectionService,
} from "@modules/bussiness"
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
 * four aggregate reads via `Promise.all` in a fixed order — capstoneTotals,
 * capstonePassed, interviewAverages, then loadTrackCvScores. The global
 * foundation adds `computeCvScore` (two `findOne` reads) + a projection call.
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

            module = await Test.createTestingModule({
                providers: [
                    JobReadinessService,
                    {
                        provide: UserSolvedChallengesProjectionService,
                        useValue: userSolvedChallengesProjectionService,
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
                        // query order: capstoneTotals, capstonePassed, interviewAverages,
                        // loadTrackCvScores (no CV row here → cv pillar absent)
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
                            .mockResolvedValueOnce([])

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
                            .mockResolvedValueOnce([])

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
                            .mockResolvedValueOnce([])

                        const result = await service.compute({
                            userId: "user-2",
                        })

                        expect(result.tracks[0].courseId).toBe("course-strong")
                        expect(result.tracks[1].courseId).toBe("course-weak")
                    })

                // CV per-track pillar: a scored CV tied to a course lands on THAT
                // track's cvScore; a course with no scored CV row → cvScore null.
                it("attaches a scored CV to its own track's cvScore and leaves an unscored track's cvScore null",
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
                            // loadTrackCvScores — only course-cv has a scored CV
                            .mockResolvedValueOnce([
                                {
                                    course_id: "course-cv",
                                    max_score: "91",
                                },
                            ])

                        const result = await service.compute({
                            userId: "user-3",
                        })

                        const withCv = result.tracks.find(
                            (track) => track.courseId === "course-cv",
                        )
                        const noCv = result.tracks.find(
                            (track) => track.courseId === "course-nocv",
                        )
                        expect(withCv?.cvScore).toBe(91)
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
                            // loadTrackCvScores — none
                            .mockResolvedValueOnce([])

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
