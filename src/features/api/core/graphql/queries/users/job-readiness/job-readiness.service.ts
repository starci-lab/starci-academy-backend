import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserCVSubmissionAttemptEntity,
} from "@modules/databases"
import {
    UserSolvedChallengesProjectionService,
} from "@modules/bussiness"
import {
    JOB_READINESS_BASE_TRACK_WEIGHT,
    JOB_READINESS_BREADTH_BONUS_CAP,
    JOB_READINESS_BREADTH_BONUS_PER_TRACK,
    JOB_READINESS_BUILDING_THRESHOLD,
    JOB_READINESS_FOUNDATION_WEIGHT,
    JOB_READINESS_JOB_READY_THRESHOLD,
    JOB_READINESS_QUALIFIED_TRACK_MIN_DEPTH,
    JOB_READINESS_TRACK_CAPSTONE_WEIGHT,
    JOB_READINESS_TRACK_INTERVIEW_WEIGHT,
} from "./constants"
import type {
    CapstonePassedRow,
    CapstoneTotalRow,
    ComputeJobReadinessParams,
    InterviewAvgRow,
    JobReadinessBand,
    JobReadinessResult,
    JobReadinessTrack,
} from "./types"

/**
 * Composes a learner's job-readiness as a PORTFOLIO of verified tracks — never a
 * single blended average. Every input is a signal StarCi already tracks +
 * AI-grades (the credibility moat vs self-reported skills):
 * - **Per track (one per paid enrollment)** — capstone completion % + average
 *   mock-interview score → the course's domain competency "depth".
 * - **Global foundation** — latest CV-review score + cross-course
 *   challenge-strength percentile (a learner has ONE of each regardless of how
 *   many courses they take).
 *
 * The composite lets the STRONGEST track lead (so one course already yields a
 * valid, strong profile), adds a bounded breadth bonus per extra qualified
 * track (so N courses always beat N−1, never diluted), and blends in the global
 * foundation. Keyed purely by `userId`, so it serves both the viewer's own
 * profile and a recruiter viewing someone else's.
 */
@Injectable()
export class JobReadinessService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userSolvedChallengesProjectionService: UserSolvedChallengesProjectionService,
    ) {}

    /**
     * Computes the composite job-readiness + per-track + foundation breakdown for
     * one learner across ALL their paid enrollments.
     *
     * @param params - {@link ComputeJobReadinessParams}
     * @returns the composite, band, tracks (strongest depth first), and foundation.
     *
     * @example
     * await service.compute({ userId })
     */
    async compute(
        {
            userId,
        }: ComputeJobReadinessParams,
    ): Promise<JobReadinessResult> {
        // build the per-course tracks + read the two global foundation signals
        // concurrently (independent reads)
        const [
            tracks,
            cvScore,
            challengeScore,
        ] = await Promise.all([
            this.buildTracks(userId),
            this.computeCvScore(userId),
            this.computeChallengeScore(userId),
        ])

        // strongest track leads the composite; a nascent (below-floor) track still
        // shows on the profile but earns no breadth bonus
        const bestTrackDepth = tracks.reduce(
            (best, track) => Math.max(best,
                track.depthScore),
            0,
        )
        const qualifiedTrackCount = tracks.filter(
            (track) => track.depthScore >= JOB_READINESS_QUALIFIED_TRACK_MIN_DEPTH,
        ).length
        const breadthBonus = Math.min(
            JOB_READINESS_BREADTH_BONUS_CAP,
            Math.max(0,
                qualifiedTrackCount - 1) * JOB_READINESS_BREADTH_BONUS_PER_TRACK,
        )
        // foundation blends the two global signals (missing = 0 — encourages doing them)
        const foundation = ((cvScore ?? 0) + (challengeScore ?? 0)) / 2

        const compositeScore = Math.min(
            100,
            Math.max(
                0,
                Math.round(
                    bestTrackDepth * JOB_READINESS_BASE_TRACK_WEIGHT
                    + foundation * JOB_READINESS_FOUNDATION_WEIGHT
                    + breadthBonus,
                ),
            ),
        )

        return {
            compositeScore,
            band: this.bandOf(compositeScore),
            cvScore,
            challengeScore,
            // strongest track first — the recruiter's headline domain
            tracks: [...tracks].sort((prev, next) => next.depthScore - prev.depthScore),
        }
    }

    /**
     * Builds one {@link JobReadinessTrack} per PAID enrollment (trial enrollments
     * don't earn a hireable track), folding in capstone completion % + average
     * mock-interview score for each.
     *
     * @param userId - the learner.
     * @returns the learner's tracks (unsorted).
     */
    private async buildTracks(userId: string): Promise<Array<JobReadinessTrack>> {
        // paid enrollments only (is_enrolled = true) — a track is proof you paid
        // for + worked through a course, not a trial preview
        const enrollments = await this.entityManager.find(
            EnrollmentEntity,
            {
                where: {
                    userId,
                    isEnrolled: true,
                },
                relations: {
                    course: true,
                },
            },
        )
        if (enrollments.length === 0) {
            return []
        }

        const courseIds = enrollments.map((enrollment) => enrollment.courseId)
        const enrollmentIds = enrollments.map((enrollment) => enrollment.id)

        // three grouped aggregates (bounded to this learner's courses/enrollments)
        const [
            capstoneTotals,
            capstonePassed,
            interviewAverages,
        ] = await Promise.all([
            this.loadCapstoneTotals(courseIds),
            this.loadCapstonePassed(enrollmentIds),
            this.loadInterviewAverages(enrollmentIds),
        ])

        // index the aggregates for O(1) assembly
        const totalByCourse = new Map(
            capstoneTotals.map((row) => [row.course_id,
                Number(row.total)]),
        )
        const passedByEnrollment = new Map(
            capstonePassed.map((row) => [row.enrollment_id,
                Number(row.passed)]),
        )
        const interviewByEnrollment = new Map(
            interviewAverages.map((row) => [row.enrollment_id,
                Number(row.avg_score)]),
        )

        return enrollments.map((enrollment) => {
            const totalTasks = totalByCourse.get(enrollment.courseId) ?? 0
            const passedTasks = passedByEnrollment.get(enrollment.id) ?? 0
            // null when the course has no capstone tasks at all (vs a genuine 0%)
            const capstoneScore = totalTasks > 0
                ? Math.round((passedTasks / totalTasks) * 100)
                : null
            const interviewRaw = interviewByEnrollment.get(enrollment.id)
            const interviewScore = interviewRaw === undefined ? null : Math.round(interviewRaw)
            // depth = weighted(capstone, interview), each missing pillar counted as 0
            const depthScore = Math.round(
                (capstoneScore ?? 0) * JOB_READINESS_TRACK_CAPSTONE_WEIGHT
                + (interviewScore ?? 0) * JOB_READINESS_TRACK_INTERVIEW_WEIGHT,
            )
            return {
                courseId: enrollment.courseId,
                courseTitle: enrollment.course.title,
                courseSlug: enrollment.course.displayId,
                capstoneScore,
                interviewScore,
                depthScore,
            }
        })
    }

    /**
     * Total capstone (milestone) tasks per course — the denominator of capstone %.
     *
     * @param courseIds - the learner's enrolled course ids.
     * @returns one row per course with a task count.
     */
    private async loadCapstoneTotals(courseIds: Array<string>): Promise<Array<CapstoneTotalRow>> {
        return this.entityManager.query<Array<CapstoneTotalRow>>(
            `
            SELECT m.course_id AS course_id, COUNT(mt.id) AS total
            FROM milestone_tasks mt
            JOIN milestones m ON m.id = mt.milestone_id
            WHERE m.course_id = ANY($1)
            GROUP BY m.course_id
            `,
            [
                courseIds,
            ],
        )
    }

    /**
     * Distinct passed capstone tasks per enrollment — the numerator of capstone %.
     *
     * @param enrollmentIds - the learner's enrollment ids.
     * @returns one row per enrollment with a passed-task count.
     */
    private async loadCapstonePassed(enrollmentIds: Array<string>): Promise<Array<CapstonePassedRow>> {
        return this.entityManager.query<Array<CapstonePassedRow>>(
            `
            SELECT umt.enrollment_id AS enrollment_id,
                   COUNT(DISTINCT umt.milestone_task_id) AS passed
            FROM user_milestone_tasks umt
            JOIN user_milestone_task_attempts umta ON umta.user_milestone_task_id = umt.id
            WHERE umt.enrollment_id = ANY($1) AND umta.passed = true
            GROUP BY umt.enrollment_id
            `,
            [
                enrollmentIds,
            ],
        )
    }

    /**
     * Average mock-interview overall score per enrollment.
     *
     * @param enrollmentIds - the learner's enrollment ids.
     * @returns one row per enrollment with an average score.
     */
    private async loadInterviewAverages(enrollmentIds: Array<string>): Promise<Array<InterviewAvgRow>> {
        return this.entityManager.query<Array<InterviewAvgRow>>(
            `
            SELECT enrollment_id AS enrollment_id, AVG(overall_score) AS avg_score
            FROM mock_interview_attempts
            WHERE enrollment_id = ANY($1)
            GROUP BY enrollment_id
            `,
            [
                enrollmentIds,
            ],
        )
    }

    /**
     * Latest CV-review score across all of the learner's CV submissions (global).
     *
     * @param userId - the learner.
     * @returns 0–100, or null if no CV attempt has been scored yet.
     */
    private async computeCvScore(userId: string): Promise<number | null> {
        const latestAttempt = await this.entityManager.findOne(
            UserCVSubmissionAttemptEntity,
            {
                where: {
                    cvSubmission: {
                        userId,
                    },
                },
                order: {
                    createdAt: "DESC",
                },
            },
        )
        return latestAttempt?.score ?? null
    }

    /**
     * Derived challenge-strength percentile (global) — passthrough to the
     * already-materialised per-user projection.
     *
     * @param userId - the learner.
     * @returns 0–100 percentile, or null if no passed challenges.
     */
    private async computeChallengeScore(userId: string): Promise<number | null> {
        const strength = await this.userSolvedChallengesProjectionService.getChallengeStrength(userId)
        return strength.percentile
    }

    /**
     * Maps a composite score to its coarse readiness band.
     *
     * @param compositeScore - 0–100.
     * @returns the band.
     */
    private bandOf(compositeScore: number): JobReadinessBand {
        if (compositeScore >= JOB_READINESS_JOB_READY_THRESHOLD) {
            return "jobReady"
        }
        if (compositeScore >= JOB_READINESS_BUILDING_THRESHOLD) {
            return "building"
        }
        return "needsWork"
    }
}
