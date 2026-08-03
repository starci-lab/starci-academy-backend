import {
    MilestoneSeverity,
} from "@modules/databases"

/**
 * Detailed feedback for a specific occurrence within a criteria.
 */
export interface ProjectFeedbackDetail {
    /** Impact level of the issue found */
    severity: MilestoneSeverity
    /** Brief explanation of the result or issue */
    message: string
    /** File path with line number (e.g., 'src/app.ts:10') or null if no issue */
    location: string | null
    /** Recommended fix for the issue or null if satisfied */
    suggestion: string | null
}

/**
 * Evaluation results grouped by a specific criteria ID.
 */
export interface ProjectCriteriaResult {
    /** List of individual feedback points for this criteria */
    feedbacks: Array<ProjectFeedbackDetail>
}

/**
 * Root interface representing the full project evaluation report.
 */
export interface ProjectEvaluation {
    /** Overall summary of the project performance */
    shortFeedback: string
    /** Final numerical score assigned to the project */
    score: number
    /** Detailed breakdown of results per criteria */
    details: Array<ProjectCriteriaResult>
}
