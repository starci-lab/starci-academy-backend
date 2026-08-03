import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface MilestonePathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    milestoneIndex: number
}

/**
 * No milestone path is available in the resolved `paths` list for the given index.
 */
export class MilestonePathNotFoundException extends AbstractException {
    constructor(
        {
            milestoneIndex,
            originalError,
        }: MilestonePathNotFoundExceptionMetadata,
    ) {
        super(
            `Milestone path not found for index ${milestoneIndex}`,
            "MILESTONE_PATH_NOT_FOUND_EXCEPTION",
            {
                milestoneIndex,
                originalError,
            },
        )
    }
}
