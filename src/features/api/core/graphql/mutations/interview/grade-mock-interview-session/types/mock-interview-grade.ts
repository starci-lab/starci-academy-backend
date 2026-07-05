import type {
    BaseMessage,
} from "@langchain/core/messages"
import type {
    Locale,
    ModelProvider,
    MockInterviewPhase,
} from "@modules/databases"

/**
 * Coarse pass/borderline/fail band assigned to a graded mock-interview
 * SESSION. Mirrors the shape of the flashcard-domain `InterviewVerdict` enum
 * but is intentionally a SEPARATE, decoupled type — mock-interview grading
 * must not import from the flashcard domain.
 */
export enum MockInterviewVerdict {
    /** Session is solid for the requested level — clear hire signal. */
    Pass = "pass",
    /** Session is partial — some substance, notable gaps. */
    Borderline = "borderline",
    /** Session misses the point or is largely wrong for the requested level. */
    Fail = "fail",
}

/** One turn of the recorded mock-interview transcript. */
export interface MockInterviewTurnRecord {
    /** Who spoke this turn — the AI interviewer or the candidate. */
    role: string
    /** Which of the 5 canonical phases this turn belongs to. */
    phase: MockInterviewPhase
    /** The turn's text content (candidate turns are speech-to-text transcribed). */
    content: string
}

/**
 * Per-phase score breakdown entry inside a graded session result. `phase` is
 * kept as a plain string (not the {@link MockInterviewPhase} enum) because it
 * is parsed straight out of the model's free-form JSON response and persisted
 * as-is into a jsonb column — a garbled/unrecognized literal is filtered out
 * during normalization rather than crashing the whole grade.
 */
export interface MockInterviewPhaseScore {
    /** One of the 5 canonical {@link MockInterviewPhase} values, as returned by the model. */
    phase: string
    /** Score the model assigned to this phase. */
    score: number
    /** Maximum possible score for this phase (phase maxes sum to 100). */
    max: number
}

/** Per-attribute score breakdown entry inside a graded session result. */
export interface MockInterviewAttributeScore {
    /** Named evaluation attribute (e.g. "communication", "structuredThinking"). */
    key: string
    /** Score 0–100 the model assigned to this attribute. */
    score: number
}

/** Params for {@link MockInterviewGradingService.grade}. */
export interface GradeMockInterviewSessionParams {
    /** Id of the user whose AI lane gates the grading invoke and who owns the persisted attempt. */
    userId: string
    /** Course the session belongs to — scopes both RAG retrieval and the resolved enrollment. */
    courseId: string
    /** The prompt the learner worked through (a milestone-task id, or a future AI-generated prompt id). */
    promptId: string
    /** Snapshot of the prompt's title, persisted alongside the attempt for history display. */
    promptTitle: string
    /** Seniority level the session was graded against, or null for "any level". */
    level: string | null
    /** The full recorded transcript, one entry per conversational turn. */
    turns: Array<MockInterviewTurnRecord>
    /** Client-generated id grouping this attempt into its interview run. */
    sessionId: string
    /** Locale to write the feedback strings in. */
    locale: Locale
    /** Concrete model the user picked in the grading dropdown; null/undefined = balancer default. */
    selectedModel?: string
    /** Provider serving {@link GradeMockInterviewSessionParams.selectedModel}. */
    selectedModelProvider?: ModelProvider
}

/** The graded result for one whole mock-interview session. */
export interface MockInterviewGradeSessionResult {
    /** Integer 0–100 overall score for the whole session. */
    overallScore: number
    /** Coarse pass/borderline/fail band. */
    verdict: MockInterviewVerdict
    /** Per-phase score breakdown, one entry per phase the model chose to score. */
    phaseScores: Array<MockInterviewPhaseScore>
    /** Per-attribute score breakdown (communication, structured thinking, …). */
    attributeScores: Array<MockInterviewAttributeScore>
    /** Concrete things the candidate got right across the session. */
    strengths: Array<string>
    /** Concrete things missing or wrong, framed as what to add. */
    gaps: Array<string>
    /** A natural follow-up an interviewer would ask next, or null when omitted. */
    followUpQuestion: string | null
    /**
     * Distinct content (lesson) ids the RAG grounding excerpt was retrieved
     * from, in similarity order — lets the FE deep-link "study this" straight
     * to the real lesson(s) the course excerpt came from. A single flat list
     * for the WHOLE session (retrieval is one top-K pass over the candidate's
     * combined answers, not scoped per phase). Empty when retrieval
     * missed/failed/index absent — the FE must render its "unmatched"
     * fallback in that case, never invent a link.
     */
    matchedContentIds: Array<string>
}

/** Params for {@link MockInterviewGradePromptService.build}. */
export interface BuildMockInterviewGradePromptParams {
    /** Snapshot title of what the candidate worked through this session (e.g. "Design a URL shortener"). */
    promptTitle: string
    /** Seniority level the session targets, scaling grading strictness; null when unknown. */
    level: string | null
    /** The full recorded transcript, one entry per conversational turn. */
    turns: Array<MockInterviewTurnRecord>
    /** RAG-retrieved excerpt of what the course actually taught, grounding the grading. */
    courseExcerpt: string
    /** Locale the feedback strings must be written in. */
    locale: Locale
}

/** Result of {@link MockInterviewGradePromptService.build}. */
export interface BuildMockInterviewGradePromptResult {
    /** Ordered system + human chat messages ready for {@link AiInvokeService.run}. */
    messages: Array<BaseMessage>
}
