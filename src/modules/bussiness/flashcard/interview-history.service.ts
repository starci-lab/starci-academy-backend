import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    FlashcardDeckEntity,
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
        // resolve the deck scope: one deck (legacy) takes precedence; else, for the
        // random-interview mode, every deck of the course; else account-wide.
        let deckScope: Record<string, unknown> = {}
        if (flashcardDeckId) {
            deckScope = {
                flashcardDeckId,
            }
        } else if (courseId) {
            const decks = await this.entityManager.find(
                FlashcardDeckEntity,
                {
                    where: {
                        course: {
                            id: courseId,
                        },
                    },
                    select: {
                        id: true,
                    },
                },
            )
            // a course with no decks → no attempts in scope; return the zeroed summary
            if (decks.length === 0) {
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
            deckScope = {
                flashcardDeckId: In(decks.map((deck) => deck.id)),
            }
        }

        // newest-first window, scoped to the resolved deck set (deck / course / all)
        const attempts = await this.entityManager.find(
            InterviewAttemptEntity,
            {
                where: {
                    userId,
                    ...deckScope,
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
                bestScore: 0,
                passCount: 0,
                borderlineCount: 0,
                failCount: 0,
                weakTags: [],
                lastAttemptAt: null,
            }
        }

        const scoreSum = attempts.reduce((sum, attempt) => sum + attempt.score, 0)
        const averageScore = Math.round((scoreSum / totalAnswered) * 10) / 10
        const bestScore = attempts.reduce((max, attempt) => Math.max(max, attempt.score), 0)
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
