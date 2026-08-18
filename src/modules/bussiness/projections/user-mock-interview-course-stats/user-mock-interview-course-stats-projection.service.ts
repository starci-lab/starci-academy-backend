import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    MockInterviewAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-attempt.entity"
import {
    MockInterviewSessionEntity,
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import {
    UserMockInterviewCourseStatsProjectionEntity,
} from "@modules/databases/postgresql/primary/entities/user-mock-interview-course-stats-projection.entity"
import {
    FlashcardLevel,
} from "@modules/databases/postgresql/primary/enums/flashcard-level"
import {
    MockInterviewPhase,
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    toUnknownRecordArray,
} from "@modules/lib/common/utils/unknown-record"
import type {
    MockInterviewCourseStatsBreakdownItemData,
    MockInterviewCourseStatsRecurringGapData,
    MockInterviewCourseStatsTrendPointData,
    MockInterviewCourseStatsWeakestData,
    RecomputeUserMockInterviewCourseStatsParams,
    UserMockInterviewCourseStatsParams,
    UserMockInterviewCourseStatsResult,
} from "./types"

/** How many most-recent completed attempts to scan for the aggregation -- bounds the aggregation cost. */
const STATS_SCAN_CAP = 50

/** How many of the most recent scanned attempts feed the trend line. */
const STATS_TREND_LENGTH = 10

/** Below this many scanned attempts, every aggregate is noise -- HONEST gate, mirrors the FE Scorecard/FlashcardStats convention of never showing a stat derived from too small a sample. */
const MIN_ATTEMPTS_FOR_STATS = 3

/** A phase/kind below this fraction of its max is "weak" -- mirrors `MockInterviewScorecard`'s own `WEAK_PHASE_THRESHOLD`. */
const WEAK_THRESHOLD = 0.6

/** A phase/kind must be weak at least this many times before it is surfaced as THE pattern to fix (not one bad day). */
const WEAK_MIN_COUNT = 3

/** `attributeScores` entries have no `max` field -- always 0-100 direct, so every fold treats `max` as this fixed constant. */
const ATTRIBUTE_SCORE_MAX = 100

/** The 5 canonical design phase literals -- `byPhase` only ever aggregates these (a legacy/garbled phase literal is dropped, never silently mixed in). */
const DESIGN_PHASE_KEYS: ReadonlySet<string> = new Set(Object.values(MockInterviewPhase))

/** The 3 canonical seniority-level literals -- `byLevel` only ever aggregates these (a null/legacy level is dropped, never silently mixed in). */
const VALID_LEVEL_KEYS: ReadonlySet<string> = new Set(Object.values(FlashcardLevel))

/** A `byLanguage` entry needs at least this many scored questions before it's trustworthy enough to compare against another language -- a language drawn once ever is noise, not a signal. */
const MIN_LANGUAGE_BREAKDOWN_SAMPLE = 2

/** A gap must recur at least this many times across scanned attempts to count as "recurring" (one mention is just one bad session, not a pattern). */
const RECURRING_GAP_MIN_COUNT = 2

/** How many of the most-frequent recurring gaps to surface. */
const RECURRING_GAPS_TOP_N = 5

/** One scanned attempt's createdAt + matchedContentId, kept as a deep-link candidate for its breakdown key. */
interface WeakMatchCandidate {
    createdAt: Date
    matchedContentId: string | null
}

/** Accumulator for one breakdown key (phase or kind) while scanning attempts. */
interface BreakdownAccumulator {
    scoreSum: number
    maxSum: number
    weakCount: number
    attemptCount: number
    /** Attempt createdAt + matchedContentId candidates, newest-scanned-first, for resolving the weakest entry's deep-link without a second pass. */
    weakMatches: Array<WeakMatchCandidate>
}

/** Accumulator for one normalized recurring-gap key while scanning attempts. */
interface RecurringGapAccumulator {
    /** Most-recently-seen original casing (attempts are scanned newest-first) -- used for display. */
    text: string
    /** How many scanned attempts recorded this (normalized) gap. */
    count: number
}

/** Empty/zeroed result shape for `insufficientData: true`. */
const EMPTY_RESULT: UserMockInterviewCourseStatsResult = {
    insufficientData: true,
    modeSplit: {
        qnaCount: 0,
        designCount: 0,
    },
    trend: [],
    byPhase: [],
    byKind: [],
    byAttribute: [],
    byLevel: [],
    byLanguage: [],
    recurringGaps: [],
    weakest: null,
    verdictCounts: {
        pass: 0,
        borderline: 0,
        fail: 0,
    },
}

@Injectable()
/**
 * CQRS projection service for a user's mock-interview COURSE stats -- one row
 * per enrollment. The heavy attempts scan + fold (trend / mode split / two
 * breakdown axes / weakest) runs ONLY in {@link recompute} (the projector,
 * triggered by CDC on `mock_interview_attempts`), building the aggregate
 * jsonb. {@link getStats} reads the flat row with a TTL lazy-refresh -- no
 * per-request scan/fold.
 *
 * This mirrors what `MyMockInterviewStatsService.compute` used to do inline
 * on every read (a bounded <=50-row scan) -- a violation of
 * `.claude/be/rules/cqrs-no-inline-aggregate.md` (even at small scale).
 */
export class UserMockInterviewCourseStatsProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the mock-interview-course-stats aggregate for one
     * enrollment (idempotent).
     *
     * @param params - {@link RecomputeUserMockInterviewCourseStatsParams}
     */
    async recompute(
        {
            enrollmentId,
            entityManager,
        }: RecomputeUserMockInterviewCourseStatsParams,
    ): Promise<void> {
        // honour the caller's transaction when given, else the service connection
        const manager = entityManager ?? this.entityManager

        const value = await this.computeAggregate(manager,
            enrollmentId)

        await manager.query(
            `INSERT INTO user_mock_interview_course_stats_projections (enrollment_id, value)
             VALUES ($1::uuid, $2::jsonb)
             ON CONFLICT (enrollment_id) DO UPDATE SET
                 value      = EXCLUDED.value,
                 updated_at = now()`,
            [
                enrollmentId,
                JSON.stringify(value),
            ],
        )
    }

    /**
     * Read an enrollment's mock-interview-course stats, TTL lazy-refreshed.
     *
     * @param params - {@link UserMockInterviewCourseStatsParams}
     * @returns the stats (the `insufficientData: true` empty shape when the enrollment has no history / row).
     */
    async getStats(
        {
            enrollmentId,
        }: UserMockInterviewCourseStatsParams,
    ): Promise<UserMockInterviewCourseStatsResult> {
        let row = await this.entityManager.findOne(
            UserMockInterviewCourseStatsProjectionEntity,
            {
                where: {
                    enrollmentId,
                },
            },
        )
        // missing / past freshness window -> recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                enrollmentId,
            })
            row = await this.entityManager.findOne(
                UserMockInterviewCourseStatsProjectionEntity,
                {
                    where: {
                        enrollmentId,
                    },
                },
            )
        }
        const value = row?.value as Partial<UserMockInterviewCourseStatsResult> | undefined
        if (!value || Object.keys(value).length === 0) {
            return EMPTY_RESULT
        }
        return {
            insufficientData: value.insufficientData ?? true,
            modeSplit: value.modeSplit ?? EMPTY_RESULT.modeSplit,
            trend: value.trend ?? [],
            byPhase: value.byPhase ?? [],
            byKind: value.byKind ?? [],
            byAttribute: value.byAttribute ?? [],
            byLevel: value.byLevel ?? [],
            byLanguage: value.byLanguage ?? [],
            recurringGaps: value.recurringGaps ?? [],
            weakest: value.weakest ?? null,
            verdictCounts: value.verdictCounts ?? EMPTY_RESULT.verdictCounts,
        }
    }

    /**
     * The full aggregate -- trend / mode split / both breakdown axes /
     * weakest -- COPIED verbatim (parameterized by `enrollmentId`) from
     * `MyMockInterviewStatsService.compute`.
     */
    private async computeAggregate(
        manager: EntityManager,
        enrollmentId: string,
    ): Promise<UserMockInterviewCourseStatsResult> {
        // attempts are keyed by enrollment directly (no user/course join needed)
        const attempts = await manager.find(
            MockInterviewAttemptEntity,
            {
                where: {
                    enrollment: {
                        id: enrollmentId,
                    },
                },
                order: {
                    createdAt: "DESC",
                },
                take: STATS_SCAN_CAP,
            },
        )

        if (attempts.length < MIN_ATTEMPTS_FOR_STATS) {
            return EMPTY_RESULT
        }

        // `byLanguage` needs each qna attempt's DRAWN session (the language
        // lives on `seedQuestions[i].givenCodes`, not on the attempt itself)
        // -- batch-fetch once instead of a per-attempt N+1 lookup.
        const qnaSessionIds = [...new Set(
            attempts
                .filter((attempt) => attempt.mode === "qna")
                .map((attempt) => attempt.sessionId),
        )]
        const sessions = qnaSessionIds.length > 0
            ? await manager.find(
                MockInterviewSessionEntity,
                {
                    where: {
                        id: In(qnaSessionIds),
                    },
                },
            )
            : []
        const sessionById = new Map(sessions.map((session) => [
            session.id,
            session,
        ]))

        // `attempts` is newest-first (DESC); reverse to oldest-first, then take
        // the last N of that ascending list -- i.e. the most recent N attempts,
        // oldest-of-those-first, which is what a left-to-right trend line wants
        const trend: Array<MockInterviewCourseStatsTrendPointData> = [...attempts]
            .reverse()
            .slice(-STATS_TREND_LENGTH)
            .map((attempt) => ({
                completedAt: attempt.createdAt,
                overallScore: attempt.overallScore,
                // a null-mode legacy attempt predates the "mode split" -- the only
                // mode that could have existed then was design
                mode: attempt.mode ?? "design",
                verdict: attempt.verdict,
            }))

        let qnaCount = 0
        let designCount = 0
        const phaseAcc = new Map<string, BreakdownAccumulator>()
        const kindAcc = new Map<string, BreakdownAccumulator>()
        const attributeAcc = new Map<string, BreakdownAccumulator>()
        const levelAcc = new Map<string, BreakdownAccumulator>()
        const languageAcc = new Map<string, BreakdownAccumulator>()
        const gapTally = new Map<string, RecurringGapAccumulator>()
        const verdictCounts = {
            pass: 0,
            borderline: 0,
            fail: 0,
        }

        for (const attempt of attempts) {
            const isQna = attempt.mode === "qna"
            if (isQna) {
                qnaCount += 1
                this.accumulateQuestionReviews(
                    attempt.questionReviews,
                    attempt.createdAt,
                    kindAcc,
                )
                this.accumulateQuestionReviewsByLanguage(
                    attempt.questionReviews,
                    sessionById.get(attempt.sessionId),
                    attempt.createdAt,
                    languageAcc,
                )
            } else {
                designCount += 1
                this.accumulatePhaseScores(
                    attempt.phaseScores,
                    attempt.createdAt,
                    attempt.matchedContentIds,
                    phaseAcc,
                )
            }
            // attributeScores/level are graded on EVERY attempt regardless of
            // mode (not gated by isQna like phase/kind are)
            this.accumulateAttributeScores(
                attempt.attributeScores,
                attempt.createdAt,
                attempt.matchedContentIds,
                attributeAcc,
            )
            this.accumulateLevel(
                attempt.level,
                attempt.overallScore,
                attempt.createdAt,
                attempt.matchedContentIds,
                levelAcc,
            )
            this.accumulateGaps(
                attempt.gaps,
                gapTally,
            )
            if (attempt.verdict === "pass" || attempt.verdict === "borderline" || attempt.verdict === "fail") {
                verdictCounts[attempt.verdict] += 1
            }
        }

        const byPhase = this.finalizeBreakdown(phaseAcc)
        const byKind = this.finalizeBreakdown(kindAcc)
        const byAttribute = this.finalizeBreakdown(attributeAcc)
        const byLevel = this.finalizeBreakdown(levelAcc)
        const byLanguage = this.finalizeBreakdown(languageAcc)
            .filter((item) => item.attemptCount >= MIN_LANGUAGE_BREAKDOWN_SAMPLE)
        const recurringGaps = this.finalizeRecurringGaps(gapTally)
        const weakest = this.resolveWeakest(byPhase,
            phaseAcc,
            byKind,
            kindAcc,
            byAttribute,
            attributeAcc)

        return {
            insufficientData: false,
            modeSplit: {
                qnaCount,
                designCount,
            },
            trend,
            byPhase,
            byKind,
            byAttribute,
            byLevel,
            byLanguage,
            recurringGaps,
            weakest,
            verdictCounts,
        }
    }

    /**
     * Fold one `mode="design"` attempt's `phaseScores[]` into the per-phase
     * accumulator -- only entries whose `phase` is one of the 5 canonical
     * design phases are counted (a garbled/legacy literal is dropped, never
     * silently mixed in). The attempt's OWN `matchedContentIds[0]` is
     * recorded as this phase's deep-link candidate for THIS attempt when the
     * phase came in weak, so the weakest-entry resolver can pick the most
     * recent one without a second database pass.
     */
    private accumulatePhaseScores(
        phaseScores: unknown,
        createdAt: Date,
        matchedContentIds: Array<string>,
        acc: Map<string, BreakdownAccumulator>,
    ): void {
        for (const entry of toUnknownRecordArray(phaseScores)) {
            const phase = typeof entry.phase === "string" ? entry.phase : ""
            if (!DESIGN_PHASE_KEYS.has(phase)) {
                continue
            }
            const score = typeof entry.score === "number" ? entry.score : 0
            const max = typeof entry.max === "number" && entry.max > 0 ? entry.max : 0
            if (max <= 0) {
                continue
            }
            this.fold(acc,
                phase,
                score,
                max,
                createdAt,
                matchedContentIds[0] ?? null)
        }
    }

    /**
     * Fold one `mode="qna"` attempt's `questionReviews[]` into the per-kind
     * accumulator -- grouped by `kind` (theory/reasoning/scenario), each
     * entry's OWN `matchedContentId` recorded as this kind's deep-link
     * candidate for THIS attempt when the question came in weak.
     */
    private accumulateQuestionReviews(
        questionReviews: unknown,
        createdAt: Date,
        acc: Map<string, BreakdownAccumulator>,
    ): void {
        for (const entry of toUnknownRecordArray(questionReviews)) {
            const kind = typeof entry.kind === "string" ? entry.kind : ""
            if (kind.length === 0) {
                continue
            }
            const score = typeof entry.score === "number" ? entry.score : 0
            const max = typeof entry.max === "number" && entry.max > 0 ? entry.max : 0
            if (max <= 0) {
                continue
            }
            const matchedContentId = typeof entry.matchedContentId === "string" ? entry.matchedContentId : null
            this.fold(acc,
                kind,
                score,
                max,
                createdAt,
                matchedContentId)
        }
    }

    /**
     * Fold one `mode="qna"` attempt's `questionReviews[]` into the per-language
     * accumulator -- the language a question was drawn in lives on the SESSION
     * (`seedQuestions[questionIndex].givenCodes[0].lang`), not on the attempt,
     * so this joins each review to its drawn session (batch-fetched by the
     * caller) by `questionIndex`. Only CODE questions (a non-empty
     * `givenCodes`) carry a language -- a theory/reasoning question with no
     * given code is skipped, never defaulted into a fake "no language"
     * bucket. Missing session (drawn before session rows existed, or
     * resolved as undefined) skips the whole attempt's reviews.
     */
    private accumulateQuestionReviewsByLanguage(
        questionReviews: unknown,
        session: MockInterviewSessionEntity | undefined,
        createdAt: Date,
        acc: Map<string, BreakdownAccumulator>,
    ): void {
        if (!session || !session.seedQuestions) {
            return
        }
        for (const entry of toUnknownRecordArray(questionReviews)) {
            const questionIndex = typeof entry.questionIndex === "number" ? entry.questionIndex : -1
            const seed = questionIndex >= 0 ? session.seedQuestions[questionIndex] : undefined
            const lang = seed?.givenCodes?.[0]?.lang
            if (!seed || !lang) {
                continue
            }
            const score = typeof entry.score === "number" ? entry.score : 0
            const max = typeof entry.max === "number" && entry.max > 0 ? entry.max : 0
            if (max <= 0) {
                continue
            }
            const matchedContentId = typeof entry.matchedContentId === "string" ? entry.matchedContentId : null
            this.fold(acc,
                lang,
                score,
                max,
                createdAt,
                matchedContentId)
        }
    }

    /**
     * Fold one attempt's `attributeScores[]` into the per-attribute
     * accumulator -- reads EVERY attempt regardless of mode (unlike
     * `accumulatePhaseScores`/`accumulateQuestionReviews`, which are gated by
     * `isQna`). `max` has no persisted field on this entry (confirmed against
     * `grade-mock-interview-session-prompt.service.ts` -- the score is always
     * 0-100 direct), so it is fixed at {@link ATTRIBUTE_SCORE_MAX} for every
     * entry. The attempt's own `matchedContentIds[0]` is recorded as this
     * attribute's deep-link candidate for THIS attempt when it came in weak,
     * same as `accumulatePhaseScores` does.
     */
    private accumulateAttributeScores(
        attributeScores: unknown,
        createdAt: Date,
        matchedContentIds: Array<string>,
        acc: Map<string, BreakdownAccumulator>,
    ): void {
        for (const entry of toUnknownRecordArray(attributeScores)) {
            const key = typeof entry.key === "string" ? entry.key : ""
            if (key.length === 0) {
                continue
            }
            const score = typeof entry.score === "number" ? entry.score : 0
            this.fold(acc,
                key,
                score,
                ATTRIBUTE_SCORE_MAX,
                createdAt,
                matchedContentIds[0] ?? null)
        }
    }

    /**
     * Fold one attempt's `overallScore` into its seniority-level accumulator --
     * reads EVERY attempt regardless of mode, same as
     * {@link accumulateAttributeScores}. A null/legacy level (not one of the 3
     * canonical {@link VALID_LEVEL_KEYS}) is dropped rather than mixed into a
     * fake "any level" bucket.
     */
    private accumulateLevel(
        level: string | null,
        overallScore: number,
        createdAt: Date,
        matchedContentIds: Array<string>,
        acc: Map<string, BreakdownAccumulator>,
    ): void {
        if (!level || !VALID_LEVEL_KEYS.has(level)) {
            return
        }
        this.fold(acc,
            level,
            overallScore,
            ATTRIBUTE_SCORE_MAX,
            createdAt,
            matchedContentIds[0] ?? null)
    }

    /**
     * Tally one attempt's `gaps[]` into the recurring-gap map -- each entry is
     * trimmed+lowercased to a dedupe key (so "Trade-off" and "trade-off "
     * count as the same recurring gap), while the map keeps the
     * MOST-RECENTLY-SEEN original casing for display (attempts are scanned
     * newest-first).
     */
    private accumulateGaps(
        gaps: Array<string> | null | undefined,
        tally: Map<string, RecurringGapAccumulator>,
    ): void {
        for (const raw of gaps ?? []) {
            if (typeof raw !== "string") {
                continue
            }
            const text = raw.trim()
            if (text.length === 0) {
                continue
            }
            const key = text.toLowerCase()
            const existing = tally.get(key)
            if (existing) {
                existing.count += 1
            } else {
                tally.set(
                    key,
                    {
                        text,
                        count: 1,
                    },
                )
            }
        }
    }

    /** Turn the recurring-gap tally into the top-N, most-frequent-first array the response returns -- gaps seen fewer than {@link RECURRING_GAP_MIN_COUNT} times don't qualify (one mention is one bad session, not a pattern). */
    private finalizeRecurringGaps(
        tally: Map<string, RecurringGapAccumulator>,
    ): Array<MockInterviewCourseStatsRecurringGapData> {
        return [...tally.values()]
            .filter((entry) => entry.count >= RECURRING_GAP_MIN_COUNT)
            .sort((left, right) => right.count - left.count)
            .slice(0,
                RECURRING_GAPS_TOP_N)
            .map((entry) => ({
                text: entry.text,
                count: entry.count,
            }))
    }

    /** Fold one (score, max) observation for `key` into its accumulator, tracking a deep-link candidate when it's weak. */
    private fold(
        acc: Map<string, BreakdownAccumulator>,
        key: string,
        score: number,
        max: number,
        createdAt: Date,
        matchedContentId: string | null,
    ): void {
        const existing = acc.get(key) ?? {
            scoreSum: 0,
            maxSum: 0,
            weakCount: 0,
            attemptCount: 0,
            weakMatches: [],
        }
        existing.scoreSum += score
        existing.maxSum += max
        existing.attemptCount += 1
        if (score / max < WEAK_THRESHOLD) {
            existing.weakCount += 1
            existing.weakMatches.push({
                createdAt,
                matchedContentId,
            })
        }
        acc.set(key,
            existing)
    }

    /** Turn an accumulator map into the sorted (weakest-first) breakdown array the response returns. */
    private finalizeBreakdown(
        acc: Map<string, BreakdownAccumulator>,
    ): Array<MockInterviewCourseStatsBreakdownItemData> {
        return [...acc.entries()]
            .map(([key,
                entry]) => ({
                key,
                avgScore: entry.attemptCount > 0 ? entry.scoreSum / entry.attemptCount : 0,
                avgMax: entry.attemptCount > 0 ? entry.maxSum / entry.attemptCount : 0,
                weakCount: entry.weakCount,
                attemptCount: entry.attemptCount,
            }))
            .sort((left, right) => (left.avgScore / (left.avgMax || 1)) - (right.avgScore / (right.avgMax || 1)))
    }

    /**
     * Pick the single weakest entry across BOTH axes (lowest score/max ratio
     * AND weak often enough to be a real pattern -- `weakCount >=
     * WEAK_MIN_COUNT`, not one bad day), resolving its deep-link from the
     * MOST RECENT attempt where it came in weak.
     */
    private resolveWeakest(
        byPhase: Array<MockInterviewCourseStatsBreakdownItemData>,
        phaseAcc: Map<string, BreakdownAccumulator>,
        byKind: Array<MockInterviewCourseStatsBreakdownItemData>,
        kindAcc: Map<string, BreakdownAccumulator>,
        byAttribute: Array<MockInterviewCourseStatsBreakdownItemData>,
        attributeAcc: Map<string, BreakdownAccumulator>,
    ): MockInterviewCourseStatsWeakestData | null {
        const candidates: Array<{ item: MockInterviewCourseStatsBreakdownItemData, axis: "phase" | "kind" | "attribute", acc: Map<string, BreakdownAccumulator> }> = [
            ...byPhase.map((item) => ({
                item, axis: "phase" as const, acc: phaseAcc
            })),
            ...byKind.map((item) => ({
                item, axis: "kind" as const, acc: kindAcc
            })),
            ...byAttribute.map((item) => ({
                item, axis: "attribute" as const, acc: attributeAcc
            })),
        ].filter((candidate) => candidate.item.weakCount >= WEAK_MIN_COUNT)

        if (candidates.length === 0) {
            return null
        }

        const weakest = candidates.sort(
            (left, right) => (left.item.avgScore / (left.item.avgMax || 1)) - (right.item.avgScore / (right.item.avgMax || 1)),
        )[0]

        const weakMatches = weakest.acc.get(weakest.item.key)?.weakMatches ?? []
        const mostRecent = [...weakMatches].sort(
            (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
        )[0]

        return {
            key: weakest.item.key,
            axis: weakest.axis,
            avgScore: weakest.item.avgScore,
            avgMax: weakest.item.avgMax,
            weakCount: weakest.item.weakCount,
            matchedContentId: mostRecent?.matchedContentId ?? null,
        }
    }

    /**
     * Whether a projection row is past its freshness window.
     *
     * @param updatedAt - the row's last write time.
     * @returns true when older than the configured TTL.
     */
    private isStale(updatedAt: Date): boolean {
        return Date.now() - updatedAt.getTime() > envConfig().projection.staleAfterMs
    }
}
