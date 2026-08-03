import {
    SubmissionFeedbackSeverity,
} from "@modules/databases"

/**
 * Detailed feedback for a specific occurrence within a requirement.
 */
export interface ChallengeFeedbackDetail {
    /** Impact level of the issue found */
    severity: SubmissionFeedbackSeverity
    /** Brief explanation of the result or issue */
    message: string
    /** File path with line number (e.g., 'src/app.ts:10') or null if no issue */
    location: string | null
    /** Recommended fix for the issue or null if satisfied */
    suggestion: string | null
}

/**
 * Evaluation results grouped by a specific criteria (requirement) ID.
 */
export interface ChallengeRequirementResult {
    /** Unique identifier (UUID) for the requirement */
    criteriaId: string
    /** List of individual feedback points for this requirement */
    feedbacks: Array<ChallengeFeedbackDetail>
}

/**
 * Root interface representing the full challenge evaluation report.
 */
export interface ChallengeEvaluation {
    /** Overall summary of the challenge performance */
    shortFeedback: string
    /** Final numerical score assigned to the challenge */
    score: number
    /** Detailed breakdown of results per requirement */
    details: Array<ChallengeRequirementResult>
}
