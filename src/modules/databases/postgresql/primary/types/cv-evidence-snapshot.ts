/** One authoritative passed-capstone fact frozen into a CV generation run. */
export interface CvSelectedCapstoneEvidence {
    milestoneTaskAttemptId: string
    milestoneTaskId: string
    milestoneId: string
    courseId: string
    taskTitle: string
    milestoneTitle: string
    courseTitle: string
    score: number
    passedAt: string
}

/** Immutable, request-ordered evidence persisted with one CV run. */
export type CvEvidenceSnapshot = Array<CvSelectedCapstoneEvidence>
