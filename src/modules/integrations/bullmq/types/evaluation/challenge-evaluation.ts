import {
    SubmissionFeedbackSeverity,
} from "@modules/databases/postgresql/primary/enums/submission-feedback-severity"

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
    /** Advisory yes/no answer. The platform recomputes score from this value and the frozen rubric. */
    met?: boolean
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
    /** Deterministic evidence-completeness confidence computed by the platform. */
    confidence?: number
}
