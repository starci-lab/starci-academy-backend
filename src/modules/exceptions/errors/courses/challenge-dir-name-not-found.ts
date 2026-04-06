import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ChallengeDirNameNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    moduleIndex: number
    challengeIndex: number
}

/**
 * No `{challengeIndex}-*` (or legacy numeric) folder under the module `challenges/` directory.
 */
export class ChallengeDirNameNotFoundException extends AbstractException {
    constructor(
        {
            courseIndex,
            moduleIndex,
            challengeIndex,
            originalError,
        }: ChallengeDirNameNotFoundExceptionMetadata,
    ) {
        super(
            `Challenge dir: no mount directory for index ${challengeIndex} (course ${courseIndex}, module ${moduleIndex})`,
            "CHALLENGE_DIR_NAME_NOT_FOUND_EXCEPTION",
            {
                courseIndex,
                moduleIndex,
                challengeIndex,
                originalError,
            },
        )
    }
}
