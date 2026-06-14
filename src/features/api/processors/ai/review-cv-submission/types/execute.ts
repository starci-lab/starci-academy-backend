/** Result of the CV extraction step. */
export interface ReviewCvSubmissionExtractStepExecuteResult {
    /** The extracted text. */
    originalText: string
}

/** Result of the CV plan step (markdown plan before scoring). */
export interface ReviewCvSubmissionPlanStepExecuteResult {
    /** Markdown review plan for mentors / follow-up analyze step. */
    reviewPlan: string
}

/** Result of the CV analysis step (LLM output; DB write happens in the complete step). */
export interface ReviewCvSubmissionAnalyzeStepExecuteResult {
    /** Markdown feedback applied by the complete step (`detail_feedback` column). */
    detailFeedback: string
    /** Holistic score 0–100 from the model JSON `score` field; persisted on the attempt row. */
    score: number | null
}
