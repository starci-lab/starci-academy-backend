/**
 * The request/response pair resolved by the throttler guard across transports
 * (REST HTTP and GraphQL), used to read headers and set rate-limit headers.
 */
export interface ThrottlerRequestResult {
    /** The incoming request record for the active transport. */
    req: Record<string, unknown>
    /** The outgoing response record for the active transport. */
    res: Record<string, unknown>
}

/**
 * The shape of the GraphQL execution context the throttler guard reads its
 * req/res pair from (GraphQL keeps these on the gql context, not the host).
 */
export interface GraphQLRequestResponseContext {
    /** The incoming request record carried on the GraphQL context. */
    req: Record<string, unknown>
    /** The outgoing response record carried on the GraphQL context. */
    res: Record<string, unknown>
}

/**
 * Minimal request shape {@link ThrottlerBehindProxyGuard.getTracker} reads to
 * key the rate limit by real client IP.
 */
export interface ThrottlerTrackedParams {
    /** Direct socket IP. */
    ip?: string
    /** Proxied IP chain (first hop = real client) when behind a reverse proxy. */
    ips?: Array<string>
    /** Request headers used only to isolate trusted local UAT origins in non-production. */
    headers?: Record<string, string | ReadonlyArray<string> | undefined>
}
