import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Course index with no matching `{courseIndex}-*` folder on the mount. */
export interface ChallengeSeedCourseDirNameNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
}

/**
 * No `{courseIndex}-*` course folder exists on the courses mount.
 */
export class ChallengeSeedCourseDirNameNotFoundException extends AbstractException {
    constructor(
        {
            courseIndex,
            originalError,
        }: ChallengeSeedCourseDirNameNotFoundExceptionMetadata,
    ) {
        super(
            `Challenge seed: no course mount directory for index ${courseIndex}`,
            "CHALLENGE_SEED_COURSE_DIR_NAME_NOT_FOUND_EXCEPTION",
            {
                courseIndex,
                originalError,
            },
        )
    }
}
