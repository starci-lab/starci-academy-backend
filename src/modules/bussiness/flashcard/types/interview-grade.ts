import type {
    AiMode,
    FlashcardLevel,
    Locale,
} from "@modules/databases"
import type {
    BaseMessage,
} from "@langchain/core/messages"

/**
 * Verdict the model assigns to a graded interview answer. A coarse pass/borderline/fail
 * band that complements the numeric {@link InterviewGradeResult.score}.
 */
export enum InterviewVerdict {
    /** Answer is solid for the card's level — clear hire signal. */
    Pass = "pass",
    /** Answer is partial — some substance, notable gaps. */
    Borderline = "borderline",
    /** Answer misses the point or is largely wrong for the card's level. */
    Fail = "fail",
}

/** Params for {@link InterviewGradingService.grade}. */
export interface GradeInterviewAnswerParams {
    /** Id of the user whose AI lane gates the grading invoke. */
    userId: string
    /** Deck the question card belongs to (loaded server-side, never trusted from the client). */
    flashcardDeckId: string
    /** Card whose question + model answer form the prompt + rubric. */
    flashcardCardId: string
    /** The candidate's answer, already transcribed from speech on the client. */
    transcript: string
    /** Locale to load the deck in and to write the feedback strings in. */
    locale: Locale
    /** Optional lane override; only Auto is constructible from the mutation input (P0). */
    mode?: AiMode
}

/** The graded result for one stateless interview answer. */
export interface InterviewGradeResult {
    /** Integer 0–100 overall score for the answer. */
    score: number
    /** Coarse pass/borderline/fail band. */
    verdict: InterviewVerdict
    /** Concrete things the candidate got right. */
    strengths: Array<string>
    /** Concrete things missing or wrong, framed as what to add. */
    gaps: Array<string>
    /** One-line nudge toward the model answer, or null when omitted. */
    modelAnswerHint: string | null
    /** A natural follow-up an interviewer would ask next, or null when omitted. */
    followUpQuestion: string | null
}

/** Params for {@link InterviewGradePromptService.build}. */
export interface BuildInterviewGradePromptParams {
    /** The interview question prompt (Markdown). */
    question: string
    /** The card's model answer, used as the grading rubric (Markdown). */
    modelAnswer: string
    /** Seniority level the card targets, scaling grading strictness; null when unknown. */
    level: FlashcardLevel | null
    /** The candidate's speech-to-text transcript to grade. */
    transcript: string
    /** Locale the feedback strings must be written in. */
    locale: Locale
}

/** Result of {@link InterviewGradePromptService.build}. */
export interface BuildInterviewGradePromptResult {
    /** Ordered system + human chat messages ready for {@link AiInvokeService.invoke}. */
    messages: Array<BaseMessage>
}
