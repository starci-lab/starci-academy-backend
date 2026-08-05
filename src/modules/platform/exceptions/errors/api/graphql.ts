import type {
    AbstractExceptionMetadata 
} from "../abstract"
import {
    AbstractException 
} from "../abstract"

/** Thrown when GraphQL data not found */
export interface GraphQLDataNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    query: string
    variables: Record<string, unknown>
    url: string
}
/**
 * Upstream GraphQL returned no data for the query — callers must not treat an empty
 * payload as success.
 */
export class GraphQLDataNotFoundException extends AbstractException {
    constructor(
        { query, variables, url, originalError }: GraphQLDataNotFoundExceptionMetadata
    ) {
        super(
            "GraphQL data not found",
            "GRAPHQL_DATA_NOT_FOUND_EXCEPTION",
            {
                query,
                variables,
                url,
                originalError,
            }
        )
    }
}