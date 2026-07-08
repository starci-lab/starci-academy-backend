import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    MockInterviewAttemptEntity,
    MockInterviewPhase,
    UserMockInterviewCourseStatsProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    MockInterviewCourseStatsBreakdownItemData,
    MockInterviewCourseStatsTrendPointData,
    MockInterviewCourseStatsWeakestData,
    RecomputeUserMockInterviewCourseStatsParams,
    UserMockInterviewCourseStatsParams,
    UserMockInterviewCourseStatsResult,
} from "./types"

/** How many most-recent completed attempts to scan for the aggregation — bounds the aggregation cost. */
const STATS_SCAN_CAP = 50

/** How many of the most recent scanned attempts feed the trend line. */
const STATS_TREND_LENGTH = 10

/** Below this many scanned attempts, every aggregate is noise — HONEST gate, mirrors the FE Scorecard/FlashcardStats convention of never showing a stat derived from too small a sample. */
const MIN_ATTEMPTS_FOR_STATS = 3

/** A phase/kind below this fraction of its max is "weak" — mirrors `MockInterviewScorecard`'s own `WEAK_PHASE_THRESHOLD`. */
const WEAK_THRESHOLD = 0.6

/** A phase/kind must be weak at least this many times before it is surfaced as THE pattern to fix (not one bad day). */
const WEAK_MIN_COUNT = 3

/** `attributeScores` entries have no `max` field — always 0-100 direct, so every fold treats `max` as this fixed constant. */
const ATTRIBUTE_SCORE_MAX = 100

/** The 5 canonical design phase literals — `byPhase` only ever aggregates these (a legacy/garbled phase literal is dropped, never silently mixed in). */
const DESIGN_PHASE_KEYS: ReadonlySet<string> = new Set(Object.values(MockInterviewPhase))

/** One phase-score entry, as persisted (loosely typed jsonb on the entity). */
interface RawPhaseScore {
    phase?: unknown
    score?: unknown
    max?: unknown
}

/** One question-review entry, as persisted (loosely typed jsonb on the entity). */
interface RawQuestionReview {
    kind?: unknown
    score?: unknown
    max?: unknown
    matchedContentId?: unknown
}

/** One attribute-score entry, as persisted (loosely typed jsonb on the entity) — always one of the 3 fixed keys (communication/structuredThinking/tradeoffAwareness), no `max` field (fixed at 100). */
interface RawAttributeScore {
    key?: unknown
    score?: unknown
}

/** Accumulator for one breakdown key (phase or kind) while scanning attempts. */
interface BreakdownAccumulator {
    scoreSum: number
    maxSum: number
    weakCount: number
    attemptCount: number
    /** Attempt createdAt + matchedContentId candidates, newest-scanned-first, for resolving the weakest entry's deep-link without a second pass. */
    weakMatches: Array<{ createdAt: Date, matchedContentId: string | null }>
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
    weakest: null,
    verdictCounts: {
        pass: 0,
        borderline: 0,
        fail: 0,
    },
}

/**
 * CQRS projection service for a user's mock-interview COURSE stats — one row
 * per enrollment. The heavy attempts scan + fold (trend / mode split / two
 * breakdown axes / weakest) runs ONLY in {@link recompute} (the projector,
 * triggered by CDC on `mock_interview_attempts`), building the aggregate
 * jsonb. {@link getStats} reads the flat row with a TTL lazy-refresh — no
 * per-request scan/fold.
 *
 * This mirrors what `MyMockInterviewStatsService.compute` used to do inline
 * on every read (a bounded ≤50-row scan) — a violation of
 * `.claude/be/rules/cqrs-no-inline-aggregate.md` ("kể cả scale nhỏ").
 */
@Injectable()
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
        // missing / past freshness window → recompute + re-read
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
            weakest: value.weakest ?? null,
            verdictCounts: value.verdictCounts ?? EMPTY_RESULT.verdictCounts,
        }
    }

    /**
     * The full aggregate — trend / mode split / both breakdown axes /
     * weakest — COPIED verbatim (parameterized by `enrollmentId`) from
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

        // `attempts` is newest-first (DESC); reverse to oldest-first, then take
        // the last N of that ascending list — i.e. the most recent N attempts,
        // oldest-of-those-first, which is what a left-to-right trend line wants
        const trend: Array<MockInterviewCourseStatsTrendPointData> = [...attempts]
            .reverse()
            .slice(-STATS_TREND_LENGTH)
            .map((attempt) => ({
                completedAt: attempt.createdAt,
                overallScore: attempt.overallScore,
                // a null-mode legacy attempt predates the "mode split" — the only
                // mode that could have existed then was design
                mode: attempt.mode ?? "design",
                verdict: attempt.verdict,
            }))

        let qnaCount = 0
        let designCount = 0
        const phaseAcc = new Map<string, BreakdownAccumulator>()
        const kindAcc = new Map<string, BreakdownAccumulator>()
        const attributeAcc = new Map<string, BreakdownAccumulator>()
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
                    attempt.questionReviews as unknown as Array<RawQuestionReview>,
                    attempt.createdAt,
                    kindAcc,
                )
            } else {
                designCount += 1
                this.accumulatePhaseScores(
                    attempt.phaseScores as unknown as Array<RawPhaseScore>,
                    attempt.createdAt,
                    attempt.matchedContentIds,
                    phaseAcc,
                )
            }
            // attributeScores is graded on EVERY attempt regardless of mode
            // (not gated by isQna like phase/kind are)
            this.accumulateAttributeScores(
                attempt.attributeScores as unknown as Array<RawAttributeScore>,
                attempt.createdAt,
                attempt.matchedContentIds,
                attributeAcc,
            )
            if (attempt.verdict === "pass" || attempt.verdict === "borderline" || attempt.verdict === "fail") {
                verdictCounts[attempt.verdict] += 1
            }
        }

        const byPhase = this.finalizeBreakdown(phaseAcc)
        const byKind = this.finalizeBreakdown(kindAcc)
        const byAttribute = this.finalizeBreakdown(attributeAcc)
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
            weakest,
            verdictCounts,
        }
    }

    /**
     * Fold one `mode="design"` attempt's `phaseScores[]` into the per-phase
     * accumulator — only entries whose `phase` is one of the 5 canonical
     * design phases are counted (a garbled/legacy literal is dropped, never
     * silently mixed in). The attempt's OWN `matchedContentIds[0]` is
     * recorded as this phase's deep-link candidate for THIS attempt when the
     * phase came in weak, so the weakest-entry resolver can pick the most
     * recent one without a second database pass.
     */
    private accumulatePhaseScores(
        phaseScores: Array<RawPhaseScore> | null | undefined,
        createdAt: Date,
        matchedContentIds: Array<string>,
        acc: Map<string, BreakdownAccumulator>,
    ): void {
        for (const entry of phaseScores ?? []) {
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
     * accumulator — grouped by `kind` (theory/reasoning/scenario), each
     * entry's OWN `matchedContentId` recorded as this kind's deep-link
     * candidate for THIS attempt when the question came in weak.
     */
    private accumulateQuestionReviews(
        questionReviews: Array<RawQuestionReview> | null | undefined,
        createdAt: Date,
        acc: Map<string, BreakdownAccumulator>,
    ): void {
        for (const entry of questionReviews ?? []) {
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
     * Fold one attempt's `attributeScores[]` into the per-attribute
     * accumulator — reads EVERY attempt regardless of mode (unlike
     * `accumulatePhaseScores`/`accumulateQuestionReviews`, which are gated by
     * `isQna`). `max` has no persisted field on this entry (confirmed against
     * `grade-mock-interview-session-prompt.service.ts` — the score is always
     * 0-100 direct), so it is fixed at {@link ATTRIBUTE_SCORE_MAX} for every
     * entry. The attempt's own `matchedContentIds[0]` is recorded as this
     * attribute's deep-link candidate for THIS attempt when it came in weak,
     * same as `accumulatePhaseScores` does.
     */
    private accumulateAttributeScores(
        attributeScores: Array<RawAttributeScore> | null | undefined,
        createdAt: Date,
        matchedContentIds: Array<string>,
        acc: Map<string, BreakdownAccumulator>,
    ): void {
        for (const entry of attributeScores ?? []) {
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
     * AND weak often enough to be a real pattern — `weakCount >=
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
