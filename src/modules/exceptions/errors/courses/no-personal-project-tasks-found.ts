import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when no personal project tasks are found for the enrollment. */
export interface NoPersonalProjectTasksFoundExceptionMetadata extends AbstractExceptionMetadata {
    courseId?: string
    userId?: string
}

/** Thrown when no milestone tasks exist for the given enrollment. */
export class NoPersonalProjectTasksFoundException extends AbstractException {
    constructor({
        courseId,
        userId,
        originalError,
    }: NoPersonalProjectTasksFoundExceptionMetadata) {
        super(
            "No personal project tasks found",
            "NO_PERSONAL_PROJECT_TASKS_FOUND_EXCEPTION",
            {
                courseId,
                userId,
                originalError,
            },
        )
    }
}
