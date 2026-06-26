import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    InterviewAttemptEntity,
} from "@modules/databases"
import {
    InterviewVerdict,
} from "./types/interview-grade"
import type {
    GetInterviewHistoryParams,
    InterviewHistorySummary,
} from "./types/interview-history"

/** How many recent attempts to aggregate (bounds the per-request scan). */
const HISTORY_WINDOW = 200

/** How many weak topics to surface in the summary. */
const MAX_WEAK_TAGS = 6

/**
 * Reads + aggregates a user's mock-interview history from the append-only
 * `interview_attempts` log: average score, verdict breakdown, and the weakest
 * topics (tags of the answers not passed). Computed in TS from a bounded recent
 * window — interview practice is low-volume per user, so no projection is needed.
 */
@Injectable()
export class InterviewHistoryService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Aggregate the viewer's recent interview attempts into a history summary.
     *
     * @param params - Viewer id + optional deck scope.
     * @returns The aggregated summary (zeroed when the user has no attempts).
     */
    async getSummary(
        {
            userId,
            flashcardDeckId,
            courseId,
        }: GetInterviewHistoryParams,
    ): Promise<InterviewHistorySummary> {
        // Build the scope. The course-wide (random-interview) branch is keyed by
        // ENROLLMENT id (the anchor for per-course progress going forward) — an
        // enrollment IS user × course, so filtering by enrollment_id is inherently
        // course-scoped, and interview_attempts.enrollment_id is backfilled. The
        // enrollment is resolved READ-ONLY (no trial create on a read). The legacy
        // single-deck and account-wide branches stay keyed by user_id (no single
        // course / enrollment to anchor on).
        const scope: Record<string, unknown> = {
        }
        if (flashcardDeckId) {
            // one deck (legacy) takes precedence — scope by deck + the viewer (user_id)
            scope.userId = userId
            scope.flashcardDeckId = flashcardDeckId
        } else if (courseId) {
            const enrollment = await this.entityManager.findOne(
                EnrollmentEntity,
                {
                    where: {
                        user: {
                            id: userId,
                        },
                        course: {
                            id: courseId,
                        },
                    },
                    select: {
                        id: true,
                    },
                },
            )
            // no enrollment for this user × course → no attempts in scope; zeroed summary
            if (!enrollment) {
                return {
                    totalAnswered: 0,
                    averageScore: 0,
                    bestScore: 0,
                    passCount: 0,
                    borderlineCount: 0,
                    failCount: 0,
                    weakTags: [],
                    lastAttemptAt: null,
                }
            }
            // key by enrollment_id — inherently scopes to this course's attempts
            scope.enrollmentId = enrollment.id
        } else {
            // account-wide → every attempt the viewer owns (user_id)
            scope.userId = userId
        }

        // newest-first window, scoped to the resolved set (deck+user / enrollment / user)
        const attempts = await this.entityManager.find(
            InterviewAttemptEntity,
            {
                where: scope,
                order: {
                    createdAt: "DESC",
                },
                take: HISTORY_WINDOW,
            },
        )

        const totalAnswered = attempts.length
        if (totalAnswered === 0) {
            return {
                totalAnswered: 0,
                averageScore: 0,
                bestScore: 0,
                passCount: 0,
                borderlineCount: 0,
                failCount: 0,
                weakTags: [],
                lastAttemptAt: null,
            }
        }

        const scoreSum = attempts.reduce((sum, attempt) => sum + attempt.score,
            0)
        const averageScore = Math.round((scoreSum / totalAnswered) * 10) / 10
        const bestScore = attempts.reduce((max, attempt) => Math.max(max,
            attempt.score),
        0)
        const passCount = attempts.filter(
            (attempt) => attempt.verdict === InterviewVerdict.Pass,
        ).length
        const borderlineCount = attempts.filter(
            (attempt) => attempt.verdict === InterviewVerdict.Borderline,
        ).length
        const failCount = attempts.filter(
            (attempt) => attempt.verdict === InterviewVerdict.Fail,
        ).length

        // weakest topics: tag frequency across the attempts NOT passed
        const weakTagCounts = new Map<string, number>()
        for (const attempt of attempts) {
            if (attempt.verdict !== InterviewVerdict.Pass) {
                for (const tag of attempt.tags ?? []) {
                    weakTagCounts.set(tag,
                        (weakTagCounts.get(tag) ?? 0) + 1)
                }
            }
        }
        const weakTags = [...weakTagCounts.entries()]
            .sort((left, right) => right[1] - left[1])
            .slice(0,
                MAX_WEAK_TAGS)
            .map(([tag]) => tag)

        return {
            totalAnswered,
            averageScore,
            bestScore,
            passCount,
            borderlineCount,
            failCount,
            weakTags,
            // attempts are newest-first, so the head is the most recent
            lastAttemptAt: attempts[0].createdAt,
        }
    }
}
