import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Course index whose path was missing from the resolved `paths` list. */
export interface CoursePathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
}

/**
 * No course path is available in the resolved `paths` list for the given index.
 */
export class CoursePathNotFoundException extends AbstractException {
    constructor(
        {
            courseIndex,
            originalError,
        }: CoursePathNotFoundExceptionMetadata,
    ) {
        super(
            `Course path not found for index ${courseIndex}`,
            "COURSE_PATH_NOT_FOUND_EXCEPTION",
            {
                courseIndex,
                originalError,
            },
        )
    }
}
