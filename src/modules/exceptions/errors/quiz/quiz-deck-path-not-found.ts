import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link QuizDeckPathNotFoundException}. */
export interface QuizDeckPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Zero-based deck index that could not be resolved on the mount. */
    quizDeckIndex: number
}

/**
 * No quiz-deck path is available in the resolved `paths` list for the given index.
 */
export class QuizDeckPathNotFoundException extends AbstractException {
    constructor(
        {
            quizDeckIndex,
            originalError,
        }: QuizDeckPathNotFoundExceptionMetadata,
    ) {
        super(
            `Quiz deck path not found for index ${quizDeckIndex}`,
            "QUIZ_DECK_PATH_NOT_FOUND_EXCEPTION",
            {
                quizDeckIndex,
                originalError,
            },
        )
    }
}
