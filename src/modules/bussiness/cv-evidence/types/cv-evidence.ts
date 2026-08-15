import type {
    CvEvidenceSnapshot,
} from "@modules/databases/postgresql/primary/types/cv-evidence-snapshot"

/** Identifies the learner whose passed capstone evidence may be selected. */
export interface ListPickableCvEvidenceParams {
    userId: string
}

/** Identifies the learner and milestone attempts selected for a CV snapshot. */
export interface ResolveSelectedCvEvidenceParams {
    userId: string
    milestoneTaskAttemptIds: Array<string>
}

/** Explains why a requested milestone attempt cannot enter the CV snapshot. */
export enum CvEvidenceInvalidReason {
    /** Reject a repeated milestone attempt so the snapshot remains unique. */
    Duplicate = "duplicate",
    /** Reject an attempt that did not pass its milestone requirement. */
    Failed = "failed",
    /** Reject an attempt owned by a different learner. */
    Foreign = "foreign",
    /** Reject an identifier that does not resolve to an attempt. */
    Missing = "missing",
}

/** Pairs a rejected milestone attempt with its validation consequence. */
export interface CvEvidenceInvalidItem {
    milestoneTaskAttemptId: string
    reason: CvEvidenceInvalidReason
}

/** Returns the immutable evidence snapshot accepted for a CV run. */
export interface ResolveSelectedCvEvidenceResult {
    snapshot: CvEvidenceSnapshot
}
