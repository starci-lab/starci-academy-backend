import {
    Injectable,
} from "@nestjs/common"
import {
    AiMode,
} from "@modules/databases"
import {
    AiEntitlementService,
    AiInvokeService,
    extractJsonBlock,
    resolveGradingInvokeOptions,
} from "@modules/ai"
import type {
    AiJobSelection,
} from "@modules/ai"
import {
    FlashcardCardMissingAnswerException,
    FlashcardCardNotFoundException,
    ParsingCriteriaResultsFromModelTextException,
} from "@modules/exceptions"
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

/**
 * Stateless interview-answer grading. Loads the question card from its deck,
 * builds the grading prompt from the card's model answer, invokes the shared AI
 * grading lane, and parses the strict-JSON result. Persists nothing (P0).
 */
@Injectable()
export class InterviewGradingService {
    constructor(
        private readonly flashcardDeckReadService: FlashcardDeckReadService,
        private readonly interviewGradePromptService: InterviewGradePromptService,
        private readonly aiInvokeService: AiInvokeService,
        private readonly aiEntitlementService: AiEntitlementService,
    ) { }

    /**
     * Grade one transcribed interview answer against its card's model answer.
     *
     * @param params - User, deck/card ids, transcript, locale, and optional lane.
     * @returns The parsed, normalized grade result.
     * @throws FlashcardDeckNotFoundException when the deck is absent.
     * @throws FlashcardCardNotFoundException when the card is not in the deck.
     * @throws FlashcardCardMissingAnswerException when the card has no model answer.
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

        return this.parse(text)
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

        return {
            score: this.normalizeScore(parsed.score),
            verdict: this.normalizeVerdict(parsed.verdict),
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
     * Coerce an unknown verdict to a valid {@link InterviewVerdict}, defaulting
     * to {@link InterviewVerdict.Fail} when it is missing or unrecognized.
     *
     * @param value - The raw verdict value from the parsed JSON.
     * @returns A valid verdict enum member.
     */
    private normalizeVerdict(
        value: unknown,
    ): InterviewVerdict {
        const candidate = typeof value === "string"
            ? value.trim().toLowerCase()
            : ""
        const match = Object.values(InterviewVerdict).find(
            (verdict) => verdict === candidate,
        )
        return match ?? InterviewVerdict.Fail
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
