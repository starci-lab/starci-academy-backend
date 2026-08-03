import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ChallengeSeedModuleDirNameNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    moduleIndex: number
}

/**
 * No `{moduleIndex}-*` module folder exists under the resolved course `modules/` directory.
 */
export class ChallengeSeedModuleDirNameNotFoundException extends AbstractException {
    constructor(
        {
            moduleIndex,
            originalError,
        }: ChallengeSeedModuleDirNameNotFoundExceptionMetadata,
    ) {
        super(
            `Challenge seed: no module mount directory for index ${moduleIndex}`,
            "CHALLENGE_SEED_MODULE_DIR_NAME_NOT_FOUND_EXCEPTION",
            {
                moduleIndex,
                originalError,
            },
        )
    }
}
