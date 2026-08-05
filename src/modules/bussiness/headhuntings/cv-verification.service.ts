import {
    Injectable,
} from "@nestjs/common"
import {
    CvVerificationLevel,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"
import type {
    CvVerificationUserIdRow,
    ResolveCvVerificationLevelForCourseParams,
    ResolveCvVerificationLevelsParams,
} from "./types"

@Injectable()
/**
 * Classifies candidates into a {@link CvVerificationLevel} -- a recruiter TRUST
 * signal tied to REAL, graded StarCi work (never to payment or CV count). A
 * strong external developer who only uploaded a CV is `SelfReported`; graded
 * challenge work is `ActivityBacked`; a passed capstone is `CapstoneVerified`.
 *
 * Used by the recruiter marketplace ({@link import("../../../features/api/core/graphql/queries/users/talent-candidates/talent-candidates.service").TalentCandidatesService})
 * to badge candidates and break depth ties (verified above self-reported).
 * Deliberately does NOT touch the CV-score contact gate
 * ({@link import("./consultant-contact-gate.service").ConsultantContactGateService})
 * -- this is an additive trust tier, not a new access lock.
 */
export class CvVerificationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Classifies a BATCH of users into their verification level with two batched
     * existence probes (passed-capstone, graded-challenge). Batch-shaped so the
     * marketplace can classify a whole candidate page in two queries.
     *
     * @param params - {@link ResolveCvVerificationLevelsParams}
     * @returns a map of `userId -> level`; every requested user is present (defaults to `SelfReported`).
     *
     * @example
     * const levels = await service.resolveLevels({ userIds })
     * levels.get(userId) // CvVerificationLevel.CapstoneVerified
     */
    async resolveLevels(
        {
            userIds,
        }: ResolveCvVerificationLevelsParams,
    ): Promise<Map<string, CvVerificationLevel>> {
        // empty batch -> nothing to classify, skip the DB round-trips
        if (userIds.length === 0) {
            return new Map()
        }

        // two existence probes over the whole batch in parallel -- each returns
        // the DISTINCT set of user ids that HAVE that class of graded StarCi work
        const [
            capstoneRows,
            challengeRows,
        ] = await Promise.all([
            this.loadUsersWithPassedCapstone(userIds),
            this.loadUsersWithGradedChallenge(userIds),
        ])

        // index both sets for O(1) membership tests during classification
        const capstoneUserIds = new Set(capstoneRows.map((row) => row.user_id))
        const challengeUserIds = new Set(challengeRows.map((row) => row.user_id))

        // classify every REQUESTED user (not just the ones with a row) so callers
        // always get a level back -- absent from both sets means self-reported
        const levels = new Map<string, CvVerificationLevel>()
        userIds.forEach((userId) => {
            // a passed capstone/milestone task is the strongest proof of real project work
            if (capstoneUserIds.has(userId)) {
                levels.set(userId,
                    CvVerificationLevel.CapstoneVerified)
                return
            }
            // else any AI-graded challenge submission still proves hands-on StarCi work
            if (challengeUserIds.has(userId)) {
                levels.set(userId,
                    CvVerificationLevel.ActivityBacked)
                return
            }
            // no graded StarCi work at all -> the CV stands on self-reported claims only
            levels.set(userId,
                CvVerificationLevel.SelfReported)
        })
        return levels
    }

    /**
     * Convenience single-user classification (thin wrapper over
     * {@link resolveLevels}).
     *
     * @param userId - the user to classify.
     * @returns the user's verification level (defaults to `SelfReported`).
     */
    async resolveLevel(userId: string): Promise<CvVerificationLevel> {
        // reuse the batch path with a one-element batch so the SQL stays single-sourced
        const levels = await this.resolveLevels({
            userIds: [userId] 
        })
        // missing key can only happen for an empty input, which never reaches here
        return levels.get(userId) ?? CvVerificationLevel.SelfReported
    }

    /**
     * Deterministic "CV trust score" for a level -- REPLACES the old AI-judged
     * `cv_generations.score` rubric everywhere that number gated something
     * (recruiter contact, job-readiness). No AI, no CV prose involved: a pure
     * function of the existence-checked signal, so it is count-independent and
     * payment-independent by construction -- a learner with 1 enrollment who
     * passed a capstone scores identically to one with 5 enrollments who also
     * passed one, and nothing here can be inflated by writing more into a CV
     * (there is no CV text in this computation at all).
     *
     * CAPSTONE-ONLY SCORE (2026-07-05, teacher-approved). Only a passed
     * CAPSTONE (`CapstoneVerified`) produces a positive gating score. A merely
     * `ActivityBacked` learner (graded challenges but no capstone) scores 0
     * like `SelfReported`: challenges are practice exercises that never go on
     * the CV, so they must not silently unlock a recruiter's contact details
     * either -- "a recruiter trusts a real capstone project, not a pile of
     * graded exercises". The 3-level classification is still kept for the
     * marketplace tie-break ({@link rankOf}); it just no longer feeds the gate.
     *
     * CAUTION: the step value (100) and the downstream unlock threshold
     * ({@link import("./constants").CV_SCORE_UNLOCK_THRESHOLD}) are a
     * placeholder pending calibration -- deliberately NOT tuned yet (2026-07-05:
     * PO: defer real score checks; gate on CV score first so everyone is treated fairly).
     * Fairness of the FORMULA is what's locked here; the THRESHOLD is not.
     *
     * @param level - the verification level to score.
     * @returns 100 (passed capstone) / 0 (activity-backed or self-reported).
     */
    scoreOf(level: CvVerificationLevel): number {
        switch (level) {
        case CvVerificationLevel.CapstoneVerified:
            return 100
        // challenges (activity-backed) do NOT count toward the CV/gate score --
        // only a real passed capstone does; treated the same as self-reported
        case CvVerificationLevel.ActivityBacked:
        case CvVerificationLevel.SelfReported:
            return 0
        }
    }

    /**
     * Sort rank of a level -- higher = stronger StarCi proof. Lets the marketplace
     * break equal-depth ties by surfacing verified candidates above self-reported
     * ones without importing the enum's ordering into another module.
     *
     * @param level - the verification level to rank.
     * @returns 2 (capstone) / 1 (activity) / 0 (self-reported).
     */
    rankOf(level: CvVerificationLevel): number {
        // explicit switch keeps the ordering exhaustive + obvious at the call site
        switch (level) {
        case CvVerificationLevel.CapstoneVerified:
            return 2
        case CvVerificationLevel.ActivityBacked:
            return 1
        case CvVerificationLevel.SelfReported:
            return 0
        }
    }

    /**
     * Same classification as {@link resolveLevel}, but scoped to ONE course --
     * "did this learner pass a capstone / get a challenge graded IN THIS
     * course's enrollment", not anywhere on the platform. Powers the
     * per-track CV pillar ({@link import("../../../features/api/core/graphql/queries/users/job-readiness/job-readiness.service").JobReadinessService}),
     * which is per-course by design -- reusing the platform-wide
     * {@link resolveLevel} there would let 1 unrelated capstone in ANOTHER
     * course inflate THIS track's depth, which is exactly the count/cross-track
     * leak the fair-monetization axiom forbids. Existence-checked (not summed)
     * within the course, so it stays count-independent the same way
     * {@link resolveLevel} is platform-wide.
     *
     * @param params - the learner + the course to scope the check to.
     * @returns the level, defaulting to `SelfReported` when neither signal is present.
     */
    async resolveLevelForCourse(
        {
            userId,
            courseId,
        }: ResolveCvVerificationLevelForCourseParams,
    ): Promise<CvVerificationLevel> {
        const [
            capstoneRow,
            challengeRow,
        ] = await Promise.all([
            this.entityManager.query<Array<CvVerificationUserIdRow>>(
                `
                SELECT DISTINCT e.user_id AS user_id
                FROM enrollments e
                JOIN user_milestone_tasks umt ON umt.enrollment_id = e.id
                JOIN user_milestone_task_attempts umta ON umta.user_milestone_task_id = umt.id
                WHERE e.user_id = $1 AND e.course_id = $2 AND umta.passed = true
                LIMIT 1
                `,
                [
                    userId,
                    courseId,
                ],
            ),
            this.entityManager.query<Array<CvVerificationUserIdRow>>(
                `
                SELECT DISTINCT ucs.user_id AS user_id
                FROM user_challenge_submissions ucs
                JOIN user_challenge_submission_attempts ucsa ON ucsa.user_challenge_submission_id = ucs.id
                JOIN enrollments e ON e.id = ucs.enrollment_id
                WHERE ucs.user_id = $1 AND e.course_id = $2 AND ucsa.score IS NOT NULL
                LIMIT 1
                `,
                [
                    userId,
                    courseId,
                ],
            ),
        ])

        if (capstoneRow.length > 0) {
            return CvVerificationLevel.CapstoneVerified
        }
        if (challengeRow.length > 0) {
            return CvVerificationLevel.ActivityBacked
        }
        return CvVerificationLevel.SelfReported
    }

    /**
     * Distinct users with >=1 PASSED capstone/milestone task attempt, reached via
     * their enrollments. A passed capstone is the strongest verification signal.
     *
     * @param userIds - the candidate batch's user ids.
     * @returns one row per qualifying user id.
     */
    private async loadUsersWithPassedCapstone(userIds: Array<string>): Promise<Array<CvVerificationUserIdRow>> {
        // join enrollments -> user_milestone_tasks -> attempts, keep only passed
        // attempts, and collapse to one distinct user_id per qualifying user
        return this.entityManager.query<Array<CvVerificationUserIdRow>>(
            `
            SELECT DISTINCT e.user_id AS user_id
            FROM enrollments e
            JOIN user_milestone_tasks umt ON umt.enrollment_id = e.id
            JOIN user_milestone_task_attempts umta ON umta.user_milestone_task_id = umt.id
            WHERE e.user_id = ANY($1) AND umta.passed = true
            `,
            [
                userIds,
            ],
        )
    }

    /**
     * Distinct users with >=1 AI-graded challenge submission attempt. A non-null
     * `score` means the attempt was actually processed/graded (regardless of
     * pass/fail) -- proof the user did + submitted real hands-on StarCi work,
     * unlike a bare uploaded CV. (Challenge attempts carry no `passed` boolean,
     * so "graded" is the cleanest available signal.)
     *
     * @param userIds - the candidate batch's user ids.
     * @returns one row per qualifying user id.
     */
    private async loadUsersWithGradedChallenge(userIds: Array<string>): Promise<Array<CvVerificationUserIdRow>> {
        // join submissions -> attempts, keep only scored (graded) attempts, and
        // collapse to one distinct user_id per qualifying user
        return this.entityManager.query<Array<CvVerificationUserIdRow>>(
            `
            SELECT DISTINCT ucs.user_id AS user_id
            FROM user_challenge_submissions ucs
            JOIN user_challenge_submission_attempts ucsa ON ucsa.user_challenge_submission_id = ucs.id
            WHERE ucs.user_id = ANY($1) AND ucsa.score IS NOT NULL
            `,
            [
                userIds,
            ],
        )
    }
}
