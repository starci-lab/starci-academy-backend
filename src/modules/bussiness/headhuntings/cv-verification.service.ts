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
    ResolveCvVerificationLevelsParams,
} from "./types"

/**
 * Classifies candidates into a {@link CvVerificationLevel} — a recruiter TRUST
 * signal tied to REAL, graded StarCi work (never to payment or CV count). A
 * strong external developer who only uploaded a CV is `SelfReported`; graded
 * challenge work is `ActivityBacked`; a passed capstone is `CapstoneVerified`.
 *
 * Used by the recruiter marketplace ({@link import("../../../features/api/core/graphql/queries/users/talent-candidates/talent-candidates.service").TalentCandidatesService})
 * to badge candidates and break depth ties (verified above self-reported).
 * Deliberately does NOT touch the CV-score contact gate
 * ({@link import("./consultant-contact-gate.service").ConsultantContactGateService})
 * — this is an additive trust tier, not a new access lock.
 */
@Injectable()
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
     * @returns a map of `userId → level`; every requested user is present (defaults to `SelfReported`).
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
        // empty batch → nothing to classify, skip the DB round-trips
        if (userIds.length === 0) {
            return new Map()
        }

        // two existence probes over the whole batch in parallel — each returns
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
        // always get a level back — absent from both sets means self-reported
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
            // no graded StarCi work at all → the CV stands on self-reported claims only
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
     * Sort rank of a level — higher = stronger StarCi proof. Lets the marketplace
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
     * Distinct users with ≥1 PASSED capstone/milestone task attempt, reached via
     * their enrollments. A passed capstone is the strongest verification signal.
     *
     * @param userIds - the candidate batch's user ids.
     * @returns one row per qualifying user id.
     */
    private async loadUsersWithPassedCapstone(userIds: Array<string>): Promise<Array<CvVerificationUserIdRow>> {
        // join enrollments → user_milestone_tasks → attempts, keep only passed
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
     * Distinct users with ≥1 AI-graded challenge submission attempt. A non-null
     * `score` means the attempt was actually processed/graded (regardless of
     * pass/fail) — proof the user did + submitted real hands-on StarCi work,
     * unlike a bare uploaded CV. (Challenge attempts carry no `passed` boolean,
     * so "graded" is the cleanest available signal.)
     *
     * @param userIds - the candidate batch's user ids.
     * @returns one row per qualifying user id.
     */
    private async loadUsersWithGradedChallenge(userIds: Array<string>): Promise<Array<CvVerificationUserIdRow>> {
        // join submissions → attempts, keep only scored (graded) attempts, and
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
