import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a `NextJsQueryService.get` call against an unregistered base URL. */
export interface NextJsQueryPageNotRegisteredExceptionMetadata extends AbstractExceptionMetadata {
    /** The base URL that has no registered page. */
    baseUrl: string
}

/**
 * Thrown when {@link NextJsQueryService.get} is called for a `baseUrl` that
 * was never registered via {@link NextJsQueryService.addPage}.
 */
export class NextJsQueryPageNotRegisteredException extends AbstractException {
    constructor({
        baseUrl,
        originalError,
    }: NextJsQueryPageNotRegisteredExceptionMetadata) {
        super(
            "No page registered for this base URL — call addPage first.",
            "NEXTJS_QUERY_PAGE_NOT_REGISTERED_EXCEPTION",
            {
                baseUrl,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
