import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** MinIO read returned no bytes for the CV object key. */
export interface CvSubmissionExtractS3BufferEmptyExceptionMetadata extends AbstractExceptionMetadata {
    /** Object key passed to `S3ReadService.buffer`. */
    key: string
    /** Storage provider label (e.g. `minio`). */
    provider: string
}

/** Aborts CV extract when MinIO returned zero bytes — parsing would invent empty text. */
export class CvSubmissionExtractS3BufferEmptyException extends AbstractException {
    constructor({
        key,
        provider,
        originalError,
    }: CvSubmissionExtractS3BufferEmptyExceptionMetadata) {
        super(
            `CV extract: empty buffer for key "${key}" (${provider}).`,
            "CV_SUBMISSION_EXTRACT_S3_BUFFER_EMPTY_EXCEPTION",
            {
                key,
                provider,
                originalError,
            },
        )
    }
}

/** File extension is not PDF or DOCX. */
export interface CvSubmissionExtractUnsupportedExtensionExceptionMetadata extends AbstractExceptionMetadata {
    /** Lowercased extension from the key, if any. */
    extension: string | undefined
}

/** Rejects CV extract for non-PDF/DOCX keys — other types have no parser in this pipeline. */
export class CvSubmissionExtractUnsupportedExtensionException extends AbstractException {
    constructor({
        extension,
        originalError,
    }: CvSubmissionExtractUnsupportedExtensionExceptionMetadata) {
        super(
            `CV extract: unsupported extension "${extension ?? ""}" (allowed: pdf, docx).`,
            "CV_SUBMISSION_EXTRACT_UNSUPPORTED_EXTENSION_EXCEPTION",
            {
                extension,
                originalError,
            },
        )
    }
}

/** Parsed document produced no non-whitespace text. */
export interface CvSubmissionExtractEmptyTextExceptionMetadata extends AbstractExceptionMetadata {
    /** Object key that was extracted. */
    key: string
}

/**
 * Aborts CV extract when parsing yielded only whitespace — downstream plan/analyze needs
 * real text.
 */
export class CvSubmissionExtractEmptyTextException extends AbstractException {
    constructor({
        key,
        originalError,
    }: CvSubmissionExtractEmptyTextExceptionMetadata) {
        super(
            `CV extract: no text content after parsing (key "${key}").`,
            "CV_SUBMISSION_EXTRACT_EMPTY_TEXT_EXCEPTION",
            {
                key,
                originalError,
            },
        )
    }
}

/** `cdnKey` has no file segment after the last `/` (cannot form destination key for copy). */
export interface CvSubmissionExtractEmptyFileNameExceptionMetadata extends AbstractExceptionMetadata {
    /** Submission object key. */
    key: string
}

/**
 * Aborts CV complete when the CDN key has no file segment — copy destination cannot be
 * formed.
 */
export class CvSubmissionExtractEmptyFileNameException extends AbstractException {
    constructor({
        key,
        originalError,
    }: CvSubmissionExtractEmptyFileNameExceptionMetadata) {
        super(
            `CV complete: cannot derive file name from cdn key "${key}".`,
            "CV_SUBMISSION_EXTRACT_EMPTY_FILE_NAME_EXCEPTION",
            {
                key,
                originalError,
            },
        )
    }
}
