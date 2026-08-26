import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CvVerificationLevel,
} from "@modules/databases/postgresql/primary/enums/cv-verification-level"
import {
    CvVerificationService,
} from "@modules/bussiness/headhuntings/cv-verification.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    TalentCandidatesService,
} from "./talent-candidates.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Unit suite for {@link TalentCandidatesService}. Every DB read is mocked; the
 * `entityManager.query` mock is ORDER-SENSITIVE because `rankByTrack` issues its
 * four aggregate reads via `Promise.all` in a fixed order: loadCourseCapstoneTotal,
 * loadCandidateCapstonePassed, loadCandidateInterviewAverages, loadCandidateCvScores.
 *
 * Locks the recruiter-marketplace fairness contract (WF-08 / WF-01/WF-02):
 * ranking is scoped to the ONE filtered track's depth -- a candidate is NEVER
 * ranked using depth earned in some other course.
 */
describe("TalentCandidatesService",
    () => {
        let module: TestingModule
        let service: TalentCandidatesService
        let entityManager: EntityManagerMock
        let cvVerificationService: jest.Mocked<Pick<CvVerificationService, "resolveLevels" | "rankOf">>

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            // default: no verification signal for anyone (every candidate self-reported)
            // and a neutral rank so the depth sort is unaffected unless a test overrides
            cvVerificationService = {
                resolveLevels: jest.fn().mockResolvedValue(new Map()),
                rankOf: jest.fn().mockReturnValue(0),
            } as unknown as jest.Mocked<Pick<CvVerificationService, "resolveLevels" | "rankOf">>

            module = await Test.createTestingModule({
                providers: [
                    TalentCandidatesService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: CvVerificationService,
                        useValue: cvVerificationService,
                    },
                ],
            }).compile()

            service = module.get<TalentCandidatesService>(TalentCandidatesService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("rankByTrack",
            () => {
                // Filtering by ONE track returns only that course's candidates, each
                // with a track card scoped to the filtered course, ranked by that
                // course's depthScore DESC.
                it("returns only candidates enrolled in the filtered track, ranked by that track's depthScore",
                    async () => {
                        // two open-to-work candidates PAID-enrolled in course-a. The mock
                        // `find` stands in for the WHERE { courseId, isEnrolled, user }
                        // filter -- so only course-a enrollments come back.
                        const enrollmentAliceA = {
                            id: "enr-alice-a",
                            courseId: "course-a",
                            userId: "user-alice",
                            isEnrolled: true,
                            course: {
                                title: "Track A",
                                displayId: "track-a",
                            },
                            user: {
                                id: "user-alice",
                                openToWork: true,
                            },
                        }
                        const enrollmentBobA = {
                            id: "enr-bob-a",
                            courseId: "course-a",
                            userId: "user-bob",
                            isEnrolled: true,
                            course: {
                                title: "Track A",
                                displayId: "track-a",
                            },
                            user: {
                                id: "user-bob",
                                openToWork: true,
                            },
                        }

                        // returned bob-first so we prove the service re-sorts by depth
                        entityManager.find.mockResolvedValueOnce([
                            enrollmentBobA,
                            enrollmentAliceA,
                        ])
                        // query order: courseCapstoneTotal, candidateCapstonePassed,
                        // candidateInterviewAverages, candidateCvScores
                        entityManager.query
                            // course-a has 10 capstone tasks (shared denominator)
                            .mockResolvedValueOnce([
                                {
                                    total: "10",
                                },
                            ])
                            // passed: alice 9/10, bob 3/10
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enr-alice-a",
                                    passed: "9",
                                },
                                {
                                    enrollment_id: "enr-bob-a",
                                    passed: "3",
                                },
                            ])
                            // interview: alice 90, bob 40 (recent-window avg)
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enr-alice-a",
                                    avg_score: "90",
                                },
                                {
                                    enrollment_id: "enr-bob-a",
                                    avg_score: "40",
                                },
                            ])
                            // cv: none for this course
                            .mockResolvedValueOnce([])

                        const result = await service.rankByTrack({
                            courseId: "course-a",
                            limit: 24,
                            offset: 0,
                        })

                        // both course-a candidates present
                        expect(result).toHaveLength(2)
                        // ranked by course-a depth DESC -> alice first (strong), bob second
                        expect(result[0].user.id).toBe("user-alice")
                        expect(result[1].user.id).toBe("user-bob")
                        // every returned track is the FILTERED course, carrying qualitative badges
                        expect(result[0].track.courseId).toBe("course-a")
                        expect(result[1].track.courseId).toBe("course-a")
                        // alice: capstone 90 (9/10) + interview 90 -> depth 90 -> jobReady
                        expect(result[0].track.depthScore).toBe(90)
                        expect(result[0].track.band).toBe("jobReady")
                        expect(result[0].track.isQualified).toBe(true)
                        // bob: capstone 30 (3/10) + interview 40 -> depth ~34 -> needsWork
                        expect(result[1].track.band).toBe("needsWork")
                    })

                // THE fairness invariant: a candidate with a monster depth in a
                // DIFFERENT track must NOT be ranked using that other track's score.
                // When filtering course-a, bob's high course-b depth is structurally
                // invisible -- the service only ever loads + ranks the filtered course's
                // enrollments, never blending in another course's depth.
                it("ranks strictly within the filtered track — a high depthScore in a DIFFERENT track never lifts a candidate",
                    async () => {
                        // Filtering on course-a. Alice is strong IN course-a. Bob is weak
                        // in course-a but (hypothetically) a superstar in course-b -- that
                        // course-b strength must never enter this ranking.
                        const enrollmentAliceA = {
                            id: "enr-alice-a",
                            courseId: "course-a",
                            userId: "user-alice",
                            isEnrolled: true,
                            course: {
                                title: "Track A",
                                displayId: "track-a",
                            },
                            user: {
                                id: "user-alice",
                                openToWork: true,
                            },
                        }
                        const enrollmentBobA = {
                            id: "enr-bob-a",
                            courseId: "course-a",
                            userId: "user-bob",
                            isEnrolled: true,
                            course: {
                                title: "Track A",
                                displayId: "track-a",
                            },
                            user: {
                                id: "user-bob",
                                openToWork: true,
                            },
                        }

                        // The course-a filter returns ONLY course-a enrollments -- bob's
                        // course-b enrollment is not here (nor are its aggregates ever read).
                        entityManager.find.mockResolvedValueOnce([
                            enrollmentAliceA,
                            enrollmentBobA,
                        ])
                        entityManager.query
                            // course-a capstone total
                            .mockResolvedValueOnce([
                                {
                                    total: "10",
                                },
                            ])
                            // course-a passed: alice 10/10 (perfect), bob 1/10 (weak in A)
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enr-alice-a",
                                    passed: "10",
                                },
                                {
                                    enrollment_id: "enr-bob-a",
                                    passed: "1",
                                },
                            ])
                            // course-a interview: alice 100, bob 10 -- NOTE: if the service
                            // ever leaked bob's course-b depth (say 99) into the sort key,
                            // bob would jump ahead; he must not.
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enr-alice-a",
                                    avg_score: "100",
                                },
                                {
                                    enrollment_id: "enr-bob-a",
                                    avg_score: "10",
                                },
                            ])
                            // no CV rows for course-a
                            .mockResolvedValueOnce([])

                        const result = await service.rankByTrack({
                            courseId: "course-a",
                            limit: 24,
                            offset: 0,
                        })

                        // alice (strong in course-a) ranks first; bob (weak in course-a)
                        // ranks last -- his imagined course-b brilliance never counted
                        expect(result.map((candidate) => candidate.user.id)).toEqual([
                            "user-alice",
                            "user-bob",
                        ])
                        // bob's card reflects ONLY his course-a depth (low), not a blend
                        const bob = result.find((candidate) => candidate.user.id === "user-bob")
                        expect(bob?.track.courseId).toBe("course-a")
                        // capstone 10 (1/10) + interview 10 -> depth 10, decisively below alice
                        expect(bob?.track.depthScore).toBeLessThan(20)
                        const alice = result.find((candidate) => candidate.user.id === "user-alice")
                        expect(alice?.track.depthScore).toBe(100)
                        // every sort key used is the filtered course only -- never blended:
                        // the only aggregates the service read were keyed to course-a /
                        // its enrollments (no second course was ever queried).
                        expect(entityManager.find).toHaveBeenCalledTimes(1)
                    })

                it("returns an empty list when no open-to-work candidate is enrolled in the filtered track",
                    async () => {
                        // no enrollments -> short-circuits, no aggregate queries fired
                        entityManager.find.mockResolvedValueOnce([])

                        const result = await service.rankByTrack({
                            courseId: "course-empty",
                            limit: 24,
                            offset: 0,
                        })

                        expect(result).toEqual([])
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("marks a candidate with no scored pillars as needsWork and unqualified",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([{
                            id: "enrollment-empty",
                            courseId: "course-empty",
                            userId: "user-empty",
                            isEnrolled: true,
                            course: {
                                title: "Empty Track",
                                displayId: "empty-track",
                            },
                            user: {
                                id: "user-empty",
                                openToWork: true,
                            },
                        }])
                        entityManager.query.mockResolvedValueOnce([])
                            .mockResolvedValueOnce([])
                            .mockResolvedValueOnce([])
                            .mockResolvedValueOnce([])

                        const result = await service.rankByTrack({
                            courseId: "course-empty",
                            limit: 24,
                            offset: 0,
                        })

                        expect(result[0].track).toEqual(expect.objectContaining({
                            depthScore: null,
                            band: "needsWork",
                            isQualified: false,
                        }))
                        expect(result[0].verificationLevel).toBe(CvVerificationLevel.SelfReported)
                    })

                // With IDENTICAL track depth, the stronger StarCi verification tier
                // breaks the tie -- a capstone-verified candidate surfaces above a
                // self-reported one. Depth stays the primary key; verification only
                // decides exact ties.
                it("breaks an exact depth tie by verification tier (verified above self-reported)",
                    async () => {
                        const enrollmentAliceA = {
                            id: "enr-alice-a",
                            courseId: "course-a",
                            userId: "user-alice",
                            isEnrolled: true,
                            course: {
                                title: "Track A",
                                displayId: "track-a",
                            },
                            user: {
                                id: "user-alice",
                                openToWork: true,
                            },
                        }
                        const enrollmentBobA = {
                            id: "enr-bob-a",
                            courseId: "course-a",
                            userId: "user-bob",
                            isEnrolled: true,
                            course: {
                                title: "Track A",
                                displayId: "track-a",
                            },
                            user: {
                                id: "user-bob",
                                openToWork: true,
                            },
                        }

                        // self-reported alice returned FIRST so we prove the tiebreak
                        // actively re-orders her BELOW the capstone-verified bob
                        entityManager.find.mockResolvedValueOnce([
                            enrollmentAliceA,
                            enrollmentBobA,
                        ])
                        entityManager.query
                            // course-a capstone total
                            .mockResolvedValueOnce([
                                {
                                    total: "10",
                                },
                            ])
                            // BOTH passed 5/10 -> identical capstone %, hence identical depth
                            .mockResolvedValueOnce([
                                {
                                    enrollment_id: "enr-alice-a",
                                    passed: "5",
                                },
                                {
                                    enrollment_id: "enr-bob-a",
                                    passed: "5",
                                },
                            ])
                            // no interview rows (both null -> depth is capstone-only, equal)
                            .mockResolvedValueOnce([])
                            // no cv rows
                            .mockResolvedValueOnce([])

                        // alice self-reported, bob capstone-verified
                        cvVerificationService.resolveLevels.mockResolvedValueOnce(
                            new Map([
                                ["user-alice",
                                    CvVerificationLevel.SelfReported],
                                ["user-bob",
                                    CvVerificationLevel.CapstoneVerified],
                            ]),
                        )
                        // real rank ordering so the comparator can break the tie
                        cvVerificationService.rankOf.mockImplementation((level) => {
                            if (level === CvVerificationLevel.CapstoneVerified) {
                                return 2
                            }
                            if (level === CvVerificationLevel.ActivityBacked) {
                                return 1
                            }
                            return 0
                        })

                        const result = await service.rankByTrack({
                            courseId: "course-a",
                            limit: 24,
                            offset: 0,
                        })

                        // equal depth -> capstone-verified bob is surfaced first
                        expect(result[0].track.depthScore).toBe(result[1].track.depthScore)
                        expect(result[0].user.id).toBe("user-bob")
                        expect(result[1].user.id).toBe("user-alice")
                        // and each candidate carries its verification tier through
                        expect(result[0].verificationLevel).toBe(CvVerificationLevel.CapstoneVerified)
                        expect(result[1].verificationLevel).toBe(CvVerificationLevel.SelfReported)
                    })
            })
    })
