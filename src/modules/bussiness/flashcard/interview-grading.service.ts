import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    AiMode,
    CreditUsageHistoryEntity,
    InjectPrimaryPostgreSQLEntityManager,
    InterviewAttemptEntity,
} from "@modules/databases"
import type {
    FlashcardCardEntity,
} from "@modules/databases"
import {
    AiEntitlementService,
    AiInvokeService,
    extractJsonBlock,
    ModelRecommendation,
    resolveGradingCreditCost,
    resolveGradingInvokeOptions,
} from "@modules/ai"
import type {
    AiJobSelection,
} from "@modules/ai"
import {
    envConfig,
} from "@modules/env"
import {
    AiQuotaExhaustedException,
    FlashcardCardMissingAnswerException,
    FlashcardCardNotFoundException,
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    CreditUsageService,
} from "../credit/credit-usage.service"
import {
    FlashcardDeckReadService,
} from "./flashcard-deck.service"
import {
    InterviewGradePromptService,
} from "./interview-grade-prompt.service"
import {
    InterviewVerdict,
    type GradeInterviewAnswerParams,
    type InterviewGradeResult,
} from "./types/interview-grade"

/** Minimum allowed interview score. */
const MIN_SCORE = 0

/** Maximum allowed interview score. */
const MAX_SCORE = 100

/** Score at/above which a missing/garbled verdict falls back to a pass. */
const PASS_SCORE_THRESHOLD = 75

/** Score at/above which a missing/garbled verdict falls back to borderline (below → fail). */
const BORDERLINE_SCORE_THRESHOLD = 50

/**
 * Stateless interview-answer grading. Loads the question card from its deck,
 * builds the grading prompt from the card's model answer, invokes the shared AI
 * grading lane, and parses the strict-JSON result. Persists nothing (P0).
 */
@Injectable()
export class InterviewGradingService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly flashcardDeckReadService: FlashcardDeckReadService,
        private readonly interviewGradePromptService: InterviewGradePromptService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly creditUsageService: CreditUsageService,
    ) { }

    /**
     * Grade one transcribed interview answer against its card's model answer.
     *
     * @param params - User, deck/card ids, transcript, locale, and optional lane.
     * @returns The parsed, normalized grade result.
     * @throws FlashcardDeckNotFoundException when the deck is absent.
     * @throws FlashcardCardNotFoundException when the card is not in the deck.
     * @throws FlashcardCardMissingAnswerException when the card has no model answer.
     * @throws AiQuotaExhaustedException when the user is over the rolling Auto credit pool.
     * @throws ParsingCriteriaResultsFromModelTextException when the model output is not parseable JSON.
     */
    async grade(
        params: GradeInterviewAnswerParams,
    ): Promise<InterviewGradeResult> {
        const {
            userId,
            flashcardDeckId,
            flashcardCardId,
            transcript,
            locale,
            mode,
        } = params

        // load the full deck (cards embedded) and pick the question card server-side —
        // never trust a question / rubric sent by the client
        const deck = await this.flashcardDeckReadService.getById(
            flashcardDeckId,
            locale,
        )
        const card = deck.cards?.find(
            (candidate) => candidate.id === flashcardCardId,
        )
        if (!card) {
            throw new FlashcardCardNotFoundException({
                flashcardCardId,
            })
        }
        // legacy cards predating the Q&A format have a nullable answer → cannot grade
        if (!card.answer) {
            throw new FlashcardCardMissingAnswerException({
                flashcardCardId,
            })
        }

        // gate the free Auto lane against the shared rolling credit pool — interview
        // grading always runs on the pinned gpt-4o Auto lane, so block once the user is
        // over quota instead of leaking unbounded free gpt-4o calls behind the throttler
        const creditSnapshot = await this.creditUsageService.getSnapshot(userId)
        if (creditSnapshot.overQuota) {
            throw new AiQuotaExhaustedException({
                mode: AiMode.Auto,
                window: "credit",
            })
        }

        // P0 only carries an optional mode; only an explicit Auto pick is constructible
        // here (Premium / Byok need a model + provider the client does not send), so any
        // other value falls through to the resolver's default Auto lane (pinned gpt-4o).
        const selection: AiJobSelection | undefined = mode === AiMode.Auto
            ? {
                mode: AiMode.Auto,
            }
            : undefined
        const invokeOptions = await resolveGradingInvokeOptions({
            userId,
            selection,
            aiEntitlementService: this.aiEntitlementService,
        })

        // build the grading messages from the question + model-answer rubric + transcript
        const { messages } = this.interviewGradePromptService.build({
            question: card.question,
            modelAnswer: card.answer,
            level: card.level,
            transcript,
            locale,
        })

        // invoke on the resolved lane (temperature defaults to 0 → deterministic grading)
        const { text } = await this.aiInvokeService.invoke({
            messages,
            ...invokeOptions,
        })

        // charge the Auto credit pool for this gpt-4o call NOW — before parsing — so a
        // malformed model response can never leak a free grading call
        await this.recordAutoCreditUsage(userId)

        const result = this.parse(text)
        // record the graded attempt for cross-session interview history (best-effort —
        // a history write must never fail the grade the user is waiting on)
        await this.recordAttempt({
            userId,
            flashcardDeckId,
            card,
            score: result.score,
            verdict: result.verdict,
        })
        return result
    }

    /**
     * Append an {@link InterviewAttemptEntity} row for one graded answer so the
     * learner's interview history (average score, pass rate, weak topics) can be
     * computed later. Best-effort: a failure here is swallowed so it can never sink
     * the grade result the user is waiting on.
     *
     * @param params - User + deck + the graded card and its score/verdict.
     */
    private async recordAttempt(
        params: {
            userId: string
            flashcardDeckId: string
            card: FlashcardCardEntity
            score: number
            verdict: string
        },
    ): Promise<void> {
        const {
            userId,
            flashcardDeckId,
            card,
            score,
            verdict,
        } = params
        try {
            await this.entityManager.save(
                InterviewAttemptEntity,
                {
                    user: {
                        id: userId,
                    },
                    flashcardDeck: {
                        id: flashcardDeckId,
                    },
                    flashcardCard: {
                        id: card.id,
                    },
                    score,
                    verdict,
                    // snapshot the level + tags at answer time for history aggregation
                    level: card.level ?? null,
                    tags: card.tags ?? [],
                },
            )
        } catch {
            // history is non-critical — never fail the grade over a logging write
        }
    }

    /**
     * Persist an Auto-lane {@link CreditUsageHistoryEntity} row for one interview
     * grading run, then bust the user's cached usage so the next gate sees it.
     * The row carries no attempt — interview practice is stateless and not tied to
     * a challenge — but still counts toward the same rolling Auto credit pool.
     *
     * @param userId - The user charged for the gpt-4o grading call.
     */
    private async recordAutoCreditUsage(
        userId: string,
    ): Promise<void> {
        // Auto lane is flat-priced; recommendation only matters for the Premium tiers
        const recommendation = envConfig().ai.modelRecommendation as ModelRecommendation
        await this.entityManager.save(
            CreditUsageHistoryEntity,
            {
                user: {
                    id: userId,
                },
                // stateless interview grading is not tied to a challenge attempt
                attempt: null,
                mode: AiMode.Auto,
                // Auto lane has no premium tier / pinned model to attribute
                recommendation: null,
                model: null,
                provider: null,
                credits: resolveGradingCreditCost({
                    mode: AiMode.Auto,
                    recommendation,
                }),
            },
        )
        // drop the cached totals so the next getSnapshot recomputes including this charge
        await this.creditUsageService.invalidate(userId)
    }

    /**
     * Parse + normalize the model's strict-JSON response into an
     * {@link InterviewGradeResult}, clamping the score and coercing the verdict.
     *
     * @param raw - The raw model response text.
     * @returns The normalized grade result.
     * @throws ParsingCriteriaResultsFromModelTextException when JSON parsing fails.
     */
    private parse(
        raw: string,
    ): InterviewGradeResult {
        let parsed: Record<string, unknown>
        try {
            // strip any fence / prose then parse the JSON object
            parsed = JSON.parse(extractJsonBlock(raw)) as Record<string, unknown>
        } catch (error) {
            throw new ParsingCriteriaResultsFromModelTextException({
                text: raw,
                originalError: error instanceof Error
                    ? error
                    : undefined,
            })
        }

        // score is normalized first so the verdict can fall back to it when the model
        // returns a missing / unrecognized verdict literal
        const score = this.normalizeScore(parsed.score)
        return {
            score,
            verdict: this.normalizeVerdict(
                parsed.verdict,
                score,
            ),
            strengths: this.normalizeStringArray(parsed.strengths),
            gaps: this.normalizeStringArray(parsed.gaps),
            modelAnswerHint: this.normalizeNullableString(parsed.modelAnswerHint),
            followUpQuestion: this.normalizeNullableString(parsed.followUpQuestion),
        }
    }

    /**
     * Coerce an unknown score to an integer clamped to [{@link MIN_SCORE}, {@link MAX_SCORE}].
     *
     * @param value - The raw score value from the parsed JSON.
     * @returns A clamped integer score (defaults to {@link MIN_SCORE} when not numeric).
     */
    private normalizeScore(
        value: unknown,
    ): number {
        const numeric = typeof value === "number"
            ? value
            : Number(value)
        if (!Number.isFinite(numeric)) {
            return MIN_SCORE
        }
        return Math.min(
            MAX_SCORE,
            Math.max(
                MIN_SCORE,
                Math.round(numeric),
            ),
        )
    }

    /**
     * Coerce an unknown verdict to a valid {@link InterviewVerdict}. When the model
     * returns a missing / unrecognized verdict literal, fall back to one derived from
     * the score so a strong answer is not mislabeled "fail" over a garbled string.
     *
     * @param value - The raw verdict value from the parsed JSON.
     * @param scoreFallback - The already-normalized score to derive a verdict from on a miss.
     * @returns A valid verdict enum member.
     */
    private normalizeVerdict(
        value: unknown,
        scoreFallback: number,
    ): InterviewVerdict {
        const candidate = typeof value === "string"
            ? value.trim().toLowerCase()
            : ""
        const match = Object.values(InterviewVerdict).find(
            (verdict) => verdict === candidate,
        )
        return match ?? this.verdictFromScore(scoreFallback)
    }

    /**
     * Derive a verdict from a normalized score, used only as a fallback when the
     * model's own verdict literal is missing or unrecognized.
     *
     * @param score - The normalized [0, 100] score.
     * @returns Pass at/above {@link PASS_SCORE_THRESHOLD}, Borderline at/above
     *   {@link BORDERLINE_SCORE_THRESHOLD}, otherwise Fail.
     */
    private verdictFromScore(
        score: number,
    ): InterviewVerdict {
        if (score >= PASS_SCORE_THRESHOLD) {
            return InterviewVerdict.Pass
        }
        if (score >= BORDERLINE_SCORE_THRESHOLD) {
            return InterviewVerdict.Borderline
        }
        return InterviewVerdict.Fail
    }

    /**
     * Coerce an unknown value to an array of trimmed non-empty strings.
     *
     * @param value - The raw array value from the parsed JSON.
     * @returns A clean string array (empty when the value is not an array).
     */
    private normalizeStringArray(
        value: unknown,
    ): Array<string> {
        if (!Array.isArray(value)) {
            return []
        }
        return value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
    }

    /**
     * Coerce an unknown value to a trimmed non-empty string, or null.
     *
     * @param value - The raw value from the parsed JSON.
     * @returns The trimmed string, or null when absent/blank.
     */
    private normalizeNullableString(
        value: unknown,
    ): string | null {
        if (typeof value !== "string") {
            return null
        }
        const trimmed = value.trim()
        return trimmed.length > 0
            ? trimmed
            : null
    }
}
