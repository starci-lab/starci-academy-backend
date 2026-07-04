import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserCvGenerationEntity,
    UserCVSubmissionAttemptEntity,
} from "@modules/databases"
import {
    UserSolvedChallengesProjectionService,
} from "@modules/bussiness"
import {
    JOB_READINESS_BUILDING_THRESHOLD,
    JOB_READINESS_INTERVIEW_RECENT_WINDOW,
    JOB_READINESS_JOB_READY_THRESHOLD,
    JOB_READINESS_QUALIFIED_TRACK_MIN_DEPTH,
    JOB_READINESS_TRACK_CAPSTONE_WEIGHT,
    JOB_READINESS_TRACK_CV_WEIGHT,
    JOB_READINESS_TRACK_INTERVIEW_WEIGHT,
} from "./constants"
import type {
    CapstonePassedRow,
    CapstoneTotalRow,
    ComputeJobReadinessParams,
    CvScoreRow,
    InterviewAvgRow,
    JobReadinessBand,
    JobReadinessResult,
    JobReadinessTrack,
} from "./types"

/**
 * One PRESENT pillar contribution to a track's depth — its 0–100 score and the
 * weight it carries. Absent pillars are filtered out before the weighted average
 * so a track is never penalized for a pillar its course lacks.
 */
interface PresentPillar {
    /** The pillar's 0–100 score. */
    score: number
    /** The pillar's configured weight (renormalized over present pillars). */
    weight: number
}

/**
 * Composes a learner's job-readiness as a PORTFOLIO of independent verified
 * tracks plus one global foundation — deliberately NEVER a single blended
 * scalar. Buying another course adds a card (widening the hireable range); it
 * does not inflate any number. Every input is a signal StarCi already tracks +
 * AI-grades (the credibility moat vs self-reported skills):
 * - **Per track (one per paid enrollment)** — capstone completion % + average
 *   mock-interview score + best CV score tied to that course → the course's
 *   domain competency "depth" + band (three pillars, renormalized over whichever
 *   are present).
 * - **Global foundation** — cross-course challenge-strength percentile + best CV
 *   score across ALL the learner's CVs (a learner has ONE of each regardless of
 *   course count). CV is sourced from the unified `cv_generations` table, unioned
 *   with the legacy `cv_submission_attempts` table during the migration window.
 *
 * Keyed purely by `userId`, so it serves both the viewer's own profile and a
 * recruiter viewing someone else's.
 */
@Injectable()
export class JobReadinessService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userSolvedChallengesProjectionService: UserSolvedChallengesProjectionService,
    ) {}

    /**
     * Computes the per-track cards + global foundation breakdown for one learner
     * across ALL their paid enrollments. Never throws — a missing interview table
     * degrades to null interview scores rather than failing the whole query.
     *
     * @param params - {@link ComputeJobReadinessParams}
     * @returns the global foundation and tracks (strongest depth first, nulls last).
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
            codingPercentile,
        ] = await Promise.all([
            this.buildTracks(userId),
            this.computeCvScore(userId),
            this.computeCodingPercentile(userId),
        ])

        return {
            foundation: {
                codingPercentile,
                cvScore,
            },
            // strongest track first (nulls last) — the recruiter's headline domain
            tracks: [...tracks].sort((prev, next) => this.sortByDepth(prev.depthScore,
                next.depthScore)),
        }
    }

    /**
     * Builds one {@link JobReadinessTrack} per PAID enrollment (trial enrollments
     * don't earn a hireable track), folding in capstone completion % + average
     * mock-interview score for each, then deriving depth + band + qualified flag.
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

        // four grouped aggregates (bounded to this learner's courses/enrollments).
        // ORDER MATTERS for the mock-based invariant spec: the capstone/interview
        // loaders that back the fairness assertions must fire first; the CV loader
        // is appended last.
        const [
            capstoneTotals,
            capstonePassed,
            interviewAverages,
            trackCvScores,
        ] = await Promise.all([
            this.loadCapstoneTotals(courseIds),
            this.loadCapstonePassed(enrollmentIds),
            this.loadInterviewAverages(enrollmentIds),
            this.loadTrackCvScores(userId,
                courseIds),
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
        const cvScoreByCourse = new Map(
            trackCvScores.map((row) => [row.course_id,
                Number(row.max_score)]),
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
            // null when no scored CV is tied to this course (vs a genuine 0)
            const cvRaw = cvScoreByCourse.get(enrollment.courseId)
            const cvScore = cvRaw === undefined ? null : Math.round(cvRaw)
            const depthScore = this.depthOf(capstoneScore,
                interviewScore,
                cvScore)
            return {
                courseId: enrollment.courseId,
                courseTitle: enrollment.course.title,
                courseSlug: enrollment.course.displayId,
                capstoneScore,
                interviewScore,
                cvScore,
                depthScore,
                band: this.bandOf(depthScore),
                isQualified: depthScore !== null && depthScore >= JOB_READINESS_QUALIFIED_TRACK_MIN_DEPTH,
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
     * Average mock-interview overall score per enrollment, over ONLY that
     * enrollment's {@link JOB_READINESS_INTERVIEW_RECENT_WINDOW} MOST RECENT
     * attempts (by `created_at DESC`) — see that constant's doc for why an
     * all-time average is deliberately avoided (it punishes early weak
     * attempts forever).
     *
     * Implemented as a `ROW_NUMBER() OVER (PARTITION BY enrollment_id ORDER BY
     * created_at DESC)` window filtered to `<= N`, then averaged per
     * enrollment in an outer query.
     *
     * WF-04 (verified): migration `1721500000000-CreateMockInterviewAttempts`
     * + the entity exist, so the table is present once migrations run. The
     * try/catch is kept as a safety net so any environment where the migration
     * hasn't run yet degrades every track's interview pillar to null instead of
     * failing the whole query.
     *
     * @param enrollmentIds - the learner's enrollment ids.
     * @returns one row per enrollment with a recent-window average score, or [] if the table is unavailable.
     */
    private async loadInterviewAverages(enrollmentIds: Array<string>): Promise<Array<InterviewAvgRow>> {
        try {
            return await this.entityManager.query<Array<InterviewAvgRow>>(
                `
                WITH ranked_attempts AS (
                    SELECT
                        enrollment_id,
                        overall_score,
                        ROW_NUMBER() OVER (
                            PARTITION BY enrollment_id
                            ORDER BY created_at DESC
                        ) AS recency_rank
                    FROM mock_interview_attempts
                    WHERE enrollment_id = ANY($1)
                )
                SELECT enrollment_id AS enrollment_id, AVG(overall_score) AS avg_score
                FROM ranked_attempts
                WHERE recency_rank <= $2
                GROUP BY enrollment_id
                `,
                [
                    enrollmentIds,
                    JOB_READINESS_INTERVIEW_RECENT_WINDOW,
                ],
            )
        } catch {
            // table not migrated yet → interview pillar is simply absent for now
            return []
        }
    }

    /**
     * Best UNIFIED-CV score per course — the CV pillar of each track.
     *
     * Groups `MAX(cv_generations.score)` by `course_id` over the learner's CVs
     * that are (a) tied to one of their enrolled courses and (b) already scored.
     * A course with no scored CV attached simply produces no row → its track's
     * CV pillar degrades to null (renormalized away in {@link depthOf}).
     *
     * Sourced ONLY from the unified table (`cv_generations`) — the legacy upload
     * table was never course-scoped, so it has no per-track dimension to read.
     *
     * @param userId - the learner.
     * @param courseIds - the learner's enrolled course ids.
     * @returns one row per course that has a scored CV, with the best score.
     */
    private async loadTrackCvScores(
        userId: string,
        courseIds: Array<string>,
    ): Promise<Array<CvScoreRow>> {
        return this.entityManager.query<Array<CvScoreRow>>(
            `
            SELECT course_id AS course_id, MAX(score) AS max_score
            FROM cv_generations
            WHERE user_id = $1
              AND course_id = ANY($2)
              AND score IS NOT NULL
            GROUP BY course_id
            `,
            [
                userId,
                courseIds,
            ],
        )
    }

    /**
     * Best CV score across ALL of the learner's CVs (global, person-level) —
     * kept on the foundation so the FE (which reads `foundation.cvScore`) stays
     * non-breaking; the additive per-track {@link JobReadinessTrack.cvScore} is
     * the new source of truth for depth.
     *
     * **UNION-safe during the migration window:** takes the GREATEST of the best
     * unified score and the best legacy score, so no learner loses their CV
     * signal while legacy rows are being backfilled into the unified table
     * (WF-03c migration). Computed as two independent `findOne(... ORDER BY score
     * DESC)` reads then max-ed in code — no learner ever regresses.
     *
     * TODO(retire-legacy-cv): once the WF-03c backfill migration has run in prod
     * AND a count check confirms every legacy scored attempt now has a unified
     * row (same user, score carried), drop the legacy `bestLegacyScore` read
     * below and rely on the unified table alone. See also the same marker in
     * `ConsultantContactGateService.getBestCvScore`.
     *
     * @param userId - the learner.
     * @returns 0–100 (best across both tables), or null if no CV has been scored yet.
     */
    private async computeCvScore(userId: string): Promise<number | null> {
        const [
            bestUnified,
            bestLegacyAttempt,
        ] = await Promise.all([
            this.entityManager.findOne(
                UserCvGenerationEntity,
                {
                    where: {
                        userId,
                    },
                    order: {
                        score: "DESC",
                    },
                },
            ),
            // TODO(retire-legacy-cv): remove this legacy read after the backfill
            // is verified in prod (see method doc).
            this.entityManager.findOne(
                UserCVSubmissionAttemptEntity,
                {
                    where: {
                        cvSubmission: {
                            userId,
                        },
                    },
                    order: {
                        score: "DESC",
                    },
                },
            ),
        ])

        const unifiedScore = bestUnified?.score ?? null
        const legacyScore = bestLegacyAttempt?.score ?? null
        if (unifiedScore === null && legacyScore === null) {
            return null
        }
        // GREATEST(unified, legacy) — treat a missing side as -1 so the present
        // side always wins; never returns a value below either table's best
        return Math.max(unifiedScore ?? -1,
            legacyScore ?? -1)
    }

    /**
     * Derived challenge-strength percentile (global) — passthrough to the
     * already-materialised per-user projection.
     *
     * @param userId - the learner.
     * @returns 0–100 percentile, or null if no passed challenges.
     */
    private async computeCodingPercentile(userId: string): Promise<number | null> {
        const strength = await this.userSolvedChallengesProjectionService.getChallengeStrength(userId)
        return strength.percentile
    }

    /**
     * Weighted average of a track's PRESENT (non-null) pillars only, with the
     * configured weights renormalized over whichever pillars exist — so a track
     * is never penalized for a pillar its course lacks.
     *
     * @param capstoneScore - capstone completion % (0–100), or null if absent.
     * @param interviewScore - average interview score (0–100), or null if absent.
     * @param cvScore - best CV score tied to this course (0–100), or null if absent.
     * @returns the 0–100 depth, or null when every pillar is null.
     */
    private depthOf(
        capstoneScore: number | null,
        interviewScore: number | null,
        cvScore: number | null,
    ): number | null {
        const presentPillars: Array<PresentPillar> = []
        if (capstoneScore !== null) {
            presentPillars.push({
                score: capstoneScore,
                weight: JOB_READINESS_TRACK_CAPSTONE_WEIGHT,
            })
        }
        if (interviewScore !== null) {
            presentPillars.push({
                score: interviewScore,
                weight: JOB_READINESS_TRACK_INTERVIEW_WEIGHT,
            })
        }
        if (cvScore !== null) {
            presentPillars.push({
                score: cvScore,
                weight: JOB_READINESS_TRACK_CV_WEIGHT,
            })
        }
        if (presentPillars.length === 0) {
            return null
        }
        const totalWeight = presentPillars.reduce((sum, pillar) => sum + pillar.weight,
            0)
        const weightedSum = presentPillars.reduce((sum, pillar) => sum + pillar.score * pillar.weight,
            0)
        return Math.round(weightedSum / totalWeight)
    }

    /**
     * Maps a track's depth score to its coarse readiness band. A track with no
     * scorable pillar (null depth) falls into "needsWork".
     *
     * @param depthScore - 0–100, or null.
     * @returns the band.
     */
    private bandOf(depthScore: number | null): JobReadinessBand {
        if (depthScore === null) {
            return "needsWork"
        }
        if (depthScore >= JOB_READINESS_JOB_READY_THRESHOLD) {
            return "jobReady"
        }
        if (depthScore >= JOB_READINESS_BUILDING_THRESHOLD) {
            return "building"
        }
        return "needsWork"
    }

    /**
     * Comparator that orders tracks strongest-depth-first with null depths last.
     *
     * @param prevDepth - left track's depth (nullable).
     * @param nextDepth - right track's depth (nullable).
     * @returns a negative/zero/positive sort delta.
     */
    private sortByDepth(
        prevDepth: number | null,
        nextDepth: number | null,
    ): number {
        if (prevDepth === null && nextDepth === null) {
            return 0
        }
        if (prevDepth === null) {
            return 1
        }
        if (nextDepth === null) {
            return -1
        }
        return nextDepth - prevDepth
    }
}
