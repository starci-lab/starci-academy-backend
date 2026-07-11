import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link PlaygroundPathNotFoundException}. */
export interface PlaygroundPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Zero-based playground index that could not be resolved on the mount. */
    playgroundIndex: number
}

/**
 * No playground path is available in the resolved `paths` list for the given index.
 */
export class PlaygroundPathNotFoundException extends AbstractException {
    constructor(
        {
            playgroundIndex,
            originalError,
        }: PlaygroundPathNotFoundExceptionMetadata,
    ) {
        super(
            `Playground path not found for index ${playgroundIndex}`,
            "PLAYGROUND_PATH_NOT_FOUND_EXCEPTION",
            {
                playgroundIndex,
                originalError,
            },
        )
    }
}
