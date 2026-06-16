import type {
    AiLabEvalRunEntity,
    AiLabRunParams,
    Locale,
} from "@modules/databases"
import type {
    ResolveGradingInvokeOptionsResult,
} from "@modules/ai"
import type {
    MetricOutcome,
} from "./metric"

/**
 * Parsed result of the LLM judge's `{ score, feedback }` JSON response, with the
 * score already clamped into [0, 1] and feedback failing safe to an empty string.
 */
export interface ParseJudgeResult {
    /** Judge score clamped into the inclusive range [0, 1]. */
    score: number
    /** Human-readable feedback from the judge; empty string on a malformed response. */
    feedback: string
}

/** Params for {@link buildJudgePrompt}. */
export interface BuildJudgePromptParams {
    /** Eval-set rubric describing what a good answer must contain. */
    rubric: string
    /** The case input the candidate output was produced for. */
    input: string
    /** The candidate model output to score. */
    actualOutput: string
    /** Locale to write the feedback in. */
    locale: Locale
}

/** Result of {@link buildJudgePrompt}: the system + user prompt pair for the judge invoke. */
export interface BuildJudgePromptResult {
    /** System prompt establishing the judge's strict-JSON grading contract. */
    system: string
    /** User prompt carrying the fenced rubric, input, and candidate output. */
    user: string
}

/** Per-case grading result produced by {@link AiLabEvalService.gradeEvalSet}. */
export interface EvalCaseGradeResult {
    /** Eval case id this result is for. */
    evalCaseId: string
    /** Execution order of the case within the set. */
    orderIndex: number
    /** Raw model output produced for the case. */
    actualOutput: string
    /** Normalized metric score in [0, 1] for the case. */
    metricScore: number
    /** LLM-judge score in [0, 1] when the case used the judge metric; null otherwise. */
    judgeScore: number | null
    /** Whether the case passed. */
    passed: boolean
    /** Whether a citation was detected (RAG cases); null when not required. */
    citationPresent: boolean | null
    /** Human-readable feedback for the case. */
    feedback: string
    /** Weight applied to the case in the aggregate. */
    weight: number
}

/**
 * Result of scoring one eval case with its metric (or the LLM judge): the metric
 * outcome plus the optional judge score and the human-readable feedback.
 */
export interface EvaluateMetricResult {
    /** The metric outcome (normalized score + pass/fail). */
    outcome: MetricOutcome
    /** LLM-judge score in [0, 1] when the judge metric ran; null otherwise. */
    judgeScore: number | null
    /** Human-readable feedback for the case. */
    feedback: string
}

/** Params for {@link AiLabEvalService.gradeEvalSet}. */
export interface GradeEvalSetParams {
    /** Eval set to grade against. */
    evalSetId: string
    /** Submitted system prompt (null when none). */
    submittedSystemPrompt: string | null
    /** Submitted user template containing the `{{input}}` placeholder. */
    userTemplate: string
    /** Sampling / generation parameters submitted for grading. */
    params: AiLabRunParams
    /** Invoke options resolved from the submitter's entitlement + selection. */
    invokeOptions: ResolveGradingInvokeOptionsResult
    /** Locale the submission was made under. */
    locale: Locale
}

/** Params for {@link AiLabEvalService.getEvalResult}. */
export interface GetEvalResultParams {
    /** Eval run id to load the verdict for. */
    evalRunId: string
    /** Owner the eval run must belong to (authorization scope). */
    userId: string
}

/** Result of {@link AiLabEvalService.getEvalResult}. */
export interface GetEvalResultResult {
    /** The eval run with its per-case results, or null when absent / not owned. */
    evalRun: AiLabEvalRunEntity | null
}

/** Result of {@link AiLabEvalService.gradeEvalSet}. */
export interface GradeEvalSetResult {
    /** Total weighted score earned across all cases. */
    totalScore: number
    /** Maximum weighted score attainable across all cases. */
    maxScore: number
    /** Whether the weighted score met the eval set's pass threshold. */
    passed: boolean
    /** Per-case grading results, in execution order. */
    caseResults: Array<EvalCaseGradeResult>
}
