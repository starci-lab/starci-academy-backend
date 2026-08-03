import type {
    Request
} from "express"

/**
 * Shape of the GraphQL execution context exposing the optional underlying
 * Express request. The `req` is optional because non-HTTP transports (e.g.
 * subscriptions) may not carry one.
 */
export interface GraphQLOptionalContextRequest {
    /** The underlying Express request, when the transport provides one. */
    req?: Request
}
