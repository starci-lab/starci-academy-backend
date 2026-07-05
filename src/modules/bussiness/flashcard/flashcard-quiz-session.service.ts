import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    FlashcardCardEntity,
    InjectPrimaryPostgreSQLEntityManager,
    XpHistoryEntity,
    XpSource,
} from "@modules/databases"
import {
    writeXpHistory,
} from "@features/api/processors/ai/shared/xp"
import {
    JOB_READINESS_BUILDING_THRESHOLD,
} from "@features/api/core/graphql/queries/users/job-readiness/constants"
import {
    UserFlashcardStatsProjectionService,
} from "../projections/user-flashcard-stats"
import type {
    CompleteFlashcardQuizSessionParams,
    CompleteFlashcardQuizSessionResult,
    QuizSessionAnswerParams,
    QuizSessionWeakTagResult,
    QuizXpSumRow,
} from "./types"

/** XP awarded per answered card, before the coverage weighting is applied. */
const PER_CARD_XP = 3

/** Hard ceiling on the XP a single quick-quiz session can ever grant. */
const MAX_XP_PER_SESSION = 15

/** Upper bound on cards counted toward the reward (guards against inflated inputs). */
const MAX_ANSWERED_CARDS = 10

/**
 * Hard ceiling on the XP `FlashcardQuiz` can grant a (user, course) pair per VN
 * calendar day — four sessions' worth of {@link MAX_XP_PER_SESSION}. Without
 * this, the only limiter was the per-session ceiling, so an unlimited number
 * of sessions per day could farm the leaderboard without ever really studying.
 */
const DAILY_QUIZ_XP_CAP = 60

/** IANA timezone the daily cap's calendar day is measured in (VN local day, matches the daily-quest convention). */
const DAILY_CAP_TIMEZONE = "Asia/Ho_Chi_Minh"

/** Upper bound on weak tags returned per session (top-N weakest, not a silent drop of the rest). */
const MAX_WEAK_TAGS = 5

/**
 * Business logic for the flashcard quick-quiz ("Hỏi nhanh") flow. Finishing a
 * session grants a capped, coverage-weighted XP reward written as a single
 * `xp_histories` row via {@link writeXpHistory} — which in turn feeds the streak,
 * weekly XP, and per-course leaderboard (all read from `xp_histories`). The grant
 * is idempotent on the client-generated session id so a replayed "complete" call
 * never double-credits, and is additionally clamped by a per-day cap so unlimited
 * replays with a fresh session id cannot farm XP indefinitely.
 *
 * Coverage is no longer trusted from the client: the caller sends a per-card
 * breakdown ({@link QuizSessionAnswerParams}) and the server re-derives the
 * aggregate coverage/answered-count itself, which also lets it compute
 * per-tag weak spots and bridge a poor session back to a specific lesson.
 */
@Injectable()
export class FlashcardQuizSessionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userFlashcardStatsProjectionService: UserFlashcardStatsProjectionService,
    ) {}

    /**
     * Record a finished quick-quiz session and grant its XP reward.
     *
     * The reward is `min(remainingDailyHeadroom, MAX_XP_PER_SESSION, round(coverage * cards * PER_CARD_XP))`
     * where `coverage`/`cards` are re-derived SERVER-SIDE from the per-card
     * answer breakdown (never trusted from the client). The whole grant is
     * idempotent on `(source = flashcardQuiz, refId = sessionId)`: a replay
     * records nothing and returns `xpEarned = 0`.
     *
     * @param params - {@link CompleteFlashcardQuizSessionParams}
     * @returns the XP granted this call (0 on an idempotent replay or an
     * already-capped day), the day's cap state, this session's weakest tags,
     * and the AI Mock Interview readiness signal.
     *
     * @example
     * await service.complete({
     *     userId, sessionId, courseId,
     *     answers: [{ cardId: "c1", correctBlanks: 2, totalBlanks: 3 }],
     * })
     */
    async complete(
        {
            userId,
            sessionId,
            courseId,
            answers,
        }: CompleteFlashcardQuizSessionParams,
    ): Promise<CompleteFlashcardQuizSessionResult> {
        // clamp the answered-card count to a sane range so a spoofed or buggy
        // client cannot inflate the reward past the per-session ceiling by
        // submitting an absurdly long answers array
        const clampedAnswers = answers.slice(0,
            MAX_ANSWERED_CARDS)
        const cards = clampedAnswers.length

        // SERVER-SIDE coverage: average of each card's own correct/total ratio
        // (not client-sent) — a card with totalBlanks=0 contributes 0 rather
        // than dividing by zero. This is the fix for the client-trusted-score
        // exploit: the aggregate is derived here, from the per-card payload.
        const coverage = cards === 0
            ? 0
            : clampedAnswers.reduce(
                (acc, answer) => acc + this.cardCoverage(answer),
                0,
            ) / cards

        // coverage-weighted reward, hard-capped so one session can never exceed the ceiling
        const sessionAmount = Math.min(MAX_XP_PER_SESSION,
            Math.round(coverage * cards * PER_CARD_XP))

        // weak-tags + readiness are read-only insight, independent of the XP
        // grant/idempotency path — compute them even on a replay so the recap
        // still has something to show
        const [
            weakTags,
            readiness,
        ] = await Promise.all([
            this.computeWeakTags(clampedAnswers),
            this.computeReadiness(userId),
        ])

        // write the grant in one transaction so the idempotency check, the daily-cap
        // sum, and the ledger write cannot interleave with a concurrent replay
        const {
            xpEarned,
            dailyCapReached,
        } = await this.entityManager.transaction(async (manager) => {
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
                    dailyCapReached: false,
                }
            }

            // sum today's (VN calendar day) FlashcardQuiz XP for this (user, course) —
            // the daily cap headroom is the ceiling minus what has already been granted
            const grantedToday = await this.sumTodayQuizXp(manager,
                userId,
                courseId)
            const headroom = Math.max(0,
                DAILY_QUIZ_XP_CAP - grantedToday)
            const amount = Math.min(sessionAmount,
                headroom)

            // nothing left to grant today — record no ledger row (an idempotency
            // replay must find nothing here later either, which is correct: a
            // zero-XP day-capped call has nothing to become idempotent about)
            if (amount <= 0) {
                return {
                    xpEarned: 0,
                    dailyCapReached: true,
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
                // the day is "capped" from this call's perspective when the clamp
                // actually reduced the reward below what coverage alone would earn
                dailyCapReached: amount < sessionAmount,
            }
        })

        return {
            xpEarned,
            dailyCapReached,
            weakTags,
            readiness,
        }
    }

    /** One card's own correct/total ratio, guarding against a zero denominator. */
    private cardCoverage(answer: QuizSessionAnswerParams): number {
        // clamp inputs first — a spoofed client could send correctBlanks > totalBlanks
        // or negative counts; both are nonsensical for a ratio
        const total = Math.max(0,
            Math.trunc(answer.totalBlanks))
        if (total === 0) {
            // no blanks to grade on this card → contributes 0, not a divide-by-zero
            return 0
        }
        const correct = Math.max(0,
            Math.min(Math.trunc(answer.correctBlanks),
                total))
        return correct / total
    }

    /** Sum today's (VN calendar day) FlashcardQuiz XP already granted to this (user, course) pair. */
    private async sumTodayQuizXp(
        manager: EntityManager,
        userId: string,
        courseId: string,
    ): Promise<number> {
        const row = await manager
            .createQueryBuilder(XpHistoryEntity,
                "history")
            .select("COALESCE(SUM(history.amount), 0)",
                "sum")
            .where("history.user_id = :userId",
                {
                    userId,
                })
            .andWhere("history.course_id = :courseId",
                {
                    courseId,
                })
            .andWhere("history.source = :source",
                {
                    source: XpSource.FlashcardQuiz,
                })
            // VN calendar day, matching the daily-quest convention (Asia/Ho_Chi_Minh),
            // so the cap resets at VN midnight rather than UTC midnight
            .andWhere(
                "(history.created_at AT TIME ZONE :timezone)::date = (now() AT TIME ZONE :timezone)::date",
                {
                    timezone: DAILY_CAP_TIMEZONE,
                },
            )
            .getRawOne<QuizXpSumRow>()
        return Number(row?.sum) || 0
    }

    /**
     * Rank this session's technology tags by lowest coverage (weakest first),
     * resolving a "review this lesson" deep link for a tag when its cards'
     * owning deck(s) map to EXACTLY one module/content — an ambiguous mapping
     * (a deck spanning zero or multiple modules/contents) omits the link
     * fields rather than fabricating one.
     *
     * @param answers - the clamped per-card breakdown for this session.
     * @returns the weakest tags, capped at {@link MAX_WEAK_TAGS}.
     */
    private async computeWeakTags(
        answers: Array<QuizSessionAnswerParams>,
    ): Promise<Array<QuizSessionWeakTagResult>> {
        if (answers.length === 0) {
            // nothing answered → nothing to rank
            return []
        }

        // load the answered cards' tags + their deck's content/module links in one
        // query — this is the per-card breakdown the client no longer needs to
        // pre-aggregate; the server derives tag coverage from it directly
        const cardIds = answers.map((answer) => answer.cardId)
        const cards = await this.entityManager.find(
            FlashcardCardEntity,
            {
                where: {
                    id: In(cardIds),
                },
                relations: {
                    deck: {
                        contents: true,
                        modules: true,
                    },
                },
            },
        )
        const cardById = new Map(cards.map((card) => [
            card.id,
            card,
        ]))

        // accumulate per-tag correct/total across every card that carries the tag —
        // a card can carry multiple tags, so it contributes to each tag's totals
        const correctByTag = new Map<string, number>()
        const totalByTag = new Map<string, number>()
        // remember one representative card per tag so we can resolve its deep link
        // (first card seen carrying the tag — good enough for a "review this" nudge)
        const representativeCardByTag = new Map<string, FlashcardCardEntity>()
        for (const answer of answers) {
            const card = cardById.get(answer.cardId)
            if (!card) {
                // the card id was not found (deleted / bad input) — skip it silently,
                // its blanks simply do not contribute to any tag
                continue
            }
            const coverage = this.cardCoverage(answer)
            for (const tag of card.tags) {
                correctByTag.set(tag,
                    (correctByTag.get(tag) ?? 0) + coverage)
                totalByTag.set(tag,
                    (totalByTag.get(tag) ?? 0) + 1)
                if (!representativeCardByTag.has(tag)) {
                    representativeCardByTag.set(tag,
                        card)
                }
            }
        }

        // average coverage per tag, ranked weakest (lowest coverage) first
        const ranked = [...totalByTag.entries()]
            .map(([
                tag,
                total,
            ]) => ({
                tag,
                coverage: total === 0 ? 0 : (correctByTag.get(tag) ?? 0) / total,
            }))
            .sort((prev, next) => prev.coverage - next.coverage)
            .slice(0,
                MAX_WEAK_TAGS)

        // resolve each tag's deep link (only when unambiguous)
        return ranked.map(({ tag, coverage }) => {
            const card = representativeCardByTag.get(tag)
            const link = card ? this.resolveWeakTagLink(card) : {
            }
            return {
                tag,
                coverage,
                ...link,
            }
        })
    }

    /**
     * Resolve a single card's "review this lesson" link through its deck's
     * content/module associations — a deck is many-to-many with both, so the
     * link is only unambiguous when EXACTLY one is linked.
     *
     * @param card - the card whose deck to inspect (with `deck.contents`/`deck.modules` loaded).
     * @returns `{ moduleId?, contentId? }`, empty when the mapping is ambiguous.
     */
    private resolveWeakTagLink(
        card: FlashcardCardEntity,
    ): Pick<QuizSessionWeakTagResult, "moduleId" | "contentId"> {
        const deck = card.deck
        if (!deck) {
            // no deck loaded (should not happen given the relations query) → no link
            return {
            }
        }
        // a deck linked to EXACTLY one content has an unambiguous "review this
        // lesson" target — its owning module comes along with it for free
        if (deck.contents?.length === 1) {
            const [content] = deck.contents
            return {
                contentId: content.id,
                moduleId: content.moduleId,
            }
        }
        // no single content, but the deck is scoped to EXACTLY one module → still
        // a useful (coarser) "review this module" link, just no specific lesson
        if (deck.modules?.length === 1) {
            const [mod] = deck.modules
            return {
                moduleId: mod.id,
            }
        }
        // zero or multiple contents/modules linked → ambiguous, omit the link
        // rather than fabricating one
        return {
        }
    }

    /**
     * Cheap proxy readiness signal for the AI Mock Interview cross-link, reused
     * from the existing flashcard-stats projection (retention rate) rather than
     * building new cross-session tracking for this MVP pass.
     *
     * @param userId - the learner whose readiness to read.
     * @returns the proxy value, the unlock threshold, and whether it is met.
     */
    private async computeReadiness(
        userId: string,
    ): Promise<CompleteFlashcardQuizSessionResult["readiness"]> {
        // reuse the myFlashcardStats projection read (streak / retention / totals) —
        // retentionRate (0-100) is the cheapest available proxy for "how well is
        // this learner doing", with no new tracking needed for this pass
        const stats = await this.userFlashcardStatsProjectionService.getStats({
            userId,
        })
        // reuse the job-readiness "building" band threshold as the unlock bar —
        // it is already the platform's calibrated "showing real competence" line,
        // so a second bespoke threshold would just duplicate that judgment call
        const threshold = JOB_READINESS_BUILDING_THRESHOLD
        return {
            currentAvg: stats.retentionRate,
            threshold,
            unlocked: stats.retentionRate >= threshold,
        }
    }
}
