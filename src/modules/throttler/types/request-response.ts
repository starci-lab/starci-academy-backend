/**
 * The request/response pair resolved by the throttler guard across transports
 * (REST HTTP and GraphQL), used to read headers and set rate-limit headers.
 */
export interface ThrottlerRequestResponse {
    /** The incoming request record for the active transport. */
    req: Record<string, any>
    /** The outgoing response record for the active transport. */
    res: Record<string, any>
}

/**
 * The shape of the GraphQL execution context the throttler guard reads its
 * req/res pair from (GraphQL keeps these on the gql context, not the host).
 */
export interface GraphQLRequestResponseContext {
    /** The incoming request record carried on the GraphQL context. */
    req: Record<string, any>
    /** The outgoing response record carried on the GraphQL context. */
    res: Record<string, any>
}
