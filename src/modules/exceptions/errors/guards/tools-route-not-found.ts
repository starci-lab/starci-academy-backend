import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a tools route hit outside its allowed (non-production) environment. */
export type ToolsRouteNotFoundExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown by {@link LocalOnlyGuard} in production — every guarded tools route
 * answers 404 so it is indistinguishable from a route that does not exist.
 */
export class ToolsRouteNotFoundException extends AbstractException {
    constructor({
        originalError,
    }: ToolsRouteNotFoundExceptionMetadata) {
        super(
            "Not found.",
            "TOOLS_ROUTE_NOT_FOUND_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.NOT_FOUND,
        )
    }
}
