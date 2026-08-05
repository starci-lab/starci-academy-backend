import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Thrown by a lesson-mock upload endpoint when the required multipart field was not sent. */
export interface MockFileRequiredExceptionMetadata extends AbstractExceptionMetadata {
    /** Name of the expected multipart field (e.g. "file", "files"). */
    fieldName?: string
}

/**
 * Thrown by the file-upload lesson mocks (multer, chunked, tus, DASH/media
 * tools) when the required multipart file field was not sent.
 */
export class MockFileRequiredException extends AbstractException {
    constructor(
        {
            fieldName,
            originalError,
        }: MockFileRequiredExceptionMetadata,
    ) {
        super(
            "No file uploaded.",
            "MOCK_FILE_REQUIRED_EXCEPTION",
            {
                fieldName,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}

/** Thrown when a lesson-mock upload exceeds its per-object/session byte cap. */
export interface MockFileTooLargeExceptionMetadata extends AbstractExceptionMetadata {
    /** What exceeded the cap (object / chunk session / tus upload / …). */
    reason: string
    /** The byte cap that was exceeded. */
    maxBytes: number
}

/**
 * Thrown by the file-upload lesson mocks (multer, presigned-URL store,
 * chunked-upload, tus) when an upload's byte size exceeds its configured cap.
 */
export class MockFileTooLargeException extends AbstractException {
    constructor(
        {
            reason,
            maxBytes,
            originalError,
        }: MockFileTooLargeExceptionMetadata,
    ) {
        super(
            "Uploaded file exceeds the byte cap for this lesson mock.",
            "MOCK_FILE_TOO_LARGE_EXCEPTION",
            {
                reason,
                maxBytes,
                originalError,
            },
            HttpStatus.PAYLOAD_TOO_LARGE,
        )
    }
}

/** Thrown when a lesson-mock upload request fails a validation check. */
export interface MockInvalidUploadRequestExceptionMetadata extends AbstractExceptionMetadata {
    /** Which check failed (missing/invalid header, bad chunk index, incomplete session, …). */
    reason: string
}

/**
 * Thrown by the tus and chunked-upload lesson mocks when a request violates
 * the upload protocol (missing/invalid header, out-of-range chunk index,
 * finalizing before every chunk arrived, appending past the declared length).
 */
export class MockInvalidUploadRequestException extends AbstractException {
    constructor(
        {
            reason,
            originalError,
        }: MockInvalidUploadRequestExceptionMetadata,
    ) {
        super(
            "Invalid upload request.",
            "MOCK_INVALID_UPLOAD_REQUEST_EXCEPTION",
            {
                reason,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}

/** Thrown when a tus PATCH's `Upload-Offset` does not match the server's current offset. */
export interface MockUploadOffsetConflictExceptionMetadata extends AbstractExceptionMetadata {
    reason: string
}

/**
 * Thrown by the tus lesson mock when a PATCH's declared offset does not match
 * the bytes already received — the tus protocol's resumability contract.
 */
export class MockUploadOffsetConflictException extends AbstractException {
    constructor(
        {
            reason,
            originalError,
        }: MockUploadOffsetConflictExceptionMetadata,
    ) {
        super(
            "Upload offset conflict.",
            "MOCK_UPLOAD_OFFSET_CONFLICT_EXCEPTION",
            {
                reason,
                originalError,
            },
            HttpStatus.CONFLICT,
        )
    }
}

/** Thrown when a lesson-mock in-memory resource (object/upload/session) is not found. */
export interface MockResourceNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    reason: string
}

/**
 * Thrown by the file-upload lesson mocks when a stored object, tus upload, or
 * chunked-upload session id does not resolve to anything in the in-memory store.
 */
export class MockResourceNotFoundException extends AbstractException {
    constructor(
        {
            reason,
            originalError,
        }: MockResourceNotFoundExceptionMetadata,
    ) {
        super(
            "Mock resource not found.",
            "MOCK_RESOURCE_NOT_FOUND_EXCEPTION",
            {
                reason,
                originalError,
            },
            HttpStatus.NOT_FOUND,
        )
    }
}
