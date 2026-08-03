import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface MilestoneNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
}

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
