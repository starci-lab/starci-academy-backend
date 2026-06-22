import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
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
        }: GetInterviewHistoryParams,
    ): Promise<InterviewHistorySummary> {
        // newest-first window, optionally scoped to one deck
        const attempts = await this.entityManager.find(
            InterviewAttemptEntity,
            {
                where: {
                    userId,
                    ...(flashcardDeckId
                        ? {
                            flashcardDeckId,
                        }
                        : {
                        }),
                },
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
                passCount: 0,
                borderlineCount: 0,
                failCount: 0,
                weakTags: [],
                lastAttemptAt: null,
            }
        }

        const scoreSum = attempts.reduce((sum, attempt) => sum + attempt.score, 0)
        const averageScore = Math.round((scoreSum / totalAnswered) * 10) / 10
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
                    weakTagCounts.set(tag, (weakTagCounts.get(tag) ?? 0) + 1)
                }
            }
        }
        const weakTags = [...weakTagCounts.entries()]
            .sort((left, right) => right[1] - left[1])
            .slice(0, MAX_WEAK_TAGS)
            .map(([tag]) => tag)

        return {
            totalAnswered,
            averageScore,
            passCount,
            borderlineCount,
            failCount,
            weakTags,
            // attempts are newest-first, so the head is the most recent
            lastAttemptAt: attempts[0].createdAt,
        }
    }
}
