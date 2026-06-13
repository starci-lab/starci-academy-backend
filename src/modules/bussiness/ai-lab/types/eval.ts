import type {
    AiLabEvalRunEntity,
    AiLabRunParams,
    Locale,
} from "@modules/databases"
import type {
    ResolveGradingInvokeOptionsResult,
} from "@modules/ai"

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
