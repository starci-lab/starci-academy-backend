import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link MilestoneTaskFKConstraintException}. */
export interface MilestoneTaskFKConstraintExceptionMetadata extends AbstractExceptionMetadata {
    /** Task row id from the seed payload. */
    milestoneTaskId?: string
    /** Milestone id when partially present on the payload. */
    milestoneId?: string
}

/**
 * Thrown when a milestone task seed row cannot be upserted because the parent milestone FK is missing.
 */
export class MilestoneTaskFKConstraintException extends AbstractException {
    constructor({
        milestoneTaskId,
        milestoneId,
        originalError,
    }: MilestoneTaskFKConstraintExceptionMetadata) {
        super(
            "Milestone task seed is missing milestone FK (milestone.id or milestoneId)",
            "MILESTONE_TASK_FK_CONSTRAINT_EXCEPTION",
            {
                milestoneTaskId,
                milestoneId,
                originalError,
            },
        )
    }
}
