import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a GraphQL Keycloak guard whose context carries no HTTP request. */
export type GraphQLContextMissingRequestExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown by {@link KeycloakAuthGraphQLGuard} / {@link KeycloakOptionalAuthGraphQLGuard}
 * when the Apollo context has no underlying `req` to read `Authorization` from.
 */
export class GraphQLContextMissingRequestException extends AbstractException {
    constructor({
        originalError,
    }: GraphQLContextMissingRequestExceptionMetadata) {
        super(
            "GraphQL context is missing HTTP request.",
            "GRAPHQL_CONTEXT_MISSING_REQUEST_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.UNAUTHORIZED,
        )
    }
}
