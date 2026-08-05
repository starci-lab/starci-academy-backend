import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Milestone id that matched no row. */
export interface MilestoneNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
}

/** Fails personal-project progress when the milestone does not exist. */
export class MilestoneNotFoundException extends AbstractException {
    constructor({
        id,
        originalError,
    }: MilestoneNotFoundExceptionMetadata) {
        super(
            "Milestone not found",
            "MILESTONE_NOT_FOUND_EXCEPTION",
            {
                id,
                originalError,
            },
        )
    }
}
