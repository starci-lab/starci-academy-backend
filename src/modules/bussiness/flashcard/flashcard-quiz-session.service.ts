import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    XpHistoryEntity,
    XpSource,
} from "@modules/databases"
import {
    writeXpHistory,
} from "@features/api/processors/ai/shared/xp"
import type {
    CompleteFlashcardQuizSessionParams,
    CompleteFlashcardQuizSessionResult,
} from "./types/flashcard-quiz-session"

/** XP awarded per answered card, before the coverage weighting is applied. */
const PER_CARD_XP = 3

/** Hard ceiling on the XP a single quick-quiz session can ever grant. */
const MAX_XP_PER_SESSION = 15

/** Upper bound on cards counted toward the reward (guards against inflated inputs). */
const MAX_ANSWERED_CARDS = 10

/**
 * Business logic for the flashcard quick-quiz ("Hỏi nhanh") flow. Finishing a
 * session grants a capped, coverage-weighted XP reward written as a single
 * `xp_histories` row via {@link writeXpHistory} — which in turn feeds the streak,
 * weekly XP, and per-course leaderboard (all read from `xp_histories`). The grant
 * is idempotent on the client-generated session id so a replayed "complete" call
 * never double-credits.
 */
@Injectable()
export class FlashcardQuizSessionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Record a finished quick-quiz session and grant its XP reward.
     *
     * The reward is `min(MAX_XP_PER_SESSION, round(coverage * cards * PER_CARD_XP))`
     * where inputs are clamped to sane ranges first. The whole grant is idempotent
     * on `(source = flashcardQuiz, refId = sessionId)`: a replay records nothing and
     * returns `xpEarned = 0`.
     *
     * @param params - {@link CompleteFlashcardQuizSessionParams}
     * @returns the XP granted this call (0 on an idempotent replay).
     *
     * @example
     * await service.complete({
     *     userId, sessionId, courseId, answeredCount: 8, coverageScore: 0.75,
     * })
     */
    async complete(
        {
            userId,
            sessionId,
            courseId,
            answeredCount,
            coverageScore,
        }: CompleteFlashcardQuizSessionParams,
    ): Promise<CompleteFlashcardQuizSessionResult> {
        // clamp cards to a whole number in [0, MAX_ANSWERED_CARDS] so a spoofed or
        // buggy client cannot inflate the reward past the per-session ceiling
        const cards = Math.max(0,
            Math.min(Math.trunc(answeredCount),
                MAX_ANSWERED_CARDS))
        // clamp coverage to [0, 1] — it is a ratio, so anything outside is noise
        const coverage = Math.max(0,
            Math.min(coverageScore,
                1))
        // coverage-weighted reward, hard-capped so one session can never exceed the ceiling
        const amount = Math.min(MAX_XP_PER_SESSION,
            Math.round(coverage * cards * PER_CARD_XP))

        // write the grant in one transaction so the idempotency check and the ledger
        // write cannot interleave with a concurrent replay of the same session
        return this.entityManager.transaction(async (manager) => {
            // idempotency gate: if this session already produced a ledger row, a replay
            // (double-submit / retry) must not credit again → return zero without writing
            const existing = await manager.findOne(
                XpHistoryEntity,
                {
                    where: {
                        source: XpSource.FlashcardQuiz,
                        refId: sessionId,
                    },
                    select: {
                        id: true,
                    },
                },
            )
            if (existing) {
                return {
                    xpEarned: 0,
                }
            }

            // append the single xp_histories row (points = 0 → XP only, no Coin) — this
            // feeds streak / weekly XP / course leaderboard, which all read xp_histories.
            // writeXpHistory ALSO guards on (source, refId), so the grant is doubly safe.
            await writeXpHistory({
                entityManager: manager,
                userId,
                courseId,
                source: XpSource.FlashcardQuiz,
                amount,
                points: 0,
                refId: sessionId,
            })

            return {
                xpEarned: amount,
            }
        })
    }
}
