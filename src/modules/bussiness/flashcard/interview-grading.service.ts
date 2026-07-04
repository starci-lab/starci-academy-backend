import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    AiCeilSurface,
    AiMode,
    AiModelTask,
    FlashcardDeckEntity,
    InjectPrimaryPostgreSQLEntityManager,
    InterviewAttemptEntity,
} from "@modules/databases"
import type {
    FlashcardCardEntity,
} from "@modules/databases"
import {
    AiEntitlementService,
    AiInvokeService,
    GradingLaneValidationService,
    extractJsonBlock,
    validatedLaneToAiJobSelection,
} from "@modules/ai"
import {
    FlashcardCardMissingAnswerException,
    FlashcardCardNotFoundException,
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
import {
    UserService,
} from "../user"
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
 * Interview-answer grading. Loads the question card from its deck, builds the
 * grading prompt from the card's model answer, invokes the shared AI grading
 * lane, and parses the strict-JSON result. Also records the AI credit charge
 * (surfaced on the "Lịch sử dùng AI" page) and an {@link InterviewAttemptEntity}
 * row for cross-session history.
 */
@Injectable()
export class InterviewGradingService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly flashcardDeckReadService: FlashcardDeckReadService,
        private readonly interviewGradePromptService: InterviewGradePromptService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly userService: UserService,
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
            interviewSessionId,
            transcript,
            locale,
            mode,
            selectedModel,
            selectedModelProvider,
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

        // gate on the SAME unified credit pool every other grading surface reads
        // (tier-aware — a paid Pro/Max user gets their tier's real ceiling, not the
        // free 50/5h · 250/week base). Byok is never gated (user's own key).
        if (mode !== AiMode.Byok) {
            await this.aiEntitlementService.assertNotOverQuota({
                userId,
            })
        }

        // validate the chosen grading lane (mode + optional model/provider) against the
        // user's entitlement and the ai_models catalog, then collapse it into the AI job
        // selection. No pick (Auto, no model) validates to the default Auto lane → behaves
        // exactly as before. Mirrors the challenge-grading wiring.
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId,
            mode,
            model: selectedModel,
            provider: selectedModelProvider,
        })
        const selection = validatedLaneToAiJobSelection(validatedLane)
        // build the grading messages from the question + model-answer rubric + transcript
        const { messages } = this.interviewGradePromptService.build({
            question: card.question,
            modelAnswer: card.answer,
            level: card.level,
            transcript,
            locale,
        })

        // ONE shared entry (temperature defaults to 0 → deterministic grading)
        const {
            text, model, provider, cost, promptTokens, completionTokens, attempts,
        } = await this.aiInvokeService.run({
            userId,
            messages,
            selection,
            surface: AiCeilSurface.Interview,
        })

        // charge NOW — before parsing — so a malformed model response can never leak a
        // free grading call. Billed by the model that served (free 0 / economy 5 / …).
        // Uses the RESOLVED lane (validatedLane.mode), not the raw request — an omitted
        // mode resolves to Auto, matching the old hard-coded behavior for that case, but
        // an explicit Premium/Byok pick is now billed/recorded correctly (was previously
        // always recorded as Auto regardless of what actually ran).
        await this.aiEntitlementService.consume({
            userId,
            mode: validatedLane.mode,
            cost,
            surface: AiCeilSurface.Interview,
            task: AiModelTask.Grading,
            model,
            provider,
            promptTokens,
            completionTokens,
            attempts,
        })

        const result = this.parse(text)
        // record the graded attempt for cross-session interview history (best-effort —
        // a history write must never fail the grade the user is waiting on)
        await this.recordAttempt({
            userId,
            flashcardDeckId,
            interviewSessionId,
            card,
            score: result.score,
            verdict: result.verdict,
            // persist the feedback so a past run's detail can show it later
            strengths: result.strengths,
            gaps: result.gaps,
            modelAnswerHint: result.modelAnswerHint,
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
            interviewSessionId?: string
            card: FlashcardCardEntity
            score: number
            verdict: string
            strengths: Array<string>
            gaps: Array<string>
            modelAnswerHint: string | null
        },
    ): Promise<void> {
        const {
            userId,
            flashcardDeckId,
            interviewSessionId,
            card,
            score,
            verdict,
            strengths,
            gaps,
            modelAnswerHint,
        } = params
        try {
            // resolve the course (deck → course) and resolve-or-create the trial
            // enrollment (user × course) so we can key the attempt by enrollment —
            // the anchor going forward — while still setting user_id during the
            // re-key transition. A deck without a course leaves enrollment unset.
            const deck = await this.entityManager.findOne(
                FlashcardDeckEntity,
                {
                    where: {
                        id: flashcardDeckId,
                    },
                },
            )
            const courseId = deck?.courseId ?? null
            const enrollment = courseId
                ? await this.userService.resolveOrCreateTrialEnrollment(
                    userId,
                    courseId,
                )
                : null
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
                    // group this answer back into its run for session-level history
                    interviewSessionId: interviewSessionId ?? null,
                    // snapshot the feedback for the run-detail drawer
                    strengths,
                    gaps,
                    modelAnswerHint,
                    ...(enrollment
                        ? {
                            enrollment,
                        }
                        : {
                        }),
                },
            )
        } catch {
            // history is non-critical — never fail the grade over a logging write
        }
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
