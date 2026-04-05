import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface LessonVideoSeedDataInvalidExceptionMetadata extends AbstractExceptionMetadata {
    /** Absolute base path to the lesson video folder. */
    path: string
    /** Which field failed validation. */
    field: "url" | "durationMs"
}

/**
 * Lesson video `data.json` is missing or has invalid `url` / `durationMs`.
 */
export class LessonVideoSeedDataInvalidException extends AbstractException {
    constructor(
        {
            path,
            field,
            originalError,
        }: LessonVideoSeedDataInvalidExceptionMetadata,
    ) {
        const detail = field === "url"
            ? "missing non-empty \"url\""
            : "missing numeric \"durationMs\""
        super(
            `Lesson video seed: data.json ${detail}: ${path}/data.json`,
            "LESSON_VIDEO_SEED_DATA_INVALID_EXCEPTION",
            {
                path,
                field,
                originalError,
            },
        )
    }
}
