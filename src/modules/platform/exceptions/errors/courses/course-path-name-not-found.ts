import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Course index whose `{index}-*` folder name could not be resolved on the mount. */
export interface CoursePathNameNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
}

/**
 * No `{courseIndex}-*` course folder exists on the courses mount.
 */
export class CoursePathNameNotFoundException extends AbstractException {
    constructor(
        {
            courseIndex,
            originalError,
        }: CoursePathNameNotFoundExceptionMetadata,
    ) {
        super(
            `Course dir: no mount directory for index ${courseIndex}`,
            "COURSE_DIR_NAME_NOT_FOUND_EXCEPTION",
            {
                courseIndex,
                originalError,
            },
        )
    }
}
