import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    JOB_READINESS_BUILDING_THRESHOLD,
    JOB_READINESS_INTERVIEW_RECENT_WINDOW,
    JOB_READINESS_JOB_READY_THRESHOLD,
    JOB_READINESS_QUALIFIED_TRACK_MIN_DEPTH,
    JOB_READINESS_TRACK_CAPSTONE_WEIGHT,
    JOB_READINESS_TRACK_CV_WEIGHT,
    JOB_READINESS_TRACK_INTERVIEW_WEIGHT,
} from "../job-readiness/constants"
import type {
    JobReadinessBand,
} from "../job-readiness/types"
import type {
    CandidateCapstonePassedRow,
    CandidateCvScoreRow,
    CandidateInterviewAvgRow,
    CourseCapstoneTotalRow,
    RankTalentCandidatesByTrackParams,
    TalentCandidate,
} from "./types"

/**
 * One PRESENT pillar contribution to a track's depth — its 0–100 score and the
 * weight it carries. Absent pillars are filtered out before the weighted average
 * so a track is never penalized for a pillar its course lacks. Mirrors the same
 * concept in `JobReadinessService`; kept local so this service never imports that
 * file's private calculation methods (only the shared public weight constants).
 */
interface PresentPillar {
    /** The pillar's 0–100 score. */
    score: number
    /** The pillar's configured weight (renormalized over present pillars). */
    weight: number
}

/**
 * Recruiter-marketplace ranking service. Given ONE track (a `courseId`), it
 * loads every open-to-work candidate PAID-enrolled in that course, computes each
 * candidate's readiness depth for THAT COURSE ALONE (same three pillars +
 * weights as a `JobReadinessService` track), and ranks them by that single
 * track's `depthScore` DESC.
 *
 * FAIRNESS INVARIANT (WF-01/WF-02): ranking is scoped to the filtered track's
 * depth ONLY. This service NEVER sums, averages, or otherwise blends a
 * candidate's depth across their OTHER courses into the sort key — a candidate
 * with a monster depth in some unrelated track gains nothing here. It reuses the
 * shared depth/band CONSTANTS (not the private methods) of
 * `JobReadinessService`, so the per-track math stays single-sourced.
 */
@Injectable()
export class TalentCandidatesService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Ranks open-to-work candidates for a single track by that track's depth.
     *
     * @param params - {@link RankTalentCandidatesByTrackParams}
     * @returns candidates for the filtered course, ordered by that course's depthScore DESC (nulls last), paginated.
     *
     * @example
     * await service.rankByTrack({ courseId, limit: 24, offset: 0 })
     */
    async rankByTrack(
        {
            courseId,
            limit,
            offset,
        }: RankTalentCandidatesByTrackParams,
    ): Promise<Array<TalentCandidate>> {
        // every open-to-work, non-deleted user PAID-enrolled in this ONE course.
        // a track is proof you paid for + worked through a course (not a trial),
        // matching JobReadinessService.buildTracks.
        const enrollments = await this.entityManager.find(
            EnrollmentEntity,
            {
                where: {
                    courseId,
                    isEnrolled: true,
                    user: {
                        openToWork: true,
                        isDeleted: false,
                    },
                },
                relations: {
                    course: true,
                    user: true,
                },
            },
        )
        if (enrollments.length === 0) {
            return []
        }

        const enrollmentIds = enrollments.map((enrollment) => enrollment.id)
        const userIds = enrollments.map((enrollment) => enrollment.userId)

        // batch the three course-scoped pillar aggregates for the candidate set.
        // capstone total is a single per-course denominator shared by everyone.
        const [
            capstoneTotalRows,
            capstonePassedRows,
            interviewAverageRows,
            cvScoreRows,
        ] = await Promise.all([
            this.loadCourseCapstoneTotal(courseId),
            this.loadCandidateCapstonePassed(enrollmentIds),
            this.loadCandidateInterviewAverages(enrollmentIds),
            this.loadCandidateCvScores(courseId,
                userIds),
        ])

        // one shared denominator for the whole course (null when it has no capstone tasks)
        const totalTasks = capstoneTotalRows.length > 0 ? Number(capstoneTotalRows[0].total) : 0
        // index the per-candidate aggregates for O(1) assembly
        const passedByEnrollment = new Map(
            capstonePassedRows.map((row) => [row.enrollment_id,
                Number(row.passed)]),
        )
        const interviewByEnrollment = new Map(
            interviewAverageRows.map((row) => [row.enrollment_id,
                Number(row.avg_score)]),
        )
        const cvScoreByUser = new Map(
            cvScoreRows.map((row) => [row.user_id,
                Number(row.max_score)]),
        )

        const candidates: Array<TalentCandidate> = enrollments.map((enrollment) => {
            const passedTasks = passedByEnrollment.get(enrollment.id) ?? 0
            // null when the course has no capstone tasks at all (vs a genuine 0%)
            const capstoneScore = totalTasks > 0
                ? Math.round((passedTasks / totalTasks) * 100)
                : null
            const interviewRaw = interviewByEnrollment.get(enrollment.id)
            const interviewScore = interviewRaw === undefined ? null : Math.round(interviewRaw)
            // null when no scored CV is tied to this course (vs a genuine 0)
            const cvRaw = cvScoreByUser.get(enrollment.userId)
            const cvScore = cvRaw === undefined ? null : Math.round(cvRaw)
            const depthScore = this.depthOf(capstoneScore,
                interviewScore,
                cvScore)
            return {
                user: enrollment.user,
                track: {
                    courseId: enrollment.courseId,
                    courseTitle: enrollment.course.title,
                    courseSlug: enrollment.course.displayId,
                    capstoneScore,
                    interviewScore,
                    cvScore,
                    depthScore,
                    band: this.bandOf(depthScore),
                    isQualified: depthScore !== null && depthScore >= JOB_READINESS_QUALIFIED_TRACK_MIN_DEPTH,
                },
            }
        })

        // RANK strictly by THIS track's depth (nulls last) — never a cross-track
        // blend. Then paginate the sorted list.
        return candidates
            .sort((prev, next) => this.sortByDepth(prev.track.depthScore,
                next.track.depthScore))
            .slice(offset,
                offset + limit)
    }

    /**
     * Total capstone (milestone) tasks for the single filtered course — the
     * shared denominator of every candidate's capstone %.
     *
     * @param courseId - the filtered course id.
     * @returns a single-row aggregate (empty when the course has no capstone tasks).
     */
    private async loadCourseCapstoneTotal(courseId: string): Promise<Array<CourseCapstoneTotalRow>> {
        return this.entityManager.query<Array<CourseCapstoneTotalRow>>(
            `
            SELECT COUNT(mt.id) AS total
            FROM milestone_tasks mt
            JOIN milestones m ON m.id = mt.milestone_id
            WHERE m.course_id = $1
            HAVING COUNT(mt.id) > 0
            `,
            [
                courseId,
            ],
        )
    }

    /**
     * Distinct passed capstone tasks per candidate enrollment — the numerator of
     * each candidate's capstone %.
     *
     * @param enrollmentIds - the candidate batch's enrollment ids.
     * @returns one row per enrollment with a passed-task count.
     */
    private async loadCandidateCapstonePassed(enrollmentIds: Array<string>): Promise<Array<CandidateCapstonePassedRow>> {
        return this.entityManager.query<Array<CandidateCapstonePassedRow>>(
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
     * Recent-window average mock-interview score per candidate enrollment. Uses
     * the SAME recent-N window ({@link JOB_READINESS_INTERVIEW_RECENT_WINDOW}) as
     * the job-readiness track pillar — an all-time average is deliberately
     * avoided (it punishes early weak attempts forever; see that constant's doc).
     *
     * Wrapped in try/catch so an environment where the mock-interview table
     * hasn't been migrated yet degrades every candidate's interview pillar to
     * null instead of failing the whole query (mirrors `JobReadinessService`).
     *
     * @param enrollmentIds - the candidate batch's enrollment ids.
     * @returns one row per enrollment with a recent-window average score, or [] if the table is unavailable.
     */
    private async loadCandidateInterviewAverages(enrollmentIds: Array<string>): Promise<Array<CandidateInterviewAvgRow>> {
        try {
            return await this.entityManager.query<Array<CandidateInterviewAvgRow>>(
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
     * Best UNIFIED-CV score for the filtered course, per candidate — each
     * candidate's CV pillar for THIS track. Groups `MAX(cv_generations.score)` by
     * `user_id` over CVs tied to the filtered course. A candidate with no scored
     * CV for this course produces no row → their CV pillar degrades to null.
     *
     * @param courseId - the filtered course id.
     * @param userIds - the candidate batch's user ids.
     * @returns one row per user that has a scored CV for this course, with the best score.
     */
    private async loadCandidateCvScores(
        courseId: string,
        userIds: Array<string>,
    ): Promise<Array<CandidateCvScoreRow>> {
        return this.entityManager.query<Array<CandidateCvScoreRow>>(
            `
            SELECT user_id AS user_id, MAX(score) AS max_score
            FROM cv_generations
            WHERE course_id = $1
              AND user_id = ANY($2)
              AND score IS NOT NULL
            GROUP BY user_id
            `,
            [
                courseId,
                userIds,
            ],
        )
    }

    /**
     * Weighted average of a track's PRESENT (non-null) pillars only, with the
     * shared weights renormalized over whichever pillars exist. Identical math to
     * `JobReadinessService.depthOf`, kept local so this service depends only on
     * the shared public weight CONSTANTS, never that file's private methods.
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
     * scorable pillar (null depth) falls into "needsWork". Mirrors
     * `JobReadinessService.bandOf` using the shared threshold constants.
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
     * Comparator that orders candidates strongest-depth-first with null depths
     * last — WITHIN the single filtered track only.
     *
     * @param prevDepth - left candidate's track depth (nullable).
     * @param nextDepth - right candidate's track depth (nullable).
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
