import type {
    BaseMessage,
} from "@langchain/core/messages"
import type {
    Locale,
    ModelProvider,
    MockInterviewMode,
    MockInterviewPhase,
} from "@modules/databases"

/**
 * Coarse pass/borderline/fail band assigned to a graded mock-interview
 * SESSION. Mirrors the shape of the flashcard-domain `InterviewVerdict` enum
 * but is intentionally a SEPARATE, decoupled type -- mock-interview grading
 * must not import from the flashcard domain.
 */
export enum MockInterviewVerdict {
    /** Session is solid for the requested level -- clear hire signal. */
    Pass = "pass",
    /** Session is partial -- some substance, notable gaps. */
    Borderline = "borderline",
    /** Session misses the point or is largely wrong for the requested level. */
    Fail = "fail",
}

/**
 * One turn of the recorded mock-interview transcript. `phase` stays typed as
 * the 5-value {@link MockInterviewPhase} GraphQL enum on the WIRE (the
 * request schema is unchanged by the mode split) even for a `mode="qna"`
 * session, where it carries NO semantic meaning --
 * {@link MockInterviewGradePromptService.build} ignores `phase` for
 * `mode="qna"` and groups turns by `questionIndex` instead (each question's
 * own cognitive frame comes from the session's `seedQuestions` snapshot, not
 * from any turn field).
 */
export interface MockInterviewTurnRecord {
    /** Who spoke this turn -- the AI interviewer or the candidate. */
    role: string
    /** Which of the 5 canonical phases this turn belongs to (wire shape unchanged; ignored for mode="qna"). */
    phase: MockInterviewPhase
    /** The turn's text content (candidate turns are speech-to-text transcribed). */
    content: string
    /** 0-based question index this turn belongs to (mode="qna" only, additive field); undefined for mode="design". */
    questionIndex?: number
}

/**
 * Per-phase score breakdown entry inside a graded session result. `phase` is
 * kept as a plain string (not the {@link MockInterviewPhase} enum) because it
 * is parsed straight out of the model's free-form JSON response and persisted
 * as-is into a jsonb column -- a garbled/unrecognized literal is filtered out
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
    /** Score 0-100 the model assigned to this attribute. */
    score: number
}

/**
 * One `mode="qna"` QUESTION's full review -- the anti-ChatGPT differentiator:
 * StarCi is the only place that can show the CANONICAL course answer next to
 * what the candidate actually said, because the flashcard seed carries an
 * author-written `answer` for the exact topic being asked (a generic tool has
 * no ground truth for what "correct" means in this course). Built by
 * {@link MockInterviewGradingService.buildQuestionReviews} from three
 * server-held sources -- never trusted from the client:
 * - the transcript's turns for this `questionIndex` (interviewer + candidate).
 * - the session's persisted `seedQuestions[index]` grounding (kind + the
 *   flashcard's authored `answer` as {@link modelAnswer}).
 * - the model's per-question `phaseScores[index]` (score/max) and the new
 *   `questionFeedback[index]` one-liner (see {@link MockInterviewGradePromptService.buildQna}).
 *
 * Empty for `mode="design"` -- a capstone system has no single seed flashcard
 * to source a model answer from, so there is nothing to review per-"question"
 * (the existing phase-bar breakdown already covers that flow).
 */
export interface MockInterviewQuestionReview {
    /** 0-based index of this question within the session (matches the transcript's `questionIndex` and `phaseScores[index]`). */
    questionIndex: number
    /** This question's cognitive frame ("theory" | "reasoning" | "scenario"), as drawn -- a {@link import("@modules/databases").MockInterviewKind} value. */
    kind: string
    /** The interviewer's question text for this question (joined from the transcript's `role: "interviewer"` turns at this index). */
    question: string
    /** The candidate's OWN answer for this question (joined from the transcript's `role: "candidate"` turns at this index). */
    candidateAnswer: string
    /** The seed flashcard's authored model answer (Markdown) -- the canonical, course-grounded correct answer; null when the seed card had none on file or no grounding resolved for this index (e.g. the card was deleted after the draw). */
    modelAnswer: string | null
    /** A one-line, model-generated summary of what the candidate's answer was missing relative to the reference -- see {@link MockInterviewGradePromptService.buildQna}'s new `questionFeedback` output; empty string when the model omitted it for this index. */
    feedback: string
    /** Score assigned to this question (mirrors `phaseScores[questionIndex].score`). */
    score: number
    /** Maximum possible score for this question (mirrors `phaseScores[questionIndex].max`, always 100 for qna). */
    max: number
    /** Best-effort single matched course content (lesson) id for this question, resolved from the session-wide RAG retrieval; null when no confident per-question match exists (the FE must not invent a link -- fall back to a generic "review the course" action). */
    matchedContentId: string | null
}

/**
 * One seed flashcard's grading ground-truth, index-aligned with the
 * transcript's `questionIndex` -- carries the QUESTION'S OWN randomly-assigned
 * {@link import("@modules/databases").MockInterviewKind}, since kind now
 * lives per-question rather than per-session ("mode split", 2026-07-06). The
 * `answer`/`keywords` reference is only MEANINGFUL when `kind === "theory"`
 * (a real model answer to check coverage against); reasoning/scenario
 * questions still carry a grounding entry (so the grader knows their kind)
 * but their `answer`/`keywords` are ignored by the open rubric. Fetched by
 * the grading service from the session's persisted `seedQuestions`, never
 * trusted from the client.
 */
export interface MockInterviewSeedGrounding {
    /** The seed `flashcard_cards.id`. */
    cardId: string
    /** This ONE question's cognitive frame ("theory" | "reasoning" | "scenario"), as drawn. */
    kind: string
    /** The seed's (localized) question -- what the interviewer's question was framed around. */
    question: string
    /** The seed's authored model answer (Markdown, may be null) -- the grading reference for ANY kind when it's an interview-bank question. */
    answer: string | null
    /** Keywords parsed out of the answer's trailing `:::chip` block -- coverage checklist. */
    keywords: Array<string>
    /** Authored rubric points (the reasoning that earns credit) -- present for interview-bank questions; used as the grading anchor for every kind. */
    rubric?: Array<string>
    /**
     * Authored coverage checkpoints, index-aligned with what the grader is asked to report
     * back as covered. Present once a question's content carries `# checklist`; the score
     * is then the sum of the covered `scoreBand`s rather than a number the model picks,
     * so the same answer always earns the same score and the total is explainable
     * ("missing checkpoint 2 cost 16"). Absent for questions still on `rubric` alone.
     */
    checkpoints?: Array<{
        /** The checkpoint statement. */
        text: string
        /** technical | problemSolving | communication | testing. */
        dimension: string | null
        /** Missing this should sink the answer rather than cost partial credit. */
        critical: boolean
        /** Points this checkpoint is worth; a question's bands sum to 100. */
        scoreBand: number
    }>
    /**
     * The GIVEN (possibly buggy) code the candidate was asked to FIX/read
     * (interview-bank `debug`/`review`/`optimize`) -- the baseline the grader
     * diffs the candidate's own `[Code lang=...]` workspace artifact against, so
     * the FIX is scored (not just the final code). Null for questions with no
     * given code.
     */
    givenCode?: string | null
    /** Language of {@link givenCode} (e.g. "typescript"). Null when no given code. */
    givenLang?: string | null
}

/** Params for {@link MockInterviewGradingService.grade}. */
export interface GradeMockInterviewSessionParams {
    /** Id of the user whose AI lane gates the grading invoke and who owns the persisted attempt. */
    userId: string
    /** Course the session belongs to -- scopes both RAG retrieval and the resolved enrollment. */
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
    /** Integer 0-100 overall score for the whole session. */
    overallScore: number
    /** Coarse pass/borderline/fail band. */
    verdict: MockInterviewVerdict
    /** Per-phase score breakdown, one entry per phase the model chose to score. */
    phaseScores: Array<MockInterviewPhaseScore>
    /** Per-attribute score breakdown (communication, structured thinking, ...). */
    attributeScores: Array<MockInterviewAttributeScore>
    /** Concrete things the candidate got right across the session. */
    strengths: Array<string>
    /** Concrete things missing or wrong, framed as what to add. */
    gaps: Array<string>
    /** A natural follow-up an interviewer would ask next, or null when omitted. */
    followUpQuestion: string | null
    /**
     * Distinct content (lesson) ids the RAG grounding excerpt was retrieved
     * from, in similarity order -- lets the FE deep-link "study this" straight
     * to the real lesson(s) the course excerpt came from. A single flat list
     * for the WHOLE session (retrieval is one top-K pass over the candidate's
     * combined answers, not scoped per phase). Empty when retrieval
     * missed/failed/index absent -- the FE must render its "unmatched"
     * fallback in that case, never invent a link.
     */
    matchedContentIds: Array<string>
    /**
     * Per-question model-answer review -- one entry per `mode="qna"` question
     * (see {@link MockInterviewQuestionReview}). ALWAYS empty for
     * `mode="design"` (a capstone system has no single seed flashcard to
     * source a model answer from).
     */
    questionReviews: Array<MockInterviewQuestionReview>
}

/** Params for {@link MockInterviewGradePromptService.build}. */
export interface BuildMockInterviewGradePromptParams {
    /** Snapshot title of what the candidate worked through this session (e.g. "Design a URL shortener"). */
    promptTitle: string
    /**
     * The TOP-LEVEL flow this session ran in -- branches the ENTIRE grading
     * prompt between the existing 5-phase design rubric and the new
     * per-question Q&A rubric (each question's OWN kind then drives whether
     * it's graded as coverage-against-reference or an open rubric -- see
     * {@link seedGroundings}).
     */
    mode: MockInterviewMode
    /** Seniority level the session targets, scaling grading strictness; null when unknown. */
    level: string | null
    /** The full recorded transcript, one entry per conversational turn. */
    turns: Array<MockInterviewTurnRecord>
    /** RAG-retrieved excerpt of what the course actually taught, grounding the grading. */
    courseExcerpt: string
    /**
     * Per-question ground-truth for `mode="qna"` -- one entry per drawn seed,
     * in question order (index-aligned with the transcript's
     * `questionIndex`), EACH carrying its own kind so the grader can pick the
     * right rubric per-question (coverage for "theory", open rubric for
     * "reasoning"/"scenario"). Empty for `mode="design"` (it has no seed
     * questions -- see {@link MockInterviewSeedGrounding}'s doc).
     */
    seedGroundings: Array<MockInterviewSeedGrounding>
    /** Locale the feedback strings must be written in. */
    locale: Locale
}

/** Result of {@link MockInterviewGradePromptService.build}. */
export interface BuildMockInterviewGradePromptResult {
    /** Ordered system + human chat messages ready for {@link AiInvokeService.run}. */
    messages: Array<BaseMessage>
}
