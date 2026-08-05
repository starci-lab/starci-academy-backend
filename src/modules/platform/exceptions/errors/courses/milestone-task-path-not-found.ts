import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Milestone-task index whose mount path was missing. */
export interface MilestoneTaskPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    taskIndex: number
}

/**
 * No milestone-task path is available in the resolved `paths` list for the given index.
 */
export class MilestoneTaskPathNotFoundException extends AbstractException {
    constructor(
        {
            taskIndex,
            originalError,
        }: MilestoneTaskPathNotFoundExceptionMetadata,
    ) {
        super(
            `Milestone task path not found for index ${taskIndex}`,
            "MILESTONE_TASK_PATH_NOT_FOUND_EXCEPTION",
            {
                taskIndex,
                originalError,
            },
        )
    }
}
