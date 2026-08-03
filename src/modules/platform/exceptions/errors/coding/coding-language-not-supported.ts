import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an unsupported coding language. */
export interface CodingLanguageNotSupportedExceptionMetadata extends AbstractExceptionMetadata {
    /** The language value that has no Judge0 id mapping. */
    language: string
}

/**
 * Thrown when a submission specifies a {@link CodingLanguage} that has no
 * Judge0 `language_id` configured in `envConfig().judge0.languageIds`.
 */
export class CodingLanguageNotSupportedException extends AbstractException {
    constructor({
        language,
        originalError,
    }: CodingLanguageNotSupportedExceptionMetadata) {
        super(
            `Coding language "${language}" is not supported / has no Judge0 mapping.`,
            "CODING_LANGUAGE_NOT_SUPPORTED_EXCEPTION",
            {
                language,
                originalError,
            },
        )
    }
}
