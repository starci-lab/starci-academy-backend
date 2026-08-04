import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
    Not,
} from "typeorm"
import {
    ContentEntity,
    FlashcardCardEntity,
    FlashcardQuizSessionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    XpHistoryEntity,
    XpSource,
} from "@modules/databases"
import {
    ContentRagRetrievalService,
} from "@modules/rag"
import {
    FLAT_POINTS,
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
        private readonly contentRagRetrievalService: ContentRagRetrievalService,
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

            // "resume flashcard quiz session" (2026-07-08): flip the persisted
            // draw (if `sessionId` is one — a server-issued
            // `startFlashcardQuizSession` id, scoped to the CALLER's own
            // enrollment) to "completed" so it stops surfacing as resumable via
            // `myInProgressFlashcardQuizSession`. A no-op (never throws) when
            // `sessionId` does not match any owned in-progress row — an older
            // client that never called `startFlashcardQuizSession` still sends
            // a client-generated id here, which simply matches nothing.
            //
            // "history + stats" (2026-07-08): also snapshot `coverage` and
            // `weakTags` here (both already computed above, independent of the
            // XP grant) — this and the `xpEarned` update below let
            // `myFlashcardQuizHistory`/`myFlashcardQuizStats` read a finished
            // session's outcome straight off its own row, without re-deriving
            // coverage from `results` or joining `xp_histories`. Sitting AFTER
            // the idempotency check above, a replay never re-touches the row.
            // WHERE `status: Not("completed")` (loosened 2026-07-12 — was
            // `status: "in_progress"`; see `FlashcardDueReviewSessionService
            // .complete`'s doc for the full root-cause) so a row raced to
            // "abandoned" by a concurrent `start()` still gets its real
            // completion recorded instead of silently matching zero rows (an
            // older client's session id that never called
            // `startFlashcardQuizSession` still matches nothing, same as
            // before — the row itself doesn't exist under that id).
            // Ownership is a two-level nested relation (enrollment → user),
            // which a bare `update()` cannot express: TypeORM compiles `update`
            // to an UpdateQueryBuilder with no JOINs, so a nested-relation WHERE
            // throws "Cannot find alias for relation". Resolve ownership with a
            // `findOne` (which CAN join) first, then update by the scalar `id` +
            // the replay-safe `status` guard — mirroring `sync()`.
            const owned = await manager.findOne(
                FlashcardQuizSessionEntity,
                {
                    where: {
                        id: sessionId,
                        enrollment: {
                            user: {
                                id: userId,
                            },
                        },
                    },
                    select: {
                        id: true,
                    },
                },
            )
            if (owned) {
                await manager.update(
                    FlashcardQuizSessionEntity,
                    {
                        id: sessionId,
                        status: Not("completed"),
                    },
                    {
                        status: "completed",
                        coverage,
                        weakTags,
                    },
                )
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

            // append the single xp_histories row — feeds streak / weekly XP /
            // course leaderboard, which all read xp_histories. Also grants the
            // flat Coin reward (anchored to lessonRead) on any session that
            // actually earned XP this cap window; writeXpHistory guards on
            // (source, refId), so the grant is doubly safe.
            await writeXpHistory({
                entityManager: manager,
                userId,
                courseId,
                source: XpSource.FlashcardQuiz,
                amount,
                points: FLAT_POINTS.flashcardQuizSession,
                refId: sessionId,
            })

            // snapshot the ACTUAL granted XP (post daily-cap clamp) onto the
            // row — only known now, after the headroom calc above, so this is
            // a second update rather than folding into the first
            await manager.update(
                FlashcardQuizSessionEntity,
                {
                    id: sessionId,
                },
                {
                    xpEarned: amount,
                },
            )

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
                    // deck loaded for its courseId — the "review this lesson" link is
                    // now resolved via RAG (searchCourse), not the old deck→content/
                    // module relations (removed).
                    deck: true,
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

        // resolve each tag's deep link via RAG (query = the weak tag itself → the
        // most relevant lesson in this course), scoped by the representative card's
        // deck courseId
        return Promise.all(ranked.map(async ({ tag, coverage }) => {
            const courseId = representativeCardByTag.get(tag)?.deck?.courseId
            const link = await this.resolveWeakTagLink(courseId,
                tag)
            return {
                tag,
                coverage,
                ...link,
            }
        }))
    }

    /**
     * Resolve a weak tag's "review this lesson" link via RAG — semantic-search the
     * course's indexed content for the tag and deep-link the best-matching lesson
     * (+ its owning module). Replaces the old deck→content/module relations
     * (removed): the association is now derived from what the course actually
     * teaches, not a stored many-to-many. Degrades to no link when the course id
     * or tag is missing, retrieval misses, or the matched content row is gone.
     *
     * @param courseId - the course to search within (the tag's deck's course).
     * @param query - the weak tag (the concept to find a lesson for).
     * @returns `{ moduleId?, contentId? }`, empty when nothing relevant resolves.
     */
    private async resolveWeakTagLink(
        courseId: string | undefined,
        query: string,
    ): Promise<Pick<QuizSessionWeakTagResult, "moduleId" | "contentId">> {
        const trimmed = query.trim()
        if (!courseId || !trimmed) {
            return {
            }
        }
        const { hits } = await this.contentRagRetrievalService.searchCourse({
            courseId,
            query: trimmed,
        })
        // only a lesson (content/code chunk) is a valid "review this" target — a
        // challenge/flashcard/milestone hit is not a lesson to re-read
        const lessonHit = hits.find(
            (hit) => hit.kind === "content" || hit.kind === "code",
        )
        if (!lessonHit) {
            return {
            }
        }
        const content = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id: lessonHit.contentId,
                },
                select: {
                    id: true,
                    moduleId: true,
                },
            },
        )
        return content
            ? {
                contentId: content.id,
                moduleId: content.moduleId,
            }
            : {
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
